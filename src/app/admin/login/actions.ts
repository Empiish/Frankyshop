"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export type SignInResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<SignInResult> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Enter your email and password." };

  const { email, password, next } = parsed.data;
  const rows = await sql<
    { id: string; email: string; full_name: string | null; password_hash: string; role: "admin" | "staff"; is_active: boolean }[]
  >`select id, email, full_name, password_hash, role, is_active
    from staff_users where email = ${email} limit 1`;

  const row = rows[0];
  if (!row || !row.is_active) {
    return { ok: false, error: "Invalid email or password." };
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return { ok: false, error: "Invalid email or password." };

  await sql`update staff_users set last_login_at = now() where id = ${row.id}`;
  await setSessionCookie({
    staffId: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  });

  redirect(next && next.startsWith("/admin") ? next : "/admin");
}
