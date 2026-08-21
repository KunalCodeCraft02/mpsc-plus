import crypto from "node:crypto";

const THUMBNAIL_FOLDER = "mpsc-pulse/course-thumbnails";

export function getCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Signed uploads keep CLOUDINARY_API_SECRET on the server: the browser gets a
 * timestamp + signature good only for this one upload, then talks to
 * Cloudinary directly. The secret itself never reaches the client/APK bundle.
 */
export function createCourseThumbnailUploadSignature() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary server configuration is missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = THUMBNAIL_FOLDER;
  // Cloudinary's signing rule: every signed param, sorted alphabetically,
  // joined as key=value&key=value, hashed with the secret appended.
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return { cloudName, apiKey, timestamp, signature, folder };
}
