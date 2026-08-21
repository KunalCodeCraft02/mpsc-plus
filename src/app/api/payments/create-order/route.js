import { connectDb, Course, Enrollment, Payment } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { createRazorpayOrder, getRazorpayEnv } from "@/server/razorpay";

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
  if (!Number.isFinite(price) || price <= 0) {
    return fail(400, "Course price is not configured");
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
    const { keyId } = getRazorpayEnv();
    return ok({
      alreadyPurchased: false,
      orderId: existingPending.razorpayOrderId,
      keyId,
      amount: existingPending.amount * 100,
      currency: existingPending.currency || "INR",
      courseId: id,
      status: existingPending.status,
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
