/**
 * SKILL: Transaction History & Detail — referensi PRD E.2, E.3 & Section 25.3.
 *
 * Kasir hanya bisa melihat transaksi miliknya sendiri (pembatasan diberlakukan
 * SERVER, parameter user_id disuntik dari session — tidak bisa di-override).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { Role } from "@prisma/client";

export async function listTransactions(params: {
  userId: number;
  role: Role;
  search?: string;
  date_from?: string;
  date_to?: string;
  user_id?: number;
  page: number;
  limit: number;
}) {
  const { search, date_from, date_to, user_id, userId, role, page, limit } = params;

  const where: Prisma.TransactionWhereInput = {};

  // Multi-tenancy ownership: Kasir dipaksa hanya melihat transaksinya sendiri.
  if (role === Role.ADMIN) {
    if (user_id) where.user_id = user_id;
  } else {
    where.user_id = userId;
  }

  if (search) where.invoice_number = { contains: search };
  if (date_from || date_to) {
    where.created_at = {
      ...(date_from ? { gte: new Date(date_from) } : {}),
      ...(date_to ? { lte: new Date(`${date_to}T23:59:59`) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment_method: { select: { id: true, name: true } },
        _count: { select: { details: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: rows.map((t) => ({
      ...t,
      total: t.total.toFixed(2),
      amount_paid: t.amount_paid.toFixed(2),
      change_amount: t.change_amount.toFixed(2),
    })),
    total,
    page,
    perPage: limit,
    totalPage: Math.ceil(total / limit),
  };
}

export async function getTransactionDetail(transactionId: number, userId: number, role: Role) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      details: true,
      user: { select: { id: true, name: true, email: true } },
      payment_method: { select: { id: true, name: true } },
    },
  });

  if (!transaction) {
    throw apiError("NOT_FOUND", "Transaksi tidak ditemukan");
  }
  // Kasir hanya boleh akses miliknya sendiri (E.3, Section 14).
  if (role !== Role.ADMIN && transaction.user_id !== userId) {
    throw apiError("FORBIDDEN", "Anda tidak berhak mengakses transaksi ini");
  }

  return {
    ...transaction,
    total: transaction.total.toFixed(2),
    amount_paid: transaction.amount_paid.toFixed(2),
    change_amount: transaction.change_amount.toFixed(2),
    details: transaction.details.map((d) => ({
      ...d,
      price_snapshot: d.price_snapshot.toFixed(2),
      subtotal: d.subtotal.toFixed(2),
    })),
  };
}