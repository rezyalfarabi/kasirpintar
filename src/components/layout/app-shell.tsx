"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Boxes,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  kasirOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/kasir", label: "Kasir", icon: ShoppingCart },
  { href: "/produk", label: "Produk", icon: Package, adminOnly: true },
  { href: "/kategori", label: "Kategori", icon: FolderOpen, adminOnly: true },
  { href: "/stok", label: "Stok", icon: Boxes, adminOnly: true },
  { href: "/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, adminOnly: true },
];

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return role === Role.ADMIN;
    if (item.kasirOnly) return role === Role.KASIR;
    return true;
  });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
          <div className="flex h-14 items-center gap-2 border-b px-6 font-bold">
            Kasir Pintar
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
            <span className="font-bold">Kasir Pintar</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </form>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Bottom navigation (mobile) — thumb-reachable, Section 22 */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-card md:hidden">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}