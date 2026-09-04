/**
 * SKILL: Inventory — referensi PRD B.1, B.2, B.3, B.4, B.5 & Section 12.4, 13.
 *
 * Kunci: setiap perubahan stok memakai PESSIMISTIC LOCKING (`SELECT ... FOR UPDATE`)
 * di dalam database transaction (Section 13.4A) dan selalu mencatat `stock_movements`
 * sebagai audit trail (append-only).
 */
import { Prisma, StockMovementType, ReferenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { computeStockStatus } from "@/lib/utils";
import { toProductResponse, type ProductResponse } from "./product-crud";

/** Ambil baris produk dengan row lock (FOR UPDATE) dalam transaksi aktif. */
async function lockProductRow(
  tx: Prisma.TransactionClient,
  productId: number
): Promise<{ id: number; stock: number } | null> {
  const rows = await tx.$queryRaw<
    { id: number; stock: number }[]
  >(Prisma.sql`SELECT id, stock FROM products WHERE id = ${productId} AND deleted_at IS NULL FOR UPDATE`);
  return rows[0] ?? null;
}

/**
 * B.1 Stock Tracking — status & angka stok terkini untuk satu produk.
 */
export async function getStockStatus(productId: number): Promise<ProductResponse> {
  const p = await prisma.product.findFirst({ where: { id: productId, deleted_at: null } });
  if (!p) throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
  return toProductResponse(p);
}

/**
 * Stock In (Section 12.4) — restock / tambah stok.
 * quantity > 0 divalidasi di schema; note opsional.
 */
export async function addStock(
  productId: number,
  quantity: number,
  userId: number,
  note?: string | null
) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw apiError("VALIDATION_ERROR", "Quantity masuk harus integer positif");
  }

  return prisma.$transaction(async (tx) => {
    const row = await lockProductRow(tx, productId);
    if (!row) throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");

    const stockAfter = row.stock + quantity;
    await tx.product.update({
      where: { id: productId },
      data: { stock: stockAfter },
    });
    await tx.stockMovement.create({
      data: {
        product_id: productId,
        type: StockMovementType.IN,
        quantity,
        stock_before: row.stock,
        stock_after: stockAfter,
        reference_type: ReferenceType.MANUAL,
        note: note ?? "Tambah stok",
        user_id: userId,
      },
    });
    return toProductResponse(await tx.product.findUniqueOrThrow({ where: { id: productId } }));
  });
}

/**
 * B.2 Stock Adjustment — koreksi manual. note (alasan) WAJIB.
 * Menolak hasil stock_after < 0 (OD-2: strict). Tidak ada override di MVP.
 */
export async function adjustStock(
  productId: number,
  type: StockMovementType,
  quantity: number,
  userId: number,
  note: string
) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw apiError("VALIDATION_ERROR", "Quantity harus integer positif");
  }
  if (!note || !note.trim()) {
    throw apiError("VALIDATION_ERROR", "Alasan wajib diisi untuk adjustment");
  }

  return prisma.$transaction(async (tx) => {
    const row = await lockProductRow(tx, productId);
    if (!row) throw apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan");

    const stockAfter =
      type === StockMovementType.ADJUSTMENT_IN
        ? row.stock + quantity
        : row.stock - quantity;

    if (stockAfter < 0) {
      throw apiError(
        "NEGATIVE_STOCK_NOT_ALLOWED",
        "Adjustment menyebabkan stok negatif, tidak diizinkan"
      );
    }

    await tx.product.update({ where: { id: productId }, data: { stock: stockAfter } });
    await tx.stockMovement.create({
      data: {
        product_id: productId,
        type,
        quantity,
        stock_before: row.stock,
        stock_after: stockAfter,
        reference_type: ReferenceType.MANUAL,
        note,
        user_id: userId,
      },
    });
    return toProductResponse(await tx.product.findUniqueOrThrow({ where: { id: productId } }));
  });
}

/** B.5 Stock Movement history — audit trail append-only untuk satu produk. */
export async function getStockMovements(productId: number, page = 1, limit = 20) {
  const where = { product_id: productId };
  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return {
    data: rows,
    total,
    page,
    perPage: limit,
    totalPage: Math.ceil(total / limit),
  };
}

/** B.4 Out of stock detection — produk stock = 0. */
export async function getOutOfStockProducts(search?: string, categoryId?: number) {
  const where: Prisma.ProductWhereInput = {
    deleted_at: null,
    status: "ACTIVE",
    stock: 0,
  };
  if (search) where.name = { contains: search };
  if (categoryId) where.category_id = categoryId;

  const products = await prisma.product.findMany({ where, orderBy: { name: "asc" } });
  return products.map((p) => ({
    ...toProductResponse(p),
    stock_status: computeStockStatus(p.stock, p.minimum_stock),
  }));
}

/** B.3 Low stock detection — produk 0 < stock <= minimum_stock. */
export async function getLowStockProducts(search?: string, categoryId?: number) {
  const where: Prisma.ProductWhereInput = {
    deleted_at: null,
    status: "ACTIVE",
    stock: { gt: 0 },
    minimum_stock: { gte: 0 },
  };
  if (search) where.name = { contains: search };
  if (categoryId) where.category_id = categoryId;

  const products = await prisma.product.findMany({ where, orderBy: { stock: "asc" } });
  const low = products.filter((p) => computeStockStatus(p.stock, p.minimum_stock) === "MENIPIS");
  return low.map((p) => ({
    ...toProductResponse(p),
    stock_status: "MENIPIS" as const,
  }));
}