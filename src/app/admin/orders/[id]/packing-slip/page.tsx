import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { PrintButton } from "../invoice/print-button";

export const dynamic = "force-dynamic";

export default async function PackingSlipPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  const order = rows[0];
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <div className="bg-white text-black min-h-[80vh] p-8 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">PACKING SLIP</h1>
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
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Ship To:</h3>
            <p className="text-gray-700 text-base leading-relaxed font-medium">
              {order.firstName} {order.lastName}<br />
              {order.address1}{order.address2 ? <><br />{order.address2}</> : ""}<br />
              {order.city}, {order.state} {order.postalCode}<br />
              {order.country}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Order Details:</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Shipping Method: <strong className="uppercase">{order.shippingMethod}</strong><br />
              Email: {order.email}<br />
              Phone: {order.phone || "N/A"}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mb-10 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Customer Notes:</h3>
            <p className="text-gray-700 text-sm italic">{order.notes}</p>
          </div>
        )}

        <table className="w-full text-left text-sm mb-10 border-collapse">
          <thead>
            <tr className="border-b border-gray-400 bg-gray-50">
              <th className="py-3 px-4 font-bold text-gray-900 w-24 text-center">Packed</th>
              <th className="py-3 px-2 font-bold text-gray-900 text-center">Qty</th>
              <th className="py-3 px-4 font-bold text-gray-900">Item Description</th>
              <th className="py-3 px-4 font-bold text-gray-900">SKU</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-4 px-4 text-center">
                  <div className="w-6 h-6 border-2 border-gray-400 rounded mx-auto"></div>
                </td>
                <td className="py-4 px-2 text-center text-lg font-bold">{item.quantity}</td>
                <td className="py-4 px-4">
                  <p className="font-semibold text-gray-900 text-base">{item.title}</p>
                  {item.variantTitle && <p className="text-gray-600 text-sm mt-1">Variant: <strong>{item.variantTitle}</strong></p>}
                </td>
                <td className="py-4 px-4 text-gray-600 font-mono text-xs">{item.sku}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-800">Enjoy your gear!</p>
          <p>Please inspect your items upon arrival. For returns or issues, contact support@sjgolf.com</p>
          
          <PrintButton label="Print Packing Slip" />
        </div>
      </div>
    </div>
  );
}
