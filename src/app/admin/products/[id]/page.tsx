import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, inventoryHistory, productOptions, products, variants } from "@/db/schema";
import { centsToInput, formatDateTime } from "@/lib/format";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader, Panel, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const product = rows[0];
  if (!product) notFound();

  const [cats, opts, vars, history] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select().from(productOptions).where(eq(productOptions.productId, productId)).orderBy(asc(productOptions.position)),
    db.select().from(variants).where(eq(variants.productId, productId)).orderBy(asc(variants.position)),
    db.select().from(inventoryHistory).where(eq(inventoryHistory.variantId, productId)).orderBy(desc(inventoryHistory.id)).limit(8),
  ]);

  const variantHistory = await db
    .select()
    .from(inventoryHistory)
    .where(eq(inventoryHistory.productName, product.title))
    .orderBy(desc(inventoryHistory.id))
    .limit(6);

  return (
    <div>
      <PageHeader
        title={product.title}
        subtitle={`Product #${product.id} · ${vars.length} variants · ${vars.reduce((s, v) => s + v.inventoryQty, 0)} units in stock`}
        breadcrumb={[{ href: "/admin/dashboard", label: "Admin" }, { href: "/admin/products", label: "Products" }, { label: product.title }]}
        actions={
          <Link href={`/products/${product.slug}`} className="btn btn-light px-4 py-2.5">
            View in store ↗
          </Link>
        }
      />

      <ProductForm
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        values={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          brand: product.brand,
          shortDescription: product.shortDescription,
          description: product.description,
          categoryId: product.categoryId,
          productType: product.productType,
          price: centsToInput(product.priceCents),
          compareAt: product.compareAtCents ? centsToInput(product.compareAtCents) : "",
          cost: centsToInput(product.costCents),
          sku: product.sku,
          barcode: product.barcode,
          tags: product.tags.join(", "),
          images: (product.images ?? []).map((i) => i.url).join("\n"),
          videoUrl: product.videoUrl,
          specs: (product.specs ?? []).map((s) => `${s.label} | ${s.value}`).join("\n"),
          gender: product.gender || "Unisex",
          clubType: product.clubType,
          shaft: product.shaft,
          loft: product.loft,
          weightGrams: product.weightGrams,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          options: opts.map((o) => ({ name: o.name, values: o.values.join(", ") })),
          variants: vars.map((v) => ({
            title: v.title,
            sku: v.sku,
            price: centsToInput(v.priceCents),
            stock: v.inventoryQty,
          })),
        }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Current variants">
          <Table head={["Variant", "SKU", "Price", "Stock", "Status"]}>
            {vars.map((v) => (
              <tr key={v.id}>
                <td className="py-2.5 pr-4 font-medium">{v.title}</td>
                <td className="py-2.5 pr-4 text-xs text-ink-soft">{v.sku}</td>
                <td className="py-2.5 pr-4">{centsToInput(v.priceCents)}</td>
                <td className="py-2.5 pr-4">{v.inventoryQty}</td>
                <td className="py-2.5">{v.inventoryQty === 0 ? "Out of stock" : v.inventoryQty <= 5 ? "Low" : "In stock"}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Inventory history">
          {variantHistory.length ? (
            <Table head={["When", "Change", "Reason", "By"]}>
              {variantHistory.map((h) => (
                <tr key={h.id}>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDateTime(h.createdAt)}</td>
                  <td className="py-2.5 pr-4">
                    {h.previousQty} → {h.newQty}{" "}
                    <span className={h.adjustment >= 0 ? "text-forest" : "text-red-600"}>
                      ({h.adjustment >= 0 ? "+" : ""}{h.adjustment})
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">{h.reason}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{h.actor}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-ink-soft">No inventory adjustments recorded for this product yet.</p>
          )}
          {history.length ? <p className="mt-3 text-xs text-ink-soft">{history.length} audit entries on the first variant.</p> : null}
        </Panel>
      </div>
    </div>
  );
}
