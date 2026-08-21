import { connectDb, Course, Enrollment, Payment } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { verifyRazorpaySignature, fetchRazorpayPayment } from "@/server/razorpay";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const user = await requireAuth(request);
  const payload = await body(request);
  const { courseId, orderId, paymentId, signature, amount } = payload || {};

  if (!courseId || !orderId || !paymentId || !signature) {
    return fail(400, "Incomplete payment details");
  }

  const expectedAmount = Number(amount ?? 0);
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return fail(400, "Invalid payment amount");
  }

  const courseNumber = Number(courseId);
  if (!Number.isFinite(courseNumber)) return fail(400, "Invalid course id");

  await connectDb();
  const course = await Course.findById(courseNumber).lean();
  if (!course || !course.published) return fail(404, "Course not found");
  if (course.isFree) return fail(400, "This course is free and does not require payment");

  const existingEnrollment = await Enrollment.findOne({ userId: user.id, courseId: courseNumber }).lean();
  if (existingEnrollment) return ok({ success: true, alreadyPurchased: true, status: "purchased" });

  const payment = await Payment.findOne({ userId: user.id, courseId: courseNumber, razorpayOrderId: orderId }).lean();
  if (!payment) return fail(400, "Payment record not found for this course");

  const courseAmount = Number(course.price || 0);
  if (Number(courseAmount) !== Number(amount)) {
    return fail(400, "Payment amount mismatch");
  }

  const verifiedSignature = verifyRazorpaySignature(
    { order_id: orderId, payment_id: paymentId, signature },
    process.env.RAZORPAY_KEY_SECRET || "",
  );

  if (!verifiedSignature) {
    await Payment.findByIdAndUpdate(payment._id, { $set: { status: "failed", updatedAt: new Date() } });
    return fail(400, "Payment verification failed");
  }

  const paymentInfo = await fetchRazorpayPayment(paymentId);
  const actualAmount = Number((paymentInfo?.amount || 0) / 100);
  if (paymentInfo?.status !== "captured" || actualAmount !== courseAmount) {
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: paymentInfo?.status || "failed",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        updatedAt: new Date(),
      },
    });
    return fail(400, "Payment verification failed or amount mismatch");
  }

  const updated = await Payment.findByIdAndUpdate(
    payment._id,
    {
      $set: {
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        amount: courseAmount,
        status: "captured",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  ).lean();

  const existingAfter = await Enrollment.findOne({ userId: user.id, courseId: courseNumber }).lean();
  if (!existingAfter) {
    try {
      await Enrollment.create({ userId: user.id, courseId: courseNumber, progressPercent: 0 });
    } catch (error) {
      if (error?.code !== 11000 && error?.code !== 11001) throw error;
    }
  }

  return ok({
    success: true,
    alreadyPurchased: false,
    status: updated?.status || "captured",
    paymentId,
    orderId,
    courseId: courseNumber,
  });
});
