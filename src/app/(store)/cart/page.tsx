import type { Metadata } from "next";
import { getCartLines, computeTotals, getExistingCart } from "@/lib/cart";
import { CartClient } from "@/components/store/cart-client";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the golf equipment in your SJ Golf Store cart.",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const cart = await getExistingCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  const totals = cart
    ? await computeTotals({ lines, discountCode: cart.discountCode })
    : { subtotalCents: 0, discountCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0, itemCount: 0 };

  return (
    <>
      <div className="border-b border-line bg-paper">
        <div className="wrap py-10">
          <p className="eyebrow">Shopping Cart</p>
          <h1 className="mt-2 text-3xl md:text-4xl">Your Cart</h1>
        </div>
      </div>
      <CartClient
        rows={lines}
        initialCode={cart?.discountCode ?? ""}
        totals={{
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          shippingCents: totals.shippingCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
        }}
      />
    </>
  );
}
