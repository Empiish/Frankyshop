"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

export type WishlistResult = { ok: true; inWishlist: boolean } | { ok: false; error: string };

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const session = await getCurrentCustomer();
  if (!session) return { ok: false, error: "Sign in to save items." };
  const existing = await sql`
    select id from wishlist_items where customer_id = ${session.customerId} and product_id = ${productId} limit 1
  `;
  if (existing.length > 0) {
    await sql`delete from wishlist_items where customer_id = ${session.customerId} and product_id = ${productId}`;
    revalidatePath("/[lang]/account/wishlist", "page");
    return { ok: true, inWishlist: false };
  }
  await sql`
    insert into wishlist_items (customer_id, product_id)
    values (${session.customerId}, ${productId})
    on conflict (customer_id, product_id) do nothing
  `;
  revalidatePath("/[lang]/account/wishlist", "page");
  return { ok: true, inWishlist: true };
}

export async function removeFromWishlist(productId: string): Promise<WishlistResult> {
  const session = await getCurrentCustomer();
  if (!session) return { ok: false, error: "Sign in required." };
  await sql`delete from wishlist_items where customer_id = ${session.customerId} and product_id = ${productId}`;
  revalidatePath("/[lang]/account/wishlist", "page");
  return { ok: true, inWishlist: false };
}
