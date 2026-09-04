import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import { Role } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, role } = await requireUser();
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    include: {
      details: true,
      user: { select: { name: true, email: true } },
      payment_method: { select: { name: true } },
    },
  });

  if (!transaction) notFound();
  // Kasir hanya boleh lihat transaksinya sendiri
  if (role !== Role.ADMIN && transaction.user_id !== userId) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Transaksi {transaction.invoice_number}</h1>

      <Card>
        <CardContent className="grid gap-1 p-6 text-sm md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Kasir</p>
            <p className="font-medium">{transaction.user.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Metode</p>
            <p className="font-medium">{transaction.payment_method.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Waktu</p>
            <p className="font-medium">{transaction.created_at.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Kembalian</p>
            <p className="font-medium">{formatIDR(transaction.change_amount)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.details.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.product_name_snapshot}</TableCell>
                  <TableCell className="text-right">{formatIDR(d.price_snapshot)}</TableCell>
                  <TableCell className="text-right">{d.quantity}</TableCell>
                  <TableCell className="text-right">{formatIDR(d.subtotal)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">{formatIDR(transaction.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}