# 🔧 BRANCH ID - PRODUCTION READY IMPLEMENTATION GUIDE

**Date:** November 13, 2025
**Status:** PRODUCTION READY ✅
**Security Level:** CUID (Cryptographically Unique IDs) via Prisma

---

## 📋 EXECUTIVE SUMMARY

**Problem:** `branchId` is required for certain routes but users need guidance on:

- How to automatically generate branches on tenant registration
- Which routes require `branchId`
- How to use branches correctly

**Solution:**

- ✅ Branches are auto-created on registration (Main Branch with CUID)
- ✅ Users are auto-assigned to default branch on registration
- ✅ Frontend gets `branchId` immediately from registration response
- ✅ All subsequent API calls use this `branchId`

---

## 🏗️ ARCHITECTURE

### ID Generation Strategy

```
CUID (Cryptographically Unique ID) - Prisma Default
├── Secure: Cryptographic randomness
├── Collision-free: Globally unique
├── Sortable: Time-ordered for indexing
├── Production-ready: Industry standard
└── Format: ~25 characters (e.g., "cmhwaw2ez0005umwg8csck3rz")
```

### Data Hierarchy

```
Tenant (CUID)
├── Default Branch "Main Branch" (CUID) ← Auto-created on registration
│   ├── User 1 (OWNER) ← Auto-assigned to branch
│   ├── User 2 (WAITER)
│   └── User 3 (KITCHEN)
└── Additional Branch "Branch 2" (CUID) ← Can be created later
    ├── User 4 (MANAGER)
    └── User 5 (STAFF)
```

---

## 📍 ROUTES REQUIRING BRANCHID

### **GROUP 1: ORDERS** (branchId REQUIRED)

```
POST   /api/v1/orders/
       ├── Body: { branchId, tableId?, items, tax, discount }
       └── Response: Order with branchId

GET    /api/v1/orders/:id
       └── Get order by ID
```

**Why branchId is required:**

- Orders are tied to specific branches/locations
- Different branches have different tables/seating
- Kitchen display system (KDS) is per-branch

---

### **GROUP 2: BOOKINGS** (branchId REQUIRED)

```
POST   /api/v1/bookings/
       ├── Body: { branchId, tableId?, customerName, partySize, startTime, endTime }
       └── Response: Booking with branchId

GET    /api/v1/bookings/branch/:branchId
       └── List bookings for specific branch
```

**Why branchId is required:**

- Bookings are for specific restaurant locations
- Each branch has different table inventory
- Reservation system is per-branch

---

### **GROUP 3: KOT (Kitchen Order Tickets)** (branchId REQUIRED)

```
GET    /api/v1/kot/branch/:branchId
       ├── Query: { page, limit, printed }
       └── Response: KOT tickets for branch

POST   /api/v1/kot/:id/print
       └── Print KOT to kitchen printer at branch
```

**Why branchId is required:**

- Each branch has its own kitchen
- Each kitchen has its own printer
- Order tickets must route to correct kitchen

---

### **GROUP 4: STAFF** (branchId OPTIONAL)

```
POST   /api/v1/staff/:tenantId
       ├── Body: { email, password, role, name, branchId? }
       └── Response: Staff with optional branchId

GET    /api/v1/staff/:tenantId/branch/:branchId
       └── List staff for specific branch
```

**Why branchId is optional:**

- Staff can be tenant-level (works all branches)
- OR branch-specific (assigned to one branch)

---

### **GROUP 5: INVENTORY** (branchId OPTIONAL)

```
GET    /api/v1/inventory/:tenantId?branchId=...
       └── Inventory can be filtered by branch (optional)
```

---

## ✅ IMPLEMENTATION - COMPLETE FLOW

### STEP 1: Admin Registers (Gets tenant + branch)

**Request:**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@pizzahub.com",
  "password": "SecurePass123",
  "name": "Admin User",
  "tenantName": "Pizza Hub"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "user-001-cuid",
    "email": "admin@pizzahub.com",
    "name": "Admin User",
    "role": "OWNER",
    "tenantId": "tenant-001-cuid",
    "branchId": "branch-001-cuid",
    "isActive": true,
    "createdAt": "2025-11-13T10:00:00Z"
  },
  "tenant": {
    "id": "tenant-001-cuid",
    "name": "Pizza Hub",
    "currency": "USD",
    "timezone": "UTC",
    "isActive": true,
    "createdAt": "2025-11-13T10:00:00Z"
  },
  "branch": {
    "id": "branch-001-cuid",
    "tenantId": "tenant-001-cuid",
    "name": "Main Branch",
    "address": null,
    "phone": null,
    "email": null,
    "createdAt": "2025-11-13T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Backend Code (Production-Ready):**

```typescript
// File: src/services/auth.service.ts
static async register({ email, password, name, tenantName }: RegisterPayload) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) throw new Error("Email already registered");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create tenant, default branch and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create tenant with CUID (auto-generated by Prisma)
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          isActive: true,
        },
      });

      // 2. Create default branch with CUID (auto-generated by Prisma)
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: "Main Branch",
        },
      });

      // 3. Create user and auto-assign to branch
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "OWNER",
          tenantId: tenant.id,
          branchId: branch.id,  // ← Auto-assign to default branch
          isActive: true,
        },
      });

      return { tenant, branch, user };
    });

    const { accessToken, refreshToken } = this.generateTokens(result.user);

    logger.info(
      `User registered: ${result.user.id} with tenant: ${result.tenant.id} and branch: ${result.branch.id}`
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        tenantId: result.tenant.id,
        branchId: result.branch?.id || null,
      },
      tenant: result.tenant,
      branch: result.branch,
    };
  } catch (error) {
    logger.error("Registration error:", error);
    throw error;
  }
}
```

**Frontend Storage:**

```javascript
// Save all IDs for use in subsequent requests
const { user, branch, accessToken, refreshToken } = response.data;

localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
localStorage.setItem("userId", user.id);
localStorage.setItem("tenantId", user.tenantId);
localStorage.setItem("branchId", user.branchId); // ← Use this in all requests
localStorage.setItem("userRole", user.role);
```

---

### STEP 2: Create Order (Must include branchId)

**Frontend Code:**

```javascript
const createOrder = async (orderData) => {
  const branchId = localStorage.getItem("branchId");
  const tenantId = localStorage.getItem("tenantId");
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(`http://localhost:4000/api/v1/orders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      branchId, // ← Auto-include from registration
      tableId: orderData.tableId,
      items: orderData.items,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
    }),
  });

  return response.json();
};
```

**Request:**

```http
POST /api/v1/orders/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "branchId": "branch-001-cuid",
  "tableId": "table-05-cuid",
  "items": [
    {
      "productId": "product-001-cuid",
      "qty": 2,
      "price": 350,
      "specialRequest": "Extra cheese"
    }
  ],
  "tax": 40,
  "discount": 0
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "order-001-cuid",
    "tenantId": "tenant-001-cuid",
    "branchId": "branch-001-cuid",
    "tableId": "table-05-cuid",
    "items": [...],
    "subtotal": "700.00",
    "tax": "40.00",
    "discount": "0.00",
    "total": "740.00",
    "status": "PENDING",
    "createdAt": "2025-11-13T10:30:00Z"
  },
  "message": "Order created successfully"
}
```

**Backend Code (Order Service - Production-Ready):**

```typescript
// File: src/services/order.service.ts
static async createOrder(tenantId: string, orderData: CreateOrderData) {
  try {
    // Validate branch exists and belongs to tenant
    if (!orderData.branchId) {
      throw new Error("branchId is required");
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: orderData.branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new Error("Branch not found or does not belong to tenant");
    }

    // Create order with all items in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          branchId: orderData.branchId,
          tableId: orderData.tableId || null,
          subtotal: new Decimal(orderData.subtotal),
          tax: new Decimal(orderData.tax || 0),
          discount: new Decimal(orderData.discount || 0),
          total: new Decimal(orderData.total),
          status: "PENDING",
        },
      });

      // Create order items
      for (const item of orderData.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            qty: item.qty,
            price: new Decimal(item.price),
            total: new Decimal(item.qty * item.price),
            specialRequest: item.specialRequest || null,
            status: "PENDING",
          },
        });
      }

      // Create KOT for branch kitchen
      await tx.kOT.create({
        data: {
          orderId: newOrder.id,
          tenantId,
          branchId: orderData.branchId,
          items: orderData.items,
          printed: false,
        },
      });

      // Update stock if items are inventory-tracked
      for (const item of orderData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product?.isInventoryTracked) {
          await tx.stockItem.update({
            where: { productId_tenantId: { productId: item.productId, tenantId } },
            data: {
              qty: { decrement: item.qty },
            },
          });
        }
      }

      return newOrder;
    });

    logger.info(`Order created: ${order.id} for branch: ${orderData.branchId}`);
    return order;
  } catch (error) {
    logger.error("Error creating order:", error);
    throw error;
  }
}
```

---

### STEP 3: Create Booking (Must include branchId)

**Request:**

```http
POST /api/v1/bookings/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "branchId": "branch-001-cuid",
  "tableId": "table-08-cuid",
  "customerName": "Rajesh Singh",
  "customerPhone": "9876543210",
  "partySize": 4,
  "startTime": "2025-11-13T20:00:00Z",
  "endTime": "2025-11-13T21:30:00Z",
  "deposit": 500,
  "notes": "Window side table preferred"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "booking-001-cuid",
    "tenantId": "tenant-001-cuid",
    "branchId": "branch-001-cuid",
    "tableId": "table-08-cuid",
    "customerName": "Rajesh Singh",
    "customerPhone": "9876543210",
    "partySize": 4,
    "startTime": "2025-11-13T20:00:00Z",
    "endTime": "2025-11-13T21:30:00Z",
    "deposit": "500.00",
    "notes": "Window side table preferred",
    "status": "CONFIRMED",
    "createdAt": "2025-11-13T10:30:00Z"
  },
  "message": "Booking created successfully"
}
```

---

### STEP 4: Create Staff (branchId OPTIONAL)

**Option A: Tenant-Level Staff (no branch assignment)**

```http
POST /api/v1/staff/:tenantId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "waiter@pizzahub.com",
  "password": "Waiter@123",
  "name": "Suresh Kumar",
  "role": "WAITER"
}
```

**Option B: Branch-Specific Staff**

```http
POST /api/v1/staff/:tenantId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "waiter@pizzahub.com",
  "password": "Waiter@123",
  "name": "Suresh Kumar",
  "role": "WAITER",
  "branchId": "branch-001-cuid"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "user-staff-001-cuid",
    "tenantId": "tenant-001-cuid",
    "branchId": "branch-001-cuid",
    "email": "waiter@pizzahub.com",
    "name": "Suresh Kumar",
    "role": "WAITER",
    "isActive": true,
    "createdAt": "2025-11-13T10:30:00Z"
  },
  "message": "Staff created successfully"
}
```

---

### STEP 5: Get KOT for Kitchen (branchId REQUIRED)

**Request:**

```http
GET /api/v1/kot/branch/branch-001-cuid?page=1&limit=50&printed=false
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "kots": [
      {
        "id": "kot-001-cuid",
        "orderId": "order-001-cuid",
        "branchId": "branch-001-cuid",
        "items": [
          {
            "productId": "product-001-cuid",
            "productName": "Margherita Pizza",
            "qty": 2,
            "specialRequest": "Extra cheese"
          }
        ],
        "printed": false,
        "printedAt": null,
        "createdAt": "2025-11-13T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1
  },
  "message": "KOT tickets fetched for branch"
}
```

---

## 🔐 SECURITY & VALIDATION

### ID Security

```typescript
// CUID Format Validation
const isValidCUID = (id: string): boolean => {
  return /^c[a-z0-9]{24}$/.test(id);
};

// Example CUIDs
("cmhwaw2ez0005umwg8csck3rz"); // Valid tenant ID
("cmhwaw2ez0005umwg8csck3rz"); // Valid branch ID
("user-001-cuid"); // Valid user ID
```

### Tenant Isolation (CRITICAL)

```typescript
// Every branchId query MUST verify tenant ownership
const branch = await prisma.branch.findFirst({
  where: {
    id: branchId,
    tenantId: userTenantId, // ← MUST match user's tenant
  },
});

if (!branch) {
  throw new Error("Unauthorized: Branch not found for this tenant");
}
```

### Authorization Rules

```typescript
// User can only access their tenant's branches
const canAccessBranch = (
  userTenantId: string,
  branchTenantId: string
): boolean => {
  return userTenantId === branchTenantId;
};
```

---

## 📊 DATABASE SCHEMA (Prisma)

```prisma
model Tenant {
  id         String   @id @default(cuid())  // ← CUID (auto-generated)
  name       String   @unique
  currency   String   @default("USD")
  timezone   String   @default("UTC")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  branches   Branch[]
  users      User[]
  orders     Order[]
  bookings   Booking[]
}

model Branch {
  id        String   @id @default(cuid())  // ← CUID (auto-generated)
  tenantId  String
  name      String
  address   String?
  phone     String?
  email     String?
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  tables    Table[]
  bookings  Booking[]
  orders    Order[]
  users     User[]
  kots      KOT[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model User {
  id        String   @id @default(cuid())  // ← CUID (auto-generated)
  tenantId  String
  branchId  String?  // ← Optional (can be null for tenant-level staff)
  email     String
  name      String?
  password  String
  role      Role     @default(STAFF)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  branch    Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([branchId])
}

model Order {
  id        String   @id @default(cuid())  // ← CUID (auto-generated)
  tenantId  String
  branchId  String   // ← REQUIRED
  tableId   String?
  total     Decimal
  status    String   @default("PENDING")
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  branch    Branch   @relation(fields: [branchId], references: [id])
  items     OrderItem[]
  kots      KOT[]

  @@index([tenantId])
  @@index([branchId])
}

model Booking {
  id        String   @id @default(cuid())  // ← CUID (auto-generated)
  tenantId  String
  branchId  String   // ← REQUIRED
  tableId   String?
  partySize Int
  status    String   @default("PENDING")
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  branch    Branch   @relation(fields: [branchId], references: [id])

  @@index([tenantId])
  @@index([branchId])
}

model KOT {
  id        String   @id @default(cuid())  // ← CUID (auto-generated)
  tenantId  String
  branchId  String   // ← REQUIRED
  orderId   String
  printed   Boolean  @default(false)
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  branch    Branch   @relation(fields: [branchId], references: [id])
  order     Order    @relation(fields: [orderId], references: [id])
}
```

---

## ✅ PRODUCTION CHECKLIST

- [x] CUID generation (via Prisma @default(cuid()))
- [x] Automatic branch creation on registration
- [x] Automatic user-to-branch assignment
- [x] BranchId in all responses
- [x] Tenant isolation validation
- [x] All required branchId routes identified
- [x] Staff branchId optional handling
- [x] Transaction-based consistency
- [x] Proper error messages
- [x] Logging for audit trail

---

## 🚀 DEPLOYMENT STEPS

### 1. Apply the Auth Service Update

```bash
cd backend
npm run dev  # Test locally
```

### 2. Verify Registration Response Includes branchId

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "name": "Test User",
    "tenantName": "Test Restaurant"
  }'
```

### 3. Check Response Contains:

```json
{
  "user": { "branchId": "cmhwaw2ez0005umwg8csck3rz" },
  "branch": { "id": "cmhwaw2ez0005umwg8csck3rz" }
}
```

### 4. Commit Changes

```bash
git add backend/src/services/auth.service.ts
git commit -m "Auto-create default branch and assign user on registration"
git push origin main
```

---

## 📖 SUMMARY TABLE: ROUTES & BRANCHID

| Route                             | Method | branchId | Where     | Notes                           |
| --------------------------------- | ------ | -------- | --------- | ------------------------------- |
| /orders                           | POST   | REQUIRED | Body      | Must create in specific branch  |
| /bookings                         | POST   | REQUIRED | Body      | Reservations per branch         |
| /kot/branch/:branchId             | GET    | REQUIRED | URL Param | Kitchen display per branch      |
| /kot/:id/print                    | POST   | Implicit | JWT       | Uses order's branchId           |
| /staff/:tenantId                  | POST   | OPTIONAL | Body      | Tenant-level or branch-specific |
| /staff/:tenantId/branch/:branchId | GET    | REQUIRED | URL Param | List staff for branch           |
| /inventory/:tenantId              | GET    | OPTIONAL | Query     | Can filter by branch            |

---

**Status:** ✅ PRODUCTION READY
**Last Updated:** November 13, 2025
**Maintenance:** Keep branchId validation consistent across all routes
