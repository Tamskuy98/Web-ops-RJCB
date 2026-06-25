# Daily Report API - Test Requests

## Test with curl, Postman, or API client

### Base URL
```
http://localhost:5000/api
```

---

## 1. Test Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "API is running"
}
```

---

## 2. POST /daily-report - Valid Request

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Daily report recorded successfully.",
  "data": {
    "saleId": 123,
    "saleDetails": {
      "id": 123,
      "productId": 1,
      "quantity": 5,
      "priceSell": 10000,
      "total": 50000,
      "profit": 25000,
      "qris": 0,
      "totalPengeluaran": 30000,
      "totalSetoran": 20000,
      "date": "2026-04-14T12:00:00Z",
      "product": {
        "id": 1,
        "name": "Produk A",
        "category": "small",
        ...
      }
    },
    "expenses": [
      {
        "id": 456,
        "saleId": 123,
        "namaBarang": "Bensin",
        "qty": 2,
        "harga": 15000,
        "total": 30000,
        ...
      }
    ],
    "whatsappMessage": "📋 *Laporan Harian*..."
  }
}
```

---

## 3. POST /daily-report - Invalid PIN

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 5,
    "priceSell": 10000,
    "pin": "9999"
  }'
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid PIN."
}
```

---

## 4. POST /daily-report - Insufficient Stock

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 9999,
    "priceSell": 10000,
    "pin": "1234"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 10, Requested: 9999"
}
```

---

## 5. POST /daily-report - Invalid Product

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 99999,
    "quantity": 5,
    "priceSell": 10000,
    "pin": "1234"
  }'
```

**Expected Response (404):**
```json
{
  "success": false,
  "message": "Product not found."
}
```

---

## 6. POST /daily-report - Validation Error (Missing PIN)

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 5,
    "priceSell": 10000
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "data": [
    {
      "code": "too_small",
      "minimum": 4,
      "type": "string",
      "path": ["pin"],
      "message": "PIN must be at least 4 characters"
    }
  ]
}
```

---

## 7. POST /daily-report - With Optional Fields

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 3,
    "priceSell": 12500,
    "qris": 20000,
    "expenses": [],
    "pin": "1234",
    "date": "2026-04-13"
  }'
```

**Response (201) with all fields:**
```json
{
  "success": true,
  "message": "Daily report recorded successfully.",
  "data": {
    "saleId": 124,
    "saleDetails": {
      "totalRevenue": 37500,
      "totalPengeluaran": 0,
      "totalSetoran": 17500
    },
    "expenses": [],
    "whatsappMessage": "..."
  }
}
```

---

## 8. GET /api/daily-report/reports (Protected - Requires Login)

```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Then fetch reports
curl http://localhost:5000/api/daily-report/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Daily reports retrieved successfully.",
  "data": [
    {
      "id": 123,
      "productId": 1,
      "quantity": 5,
      "priceSell": 10000,
      "total": 50000,
      "profit": 25000,
      "qris": 0,
      "totalPengeluaran": 30000,
      "totalSetoran": 20000,
      "date": "2026-04-14T12:00:00Z",
      "product": { ... },
      "expenses": [ ... ]
    }
  ]
}
```

---

## 9. GET /api/daily-report/reports - With Filters

```bash
curl "http://localhost:5000/api/daily-report/reports?startDate=2026-04-01&endDate=2026-04-14&search=Produk" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. POST /daily-report - Multiple Expenses

```bash
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 2,
    "quantity": 10,
    "priceSell": 5000,
    "qris": 25000,
    "expenses": [
      {
        "namaBarang": "Bensin",
        "qty": 2,
        "harga": 15000,
        "total": 30000
      },
      {
        "namaBarang": "Makanan",
        "qty": 3,
        "harga": 10000,
        "total": 30000
      },
      {
        "namaBarang": "Transportasi",
        "qty": 1,
        "harga": 20000,
        "total": 20000
      }
    ],
    "pin": "1234"
  }'
```

**WhatsApp Message Generated:**
```
📋 *Laporan Harian*
_Senin, 14 April 2026_

💰 *Pendapatan:* Rp50.000
📤 *Pengeluaran:* Rp80.000

_Detail Pengeluaran:_
• Bensin x2 = Rp30.000
• Makanan x3 = Rp30.000
• Transportasi x1 = Rp20.000

📦 *#Terjual*
• Produk B (large): 10 pcs

💵 *Setor:*
.qris: Rp25.000
.cash: Rp-55.000
```

---

## Test Sequence (Manual Testing)

### Setup
1. Ensure backend running on 5000
2. PIN is configured as "1234"
3. At least one product exists with stock > 0

### Run Tests
```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Valid submission
curl -X POST ... (Test #2)

# 3. Wrong PIN
curl -X POST ... (Test #3)

# 4. Insufficient stock
curl -X POST ... (Test #4)

# 5. Invalid product
curl -X POST ... (Test #5)

# 6. Missing validation
curl -X POST ... (Test #6)
```

### Expected Flow
- Test 2 ✅ Status 201
- Test 3 ✅ Status 401 (Invalid PIN)
- Test 4 ✅ Status 400 (Insufficient stock)
- Test 5 ✅ Status 404 (Not found)
- Test 6 ✅ Status 400 (Validation error)

---

## Postman Collection (Paste in Postman)

[Create these requests in Postman]:
- **Environment**: BASE_URL = http://localhost:5000
- **Folder**: Daily Report Tests

### Requests
1. POST Daily Report - Valid
2. POST Daily Report - Invalid PIN
3. POST Daily Report - Low Stock
4. POST Daily Report - Invalid Product
5. GET Daily Reports (requires token)

---

## Notes

- All timestamps in API responses are ISO 8601 format
- Prices are in Indonesian Rupiah (no decimals)
- PIN is checked via bcrypt (case-sensitive)
- Expenses array is optional
- QRIS amount is optional (defaults to 0)
- date field is optional (defaults to now())

---

## Debugging

### View Database
```bash
cd backend
npx prisma studio
# Opens: http://localhost:5555
# Check: users, products, sales, sale_expenses tables
```

### Check Server Logs
- Look for error messages in terminal where `npm run dev` is running
- Check request/response in browser DevTools (Network tab)

### Verify PIN Hash
```bash
# In Node REPL:
const bcrypt = require('bcryptjs');
bcrypt.compare('1234', '<hash_from_db>')
  .then(result => console.log(result)) // true/false
```
