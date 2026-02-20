import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const COOKIE_NAME = "sairoi_session";

function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

export async function loginWithEmailPassword(emailRaw: string, password: string) {
  const email = emailRaw.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false as const, error: "Invalid email or password." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false as const, error: "Invalid email or password." };

  const token = crypto.randomBytes(32).toString("hex");
  const sessionDays = Number(process.env.SESSION_DAYS ?? "14");
  const expiresAt = new Date(Date.now() + daysToMs(sessionDays));

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true as const };
}

export async function logout() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    c.delete(COOKIE_NAME);
  }
}

export async function getUser() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { team: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    c.delete(COOKIE_NAME);
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function requireRole(userRole: Role, allowed: Role[]) {
  if (!allowed.includes(userRole)) throw new Error("FORBIDDEN");
}
