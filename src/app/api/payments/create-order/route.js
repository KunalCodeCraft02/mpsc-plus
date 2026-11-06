import { connectDb, Course, Enrollment, Payment } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";
import {
  createRazorpayOrder,
  fetchRazorpayOrderPayments,
  getRazorpayEnv,
  MIN_RAZORPAY_AMOUNT_PAISE,
} from "@/server/razorpay";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const user = await requireAuth(request);
  const { courseId } = await body(request);
  const id = Number(courseId);
  if (!Number.isFinite(id)) return fail(400, "Invalid course id");

  await connectDb();
  const course = await Course.findById(id).lean();
  if (!course || !course.published) return fail(404, "Course not found");
  if (course.isFree) return fail(400, "This course is free and does not require payment");

  const price = Number(course.price || 0);
  if (!Number.isFinite(price) || price <= 0 || Math.round(price * 100) < MIN_RAZORPAY_AMOUNT_PAISE) {
    return fail(400, "Course price must be at least 100 paise");
  }

  const existingEnrollment = await Enrollment.findOne({ userId: user.id, courseId: id }).lean();
  if (existingEnrollment) {
    return ok({ alreadyPurchased: true, courseId: id, status: "purchased" });
  }

  const existingPending = await Payment.findOne({
    userId: user.id,
    courseId: id,
    status: { $in: ["created", "pending", "authorized", "captured"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (existingPending && existingPending.razorpayOrderId) {
    // A previous attempt may have actually completed on Razorpay's side even
    // though our own record never got updated (e.g. the native SDK callback
    // was dropped before it could reach the verify endpoint). Reusing that
    // order id would reopen an already-paid order, which Razorpay Checkout
    // refuses with a generic "Something went wrong" screen. Reconcile first.
    let orderPayments = [];
    try {
      orderPayments = await fetchRazorpayOrderPayments(existingPending.razorpayOrderId);
    } catch {
      orderPayments = [];
    }
    const capturedPayment = orderPayments.find((p) => p.status === "captured");

    if (capturedPayment) {
      const paidAmount = Number(capturedPayment.amount || 0) / 100;
      if (paidAmount === price) {
        await Payment.findByIdAndUpdate(existingPending._id, {
          $set: {
            razorpayPaymentId: capturedPayment.id,
            status: "captured",
            updatedAt: new Date(),
          },
        });
        const existingAfter = await Enrollment.findOne({ userId: user.id, courseId: id }).lean();
        if (!existingAfter) {
          try {
            await Enrollment.create({ userId: user.id, courseId: id, progressPercent: 0 });
          } catch (error) {
            if (error?.code !== 11000 && error?.code !== 11001) throw error;
          }
        }
        return ok({ alreadyPurchased: true, courseId: id, status: "purchased" });
      }
    }

    // Never reopen an order with no captured payment. Razorpay can retain a
    // client-side checkout session for that order after a cancelled or
    // interrupted attempt, which makes the next checkout appear stuck.
    await Payment.findByIdAndUpdate(existingPending._id, {
      $set: { status: "failed", updatedAt: new Date() },
    });
  }

  const order = await createRazorpayOrder({
    amount: price,
    currency: course.currency || "INR",
    receipt: `course_${course.id}_${user.id}_${Date.now()}`,
    notes: {
      userId: String(user.id),
      courseId: String(course.id),
      courseTitle: String(course.title || "Course"),
    },
  });

  await Payment.create({
    userId: user.id,
    courseId: id,
    amount: price,
    currency: course.currency || "INR",
    razorpayOrderId: order.id,
    status: "created",
    notes: {
      userId: String(user.id),
      courseId: String(course.id),
      receipt: String(order.receipt || ""),
    },
  });

  return ok({
    orderId: order.id,
    keyId: getRazorpayEnv().keyId,
    amount: order.amount,
    currency: order.currency,
    courseId: id,
    alreadyPurchased: false,
  });
});
