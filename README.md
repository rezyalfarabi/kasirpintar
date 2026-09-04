# Kasir Pintar

Point of Sale, Product & Inventory Management System — berbasis Next.js (App Router).

Referensi lengkap kebutuhan: [docs/PRD.md](docs/PRD.md).

## Stack

Next.js 15 · TypeScript · React 19 · Tailwind CSS · shadcn/ui · Prisma (MySQL) ·
Zod · React Hook Form · Auth.js (Credential + JWT) · Lucide Icons.

## Struktur (ringkas)

```
prisma/
  schema.prisma      # users, categories, products, payment_methods,
                     # transactions, transaction_details, stock_movements
  seed.ts            # user admin/kasir, kategori, metode bayar, produk demo
src/
  app/               # App Router: halaman (login, dashboard, kasir, produk,
                     # kategori, stok, transaksi, pengaturan) + /api routes
  components/         # ui/ (shadcn), layout/, product/, auth/, dll
  lib/
    prisma.ts         # Prisma client singleton
    auth.ts           # NextAuth config
    auth-guard.ts     # requireUser / requireAdmin
    errors.ts         # ApiError + error codes (PRD Section 29)
    api-response.ts   # envelope { success, data, meta | error }
    invoice.ts        # generateInvoiceNumber (di dalam DB transaction)
    validations/      # Zod schema (single source of truth client & server)
    skills/           # business logic (testable):
      product-crud.ts, category-management.ts, product-search.ts,
      inventory.ts, checkout.ts, transaction-history.ts
  app/actions/        # Server Actions (login/logout)
  middleware.ts       # RBAC (default-deny)
```

## Menjalankan

1. **MySQL via XAMPP** — buka XAMPP Control Panel, klik **Start** pada **MySQL** (indikator hijau = aktif). Pastikan port default **3306**.
2. Database + user aplikasi sudah disiapkan oleh seed project:
   - Database: `kasir_pintar`
   - User MySQL: `kasir` / password `kasir123` (sudah dibuat & di-grant saat setup pertama)
3. File `.env` sudah dikonfigurasi untuk XAMPP. `AUTH_SECRET` sudah ada; ganti saat deploy produksi.
4. Instal dependencies & siapkan database (jika database belum ada, jalankan sekali):

   ```bash
   npm install
   npm run db:setup     # = generate + migrate + seed
   ```

   Atau langkah per langkah:

   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run db:seed
   ```

5. Jalankan development:

   ```bash
   npm run dev
   ```

   Buka http://localhost:3001.

### Akun seed default

| Role  | Email                    | Password     |
|-------|--------------------------|--------------|
| Admin | `admin@kasirpintar.app` | `admin12345` |
| Kasir | `kasir@kasirpintar.app`  | `kasir12345` |

> Ganti `SEED_ADMIN_*` di `.env` untuk menyesuaikan akun admin awal. Default XAMPP memakai user MySQL `kasir`/`kasir123` (root XAMPP tanpa password tidak kompatibel dengan driver Prisma).

## Catatan keputusan (dari Open Decisions PRD)

- Barcode **opsional**, unik bila diisi.
- Stok **strict non-negatif** (adjustment yang menghasilkan stok `< 0` ditolak).
- Session Auth.js **JWT** (credential provider); dapat dimigrasi ke database
  session di V1 tanpa mengubah kontrak `session.user`. (OD-3)
- Single outlet, kolom `outlet_id` nullable disiapkan. (OD-4)
- Produk habis tetap muncul di POS namun tombol tambah di-disable. (OD-5)
- Quantity di cart di-`clamp` ke stok maksimum dengan peringatan. (OD-6)
- Checkout & perubahan stok **atomic** (interactive transaction + `FOR UPDATE`),
  harga/total selalu dihitung ulang SERVER.

## Script

| Script                | Fungsi                          |
|-----------------------|---------------------------------|
| `npm run dev`         | dev server (port 3001)           |
| `npm run build`       | production build                 |
| `npm start`           | jalankan hasil build (port 3001) |
| `npm run prisma:generate` | regenerate Prisma Client     |
| `npm run db:migrate`  | migrate dev                     |
| `npm run db:seed`     | seed database                   |
