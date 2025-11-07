# Routes System Pattern Documentation

## Overview

Your SaaS backend uses a **multi-tenant, role-based access control (RBAC)** architecture with a clear security middleware chain. This document explains how routes are organized and how to test them.

---

## Architecture Pattern

```
                    ┌─────────────────────────────────┐
                    │   Express Request                │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Routes Handler (/routes)       │
                    │  - Entry point for each domain  │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Middleware Chain (if needed)    │
                    │  1. authMiddleware (verify JWT) │
                    │  2. tenantMiddleware (verify)   │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Validation Middleware           │
                    │  - validateRequest (body)       │
                    │  - validateParams (URL)         │
                    │  - validateQuery (query params) │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Controller Handler             │
                    │  (process & call service)       │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Service Layer                  │
                    │  (business logic & DB queries) │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Prisma ORM (data access)       │
                    │  (includes tenantId filter)     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  PostgreSQL Database            │
                    │  (final data source)            │
                    └─────────────────────────────────┘
```

---

## 13 Route Modules (All Protected)

### 1. **AUTH ROUTES** (`/auth`)

**File:** `src/routes/auth.routes.ts`
**Middleware:** None (public endpoints)
**Purpose:** User registration, login, token refresh

| Method | Endpoint         | Auth | Tenant | Purpose                                  |
| ------ | ---------------- | ---- | ------ | ---------------------------------------- |
| POST   | `/auth/register` | ❌   | ❌     | Register new restaurant (creates tenant) |
| POST   | `/auth/login`    | ❌   | ❌     | Login user, get JWT + refresh token      |
| POST   | `/auth/refresh`  | ❌   | ❌     | Refresh expired JWT token                |

**Request Examples:**

```bash
# Register
POST /api/v1/auth/register
{ "email": "owner@restaurant.com", "password": "xxx", "tenantName": "My Restaurant" }

# Login
POST /api/v1/auth/login
{ "email": "owner@restaurant.com", "password": "xxx" }

# Refresh
POST /api/v1/auth/refresh
{ "refreshToken": "xxxxx" }
```

---

### 2. **TENANT ROUTES** (`/tenants`)

**File:** `src/routes/tenant.routes.ts`
**Middleware:** `authMiddleware`
**Purpose:** Manage restaurants/tenants

| Method | Endpoint       | Auth | Tenant | Purpose                            |
| ------ | -------------- | ---- | ------ | ---------------------------------- |
| POST   | `/tenants`     | ✅   | ❌     | Create new tenant (admin only)     |
| GET    | `/tenants`     | ✅   | ❌     | List all tenants (admin dashboard) |
| GET    | `/tenants/:id` | ✅   | ❌     | Get tenant details                 |

---

### 3. **MENU ROUTES** (`/menu`)

**File:** `src/routes/menu.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Manage menu items for each restaurant

| Method | Endpoint                             | Auth | Tenant | Purpose                |
| ------ | ------------------------------------ | ---- | ------ | ---------------------- |
| GET    | `/menu/:tenantId`                    | ✅   | ✅     | Get all menu items     |
| POST   | `/menu/:tenantId`                    | ✅   | ✅     | Create menu item       |
| GET    | `/menu/:tenantId/item/:itemId`       | ✅   | ✅     | Get specific menu item |
| PUT    | `/menu/:tenantId/:itemId`            | ✅   | ✅     | Update menu item       |
| PATCH  | `/menu/:tenantId/:itemId/deactivate` | ✅   | ✅     | Deactivate menu item   |
| GET    | `/menu/:tenantId/categories`         | ✅   | ✅     | Get menu categories    |
| GET    | `/menu/:tenantId/category/:category` | ✅   | ✅     | Get items by category  |

**Pattern:** All routes require `tenantId` in URL path to enforce tenant isolation.

---

### 4. **ORDER ROUTES** (`/orders`)

**File:** `src/routes/order.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Order management (create, retrieve)

| Method | Endpoint      | Auth | Tenant | Purpose           |
| ------ | ------------- | ---- | ------ | ----------------- |
| POST   | `/orders/`    | ✅   | ✅     | Create new order  |
| GET    | `/orders/:id` | ✅   | ✅     | Get order details |

---

### 5. **BOOKING ROUTES** (`/bookings`)

**File:** `src/routes/booking.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Table reservations

| Method | Endpoint                     | Auth | Tenant | Purpose                 |
| ------ | ---------------------------- | ---- | ------ | ----------------------- |
| POST   | `/bookings/`                 | ✅   | ✅     | Create table booking    |
| GET    | `/bookings/branch/:branchId` | ✅   | ✅     | List bookings by branch |

---

### 6. **KOT ROUTES** (`/kot`)

**File:** `src/routes/kot.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Kitchen Order Tickets (KOT) - send orders to kitchen

| Method | Endpoint                | Auth | Tenant | Purpose              |
| ------ | ----------------------- | ---- | ------ | -------------------- |
| GET    | `/kot/branch/:branchId` | ✅   | ✅     | List KOTs for branch |
| POST   | `/kot/:id/print`        | ✅   | ✅     | Mark KOT as printed  |

---

### 7. **INVENTORY ROUTES** (`/inventory`)

**File:** `src/routes/inventory.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Stock management

| Method | Endpoint                         | Auth | Tenant | Purpose             |
| ------ | -------------------------------- | ---- | ------ | ------------------- |
| GET    | `/inventory/:tenantId`           | ✅   | ✅     | Get all stock items |
| GET    | `/inventory/:tenantId/low-stock` | ✅   | ✅     | Get low stock items |
| POST   | `/inventory/:tenantId`           | ✅   | ✅     | Create stock item   |
| PUT    | `/inventory/:itemId`             | ✅   | ✅     | Update stock item   |
| DELETE | `/inventory/:itemId`             | ✅   | ✅     | Delete stock item   |

---

### 8. **STAFF ROUTES** (`/staff`)

**File:** `src/routes/staff.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Employee management

| Method | Endpoint                               | Auth | Tenant | Purpose                         |
| ------ | -------------------------------------- | ---- | ------ | ------------------------------- |
| GET    | `/staff/:tenantId`                     | ✅   | ✅     | List all staff                  |
| POST   | `/staff/:tenantId`                     | ✅   | ✅     | Add new staff member            |
| GET    | `/staff/:tenantId/:staffId`            | ✅   | ✅     | Get staff details               |
| PUT    | `/staff/:tenantId/:staffId`            | ✅   | ✅     | Update staff info               |
| PATCH  | `/staff/:tenantId/:staffId/deactivate` | ✅   | ✅     | Deactivate staff                |
| POST   | `/staff/:tenantId/:staffId/role`       | ✅   | ✅     | Assign role (OWNER, ADMIN, etc) |
| GET    | `/staff/:tenantId/branch/:branchId`    | ✅   | ✅     | List staff by branch            |

---

### 9. **BILLING ROUTES** (`/billing`)

**File:** `src/routes/billing.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Invoice & payment management

| Method | Endpoint                                          | Auth | Tenant | Purpose                 |
| ------ | ------------------------------------------------- | ---- | ------ | ----------------------- |
| GET    | `/billing/:tenantId`                              | ✅   | ✅     | Get invoices for tenant |
| GET    | `/billing/:tenantId/summary`                      | ✅   | ✅     | Get billing summary     |
| POST   | `/billing/:tenantId`                              | ✅   | ✅     | Create invoice          |
| GET    | `/billing/:tenantId/invoices/:invoiceId`          | ✅   | ✅     | Get invoice details     |
| POST   | `/billing/:tenantId/invoices/:invoiceId/payments` | ✅   | ✅     | Process payment         |

---

### 10. **SUBSCRIPTION ROUTES** (`/subscriptions`)

**File:** `src/routes/subscription.routes.ts`
**Middleware:** `authMiddleware` (+ `tenantMiddleware` for some)
**Purpose:** SaaS subscription control (YOU manage customer subscriptions)

| Method | Endpoint                                 | Auth | Tenant | Purpose                                    |
| ------ | ---------------------------------------- | ---- | ------ | ------------------------------------------ |
| GET    | `/subscriptions/:tenantId`               | ✅   | ✅     | Get tenant's subscription (customer view)  |
| GET    | `/subscriptions/admin`                   | ✅   | ❌     | List ALL subscriptions (admin dashboard)   |
| POST   | `/subscriptions/admin`                   | ✅   | ❌     | Create subscription for tenant             |
| PATCH  | `/subscriptions/admin/:tenantId`         | ✅   | ❌     | Update subscription (plan, amount, status) |
| DELETE | `/subscriptions/admin/:tenantId`         | ✅   | ❌     | Cancel subscription                        |
| GET    | `/subscriptions/admin/expiring/soon`     | ✅   | ❌     | Get subscriptions expiring soon            |
| GET    | `/subscriptions/admin/trials/expiring`   | ✅   | ❌     | Get trials expiring                        |
| GET    | `/subscriptions/admin/trials/expired`    | ✅   | ❌     | Get expired trials ready to charge         |
| GET    | `/subscriptions/admin/dashboard/metrics` | ✅   | ❌     | Get SaaS metrics                           |

**Key Point:** Admin routes don't use `:tenantId` in path because admins manage ALL tenants.

---

### 11. **DASHBOARD ROUTES** (`/dashboard`)

**File:** `src/routes/dashboard.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Analytics & reporting for each restaurant

| Method | Endpoint                            | Auth | Tenant | Purpose              |
| ------ | ----------------------------------- | ---- | ------ | -------------------- |
| GET    | `/dashboard/overview/:tenantId`     | ✅   | ✅     | Dashboard overview   |
| GET    | `/dashboard/analytics/:tenantId`    | ✅   | ✅     | Sales analytics      |
| GET    | `/dashboard/charts/:tenantId`       | ✅   | ✅     | Revenue charts       |
| GET    | `/dashboard/top-products/:tenantId` | ✅   | ✅     | Top selling products |

---

### 12. **REPORT ROUTES** (`/report`)

**File:** `src/routes/report.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Business reports & exports

| Method | Endpoint                         | Auth | Tenant | Purpose                     |
| ------ | -------------------------------- | ---- | ------ | --------------------------- |
| GET    | `/report/sales/:tenantId`        | ✅   | ✅     | Sales report                |
| GET    | `/report/inventory/:tenantId`    | ✅   | ✅     | Inventory report            |
| GET    | `/report/staff/:tenantId`        | ✅   | ✅     | Staff performance report    |
| GET    | `/report/payment/:tenantId`      | ✅   | ✅     | Payment report              |
| GET    | `/report/dashboard/:tenantId`    | ✅   | ✅     | Dashboard summary           |
| POST   | `/report/export/sales/:tenantId` | ✅   | ✅     | Export sales data (CSV/PDF) |

---

### 13. **UPLOAD ROUTES** (`/upload`)

**File:** `src/routes/upload.routes.ts`
**Middleware:** `authMiddleware` → `tenantMiddleware`
**Purpose:** Bulk data imports

| Method | Endpoint       | Auth | Tenant | Purpose                                   |
| ------ | -------------- | ---- | ------ | ----------------------------------------- |
| POST   | `/upload/bulk` | ✅   | ✅     | Bulk upload file (menu, staff, inventory) |

---

## Middleware Chain Explained

### **Middleware: authMiddleware**

```typescript
// File: src/middlewares/auth.middleware.ts
// Verifies JWT token from Authorization header
// Attaches req.user = { userId, email, tenantId, role }
// If no token or invalid → 401 Unauthorized
```

**Location in Request:** `Authorization: Bearer <JWT_TOKEN>`

---

### **Middleware: tenantMiddleware**

```typescript
// File: src/middlewares/tenant.middleware.ts
// Verifies user belongs to the tenant in URL params
// req.user.tenantId must match req.params.tenantId
// If mismatch → 403 Forbidden
```

**How it works:**

1. Extract `tenantId` from URL (e.g., `/menu/:tenantId`)
2. Get user's `tenantId` from JWT token
3. Compare: if they match → allow; if not → block

---

### **Middleware: validateRequest / validateParams / validateQuery**

```typescript
// Files: src/middlewares/validate.middleware.ts
// Validates incoming data against Zod schemas
// If validation fails → 400 Bad Request with error details
```

---

## Tenant Isolation Security

Every route with `authMiddleware` + `tenantMiddleware` ensures:

```typescript
User logged in as: { id: "user1", tenantId: "restaurant-A", role: "OWNER" }

Request: GET /menu/restaurant-B
┌─────────────────────────────────────────┐
│ tenantMiddleware checks:                 │
│ req.user.tenantId ("restaurant-A")      │
│ !== req.params.tenantId ("restaurant-B") │
│                                         │
│ Result: 403 FORBIDDEN ❌                 │
└─────────────────────────────────────────┘

Request: GET /menu/restaurant-A
┌─────────────────────────────────────────┐
│ tenantMiddleware checks:                 │
│ req.user.tenantId ("restaurant-A")      │
│ === req.params.tenantId ("restaurant-A") │
│                                         │
│ Result: 200 OK ✅                        │
└─────────────────────────────────────────┘
```

---

## Testing Pattern - Complete Flow

### **Test 1: Register New Restaurant**

```bash
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "restaurant1@example.com",
  "password": "password123",
  "tenantName": "Pizza Palace"
}

Response (201 Created):
{
  "user": {
    "id": "user-xyz",
    "email": "restaurant1@example.com",
    "tenantId": "tenant-123",
    "role": "OWNER"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

Extract: tenantId = "tenant-123", accessToken = "eyJhbGc..."
```

---

### **Test 2: Login**

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "restaurant1@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "user": {
    "id": "user-xyz",
    "email": "restaurant1@example.com",
    "tenantId": "tenant-123",
    "role": "OWNER"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

Extract: accessToken = "eyJhbGc..."
```

---

### **Test 3: Create Menu Item (with Authorization)**

```bash
POST http://localhost:3000/api/v1/menu/tenant-123
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "name": "Margherita Pizza",
  "category": "Pizza",
  "price": 250,
  "description": "Fresh tomato and basil pizza"
}

Response (201 Created):
{
  "id": "item-456",
  "name": "Margherita Pizza",
  "price": 250,
  "tenantId": "tenant-123",
  "createdAt": "2025-11-07T10:30:00Z"
}
```

**What Happens:**

1. ✅ `authMiddleware`: Verify JWT token → extract user
2. ✅ `tenantMiddleware`: Check user.tenantId === "tenant-123"
3. ✅ `validateRequest`: Validate POST body against schema
4. ✅ Controller calls `MenuService.createMenuItem()`
5. ✅ Service adds `tenantId: "tenant-123"` to query
6. ✅ Prisma saves: `Product { name, price, tenantId: "tenant-123" }`

---

### **Test 4: Tenant Isolation - Try to Access Other Restaurant**

```bash
POST http://localhost:3000/api/v1/menu/tenant-999
Authorization: Bearer eyJhbGc... (from restaurant-123 login)
Content-Type: application/json

{
  "name": "Cheese Pizza",
  "category": "Pizza",
  "price": 300
}

Response (403 Forbidden):
{
  "error": "Forbidden - Tenant mismatch"
}

Why: user.tenantId ("tenant-123") !== req.params.tenantId ("tenant-999")
```

---

### **Test 5: Create Subscription (Admin Controls Customer Billing)**

```bash
POST http://localhost:3000/api/v1/subscriptions/admin
Authorization: Bearer eyJhbGc... (admin token)
Content-Type: application/json

{
  "tenantId": "tenant-123",
  "plan": "STARTER",
  "billingCycle": "MONTHLY",
  "amount": 999
}

Response (201 Created):
{
  "id": "sub-789",
  "tenantId": "tenant-123",
  "status": "ACTIVE",
  "plan": "STARTER",
  "amount": 999,
  "billingCycle": "MONTHLY",
  "currentPeriodStart": "2025-11-07T00:00:00Z",
  "currentPeriodEnd": "2025-12-07T00:00:00Z"
}

Note: Admin doesn't use tenantId in path because they manage ALL tenants
```

---

### **Test 6: Get Orders for Restaurant**

```bash
GET http://localhost:3000/api/v1/orders/
Authorization: Bearer eyJhbGc... (tenant-123 user)

Response (200 OK):
{
  "orders": [
    {
      "id": "order-1",
      "tenantId": "tenant-123",
      "branchId": "branch-1",
      "total": 5000,
      "items": [...],
      "status": "PENDING"
    }
  ]
}

Note: Service automatically filters by tenantId from JWT
```

---

## Service Layer Pattern

All services follow this pattern:

```typescript
// src/services/menu.service.ts
class MenuService {
  static async createMenuItem(data: any, tenantId: string) {
    return prisma.product.create({
      data: {
        ...data,
        tenantId, // ← ALWAYS add tenantId
        branchId: data.branchId, // optional branch filtering
      },
    });
  }

  static async getMenuItems(tenantId: string) {
    return prisma.product.findMany({
      where: { tenantId }, // ← ALWAYS filter by tenantId
      include: { recipes: true },
    });
  }
}
```

**KEY RULE:** Every Prisma query must include `tenantId` in the WHERE clause!

---

## Error Responses Reference

| Status | Error                       | Cause                                   |
| ------ | --------------------------- | --------------------------------------- |
| 400    | Missing Tenant ID           | `tenantId` not in URL or missing in JWT |
| 401    | Unauthorized                | No token or invalid JWT                 |
| 403    | Forbidden - Tenant mismatch | User trying to access different tenant  |
| 422    | Validation Error            | Request body/params don't match schema  |
| 500    | Internal Server Error       | Database error or server issue          |

---

## Key Testing Scenarios

### Scenario 1: Multi-Tenant Data Isolation ✅

```
1. Create Restaurant A with user A
2. Create Restaurant B with user B
3. User A creates menu item in Restaurant A
4. User B tries to read menu from Restaurant A → 403 FORBIDDEN
5. User B reads menu from Restaurant B → 200 OK (only their items)
```

### Scenario 2: Subscription Control ✅

```
1. Admin creates subscription for Restaurant A (plan: STARTER, $999/month)
2. Admin creates subscription for Restaurant B (plan: PREMIUM, $1999/month)
3. Admin can list all subscriptions
4. Admin can upgrade Restaurant A to PREMIUM
5. Restaurant A can only view their own subscription
```

### Scenario 3: Role-Based Access ✅

```
1. Restaurant Owner can create staff with different roles
2. OWNER can see all data
3. MANAGER can see menu, orders, staff (limited)
4. WAITER can only see orders for their shift
5. KITCHEN can only see KOT tickets
```

### Scenario 4: Token Expiry ✅

```
1. Login → get accessToken (15min) + refreshToken (7 days)
2. Use accessToken for requests
3. After 15min, accessToken expires → 401 Unauthorized
4. POST /auth/refresh with refreshToken → get new accessToken
5. Continue using new accessToken
```

---

## Database Query Examples (Prisma)

### Get Menu Items for Tenant (with tenant isolation)

```typescript
const items = await prisma.product.findMany({
  where: {
    tenantId: "tenant-123", // ← Enforces isolation
  },
  include: {
    stockItems: true,
    recipes: true,
  },
});
```

### Create Order (with multi-field tenant scope)

```typescript
const order = await prisma.order.create({
  data: {
    tenantId: "tenant-123", // ← Tenant isolation
    branchId: "branch-1", // ← Optional branch filter
    tableId: "table-5",
    userId: "user-xyz",
    total: new Decimal("5000.00"), // ← Decimal for money
    items: {
      create: [
        {
          productId: "item-456",
          qty: 2,
          price: new Decimal("250.00"),
        },
      ],
    },
  },
  include: {
    items: { include: { product: true } },
  },
});
```

---

## Summary - Route Pattern Rules

1. **PUBLIC ROUTES (no middleware):**

   - `/auth/register`
   - `/auth/login`
   - `/auth/refresh`

2. **PROTECTED ROUTES (authMiddleware only):**

   - `/tenants` (admin operations)
   - `/subscriptions/admin` (platform admin)

3. **TENANT-SCOPED ROUTES (authMiddleware + tenantMiddleware):**

   - `/menu/:tenantId`
   - `/orders/`
   - `/inventory/:tenantId`
   - `/staff/:tenantId`
   - `/billing/:tenantId`
   - `/dashboard/:tenantId`
   - `/report/:tenantId`
   - `/bookings/`
   - `/kot/`
   - `/upload/`

4. **URL STRUCTURE RULE:**

   - If route needs tenant isolation → include `:tenantId` in path
   - Controller extracts tenantId from URL
   - Service passes tenantId to all Prisma queries
   - Database automatically filters by tenantId

5. **SECURITY CHAIN:**
   ```
   Request → authMiddleware (verify JWT)
   → tenantMiddleware (verify ownership)
   → validateRequest (sanitize input)
   → Controller → Service → Prisma query (with tenantId filter)
   ```

---

## Implementation Checklist

- ✅ All 13 route modules use proper middleware chain
- ✅ `tenantMiddleware` enforces data isolation
- ✅ Services always filter by tenantId
- ✅ Subscription management allows platform to control customer billing
- ✅ Admin routes exist separately from tenant routes
- ✅ All error responses return proper HTTP status codes
- ✅ Validation schemas catch bad requests early
- ✅ Database constraints enforce uniqueness per tenant

---

End of Routes System Pattern Documentation
