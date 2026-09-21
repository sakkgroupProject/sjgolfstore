# SJ Golf Store

A production-ready, full-stack golf e-commerce platform built with **Next.js (App Router)**, **PostgreSQL** and **Drizzle ORM**.

Three layers, one deployable application:

```
Customer UI (Next.js RSC)  →  Commerce API (Server Actions + Route Handlers)  →  PostgreSQL
```

---

## 1. Features

### Storefront
- Premium U.S. golf-retail design system (forest green / charcoal / paper, editorial grids, restrained motion)
- Sticky header with mega-menu, live search suggestions, account and cart
- Homepage: hero, featured categories, featured products, value proposition, brand story, collections, best sellers, newsletter
- Eight collections with SEO URLs: golf-clubs, golf-balls, golf-gloves, golf-bags, golf-accessories, golf-apparel, training-equipment, golf-technology
- `/shop` full catalogue with faceted filters (price, availability, brand, hand, flex, size, tag), 5 sort modes, pagination
- Mobile filter/sort drawer, slide-out cart drawer, free-shipping progress bar
- Product detail: gallery with zoom + thumbnails, golf-specific variant selectors (Hand / Flex / Size), quantity, Add to Cart, Buy Now, sticky mobile CTA, specs, shipping/returns accordion, related products
- Cart page, 3-step checkout, order confirmation
- Track Order by number + email
- Legal + content pages (Refund, Privacy, Terms, Shipping, FAQ, Contact)

### Accounts & security
- Register, sign in, sign out, profile, password change, addresses, order history, order detail
- Forgot / reset password with one-time hashed tokens (1 hour expiry, single use)
- Device/session manager with per-session revoke and "sign out everywhere"
- Account activity feed

### Admin console (`/admin`)
Dashboard · Orders (status tabs, detail, fulfillment, refunds) · Products (CRUD, options/variant builder, duplicate, publish) · Collections · Import/Export (CSV) · Inventory (adjust + audit history) · Customers · Discounts · Shipping (zones/rates) · Taxes · Payments · Content CMS · Marketing · Reviews · Analytics · Reports · Staff & permissions · Notifications · SEO · Settings · System health, webhooks, jobs, audit log

---

## 2. Security

| Control | Implementation |
|---|---|
| Password storage | scrypt (N=16384, r=8, p=1), 16-byte random salt, versioned hash format, constant-time compare |
| Sessions | Opaque 256-bit token in `HttpOnly` `SameSite=Lax` `Secure` cookie; only the SHA-256 hash is stored server-side |
| Session validation | Every request resolves the cookie against the `sessions` table; revoked/expired rows are rejected |
| Session rotation | New session on sign-in, password change and reset; all other sessions revoked on password change |
| Brute force | Per-IP rate limit (8 sign-ins / 5 min) **plus** per-account lockout after 6 failures for 15 minutes |
| Registration abuse | 5 accounts / hour / IP |
| Password reset abuse | 4 requests / 15 min / IP, 8 redemptions / 15 min / IP |
| Checkout abuse | 40 orders / 10 min; Luhn card validation; live stock re-check prevents oversell |
| CSRF | `SameSite=Lax` cookies + middleware Origin/Host verification on POST/PUT/PATCH/DELETE |
| Input validation | Zod schemas on every server action (auth, checkout, contact, newsletter) |
| SQL injection | Drizzle parameterised queries exclusively |
| XSS | React auto-escaping; no `dangerouslySetInnerHTML` except JSON-LD |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| Content injection | Strict `Content-Security-Policy` (self-only default, pinned image hosts) |
| Transport | HSTS (2 years, preload, includeSubDomains), `upgrade-insecure-requests` |
| Info leakage | `X-Powered-By` removed, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` |
| Privacy | `Permissions-Policy` disables camera/mic/geolocation/payment |
| RBAC | Role checks (`admin` / `staff` / `customer`) enforced server-side in layout + every API route |
| Audit trail | Sign-in, sign-out, failures, password changes, refunds, inventory and settings changes recorded with actor + timestamp |

Admin sign-in: `admin@sjgolfstore.com` / `admin123` · Customer: `john.smith@example.com` / `password123`

> Change these immediately in any real deployment.

---

## 3. Environment variables

Copy `.env.example` to `.env`:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

`SESSION_SECRET` signs session cookies and hashes tokens. **Rotating it invalidates every session.**

---

## 4. Deploy / Run from the zip

Everything you need ships in the repository — **the full demo dataset (seeded
automatically) and every photograph (bundled in `public/images/`, zero external
dependencies, nothing can 404)**. Each product has its own unique image — no
repeats. All photos are real Pexels stock photography. Every image is documented
in **[IMAGE_MANIFEST.md](IMAGE_MANIFEST.md)** — what each photo shows, where it
appears, and how to replace it with your own photos.

```bash
npm install
npm run dev        # or: npm run build && npm start
```

That's it. On first boot (or first `/api/health` hit) the app will:

1. **Create the entire schema** if the database is empty (idempotent DDL in `src/db/tables.ts`)
2. **Seed the demo catalogue** — 55 products, 191 variants, 8 collections, 26 orders,
   customers, discounts, shipping zones, tax regions, content blocks, settings,
   audit logs, staff, webhooks

No manual migrations or seed step are required. Useful flags:

```bash
npx tsx scripts/setup.ts            # bootstrap schema + seed (no-op if data exists)
npx tsx scripts/setup.ts --reset    # wipe everything and reseed from scratch
npx drizzle-kit push                # optional: refresh schema from src/db/schema.ts
```

> The `DATABASE_URL` in `.env` must point at a reachable PostgreSQL instance.
> If you download the zip to a new machine: start Postgres, set `DATABASE_URL`,
> and the app builds its own schema and data on first boot.

### Deployment checklist
1. Set a strong, unique `SESSION_SECRET` and never commit it
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin (drives canonicals, OG tags, sitemap)
3. Point `DATABASE_URL` at the production database — schema and demo data auto-bootstrap on first request (or run `npx tsx scripts/setup.ts` first)
4. Rotate or delete the seeded demo accounts
5. Point the payment provider at `/api/webhooks/payments` and store secrets server-side only
6. Connect a transactional email provider for order/reset emails
7. Submit `https://your-domain.com/sitemap.xml` to Google Search Console
8. Verify `/api/health` returns `200` for uptime monitoring
9. Review `/admin/system` for service health, failed webhooks and jobs

### Production recommendations
- Move rate limiting from Postgres to Redis when running multiple instances
- Replace the built-in test gateway with Stripe/Adyen (server-side keys only)
- Point password-reset links at a real email provider instead of returning them in the response
- Serve through a CDN; images are already AVIF/WebP with `next/image`

---

## 5. Project structure

```
src/
├── app/
│   ├── (store)/                 storefront layout + all shop routes
│   │   ├── (auth)/account/      login, register, forgot/reset password (public)
│   │   ├── (account)/account/   dashboard, orders, addresses, profile, security (guarded)
│   │   ├── products/[slug]/     product detail
│   │   ├── [category]/          collection or content page resolver
│   │   ├── shop, cart, checkout, search, track-order
│   ├── admin/                   20-section admin console
│   ├── actions/                 server actions (auth, cart, checkout, admin, marketing)
│   ├── api/                     search, health, admin import/export
│   ├── layout.tsx, middleware.ts, sitemap.ts, robots.ts
├── components/{store,admin}/    client + server components
├── db/                          schema.ts, index.ts, seed.ts
└── lib/                         auth, cart, catalog, validation, format
```

## 6. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npx drizzle-kit push` | Apply schema to database |
#   s j g o l f s t o r e  
 