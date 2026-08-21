import { connectDb, Enrollment, Payment } from "@/db";
import { handler, ok, fail } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const signature = request.headers.get("x-razorpay-signature") || "";
  const rawBody = await request.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  if (!signature || !secret) {
    return fail(401, "Webhook signature missing");
  }

  const { verifyWebhookSignature } = await import("@/server/razorpay");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return fail(400, "Invalid webhook signature");
  }

  let event = {};
  try {
    event = JSON.parse(rawBody || "{}");
  } catch {
    return fail(400, "Invalid webhook payload");
  }

  const paymentId = event?.payload?.payment?.entity?.id || event?.payment?.id || null;
  const orderId = event?.payload?.order?.entity?.id || event?.order?.id || null;
  const amount = Number(event?.payload?.payment?.entity?.amount || event?.payment?.amount || 0);
  const status = event?.payload?.payment?.entity?.status || event?.event || "unknown";

  if (!orderId || !paymentId) return ok({ received: true, ignored: true });

  await connectDb();
  const paymentDoc = await Payment.findOne({ razorpayOrderId: orderId }).lean();
  if (!paymentDoc) return ok({ received: true, ignored: true });

  if (status === "captured" || event?.event === "payment.captured") {
    const existing = await Enrollment.findOne({ userId: paymentDoc.userId, courseId: paymentDoc.courseId }).lean();
    if (!existing) {
      await Enrollment.create({ userId: paymentDoc.userId, courseId: paymentDoc.courseId, progressPercent: 0 });
    }
    await Payment.findByIdAndUpdate(paymentDoc._id, {
      $set: {
        status: "captured",
        razorpayPaymentId: paymentId,
        updatedAt: new Date(),
        amount: Number(paymentDoc?.amount || 0),
      },
    });
  }

  return ok({ received: true, processed: true, orderId, paymentId, status });
});
