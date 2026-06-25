# 🚀 Daily Report Feature - Quick Start Guide

## What is This?
A **public form** for submitting daily sales reports **without login**, with:
- Product selection & stock verification
- Optional expense tracking  
- PIN-based verification (not password login)
- Auto-calculated revenue, expenses, and final deposit amount
- Auto-generated WhatsApp message

---

## ⚡ Quick Start (5 minutes)

### Step 1: Set Up Admin PIN
```bash
cd backend
node scripts/setup-admin-pin.js
# Enter PIN (4+ characters) - this is needed for form submission
```

### Step 2: Run Backend Server
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Step 3: Run Frontend Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Step 4: Access the Form
Open browser: **http://localhost:5173/daily-report**

---

## 📋 Using the Form

### Basic Flow
1. **Select Product** → Choose from dropdown (shows available stock)
2. **Enter Quantity** → How many sold
3. *(Optional) Add Expenses* → Click "Tambah" button
4. **Enter QRIS Amount** → If customer paid via QRIS (optional)
5. **Click Submit** → "Simpan & Kirim WA"
6. **Enter PIN** → The PIN you set up in Step 1
7. **Send Message** → Copy to clipboard or click "Buka WhatsApp"

### Auto-Calculations
- **Pendapatan** = Price × Quantity
- **Pengeluaran** = Sum of all expenses
- **Total Bersih** = Pendapatan - Pengeluaran
- **Setor (Cash)** = Total Bersih - QRIS

---

## 🔐 PIN Management

### Set PIN First Time
```bash
node scripts/setup-admin-pin.js
```

### Change PIN Later
Use the same setup script again.

### Test PIN
- Correct PIN: Form submits successfully
- Wrong PIN: Error message "Invalid PIN"

---

## ✅ Verify Setup

### Check 1: Backend Running
```
GET http://localhost:5000/api/health
→ Should return: { success: true, message: "API is running" }
```

### Check 2: Database Ready
```bash
# In backend folder
npx prisma studio
# Opens: http://localhost:5555
# Check: Users table has adminPin values
```

### Check 3: Frontend Accessible
```
Open: http://localhost:5173/daily-report
→ Should show form (no login required)
```

---

## 🧪 Test the Feature

### Test Case 1: Valid Submission
1. Go to /daily-report
2. Select any product
3. Enter quantity: 5
4. Click Submit
5. Enter correct PIN
6. ✅ Should show success modal with WhatsApp message

### Test Case 2: Invalid PIN
1. Go to /daily-report
2. Select any product, enter quantity
3. Click Submit
4. Enter WRONG PIN
5. ✅ Should show error: "Invalid PIN"

### Test Case 3: Insufficient Stock
1. Go to /daily-report
2. Select product
3. Enter quantity HIGHER than stock
4. Click Submit
5. ✅ Should show error about stock

### Test Case 4: With Expenses
1. Go to /daily-report
2. Select product, enter quantity
3. Click "+ Tambah" under expenses
4. Fill: Bensin x2 @ 15000
5. Click Submit, verify calculation correct
6. ✅ Expenses should appear in WhatsApp message

---

## 📊 Database Changes

New/Modified Tables:
- **users** - Added `adminPin` field
- **sales** - Added: qris, total_pengeluaran, total_setoran, attachment
- **sale_expenses** - NEW table for expense tracking

Run migration:
```bash
cd backend
npm run prisma:migrate
```

---

## 🔗 API Endpoints

### POST /api/daily-report (Public - No Login)
```json
{
  "productId": 1,
  "quantity": 5,
  "priceSell": 10000,
  "qris": 0,
  "expenses": [
    {
      "namaBarang": "Bensin",
      "qty": 2,
      "harga": 15000,
      "total": 30000
    }
  ],
  "pin": "1234"
}
```

### GET /api/daily-report/reports (Protected - Admin/Owner)
```
params: ?startDate=2026-04-01&endDate=2026-04-14&search=ProductName
```

---

## 🐛 Troubleshooting

### "Product not found"
- Check: Product exists in Products table
- Solution: Create product first

### "Insufficient stock"
- Check: Product has enough stock
- Solution: Add stock to product via Products page

### "Invalid PIN" after entering correct PIN
- Check: Admin PIN is configured correctly
- Solution: Run `node scripts/setup-admin-pin.js` again

### Form doesn't load
- Check: Frontend running on 5173
- Check: Backend running on 5000
- Solution: Restart both servers

### Server crashes on startup
- Check: Error in console
- Common: Invalid import/syntax
- Solution: Check recent code changes

---

## 📝 File Structure

```
backend/
├── src/
│   ├── services/dailyReportService.js ← Business logic
│   ├── controllers/dailyReportController.js ← Request handler
│   ├── routes/dailyReportRoutes.js ← API routes
│   └── utils/validators.js ← (Modified) Zod schemas
├── prisma/
│   ├── schema.prisma ← (Modified) Database schema
│   └── migrations/20260414000000_.../ ← Database migration
└── scripts/
    └── setup-admin-pin.js ← PIN setup tool

frontend/
├── src/
│   ├── pages/DailyReportPage.jsx ← Main form component
│   ├── pages/DailyReportPage.css ← Styles
│   └── App.jsx ← (Modified) Routes
```

---

## 🎯 What Works

✅ **Product Selection** - Shows all products with stock count
✅ **Auto Price Fill** - Price auto-loads from product
✅ **Dynamic Expenses** - Add/remove expense rows
✅ **Real-time Calculations** - All totals update instantly
✅ **PIN Validation** - Secure PIN check before saving
✅ **Database Saving** - Sale + Expenses saved atomically
✅ **Stock Management** - Automatically reduces product stock
✅ **WhatsApp Format** - Message formatted per requirements
✅ **Copy to Clipboard** - Easy message sharing
✅ **Existing Features** - All other modules still work

---

## 📞 Support

For detailed documentation, see:
- Backend: `backend/DAILY_REPORT_SETUP.md`
- Session: `/memories/session/implementation_complete.md`

---

## 🎉 You're All Set!

The Daily Report feature is ready to use. Start by:
1. ✅ Setting up PIN: `node scripts/setup-admin-pin.js`
2. ✅ Running servers: `npm run dev` (both backend & frontend)
3. ✅ Opening form: `http://localhost:5173/daily-report`
4. ✅ Testing submission with correct PIN

Happy reporting! 📊📱
