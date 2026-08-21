import crypto from "node:crypto";

export function getRazorpayEnv() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  return { keyId, keySecret, webhookSecret };
}

export function amountToPaise(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function verifyRazorpaySignature({ order_id, payment_id, signature }, secret) {
  if (!order_id || !payment_id || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${order_id}|${payment_id}`)
    .digest("hex");
  const actual = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actual.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actual, expectedBuf);
}

export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actual.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actual, expectedBuf);
}

export async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
  const { keyId, keySecret } = getRazorpayEnv();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay server configuration is missing");
  }

  const body = {
    amount: amountToPaise(amount),
    currency,
    receipt: String(receipt || `rcpt_${Date.now()}`),
    notes: {
      ...notes,
      app: "mpsc-pulse",
    },
  };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    let message = "Unable to create Razorpay order";
    try {
      const payload = JSON.parse(text);
      message = payload?.error?.description || payload?.message || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  return JSON.parse(text);
}

export async function fetchRazorpayPayment(paymentId) {
  const { keyId, keySecret } = getRazorpayEnv();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay server configuration is missing");
  }

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error("Payment lookup failed");
  }

  return JSON.parse(text);
}
