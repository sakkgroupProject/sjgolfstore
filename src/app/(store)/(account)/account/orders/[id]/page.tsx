import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Order Details", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) notFound();
  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)),
  ]);

  return (
    <div>
      <Link href="/account/orders" className="text-xs uppercase tracking-[0.16em] text-ink-soft hover:text-ink">
        ← All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip">Payment: {order.paymentStatus}</span>
          <span className="chip">Fulfillment: {order.fulfillmentStatus}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="card divide-y divide-line">
          {items.map((i) => (
            <div key={i.id} className="flex gap-4 p-5">
              <span className="relative size-20 shrink-0 bg-paper-warm">
                {i.imageUrl ? <Image src={i.imageUrl} alt={i.title} fill sizes="80px" className="object-cover" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">{i.variantTitle}</p>
                <p className="mt-1 text-xs text-moss">SKU {i.sku}</p>
                <p className="mt-2 text-sm">
                  Qty {i.quantity} × {formatMoney(i.unitPriceCents)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatMoney(i.totalCents)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="label">Shipping address</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
              {order.firstName} {order.lastName}
              <br />
              {order.address1}
              <br />
              {order.city}, {order.state} {order.postalCode}
              <br />
              {order.country}
            </address>
            {order.trackingNumber ? (
              <div className="mt-4 border-t border-line pt-4 text-sm">
                <p className="font-semibold">Tracking</p>
                <p className="mt-1 text-ink-soft">
                  {order.carrier} · {order.trackingNumber}
                </p>
              </div>
            ) : null}
          </div>

          <div className="card p-5">
            <h2 className="label">Order totals</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>
              {order.discountCents ? <div className="flex justify-between text-forest"><dt>Discount</dt><dd>−{formatMoney(order.discountCents)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shippingCents ? formatMoney(order.shippingCents) : "Free"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd>{formatMoney(order.taxCents)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="label">Order history</h2>
            <ul className="mt-3 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium">{e.message}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
