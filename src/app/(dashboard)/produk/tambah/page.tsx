import { requireAdmin } from "@/lib/auth-guard";
import { ProductForm } from "@/components/product/product-form";

export const dynamic = "force-dynamic";

export default async function TambahProdukPage() {
  await requireAdmin();
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Tambah Produk</h1>
      <ProductForm />
    </div>
  );
}