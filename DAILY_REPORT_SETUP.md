/**
 * =====================================================================
 * DAILY REPORT FEATURE - SETUP & USAGE GUIDE
 * =====================================================================
 *
 * This file documents the setup and usage of the "Daily Report Public Form"
 * feature which allows public users to submit daily sales reports without
 * authentication, using a PIN for verification.
 */

// =====================================================================
// 1. DATABASE MIGRATION
// =====================================================================
// Run the migration to create new columns and SaleExpense table:
// Command: npm run prisma:migrate
// 
// Changes made:
// - Added `adminPin` field to User table (hashed string)
// - Modified Sale table:
//   - Added: qris (Float, default 0)
//   - Added: totalPengeluaran (Float, default 0)
//   - Added: totalSetoran (Float, default 0)
//   - Added: attachment (String, nullable)
// - Created SaleExpense table with fields:
//   - id, saleId, namaBarang, qty, harga, total, attachment, createdAt
// - Created index on sale_expenses(sale_id)

// =====================================================================
// 2. INITIALIZE ADMIN PIN (VERY IMPORTANT - DO THIS FIRST!)
// =====================================================================
// Before using the daily report feature, you MUST set up admin PIN.
//
// Option A: Using Node REPL or Script (RECOMMENDED)
// -------
// Create a file: backend/scripts/setup-admin-pin.js
// 
// const bcrypt = require('bcryptjs');
// const prisma = require('../src/prisma/client');
//
// const setupAdminPin = async () => {
//   // Find the first admin user
//   const admin = await prisma.user.findFirst({
//     where: { role: 'admin' },
//   });
//
//   if (!admin) {
//     console.error('❌ No admin user found. Please create admin user first.');
//     process.exit(1);
//   }
//
//   // Hash the PIN (for example, default PIN is '1234')
//   const plainPin = '1234';
//   const hashedPin = await bcrypt.hash(plainPin, 12);
//
//   // Update admin user with PIN
//   const updated = await prisma.user.update({
//     where: { id: admin.id },
//     data: { adminPin: hashedPin },
//   });
//
//   console.log('✅ Admin PIN configured successfully!');
//   console.log(`📝 Admin User: ${updated.name} (${updated.email})`);
//   console.log(`🔐 PIN: ${plainPin}`);
//   console.log('⚠️  CHANGE THIS PIN AFTER FIRST LOGIN!');
//   process.exit(0);
// };
//
// setupAdminPin().catch(console.error);
//
// Run: node backend/scripts/setup-admin-pin.js
//
//
// Option B: Direct Database Update (SQLite)
// -------
// 1. Get bcrypt hash of your desired PIN (e.g., '1234'):
//    - Use online tool or run: npx -y bcryptjs-cli hash -r 12 1234
//    - Copy the hash
//
// 2. Run SQL directly:
//    UPDATE users SET adminPin = '<generated_hash>' WHERE role = 'admin' LIMIT 1;
//
// 3. Verify:
//    SELECT id, name, email, adminPin FROM users WHERE role = 'admin';


// =====================================================================
// 3. BACKEND API ENDPOINT USAGE
// =====================================================================
// 
// Endpoint: POST /api/daily-report
// Authentication: NONE (Public access)
// 
// Request Body (JSON):
// {
//   "productId": 1,              // Required: Product ID from database
//   "quantity": 5,               // Required: Quantity sold
//   "priceSell": 10000,          // Optional: Override product price
//   "qris": 0,                   // Optional: QR IS payment amount
//   "expenses": [                // Optional: Array of expenses
//     {
//       "namaBarang": "Bensin",
//       "qty": 2,
//       "harga": 15000,
//       "total": 30000,
//       "attachment": null       // Optional: Image URL or Base64
//     }
//   ],
//   "pin": "1234",               // Required: Admin PIN for verification
//   "date": "2026-04-14"         // Optional: Transaction date
// }
//
// Response (Success - 201):
// {
//   "success": true,
//   "message": "Daily report recorded successfully.",
//   "data": {
//     "saleId": 123,
//     "saleDetails": { ... },
//     "expenses": [ ... ],
//     "whatsappMessage": "📋 *Laporan Harian* ..."
//   }
// }
//
// Response (PIN Error - 401):
// {
//   "success": false,
//   "message": "Invalid PIN."
// }
//
// Response (Validation Error - 400):
// {
//   "success": false,
//   "message": "Validation error",
//   "data": [ ... ]
// }


// =====================================================================
// 4. FRONTEND USAGE
// =====================================================================
// 
// Access the Daily Report form at:
// http://localhost:5173/daily-report
//
// Features:
// - Product dropdown (shows stock count)
// - Auto-populate price from product
// - Dynamic expense list (add/remove rows)
// - Auto-calculation:
//   - Revenue = Price × Quantity
//   - Total Expenses = Sum of all expenses
//   - Net Total = Revenue - Expenses
//   - Cash to Deposit = Net Total - QRIS Payment
// - PIN validation modal
// - WhatsApp message preview & copy-to-clipboard
// - Direct WhatsApp Web link


// =====================================================================
// 5. WHATSAPP MESSAGE FORMAT
// =====================================================================
// 
// Auto-generated message includes:
// - Laporan harian header with date
// - Total pendapatan & pengeluaran
// - Detail pengeluaran items (if any)
// - Product terjual with category
// - Settlement breakdown (QRIS + Cash)
//
// Example:
// 📋 *Laporan Harian*
// _Selasa, 14 April 2026_
//
// 💰 *Pendapatan:* Rp50.000
// 📤 *Pengeluaran:* Rp15.000
//
// _Detail Pengeluaran:_
// • Bensin x2 = Rp30.000
//
// 📦 *#Terjual*
// • Produk A (small): 5 pcs
//
// 💵 *Setor:*
// .qris: Rp0
// .cash: Rp35.000


// =====================================================================
// 6. FLOW DIAGRAM
// =====================================================================
//
// USER (Frontend)
//   ↓
// [1] Fill form: Product, Quantity, Expenses, QRIS
//   ↓
// [2] Auto-calculations: Revenue, Expenses, Total, Setoran
//   ↓
// [3] Click "Simpan & Kirim WA"
//   ↓
// [4] PIN Modal appears → Enter PIN
//   ↓
// POST /api/daily-report (Body: productId, quantity, qris, expenses, pin)
//   ↓
// BACKEND (dailyReportService.js)
//   ↓
// [1] Validate product exists
// [2] Validate PIN (bcrypt.compare)
// [3] Check stock availability
// [4] Calculate totals
// [5] ATOMIC TRANSACTION:
//     - Create Sale record
//     - Create SaleExpense records (if expenses provided)
//     - Decrement product stock
// [6] Generate WhatsApp message
// [7] Return: Sale ID + Message
//   ↓
// FRONTEND (Success Modal)
//   ↓
// [1] Show success message
// [2] Display WhatsApp message preview
// [3] Offer: Copy to clipboard OR Open WhatsApp Web
// [4] Reset form for next entry


// =====================================================================
// 7. ERROR HANDLING
// =====================================================================
//
// Invalid PIN → 401 Unauthorized
//   Message: "Invalid PIN."
//
// Product not found → 404 Not Found
//   Message: "Product not found."
//
// Insufficient stock → 400 Bad Request
//   Message: "Insufficient stock. Available: X, Requested: Y"
//
// Validation error → 400 Bad Request
//   Message: "Validation error"
//   (Details: Zod validation errors)
//
// Admin PIN not configured → 500 Internal Server Error
//   Message: "Admin PIN not configured. Please set up PIN first."


// =====================================================================
// 8. DATABASE TRANSACTION GUARANTEE
// =====================================================================
//
// The daily report creation uses Prisma transaction:
// If ANY operation fails (create sale, create expenses, update stock):
//   → ALL operations are rolled back (ACID atomicity)
// This ensures DB consistency - no partial records
//
// Handled by:
// prisma.$transaction(async (tx) => { ... })


// =====================================================================
// 9. SECURITY NOTES
// =====================================================================
//
// ✅ PIN is hashed with bcrypt (salt rounds: 12)
// ✅ Comparison done via bcrypt.compare (secure comparison)
// ✅ PIN sent via HTTPS only (in production)
// ✅ No PIN stored in logs or response
// ✅ Stock update in transaction (no race conditions)
//
// ⚠️  Future Enhancements:
// - Rate limiting on /api/daily-report endpoint
// - PIN attempt counter (lock after N failures)
// - Audit log for all daily reports
// - Admin approval workflow before final submission


// =====================================================================
// 10. TESTING CHECKLIST
// =====================================================================
//
// [ ] Database migration applied successfully
// [ ] Admin PIN configured
// [ ] Backend server running on port 5000
// [ ] Frontend accessible at /daily-report route
// [ ] Product list loads in dropdown
// [ ] Stock count visible in product options
// [ ] Price auto-fills on product selection
// [ ] Expense rows add/remove correctly
// [ ] Totals calculate in real-time
// [ ] PIN validation works (test invalid PIN → error)
// [ ] PIN validation works (test correct PIN → success)
// [ ] Sale record created in database
// [ ] SaleExpense records created (if expenses provided)
// [ ] Product stock decremented correctly
// [ ] WhatsApp message formatted correctly
// [ ] Copy to clipboard works
// [ ] WhatsApp Web link opens
// [ ] Form resets after successful submission
// [ ] Existing features (Products, Sales, etc.) still work


// =====================================================================
// 11. ADMIN DASHBOARD (FUTURE)
// =====================================================================
//
// Protected endpoint: GET /api/daily-report/reports
// Requires: Auth + (admin OR owner role)
// Usage: Admin can view all daily reports with filters
// Filters: startDate, endDate, search by product name
//
// Example:
// GET /api/daily-report/reports?startDate=2026-04-01&endDate=2026-04-14&search=Produk
//
// Response:
// {
//   "success": true,
//   "data": [
//     {
//       "id": 123,
//       "productId": 1,
//       "quantity": 5,
//       "priceSell": 10000,
//       "total": 50000,
//       "profit": 25000,
//       "qris": 0,
//       "totalPengeluaran": 15000,
//       "totalSetoran": 35000,
//       "date": "2026-04-14T00:00:00Z",
//       "product": { "id": 1, "name": "Produk A", "category": "small", ... },
//       "expenses": [ ... ]
//     }
//   ]
// }


module.exports = {
  // This file is for documentation only - no exports
};
