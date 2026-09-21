import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, productOptions, variants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dollarsToCents, slugify } from "@/lib/format";

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = !quoted;
      } else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

function escapeHtml(input: string) {
  return input.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const text = await file.text();
  const rows = parseCsv(text);
  const cats = await db.select().from(categories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  const valid: Row[] = [];
  const errors: { row: number; message: string }[] = [];
  let updated = 0;

  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    const lineNo = index + 2;
    if (!row.title) errors.push({ row: lineNo, message: "Missing required field: title" });
    else if (!row.price || Number.isNaN(Number(row.price))) errors.push({ row: lineNo, message: "Invalid or missing price" });
    else if (!row.collection || !catMap.has(row.collection.trim()))
      errors.push({ row: lineNo, message: `Unknown collection handle: ${row.collection || "(empty)"}` });
    else if (row.sku && seenSkus.has(row.sku)) errors.push({ row: lineNo, message: `Duplicate SKU in file: ${row.sku}` });
    else {
      if (row.image_url && !/^https?:\/\//.test(row.image_url)) {
        errors.push({ row: lineNo, message: "Invalid image URL — must start with http(s)://" });
        return;
      }
      if (row.sku) seenSkus.add(row.sku);
      valid.push(row);
    }
  });

  let imported = 0;
  for (const row of valid) {
    const title = row.title.trim();
    const slug = slugify(row.handle || title);
    const priceCents = dollarsToCents(row.price);
    const existing = row.sku ? await db.select().from(products).where(eq(products.sku, row.sku)).limit(1) : [];

    const payload = {
      slug,
      title,
      brand: row.vendor || "SJ Golf",
      shortDescription: row.seo_description || "",
      description: row.seo_description || "",
      categoryId: catMap.get(row.collection.trim())!,
      productType: row.product_type || "",
      priceCents,
      compareAtCents: row.compare_at ? dollarsToCents(row.compare_at) : null,
      costCents: row.cost ? dollarsToCents(row.cost) : 0,
      sku: row.sku || `${slugify(title).toUpperCase().slice(0, 12)}-IMP`,
      barcode: row.barcode || "",
      tags: (row.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      images: row.image_url ? [{ url: row.image_url, alt: title }] : [],
      weightGrams: Number(row.weight_grams || 0) || 0,
      isActive: (row.status || "active") === "active",
      seoTitle: row.seo_title || title,
      seoDescription: row.seo_description || "",
      updatedAt: new Date(),
    };

    let productId: number;
    if (existing[0]) {
      await db.update(products).set(payload).where(eq(products.id, existing[0].id));
      productId = existing[0].id;
      updated += 1;
    } else {
      const inserted = await db.insert(products).values(payload).returning();
      productId = inserted[0].id;
      imported += 1;
    }

    // build variants from pipe-separated option cells
    const optionDefs: { name: string; values: string[] }[] = [];
    if (row.hand) optionDefs.push({ name: "Hand", values: row.hand.split("|").map((v) => v.trim()).filter(Boolean) });
    if (row.flex) optionDefs.push({ name: "Flex", values: row.flex.split("|").map((v) => v.trim()).filter(Boolean) });
    if (row.size) optionDefs.push({ name: "Size", values: row.size.split("|").map((v) => v.trim()).filter(Boolean) });

    await db.delete(variants).where(eq(variants.productId, productId));
    await db.delete(productOptions).where(eq(productOptions.productId, productId));

    if (optionDefs.length) {
      await db.insert(productOptions).values(optionDefs.map((o, i) => ({ productId, name: o.name, values: o.values, position: i })));
      const combos = optionDefs.reduce<Record<string, string>[]>(
        (acc, o) => acc.flatMap((prev) => o.values.map((v) => ({ ...prev, [o.name]: v }))),
        [{}],
      );
      await db.insert(variants).values(
        combos.map((combo, i) => ({
          productId,
          title: Object.values(combo).join(" / ") || "Standard",
          sku: `${payload.sku}-${i + 1}`,
          priceCents,
          compareAtCents: payload.compareAtCents,
          costCents: payload.costCents,
          options: combo,
          inventoryQty: Number(row.stock || 0) || 0,
          weightGrams: payload.weightGrams,
          imageUrl: row.image_url || "",
          position: i,
        })),
      );
    } else {
      await db.insert(variants).values({
        productId,
        title: "Standard",
        sku: `${payload.sku}-1`,
        priceCents,
        compareAtCents: payload.compareAtCents,
        costCents: payload.costCents,
        options: {},
        inventoryQty: Number(row.stock || 0) || 0,
        weightGrams: payload.weightGrams,
        imageUrl: row.image_url || "",
      });
    }
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Import report</title>
  <style>body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f6f7f6;margin:0;padding:2rem}
  .card{max-width:52rem;margin:0 auto;background:#fff;border:1px solid #e2e6e2;border-radius:4px;padding:2rem}
  h1{font-size:1.4rem;margin:0 0 .25rem}p.sub{color:#3f4742;margin:0 0 1.5rem;font-size:.9rem}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
  .stat{border:1px solid #e2e6e2;border-radius:4px;padding:1rem}.stat span{display:block;font-size:.65rem;text-transform:uppercase;letter-spacing:.14em;color:#3f4742}
  .stat b{font-size:1.4rem}.ok{color:#14392c}.bad{color:#b91c1c}
  table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #eef1ee}
  a{color:#14392c}</style></head><body><div class="card">
  <h1>Import complete</h1><p class="sub">${escapeHtml(file.name)}</p>
  <div class="grid">
    <div class="stat"><span>Rows processed</span><b>${rows.length}</b></div>
    <div class="stat"><span>Imported</span><b class="ok">${imported}</b></div>
    <div class="stat"><span>Updated</span><b class="ok">${updated}</b></div>
    <div class="stat"><span>Failed</span><b class="${errors.length ? "bad" : "ok"}">${errors.length}</b></div>
  </div>
  ${errors.length ? `<table><thead><tr><th>CSV row</th><th>Problem</th></tr></thead><tbody>
    ${errors.map((e) => `<tr><td>${e.row}</td><td>${escapeHtml(e.message)}</td></tr>`).join("")}
  </tbody></table>` : "<p class=\"sub\">All rows passed validation.</p>"}
  <p style="margin-top:1.5rem"><a href="/admin/import">← Back to import</a> · <a href="/admin/products">View products</a></p>
  </div></body></html>`;

  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
