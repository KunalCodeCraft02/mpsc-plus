import { connectDb, Enrollment, Payment } from "@/db";
import { handler, ok, fail, query } from "@/server/http";
import { requireAuth } from "@/server/auth";

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

  return ok({ purchased: false, status: payment.status || "pending", courseId, paymentId: payment.razorpayPaymentId || null });
});
