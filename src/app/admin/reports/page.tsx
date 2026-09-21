import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, transactions } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const REPORTS = [
  { type: "orders", title: "Sales report", body: "Every order with totals, discount, tax and fulfillment state." },
  { type: "products", title: "Product report", body: "Catalogue with pricing, status and SEO metadata." },
  { type: "inventory", title: "Inventory report", body: "SKU level stock, cost and stock status." },
];

export default async function AdminReports() {
  const [salesByDay, refunds, topProducts, taxByState] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`sum(${orders.totalCents})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(desc(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`))
      .limit(10),
    db
      .select({ tx: transactions, order: orders })
      .from(transactions)
      .leftJoin(orders, sql`${orders.id} = ${transactions.orderId}`)
      .where(sql`${transactions.type} = 'refund'`)
      .orderBy(desc(transactions.id))
      .limit(8),
    db
      .select({ title: orderItems.title, units: sql<number>`sum(${orderItems.quantity})::int`, revenue: sql<number>`sum(${orderItems.totalCents})::int` })
      .from(orderItems)
      .groupBy(orderItems.title)
      .orderBy(desc(sql`sum(${orderItems.totalCents})`))
      .limit(8),
    db
      .select({ state: orders.state, tax: sql<number>`sum(${orders.taxCents})::int` })
      .from(orders)
      .groupBy(orders.state)
      .orderBy(desc(sql`sum(${orders.taxCents})`))
      .limit(8),
  ]);

  const productCount = await db.select({ v: sql<number>`count(*)::int` }).from(products);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Downloadable CSV reports for finance and operations" />

      <div className="grid gap-4 sm:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.type} className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <p className="text-sm font-semibold">{r.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{r.body}</p>
            <Link href={`/api/admin/export?type=${r.type}`} className="btn btn-light mt-4 px-3 py-2 text-[0.65rem]">
              Download CSV
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Products reported" value={String(Number(productCount[0]?.v ?? 0))} accent />
        <StatCard label="Refunds" value={String(refunds.length)} />
        <StatCard label="Tax collected" value={formatMoney(taxByState.reduce((s, t) => s + Number(t.tax), 0))} />
        <StatCard label="Reporting days" value={String(salesByDay.length)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Sales by day">
          <Table head={["Date", "Orders", "Revenue"]}>
            {salesByDay.map((s) => (
              <tr key={s.day}>
                <td className="py-2.5 pr-4">{formatDate(s.day)}</td>
                <td className="py-2.5 pr-4">{s.count}</td>
                <td className="py-2.5 font-semibold">{formatMoney(Number(s.revenue))}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Top products">
          <Table head={["Product", "Units", "Revenue"]}>
            {topProducts.map((p) => (
              <tr key={p.title}>
                <td className="py-2.5 pr-4">{p.title}</td>
                <td className="py-2.5 pr-4">{p.units}</td>
                <td className="py-2.5 font-semibold">{formatMoney(Number(p.revenue))}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Refund report">
          {refunds.length ? (
            <Table head={["Order", "Transaction", "Amount", "Reason", "Date"]}>
              {refunds.map(({ tx, order }) => (
                <tr key={tx.id}>
                  <td className="py-2.5 pr-4">
                    {order ? <Link href={`/admin/orders/${order.id}`} className="text-forest hover:underline">#{order.orderNumber}</Link> : "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-ink-soft">{tx.providerTxId}</td>
                  <td className="py-2.5 pr-4 font-semibold">{formatMoney(tx.amountCents)}</td>
                  <td className="py-2.5 pr-4 text-xs text-ink-soft">Customer return</td>
                  <td className="py-2.5 whitespace-nowrap text-xs text-ink-soft">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-ink-soft">No refunds to report.</p>
          )}
        </Panel>

        <Panel title="Tax report by state">
          <Table head={["State", "Tax collected"]}>
            {taxByState.map((t) => (
              <tr key={t.state}>
                <td className="py-2.5 pr-4">{t.state || "—"}</td>
                <td className="py-2.5 font-semibold">{formatMoney(Number(t.tax))}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
