#!/usr/bin/env node

/**
 * Script untuk membuat user Operator dan Investor
 * Run: node scripts/create-users.js
 */

const bcrypt = require("bcryptjs");
const prisma = require("../src/prisma/client");

const createUsers = async () => {
  console.log(
    "\n=================================================================",
  );
  console.log("  Membuat User Operator dan Investor");
  console.log(
    "=================================================================\n",
  );

  try {
    // Data user yang akan dibuat
    const users = [
      {
        name: "Operator",
        email: "operator@example.com",
        password: "Cirengisi123",
        role: "operator",
      },
      {
        name: "Investor",
        email: "investor@example.com",
        password: "Cirengisi123",
        role: "investor",
      },
    ];

    for (const userData of users) {
      try {
        // Cek apakah user sudah ada
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} sudah ada. Skip...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Buat user
        const user = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
          },
        });

        console.log(`✅ User ${userData.role.toUpperCase()} berhasil dibuat`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role: ${user.role}\n`);
      } catch (error) {
        console.error(
          `❌ Gagal membuat user ${userData.email}:`,
          error.message,
        );
      }
    }

    console.log(
      "=================================================================",
    );
    console.log("  Selesai!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

createUsers();
