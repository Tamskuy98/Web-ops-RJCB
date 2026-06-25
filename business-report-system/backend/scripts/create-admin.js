#!/usr/bin/env node

/**
 * Script untuk membuat admin user
 * Run: node scripts/create-admin.js
 */

const bcrypt = require("bcryptjs");
const prisma = require("../src/prisma/client");

const createAdmin = async () => {
  try {
    // Cek apakah admin sudah ada
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user sudah ada");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash("Cirengisi123", 12);

      // Buat admin user
      const admin = await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
        },
      });

      console.log("✅ Admin user berhasil dibuat");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: Cirengisi123`);
      console.log(`   Role: ${admin.role}\n`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
