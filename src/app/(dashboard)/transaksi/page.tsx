import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { userId, role } = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: role === "ADMIN" ? {} : { user_id: userId },
    include: {
      user: { select: { name: true } },
      payment_method: { select: { name: true } },
      _count: { select: { details: true } },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Transaksi</h1>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Item</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Belum ada transaksi
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <Link href={`/transaksi/${t.id}`} className="hover:underline">
                      {t.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell>{t.user.name}</TableCell>
                  <TableCell>{t.payment_method.name}</TableCell>
                  <TableCell className="text-right">{t._count.details}</TableCell>
                  <TableCell className="text-right">{formatIDR(t.total)}</TableCell>
                  <TableCell>{t.created_at.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}