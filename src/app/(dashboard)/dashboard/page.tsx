import { prisma } from "@/lib/prisma";
import { computeStockStatus, formatIDR } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  await requireUser();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaySales, todayCount, totalProducts, lowStock, outOfStock, recentFromDb] =
    await Promise.all([
      prisma.transaction.aggregate({
        _sum: { total: true },
        where: { created_at: { gte: startOfDay } },
      }),
      prisma.transaction.count({ where: { created_at: { gte: startOfDay } } }),
      prisma.product.count({ where: { deleted_at: null, status: "ACTIVE" } }),
      prisma.product.findMany({ where: { deleted_at: null, status: "ACTIVE" } }),
      prisma.product.findMany({ where: { deleted_at: null, status: "ACTIVE", stock: 0 } }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { user: { select: { name: true } }, payment_method: { select: { name: true } } },
      }),
    ]);

  const lowStockProds = lowStock.filter(
    (p) => computeStockStatus(p.stock, p.minimum_stock) === "MENIPIS"
  );

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Penjualan hari ini</CardDescription>
            <CardTitle className="text-2xl">
              {formatIDR(todaySales._sum.total ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transaksi hari ini</CardDescription>
            <CardTitle className="text-2xl">{todayCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total produk aktif</CardDescription>
            <CardTitle className="text-2xl">{totalProducts}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk Menipis ({lowStockProds.length})</CardTitle>
            <CardDescription>Stok di bawah atau sama dengan minimum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProds.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <Badge variant="warning">sisa {p.stock}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Habis ({outOfStock.length})</CardTitle>
            <CardDescription>Stok kosong, segera restock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <Badge variant="destructive">Habis</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentFromDb.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.invoice_number}</span>
              <span className="text-muted-foreground">{t.user.name}</span>
              <span>{formatIDR(t.total)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}