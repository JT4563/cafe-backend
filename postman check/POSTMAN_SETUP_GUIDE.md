# 🚀 POSTMAN SETUP & TESTING GUIDE

**Date**: October 30, 2025
**Status**: Ready to Import

---

## 📥 STEP 1: IMPORT COLLECTION

### Option A: Direct Import

1. Open Postman
2. Click **Import** (top left)
3. Select **Postman_Collection.json** from this folder
4. Click **Import**

### Option B: Link Import

1. Open Postman
2. Click **Import** → **Link**
3. Paste: `file:///{full-path}/Postman_Collection.json`
4. Click **Import**

---

## 🔧 STEP 2: CONFIGURE VARIABLES

After import, go to **Collections** → **Cafe POS SaaS** → **Variables**

Set these environment variables:

```
baseUrl: http://localhost:5000/api/v1
accessToken: (empty - will be set after login)
refreshToken: (empty - will be set after login)
tenantId: (empty - will be set after signup)
```

---

## 🧪 STEP 3: RUN TESTS IN ORDER

### Test Sequence:

#### 1️⃣ **Authentication** (First)

```
1. POST /auth/login
   Input:
   - email: owner@cafe.com
   - password: SecurePassword123!

   Output:
   - Save accessToken to variable
   - Save refreshToken to variable
```

#### 2️⃣ **Create Tenant** (Company Creates New Cafe)

```
2. POST /tenants
   Input:
   - name: Pizza Palace
   - email: owner@pizzapalace.com
   - password: StrongPassword123!

   Output:
   - Save tenantId to variable
```

#### 3️⃣ **View Billing Summary** (Check Subscription Status)

```
3. GET /billing/{tenantId}/summary

   Response Shows:
   - totalPaid: Amount paid
   - totalPending: Amount owed
   - pendingInvoices: Count of unpaid
   - paidInvoices: Count of paid
```

#### 4️⃣ **Create Invoice** (Bill the Cafe)

```
4. POST /billing/{tenantId}
   Input:
   - orderId: {order UUID}
   - amount: 450.75
   - dueDate: 2025-11-30
```

#### 5️⃣ **Record Payment** (Mark as PAID)

```
5. POST /billing/{tenantId}/invoices/{invoiceId}/payments
   Input:
   - amount: 470.83
   - method: CARD
   - reference: TXN-12345678
```

#### 6️⃣ **Create Menu Item**

```
6. POST /menu/{tenantId}
   Input:
   - name: Cappuccino
   - price: 5.99
   - category: Beverages
```

#### 7️⃣ **Create Order**

```
7. POST /orders
   Input:
   - branchId: {branch UUID}
   - items: [{productId, quantity, price}]
   - customerName: John Doe
```

---

## 📊 COMPANY ADMIN DASHBOARD ENDPOINTS

Use these to **control all tenants' subscriptions**:

### Check Subscription Status

```
GET /billing/{tenantId}/summary

Shows:
✅ totalRevenue - Cafe's revenue
✅ totalPaid - Subscription payments received
✅ totalPending - Amount still owed
✅ pendingInvoices - Count of unpaid subscriptions
✅ paidInvoices - Count of active subscriptions
```

### List All Invoices (Paid vs Unpaid)

```
GET /billing/{tenantId}?page=1&limit=10

Shows:
- status: "PAID" (subscription active)
- status: "PENDING" (needs payment)
- status: "OVERDUE" (past due date)
- dueDate: when next payment is due

DAYS LEFT = dueDate - TODAY
```

### Mark Subscription as PAID

```
POST /billing/{tenantId}/invoices/{invoiceId}/payments

Once PAID → Subscription becomes ACTIVE
Status changes to "PAID"
```

### Create New Subscription Invoice

```
POST /billing/{tenantId}

Company bills cafe for subscription
Sends invoice with dueDate
```

---

## 🎯 COMMON WORKFLOWS

### Workflow 1: Monitor All Tenants' Subscription Status

```
1. Get list of all tenants (your database)
2. For each tenant:
   GET /billing/{tenantId}/summary

3. Check response:
   IF totalPending > 0:
      Status = "PAYMENT DUE" ⚠️
      Action = Send payment reminder

   IF daysUntilDueDate < 7:
      Status = "EXPIRES SOON" ⚠️
      Action = Send renewal reminder

   IF totalPaid > 0 AND daysUntilDueDate > 0:
      Status = "ACTIVE" ✅
```

### Workflow 2: Calculate Days Left in Subscription

```
GET /billing/{tenantId}
Find: latestInvoice.dueDate

IF latestInvoice.status = "PAID":
   daysLeft = (dueDate - NOW).days
   IF daysLeft < 0:
      Subscription = "EXPIRED" ❌

   IF daysLeft > 0:
      Subscription = "ACTIVE" ✅

   SHOW: "{daysLeft} days left"
```

### Workflow 3: Handle Unpaid Subscriptions

```
GET /billing/{tenantId}
Filter: status != "PAID"

For each unpaid invoice:
1. Check dueDate
2. IF dueDate < TODAY:
      Send overdue notice
      Consider suspending service

3. If customer pays:
   POST /billing/{tenantId}/invoices/{invoiceId}/payments
   Set status to "PAID"
   Reactivate service
```

---

## 🔑 KEY VARIABLES TO SAVE

After each request, save to variables:

### After Login:

```
Save to: {{accessToken}}
From: Response.data.accessToken

Save to: {{refreshToken}}
From: Response.data.refreshToken
```

### After Create Tenant:

```
Save to: {{tenantId}}
From: Response.data.id
```

### After Create Menu Item:

```
Save to: {{itemId}}
From: Response.data.id
```

### After Create Order:

```
Save to: {{orderId}}
From: Response.data.id
```

### After Create Invoice:

```
Save to: {{invoiceId}}
From: Response.data.id
```

---

## 📋 API ENDPOINT REFERENCE

| Operation         | Endpoint                                   | Method | Purpose                      |
| ----------------- | ------------------------------------------ | ------ | ---------------------------- |
| **Subscriptions** |                                            |        |                              |
| Get Status        | `/billing/:tenantId/summary`               | GET    | Shows paid/unpaid/days left  |
| List Invoices     | `/billing/:tenantId`                       | GET    | All subscription bills       |
| Create Invoice    | `/billing/:tenantId`                       | POST   | Bill tenant for subscription |
| Get Invoice       | `/billing/:tenantId/invoices/:id`          | GET    | View specific bill           |
| Record Payment    | `/billing/:tenantId/invoices/:id/payments` | POST   | Mark subscription as PAID    |
| **Tenants**       |                                            |        |                              |
| Create Tenant     | `/tenants`                                 | POST   | New cafe signup              |
| Get Tenant        | `/tenants/:id`                             | GET    | Tenant info + stats          |
| **Menu**          |                                            |        |                              |
| List Menu         | `/menu/:tenantId`                          | GET    | All menu items               |
| Create Item       | `/menu/:tenantId`                          | POST   | Add to menu                  |
| **Orders**        |                                            |        |                              |
| Create Order      | `/orders`                                  | POST   | POS order                    |
| Get Order         | `/orders/:id`                              | GET    | Order details                |

---

## 🐛 TROUBLESHOOTING

### Issue: 401 Unauthorized

**Solution**: Token expired

1. Go to **Auth** → **POST Refresh Token**
2. Use your refreshToken
3. Update {{accessToken}}

### Issue: 403 Forbidden

**Solution**: Wrong tenantId

1. Verify {{tenantId}} is set correctly
2. Ensure user owns that tenant

### Issue: 400 Bad Request

**Solution**: Invalid input

1. Check request body format
2. Verify all required fields present
3. Check data types (UUIDs, dates, etc.)

### Issue: 404 Not Found

**Solution**: Resource doesn't exist

1. Verify IDs are correct
2. Create the resource first

---

## ✅ VERIFICATION CHECKLIST

- ✅ Postman installed
- ✅ Collection imported
- ✅ Variables configured
- ✅ Baseurl set to `http://localhost:5000/api/v1`
- ✅ Server running (`npm run start`)
- ✅ Can login successfully
- ✅ Can create tenant
- ✅ Can check billing status
- ✅ Can create/record payments

---

## 🎓 LEARNING PATH

1. **Basic Auth** (5 min)

   - POST /auth/login
   - POST /auth/refresh

2. **Company Admin** (10 min)

   - POST /tenants (create cafe)
   - GET /tenants/:id (view cafe)
   - GET /billing/:tenantId/summary (check status)

3. **Subscription Management** (15 min)

   - POST /billing/:tenantId (create invoice)
   - GET /billing/:tenantId (list invoices)
   - POST /billing/:tenantId/invoices/:id/payments (record payment)

4. **Client Operations** (20 min)

   - POST /menu/:tenantId (create menu)
   - POST /orders (create order)
   - POST /staff/:tenantId (add staff)

5. **Advanced** (remaining)
   - Reports, Analytics, Inventory, Bookings

---

## 📞 SUPPORT

If you encounter issues:

1. Check API_IMPLEMENTATION_VERIFICATION.md for all endpoints
2. Check POSTMAN_TESTING_GUIDE.md for exact request/response formats
3. Check source code in `src/controllers/` and `src/services/`

---

**Ready to Test** ✅
Import collection and start testing!
