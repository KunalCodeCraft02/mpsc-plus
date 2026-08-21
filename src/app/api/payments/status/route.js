import { connectDb, Course, Enrollment, Payment } from "@/db";
import { handler, ok, fail, query } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { fetchRazorpayPayment } from "@/server/razorpay";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  const user = await requireAuth(request);
  const q = query(request);
  const courseId = Number(q.courseId);
  if (!Number.isFinite(courseId)) return fail(400, "Invalid course id");

  await connectDb();
  const enrollment = await Enrollment.findOne({ userId: user.id, courseId }).lean();
  if (enrollment) return ok({ purchased: true, status: "purchased", courseId });

  const payment = await Payment.findOne({ userId: user.id, courseId }).sort({ createdAt: -1 }).lean();
  if (!payment) return ok({ purchased: false, status: "not_started", courseId });

  const course = await Course.findById(courseId).lean();
  const paymentInfo = payment.razorpayPaymentId
    ? await fetchRazorpayPayment(payment.razorpayPaymentId).catch(() => null)
    : null;
  const captured = payment.status === "captured" || paymentInfo?.status === "captured";
  const amountMatches = Number((paymentInfo?.amount || payment.amount * 100) / 100) === Number(course?.price || 0);

  if (captured && amountMatches) {
    try {
      await Enrollment.create({ userId: user.id, courseId, progressPercent: 0 });
    } catch (error) {
      if (error?.code !== 11000 && error?.code !== 11001) throw error;
    }
    await Payment.findByIdAndUpdate(payment._id, {
      $set: { status: "captured", updatedAt: new Date() },
    });
    return ok({ purchased: true, status: "purchased", courseId });
  }

  return ok({ purchased: false, status: payment.status || "pending", courseId, paymentId: payment.razorpayPaymentId || null });
});
