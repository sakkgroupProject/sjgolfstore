import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, users } from "@/db/schema";
import { formatDateTime, formatMoney } from "@/lib/format";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  const order = rows[0];
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <div className="bg-white text-black min-h-[80vh] p-8 print:p-0">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          nav, aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; background: white !important; width: 100% !important; max-width: 100% !important; }
          .admin-shell-container { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          body { font-size: 12pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-container { max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}} />

      <div className="print-container max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm p-10">
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">INVOICE</h1>
            <p className="text-gray-500 mt-1">Order #{order.orderNumber}</p>
            <p className="text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">SJ Golf Store</h2>
            <p className="text-gray-500 mt-1 text-sm">
              123 Fairway Drive<br />
              Augusta, GA 30904<br />
              support@sjgolf.com
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Billed To:</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>{order.firstName} {order.lastName}</strong><br />
              {order.address1}{order.address2 ? <><br />{order.address2}</> : ""}<br />
              {order.city}, {order.state} {order.postalCode}<br />
              {order.country}<br />
              {order.email}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Payment Info:</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Status: <strong className="uppercase">{order.paymentStatus}</strong><br />
              Method: SJ Pay (Credit Card)<br />
              Amount Paid: {formatMoney(order.totalCents)}
            </p>
          </div>
        </div>

        <table className="w-full text-left text-sm mb-10 border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 font-semibold text-gray-900">Item</th>
              <th className="py-3 font-semibold text-gray-900">SKU</th>
              <th className="py-3 font-semibold text-gray-900 text-center">Qty</th>
              <th className="py-3 font-semibold text-gray-900 text-right">Unit Price</th>
              <th className="py-3 font-semibold text-gray-900 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  {item.variantTitle && <p className="text-gray-500 text-xs mt-1">{item.variantTitle}</p>}
                </td>
                <td className="py-4 text-gray-500">{item.sku}</td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right text-gray-700">{formatMoney(item.unitPriceCents)}</td>
                <td className="py-4 text-right font-medium text-gray-900">{formatMoney(item.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="w-full max-w-sm ml-auto text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatMoney(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100 text-green-600">
              <span>Discount ({order.discountCode})</span>
              <span>-{formatMoney(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Shipping ({order.shippingMethod})</span>
            <span className="font-medium text-gray-900">{order.shippingCents > 0 ? formatMoney(order.shippingCents) : "Free"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium text-gray-900">{formatMoney(order.taxCents)}</span>
          </div>
          <div className="flex justify-between py-4 mt-2">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for shopping with SJ Golf Store!</p>
          <p>If you have any questions about this invoice, please contact support@sjgolf.com</p>

          <PrintButton label="Print Invoice" />
        </div>
      </div>
    </div>
  );
}
