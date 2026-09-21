import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { ContactForm } from "./contact-form";

export async function StaticPageView({ slug }: { slug: string }) {
  const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  const page = rows[0];
  if (!page) notFound();

  const paragraphs = page.body.split("\n\n");

  return (
    <div className="wrap max-w-4xl py-14 md:py-20">
      <p className="eyebrow">SJ Golf Store</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{page.title}</h1>
      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft">
            {p}
          </p>
        ))}
      </div>
      {slug === "contact" ? (
        <div className="mt-12 border-t border-line pt-10">
          <h2 className="text-2xl">Send us a message</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Our Orlando team answers every enquiry within one business day.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      ) : null}
      {slug === "faq" ? (
        <div className="mt-12 border-t border-line pt-8 text-sm">
          <p className="text-ink-soft">
            Still stuck? Email{" "}
            <a href="/contact" className="font-semibold text-forest underline decoration-line underline-offset-4">
              our support team
            </a>{" "}
            and we will help you find the right gear.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export async function getStaticPage(slug: string) {
  const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export const staticPageMetadata = (title: string, description: string): Metadata => ({ title, description });
