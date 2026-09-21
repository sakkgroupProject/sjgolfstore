import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders, transactions, users } from "@/db/schema";
import { centsToInput, formatDateTime, formatMoney } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, Table } from "@/components/admin/ui";
import { refundOrderAction, updateOrderFulfillmentAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL"];
const FULFILLMENT = ["unfulfilled", "processing", "packed", "shipped", "partially shipped", "delivered", "cancelled"];

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  const order = rows[0];
  if (!order) notFound();

  const [items, events, tx, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(desc(orderEvents.id)),
    db.select().from(transactions).where(eq(transactions.orderId, order.id)).orderBy(desc(transactions.id)),
    order.userId ? db.select().from(users).where(eq(users.id, order.userId)).limit(1) : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed ${formatDateTime(order.createdAt)} · ${order.email}`}
        breadcrumb={[{ href: "/admin/dashboard", label: "Admin" }, { href: "/admin/orders", label: "Orders" }, { label: order.orderNumber }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge>{order.paymentStatus}</Badge>
            <Badge>{order.fulfillmentStatus}</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <Table head={["Product", "Variant", "SKU", "Qty", "Unit", "Total"]}>
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-3 pr-4 font-medium">{i.title}</td>
                  <td className="py-3 pr-4 text-ink-soft">{i.variantTitle || "—"}</td>
                  <td className="py-3 pr-4 text-xs text-ink-soft">{i.sku}</td>
                  <td className="py-3 pr-4">{i.quantity}</td>
                  <td className="py-3 pr-4">{formatMoney(i.unitPriceCents)}</td>
                  <td className="py-3 font-semibold">{formatMoney(i.totalCents)}</td>
                </tr>
              ))}
            </Table>
            <dl className="mt-5 space-y-2 border-t border-[#eef1ee] pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>
              {order.discountCents ? (
                <div className="flex justify-between text-forest"><dt>Discount {order.discountCode}</dt><dd>−{formatMoney(order.discountCents)}</dd></div>
              ) : null}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping ({order.shippingMethod})</dt><dd>{order.shippingCents ? formatMoney(order.shippingCents) : "Free"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax ({(order.taxRate / 100).toFixed(2)}%)</dt><dd>{formatMoney(order.taxCents)}</dd></div>
              <div className="flex justify-between border-t border-[#eef1ee] pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Fulfillment">
            <form action={updateOrderFulfillmentAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={order.id} />
              <Field label="Fulfillment status">
                <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="field">
                  {FULFILLMENT.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Carrier">
                <select name="carrier" defaultValue={order.carrier || CARRIERS[0]} className="field">
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tracking number" className="sm:col-span-2">
                <input name="trackingNumber" defaultValue={order.trackingNumber} className="field" placeholder="1Z999AA10123456784" />
              </Field>
              <div className="sm:col-span-2">
                <button className="btn btn-dark">Create shipment &amp; notify customer</button>
              </div>
            </form>
          </Panel>

          <Panel title="Refund">
            <form action={refundOrderAction} className="grid gap-4 sm:grid-cols-3">
              <input type="hidden" name="orderId" value={order.id} />
              <Field label="Refund amount">
                <input name="amount" defaultValue={centsToInput(order.totalCents)} className="field" />
              </Field>
              <Field label="Reason">
                <select name="reason" className="field">
                  {["Customer return", "Damaged in transit", "Wrong item shipped", "Price adjustment", "Goodwill credit"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button className="btn btn-dark w-full">Process refund</button>
              </div>
              <p className="text-xs text-ink-soft sm:col-span-3">
                Refunds are sent to the original payment method through SJ Pay and typically settle in 5–10 business days.
              </p>
            </form>
          </Panel>

          <Panel title="Order timeline">
            <ol className="space-y-4">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-forest/25 pl-4">
                  <p className="text-sm font-medium">{e.message}</p>
                  <p className="text-xs text-ink-soft">
                    {formatDateTime(e.createdAt)} · {e.actor}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="text-sm font-semibold">{order.firstName} {order.lastName}</p>
            <p className="mt-1 text-sm text-ink-soft">{order.email}</p>
            <p className="text-sm text-ink-soft">{order.phone || "No phone"}</p>
            {customer[0] ? (
              <Link href={`/admin/customers?q=${order.email}`} className="mt-3 inline-block text-xs font-semibold text-forest">
                View customer record →
              </Link>
            ) : (
              <p className="mt-3 text-xs text-ink-soft">Guest checkout</p>
            )}
          </Panel>

          <Panel title="Shipping address">
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              {order.firstName} {order.lastName}
              <br />
              {order.address1}{order.address2 ? <><br />{order.address2}</> : null}
              <br />
              {order.city}, {order.state} {order.postalCode}
              <br />
              {order.country}
            </address>
            {order.notes ? <p className="mt-4 border-t border-[#eef1ee] pt-3 text-xs text-ink-soft">Note: {order.notes}</p> : null}
          </Panel>

          <Panel title="Payment">
            {tx.map((t) => (
              <div key={t.id} className="border-b border-[#f1f3f1] py-2.5 text-sm last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{t.type}</span>
                  <span>{formatMoney(t.amountCents)}</span>
                </div>
                <p className="text-xs text-ink-soft">
                  {t.provider} · {t.cardBrand} •••• {t.last4} · {t.providerTxId}
                </p>
                <p className="text-xs text-ink-soft">{formatDateTime(t.createdAt)}</p>
              </div>
            ))}
            {!tx.length ? <p className="text-sm text-ink-soft">No transactions recorded.</p> : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
