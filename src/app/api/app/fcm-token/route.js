import { handler, body, ok } from "@/server/http";
import { fcmTokenSchema } from "@/server/validation";
import { subscribeToUpdateTopic } from "@/server/fcm";

export const dynamic = "force-dynamic";

/**
 * Subscribes a device's FCM registration token to the update-broadcast
 * topic. Anonymous by design — update availability is not user-specific,
 * so there is nothing to authenticate and no token is persisted here.
 */
export const POST = handler(async (request) => {
  const { token } = fcmTokenSchema.parse(await body(request));
  await subscribeToUpdateTopic(token);
  return ok({ subscribed: true });
});
