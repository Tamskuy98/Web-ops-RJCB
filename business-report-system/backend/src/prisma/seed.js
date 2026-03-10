const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.sale.deleteMany();
  await prisma.incomingGood.deleteMany();
  await prisma.restock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const owner = await prisma.user.create({
    data: {
      name: 'Owner User',
      email: 'owner@example.com',
      password: hashedPassword,
      role: 'owner',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Warehouse User',
      email: 'warehouse@example.com',
      password: hashedPassword,
      role: 'warehouse',
    },
  });

  console.log('Users created:', { admin: admin.email, owner: owner.email, warehouse: warehouse.email });

  // Create 10 products
  const products = await Promise.all([
    prisma.product.create({
      data: { name: 'Laptop ASUS VivoBook', category: 'Electronics', priceCost: 7500000, priceSell: 9000000, stock: 25, minStock: 5 },
    }),
    prisma.product.create({
      data: { name: 'Mouse Logitech M331', category: 'Electronics', priceCost: 150000, priceSell: 250000, stock: 100, minStock: 20 },
    }),
    prisma.product.create({
      data: { name: 'Keyboard Mechanical RGB', category: 'Electronics', priceCost: 350000, priceSell: 550000, stock: 50, minStock: 10 },
    }),
    prisma.product.create({
      data: { name: 'Monitor Samsung 24"', category: 'Electronics', priceCost: 2000000, priceSell: 2800000, stock: 15, minStock: 3 },
    }),
    prisma.product.create({
      data: { name: 'USB Flash Drive 64GB', category: 'Accessories', priceCost: 50000, priceSell: 85000, stock: 200, minStock: 30 },
    }),
    prisma.product.create({
      data: { name: 'Headset Gaming HyperX', category: 'Accessories', priceCost: 500000, priceSell: 750000, stock: 30, minStock: 5 },
    }),
    prisma.product.create({
      data: { name: 'Webcam Logitech C920', category: 'Electronics', priceCost: 800000, priceSell: 1200000, stock: 20, minStock: 5 },
    }),
    prisma.product.create({
      data: { name: 'Printer Epson L3150', category: 'Electronics', priceCost: 2500000, priceSell: 3200000, stock: 8, minStock: 2 },
    }),
    prisma.product.create({
      data: { name: 'Paper A4 (Ream)', category: 'Supplies', priceCost: 35000, priceSell: 55000, stock: 3, minStock: 10 },
    }),
    prisma.product.create({
      data: { name: 'Ink Cartridge Black', category: 'Supplies', priceCost: 75000, priceSell: 120000, stock: 0, minStock: 5 },
    }),
  ]);

  console.log(`${products.length} products created.`);

  // Create sample sales (past 6 months)
  const now = new Date();
  const salesData = [];
  for (let i = 0; i < 6; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const numSales = Math.floor(Math.random() * 5) + 3;
    for (let j = 0; j < numSales; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const priceSell = Number(product.priceSell);
      const priceCost = Number(product.priceCost);
      const total = priceSell * qty;
      const profit = (priceSell - priceCost) * qty;
      const day = Math.floor(Math.random() * 28) + 1;
      salesData.push({
        productId: product.id,
        quantity: qty,
        priceSell: priceSell,
        total: total,
        profit: profit,
        date: new Date(month.getFullYear(), month.getMonth(), day),
      });
    }
  }

  await prisma.sale.createMany({ data: salesData });
  console.log(`${salesData.length} sales records created.`);

  // Create sample restocks
  const restockData = [];
  for (let i = 0; i < 5; i++) {
    const product = products[i];
    restockData.push({
      productId: product.id,
      quantity: 20,
      purchasePrice: Number(product.priceCost),
      supplier: ['PT. Distributor Utama', 'CV. Sumber Jaya', 'PT. Tech Supply'][i % 3],
      date: new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
    });
  }

  await prisma.restock.createMany({ data: restockData });
  console.log(`${restockData.length} restock records created.`);

  // Create sample incoming goods
  const incomingData = [];
  for (let i = 0; i < 5; i++) {
    const product = products[i + 5];
    incomingData.push({
      productId: product.id,
      quantity: 15,
      supplier: ['PT. Distributor Utama', 'CV. Sumber Jaya', 'PT. Tech Supply'][i % 3],
      date: new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1),
      note: `Incoming batch #${i + 1}`,
    });
  }

  await prisma.incomingGood.createMany({ data: incomingData });
  console.log(`${incomingData.length} incoming goods records created.`);

  console.log('\nSeed completed successfully!');
  console.log('\nTest accounts:');
  console.log('  admin@example.com / password123');
  console.log('  owner@example.com / password123');
  console.log('  warehouse@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
