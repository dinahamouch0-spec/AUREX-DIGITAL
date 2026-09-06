import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  setAdminSessionCookie,
  isRateLimited,
  recordLoginAttempt,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = clientIp(req);

  if (await isRateLimited(email, ip)) {
    return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = user?.active && (await verifyPassword(password, user.passwordHash));

  await recordLoginAttempt(email, ip, !!valid);

  if (!valid || !user) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setAdminSessionCookie(token);
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return NextResponse.json({ ok: true });
}
