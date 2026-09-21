# SJ Golf Store

**SJ Golf Store** is a full-stack golf e-commerce platform created by **Sakk Group**. It provides a customer storefront, secure accounts, shopping cart and checkout flows, and a complete administration console for managing products, inventory, orders, customers, content, and store operations.

## Overview

The application is built as one Next.js application with a PostgreSQL database:

```text
Storefront and Admin UI
          |
Next.js Server Actions and API Routes
          |
PostgreSQL + Drizzle ORM
```

## Main Features

### Storefront

- Responsive golf equipment storefront
- Homepage hero, categories, featured products, story, and newsletter sections
- Eight product categories and a complete shop catalogue
- Product search with live suggestions
- Filtering by price, brand, stock, hand, flex, size, tags, and sale status
- Product galleries with thumbnails and zoom support
- Product variants such as hand, flex, size, and pack options
- Cart drawer, cart page, and free-shipping progress indicator
- Checkout, order confirmation, and order tracking
- Refund, privacy, terms, shipping, FAQ, and contact pages

### Customer Accounts

- Registration and login
- Secure logout and session management
- Profile and password management
- Saved addresses
- Order history and order details
- Active-session management
- Forgot-password and reset-password flow

### Admin Console

Available at `/admin` for authorized staff:

- Dashboard and analytics
- Product creation and editing
- Automatic SKU and barcode generation for new products
- Product image upload with preview and removal
- Product options, variants, prices, and inventory
- Orders, fulfillment, refunds, and payments
- Customers and staff management
- Collections and catalogue management
- Discounts, shipping, and tax settings
- Homepage content management
- Reviews, marketing, reports, SEO, notifications, and system health
- CSV import and export
- Audit history for important administrative actions

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL
- Drizzle ORM
- Tailwind CSS 4
- ImageKit for uploaded media
- Zod validation
- Node.js

## Images and Media

Product and website images are stored as URLs and rendered through database/API responses. The repository includes the local catalogue image files in `public/images` so the site can display the seeded catalogue without depending on external image URLs.

The admin upload flow uses ImageKit:

1. An administrator selects an image in the admin panel.
2. The browser sends the file to `/api/upload`.
3. The server uploads the file to ImageKit.
4. The returned ImageKit URL is saved with the product or content record.
5. The storefront reads and displays the saved URL from the database.

See [IMAGE_MANIFEST.md](IMAGE_MANIFEST.md) for the image inventory and image replacement guidance.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- An ImageKit account for admin media uploads

## Installation

Install dependencies:

```bash
npm install
```

Create a local environment file named `.env` in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id
```

Never commit `.env` or private keys. Use `.env.example` as the shareable configuration template when available.

## Database Setup

Bootstrap the schema and demo data:

```bash
npx tsx scripts/setup.ts
```

To reset the local database and seed it again:

```bash
npx tsx scripts/setup.ts --reset
```

The seeded catalogue contains:

- 55 products
- 191 variants
- 8 categories
- Demo customers, orders, discounts, content blocks, settings, and operational records

Use a separate database for development and production. Do not run the reset command against a production database.

## Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

Health check:

```text
GET /api/health
```

The health route verifies database connectivity and bootstraps a new empty database when required.

## Project Structure

```text
src/
├── app/
│   ├── (store)/          Storefront, account, checkout, and product routes
│   ├── admin/             Admin console pages
│   ├── actions/           Server actions for auth, cart, checkout, and admin
│   └── api/               Upload, search, health, import, and export routes
├── components/
│   ├── admin/             Admin UI and forms
│   └── store/             Storefront UI and client interactions
├── db/                    Drizzle schema, database connection, tables, and seed data
└── lib/                   Authentication, catalogue, cart, validation, and formatting
public/
└── images/                Bundled product and storefront images
scripts/
└── setup.ts               Database bootstrap and seed command
```

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint |
| `npx tsx scripts/setup.ts` | Create tables and seed demo data |
| `npx drizzle-kit push` | Apply the Drizzle schema to PostgreSQL |

## Security Notes

- Passwords are hashed before storage.
- Sessions use secure HTTP-only cookies.
- Server actions validate submitted data with Zod.
- Database queries use Drizzle's parameterized query APIs.
- Admin access is protected by server-side role checks.
- Important authentication and admin actions are written to the audit log.
- Replace all demo credentials before production use.
- Use a strong, unique `SESSION_SECRET` in every environment.

## Ownership

Created and maintained by **Sakk Group**.

SJ Golf Store is a Sakk Group commerce project focused on a reliable, polished, and maintainable online golf retail experience.
