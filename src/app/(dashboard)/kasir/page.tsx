"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  selling_price: string;
  stock: number;
  minimum_stock: number;
  status_stok: "AMAN" | "MENIPIS" | "HABIS";
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  stock_available: number;
}

export default function KasirPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastInvoice, setLastInvoice] = useState<{ invoice: string; change: number } | null>(null);

  // Debounce 300ms sebelum request (Section 19)
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=20`);
      const json = await res.json();
      setProducts(json.data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const addToCart = (p: Product) => {
    const price = Number(p.selling_price);
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        if (existing.quantity + 1 > existing.stock_available) {
          toast.error("Stok tidak mencukupi");
          return prev;
        }
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (p.stock <= 0) {
        toast.error("Stok tidak mencukupi");
        return prev;
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          price,
          quantity: 1,
          stock_available: p.stock,
        },
      ];
    });
  };

  const updateQty = (productId: number, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product_id === productId
            ? { ...i, quantity: Math.min(Math.max(1, qty), i.stock_available) } // clamp (OD-6)
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: number) =>
    setCart((prev) => prev.filter((i) => i.product_id !== productId));

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart kosong");
      return;
    }
    const methodsRes = await fetch("/api/payment-methods");
    const methodsJson = await methodsRes.json();
    const cash = methodsJson.data?.find((m: { name: string }) => m.name === "Cash");
    const payment_method_id = cash?.id;

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method_id,
        amount_paid: total,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Transaksi gagal");
      return;
    }
    setLastInvoice({ invoice: json.data.invoice_number, change: Number(json.data.change_amount) });
    setCart([]);
    toast.success("Transaksi berhasil");
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Cari produk */}
      <div className="space-y-4 md:col-span-2">
        <h1 className="text-2xl font-bold">Kasir</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari produk (nama / barcode)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="line-clamp-2 text-sm font-semibold">{p.name}</div>
                <div className="text-lg font-bold">{formatIDR(p.selling_price)}</div>
                <Badge
                  variant={
                    p.status_stok === "HABIS"
                      ? "destructive"
                      : p.status_stok === "MENIPIS"
                        ? "warning"
                        : "success"
                  }
                >
                  sisa {p.stock}
                </Badge>
                <Button size="sm" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                  Tambah ke keranjang
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart className="h-4 w-4" />
            Keranjang ({cartCount})
          </span>
        </div>

        <div className="space-y-2">
          {cart.map((i) => (
            <div
              key={i.product_id}
              className="flex items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{i.name}</div>
                <div className="text-xs text-muted-foreground">{formatIDR(i.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQty(i.product_id, i.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{i.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQty(i.product_id, i.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeItem(i.product_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatIDR(total)}</span>
          </div>
          <Button className="mt-3 w-full" onClick={handleCheckout} disabled={cartCount === 0}>
            Bayar
          </Button>
        </div>

        {lastInvoice && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-semibold">Transaksi #{lastInvoice.invoice}</p>
            <p className="text-muted-foreground">Kembalian: {formatIDR(lastInvoice.change)}</p>
          </div>
        )}
      </div>
    </div>
  );
}