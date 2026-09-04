/**
 * SKILL: Checkout — referensi PRD C.3 & Section 12.5 (Non-Negotiable).
 *
 * Seluruh proses dibungkus dalam SATU database transaction (interactive transaction).
 * Jika ada langkah yang gagal (stok tidak cukup, pembayaran kurang, error DB),
 * SEMUA operasi di-rollback — tidak ada partial commit.
 *
 * Prinsip: total/subtotal/change dihitung ulang SERVER dari harga di database,
 * client tidak pernah dipercaya (Section 12.5, 16.4).
 */
import { Prisma, PrismaClient, StockMovementType, ReferenceType, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { generateInvoiceNumber } from "@/lib/invoice";
import type { TransactionCreateInput } from "@/lib/validations/transaction";

type Db = PrismaClient | Prisma.TransactionClient;

interface LockedProduct {
  id: number;
  name: string;
  selling_price: Prisma.Decimal;
  stock: number;
  deleted_at: Date | null;
  status: string;
}

async function lockProductForSale(tx: Db, productId: number): Promise<LockedProduct | null> {
  const rows = await tx.$queryRaw<
    LockedProduct[]
  >(Prisma.sql`SELECT id, name, selling_price, stock, deleted_at, status FROM products WHERE id = ${productId} FOR UPDATE`);
  return rows[0] ?? null;
}

export interface CheckoutResult {
  id: number;
  invoice_number: string;
  total: Prisma.Decimal;
  amount_paid: Prisma.Decimal;
  change_amount: Prisma.Decimal;
  payment_method: { id: number; name: string };
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    price: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }[];
}
export async function checkout(
  input: TransactionCreateInput,
  userId: number
): Promise<CheckoutResult> {
  const { items, payment_method_id, amount_paid, payment_reference } = input;

  // 2. VALIDASI: cart tidak boleh kosong
  if (!items || items.length === 0) {
    throw apiError("EMPTY_CART", "Cart tidak boleh kosong");
  }

  return prisma.$transaction(async (tx) => {
    // 6. Validasi metode pembayaran
    const paymentMethod = await tx.paymentMethod.findFirst({
      where: { id: payment_method_id },
    });
    if (!paymentMethod) {
      throw apiError("PAYMENT_METHOD_INACTIVE", "Metode pembayaran tidak ditemukan");
    }
    if (!paymentMethod.is_active) {
      throw apiError("PAYMENT_METHOD_INACTIVE", "Metode pembayaran tidak aktif");
    }
    const isCash = paymentMethod.name.toLowerCase() === "cash";

    // 3. Lock & validasi setiap item produk (harga & stok dari DB, bukan client)
    const locked: LockedProduct[] = [];
    for (const item of items) {
      const product = await lockProductForSale(tx as Prisma.TransactionClient, item.product_id);
      if (!product || product.deleted_at !== null || product.status !== "ACTIVE") {
        throw apiError(
          "PRODUCT_NOT_FOUND",
          `Produk ${item.product_id} tidak ditemukan atau tidak aktif`
        );
      }
      if (product.stock < item.quantity) {
        throw apiError(
          "STOCK_INSUFFICIENT",
          `Stok produk '${product.name}' tidak mencukupi.`,
          { product_id: product.id, requested: item.quantity, available: product.stock }
        );
      }
      locked.push(product);
    }

    // 4-5. Hitung subtotal per item & total dari harga DB
    const details = items.map((item, idx) => {
      const product = locked[idx];
      const price = product.selling_price; // harga dari DB, bukan client
      const subtotal = price.mul(item.quantity);
      return { product, quantity: item.quantity, subtotal };
    });

    const total = details.reduce((acc, d) => acc.add(d.subtotal), new Prisma.Decimal(0));

    // 7-8. Validasi pembayaran & hitung change
    let finalAmountPaid: Prisma.Decimal;
    let change: Prisma.Decimal;

    if (isCash) {
      if (new Prisma.Decimal(amount_paid).lt(total)) {
        throw apiError("PAYMENT_INSUFFICIENT", "Pembayaran kurang dari total");
      }
      finalAmountPaid = new Prisma.Decimal(amount_paid);
      change = finalAmountPaid.sub(total);
    } else {
      // 16.3 QRIS: pembayaran pas, change = 0
      finalAmountPaid = total;
      change = new Prisma.Decimal(0);
    }

    // 9. Generate invoice unik di dalam transaction yang sama (12.7)
    const invoiceNumber = await generateInvoiceNumber(tx, new Date());
// 10. Insert transactions
    const transaction = await tx.transaction.create({
      data: {
        invoice_number: invoiceNumber,
        user_id: userId,
        payment_method_id,
        total,
        amount_paid: finalAmountPaid,
        change_amount: change,
        status: TransactionStatus.COMPLETED,
      },
    });

    // 11. Insert transaction_details (snapshot nama & harga — Section 12.6)
    for (const d of details) {
      await tx.transactionDetail.create({
        data: {
          transaction_id: transaction.id,
          product_id: d.product.id,
          product_name_snapshot: d.product.name,
          price_snapshot: d.product.selling_price,
          quantity: d.quantity,
          subtotal: d.subtotal,
        },
      });
    }

    // 12-13. Update stok & catat stock_movement OUT per item
    for (const d of details) {
      const stockAfter = d.product.stock - d.quantity;
      await tx.product.update({
        where: { id: d.product.id },
        data: { stock: stockAfter },
      });
      await tx.stockMovement.create({
        data: {
          product_id: d.product.id,
          type: StockMovementType.OUT,
          quantity: d.quantity,
          stock_before: d.product.stock,
          stock_after: stockAfter,
          reference_type: ReferenceType.TRANSACTION,
          reference_id: transaction.id,
          transaction_id: transaction.id,
          note: payment_reference ? `No. referensi: ${payment_reference}` : null,
          user_id: userId,
        },
      });
    }

    // 14. COMMIT terjadi otomatis saat callback selesai; error → ROLLBACK penuh.
    return {
      id: transaction.id,
      invoice_number: transaction.invoice_number,
      total: transaction.total,
      amount_paid: transaction.amount_paid,
      change_amount: transaction.change_amount,
      payment_method: { id: paymentMethod.id, name: paymentMethod.name },
      items: details.map((d) => ({
        product_id: d.product.id,
        product_name: d.product.name,
        quantity: d.quantity,
        price: d.product.selling_price,
        subtotal: d.subtotal,
      })),
    } satisfies CheckoutResult;
  });
}