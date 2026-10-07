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
    description: "Premium golf equipment retailer based in Miami, Florida.",
    address: { "@type": "PostalAddress", streetAddress: "8440 South Dixie Highway, Unit 1505", addressLocality: "Miami", addressRegion: "FL", postalCode: "33143", addressCountry: "US" },
    contactPoint: [{ "@type": "ContactPoint", telephone: "+1-786-600-5554", contactType: "customer service" }],
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
            src="/herosectionimage.png"
            alt="Help! Golf equipment collection"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="hidden object-contain md:block"
          />
        </div>
        <div className="relative z-10 w-full bg-paper-warm px-5 py-8 text-ink md:absolute md:bottom-[15%] md:left-[8%] md:w-[42%] md:max-w-[27rem] md:bg-transparent md:p-0">
          <h1 className="text-2xl font-bold leading-tight md:text-xl lg:text-2xl xl:text-[1.75rem] 2xl:text-3xl">FUN. FUNCTION. GOLF.</h1>
          <p className="mt-2 max-w-[22rem] text-sm leading-snug md:mt-1 lg:mt-1 xl:mt-2 md:text-[0.7rem] lg:text-xs xl:text-[0.8rem] 2xl:text-sm">
            Quality golf accessories and original inventions designed to make the game more enjoyable.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex bg-[#2f7d1e] px-7 py-3 text-xs font-bold tracking-wide text-white transition hover:bg-[#256617] md:mt-2 lg:mt-3 xl:mt-4 md:px-4 lg:px-6 xl:px-8 2xl:px-10 md:py-1.5 lg:py-2 xl:py-2.5 2xl:py-3.5 md:text-[0.6rem] lg:text-[0.65rem] xl:text-xs"
          >
            SHOP NOW
          </Link>
          <p className="mt-2 text-[0.65rem] text-ink md:mt-1 lg:mt-1.5 md:text-[0.5rem] lg:text-[0.55rem] 2xl:text-[0.65rem] text-white">HELP!® is a registered trademark</p>
        </div>
      </section>

      {/* ---------------- FEATURED CATEGORIES ---------------- */}
      <section className="py-16 md:py-20 overflow-hidden">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured Categories</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem]">Shop by category</h2>
            </div>
            <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.18em] text-forest underline decoration-line underline-offset-[6px]">
              View everything →
            </Link>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="mt-10 max-w-7xl mx-auto">
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-8 pt-2 px-4 sm:px-8 lg:px-12 snap-x snap-mandatory custom-scrollbar" style={{ scrollPaddingLeft: "1rem" }}>
            {categories.map((c) => (
              <Link key={c.id} href={`/${c.slug}`} className="group relative block aspect-[4/5] w-[180px] sm:w-[220px] lg:w-[16vw] flex-none snap-start overflow-hidden bg-paper-warm shadow-sm">
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 16vw"
                  className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-sand">{c.tagline || c.name}</p>
                  <h3 className="mt-1.5 text-xl font-medium tracking-wide">{c.name}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Shop now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FEATURED PRODUCTS ---------------- */}
      <section className="border-t border-line bg-white py-16 md:py-20">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Handpicked</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem]">Featured products</h2>
            </div>
            <Link href="/shop?sort=featured" className="text-xs font-semibold uppercase tracking-[0.18em] text-forest underline decoration-line underline-offset-[6px]">
              See all featured →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {featured.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- BEST SELLERS ---------------- */}

      {/* ---------------- PASADA GOLF KICKBACK SPOTLIGHT ---------------- */}
      <section className="bg-forest text-white py-16 md:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-2 lg:gap-20 items-center">
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <p className="eyebrow text-sand">Product Spotlight</p>
            <h2 className="mt-4 text-3xl md:text-4xl">The Pasada Golf Kickback</h2>
            <p className="mt-6 text-white/80 leading-relaxed">
              Experience the ultimate practice companion. The Pasada Golf Kickback is engineered to deliver perfect ball returns, allowing you to focus entirely on your stroke without breaking your rhythm. Whether you are practicing at home or on the green, its durable, responsive design ensures you get the most out of every session.
            </p>
            <Link href="/kick-back" className="btn btn-light mt-8 self-start px-8 py-3">
              Shop The Kickback
            </Link>
          </div>
          <div className="relative aspect-video w-full rounded-sm overflow-hidden bg-black/20 shadow-2xl order-1 lg:order-2">
            <video
              src="/pasadagolfkickback.mp4"
              autoPlay
              muted
              loop
              controls
              playsInline
              className="w-full h-full object-cover"
              title="Pasada Golf Kickback Demo"
            />
          </div>
        </div>
      </section>

      {/* ---------------- VALUE PROPS ---------------- */}
      <section className="border-t border-line bg-paper-warm py-16 md:py-24">
        <div className="wrap text-center">
          <p className="eyebrow">{valueProp?.eyebrow ?? "Why shop SJ Golf?"}</p>
          <h2 className="mt-4 text-3xl md:text-4xl">{valueProp?.title ?? "Premium Gear & Trusted Service"}</h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="flex flex-col items-center">
              <span className="grid size-12 place-items-center rounded-full bg-forest text-white">
                <ValueIcon type="box" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">Premium Gear</h3>
              <p className="mt-2 max-w-[16rem] text-sm text-ink-soft">Tour-level equipment, vetted by our fitting team.</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="grid size-12 place-items-center rounded-full bg-forest text-white">
                <ValueIcon type="truck" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">Fast U.S. Shipping</h3>
              <p className="mt-2 max-w-[16rem] text-sm text-ink-soft">Orders over $100 ship free, most leave same day.</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="grid size-12 place-items-center rounded-full bg-forest text-white">
                <ValueIcon type="handshake" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">Trusted Service</h3>
              <p className="mt-2 max-w-[16rem] text-sm text-ink-soft">Real golfers answer the phone. 30-day returns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- STORY ---------------- */}
      <section className="bg-white py-16 md:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-square w-full bg-paper-warm overflow-hidden">
            <Image src="/banner.avif" alt="SJ Golf Store" fill className="object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">{story?.eyebrow ?? "Our Story"}</p>
            <h2 className="mt-4 text-3xl md:text-4xl">{story?.title ?? "Built by golfers, for golfers"}</h2>
            <div className="prose prose-sm mt-6 text-ink-soft" dangerouslySetInnerHTML={{ __html: story?.body ?? "<p>SJ Golf Store started in a 400 square foot shop in Miami with one fitting bay and a simple idea: sell the gear we actually play. Today we stock the full line of clubs, balls, bags and apparel — and we still fit every order like it is going in our own bag.</p><ul><li>Every club hand-inspected before it ships</li><li>Free expert fitting advice on any order</li><li>Authorized dealer — full manufacturer warranty</li></ul>" }} />
            <Link href="/shop" className="btn btn-primary mt-8 self-start">
              Shop All Equipment
            </Link>
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
    </>
  );
}

function ValueIcon({ type }: { type: string }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true } as const;
  if (type === "box") return <svg {...common}><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></svg>;
  if (type === "handshake") return <svg {...common}><path d="m4 12 3-3 4 1 2-2 4 1 3 3-3 3-3-2-2 2-4-3-2 2-2-2Z" /><path d="m7 9 2-2 3 1M17 9l2-2" /></svg>;
  return <svg {...common}><path d="M6 21V4M6 5c4-3 7 3 12 0v9c-5 3-8-3-12 0" /><path d="M3 21h6" /></svg>;
}
