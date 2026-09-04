import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

/** Route yang hanya boleh diakses ADMIN (Section 26 Page Structure). */
const ADMIN_ONLY = [
  "/dashboard",
  "/produk",
  "/produk/tambah",
  "/kategori",
  "/stok",
  "/stok/habis",
  "/stok/menipis",
  "/pengaturan",
];

function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const authReq = req as NextRequest & { auth: { user?: { role?: Role } } | null };
  const isLoggedIn = !!authReq.auth;
  const role = authReq.auth?.user?.role;
  const pathname = nextUrl.pathname;

  // Belum login → arahkan ke /login (kecuali halaman publik)
  if (!isLoggedIn) {
    if (pathname.startsWith("/login")) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Sudah login tapi buka /login → arahkan sesuai role
  if (pathname.startsWith("/login")) {
    return NextResponse.redirect(
      new URL(role === Role.ADMIN ? "/dashboard" : "/kasir", nextUrl)
    );
  }

  // Default-deny: route admin ditolak untuk Kasir → dirikan ke /kasir
  if (isAdminOnly(pathname) && role !== Role.ADMIN) {
    return NextResponse.redirect(new URL("/kasir", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico).*)"],
};