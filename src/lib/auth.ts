import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type StaffSession,
} from "@/lib/auth-shared";

export async function getCurrentStaff(): Promise<StaffSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function setSessionCookie(session: StaffSession): Promise<void> {
  const token = await signSession(session);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireStaff(): Promise<StaffSession> {
  const s = await getCurrentStaff();
  if (!s) redirect("/admin/login");
  return s;
}

export async function requireAdmin(): Promise<StaffSession> {
  const s = await requireStaff();
  if (s.role !== "admin") redirect("/admin?error=admin_only");
  return s;
}
