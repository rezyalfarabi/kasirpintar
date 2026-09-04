import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StockMenipisPage() {
  await requireUser();
  const all = await prisma.product.findMany({
    where: { deleted_at: null, status: "ACTIVE", stock: { gt: 0 } },
    include: { category: true },
    orderBy: { stock: "asc" },
  });
  const low = all.filter((p) => p.stock > 0 && p.stock <= p.minimum_stock);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Produk Menipis</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {low.length === 0 ? (
          <p className="col-span-full text-muted-foreground">Tidak ada produk yang menipis 🎉</p>
        ) : (
          low.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="warning">Menipis</Badge>
                <span className="text-sm">
                  sisa {p.stock} / min {p.minimum_stock}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}