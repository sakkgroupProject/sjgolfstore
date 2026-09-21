import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  cartItems,
  carts,
  discounts,
  products,
  shippingRates,
  shippingZones,
  taxRegions,
  variants,
  type Discount,
} from "@/db/schema";
import { randomBytes } from "node:crypto";
import { getCartToken, setCartToken } from "@/lib/auth";

export type CartLine = {
  id: number;
  productId: number;
  variantId: number;
  quantity: number;
  title: string;
  variantTitle: string;
  slug: string;
  sku: string;
  imageUrl: string;
  unitPriceCents: number;
  compareAtCents: number | null;
  lineTotalCents: number;
  inventoryQty: number;
};

export type CartTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  itemCount: number;
  discountCode: string;
  discountLabel: string;
};

export const DEFAULT_TAX_RATE_BPS = 700;

/** Read-only cart lookup — safe to call from Server Components (never writes cookies). */
export async function getExistingCart(): Promise<{ id: number; token: string; discountCode: string } | null> {
  const token = await getCartToken();
  if (!token) return null;
  const rows = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
  return rows[0] ? { id: rows[0].id, token: rows[0].token, discountCode: rows[0].discountCode } : null;
}

export async function getOrCreateCart(): Promise<{ id: number; token: string; discountCode: string }> {
  const token = await getCartToken();
  if (token) {
    const existing = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
    if (existing[0]) {
      return { id: existing[0].id, token: existing[0].token, discountCode: existing[0].discountCode };
    }
  }
  const newToken = randomBytes(18).toString("hex");
  const inserted = await db.insert(carts).values({ token: newToken }).returning();
  await setCartToken(newToken);
  return { id: inserted[0].id, token: newToken, discountCode: "" };
}

export async function getCartLines(cartId: number): Promise<CartLine[]> {
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      title: products.title,
      slug: products.slug,
      priceCents: variants.priceCents,
      compareAtCents: variants.compareAtCents,
      sku: variants.sku,
      imageUrl: variants.imageUrl,
      options: variants.options,
      inventoryQty: variants.inventoryQty,
      productImages: products.images,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .innerJoin(variants, eq(variants.id, cartItems.variantId))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.id);

  return rows.map((r) => {
    const optionText = Object.values(r.options ?? {}).filter(Boolean).join(" / ");
    return {
      id: r.id,
      productId: r.productId,
      variantId: r.variantId,
      quantity: r.quantity,
      title: r.title,
      variantTitle: optionText,
      slug: r.slug,
      sku: r.sku,
      imageUrl: r.imageUrl || r.productImages?.[0]?.url || "",
      unitPriceCents: r.priceCents,
      compareAtCents: r.compareAtCents,
      lineTotalCents: r.priceCents * r.quantity,
      inventoryQty: r.inventoryQty,
    };
  });
}

export function evaluateDiscount(
  discount: Discount | null,
  subtotalCents: number,
  itemCount: number,
): { cents: number; label: string; freeShipping: boolean } {
  if (!discount) return { cents: 0, label: "", freeShipping: false };
  if (discount.status !== "active") return { cents: 0, label: "", freeShipping: false };
  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) return { cents: 0, label: "", freeShipping: false };
  if (discount.endsAt && discount.endsAt < now) return { cents: 0, label: "", freeShipping: false };
  if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
    return { cents: 0, label: "", freeShipping: false };
  }
  if (subtotalCents < discount.minSubtotalCents) return { cents: 0, label: "", freeShipping: false };

  if (discount.type === "percentage") {
    return {
      cents: Math.round((subtotalCents * discount.value) / 100),
      label: `${discount.value}% off`,
      freeShipping: false,
    };
  }
  if (discount.type === "fixed") {
    return { cents: Math.min(discount.value, subtotalCents), label: `$${(discount.value / 100).toFixed(0)} off`, freeShipping: false };
  }
  if (discount.type === "free_shipping") {
    return { cents: 0, label: "Free shipping", freeShipping: true };
  }
  if (discount.type === "bxgy") {
    const eligible = Math.floor(itemCount / Math.max(discount.buyQuantity, 1)) * discount.getQuantity;
    if (eligible <= 0) return { cents: 0, label: "", freeShipping: false };
    return { cents: 0, label: `Buy ${discount.buyQuantity} get ${discount.getQuantity} free applied`, freeShipping: false };
  }
  return { cents: 0, label: "", freeShipping: false };
}

export async function findDiscount(code: string): Promise<Discount | null> {
  if (!code) return null;
  const rows = await db
    .select()
    .from(discounts)
    .where(eq(discounts.code, code.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function computeTotals(options: {
  lines: CartLine[];
  discountCode?: string;
  state?: string;
  country?: string;
  shippingRateId?: number | null;
}): Promise<CartTotals> {
  const subtotalCents = options.lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const itemCount = options.lines.reduce((sum, l) => sum + l.quantity, 0);

  const discount = options.discountCode ? await findDiscount(options.discountCode) : null;
  const applied = evaluateDiscount(discount, subtotalCents, itemCount);
  const discountCents = applied.cents;

  // Shipping
  let shippingCents = 0;
  let shippingLabel = "";
  const zoneRows = await db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
  const country = options.country || "United States";
  const zone = zoneRows.find((z) => z.countries.includes(country)) ?? zoneRows[0];
  if (zone) {
    const rates = await db
      .select()
      .from(shippingRates)
      .where(and(eq(shippingRates.zoneId, zone.id), eq(shippingRates.isActive, true)))
      .orderBy(shippingRates.priceCents);
    const chosen = options.shippingRateId
      ? rates.find((r) => r.id === options.shippingRateId) ?? rates[0]
      : rates[0];
    if (chosen) {
      shippingLabel = chosen.name;
      shippingCents = chosen.priceCents;
      if (chosen.type === "price" && chosen.freeOverCents && subtotalCents >= chosen.freeOverCents) {
        shippingCents = 0;
      }
      if (applied.freeShipping) shippingCents = 0;
    }
  }

  // Tax — regional rate where configured, otherwise store default
  let rateBps = DEFAULT_TAX_RATE_BPS;
  if (options.state) {
    const region = await db
      .select()
      .from(taxRegions)
      .where(and(eq(taxRegions.region, options.state), eq(taxRegions.isActive, true)))
      .limit(1);
    if (region[0]) rateBps = region[0].rateBps;
  }
  const taxCents = Math.round(((subtotalCents - discountCents) * rateBps) / 10000);
  const totalCents = Math.max(subtotalCents - discountCents + shippingCents + taxCents, 0);

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
    itemCount,
    discountCode: discount ? discount.code : "",
    discountLabel: applied.label,
  };
}

export async function addLineToCart(cartId: number, productId: number, variantId: number, quantity: number) {
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ cartId, productId, variantId, quantity });
  }
}

export async function productIdsForCart(cartId: number): Promise<number[]> {
  const rows = await db
    .select({ productId: cartItems.productId })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return Array.from(new Set(rows.map((r) => r.productId)));
}

export async function decrementInventoryForOrder(items: { variantId: number; quantity: number }[]) {
  if (!items.length) return;
  const ids = items.map((i) => i.variantId);
  const rows = await db.select().from(variants).where(inArray(variants.id, ids));
  for (const row of rows) {
    const qty = items.filter((i) => i.variantId === row.id).reduce((s, i) => s + i.quantity, 0);
    await db
      .update(variants)
      .set({ inventoryQty: Math.max(row.inventoryQty - qty, 0) })
      .where(eq(variants.id, row.id));
  }
}
