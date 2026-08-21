import test from "node:test";
import assert from "node:assert/strict";
import { amountToPaise, verifyRazorpaySignature } from "./razorpay";

test("amountToPaise converts rupees to paise without floating drift", () => {
  assert.equal(amountToPaise(999), 99900);
  assert.equal(amountToPaise(49.99), 4999);
});

test("verifyRazorpaySignature accepts a matching signature and rejects mismatches", () => {
  const orderId = "order_123";
  const paymentId = "pay_456";
  const secret = "test-secret";
  const expected = (() => {
    const crypto = await import("node:crypto");
    return crypto.createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  })();

  assert.equal(verifyRazorpaySignature({ order_id: orderId, payment_id: paymentId, signature: expected }, secret), true);
  assert.equal(verifyRazorpaySignature({ order_id: orderId, payment_id: paymentId, signature: "bad" }, secret), false);
});
