"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { setCustomerCookie } from "@/lib/customer-auth";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  lang: z.string().min(2).max(5),
  next: z.string().optional(),
});

const signUpSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters."),
  lang: z.string().min(2).max(5),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function customerSignIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    lang: formData.get("lang"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Enter your email and password." };
  const { email, password, lang, next } = parsed.data;

  const rows = await sql<
    { id: string; email: string; full_name: string | null; password_hash: string | null }[]
  >`select id, email, full_name, password_hash from customers where email = ${email} limit 1`;
  const row = rows[0];
  if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
    return { ok: false, error: "Invalid email or password." };
  }
  await setCustomerCookie({
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
  });
  redirect(next?.startsWith("/") ? next : `/${lang}/account`);
}

export async function customerSignUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    lang: formData.get("lang"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const v = parsed.data;
  const existing = await sql`select id from customers where email = ${v.email} limit 1`;
  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists. Sign in instead." };
  }
  const hash = await bcrypt.hash(v.password, 12);
  const [row] = await sql<{ id: string }[]>`
    insert into customers (full_name, phone, email, password_hash, preferred_locale)
    values (${v.full_name}, ${v.phone}, ${v.email}, ${hash}, ${v.lang})
    returning id
  `;
  await setCustomerCookie({
    customerId: row.id,
    email: v.email,
    fullName: v.full_name,
  });
  redirect(`/${v.lang}/account`);
}
