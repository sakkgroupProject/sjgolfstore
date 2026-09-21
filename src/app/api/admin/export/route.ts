import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, variants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "products";

  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (type === "orders") {
    const data = await db.select().from(orders).orderBy(desc(orders.id)).limit(1000);
    rows = data.map((o) => ({
      order_number: o.orderNumber,
      date: o.createdAt?.toISOString?.() ?? "",
      email: o.email,
      customer: `${o.firstName} ${o.lastName}`,
      city: o.city,
      state: o.state,
      postal_code: o.postalCode,
      subtotal: (o.subtotalCents / 100).toFixed(2),
      discount: (o.discountCents / 100).toFixed(2),
      shipping: (o.shippingCents / 100).toFixed(2),
      tax: (o.taxCents / 100).toFixed(2),
      total: (o.totalCents / 100).toFixed(2),
      payment_status: o.paymentStatus,
      fulfillment_status: o.fulfillmentStatus,
      carrier: o.carrier,
      tracking: o.trackingNumber,
    }));
    filename = "sj-orders.csv";
  } else if (type === "inventory") {
    const data = await db
      .select({ product: products, variant: variants })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .limit(2000);
    rows = data.map(({ product, variant }) => ({
      product: product.title,
      variant: variant.title,
      sku: variant.sku,
      barcode: variant.barcode,
      stock: variant.inventoryQty,
      price: (variant.priceCents / 100).toFixed(2),
      cost: (variant.costCents / 100).toFixed(2),
      status: variant.inventoryQty === 0 ? "out_of_stock" : variant.inventoryQty <= 5 ? "low_stock" : "in_stock",
    }));
    filename = "sj-inventory.csv";
  } else {
    const [data, cats] = await Promise.all([
      db.select().from(products).orderBy(products.id).limit(1000),
      getCategories(),
    ]);
    const catMap = new Map(cats.map((c) => [c.id, c.slug]));
    rows = data.map((p) => ({
      title: p.title,
      handle: p.slug,
      vendor: p.brand,
      collection: catMap.get(p.categoryId) ?? "",
      product_type: p.productType,
      sku: p.sku,
      barcode: p.barcode,
      price: (p.priceCents / 100).toFixed(2),
      compare_at: p.compareAtCents ? (p.compareAtCents / 100).toFixed(2) : "",
      cost: (p.costCents / 100).toFixed(2),
      tags: p.tags.join(", "),
      weight_grams: p.weightGrams,
      status: p.isActive ? "active" : "draft",
      seo_title: p.seoTitle,
      seo_description: p.seoDescription,
      image_1: p.images?.[0]?.url ?? "",
    }));
    filename = "sj-products.csv";
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
