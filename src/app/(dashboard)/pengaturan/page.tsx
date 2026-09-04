import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  await requireAdmin();
  const methods = await prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, email: true, role: true, is_active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
          <CardDescription>Metode yang tersedia saat checkout</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <Badge key={m.id} variant={m.is_active ? "success" : "secondary"}>
              {m.name}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pengguna</CardTitle>
          <CardDescription>Daftar akun admin & kasir</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                {!u.is_active && <Badge variant="destructive">Nonaktif</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}