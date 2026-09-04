import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireUser();
  const categories = await prisma.category.findMany({
    where: { deleted_at: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { deleted_at: null } } } } },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Kategori</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>Pengelompokan produk</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jml Produk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada kategori
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.description ?? "—"}</TableCell>
                    <TableCell className="text-right">{c._count.products}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}