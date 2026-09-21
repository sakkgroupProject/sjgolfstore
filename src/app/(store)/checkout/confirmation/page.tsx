import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, transactions } from "@/db/schema";
import { formatMoney, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  const rows = number ? await db.select().from(orders).where(eq(orders.orderNumber, number)).limit(1) : [];
  const order = rows[0];
  const items = order ? await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) : [];
  const tx = order ? await db.select().from(transactions).where(eq(transactions.orderId, order.id)).limit(1) : [];

  if (!order) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-3xl">Order not found</h1>
        <p className="mt-3 text-sm text-ink-soft">We could not locate that order number.</p>
        <Link href="/track-order" className="btn btn-primary mt-6">Track an order</Link>
      </div>
    );
  }

  return (
    <div className="wrap max-w-4xl py-14 md:py-20">
      <div className="border border-line bg-paper p-8 text-center md:p-12">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-2xl text-white">✓</div>
        <p className="eyebrow mt-5">Order {order.orderNumber}</p>
        <h1 className="mt-3 text-3xl md:text-4xl">Thank you, {order.firstName}. Your gear is on the way.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-ink-soft">
          A confirmation email is on its way to {order.email}. We pack most orders the same business day and send tracking
          as soon as your shipment leaves the warehouse.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/account/orders" className="btn btn-primary">View my orders</Link>
          <Link href={`/track-order?number=${order.orderNumber}&email=${encodeURIComponent(order.email)}`} className="btn btn-outline">
            Track this order
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="label">Shipping to</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
            {order.firstName} {order.lastName}
            <br />
            {order.address1}
            {order.address2 ? <><br />{order.address2}</> : null}
            <br />
            {order.city}, {order.state} {order.postalCode}
            <br />
            {order.country}
          </address>
          <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Method</dt><dd>{order.shippingMethod}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Placed</dt><dd>{formatDate(order.createdAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Payment</dt><dd className="capitalize">{order.paymentStatus}</dd></div>
            {tx[0] ? (
              <div className="flex justify-between"><dt className="text-ink-soft">Card</dt><dd>{tx[0].cardBrand} •••• {tx[0].last4}</dd></div>
            ) : null}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="label">Items</h2>
          <ul className="mt-3 divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{i.title}</span>
                  <span className="block text-xs uppercase tracking-wider text-ink-soft">
                    {i.variantTitle} · Qty {i.quantity}
                  </span>
                </span>
                <span className="whitespace-nowrap font-medium">{formatMoney(i.totalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>
            {order.discountCents ? <div className="flex justify-between text-forest"><dt>Discount {order.discountCode}</dt><dd>−{formatMoney(order.discountCents)}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shippingCents ? formatMoney(order.shippingCents) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd>{formatMoney(order.taxCents)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
