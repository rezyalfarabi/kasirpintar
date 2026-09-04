/**
 * SKILL: Category Management — referensi PRD A.2 & Section 25.2.
 * Business rule: kategori tidak bisa di-soft-delete selama masih ada produk aktif
 * yang mereferensikannya (A.2 point 6).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/lib/validations/category";

async function assertNameUnique(name: string, excludeId?: number) {
  const existing = await prisma.category.findFirst({
    where: { name, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw apiError("CATEGORY_NAME_DUPLICATE", "Nama kategori sudah digunakan");
  }
}

export async function createCategory(input: CategoryCreateInput) {
  await assertNameUnique(input.name);
  return prisma.category.create({
    data: { name: input.name, description: input.description ?? null },
  });
}

export async function listCategories(search?: string) {
  const where: Prisma.CategoryWhereInput = { deleted_at: null };
  if (search) where.name = { contains: search };
  return prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { deleted_at: null } } } } },
  });
}

export async function updateCategory(id: number, input: CategoryUpdateInput) {
  const existing = await prisma.category.findFirst({ where: { id, deleted_at: null } });
  if (!existing) {
    throw apiError("NOT_FOUND", "Kategori tidak ditemukan");
  }
  if (input.name && input.name !== existing.name) {
    await assertNameUnique(input.name, id);
  }
  return prisma.category.update({
    where: { id },
    data: { name: input.name, description: input.description },
  });
}

export async function softDeleteCategory(id: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.category.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw apiError("NOT_FOUND", "Kategori tidak ditemukan");
    }
    const activeProducts = await tx.product.count({
      where: { category_id: id, deleted_at: null, status: "ACTIVE" },
    });
    if (activeProducts > 0) {
      throw apiError(
        "CATEGORY_HAS_PRODUCTS",
        "Kategori masih memiliki produk, tidak bisa dihapus"
      );
    }
    return tx.category.update({ where: { id }, data: { deleted_at: new Date() } });
  });
}