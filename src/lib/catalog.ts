import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, productOptions, variants, type Category, type Product } from "@/db/schema";

export type ProductCardData = {
  id: number;
  slug: string;
  title: string;
  brand: string;
  shortDescription: string;
  productType: string;
  categorySlug: string;
  categoryName: string;
  priceCents: number;
  compareAtCents: number | null;
  imageUrl: string;
  hoverImageUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  totalInventory: number;
  tags: string[];
  variantSummary: string;
  unitsSold: number;
  createdAt: Date;
  isFeatured: boolean;
};

export type ProductFilters = {
  category?: string;
  brands?: string[];
  hands?: string[];
  flexes?: string[];
  sizes?: string[];
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
  q?: string;
  sort?: string;
  page?: number;
  perPage?: number;
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

async function attachVariants(rows: { product: Product; category: Category | null }[]): Promise<ProductCardData[]> {
  const ids = rows.map((r) => r.product.id);
  const allVariants = ids.length
    ? await db.select().from(variants).where(inArray(variants.productId, ids)).orderBy(asc(variants.position))
    : [];
  const allOptions = ids.length
    ? await db.select().from(productOptions).where(inArray(productOptions.productId, ids))
    : [];

  return rows.map(({ product, category }) => {
    const pv = allVariants.filter((v) => v.productId === product.id);
    const priceCents = pv.length ? Math.min(...pv.map((v) => v.priceCents)) : product.priceCents;
    const compareCandidates = pv.map((v) => v.compareAtCents).filter((c): c is number => typeof c === "number");
    const compareAtCents = compareCandidates.length ? Math.max(...compareCandidates) : product.compareAtCents;
    const totalInventory = pv.reduce((s, v) => s + v.inventoryQty, 0);
    const opts = allOptions.filter((o) => o.productId === product.id);
    const variantSummary = opts.map((o) => o.name).join(" · ");
    const rating = product.reviewCount ? Math.round((product.ratingSum / product.reviewCount) * 10) / 10 : 0;
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      shortDescription: product.shortDescription,
      productType: product.productType,
      categorySlug: category?.slug ?? "",
      categoryName: category?.name ?? "",
      priceCents,
      compareAtCents: compareAtCents && compareAtCents > priceCents ? compareAtCents : null,
      imageUrl: product.images?.[0]?.url ?? "",
      hoverImageUrl: product.images?.[1]?.url ?? "",
      rating,
      reviewCount: product.reviewCount,
      inStock: pv.length ? totalInventory > 0 : true,
      totalInventory,
      tags: product.tags,
      variantSummary,
      unitsSold: product.unitsSold,
      createdAt: product.createdAt,
      isFeatured: product.isFeatured,
    };
  });
}

export async function listProducts(filters: ProductFilters): Promise<{
  items: ProductCardData[];
  total: number;
  page: number;
  perPage: number;
}> {
  const conditions: SQL[] = [eq(products.isActive, true)];

  if (filters.category) {
    const cat = await getCategoryBySlug(filters.category);
    conditions.push(eq(products.categoryId, cat?.id ?? -1));
  }
  if (filters.brands?.length) conditions.push(inArray(products.brand, filters.brands));
  if (filters.tags?.length) {
    conditions.push(sql`${products.tags} && ${sql.raw(`ARRAY[${filters.tags.map((t) => `'${t.replace(/'/g, "")}'`).join(",")}]::text[]`)}`);
  }
  if (filters.priceMin !== undefined) conditions.push(sql`${products.priceCents} >= ${filters.priceMin}`);
  if (filters.priceMax !== undefined) conditions.push(sql`${products.priceCents} <= ${filters.priceMax}`);
  if (filters.onSale) conditions.push(sql`${products.compareAtCents} is not null`);
  if (filters.q) {
    const term = `%${filters.q}%`;
    const like = or(
      ilike(products.title, term),
      ilike(products.brand, term),
      ilike(products.productType, term),
      ilike(products.shortDescription, term),
      ilike(products.description, term),
      sql`array_to_string(${products.tags}, ' ') ilike ${term}`,
    );
    if (like) conditions.push(like);
  }

  const page = Math.max(filters.page ?? 1, 1);
  const perPage = filters.perPage ?? 12;

  const where = and(...conditions);
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(where)
    .orderBy(
      filters.sort === "price-asc"
        ? asc(products.priceCents)
        : filters.sort === "price-desc"
          ? desc(products.priceCents)
          : filters.sort === "newest"
            ? desc(products.createdAt)
            : filters.sort === "best-selling"
              ? desc(products.unitsSold)
              : desc(products.isFeatured),
    )
    .limit(perPage * 4)
    .offset(0);

  const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(where);
  const ids = rows.map((r) => r.product.id);
  const optionRows = ids.length
    ? await db.select().from(productOptions).where(inArray(productOptions.productId, ids))
    : [];
  const valuesFor = (productId: number, optionName: string) =>
    optionRows
      .filter((o) => o.productId === productId && o.name.toLowerCase() === optionName.toLowerCase())
      .flatMap((o) => o.values);

  let items = await attachVariants(rows);

  if (filters.hands?.length) {
    items = items.filter((i) => valuesFor(i.id, "hand").some((v) => filters.hands!.includes(v)));
  }
  if (filters.flexes?.length) {
    items = items.filter((i) => valuesFor(i.id, "flex").some((v) => filters.flexes!.includes(v)));
  }
  if (filters.sizes?.length) {
    items = items.filter((i) => valuesFor(i.id, "size").some((v) => filters.sizes!.includes(v)));
  }
  if (filters.inStock) items = items.filter((i) => i.inStock);

  // sort within page where variant-derived values matter
  if (filters.sort === "price-asc") items.sort((a, b) => a.priceCents - b.priceCents);
  if (filters.sort === "price-desc") items.sort((a, b) => b.priceCents - a.priceCents);

  const total = Number(countRows[0]?.count ?? 0);
  const start = (page - 1) * perPage;

  return { items: items.slice(start, start + perPage), total, page, perPage };
}

export async function getFacets(categorySlug?: string) {
  const catCondition: SQL[] = [eq(products.isActive, true)];
  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    catCondition.push(eq(products.categoryId, cat?.id ?? -1));
  }
  const rows = await db
    .select({ brand: products.brand, tags: products.tags, priceCents: products.priceCents })
    .from(products)
    .where(and(...catCondition));

  const brandSet = new Set<string>();
  const tagSet = new Set<string>();
  let maxPrice = 0;
  for (const row of rows) {
    if (row.brand) brandSet.add(row.brand);
    row.tags?.forEach((t) => tagSet.add(t));
    maxPrice = Math.max(maxPrice, row.priceCents);
  }

  const handRows = await db.select({ name: productOptions.name, values: productOptions.values }).from(productOptions);
  const hands = new Set<string>();
  const flexes = new Set<string>();
  const sizes = new Set<string>();
  const handOptionRows = await db
    .select({ productId: productOptions.productId, name: productOptions.name, values: productOptions.values })
    .from(productOptions)
    .innerJoin(products, eq(products.id, productOptions.productId))
    .where(and(...catCondition));

  for (const opt of handOptionRows) {
    if (opt.name.toLowerCase() === "hand") opt.values.forEach((v) => hands.add(v));
    if (opt.name.toLowerCase() === "flex") opt.values.forEach((v) => flexes.add(v));
    if (opt.name.toLowerCase() === "size") opt.values.forEach((v) => sizes.add(v));
  }
  void handRows;

  return {
    brands: Array.from(brandSet).sort(),
    tags: Array.from(tagSet).sort(),
    hands: Array.from(hands),
    flexes: flexes.size ? Array.from(flexes) : ["Regular", "Stiff", "X-Stiff"],
    sizes: Array.from(sizes),
    maxPrice: Math.ceil(maxPrice / 100) * 100 || 1000,
  };
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!rows[0]) return null;
  const [opts, vars] = await Promise.all([
    db.select().from(productOptions).where(eq(productOptions.productId, rows[0].product.id)).orderBy(asc(productOptions.position)),
    db.select().from(variants).where(eq(variants.productId, rows[0].product.id)).orderBy(asc(variants.position)),
  ]);
  return {
    product: rows[0].product,
    category: rows[0].category,
    options: opts,
    variants: vars,
  };
}

export async function getRelatedProducts(categoryId: number, excludeId: number, limit = 4) {
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.categoryId, categoryId), sql`${products.id} <> ${excludeId}`))
    .limit(limit);
  return attachVariants(rows);
}

export async function searchSuggestions(term: string) {
  if (!term.trim()) return { products: [], categories: [] };
  const t = `%${term.trim()}%`;
  const productRows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      or(
        ilike(products.title, t),
        ilike(products.brand, t),
        ilike(products.productType, t),
        sql`array_to_string(${products.tags}, ' ') ilike ${t}`,
      ),
    )
    .limit(6);
  const categoryRows = await db
    .select()
    .from(categories)
    .where(or(ilike(categories.name, t), ilike(categories.description, t)))
    .limit(4);
  return {
    products: await attachVariants(productRows),
    categories: categoryRows,
  };
}
