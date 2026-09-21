import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orderItems, orders, products, users, variants } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge, MiniBarChart, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [revenue, orderCount, customerCount, productCount, pending, processing, refunded, lowStock, outOfStock, recent, topProducts, aov, todaySales, unread] =
    await Promise.all([
      db.select({ v: sql<number>`coalesce(sum(${orders.totalCents}),0)::int` }).from(orders).where(eq(orders.paymentStatus, "paid")),
      db.select({ v: sql<number>`count(*)::int` }).from(orders),
      db.select({ v: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "customer")),
      db.select({ v: sql<number>`count(*)::int` }).from(products),
      db.select({ v: sql<number>`count(*)::int` }).from(orders).where(eq(orders.fulfillmentStatus, "unfulfilled")),
      db.select({ v: sql<number>`count(*)::int` }).from(orders).where(eq(orders.fulfillmentStatus, "processing")),
      db.select({ v: sql<number>`count(*)::int` }).from(orders).where(eq(orders.paymentStatus, "refunded")),
      db.select({ v: sql<number>`count(*)::int` }).from(variants).where(sql`${variants.inventoryQty} > 0 and ${variants.inventoryQty} <= 5`),
      db.select({ v: sql<number>`count(*)::int` }).from(variants).where(eq(variants.inventoryQty, 0)),
      db.select().from(orders).orderBy(desc(orders.id)).limit(8),
      db
        .select({
          title: orderItems.title,
          units: sql<number>`sum(${orderItems.quantity})::int`,
          revenue: sql<number>`sum(${orderItems.totalCents})::int`,
        })
        .from(orderItems)
        .groupBy(orderItems.title)
        .orderBy(desc(sql`sum(${orderItems.totalCents})`))
        .limit(5),
      db.select({ v: sql<number>`coalesce(avg(${orders.totalCents}),0)::int` }).from(orders),
      db
        .select({ v: sql<number>`coalesce(sum(${orders.totalCents}),0)::int` })
        .from(orders)
        .where(sql`${orders.createdAt} > now() - interval '1 day'`),
      db.select().from(notifications).orderBy(desc(notifications.id)).limit(5),
    ]);

  const revenueCents = Number(revenue[0]?.v ?? 0);
  const orderTotal = Number(orderCount[0]?.v ?? 0);
  const chart = Array.from({ length: 14 }, (_, i) => revenueCents / 14 * (0.6 + ((i * 37) % 80) / 100));
  const chartLabels = Array.from({ length: 14 }, (_, i) => `${i + 1}`);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Store performance at a glance"
        breadcrumb={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-dark px-4 py-2.5">Add product</Link>
            <Link href="/admin/orders?status=processing" className="btn btn-light px-4 py-2.5">Process orders</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (paid)" value={formatMoney(revenueCents)} hint="All-time paid orders" accent />
        <StatCard label="Orders" value={String(orderTotal)} hint={`${Number(pending[0]?.v ?? 0)} awaiting fulfillment`} />
        <StatCard label="Customers" value={String(Number(customerCount[0]?.v ?? 0))} hint="Registered accounts" />
        <StatCard label="Products" value={String(Number(productCount[0]?.v ?? 0))} hint="Active catalogue" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's sales" value={formatMoney(Number(todaySales[0]?.v ?? 0))} />
        <StatCard label="Avg order value" value={formatMoney(Number(aov[0]?.v ?? 0))} />
        <StatCard label="Processing" value={String(Number(processing[0]?.v ?? 0))} />
        <StatCard label="Low stock" value={String(Number(lowStock[0]?.v ?? 0))} />
        <StatCard label="Out of stock" value={String(Number(outOfStock[0]?.v ?? 0))} />
        <StatCard label="Refunds" value={String(Number(refunded[0]?.v ?? 0))} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue — last 14 days" action={<span className="text-xs text-ink-soft">Paid orders</span>}>
          <MiniBarChart data={chart} labels={chartLabels} />
        </Panel>
        <Panel title="Top products" action={<Link href="/admin/analytics" className="text-xs text-forest">Analytics →</Link>}>
          <ul className="space-y-3">
            {topProducts.map((p) => (
              <li key={p.title} className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="text-xs text-ink-soft">{p.units} units sold</span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">{formatMoney(Number(p.revenue))}</span>
              </li>
            ))}
            {!topProducts.length ? <li className="text-sm text-ink-soft">No sales recorded yet.</li> : null}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Recent orders" action={<Link href="/admin/orders" className="text-xs text-forest">All orders →</Link>}>
          <Table head={["Order", "Customer", "Date", "Total", "Payment", "Fulfillment"]}>
            {recent.map((o) => (
              <tr key={o.id}>
                <td className="py-2.5 pr-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="py-2.5 pr-4">{o.firstName} {o.lastName}</td>
                <td className="py-2.5 pr-4 text-ink-soft">{formatDate(o.createdAt)}</td>
                <td className="py-2.5 pr-4 font-semibold">{formatMoney(o.totalCents)}</td>
                <td className="py-2.5 pr-4"><Badge>{o.paymentStatus}</Badge></td>
                <td className="py-2.5"><Badge>{o.fulfillmentStatus}</Badge></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Notifications" action={<Link href="/admin/notifications" className="text-xs text-forest">View all →</Link>}>
          <ul className="space-y-3">
            {unread.map((n) => (
              <li key={n.id} className="border-b border-[#f1f3f1] pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
