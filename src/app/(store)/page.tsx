import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { getCategories, listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";
import { NewsletterForm } from "@/components/store/newsletter-form";

export default async function HomePage() {
  const [blocks, categories, featured, bestSellers] = await Promise.all([
    db.select().from(contentBlocks).where(eq(contentBlocks.section, "home")),
    getCategories(),
    listProducts({ sort: "featured", perPage: 8 }),
    listProducts({ sort: "best-selling", perPage: 4 }),
  ]);
  const block = (key: string) => blocks.find((b) => b.key === key);
  const valueProp = block("value_prop");
  const story = block("story");
  const newsletter = block("newsletter");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SJ Golf Store",
    url: "https://sjgolfstore.com",
    description: "Premium golf equipment retailer based in Orlando, Florida.",
    address: { "@type": "PostalAddress", streetAddress: "2100 Magnum Ave, Suite 120", addressLocality: "Orlando", addressRegion: "FL", postalCode: "32809", addressCountry: "US" },
    contactPoint: [{ "@type": "ContactPoint", telephone: "+1-407-555-0100", contactType: "customer service" }],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative mx-auto w-full max-w-[1920px] overflow-hidden bg-paper-warm md:aspect-[1712/624]">
        <div className="relative aspect-[1080/1350] w-full md:absolute md:inset-0 md:aspect-auto">
          <Image
            src="/herosectionimage-mobile.png"
            alt="Help! Golf equipment collection"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-contain md:hidden"
          />
          <Image
            src="/herosectionimage.jpg"
            alt="Help! Golf equipment collection"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="hidden object-contain md:block"
          />
        </div>
        <div className="relative z-10 w-full bg-paper-warm px-5 py-8 text-ink md:absolute md:bottom-[15%] md:left-[8%] md:w-[42%] md:max-w-[27rem] md:bg-transparent md:p-0">
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">FUN. FUNCTION. GOLF.</h1>
          <p className="mt-2 max-w-[22rem] text-sm leading-snug md:text-sm">
            Quality golf accessories and original inventions designed to make the game more enjoyable.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex bg-[#2f7d1e] px-7 py-3 text-xs font-bold tracking-wide text-white transition hover:bg-[#256617] md:mt-4 md:px-10 md:py-3.5"
          >
            SHOP NOW
          </Link>
          <p className="mt-2 text-[0.65rem] text-ink">HELP!® is a registered trademark</p>
        </div>
      </section>

      {/* ---------------- FEATURED CATEGORIES ---------------- */}
      <section className="wrap py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured Categories</p>
            <h2 className="mt-3 text-3xl md:text-[2.6rem]">Shop by category</h2>
          </div>
          <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.18em] text-forest underline decoration-line underline-offset-[6px]">
            View everything →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-paper-warm">
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-sand">{c.tagline}</p>
                <h3 className="mt-1.5 text-xl">{c.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Shop now →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(4).map((c) => (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              className="group flex items-center justify-between border border-line px-5 py-5 transition hover:border-forest hover:bg-paper"
            >
              <span>
                <span className="block text-[0.95rem] font-semibold">{c.name}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">{c.tagline}</span>
              </span>
              <span className="text-moss transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURED PRODUCTS ---------------- */}
      <section className="bg-paper py-16 md:py-20">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Handpicked</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem]">Featured products</h2>
            </div>
            <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.18em] text-forest underline decoration-line underline-offset-[6px]">
              Shop all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {featured.items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VALUE PROPOSITION ---------------- */}
      <section className="wrap py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Value Proposition</p>
          <h2 className="mt-3 text-3xl md:text-[2.6rem]">{valueProp?.title ?? "Why shop SJ Golf?"}</h2>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {[
            { icon: "flag", title: valueProp?.data.item1Title ?? "Premium Gear", body: valueProp?.data.item1Body ?? "" },
            { icon: "box", title: valueProp?.data.item2Title ?? "Fast U.S. Shipping", body: valueProp?.data.item2Body ?? "" },
            { icon: "handshake", title: valueProp?.data.item3Title ?? "Trusted Service", body: valueProp?.data.item3Body ?? "" },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full border border-line bg-paper text-forest"><ValueIcon type={item.icon} /></div>
              <h3 className="mt-5 text-lg">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- STORY / IMAGE + TEXT ---------------- */}
      <section className="border-y border-line bg-paper-warm">
        <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-[5/5]">
            {story?.imageUrl ? (
              <Image src={story.imageUrl} alt="Golfer mid swing" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            ) : null}
          </div>
          <div>
            <p className="eyebrow">{story?.eyebrow ?? "Our Story"}</p>
            <h2 className="mt-3 text-3xl leading-tight md:text-[2.6rem]">{story?.title ?? "Built by golfers, for golfers"}</h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-soft">{story?.body}</p>
            <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
              {[
                "Every club hand-inspected before it ships",
                "Free expert fitting advice on any order",
                "Authorized dealer — full manufacturer warranty",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-forest" />
                  <span className="text-ink-soft">{line}</span>
                </li>
              ))}
            </ul>
            <Link href={story?.ctaHref || "/shop"} className="btn btn-primary mt-8">
              {story?.ctaLabel || "Shop All Equipment"}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- GOLF COLLECTIONS ---------------- */}
      <section className="wrap py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Golf Collections</p>
            <h2 className="mt-3 text-3xl md:text-[2.6rem]">Eight ways to build your bag</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { cat: categories[0], img: categories[0]?.imageUrl, span: "lg:col-span-2 lg:row-span-2 aspect-[4/3] lg:aspect-auto" },
            { cat: categories[1], img: categories[1]?.imageUrl, span: "" },
            { cat: categories[3], img: categories[3]?.imageUrl, span: "" },
            { cat: categories[5], img: categories[5]?.imageUrl, span: "" },
            { cat: categories[6], img: categories[6]?.imageUrl, span: "" },
          ].map(({ cat, img, span }) =>
            cat ? (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className={`group relative overflow-hidden bg-paper-warm ${span}`}
              >
                <div className="relative h-full min-h-[13rem] w-full">
                  <Image src={img} alt={cat.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-xl text-white">{cat.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/65">{cat.tagline}</p>
                  </div>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      </section>

      {/* ---------------- BEST SELLERS ---------------- */}
      <section className="border-t border-line bg-white py-16 md:py-20">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Most wanted</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem]">Best sellers this season</h2>
            </div>
            <Link href="/shop?sort=best-selling" className="text-xs font-semibold uppercase tracking-[0.18em] text-forest underline decoration-line underline-offset-[6px]">
              See all best sellers →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {bestSellers.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- NEWSLETTER ---------------- */}
      <section className="bg-forest text-white">
        <div className="wrap grid gap-10 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow text-sand">{newsletter?.eyebrow ?? "Newsletter"}</p>
            <h2 className="mt-3 text-3xl md:text-[2.6rem]">{newsletter?.title ?? "STAY IN THE GAME"}</h2>
            <p className="mt-4 max-w-md text-white/75">{newsletter?.subtitle}</p>
          </div>
          <div className="md:pt-10">
            <NewsletterForm source="homepage" variant="dark" />
          </div>
        </div>
      </section>
    </>
  );
}

function ValueIcon({ type }: { type: string }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true } as const;
  if (type === "box") return <svg {...common}><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></svg>;
  if (type === "handshake") return <svg {...common}><path d="m4 12 3-3 4 1 2-2 4 1 3 3-3 3-3-2-2 2-4-3-2 2-2-2Z" /><path d="m7 9 2-2 3 1M17 9l2-2" /></svg>;
  return <svg {...common}><path d="M6 21V4M6 5c4-3 7 3 12 0v9c-5 3-8-3-12 0" /><path d="M3 21h6" /></svg>;
}
