package in.mpscpulse.app;

import android.app.Activity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import com.razorpay.PaymentData;

import org.json.JSONObject;

// NOTE: Razorpay's Android SDK requires the Activity passed to Checkout.open()
// to itself implement PaymentResultWithDataListener (it casts the activity
// internally to deliver onPaymentSuccess/onPaymentError). A Capacitor Plugin
// class is not the Activity, so MainActivity implements that interface and
// forwards callbacks here via the static instance below.
@CapacitorPlugin(name = "RazorpayNative")
public class RazorpayNativePlugin extends Plugin {
    private static RazorpayNativePlugin instance;
    private PluginCall pendingCall;

    @Override
    protected void load() {
        instance = this;
    }

    public static RazorpayNativePlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void open(PluginCall call) {
        if (pendingCall != null) {
            call.reject("A payment is already in progress");
            return;
        }

        String key = call.getString("key");
        if (key == null || key.isBlank()) {
            call.reject("Razorpay key is missing");
            return;
        }

        pendingCall = call;
        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            try {
                Checkout checkout = new Checkout();
                checkout.setKeyID(key);
                JSONObject options = new JSONObject();
                options.put("key", key);
                options.put("amount", call.getInt("amount"));
                options.put("currency", call.getString("currency", "INR"));
                options.put("order_id", call.getString("orderId"));
                options.put("name", call.getString("name", "MPSC Pulse"));
                options.put("description", call.getString("description", "Course purchase"));

                JSONObject prefill = new JSONObject();
                prefill.put("name", call.getString("prefillName", "Student"));
                options.put("prefill", prefill);

                JSONObject theme = new JSONObject();
                theme.put("color", call.getString("themeColor", "#5b34e0"));
                options.put("theme", theme);
                checkout.open(activity, options);
            } catch (Exception error) {
                rejectPending(error.getMessage() == null ? "Unable to open Razorpay" : error.getMessage());
            }
        });
    }

    public void handlePaymentSuccess(String paymentId, PaymentData paymentData) {
        JSObject result = new JSObject();
        result.put("razorpay_payment_id", paymentData.getPaymentId());
        result.put("razorpay_order_id", paymentData.getOrderId());
        result.put("razorpay_signature", paymentData.getSignature());
        resolvePending(result);
    }

    public void handlePaymentError(int code, String description, PaymentData paymentData) {
        rejectPending(description == null ? "Payment failed" : description);
    }

    private void resolvePending(JSObject result) {
        if (pendingCall != null) {
            pendingCall.resolve(result);
            pendingCall = null;
        }
    }

    private void rejectPending(String message) {
        if (pendingCall != null) {
            pendingCall.reject(message);
            pendingCall = null;
        }
    }
}
