#!/usr/bin/env node

/**
 * Setup script for Daily Report PIN initialization
 * Run: node scripts/setup-admin-pin.js
 */

const bcrypt = require('bcryptjs');
const prisma = require('../src/prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

const setupAdminPin = async () => {
  console.log('\n=================================================================');
  console.log('  Daily Report Admin PIN Setup');
  console.log('=================================================================\n');

  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!admin) {
      console.error('❌ ERROR: No admin user found in database.');
      console.log('📝 Please create an admin user first through the login/register page.');
      rl.close();
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${admin.name} (${admin.email})`);
    console.log(`📊 Current PIN status: ${admin.adminPin ? 'CONFIGURED' : 'NOT SET'}\n`);

    // Ask for PIN
    const pin = await question('🔐 Enter admin PIN (4+ characters): ');

    if (pin.length < 4) {
      console.error('❌ PIN must be at least 4 characters!');
      rl.close();
      process.exit(1);
    }

    const confirmPin = await question('🔐 Confirm PIN: ');

    if (pin !== confirmPin) {
      console.error('❌ PINs do not match!');
      rl.close();
      process.exit(1);
    }

    // Hash PIN
    console.log('\n🔄 Hashing PIN...');
    const hashedPin = await bcrypt.hash(pin, 12);

    // Update admin
    console.log('💾 Saving to database...');
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { adminPin: hashedPin },
    });

    console.log('\n✅ SUCCESS! Admin PIN configured.\n');
    console.log('=' .repeat(65));
    console.log(`Admin Name:  ${updated.name}`);
    console.log(`Admin Email: ${updated.email}`);
    console.log(`Admin Role:  ${updated.role}`);
    console.log(`PIN:         ${pin}`);
    console.log('=' .repeat(65));
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - The PIN above should be changed after first use');
    console.log('   - Keep this PIN secure and share carefully');
    console.log('   - Users will need PIN to submit daily reports\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    rl.close();
    process.exit(1);
  }
};

setupAdminPin();
