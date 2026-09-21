import Image from "next/image";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCollections() {
  const rows = await db
    .select({
      category: categories,
      count: sql<number>`(select count(*) from ${products} where ${products.categoryId} = ${categories.id})::int`,
    })
    .from(categories)
    .orderBy(categories.sortOrder);

  const active = await db.select({ v: sql<number>`count(*)::int` }).from(products).where(eq(products.isActive, true));

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="The eight core SJ Golf Store collections drive navigation, filters and SEO URLs"
        actions={<Link href="/admin/products/new" className="btn btn-dark px-4 py-2.5">Add product</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ category, count }) => (
          <Link
            key={category.id}
            href={`/admin/products?category=${category.id}`}
            className="group overflow-hidden rounded-sm border border-[#e2e6e2] bg-white transition hover:border-forest"
          >
            <div className="relative aspect-[16/10] bg-paper-warm">
              {category.imageUrl ? <Image src={category.imageUrl} alt={category.name} fill sizes="320px" className="object-cover transition-transform group-hover:scale-105" /> : null}
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold">{category.name}</p>
              <p className="mt-0.5 text-xs text-ink-soft">/{category.slug}</p>
              <p className="mt-3 text-xs text-ink-soft">{count} products</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Panel title="Collection settings">
          <Table2
            rows={rows.map(({ category, count }) => ({
              name: category.name,
              handle: `/${category.slug}`,
              tagline: category.tagline,
              products: count,
              status: category.isActive ? "Active" : "Hidden",
              seo: category.seoTitle || `${category.name} | SJ Golf Store`,
            }))}
          />
          <p className="mt-4 text-xs text-ink-soft">
            {Number(active[0]?.v ?? 0)} active products across all collections. Automatic collection rules match on product
            category and tags — tags must match exactly to be included.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Table2({ rows }: { rows: { name: string; handle: string; tagline: string; products: number; status: string; seo: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b border-[#eef1ee] text-left text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">
            <th className="py-2.5 pr-4">Collection</th>
            <th className="py-2.5 pr-4">Handle</th>
            <th className="py-2.5 pr-4">Descriptor</th>
            <th className="py-2.5 pr-4">Products</th>
            <th className="py-2.5 pr-4">SEO title</th>
            <th className="py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f3f1]">
          {rows.map((r) => (
            <tr key={r.handle}>
              <td className="py-3 pr-4 font-medium">{r.name}</td>
              <td className="py-3 pr-4 text-ink-soft">{r.handle}</td>
              <td className="py-3 pr-4 text-ink-soft">{r.tagline}</td>
              <td className="py-3 pr-4">{r.products}</td>
              <td className="py-3 pr-4 text-xs text-ink-soft">{r.seo}</td>
              <td className="py-3">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
