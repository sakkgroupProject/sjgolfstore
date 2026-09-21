import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

type Cat = { slug: string; name: string };

export function Footer({ categories }: { categories: Cat[] }) {
  return (
    <footer className="border-t border-line bg-forest text-white">
      <div className="wrap grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-5 lg:py-16">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-sm bg-white text-[0.8rem] font-semibold text-forest">SJ</span>
            <span className="leading-none">
              <span className="block text-[0.95rem] font-normal uppercase tracking-[0.24em]">SJ Golf Store</span>
              <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.4em] text-sand">Est. Orlando, FL</span>
            </span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Premium golf equipment for American golfers. Clubs, balls, bags, gloves, apparel, training aids and technology —
            fitted by people who play.
          </p>
          <div className="mt-7">
            <p className="eyebrow text-sand">Newsletter</p>
            <p className="mt-2 text-sm text-white/70">STAY IN THE GAME — new gear, offers and store news.</p>
            <div className="mt-3">
              <NewsletterForm source="footer" variant="dark" />
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow text-sand">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li><Link href="/shop" className="hover:text-white">Shop All</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-sand">Customer Service</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/track-order" className="hover:text-white">Track Order</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-white">Shipping Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
            <li><Link href="/account" className="hover:text-white">My Account</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-sand">Company</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-white">Shipping</Link></li>
            <li><Link href="/admin" className="hover:text-white">Store Admin</Link></li>
          </ul>
          <p className="eyebrow mt-7 text-sand">Support</p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/75">
            <li>support@sjgolfstore.com</li>
            <li>(407) 555-0100</li>
            <li>Mon–Fri, 9am–6pm ET</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/55 md:flex-row">
          <p>© {new Date().getFullYear()} SJ Golf Store. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {["VISA", "MASTERCARD", "AMEX", "PAYPAL", "APPLE PAY"].map((p) => (
              <span key={p} className="border border-white/15 px-2 py-1 text-[0.6rem] tracking-[0.12em]">
                {p}
              </span>
            ))}
          </div>
          <p className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-sand" /> Secure checkout · 256-bit SSL
          </p>
        </div>
      </div>
    </footer>
  );
}
