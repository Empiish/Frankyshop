"use server";

import { redirect } from "next/navigation";
import { clearCustomerCookie } from "@/lib/customer-auth";

export async function customerSignOut(lang: string) {
  await clearCustomerCookie();
  redirect(`/${lang}`);
}
