# 🏗️ CAFÉ SAAS BACKEND - QUICK REFERENCE GUIDE

## System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│            MULTI-TENANT SaaS PLATFORM                   │
│         (Restaurant Management System)                  │
└─────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │                                    │
    ┌──────┴──────┐                    ┌───────┴────────┐
    │  CUSTOMERS  │                    │  SUPER ADMIN   │
    │ (Restaurants)│                    │  (Company)     │
    └──────┬──────┘                    └────────┬───────┘
           │                                    │
           │  Own Tenant Data                   │  All Tenants
           │  (Multi-branch,Menu,Orders)        │  Subscriptions,Billing,Analytics
           │                                    │
           ├────────────────────┬───────────────┤
                                │
                        ┌───────▼────────┐
                        │  JWT AUTH      │
                        │  (Token Based) │
                        └────────┬───────┘
                                 │
                        ┌────────▼────────┐
                        │  EXPRESS APP   │
                        │  /api/v1/*     │
                        └────────┬───────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐          ┌───────▼───────┐        ┌──────▼──────┐
   │ ROUTES  │          │ CONTROLLERS   │        │  SERVICES   │
   └────┬────┘          └───────┬───────┘        └──────┬──────┘
        │                       │                       │
   ┌────▼─────────────────────────────────────────────▼──┐
   │                                                       │
   │         PRISMA ORM + PostgreSQL DATABASE            │
   │                                                       │
   └───────────────────────────────────────────────────────┘
```

---

## 🔑 ADMIN ROLES IN SYSTEM

### 1. 🎯 SUPER ADMIN (Platform Owner - Company)

**Number per company:** 1-5 people

Manages the entire SaaS platform and ALL restaurants

**Exclusive Admin Routes:**

- `/api/v1/subscriptions/admin` - View all subscriptions
- `/api/v1/subscriptions/admin` - Create/update/delete subscriptions
- `/api/v1/subscriptions/admin/expiring/soon` - Monitor renewals
- `/api/v1/subscriptions/admin/trials/expiring` - Track trial conversions
- `/api/v1/subscriptions/admin/trials/expired` - Ready to charge
- `/api/v1/subscriptions/admin/dashboard/metrics` - MRR/ARR/Churn metrics

**Key Responsibilities:**

- Monitor all restaurant subscriptions
- Handle subscription upgrades/downgrades
- Track renewal dates and send reminders
- Convert trials to paid customers
- Monitor MRR (Monthly Recurring Revenue)
- Manage invoicing and payments at scale
- Manage SaaS platform infrastructure

---

### 2. 🍽️ RESTAURANT OWNER (Tenant Owner)

**Number per restaurant:** Usually 1

Manages ONLY their own restaurant/café

**Tenant-Scoped Routes:**

- Can only access `/api/v1/*` with their tenantId
- Cannot see other restaurants' data
- Cannot access `/subscriptions/admin` routes (platform only)
- Can manage: menu, orders, staff, inventory, bookings

**Note:** Restaurant Owner ≠ Super Admin

- They can view their own subscription status
- They CANNOT create/manage other subscriptions
- Tenant middleware enforces data isolation

---

### 3. 👨‍💼 BRANCH MANAGER (Restaurant Manager)

**Number per restaurant:** 1-10 (varies)

Manages operations at their branch

**Limited Routes:**

- Can create/process orders
- Can manage inventory
- Cannot access billing/subscription
- Cannot manage staff (owner only)

---

### 4. 👨‍🍳 STAFF (Chef/Waiter/Cashier)

**Number per restaurant:** Many

Performs daily operations

**Limited Routes:**

- Can create orders
- Can print KOTs
- Can view menu
- No access to financial data

---

## 📊 COMPLETE ENDPOINT BREAKDOWN

### **Module 1: AUTHENTICATION** (Public)

```
POST   /api/v1/auth/register      Create user + tenant (signup)
POST   /api/v1/auth/login         Login with email/password
POST   /api/v1/auth/refresh       Refresh expired token
```

### **Module 2: TENANT MANAGEMENT**

```
POST   /api/v1/tenants            Create new restaurant
GET    /api/v1/tenants            List all accessible tenants
GET    /api/v1/tenants/:id        Get tenant details
```

### **Module 3: SUBSCRIPTIONS** (SaaS Core)

```
┌─ CUSTOMER ENDPOINTS
├─ GET    /api/v1/subscriptions/:tenantId          View own subscription

┌─ SUPER ADMIN ENDPOINTS (🔒 Admin Only)
├─ GET    /api/v1/subscriptions/admin              Dashboard - all subscriptions
├─ POST   /api/v1/subscriptions/admin              Create subscription for tenant
├─ PATCH  /api/v1/subscriptions/admin/:tenantId    Update subscription (upgrade/downgrade)
├─ DELETE /api/v1/subscriptions/admin/:tenantId    Cancel subscription
├─ GET    /api/v1/subscriptions/admin/expiring/soon         Find expiring soon
├─ GET    /api/v1/subscriptions/admin/trials/expiring       Find expiring trials
├─ GET    /api/v1/subscriptions/admin/trials/expired        Find ready to charge
└─ GET    /api/v1/subscriptions/admin/dashboard/metrics     Platform metrics
```

### **Module 4: BILLING & INVOICING**

```
GET    /api/v1/billing/:tenantId/summary           Billing overview
GET    /api/v1/billing/:tenantId                   List invoices
POST   /api/v1/billing/:tenantId                   Create invoice
GET    /api/v1/billing/:tenantId/invoices/:invoiceId         Get invoice details
POST   /api/v1/billing/:tenantId/invoices/:invoiceId/payments Record payment
```

### **Module 5: MENU MANAGEMENT**

```
GET    /api/v1/menu/:tenantId                      List menu items
POST   /api/v1/menu/:tenantId                      Add menu item
GET    /api/v1/menu/:tenantId/item/:itemId         Get item details
PUT    /api/v1/menu/:tenantId/:itemId              Update item
PATCH  /api/v1/menu/:tenantId/:itemId/deactivate  Hide item
GET    /api/v1/menu/:tenantId/categories           List categories
GET    /api/v1/menu/:tenantId/category/:category   Filter by category
```

### **Module 6: ORDER MANAGEMENT**

```
POST   /api/v1/orders                              Create order
GET    /api/v1/orders/:id                          Get order details
```

### **Module 7: KITCHEN ORDER TICKETS (KOT)**

```
GET    /api/v1/kot/branch/:branchId                Display pending KOTs
POST   /api/v1/kot/:id/print                       Print to kitchen printer
```

### **Module 8: INVENTORY MANAGEMENT**

```
GET    /api/v1/inventory/:tenantId                 List inventory
POST   /api/v1/inventory/:tenantId                 Add item
PUT    /api/v1/inventory/:itemId                   Update quantity/cost
DELETE /api/v1/inventory/:itemId                   Remove item
GET    /api/v1/inventory/:tenantId/low-stock       Alert on low stock
```

### **Module 9: STAFF MANAGEMENT**

```
GET    /api/v1/staff/:tenantId                     List staff
POST   /api/v1/staff/:tenantId                     Add staff member
GET    /api/v1/staff/:tenantId/:staffId            Get staff profile
PUT    /api/v1/staff/:tenantId/:staffId            Update staff
PATCH  /api/v1/staff/:tenantId/:staffId/deactivate Remove staff
POST   /api/v1/staff/:tenantId/:staffId/role       Change role/permissions
GET    /api/v1/staff/:tenantId/branch/:branchId    Get branch staff
```

### **Module 10: DASHBOARD & ANALYTICS**

```
GET    /api/v1/dashboard/overview/:tenantId        Quick performance snapshot
GET    /api/v1/dashboard/analytics/:tenantId       Sales analysis with filters
GET    /api/v1/dashboard/charts/:tenantId          Chart-ready data
GET    /api/v1/dashboard/top-products/:tenantId    Best sellers
```

### **Module 11: REPORTING & EXPORTS**

```
GET    /api/v1/report/sales/:tenantId              Sales report
GET    /api/v1/report/inventory/:tenantId          Inventory report
GET    /api/v1/report/staff/:tenantId              Staff performance
GET    /api/v1/report/payment/:tenantId            Payment reconciliation
GET    /api/v1/report/dashboard/:tenantId          Executive summary
POST   /api/v1/report/export/sales/:tenantId       Export to Excel/CSV
```

### **Module 12: TABLE BOOKINGS**

```
POST   /api/v1/bookings                            Create reservation
GET    /api/v1/bookings/branch/:branchId           List branch bookings
```

### **Module 13: FILE UPLOADS**

```
POST   /api/v1/upload/bulk                         Import menu/staff/inventory from Excel
```

---

## 🔐 MIDDLEWARE SECURITY FLOW

```
Request
  ▼
┌─────────────────────────────┐
│  authMiddleware             │  Verify JWT token valid
│  Checks: Authorization      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  tenantMiddleware           │  Verify user owns tenant
│  Checks: tenantId matches   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  validateMiddleware         │  Validate request data
│  Checks: Joi schemas        │
└────────┬────────────────────┘
         │
         ▼
    ✅ Request Allowed
```

---

## 📈 COMPLETE SAAS FLOW

### **Phase 1: USER SIGNUP**

```
1. POST /api/v1/auth/register
   ├─ Email, Password, Name, TenantName
   ├─ Create User + Tenant
   ├─ Create Trial Subscription (14 days free)
   └─ Return JWT + Refresh Token

2. User now has:
   - User account (authenticated)
   - One Tenant (their restaurant)
   - Trial subscription (14 days)
```

### **Phase 2: RESTAURANT SETUP**

```
3. POST /api/v1/menu/:tenantId
   └─ Add menu items (dishes)

4. POST /api/v1/staff/:tenantId
   └─ Add staff members (waiter, chef, cashier)

5. POST /api/v1/inventory/:tenantId
   └─ Add inventory items (ingredients, supplies)

6. POST /api/v1/upload/bulk
   └─ Bulk import menu/staff/inventory from Excel
```

### **Phase 3: OPERATIONS START**

```
7. POST /api/v1/orders
   └─ Create customer order

8. POST /api/v1/kot/:id/print
   └─ Send to kitchen printer

9. GET /api/v1/dashboard/overview/:tenantId
   └─ Monitor today's sales

10. POST /api/v1/billing/:tenantId/invoices/:invoiceId/payments
    └─ Collect customer payment
```

### **Phase 4: MONITORING & ANALYTICS**

```
11. GET /api/v1/dashboard/analytics/:tenantId
    └─ View sales trends

12. GET /api/v1/report/sales/:tenantId
    └─ Generate sales report

13. GET /api/v1/inventory/:tenantId/low-stock
    └─ Alert on low inventory

14. GET /api/v1/report/export/sales/:tenantId
    └─ Export for accounting software
```

### **Phase 5: SUBSCRIPTION RENEWAL (Super Admin)**

```
15. GET /api/v1/subscriptions/admin/expiring/soon
    └─ Find subscriptions expiring in next 7 days

16. GET /api/v1/subscriptions/admin/trials/expired
    └─ Find trials ready to charge

17. PATCH /api/v1/subscriptions/admin/:tenantId
    └─ Upgrade subscription plan (if requested)

18. POST /api/v1/billing/:tenantId (auto-generated)
    └─ Create subscription renewal invoice

19. GET /api/v1/subscriptions/admin/dashboard/metrics
    └─ Track MRR, ARR, churn rate
```

---

## 🎯 ROLE-BASED ACCESS CONTROL

### **SUPER ADMIN** 🔒 (Platform Company Staff)

**Count:** 1-5 per company

```
✅ View ALL subscriptions across all restaurants
✅ Manage subscription lifecycle (create/update/cancel)
✅ Monitor SaaS metrics (MRR, ARR, churn)
✅ View ALL invoices and payments
✅ Access subscription admin routes:
   - /api/v1/subscriptions/admin
   - /api/v1/subscriptions/admin/expiring/soon
   - /api/v1/subscriptions/admin/trials/*
✅ Manage tenant creation/deletion
❌ NOT responsible for restaurant operations

Code Check: Role.ADMIN or Role.OWNER (platform level)
```

### **RESTAURANT OWNER** (Tenant Owner)

**Count:** 1 per restaurant

```
✅ View OWN subscription status
✅ Manage OWN menu items
✅ Manage OWN staff
✅ Process orders at own restaurant
✅ View OWN invoices
✅ View OWN reports & analytics
✅ Manage own inventory
✅ Create bookings
❌ CANNOT access /api/v1/subscriptions/admin
❌ CANNOT see other restaurants
❌ CANNOT change subscription (must request admin)
❌ Tenant middleware blocks cross-tenant access

Code Check: Role.OWNER (restaurant tenant)
```

### **BRANCH MANAGER** (Restaurant Manager)

**Count:** 1-10 per restaurant

```
✅ Create/process orders
✅ Manage inventory (own branch)
✅ View branch dashboard
✅ View staff performance (own branch)
❌ Cannot manage subscription
❌ Cannot manage billing
❌ Cannot manage staff (owner only)

Code Check: Role.MANAGER
```

### **STAFF** (Chef/Waiter/Cashier)

**Count:** Many per restaurant

```
✅ Create/view orders
✅ View menu items
✅ Print KOTs (Kitchen Order Tickets)
✅ View bookings
❌ Cannot access financial data
❌ Cannot manage staff
❌ Cannot manage inventory

Code Check: Role.STAFF, Role.CASHIER, Role.CHEF, Role.WAITER
```

---

## 💡 KEY DESIGN CONCEPTS

### **Multi-Tenancy**

- Each restaurant = separate Tenant
- Data completely isolated
- Users can only access their own tenant
- Enforced via tenantId in every request

### **Subscription Model**

- Trial period (free for 14 days)
- Monthly/Yearly billing cycles
- Plans: Basic, Premium, Enterprise
- Auto-renewal with payment provider

### **Status State Machines**

```
Subscription:
TRIAL → ACTIVE → EXPIRING → EXPIRED → CANCELLED

Order:
PENDING → IN_PROGRESS → READY → COMPLETED

Invoice:
DRAFT → ISSUED → PENDING → PAID/OVERDUE
```

### **Soft Deletes**

- Items marked inactive instead of deleted
- Maintains audit trail
- Examples: Menu items, Staff, Inventory

### **Audit Trail**

- Track who changed what and when
- Important for compliance
- Valuable for troubleshooting

---

## 🚀 PRODUCTION CHECKLIST

- [ ] Add MFA (Multi-Factor Authentication)
- [ ] Add password reset flow
- [ ] Add token blacklisting
- [ ] Integrate payment gateway (Stripe/Razorpay)
- [ ] Add email notifications
- [ ] Add SMS alerts
- [ ] Setup automated subscription renewals
- [ ] Add advanced logging and monitoring
- [ ] Add rate limiting on all endpoints
- [ ] Add CORS whitelist
- [ ] Setup automated backups
- [ ] Add CI/CD pipeline
- [ ] Setup error tracking (Sentry)
- [ ] Add analytics tracking
- [ ] Setup webhook handlers for payments

---

**Total Endpoints:** 62+ endpoints
**Base URL:** `/api/v1`
**Authentication:** JWT (Bearer Token)
**Architecture:** Express.js + TypeScript + Prisma + PostgreSQL
**Multi-Tenancy:** ✅ Fully Implemented
**RBAC:** ✅ Implemented

---

📍 **See:** `SAAS_FLOW_DOCUMENTATION.md` for detailed endpoint documentation
