import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

/**
 * Private object storage abstraction. Works with any S3-compatible
 * provider (AWS S3, Cloudflare R2, Backblaze B2, MinIO for local dev).
 *
 * Child photos are NEVER written to /public and never get a permanent
 * public URL — every read goes through a short-lived signed URL that is
 * only ever generated after a server-side admin-auth check.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — preserve print quality

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

function isConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_ENDPOINT &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!isConfigured()) {
    throw new Error(
      "Private storage is not configured. Set STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY."
    );
  }
  if (!client) {
    client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT,
      forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== "false",
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

function bucket(): string {
  return process.env.STORAGE_BUCKET || "ya7kayti-uploads";
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "bin";
  }
}

/** Randomized storage key — never derived from the customer's filename. */
export function generateStorageKey(mimeType: string): string {
  const ext = extensionForMime(mimeType);
  const date = new Date();
  const yyyymm = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return `child-photos/${yyyymm}/${nanoid(24)}.${ext}`;
}

export function isAllowedImageMime(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ url: string; expiresIn: number }> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(getClient(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });
  return { url, expiresIn: UPLOAD_URL_TTL_SECONDS };
}

/** Only ever call this after verifying an authenticated + authorized
 * admin session server-side. The returned URL expires quickly. */
export async function createPresignedDownloadUrl(
  key: string
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(getClient(), command, {
    expiresIn: DOWNLOAD_URL_TTL_SECONDS,
  });
}

export async function deleteStorageObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key })
  );
}

export function storageIsConfigured(): boolean {
  return isConfigured();
}
