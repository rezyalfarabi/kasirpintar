import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StockHabisPage() {
  await requireUser();
  const products = await prisma.product.findMany({
    where: { deleted_at: null, status: "ACTIVE", stock: 0 },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produk Habis</h1>
        <Button asChild variant="outline">
          <Link href="/stok">Lihat Semua Stok</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="col-span-full text-muted-foreground">Tidak ada produk yang habis 🎉</p>
        ) : (
          products.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>{p.category.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="destructive">Habis</Badge>
                <span className="text-sm text-muted-foreground">
                  min. stok {p.minimum_stock}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}