import "server-only";
import { NextResponse } from "next/server";
import { getAdminSession, type AdminSessionPayload } from "@/lib/auth";

/** Every admin API route calls this first. Never trust a hidden URL as
 * authorization — the session is re-verified server-side on every request. */
export async function requireAdmin(): Promise<
  { session: AdminSessionPayload } | { response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return { response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  return { session };
}
