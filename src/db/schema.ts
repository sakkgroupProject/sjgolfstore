import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ *
 * Catalog
 * ------------------------------------------------------------------ */

export type ProductImage = { url: string; alt: string };

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  brand: text("brand").notNull().default("SJ Golf"),
  shortDescription: text("short_description").notNull().default(""),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id").notNull(),
  productType: text("product_type").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(0),
  compareAtCents: integer("compare_at_cents"),
  costCents: integer("cost_cents").notNull().default(0),
  sku: text("sku").notNull().default(""),
  barcode: text("barcode").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  images: jsonb("images").$type<ProductImage[]>().notNull().default([]),
  videoUrl: text("video_url").notNull().default(""),
  specs: jsonb("specs").$type<{ label: string; value: string }[]>().notNull().default([]),
  gender: text("gender").notNull().default(""),
  clubType: text("club_type").notNull().default(""),
  shaft: text("shaft").notNull().default(""),
  loft: text("loft").notNull().default(""),
  weightGrams: integer("weight_grams").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  unitsSold: integer("units_sold").notNull().default(0),
  views: integer("views").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Configurable options, e.g. Hand / Flex / Size */
export const productOptions = pgTable("product_options", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  values: jsonb("values").$type<string[]>().notNull().default([]),
  position: integer("position").notNull().default(0),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  title: text("title").notNull(),
  sku: text("sku").notNull().default(""),
  barcode: text("barcode").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(0),
  compareAtCents: integer("compare_at_cents"),
  costCents: integer("cost_cents").notNull().default(0),
  options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
  inventoryQty: integer("inventory_qty").notNull().default(0),
  weightGrams: integer("weight_grams").notNull().default(0),
  imageUrl: text("image_url").notNull().default(""),
  allowBackorder: boolean("allow_backorder").notNull().default(false),
  position: integer("position").notNull().default(0),
});

/* ------------------------------------------------------------------ *
 * Customers
 * ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("customer"), // customer | staff | admin
  status: text("status").notNull().default("active"), // active | disabled
  notes: text("notes").notNull().default(""),
  acceptsMarketing: boolean("accepts_marketing").notNull().default(false),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Server-side session store — every request is validated against this table. */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  ip: text("ip").notNull().default(""),
  userAgent: text("user_agent").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Persistent, multi-instance safe rate limiting. */
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: text("label").notNull().default("Home"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  company: text("company").notNull().default(""),
  address1: text("address1").notNull().default(""),
  address2: text("address2").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  country: text("country").notNull().default("United States"),
  phone: text("phone").notNull().default(""),
  isDefault: boolean("is_default").notNull().default(false),
});

/* ------------------------------------------------------------------ *
 * Cart + Orders
 * ------------------------------------------------------------------ */

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id"),
  discountCode: text("discount_code").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id"),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  address1: text("address1").notNull().default(""),
  address2: text("address2").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  country: text("country").notNull().default("United States"),
  shippingMethod: text("shipping_method").notNull().default("Standard Shipping"),
  shippingCents: integer("shipping_cents").notNull().default(0),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  discountCode: text("discount_code").notNull().default(""),
  taxRate: integer("tax_rate").notNull().default(0), // basis points
  paymentStatus: text("payment_status").notNull().default("pending"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("unfulfilled"),
  status: text("status").notNull().default("open"),
  carrier: text("carrier").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  notes: text("notes").notNull().default(""),
  isGuest: boolean("is_guest").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id").notNull(),
  title: text("title").notNull(),
  variantTitle: text("variant_title").notNull().default(""),
  sku: text("sku").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
});

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull().default(""),
  actor: text("actor").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  provider: text("provider").notNull().default("SJ Pay"),
  providerTxId: text("provider_tx_id").notNull().default(""),
  type: text("type").notNull().default("sale"), // sale | refund | capture | failure
  amountCents: integer("amount_cents").notNull().default(0),
  status: text("status").notNull().default("success"),
  cardBrand: text("card_brand").notNull().default("Visa"),
  last4: text("last4").notNull().default("4242"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Marketing, operations, config
 * ------------------------------------------------------------------ */

export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("percentage"), // percentage | fixed | free_shipping | bxgy
  value: integer("value").notNull().default(0),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  buyQuantity: integer("buy_quantity").notNull().default(0),
  getQuantity: integer("get_quantity").notNull().default(0),
  appliesTo: text("applies_to").notNull().default("all"), // all | products | collections
  appliesToRef: text("applies_to_ref").notNull().default(""),
  usageLimit: integer("usage_limit").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  status: text("status").notNull().default("active"), // active | scheduled | expired | disabled
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  countries: jsonb("countries").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
});

export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("flat"), // flat | weight | price
  priceCents: integer("price_cents").notNull().default(0),
  freeOverCents: integer("free_over_cents"),
  transitDays: text("transit_days").notNull().default("3-7 business days"),
  isActive: boolean("is_active").notNull().default(true),
});

export const taxRegions = pgTable("tax_regions", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  label: text("label").notNull().default(""),
  rateBps: integer("rate_bps").notNull().default(0), // basis points
  isActive: boolean("is_active").notNull().default(true),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("subscribed"),
  source: text("source").notNull().default("footer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactEnquiries = pgTable("contact_enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contentBlocks = pgTable("content_blocks", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  section: text("section").notNull().default("home"),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaHref: text("cta_href").notNull().default(""),
  data: jsonb("data").$type<Record<string, string>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  customerName: text("customer_name").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("approved"), // pending | approved | rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryHistory = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id").notNull(),
  productName: text("product_name").notNull().default(""),
  variantTitle: text("variant_title").notNull().default(""),
  sku: text("sku").notNull().default(""),
  previousQty: integer("previous_qty").notNull().default(0),
  newQty: integer("new_qty").notNull().default(0),
  adjustment: integer("adjustment").notNull().default(0),
  reason: text("reason").notNull().default("Stock received"),
  actor: text("actor").notNull().default("admin"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffUsers = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("Order Manager"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  status: text("status").notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull().default("admin"),
  action: text("action").notNull(),
  resource: text("resource").notNull().default(""),
  detail: text("detail").notNull().default(""),
  ip: text("ip").notNull().default("127.0.0.1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("order"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  href: text("href").notNull().default(""),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  group: text("group").notNull().default("store"),
  label: text("label").notNull().default(""),
});

export const searchSynonyms = pgTable("search_synonyms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  synonyms: jsonb("synonyms").$type<string[]>().notNull().default([]),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull().default(""),
  status: text("status").notNull().default("healthy"),
  lastReceivedAt: timestamp("last_received_at", { withTimezone: true }),
  failureCount: integer("failure_count").notNull().default(0),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("completed"),
  durationMs: integer("duration_ms").notNull().default(0),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type ContentBlock = typeof contentBlocks.$inferSelect;
