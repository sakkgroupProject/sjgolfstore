"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, discounts } from "@/db/schema";
import { addLineToCart, getCartLines, getOrCreateCart } from "@/lib/cart";

export async function addToCartAction(productId: number, variantId: number, quantity = 1) {
  const cart = await getOrCreateCart();
  await addLineToCart(cart.id, productId, variantId, Math.max(quantity, 1));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(itemId: number, quantity: number) {
  const cart = await getOrCreateCart();
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(itemId: number) {
  const cart = await getOrCreateCart();
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function applyDiscountAction(code: string) {
  const cart = await getOrCreateCart();
  const normalized = code.trim().toUpperCase();
  const found = await db.select().from(discounts).where(eq(discounts.code, normalized)).limit(1);
  if (!found[0]) return { ok: false as const, error: "That discount code is not valid." };
  if (found[0].status !== "active") return { ok: false as const, error: `${normalized} is not currently active.` };
  await db.update(carts).set({ discountCode: normalized }).where(eq(carts.id, cart.id));
  revalidatePath("/", "layout");
  return { ok: true as const, code: normalized };
}

export async function removeDiscountAction() {
  const cart = await getOrCreateCart();
  await db.update(carts).set({ discountCode: "" }).where(eq(carts.id, cart.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getCartCountAction() {
  const cart = await getOrCreateCart();
  const lines = await getCartLines(cart.id);
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
