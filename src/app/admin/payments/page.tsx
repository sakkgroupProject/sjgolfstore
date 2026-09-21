import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, settings, transactions } from "@/db/schema";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Badge, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  const [summary, tx, failed, refunds, provider] = await Promise.all([
    db
      .select({
        successful: sql<number>`coalesce(sum(${transactions.amountCents}) filter (where ${transactions.type} = 'sale' and ${transactions.status} = 'success'),0)::int`,
        pending: sql<number>`coalesce(sum(${transactions.amountCents}) filter (where ${transactions.status} = 'pending'),0)::int`,
        refunded: sql<number>`coalesce(sum(${transactions.amountCents}) filter (where ${transactions.type} = 'refund'),0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(transactions),
    db
      .select({ tx: transactions, order: orders })
      .from(transactions)
      .leftJoin(orders, sql`${orders.id} = ${transactions.orderId}`)
      .orderBy(desc(transactions.id))
      .limit(25),
    db
      .select()
      .from(transactions)
      .where(sql`${transactions.status} <> 'success'`)
      .limit(10),
    db.select().from(transactions).where(sql`${transactions.type} = 'refund'`).orderBy(desc(transactions.id)).limit(10),
    db.select().from(settings).where(sql`${settings.group} = 'payments'`),
  ]);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Transactions, failures and refunds across the gateway" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Successful" value={formatMoney(summary[0]?.successful ?? 0)} accent />
        <StatCard label="Pending" value={formatMoney(summary[0]?.pending ?? 0)} />
        <StatCard label="Refunded" value={formatMoney(summary[0]?.refunded ?? 0)} />
        <StatCard label="Failed" value={String(failed.length)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Transactions">
          <Table head={["Transaction", "Order", "Customer", "Type", "Amount", "Status", "Date"]}>
            {tx.map(({ tx: t, order }) => (
              <tr key={t.id}>
                <td className="py-3 pr-4">
                  <span className="block font-medium">{t.providerTxId}</span>
                  <span className="block text-xs text-ink-soft">{t.cardBrand} •••• {t.last4}</span>
                </td>
                <td className="py-3 pr-4">
                  {order ? (
                    <Link href={`/admin/orders/${order.id}`} className="text-forest hover:underline">
                      #{order.orderNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-soft">{order?.email ?? "—"}</td>
                <td className="py-3 pr-4 capitalize">{t.type}</td>
                <td className="py-3 pr-4 font-semibold">{formatMoney(t.amountCents)}</td>
                <td className="py-3 pr-4"><Badge>{t.status}</Badge></td>
                <td className="py-3 whitespace-nowrap text-xs text-ink-soft">{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Gateway settings">
            <ul className="space-y-2 text-sm">
              {provider.map((p) => (
                <li key={p.key} className="flex items-center justify-between border-b border-[#f1f3f1] pb-2 last:border-0">
                  <span className="text-ink-soft">{p.label}</span>
                  <span className="font-semibold">{p.value || "—"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              API credentials and webhook secrets are stored server-side and are never exposed to the storefront bundle.
              Switching to live mode updates capture and refund behaviour automatically.
            </p>
            <Link href="/admin/settings" className="mt-4 inline-block text-xs font-semibold text-forest">
              Edit payment settings →
            </Link>
          </Panel>

          <Panel title="Refunds">
            {refunds.length ? (
              <ul className="space-y-2.5 text-sm">
                {refunds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b border-[#f1f3f1] pb-2 last:border-0">
                    <span className="text-ink-soft">{r.providerTxId}</span>
                    <span className="font-semibold">{formatMoney(r.amountCents)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">No refunds processed yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
