"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth";

export async function signOut() {
  await clearSessionCookie();
  redirect("/admin/login");
}
