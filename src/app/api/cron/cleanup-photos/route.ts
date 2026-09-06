import { NextRequest, NextResponse } from "next/server";
import { runUploadCleanup } from "@/lib/upload-cleanup";

/** Triggered by Vercel Cron (see vercel.json). Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on its own invocations when the
 * CRON_SECRET env var is set — see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await runUploadCleanup();
  return NextResponse.json(result);
}
