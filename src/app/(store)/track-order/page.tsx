import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { TrackOrderForm } from "@/components/store/account-forms";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your SJ Golf Store order with your order number and email address.",
  alternates: { canonical: "/track-order" },
};

const STEPS = ["Order placed", "Payment confirmed", "Processing", "Shipped", "Delivered"];

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; email?: string }>;
}) {
  const { number, email } = await searchParams;
  const rows =
    number && email
      ? await db
          .select()
          .from(orders)
          .where(and(eq(orders.orderNumber, number.trim().toUpperCase()), eq(orders.email, email.trim().toLowerCase())))
          .limit(1)
      : [];
  const order = rows[0];
  const items = order ? await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) : [];

  const stepIndex = order
    ? order.fulfillmentStatus === "delivered"
      ? 4
      : order.fulfillmentStatus === "shipped"
        ? 3
        : order.fulfillmentStatus === "processing" || order.fulfillmentStatus === "packed"
          ? 2
          : order.paymentStatus === "paid"
            ? 1
            : 0
    : -1;

  return (
    <div className="wrap max-w-3xl py-14 md:py-20">
      <p className="eyebrow">Customer Service</p>
      <h1 className="mt-3 text-4xl md:text-5xl">Track Your Order</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
        Enter the order number from your confirmation email along with the email address used at checkout.
      </p>

      <div className="mt-8 card p-6">
        <TrackOrderForm defaults={{ number, email }} />
      </div>

      {number && !order ? (
        <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not find an order matching that number and email. Double-check both, or contact support.
        </div>
      ) : null}

      {order ? (
        <div className="mt-10">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="label">Order</p>
                <p className="mt-1 text-xl font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-ink-soft">Placed {formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="label">Status</p>
                <p className="mt-1 text-sm font-semibold capitalize text-forest">{order.fulfillmentStatus}</p>
              </div>
            </div>

            {order.status === "cancelled" ? (
              <p className="mt-6 border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
                This order was cancelled. If you were expecting a refund, allow 5–10 business days for it to appear on
                your statement.
              </p>
            ) : (
              <ol className="mt-8 space-y-4">
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.6rem] ${
                          done ? "border-forest bg-forest text-white" : "border-line text-ink-soft"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="flex-1">
                        <span className={`block text-sm ${done ? "font-semibold" : "text-ink-soft"}`}>{step}</span>
                        {i === 3 && order.trackingNumber ? (
                          <span className="mt-0.5 block text-xs text-moss">
                            {order.carrier} · {order.trackingNumber}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-8 divide-y divide-line border-t border-line pt-4">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium">{i.title}</span>
                    <span className="block text-xs uppercase tracking-wider text-ink-soft">
                      {i.variantTitle} · Qty {i.quantity}
                    </span>
                  </span>
                  <span className="font-semibold">{formatMoney(i.totalCents)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-ink-soft">Order total</span>
              <span className="text-lg font-semibold">{formatMoney(order.totalCents)}</span>
            </div>
            <p className="mt-4 text-xs text-ink-soft">Last updated {formatDateTime(order.createdAt)}</p>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Need help?{" "}
            <Link href="/contact" className="font-semibold text-forest underline decoration-line underline-offset-4">
              Contact support
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
