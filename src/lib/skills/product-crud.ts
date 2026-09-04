/**
 * SKILL: Product CRUD — referensi PRD A.1 & Section 12.
 * Business rule: `stock` TIDAK pernah diubah langsung lewat skill ini (12.2).
 * Delete = soft delete (12.3).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { computeStockStatus } from "@/lib/utils";
import type { ProductCreateInput, ProductUpdateInput } from "@/lib/validations/product";

type DbClient = Prisma.TransactionClient | typeof prisma;

/** Presenter: tambahkan status stok dinamis ke objek produk. */
export type ProductResponse = Omit<Prisma.ProductGetPayload<Record<string, never>>, "purchase_price" | "selling_price"> & {
  purchase_price: string;
  selling_price: string;
  status_stok: "AMAN" | "MENIPIS" | "HABIS";
};

export function toProductResponse(
  p: Prisma.ProductGetPayload<Record<string, never>>
): ProductResponse {
  return {
    ...p,
    purchase_price: p.purchase_price.toFixed(2),
    selling_price: p.selling_price.toFixed(2),
    status_stok: computeStockStatus(p.stock, p.minimum_stock),
  };
}

async function assertBarcodeUnique(db: DbClient, barcode: string | null, excludeId?: number) {
  if (!barcode) return;
  const existing = await db.product.findFirst({
    where: {
      barcode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw apiError("BARCODE_CONFLICT", "Barcode sudah digunakan produk lain");
  }
}

async function assertCategoryExists(db: DbClient, categoryId: number) {
  const cat = await db.category.findFirst({
    where: { id: categoryId, deleted_at: null },
    select: { id: true },
  });
  if (!cat) {
    throw apiError("CATEGORY_NOT_FOUND", "Kategori tidak ditemukan");
  }
}

export async function createProduct(input: ProductCreateInput, userId: number) {
  return prisma.$transaction(async (tx) => {
    await assertBarcodeUnique(tx, input.barcode ?? null);
    await assertCategoryExists(tx, input.category_id);

    const { initial_stock, ...data } = input;
    const product = await tx.product.create({
      data: {
        name: data.name,
        barcode: data.barcode ?? null,
        category_id: data.category_id,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        minimum_stock: data.minimum_stock,
        stock: initial_stock,
        image_url: data.image_url ?? null,
      },
    });

    // Jika stok awal > 0 → buat stock_movement tipe IN (reference: Stok Awal)
    if (initial_stock > 0) {
      await tx.stockMovement.create({
        data: {
          product_id: product.id,
          type: "IN",
          quantity: initial_stock,
          stock_before: 0,
          stock_after: initial_stock,
          reference_type: "INITIAL",
          note: "Stok awal",
          user_id: userId,
        },
      });
    }

    return toProductResponse(product);
  });
}

export async function getProductById(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, deleted_at: null },
  });
  if (!product) {
    throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
  }
  return toProductResponse(product);
}

export async function updateProduct(id: number, input: ProductUpdateInput & { user_id?: number }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
    }

    if (input.barcode !== undefined) {
      await assertBarcodeUnique(tx, input.barcode ?? null, id);
    }
    if (input.category_id) {
      await assertCategoryExists(tx, input.category_id);
    }

    const { ...data } = input;
    // Perlu hati-hati: updateProduct tidak boleh menerima field `stock`.
    const updated = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        barcode: data.barcode,
        category_id: data.category_id,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        minimum_stock: data.minimum_stock,
        image_url: data.image_url,
        status: data.status,
      },
    });

    return toProductResponse(updated);
  });
}

export async function softDeleteProduct(id: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
    }
    const updated = await tx.product.update({
      where: { id },
      data: { deleted_at: new Date(), status: "ARCHIVED" },
    });
    return toProductResponse(updated);
  });
}

export async function listProducts(params: {
  search?: string;
  category_id?: number;
  stock_status?: "AMAN" | "MENIPIS" | "HABIS";
  page: number;
  limit: number;
}) {
  const { search, category_id, stock_status, page, limit } = params;
  const where: Prisma.ProductWhereInput = { deleted_at: null, status: "ACTIVE" };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { barcode: { equals: search } },
    ];
  }
  if (category_id) {
    where.category_id = category_id;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { category: true },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.product.count({ where });

  // Filter status stok di memori (status dihitung dinamis, bukan kolom).
  let filtered = products;
  if (stock_status) {
    filtered = products.filter((p) => computeStockStatus(p.stock, p.minimum_stock) === stock_status);
  }

  return {
    data: filtered.map((p) => toProductResponse(p)),
    total,
    page,
    perPage: limit,
    totalPage: Math.ceil(total / limit),
  };
}