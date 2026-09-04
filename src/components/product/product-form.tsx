"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
}

export function ProductForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category_id: "",
    purchase_price: "0",
    selling_price: "0",
    minimum_stock: "5",
    initial_stock: "0",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch(() => toast.error("Gagal memuat kategori"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        barcode: form.barcode || null,
        category_id: Number(form.category_id),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        minimum_stock: Number(form.minimum_stock),
        initial_stock: Number(form.initial_stock),
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Gagal menyimpan produk");
      return;
    }
    toast.success("Produk tersimpan");
    router.push("/produk");
    router.refresh();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nama Produk *</Label>
        <Input id="name" value={form.name} onChange={set("name")} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="barcode">Barcode (opsional)</Label>
        <Input id="barcode" value={form.barcode} onChange={set("barcode")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Kategori *</Label>
        <select
          id="category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          required
        >
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="purchase_price">Harga Beli *</Label>
          <Input id="purchase_price" type="number" min="0" value={form.purchase_price} onChange={set("purchase_price")} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="selling_price">Harga Jual *</Label>
          <Input id="selling_price" type="number" min="0" value={form.selling_price} onChange={set("selling_price")} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="minimum_stock">Stok Minimum</Label>
          <Input id="minimum_stock" type="number" min="0" value={form.minimum_stock} onChange={set("minimum_stock")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="initial_stock">Stok Awal</Label>
          <Input id="initial_stock" type="number" min="0" value={form.initial_stock} onChange={set("initial_stock")} />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan Produk"}
      </Button>
    </form>
  );
}