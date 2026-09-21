import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, shippingRates, shippingZones } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { computeTotals, getCartLines, getExistingCart } from "@/lib/cart";
import { CheckoutClient } from "@/components/store/checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout at SJ Golf Store.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await getExistingCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  const totals = cart
    ? await computeTotals({ lines, discountCode: cart.discountCode })
    : { subtotalCents: 0, discountCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0, itemCount: 0 };

  const zoneRows = await db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
  const usZone = zoneRows.find((z) => z.countries.includes("United States"));
  const rates = usZone
    ? await db.select().from(shippingRates).where(eq(shippingRates.zoneId, usZone.id))
    : [];

  const user = await getCurrentUser();
  const userAddresses = user ? await db.select().from(addresses).where(eq(addresses.userId, user.id)) : [];

  return (
    <CheckoutClient
      lines={lines.map((l) => ({
        id: l.id,
        title: l.title,
        variantTitle: l.variantTitle,
        slug: l.slug,
        imageUrl: l.imageUrl,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        lineTotalCents: l.lineTotalCents,
      }))}
      rates={rates.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        priceCents: r.priceCents,
        transitDays: r.transitDays,
      }))}
      initialTotals={totals}
      user={user ? { email: user.email, firstName: user.firstName, lastName: user.lastName } : null}
      addresses={userAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        firstName: a.firstName,
        lastName: a.lastName,
        address1: a.address1,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        phone: a.phone,
      }))}
      initialDiscount={cart?.discountCode ?? ""}
    />
  );
}
