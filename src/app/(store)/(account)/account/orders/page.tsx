import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "My Orders", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.id));

  return (
    <div>
      <h1 className="text-3xl">My Orders</h1>
      <p className="mt-2 text-sm text-ink-soft">{rows.length} orders placed with SJ Golf Store.</p>

      {rows.length ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-sm">
            <thead>
              <tr className="border-y border-line text-left">
                <th className="py-3 pr-4 font-semibold uppercase tracking-[0.12em] text-[0.65rem] text-ink-soft">Order</th>
                <th className="py-3 pr-4 font-semibold uppercase tracking-[0.12em] text-[0.65rem] text-ink-soft">Date</th>
                <th className="py-3 pr-4 font-semibold uppercase tracking-[0.12em] text-[0.65rem] text-ink-soft">Status</th>
                <th className="py-3 pr-4 font-semibold uppercase tracking-[0.12em] text-[0.65rem] text-ink-soft">Total</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="py-4 pr-4 font-semibold">{o.orderNumber}</td>
                  <td className="py-4 pr-4 text-ink-soft">{formatDate(o.createdAt)}</td>
                  <td className="py-4 pr-4">
                    <span className="chip">{o.fulfillmentStatus}</span>
                  </td>
                  <td className="py-4 pr-4 font-semibold">{formatMoney(o.totalCents)}</td>
                  <td className="py-4 text-right">
                    <Link href={`/account/orders/${o.id}`} className="btn btn-outline px-4 py-2 text-[0.65rem]">
                      View Order
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center">
          <p className="text-sm text-ink-soft">No orders yet.</p>
          <Link href="/shop" className="btn btn-primary mt-4">Shop equipment</Link>
        </div>
      )}
    </div>
  );
}
