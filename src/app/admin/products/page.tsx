import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, variants } from "@/db/schema";
import { centsToInput, formatDate, formatMoney } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { deleteProductAction, duplicateProductAction, toggleProductAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const { q, status, category } = await searchParams;
  const conditions: SQL[] = [];
  if (q) {
    const term = `%${q}%`;
    const like = or(ilike(products.title, term), ilike(products.sku, term), ilike(products.brand, term));
    if (like) conditions.push(like);
  }
  if (status === "draft") conditions.push(eq(products.isActive, false));
  if (status === "active") conditions.push(eq(products.isActive, true));
  if (category) conditions.push(eq(products.categoryId, Number(category)));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(where)
    .orderBy(desc(products.updatedAt))
    .limit(80);

  const stockRows = await db
    .select({ productId: variants.productId, total: sql<number>`sum(${variants.inventoryQty})::int` })
    .from(variants)
    .groupBy(variants.productId);
  const stockMap = new Map(stockRows.map((s) => [s.productId, Number(s.total)]));

  const cats = await db.select().from(categories).orderBy(categories.sortOrder);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${rows.length} products shown · ${cats.length} collections`}
        actions={
          <>
            <form className="flex gap-2" action="/admin/products">
              <input name="q" defaultValue={q ?? ""} placeholder="Search title or SKU" className="field py-2 text-sm" />
              <button className="btn btn-light px-4 py-2.5">Search</button>
            </form>
            <Link href="/admin/import" className="btn btn-light px-4 py-2.5">Import</Link>
            <Link href="/admin/products/new" className="btn btn-dark px-4 py-2.5">+ Add product</Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { key: "", label: "All" },
          { key: "active", label: "Active" },
          { key: "draft", label: "Draft" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/products?status=${t.key}` : "/admin/products"}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
              (status ?? "") === t.key ? "border-forest bg-forest text-white" : "border-[#e2e6e2] bg-white text-ink-soft hover:border-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <span className="mx-2 hidden w-px bg-[#e2e6e2] sm:block" />
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/admin/products?category=${c.id}`}
            className={`rounded-sm border px-3 py-1.5 text-xs transition ${
              category === String(c.id) ? "border-forest bg-forest/[0.07] font-semibold text-forest" : "border-[#e2e6e2] bg-white text-ink-soft hover:border-ink"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <Panel>
        {rows.length ? (
          <Table head={["Product", "SKU", "Price", "Inventory", "Status", "Updated", "Actions"]}>
            {rows.map(({ product, category: cat }) => {
              const stock = stockMap.get(product.id) ?? 0;
              return (
                <tr key={product.id}>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/products/${product.id}`} className="font-semibold hover:text-forest">
                      {product.title}
                    </Link>
                    <span className="block text-xs text-ink-soft">
                      {cat?.name} · {product.productType || "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-soft">{product.sku}</td>
                  <td className="py-3 pr-4">
                    <span className="block font-semibold">{formatMoney(product.priceCents)}</span>
                    {product.compareAtCents ? (
                      <span className="block text-xs text-ink-soft line-through">{centsToInput(product.compareAtCents)}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={stock === 0 ? "text-red-600" : stock <= 10 ? "text-[#b45309]" : ""}>{stock}</span>
                    <span className="block text-xs text-ink-soft">{stock === 0 ? "Out of stock" : stock <= 10 ? "Low" : "In stock"}</span>
                  </td>
                  <td className="py-3 pr-4"><Badge>{product.isActive ? "active" : "draft"}</Badge></td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDate(product.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/admin/products/${product.id}`} className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">Edit</Link>
                      <form action={toggleProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="next" value={product.isActive ? "0" : "1"} />
                        <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">{product.isActive ? "Unpublish" : "Publish"}</button>
                      </form>
                      <form action={duplicateProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">Duplicate</button>
                      </form>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem] text-red-600">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState
            title="No products found"
            body="Adjust your search or add your first product to the catalogue."
            action={<Link href="/admin/products/new" className="btn btn-dark">Add product</Link>}
          />
        )}
      </Panel>
    </div>
  );
}
