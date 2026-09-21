"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cartItems,
  carts,
  discounts,
  inventoryHistory,
  notifications,
  orderEvents,
  orderItems,
  orders,
  products,
  transactions,
  variants,
} from "@/db/schema";
import { computeTotals, getCartLines, getOrCreateCart, decrementInventoryForOrder } from "@/lib/cart";
import { getCurrentUser, rateLimit } from "@/lib/auth";
import { checkoutSchema, fieldErrors, luhnValid } from "@/lib/validation";

export type CheckoutResult = { ok: boolean; orderNumber?: string; error?: string; errors?: Record<string, string> };

export type CheckoutPayload = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingRateId: number;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  notes: string;
  createAccount: boolean;
};

/** Test-card rule for the built-in gateway: cards ending 0000 always decline. */
function gatewayDecision(cardNumber: string): "approved" | "declined" {
  return cardNumber.replace(/\D/g, "").endsWith("0000") ? "declined" : "approved";
}

export async function placeOrderAction(payload: CheckoutPayload): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, error: Object.values(errors)[0] ?? "Please review your details.", errors };
  }
  if (!luhnValid(parsed.data.cardNumber)) {
    return { ok: false, error: "That card number is not valid. Please check and try again.", errors: { cardNumber: "Invalid card number" } };
  }
  if (gatewayDecision(parsed.data.cardNumber) === "declined") {
    return { ok: false, error: "Your card was declined by the issuer. Please try another payment method." };
  }

  const limit = await rateLimit("checkout:global", 40, 600);
  if (!limit.ok) return { ok: false, error: "Too many orders submitted right now. Please wait a moment and retry." };

  const v = parsed.data;
  const cart = await getOrCreateCart();
  const lines = await getCartLines(cart.id);
  if (!lines.length) return { ok: false, error: "Your cart is empty." };

  // Re-validate live inventory so oversells cannot happen between add-to-cart and pay.
  for (const line of lines) {
    if (line.quantity > line.inventoryQty) {
      return {
        ok: false,
        error: `${line.title} only has ${line.inventoryQty} left in stock. Please update your cart.`,
      };
    }
  }

  const totals = await computeTotals({
    lines,
    discountCode: cart.discountCode,
    state: v.state,
    country: v.country,
    shippingRateId: v.shippingRateId,
  });

  const maxRow = await db.select({ n: sql<number>`coalesce(max(id), 0)::int` }).from(orders);
  const orderNumber = `SJ${10250 + Number(maxRow[0]?.n ?? 0) + 1}`;
  const user = await getCurrentUser();

  const inserted = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: user?.id ?? null,
      email: v.email,
      phone: v.phone,
      firstName: v.firstName,
      lastName: v.lastName,
      address1: v.address1,
      address2: v.address2,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      country: v.country || "United States",
      shippingMethod: totals.shippingCents === 0 && totals.subtotalCents >= 10000 ? "Free Shipping" : "Standard Shipping",
      shippingCents: totals.shippingCents,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      discountCode: totals.discountCode,
      taxRate: 700,
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      status: "open",
      notes: v.notes,
      isGuest: !user,
    })
    .returning();
  const order = inserted[0];

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      variantId: l.variantId,
      title: l.title,
      variantTitle: l.variantTitle,
      sku: l.sku,
      imageUrl: l.imageUrl,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      totalCents: l.lineTotalCents,
    })),
  );

  const last4 = v.cardNumber.replace(/\D/g, "").slice(-4);
  await db.insert(transactions).values({
    orderId: order.id,
    provider: "SJ Pay",
    providerTxId: `txn_${Date.now().toString(36)}`,
    type: "sale",
    amountCents: totals.totalCents,
    status: "success",
    cardBrand: v.cardNumber.trim().startsWith("3") ? "Amex" : "Visa",
    last4,
  });

  await db.insert(orderEvents).values([
    { orderId: order.id, type: "placed", message: "Order placed", actor: v.email },
    { orderId: order.id, type: "payment", message: `Payment approved · SJ Pay ·•••• ${last4}`, actor: "SJ Pay" },
    { orderId: order.id, type: "email", message: "Order confirmation email sent", actor: "system" },
  ]);

  await decrementInventoryForOrder(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })));

  const lowStock = await db
    .select({ title: products.title, qty: variants.inventoryQty })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(sql`${variants.inventoryQty} <= 3`)
    .limit(3);
  if (lowStock.length) {
    await db.insert(notifications).values({
      type: "inventory",
      title: `${lowStock.length} low stock variant${lowStock.length > 1 ? "s" : ""}`,
      body: lowStock.map((l) => `${l.title} (${l.qty} left)`).join(", "),
      href: "/admin/inventory",
    });
  }

  if (totals.discountCode) {
    await db
      .update(discounts)
      .set({ usageCount: sql`${discounts.usageCount} + 1` })
      .where(eq(discounts.code, totals.discountCode));
  }

  await db.insert(inventoryHistory).values(
    lines.map((l) => ({
      variantId: l.variantId,
      productName: l.title,
      variantTitle: l.variantTitle,
      sku: l.sku,
      previousQty: l.inventoryQty,
      newQty: Math.max(l.inventoryQty - l.quantity, 0),
      adjustment: -l.quantity,
      reason: "Order placed",
      actor: v.email,
    })),
  );

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await db.update(carts).set({ discountCode: "" }).where(eq(carts.id, cart.id));

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { ok: true, orderNumber };
}

export async function latestOrderAction() {
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
  return rows[0] ?? null;
}
