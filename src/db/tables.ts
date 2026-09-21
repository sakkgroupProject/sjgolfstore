/**
 * Idempotent DDL that mirrors src/db/schema.ts.
 *
 * Running this on a brand-new database makes the project zero-config:
 * download the repo → npm install → npm run dev → done.
 * `CREATE TABLE IF NOT EXISTS` is safe to run on every boot and does not
 * disturb data managed by `drizzle-kit push` in existing deployments.
 */
export const TABLE_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    seo_title TEXT NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'SJ Golf',
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category_id INTEGER NOT NULL,
    product_type TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL DEFAULT 0,
    compare_at_cents INTEGER,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    sku TEXT NOT NULL DEFAULT '',
    barcode TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    images JSONB NOT NULL DEFAULT '[]',
    video_url TEXT NOT NULL DEFAULT '',
    specs JSONB NOT NULL DEFAULT '[]',
    gender TEXT NOT NULL DEFAULT '',
    club_type TEXT NOT NULL DEFAULT '',
    shaft TEXT NOT NULL DEFAULT '',
    loft TEXT NOT NULL DEFAULT '',
    weight_grams INTEGER NOT NULL DEFAULT 0,
    rating_sum INTEGER NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    units_sold INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    seo_title TEXT NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS product_options (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    values JSONB NOT NULL DEFAULT '[]',
    position INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    barcode TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL DEFAULT 0,
    compare_at_cents INTEGER,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    options JSONB NOT NULL DEFAULT '{}',
    inventory_qty INTEGER NOT NULL DEFAULT 0,
    weight_grams INTEGER NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL DEFAULT '',
    allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT NOT NULL DEFAULT '',
    accepts_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    ip TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT 'Home',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    address1 TEXT NOT NULL DEFAULT '',
    address2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT 'United States',
    phone TEXT NOT NULL DEFAULT '',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
  )`,

  `CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    discount_code TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    address1 TEXT NOT NULL DEFAULT '',
    address2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT 'United States',
    shipping_method TEXT NOT NULL DEFAULT 'Standard Shipping',
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    discount_code TEXT NOT NULL DEFAULT '',
    tax_rate INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
    status TEXT NOT NULL DEFAULT 'open',
    carrier TEXT NOT NULL DEFAULT '',
    tracking_number TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    variant_title TEXT NOT NULL DEFAULT '',
    sku TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS order_events (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    actor TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    provider TEXT NOT NULL DEFAULT 'SJ Pay',
    provider_tx_id TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'sale',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    card_brand TEXT NOT NULL DEFAULT 'Visa',
    last4 TEXT NOT NULL DEFAULT '4242',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'percentage',
    value INTEGER NOT NULL DEFAULT 0,
    min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
    buy_quantity INTEGER NOT NULL DEFAULT 0,
    get_quantity INTEGER NOT NULL DEFAULT 0,
    applies_to TEXT NOT NULL DEFAULT 'all',
    applies_to_ref TEXT NOT NULL DEFAULT '',
    usage_limit INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS shipping_zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    countries JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`,

  `CREATE TABLE IF NOT EXISTS shipping_rates (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'flat',
    price_cents INTEGER NOT NULL DEFAULT 0,
    free_over_cents INTEGER,
    transit_days TEXT NOT NULL DEFAULT '3-7 business days',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`,

  `CREATE TABLE IF NOT EXISTS tax_regions (
    id SERIAL PRIMARY KEY,
    region TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    rate_bps INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`,

  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'subscribed',
    source TEXT NOT NULL DEFAULT 'footer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS contact_enquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS content_blocks (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    section TEXT NOT NULL DEFAULT 'home',
    eyebrow TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    cta_label TEXT NOT NULL DEFAULT '',
    cta_href TEXT NOT NULL DEFAULT '',
    data JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE
  )`,

  `CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    seo_title TEXT NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 5,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_history (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL,
    product_name TEXT NOT NULL DEFAULT '',
    variant_title TEXT NOT NULL DEFAULT '',
    sku TEXT NOT NULL DEFAULT '',
    previous_qty INTEGER NOT NULL DEFAULT 0,
    new_qty INTEGER NOT NULL DEFAULT 0,
    adjustment INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'Stock received',
    actor TEXT NOT NULL DEFAULT 'admin',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS staff_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Order Manager',
    permissions JSONB NOT NULL DEFAULT '[]',
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    resource TEXT NOT NULL DEFAULT '',
    detail TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'order',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    href TEXT NOT NULL DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT '',
    "group" TEXT NOT NULL DEFAULT 'store',
    label TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS search_synonyms (
    id SERIAL PRIMARY KEY,
    term TEXT NOT NULL,
    synonyms JSONB NOT NULL DEFAULT '[]'
  )`,

  `CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'healthy',
    last_received_at TIMESTAMPTZ,
    failure_count INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    duration_ms INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Performance indexes (idempotent)
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_updated ON products (updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_options_product ON product_options (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product ON variants (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_stock ON variants (inventory_qty)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_history_variant ON inventory_history (variant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (is_read)`,
];
