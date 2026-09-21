import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "My Account", robots: { index: false, follow: false } };

export default async function AccountDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [recent, spend, addressRows] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.id)).limit(4),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, user.id)),
    db.select().from(addresses).where(eq(addresses.userId, user.id)),
  ]);

  return (
    <div>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 text-3xl">
        {user.firstName ? `Hi ${user.firstName},` : "Hello,"} ready for the next round?
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Orders placed", String(spend[0]?.count ?? 0)],
          ["Lifetime spend", formatMoney(spend[0]?.total ?? 0)],
          ["Saved addresses", String(addressRows.length)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="label">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Recent orders</h2>
          <Link href="/account/orders" className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
            View all →
          </Link>
        </div>
        {recent.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(o.createdAt)} · {o.shippingMethod}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="chip">{o.fulfillmentStatus}</span>
                  <span className="text-sm font-semibold">{formatMoney(o.totalCents)}</span>
                  <Link href={`/account/orders/${o.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card mt-5 p-8 text-center">
            <p className="text-sm text-ink-soft">You have not placed an order yet.</p>
            <Link href="/shop" className="btn btn-primary mt-4">Start shopping</Link>
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link href="/account/addresses" className="card p-5 transition hover:border-forest">
          <p className="text-sm font-semibold">Manage addresses</p>
          <p className="mt-1 text-xs text-ink-soft">Save shipping addresses for faster checkout.</p>
        </Link>
        <Link href="/track-order" className="card p-5 transition hover:border-forest">
          <p className="text-sm font-semibold">Track an order</p>
          <p className="mt-1 text-xs text-ink-soft">Enter your order number for live status.</p>
        </Link>
        <Link href="/account/profile" className="card p-5 transition hover:border-forest">
          <p className="text-sm font-semibold">Profile settings</p>
          <p className="mt-1 text-xs text-ink-soft">Update contact info and password.</p>
        </Link>
      </section>
    </div>
  );
}
