"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  contentBlocks,
  discounts,
  inventoryHistory,
  notifications,
  orderEvents,
  orders,
  pages,
  productOptions,
  products,
  reviews,
  settings,
  shippingRates,
  shippingZones,
  staffUsers,
  taxRegions,
  transactions,
  users,
  variants,
  webhooks,
  type ProductImage,
} from "@/db/schema";
import { dollarsToCents, slugify } from "@/lib/format";

async function log(actor: string, action: string, resource: string, detail: string) {
  await db.insert(auditLogs).values({ actor, action, resource, detail });
}

async function nextProductSequence(): Promise<number> {
  const rows = await db.select({ sku: products.sku }).from(products);
  return rows.reduce((highest, row) => {
    const match = /^SJ-(\d+)$/i.exec(row.sku);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 1053) + 1;
}

function barcodeForSequence(sequence: number): string {
  const base = `200${String(sequence).padStart(9, "0")}`;
  const checkDigit = base.split("").reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return `${base}${(10 - (checkDigit % 10)) % 10}`;
}

/* ------------------------- products ------------------------- */

export async function saveProductAction(formData: FormData) {
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const existing = id
    ? (await db.select({ sku: products.sku, barcode: products.barcode }).from(products).where(eq(products.id, id)).limit(1))[0]
    : undefined;
  const generatedSequence = existing ? 0 : await nextProductSequence();

  const images = String(formData.get("images") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url, i) => ({ url, alt: `${title} — view ${i + 1}` }) as ProductImage);

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const specs = String(formData.get("specs") ?? "")
    .split("\n")
    .map((line) => line.split("|"))
    .filter((parts) => parts.length === 2)
    .map((parts) => ({ label: parts[0].trim(), value: parts[1].trim() }));

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "").trim() || slugify(title),
    brand: String(formData.get("brand") ?? "SJ Golf"),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: Number(formData.get("categoryId") ?? 1),
    productType: String(formData.get("productType") ?? ""),
    priceCents: dollarsToCents(String(formData.get("price") ?? "0")),
    compareAtCents: formData.get("compareAt") ? dollarsToCents(String(formData.get("compareAt"))) : null,
    costCents: dollarsToCents(String(formData.get("cost") ?? "0")),
    sku: existing?.sku || `SJ-${generatedSequence}`,
    barcode: existing?.barcode || barcodeForSequence(generatedSequence),
    tags,
    images,
    videoUrl: String(formData.get("videoUrl") ?? ""),
    specs,
    gender: String(formData.get("gender") ?? "Unisex"),
    clubType: String(formData.get("clubType") ?? ""),
    shaft: String(formData.get("shaft") ?? ""),
    loft: String(formData.get("loft") ?? ""),
    weightGrams: Number(formData.get("weightGrams") ?? 0) || 0,
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    updatedAt: new Date(),
  };

  let productId = id;
  if (id) {
    await db.update(products).set(payload).where(eq(products.id, id));
  } else {
    const inserted = await db.insert(products).values(payload).returning();
    productId = inserted[0].id;
  }

  // options + variants
  const optionNames = formData.getAll("optionName").map(String);
  const optionValues = formData.getAll("optionValues").map(String);
  const cleanOptions = optionNames
    .map((name, i) => ({ name: name.trim(), values: optionValues[i] ? optionValues[i].split(",").map((v) => v.trim()).filter(Boolean) : [] }))
    .filter((o) => o.name && o.values.length);

  await db.delete(productOptions).where(eq(productOptions.productId, productId));
  await db.delete(variants).where(eq(variants.productId, productId));

  if (cleanOptions.length) {
    await db.insert(productOptions).values(
      cleanOptions.map((o, i) => ({ productId, name: o.name, values: o.values, position: i })),
    );
    const combos = cleanOptions.reduce<Record<string, string>[]>(
      (acc, o) => acc.flatMap((prev) => o.values.map((v) => ({ ...prev, [o.name]: v }))),
      [{}],
    );
    const variantSkus = formData.getAll("variantSku").map(String);
    const variantPrices = formData.getAll("variantPrice").map(String);
    const variantStock = formData.getAll("variantStock").map(String);
    await db.insert(variants).values(
      combos.map((combo, vi) => ({
        productId,
        title: Object.values(combo).join(" / ") || "Standard",
        sku: variantSkus[vi] || `${payload.sku}-${vi + 1}`,
        priceCents: variantPrices[vi] ? dollarsToCents(variantPrices[vi]) : payload.priceCents,
        costCents: payload.costCents,
        compareAtCents: payload.compareAtCents,
        options: combo,
        inventoryQty: Number(variantStock[vi] ?? 0) || 0,
        weightGrams: payload.weightGrams,
        imageUrl: images[0]?.url ?? "",
        position: vi,
      })),
    );
  }

  await log("admin", id ? "Updated Product" : "Created Product", title, `Price: $${(payload.priceCents / 100).toFixed(2)}`);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}`);
}

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await db.delete(variants).where(eq(variants.productId, id));
  await db.delete(productOptions).where(eq(productOptions.productId, id));
  await db.delete(products).where(eq(products.id, id));
  await log("admin", "Deleted Product", `#${id}`, "Product and variants removed");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const next = formData.get("next") === "1";
  await db.update(products).set({ isActive: next }).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function duplicateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows[0]) return;
  const source = rows[0];
  const inserted = await db
    .insert(products)
    .values({
      ...source,
      id: undefined as unknown as number,
      title: `${source.title} (Copy)`,
      slug: `${source.slug}-copy-${Date.now().toString().slice(-4)}`,
      sku: `${source.sku}-C`,
      isActive: false,
    })
    .returning();
  const newId = inserted[0].id;
  const [srcVariants, srcOptions] = await Promise.all([
    db.select().from(variants).where(eq(variants.productId, id)),
    db.select().from(productOptions).where(eq(productOptions.productId, id)),
  ]);
  if (srcVariants.length) {
    await db.insert(variants).values(
      srcVariants.map((v) => ({ ...v, id: undefined as unknown as number, productId: newId, sku: `${v.sku}-C` })),
    );
  }
  if (srcOptions.length) {
    await db.insert(productOptions).values(srcOptions.map((o) => ({ ...o, id: undefined as unknown as number, productId: newId })));
  }
  revalidatePath("/admin/products");
}

/* ------------------------- inventory ------------------------- */

export async function adjustInventoryAction(formData: FormData) {
  const variantId = Number(formData.get("variantId"));
  const delta = Number(formData.get("delta") ?? 0);
  const reason = String(formData.get("reason") ?? "Manual adjustment");
  const notes = String(formData.get("notes") ?? "");
  const rows = await db.select().from(variants).where(eq(variants.id, variantId)).limit(1);
  const variant = rows[0];
  if (!variant) return;
  const previous = variant.inventoryQty;
  const next = Math.max(previous + delta, 0);
  await db.update(variants).set({ inventoryQty: next }).where(eq(variants.id, variantId));
  const productRow = await db.select({ title: products.title }).from(products).where(eq(products.id, variant.productId)).limit(1);
  await db.insert(inventoryHistory).values({
    variantId,
    productName: productRow[0]?.title ?? "",
    variantTitle: variant.title,
    sku: variant.sku,
    previousQty: previous,
    newQty: next,
    adjustment: delta,
    reason,
    actor: "admin",
    notes,
  });
  await log("admin", "Adjusted Inventory", `${productRow[0]?.title ?? ""} · ${variant.sku}`, `${previous} → ${next}`);
  revalidatePath("/admin/inventory");
}

/* ------------------------- orders ------------------------- */

export async function updateOrderFulfillmentAction(formData: FormData) {
  const orderId = Number(formData.get("orderId"));
  const fulfillmentStatus = String(formData.get("fulfillmentStatus") ?? "processing");
  const carrier = String(formData.get("carrier") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "");
  await db
    .update(orders)
    .set({
      fulfillmentStatus,
      carrier,
      trackingNumber,
      status: fulfillmentStatus === "delivered" ? "complete" : fulfillmentStatus === "cancelled" ? "cancelled" : "processing",
    })
    .where(eq(orders.id, orderId));
  await db.insert(orderEvents).values({
    orderId,
    type: "fulfillment",
    message: trackingNumber ? `Shipped via ${carrier} · ${trackingNumber}` : `Fulfillment updated to ${fulfillmentStatus}`,
    actor: "admin",
  });
  await log("admin", "Updated Order", `#${orderId}`, `Fulfillment: ${fulfillmentStatus}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(formData: FormData) {
  const orderId = Number(formData.get("orderId"));
  const amount = dollarsToCents(String(formData.get("amount") ?? "0"));
  const reason = String(formData.get("reason") ?? "Customer return");
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return;
  await db.insert(transactions).values({
    orderId,
    provider: "SJ Pay",
    providerTxId: `rfnd_${Date.now().toString(36)}`,
    type: "refund",
    amountCents: amount,
    status: "success",
  });
  await db
    .update(orders)
    .set({
      paymentStatus: amount >= order.totalCents ? "refunded" : "partially_refunded",
      status: amount >= order.totalCents ? "refunded" : order.status,
      fulfillmentStatus: amount >= order.totalCents ? "cancelled" : order.fulfillmentStatus,
    })
    .where(eq(orders.id, orderId));
  await db.insert(orderEvents).values({
    orderId,
    type: "refund",
    message: `Refunded $${(amount / 100).toFixed(2)} — ${reason}`,
    actor: "admin",
  });
  await db.insert(notifications).values({
    type: "refund",
    title: `Refund processed on ${order.orderNumber}`,
    body: `$${(amount / 100).toFixed(2)} — ${reason}`,
    href: `/admin/orders/${orderId}`,
  });
  await log("admin", "Processed Refund", order.orderNumber, `$${(amount / 100).toFixed(2)} — ${reason}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/payments");
}

/* ------------------------- discounts ------------------------- */

export async function saveDiscountAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").toUpperCase().trim();
  if (!code) return;
  const type = String(formData.get("type") ?? "percentage");
  const starts = String(formData.get("startsAt") ?? "");
  const ends = String(formData.get("endsAt") ?? "");
  const values = {
    code,
    description: String(formData.get("description") ?? ""),
    type,
    value: type === "percentage" ? Number(formData.get("value") ?? 0) : dollarsToCents(String(formData.get("value") ?? "0")),
    minSubtotalCents: dollarsToCents(String(formData.get("minSubtotal") ?? "0")),
    buyQuantity: Number(formData.get("buyQuantity") ?? 0) || 0,
    getQuantity: Number(formData.get("getQuantity") ?? 0) || 0,
    appliesTo: String(formData.get("appliesTo") ?? "all"),
    appliesToRef: String(formData.get("appliesToRef") ?? ""),
    usageLimit: Number(formData.get("usageLimit") ?? 0) || 0,
    status: String(formData.get("status") ?? "active"),
    startsAt: starts ? new Date(starts) : null,
    endsAt: ends ? new Date(ends) : null,
  };
  const existing = await db.select().from(discounts).where(eq(discounts.code, code)).limit(1);
  if (existing[0]) await db.update(discounts).set(values).where(eq(discounts.id, existing[0].id));
  else await db.insert(discounts).values(values);
  await log("admin", "Saved Discount", code, `${type} · ${values.status}`);
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const next = String(formData.get("next") ?? "active");
  await db.update(discounts).set({ status: next }).where(eq(discounts.id, id));
  revalidatePath("/admin/discounts");
}

export async function deleteDiscountAction(formData: FormData) {
  await db.delete(discounts).where(eq(discounts.id, Number(formData.get("id"))));
  revalidatePath("/admin/discounts");
}

/* ------------------------- content / settings ------------------------- */

export async function saveContentAction(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  if (!key) return;
  await db
    .update(contentBlocks)
    .set({
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      subtitle: String(formData.get("subtitle") ?? ""),
      body: String(formData.get("body") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      ctaLabel: String(formData.get("ctaLabel") ?? ""),
      ctaHref: String(formData.get("ctaHref") ?? ""),
      data: {
        secondaryLabel: String(formData.get("secondaryLabel") ?? ""),
        secondaryHref: String(formData.get("secondaryHref") ?? ""),
        item1Title: String(formData.get("item1Title") ?? ""),
        item1Body: String(formData.get("item1Body") ?? ""),
        item2Title: String(formData.get("item2Title") ?? ""),
        item2Body: String(formData.get("item2Body") ?? ""),
        item3Title: String(formData.get("item3Title") ?? ""),
        item3Body: String(formData.get("item3Body") ?? ""),
      },
      isPublished: formData.get("isPublished") === "on",
    })
    .where(eq(contentBlocks.key, key));
  await log("admin", "Published Content", key, "Homepage section updated");
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
}

export async function savePageAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await db
    .update(pages)
    .set({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      seoTitle: String(formData.get("seoTitle") ?? ""),
      seoDescription: String(formData.get("seoDescription") ?? ""),
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id));
  await log("admin", "Updated Page", String(formData.get("title") ?? id), "Page content saved");
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

export async function saveSettingsAction(formData: FormData) {
  const entries = Array.from(formData.entries()).filter(([k]) => k.startsWith("setting__"));
  for (const [key, value] of entries) {
    const settingKey = key.replace("setting__", "");
    await db.update(settings).set({ value: String(value) }).where(eq(settings.key, settingKey));
  }
  await log("admin", "Updated Settings", "Store settings", `${entries.length} values saved`);
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function saveTaxRegionAction(formData: FormData) {
  const region = String(formData.get("region") ?? "").toUpperCase();
  if (!region) return;
  await db
    .insert(taxRegions)
    .values({ region, label: String(formData.get("label") ?? region), rateBps: Math.round(Number(formData.get("rate") ?? 0) * 100) })
    .onConflictDoNothing();
  revalidatePath("/admin/tax");
}

export async function toggleTaxRegionAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const next = formData.get("next") === "1";
  await db.update(taxRegions).set({ isActive: next }).where(eq(taxRegions.id, id));
  revalidatePath("/admin/tax");
}

export async function saveShippingRateAction(formData: FormData) {
  const zoneId = Number(formData.get("zoneId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !zoneId) return;
  await db.insert(shippingRates).values({
    zoneId,
    name,
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "flat"),
    priceCents: dollarsToCents(String(formData.get("price") ?? "0")),
    freeOverCents: formData.get("freeOver") ? dollarsToCents(String(formData.get("freeOver"))) : null,
    transitDays: String(formData.get("transitDays") ?? "3-7 business days"),
  });
  revalidatePath("/admin/shipping");
}

export async function toggleShippingRateAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await db.update(shippingRates).set({ isActive: formData.get("next") === "1" }).where(eq(shippingRates.id, id));
  revalidatePath("/admin/shipping");
}

export async function deleteShippingRateAction(formData: FormData) {
  await db.delete(shippingRates).where(eq(shippingRates.id, Number(formData.get("id"))));
  revalidatePath("/admin/shipping");
}

export async function saveZoneAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.insert(shippingZones).values({ name, countries: String(formData.get("countries") ?? "").split(",").map((c) => c.trim()).filter(Boolean) });
  revalidatePath("/admin/shipping");
}

/* ------------------------- people ------------------------- */

export async function saveStaffAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!name || !email) return;
  await db
    .insert(staffUsers)
    .values({
      name,
      email,
      role: String(formData.get("role") ?? "Order Manager"),
      permissions: formData.getAll("permissions").map(String),
      twoFactorEnabled: formData.get("twoFactorEnabled") === "on",
    })
    .onConflictDoNothing();
  await log("admin", "Created Staff User", name, String(formData.get("role") ?? ""));
  revalidatePath("/admin/staff");
}

export async function updateStaffStatusAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const next = String(formData.get("next") ?? "active");
  await db.update(staffUsers).set({ status: next }).where(eq(staffUsers.id, id));
  revalidatePath("/admin/staff");
}

export async function updateCustomerStatusAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const next = String(formData.get("next") ?? "active");
  await db.update(users).set({ status: next }).where(eq(users.id, id));
  revalidatePath("/admin/customers");
}

export async function updateReviewAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "approved");
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  revalidatePath("/admin/reviews");
}

export async function markNotificationsReadAction() {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  revalidatePath("/admin/notifications");
}

export async function retryWebhookAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await db
    .update(webhooks)
    .set({ status: "healthy", failureCount: 0, lastReceivedAt: new Date() })
    .where(eq(webhooks.id, id));
  await log("admin", "Retried Webhook", `#${id}`, "Webhook reset to healthy");
  revalidatePath("/admin/system");
}
