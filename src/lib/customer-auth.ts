import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_TTL_SECONDS,
  signCustomer,
  verifyCustomer,
  type CustomerSession,
} from "@/lib/customer-auth-shared";

export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return await verifyCustomer(token);
}

export async function setCustomerCookie(session: CustomerSession): Promise<void> {
  const token = await signCustomer(session);
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_TTL_SECONDS,
  });
}

export async function clearCustomerCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export async function requireCustomer(lang: string): Promise<CustomerSession> {
  const s = await getCurrentCustomer();
  if (!s) redirect(`/${lang}/account/login`);
  return s;
}
