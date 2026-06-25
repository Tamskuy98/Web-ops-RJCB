#!/usr/bin/env node

/**
 * Non-interactive PIN setup script
 * Usage: node setup-pin-direct.js <pin>
 */

const bcrypt = require('bcryptjs');
const prisma = require('../src/prisma/client');

const setupPin = async () => {
  const pin = '1998'; // Direct PIN

  console.log('\n=================================================================');
  console.log('  Daily Report Admin PIN Setup (Auto)');
  console.log('=================================================================\n');

  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!admin) {
      console.log('⚠️  No admin user found. Attempting to find any user...');
      const anyUser = await prisma.user.findFirst();
      
      if (!anyUser) {
        console.error('❌ ERROR: No users found. Please create a user first.');
        process.exit(1);
      }

      // Use first user and set as admin
      await prisma.user.update({
        where: { id: anyUser.id },
        data: { role: 'admin' },
      });
      
      console.log(`✅ Updated user ${anyUser.id} to admin role`);
    }

    // Find admin again
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    // Hash PIN
    console.log('🔄 Hashing PIN...');
    const hashedPin = await bcrypt.hash(pin, 12);

    // Update admin
    console.log('💾 Saving to database...');
    const updated = await prisma.user.update({
      where: { id: adminUser.id },
      data: { adminPin: hashedPin },
    });

    console.log('\n✅ SUCCESS! Admin PIN configured.\n');
    console.log('=' .repeat(65));
    console.log(`Admin Name:  ${updated.name}`);
    console.log(`Admin Email: ${updated.email}`);
    console.log(`Admin Role:  ${updated.role}`);
    console.log(`PIN:         ${pin}`);
    console.log('=' .repeat(65));
    console.log('\n📝 Use this PIN to submit daily reports!');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
};

setupPin();
