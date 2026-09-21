import Link from "next/link";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, inventoryHistory, products, variants } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { Badge, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { adjustInventoryAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const REASONS = ["Stock received", "Manual count", "Return to stock", "Damaged", "Cycle count", "Transfer"];

export default async function AdminInventory({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const { filter, category } = await searchParams;
  const conditions: SQL[] = [];
  if (filter === "low") conditions.push(sql`${variants.inventoryQty} > 0 and ${variants.inventoryQty} <= 5`);
  if (filter === "out") conditions.push(eq(variants.inventoryQty, 0));
  if (filter === "in") conditions.push(sql`${variants.inventoryQty} > 5`);

  const rows = await db
    .select({
      variant: variants,
      product: products,
      category: categories,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(variants.inventoryQty)
    .limit(60);

  const [stats, history] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        units: sql<number>`coalesce(sum(${variants.inventoryQty}),0)::int`,
        out: sql<number>`count(*) filter (where ${variants.inventoryQty} = 0)::int`,
        low: sql<number>`count(*) filter (where ${variants.inventoryQty} > 0 and ${variants.inventoryQty} <= 5)::int`,
      })
      .from(variants),
    db.select().from(inventoryHistory).orderBy(desc(inventoryHistory.id)).limit(12),
  ]);

  const cats = await db.select().from(categories).orderBy(categories.sortOrder);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels by variant, with a full adjustment audit trail"
        actions={
          <form className="flex gap-2" action="/admin/inventory">
            <select name="category" defaultValue={category ?? ""} className="field py-2 text-sm">
              <option value="">All collections</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn btn-light px-4 py-2.5">Filter</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Variants tracked" value={String(stats[0]?.total ?? 0)} />
        <StatCard label="Units in stock" value={String(stats[0]?.units ?? 0)} accent />
        <StatCard label="Low stock" value={String(stats[0]?.low ?? 0)} hint="5 or fewer units" />
        <StatCard label="Out of stock" value={String(stats[0]?.out ?? 0)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {[
          { key: "", label: "All" },
          { key: "in", label: "In stock" },
          { key: "low", label: "Low stock" },
          { key: "out", label: "Out of stock" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/inventory?filter=${t.key}` : "/admin/inventory"}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
              (filter ?? "") === t.key ? "border-forest bg-forest text-white" : "border-[#e2e6e2] bg-white text-ink-soft hover:border-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Stock by variant">
          <Table head={["Product", "Variant", "SKU", "Stock", "Status", "Adjust"]}>
            {rows.map(({ variant, product }) => (
              <tr key={variant.id}>
                <td className="py-3 pr-4">
                  <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-forest">
                    {product.title}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-ink-soft">{variant.title}</td>
                <td className="py-3 pr-4 text-xs text-ink-soft">{variant.sku}</td>
                <td className="py-3 pr-4 font-semibold">{variant.inventoryQty}</td>
                <td className="py-3 pr-4">
                  <Badge>{variant.inventoryQty === 0 ? "out of stock" : variant.inventoryQty <= 5 ? "low stock" : "in stock"}</Badge>
                </td>
                <td className="py-3">
                  <form action={adjustInventoryAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="variantId" value={variant.id} />
                    <input type="hidden" name="reason" value="Manual count" />
                    <input name="delta" defaultValue="10" className="field w-16 py-1.5 text-xs" />
                    <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">Adjust</button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Adjust inventory">
            <form action={adjustInventoryAction} className="grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Variant ID</span>
                <input name="variantId" placeholder="e.g. 12" required className="field" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Adjustment</span>
                  <input name="delta" defaultValue="10" className="field" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Reason</span>
                  <select name="reason" className="field">
                    {REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Notes</span>
                <input name="notes" className="field" placeholder="Optional" />
              </label>
              <button className="btn btn-dark">Save adjustment</button>
            </form>
          </Panel>

          <Panel title="Adjustment history">
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="border-b border-[#f1f3f1] pb-3 text-sm last:border-0 last:pb-0">
                  <p className="font-medium">
                    {h.productName} · {h.variantTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {h.previousQty} → {h.newQty} ({h.adjustment >= 0 ? "+" : ""}
                    {h.adjustment}) · {h.reason} · {h.actor}
                  </p>
                  <p className="text-[0.7rem] text-ink-soft">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
