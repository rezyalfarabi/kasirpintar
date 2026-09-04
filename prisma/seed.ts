import { PrismaClient, Role, ReferenceType, StockMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ---------- Users ----------
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin12345", 10);
  const kasirPassword = await bcrypt.hash("kasir12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || "admin@kasirpintar.app" },
    update: {},
    create: {
      name: process.env.SEED_ADMIN_NAME || "Administrator",
      email: process.env.SEED_ADMIN_EMAIL || "admin@kasirpintar.app",
      password_hash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const kasir = await prisma.user.upsert({
    where: { email: "kasir@kasirpintar.app" },
    update: {},
    create: {
      name: "Kasir",
      email: "kasir@kasirpintar.app",
      password_hash: kasirPassword,
      role: Role.KASIR,
    },
  });

  console.log(`  Users: ${admin.email} (ADMIN), ${kasir.email} (KASIR)`);

  // ---------- Categories ----------
  const catMakanan = await prisma.category.upsert({
    where: { name: "Makanan" },
    update: {},
    create: { name: "Makanan", description: "Produk makanan & snack" },
  });
  const catMinuman = await prisma.category.upsert({
    where: { name: "Minuman" },
    update: {},
    create: { name: "Minuman", description: "Produk minuman" },
  });
  const catLainnya = await prisma.category.upsert({
    where: { name: "Lainnya" },
    update: {},
    create: { name: "Lainnya", description: "Produk lainnya" },
  });
  console.log("  Categories: Makanan, Minuman, Lainnya");

  // ---------- Payment Methods ----------
  for (const name of ["Cash", "QRIS"]) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name, is_active: true },
    });
  }
  const cash = await prisma.paymentMethod.findUniqueOrThrow({ where: { name: "Cash" } });
  const qris = await prisma.paymentMethod.findUniqueOrThrow({ where: { name: "QRIS" } });
  console.log("  Payment methods: Cash, QRIS");

  // ---------- Products ----------
  const products = [
    { name: "Indomie Goreng", barcode: "8991001101111", category_id: catMakanan.id, purchase_price: 2500, selling_price: 3500, stock: 50, minimum_stock: 10 },
    { name: "Indomie Soto", barcode: "8991001102222", category_id: catMakanan.id, purchase_price: 2500, selling_price: 3500, stock: 4, minimum_stock: 10 },
    { name: "Tahu Isi", barcode: null, category_id: catMakanan.id, purchase_price: 1000, selling_price: 1500, stock: 0, minimum_stock: 5 },
    { name: "Air Mineral 600ml", barcode: "8998888111111", category_id: catMinuman.id, purchase_price: 1500, selling_price: 2500, stock: 100, minimum_stock: 20 },
    { name: "Teh Botol", barcode: "8991009113333", category_id: catMinuman.id, purchase_price: 3000, selling_price: 4500, stock: 5, minimum_stock: 6 },
    { name: "Sabun Cuci Piring", barcode: "8997001224444", category_id: catLainnya.id, purchase_price: 8000, selling_price: 12000, stock: 30, minimum_stock: 8 },
  ];

  for (const p of products) {
    const data = {
      name: p.name,
      barcode: p.barcode,
      category_id: p.category_id,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock: p.stock,
      minimum_stock: p.minimum_stock,
    };

    const exists = p.barcode
      ? await prisma.product.findUnique({ where: { barcode: p.barcode } })
      : await prisma.product.findFirst({ where: { name: p.name } });

    if (exists) {
      console.log(`  Product exists, skip: ${p.name}`);
      continue;
    }

    // Simpan produk dengan stok awal (stok > 0 => catat stock_movement tipe INITIAL)
    if (p.stock > 0) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({ data });
        await tx.stockMovement.create({
          data: {
            product_id: product.id,
            type: StockMovementType.IN,
            quantity: p.stock,
            stock_before: 0,
            stock_after: p.stock,
            reference_type: ReferenceType.INITIAL,
            note: "Stok awal",
            user_id: admin.id,
          },
        });
      });
    } else {
      await prisma.product.create({ data });
    }
    console.log(`  Product created: ${p.name} (stok ${p.stock})`);
  }

  console.log("Seeding selesai.");
  console.log(`\nLogin Admin : ${admin.email}\nLogin Kasir : ${kasir.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });