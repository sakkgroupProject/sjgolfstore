import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sjgolfstore.com";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const display = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SJ Golf Store | Premium Golf Equipment",
    template: "%s | SJ Golf Store",
  },
  description:
    "Premium golf clubs, balls, bags, gloves, apparel, training aids and technology. Free U.S. shipping on orders over $100.",
  keywords: ["golf clubs", "golf balls", "golf bags", "golf gloves", "golf apparel", "golf store"],
  applicationName: "SJ Golf Store",
  authors: [{ name: "SJ Golf Store" }],
  openGraph: {
    type: "website",
    siteName: "SJ Golf Store",
    locale: "en_US",
    title: "SJ Golf Store | Premium Golf Equipment",
    description: "Premium golf equipment built for your next round. Free U.S. shipping over $100.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "SJ Golf Store | Premium Golf Equipment",
    description: "Premium golf equipment built for your next round.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#14392c",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-white text-ink antialiased">{children}</body>
    </html>
  );
}
