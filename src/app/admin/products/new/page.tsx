import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const cats = await db.select().from(categories).orderBy(categories.sortOrder);
  return (
    <div>
      <PageHeader
        title="Add product"
        subtitle="Create a configurable golf product with variants"
        breadcrumb={[{ href: "/admin/dashboard", label: "Admin" }, { href: "/admin/products", label: "Products" }, { label: "New" }]}
      />
      <ProductForm
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        values={{
          title: "",
          slug: "",
          brand: "SJ Golf",
          shortDescription: "",
          description: "",
          categoryId: cats[0]?.id ?? 1,
          productType: "",
          price: "",
          compareAt: "",
          cost: "",
          sku: "",
          barcode: "",
          tags: "",
          images: "",
          videoUrl: "",
          specs: "",
          gender: "Unisex",
          clubType: "",
          shaft: "",
          loft: "",
          weightGrams: 500,
          isFeatured: false,
          isActive: true,
          seoTitle: "",
          seoDescription: "",
          options: [],
          variants: [],
        }}
      />
    </div>
  );
}
