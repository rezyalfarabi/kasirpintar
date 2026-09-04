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

export const dynamic = "force-dynamic";

function StatusBadge({ stock, minimum }: { stock: number; minimum: number }) {
  const status = computeStockStatus(stock, minimum);
  if (status === "HABIS") return <Badge variant="destructive">Habis</Badge>;
  if (status === "MENIPIS") return <Badge variant="warning">Menipis</Badge>;
  return <Badge variant="success">Aman</Badge>;
}

export default async function StockPage() {
  await requireUser();
  const products = await prisma.product.findMany({
    where: { deleted_at: null, status: "ACTIVE" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Stok</h1>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Minimum</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.stock}</TableCell>
                <TableCell className="text-right">{p.minimum_stock}</TableCell>
                <TableCell>
                  <StatusBadge stock={p.stock} minimum={p.minimum_stock} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}