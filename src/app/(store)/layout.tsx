import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { computeTotals, getCartLines, getExistingCart } from "@/lib/cart";
import { ensureSeeded } from "@/db/seed";
import { CartProvider } from "@/components/store/cart-provider";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const [categories, user] = await Promise.all([getCategories(), getCurrentUser()]);
  const cart = await getExistingCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  const totals = cart
    ? await computeTotals({ lines, discountCode: cart.discountCode })
    : {
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        taxCents: 0,
        totalCents: 0,
        itemCount: 0,
        discountCode: "",
        discountLabel: "",
      };

  return (
    <CartProvider
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
      totals={{
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        itemCount: totals.itemCount,
        discountCode: totals.discountCode,
        discountLabel: totals.discountLabel,
      }}
    >
      <Header
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, tagline: c.tagline }))}
        cartCount={totals.itemCount}
        isLoggedIn={Boolean(user)}
        firstName={user?.firstName ?? ""}
      />
      <main className="min-h-[60vh]">{children}</main>
      <Footer categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
    </CartProvider>
  );
}
