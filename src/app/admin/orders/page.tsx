import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "", label: "All" },
  { key: "unfulfilled", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; payment?: string }>;
}) {
  const { status, q, payment } = await searchParams;
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(orders.fulfillmentStatus, status));
  if (payment) conditions.push(eq(orders.paymentStatus, payment));
  if (q) {
    const term = `%${q}%`;
    const like = or(ilike(orders.orderNumber, term), ilike(orders.email, term), ilike(orders.lastName, term));
    if (like) conditions.push(like);
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.id)).limit(60);
  const stats = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}),0)::int`,
      avg: sql<number>`coalesce(avg(${orders.totalCents}),0)::int`,
    })
    .from(orders);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${stats[0]?.count ?? 0} orders · ${formatMoney(Number(stats[0]?.revenue ?? 0))} lifetime`}
        actions={
          <>
            <form className="flex gap-2" action="/admin/orders">
              <input name="q" defaultValue={q ?? ""} placeholder="Search order, email, name" className="field py-2 text-sm" />
              <button className="btn btn-light px-4 py-2.5">Search</button>
            </form>
            <Link href="/api/admin/export?type=orders" className="btn btn-dark px-4 py-2.5">Export CSV</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total orders" value={String(stats[0]?.count ?? 0)} />
        <StatCard label="Revenue" value={formatMoney(Number(stats[0]?.revenue ?? 0))} />
        <StatCard label="Avg order" value={formatMoney(Number(stats[0]?.avg ?? 0))} />
        <StatCard label="Awaiting fulfillment" value={String(rows.filter((r) => r.fulfillmentStatus === "unfulfilled").length)} accent />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/orders?status=${t.key}` : "/admin/orders"}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
              (status ?? "") === t.key ? "border-forest bg-forest text-white" : "border-[#e2e6e2] bg-white text-ink-soft hover:border-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Panel>
          {rows.length ? (
            <Table head={["Order", "Date", "Customer", "Total", "Payment", "Fulfillment", "Tracking", ""]}>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-ink-soft">{formatDate(o.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className="block">{o.firstName} {o.lastName}</span>
                    <span className="block text-xs text-ink-soft">{o.email}</span>
                  </td>
                  <td className="py-3 pr-4 font-semibold">{formatMoney(o.totalCents)}</td>
                  <td className="py-3 pr-4"><Badge>{o.paymentStatus}</Badge></td>
                  <td className="py-3 pr-4"><Badge>{o.fulfillmentStatus}</Badge></td>
                  <td className="py-3 pr-4 text-xs text-ink-soft">{o.trackingNumber || "—"}</td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="btn btn-light px-3 py-1.5 text-[0.65rem]">View</Link>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No orders match this view" body="Try clearing filters or search for a different order number." />
          )}
        </Panel>
      </div>
    </div>
  );
}
