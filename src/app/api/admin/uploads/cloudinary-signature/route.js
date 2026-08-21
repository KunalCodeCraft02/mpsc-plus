import { handler, ok } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { createCourseThumbnailUploadSignature } from "@/server/cloudinary";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  await requireAdmin(request);
  return ok(createCourseThumbnailUploadSignature());
});
