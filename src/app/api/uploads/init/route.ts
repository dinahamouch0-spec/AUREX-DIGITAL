import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  createPresignedUploadUrl,
  generateStorageKey,
  isAllowedImageMime,
  storageIsConfigured,
} from "@/lib/storage";

const bodySchema = z.object({
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  if (!storageIsConfigured()) {
    return NextResponse.json(
      {
        error: "STORAGE_NOT_CONFIGURED",
        message:
          "Private photo storage is not configured yet. Set STORAGE_ENDPOINT / STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY.",
      },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const { mimeType, sizeBytes } = parsed.data;

  if (!isAllowedImageMime(mimeType)) {
    return NextResponse.json(
      { error: "INVALID_TYPE", allowed: ALLOWED_IMAGE_MIME_TYPES },
      { status: 415 }
    );
  }

  if (sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: "TOO_LARGE", maxBytes: MAX_UPLOAD_SIZE_BYTES },
      { status: 413 }
    );
  }

  const storageKey = generateStorageKey(mimeType);

  const upload = await prisma.upload.create({
    data: {
      storageKey,
      mimeType,
      sizeBytes,
      status: "temporary",
    },
  });

  const { url, expiresIn } = await createPresignedUploadUrl(storageKey, mimeType);

  return NextResponse.json({
    uploadId: upload.id,
    uploadUrl: url,
    expiresIn,
  });
}
