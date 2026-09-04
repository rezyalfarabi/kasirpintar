import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIDR, computeStockStatus } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function StatusBadge({ stock, minimum }: { stock: number; minimum: number }) {
  const status = computeStockStatus(stock, minimum);
  if (status === "HABIS") return <Badge variant="destructive">Habis</Badge>;
  if (status === "MENIPIS") return <Badge variant="warning">Menipis</Badge>;
  return <Badge variant="success">Aman</Badge>;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireUser();
  const { search } = await searchParams;
  const products = await prisma.product.findMany({
    where: {
      deleted_at: null,
      status: "ACTIVE",
      ...(search ? { name: { contains: search } } : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produk</h1>
        <Button asChild>
          <Link href="/produk/tambah">Tambah Produk</Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Belum ada produk
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.barcode ?? "—"}</TableCell>
                  <TableCell>{p.category.name}</TableCell>
                  <TableCell className="text-right">{formatIDR(p.selling_price)}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>
                    <StatusBadge stock={p.stock} minimum={p.minimum_stock} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}