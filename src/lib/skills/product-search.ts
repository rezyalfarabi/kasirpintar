/**
 * SKILL: Product Search — referensi PRD A.3 & Section 19.
 * Pencarian case-insensitive: LIKE pada `name` + exact match pada `barcode`.
 * Hanya produk status ACTIVE dan belum di-soft-delete.
 */
import { prisma } from "@/lib/prisma";
import { toProductResponse } from "./product-crud";

export async function searchProducts(query: string, limit = 10) {
  if (!query || !query.trim()) {
    const products = await prisma.product.findMany({
      where: { deleted_at: null, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: limit,
    });
    return products.map((p) => toProductResponse(p));
  }

  const keyword = query.trim();

  // Prioritaskan exact match barcode, lalu partial match nama.
  const products = await prisma.product.findMany({
    where: {
      deleted_at: null,
      status: "ACTIVE",
      OR: [
        { barcode: { equals: keyword } },
        { name: { contains: keyword } },
        { barcode: { contains: keyword } },
      ],
    },
    orderBy: [{ barcode: "asc" }, { name: "asc" }],
    take: limit,
  });

  // Urutkan relevansi: exact barcode dulu, lalu lainnya.
  products.sort((a, b) => {
    const aExact = a.barcode === keyword ? 0 : 1;
    const bExact = b.barcode === keyword ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.localeCompare(b.name);
  });

  return products.map((p) => toProductResponse(p));
}

/**
 * SKILL: Barcode Search (D.2) — exact match, hanya aktif.
 * Returns null jika tidak ditemukan (bukan throw) agar pemanggil bisa
 * membedakan kondisi "not registered".
 */
export async function findProductByBarcode(barcode: string) {
  const product = await prisma.product.findFirst({
    where: { barcode, deleted_at: null, status: "ACTIVE" },
  });
  return product ? toProductResponse(product) : null;
}