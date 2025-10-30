# 🏢 Multi-Tenant SaaS - Subscription & Service Architecture

**Document Version**: 1.0
**Date**: October 30, 2025
**System**: Cafe POS SaaS Platform
**Audience**: Business & Technical Stakeholders

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Architecture Diagrams](#2-architecture-diagrams)
3. [Subscription Management](#3-subscription-management)
4. [Service Tiers](#4-service-tiers)
5. [Client Onboarding Flow](#5-client-onboarding-flow)
6. [Data Isolation & Security](#6-data-isolation--security)
7. [Resource Management](#7-resource-management)
8. [File Structure](#8-file-structure)

---

## 1. SYSTEM OVERVIEW

### What is Multi-Tenant SaaS?

A multi-tenant SaaS platform allows multiple independent customers (cafes/restaurants) to use the same application while keeping their data completely isolated. Your company manages:

- **Single codebase** serving all customers
- **Separate databases** or **logical separation** (we use logical via tenantId)
- **Subscription management** and billing
- **Feature access control** based on subscription tier
- **Resource allocation** (staff, branches, storage)

### Your Company's Role

```
Your Company (SaaS Provider)
├── Infrastructure Management
├── Feature & Update Deployment
├── Subscription & Billing Control
├── Security & Compliance
└── Support & Maintenance
```

### Client's Role

```
Cafe/Restaurant Owner (Tenant)
├── Uses assigned features
├── Manages own data (menu, orders, staff)
├── Cannot access other tenant's data
└── Pays subscription fee
```

---

## 2. ARCHITECTURE DIAGRAMS

### 2.1 High-Level Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNET / CLIENT DEVICES                     │
│                 (Mobile App, Web Browser, Tablet)               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER (Optional)                     │
│         Distributes traffic across multiple servers             │
└────────────┬────────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
   ┌─────┐      ┌─────┐
   │ API │      │ API │
   │ #1  │      │ #2  │  ... (Scalable)
   └──┬──┘      └──┬──┘
      │            │
      └──────┬─────┘
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS API SERVER                         │
│                  (src/app.ts, src/server.ts)                    │
│                                                                  │
│  ├─ Authentication Middleware (authMiddleware)                 │
│  ├─ Tenant Extraction (tenantMiddleware)                       │
│  ├─ 12 Services / Controllers / Routes                         │
│  └─ Input Validation (validateMiddleware)                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM LAYER                              │
│           (Type-safe database query builder)                    │
│                                                                  │
│  Key Feature: WHERE tenantId = X (All queries scoped)          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                             │
│                                                                  │
│  ├─ Tenant Table (Company info, subscription tier)             │
│  ├─ User Table (Staff, with tenantId)                          │
│  ├─ Product Table (Menu items, with tenantId)                  │
│  ├─ Order Table (POS orders, with tenantId)                    │
│  ├─ Branch Table (Locations, with tenantId)                    │
│  ├─ Inventory Table (Stock, with tenantId)                     │
│  ├─ Booking Table (Reservations, with tenantId)                │
│  ├─ Invoice Table (Billing, with tenantId)                     │
│  ├─ Report Table (Analytics, with tenantId)                    │
│  └─ ... (13 more models with tenantId)                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   OPTIONAL SERVICES                              │
│                                                                  │
│  ├─ Job Queue (Print KOT, Bulk Upload)                         │
│  ├─ File Storage (Menu photos, invoices)                       │
│  ├─ Email Service (Notifications)                              │
│  ├─ Analytics Service (Usage tracking)                         │
│  └─ Logging Service (Audit trail)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Request Flow - How Tenant Data is Isolated

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT REQUEST: GET /menu/123e4567-e89b-12d3-a456-426614174000 │
│ Header: Authorization: Bearer {JWT_TOKEN}                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ JWT Validation   │
         │ (authMiddleware) │
         │                  │
         │ Extract:         │
         │ • userId         │
         │ • tenantId       │
         │ • role           │
         │ • email          │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Tenant Middleware│
         │                  │
         │ Verify tenantId  │
         │ exists in request│
         │ Attach to req    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Input Validation │
         │ (validateParams) │
         │                  │
         │ Check tenantId   │
         │ format (UUID)    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Menu Controller  │
         │                  │
         │ Extract params:  │
         │ • tenantId: 123e │
         │                  │
         │ Validate access: │
         │ user.tenantId    │
         │ ===              │
         │ param.tenantId?  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Menu Service     │
         │                  │
         │ Query Database:  │
         │ WHERE tenantId = │
         │   "123e4567..."  │
         │ AND id =         │
         │   "123e4567..."  │
         └────────┬─────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Prisma ORM Query    │
        │ (Type-safe)         │
        │                     │
        │ SELECT * FROM       │
        │ Product WHERE       │
        │ tenantId = $1       │
        │ AND id = $2         │
        │                     │
        │ ✅ SQL Injection    │
        │    Proof            │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ PostgreSQL Database │
        │                     │
        │ Returns menu item   │
        │ belonging to        │
        │ tenantId 123e4567   │
        │                     │
        │ ✅ Only this        │
        │    tenant's data    │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Success Response    │
        │ {                   │
        │   id: "123e4567",   │
        │   tenantId:         │
        │   "123e4567",       │
        │   name: "Coffee",   │
        │   price: 5.99       │
        │ }                   │
        └─────────────────────┘

KEY SECURITY POINTS:
✅ Layer 1: JWT validates user exists
✅ Layer 2: Tenant middleware extracts tenantId
✅ Layer 3: Controller validates user.tenantId === param.tenantId
✅ Layer 4: Service adds WHERE tenantId = X
✅ Layer 5: Prisma prevents SQL injection

RESULT: User can ONLY access their own tenant's data
```

---

### 2.3 Subscription Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              YOUR COMPANY'S ADMIN PANEL                          │
│                                                                  │
│  Subscriptions Management                                       │
│  ├─ View all tenants                                           │
│  ├─ Manage subscription plans                                  │
│  ├─ Upgrade/Downgrade tenants                                  │
│  ├─ Control feature access                                     │
│  ├─ View usage & analytics                                     │
│  └─ Handle billing & payments                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION TABLE                           │
│                                                                  │
│  id        | tenantId | plan      | status  | features | limit │
│  ─────────────────────────────────────────────────────────────  │
│  sub_001   | 123e     | BASIC     | ACTIVE  | [1,2,3] | 1     │
│  sub_002   | 456a     | PREMIUM   | ACTIVE  | [1-6]   | 5     │
│  sub_003   | 789b     | ENTERPRISE| ACTIVE  | [1-12]  | ∞     │
│  sub_004   | 012c     | BASIC     | EXPIRED | [1,2,3] | 1     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUBSCRIPTION TIERS (YOUR PRODUCTS)                  │
│                                                                  │
│  TIER 1: BASIC ($99/month)                                      │
│  ├─ 1 Branch/Location                                          │
│  ├─ Menu Management (Feature #1)                               │
│  ├─ Basic Orders (Feature #2)                                  │
│  ├─ Staff Management (Feature #3)                              │
│  ├─ Limited Reporting                                          │
│  └─ Email Support                                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  TIER 2: PROFESSIONAL ($299/month)                              │
│  ├─ Up to 5 Branches/Locations                                 │
│  ├─ Menu Management (Feature #1)                               │
│  ├─ Advanced Orders (Feature #2)                               │
│  ├─ Staff Management + Roles (Feature #3)                      │
│  ├─ Inventory Tracking (Feature #4)                            │
│  ├─ Advanced Reporting (Feature #5)                            │
│  ├─ Billing & Invoicing (Feature #6)                           │
│  ├─ Priority Support                                           │
│  └─ API Access                                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  TIER 3: ENTERPRISE (Custom)                                    │
│  ├─ Unlimited Branches/Locations                               │
│  ├─ ALL Features (#1-#12)                                      │
│  ├─ Custom Integrations                                        │
│  ├─ Dedicated Account Manager                                  │
│  ├─ SLA Guarantee (99.9% uptime)                               │
│  ├─ Custom Development                                         │
│  ├─ Phone Support 24/7                                         │
│  └─ On-premise Option                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. SUBSCRIPTION MANAGEMENT

### 3.1 How Your Company Controls Subscriptions

```
YOUR COMPANY CONTROL MECHANISMS:
═════════════════════════════════════════════════════════════════

1. SUBSCRIPTION TABLE (Database)
   Location: Database
   Purpose: Store subscription info per tenant
   Fields:
   ├─ tenantId (Which cafe this is for)
   ├─ planId (BASIC, PROFESSIONAL, ENTERPRISE)
   ├─ status (ACTIVE, SUSPENDED, EXPIRED)
   ├─ features (Array of allowed feature IDs)
   ├─ branchLimit (How many locations)
   ├─ usageLimit (Max orders/month, storage, etc.)
   ├─ startDate (Subscription started)
   ├─ renewalDate (When to charge next)
   ├─ price (Amount charged)
   └─ paymentMethod (Card, bank transfer, etc.)

2. FEATURE FLAGS (Code Control)
   Location: Backend logic
   Purpose: Enable/disable features per subscription

   Example:
   ├─ Feature #1: Menu Management → All tiers
   ├─ Feature #2: Orders → All tiers
   ├─ Feature #3: Staff Management → All tiers
   ├─ Feature #4: Inventory → PROFESSIONAL+
   ├─ Feature #5: Advanced Reports → PROFESSIONAL+
   ├─ Feature #6: Billing → PROFESSIONAL+
   ├─ Feature #7: Analytics/Dashboard → ENTERPRISE
   ├─ Feature #8: Multi-branch → PROFESSIONAL+ (depends on branchLimit)
   ├─ Feature #9: KOT (Kitchen) → PROFESSIONAL+
   ├─ Feature #10: Reservations/Booking → ENTERPRISE
   ├─ Feature #11: Bulk Upload → ENTERPRISE
   └─ Feature #12: API Access → ENTERPRISE

3. BILLING AUTOMATION
   Location: Backend + Payment Gateway
   Purpose: Automatic charging

   Process:
   ├─ Store subscription dates
   ├─ 7 days before renewal → Send reminder email
   ├─ On renewal date → Charge payment method
   ├─ Payment successful → Auto-renew (extend renewalDate)
   ├─ Payment failed → Send retry emails
   ├─ After 3 failed retries → Suspend tenant
   └─ Handle dunning management & chargebacks

4. RESOURCE LIMITS (API Level)
   Location: Controllers & Services
   Purpose: Enforce limits based on subscription

   Example:
   ├─ Max 1 branch for BASIC tier
   ├─ Check branchLimit before creating new branch
   ├─ Max orders/month for plan
   ├─ Storage quota per plan
   ├─ API rate limits per plan
   └─ Concurrent users per plan

5. FEATURE GATING (API Endpoints)
   Location: Middleware / Controllers
   Purpose: Block unauthorized feature access

   Example:
   GET /inventory/:tenantId
   ├─ Check if tenant subscription includes Feature #4
   ├─ If not → Return 403 Forbidden
   │         "This feature requires PROFESSIONAL plan"
   └─ If yes → Proceed with request

6. USAGE TRACKING
   Location: Analytics database
   Purpose: Monitor tenant usage for upgrades/alerts

   Track:
   ├─ Orders created (alert if near limit)
   ├─ Storage used (alert if near quota)
   ├─ API calls (rate limiting)
   ├─ Concurrent users
   ├─ Data export frequency
   └─ Support tickets
```

---

### 3.2 Subscription Lifecycle Flow

```
┌────────────────────────────────────┐
│ 1. CAFE OWNER SIGNS UP             │
│ (POST /tenants/)                   │
│                                    │
│ Input:                             │
│ • name: "My Cafe"                 │
│ • email: "owner@cafe.com"         │
│ • password: SecurePass123!        │
│ • branchName: "Main Location"     │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 2. SYSTEM CREATES TENANT           │
│ (TenantService.createTenant)       │
│                                    │
│ Creates:                           │
│ ├─ Tenant record                  │
│ ├─ Owner user account             │
│ ├─ Default branch                 │
│ └─ Assigns BASIC plan by default  │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 3. SUBSCRIPTION CREATED            │
│ (Subscription Table Entry)         │
│                                    │
│ {                                  │
│   tenantId: "uuid123",             │
│   planId: "BASIC",                │
│   status: "TRIAL",                │
│   features: [1,2,3],              │
│   branchLimit: 1,                 │
│   trialDays: 14,                  │
│   startDate: now,                 │
│   renewalDate: now+14days         │
│ }                                  │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 4. TRIAL PERIOD (14 days)          │
│ Owner uses all features FREE       │
│                                    │
│ Timeline:                          │
│ Day 1-13: Full access             │
│ Day 13: Email reminder             │
│         "Trial ending tomorrow"    │
│ Day 14: Trial expires               │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 5. PAYMENT REQUIRED                │
│ (On Day 14)                        │
│                                    │
│ Options:                           │
│ A) Add payment method              │
│    → Auto-renew subscription       │
│    → Charge $99 for BASIC          │
│    → Extend trial to 30 days       │
│                                    │
│ B) Upgrade to PROFESSIONAL         │
│    → Charge $299 for month         │
│    → More features unlocked        │
│                                    │
│ C) No payment                      │
│    → Account suspended             │
│    → Cannot access after 3 days    │
│    → Can be reactivated with       │
│      payment within 60 days        │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 6. ACTIVE SUBSCRIPTION             │
│ (Recurring)                        │
│                                    │
│ Monthly:                           │
│ ├─ Day 25: Send payment reminder   │
│ ├─ Day 30: Charge payment method   │
│ ├─ Day 30: Update renewalDate      │
│ │          (+30 days)              │
│ └─ Continue service                │
│                                    │
│ Tenant can ANYTIME:                │
│ ├─ Upgrade to higher tier          │
│ ├─ Downgrade to lower tier         │
│ │  (Prorated refund)               │
│ ├─ Cancel subscription             │
│ │  (Data retained for 60 days)     │
│ └─ Add/remove payment methods      │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 7. SUBSCRIPTION ENDS               │
│ (Cancellation or Non-Payment)      │
│                                    │
│ Immediate:                         │
│ ├─ Status set to "CANCELLED"       │
│ ├─ Features disabled               │
│ │  (All endpoints return 403)      │
│ └─ Cannot create new entities      │
│                                    │
│ After 60 days:                     │
│ ├─ Soft delete all tenant data     │
│ │  (Can be recovered by support)   │
│ └─ Hard delete after 90 days       │
└────────────────────────────────────┘
```

---

## 4. SERVICE TIERS

### 4.1 Feature Matrix by Tier

```
╔═══════════════════════════════════════════════════════════════════════════╗
║             FEATURE AVAILABILITY BY SUBSCRIPTION TIER                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║ Feature                          │ BASIC    │ PROF.    │ ENTERPRISE        ║
║ ─────────────────────────────────┼──────────┼──────────┼──────────────────┤║
║ Branches/Locations               │ 1        │ 5        │ Unlimited         ║
║ Staff Members                    │ 10       │ 50       │ Unlimited         ║
║ Menu Items                       │ 500      │ 2000     │ Unlimited         ║
║ Monthly Orders                   │ 1000     │ 10000    │ Unlimited         ║
║                                  │          │          │                   ║
║ CORE SERVICES                    │          │          │                   ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ #1  Authentication              │ ✅       │ ✅       │ ✅                ║
║ #2  Menu Management             │ ✅       │ ✅       │ ✅                ║
║ #3  Order Management            │ ✅       │ ✅       │ ✅                ║
║ #4  Staff Management            │ ✅       │ ✅       │ ✅                ║
║                                  │          │          │                   ║
║ INTERMEDIATE SERVICES           │          │          │                   ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ #5  Inventory Tracking          │ ❌       │ ✅       │ ✅                ║
║ #6  Basic Reports               │ Basic    │ Advanced │ Advanced          ║
║ #7  Billing & Invoicing         │ ❌       │ ✅       │ ✅                ║
║ #8  Multi-Branch Support        │ ❌       │ ✅       │ ✅                ║
║ #9  KOT (Kitchen Order Tickets) │ ❌       │ ✅       │ ✅                ║
║                                  │          │          │                   ║
║ ADVANCED SERVICES               │          │          │                   ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ #10 Advanced Analytics          │ ❌       │ Limited  │ ✅                ║
║ #11 Table Reservations/Booking  │ ❌       │ ❌       │ ✅                ║
║ #12 Bulk Import/Export          │ ❌       │ ❌       │ ✅                ║
║                                  │          │          │                   ║
║ SUPPORT & EXTRAS                │          │          │                   ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Support Type                     │ Email    │ Priority │ 24/7 Phone       ║
║ Response Time                    │ 24-48h   │ 4-8h     │ <1h               ║
║ API Access                       │ ❌       │ Limited  │ Full              ║
║ Custom Integrations             │ ❌       │ ❌       │ ✅                ║
║ SLA Guarantee                    │ No       │ 99%      │ 99.9%             ║
║ Dedicated Manager                │ ❌       │ ❌       │ ✅                ║
║ On-Premise Option                │ ❌       │ ❌       │ ✅                ║
║                                  │          │          │                   ║
║ PRICING                          │          │          │                   ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Monthly Price                    │ $99      │ $299     │ Custom            ║
║ Annual Price (Discount)          │ $990     │ $2790    │ Custom            ║
║                                  │ (Save    │ (Save    │                   ║
║                                  │ $198)    │ $498)    │                   ║
║                                  │          │          │                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Service Availability by Tier (API Level)

```
BASIC TIER ($99/month)
═════════════════════════════════════════════════════════════════

✅ AVAILABLE ENDPOINTS:
  POST   /auth/login                    - User login
  POST   /auth/refresh                  - Token refresh
  POST   /tenants/                      - Account setup
  GET    /tenants/:id                   - Account info

  GET    /menu/:tenantId                - View menu
  POST   /menu/:tenantId                - Create menu item
  PUT    /menu/:tenantId/:itemId        - Edit menu
  PATCH  /menu/:tenantId/:itemId        - Deactivate menu

  POST   /orders/                       - Create order
  GET    /orders/:id                    - View order

  GET    /staff/:tenantId               - View staff
  POST   /staff/:tenantId               - Create staff
  PUT    /staff/:tenantId/:staffId      - Edit staff

  GET    /report/sales/:tenantId        - Basic sales report
  GET    /dashboard/overview/:tenantId  - Simple overview

❌ BLOCKED ENDPOINTS:
  GET    /inventory/:tenantId           - 403 Forbidden
  POST   /billing/:tenantId             - 403 Forbidden
  POST   /bookings/                     - 403 Forbidden
  GET    /kot/branch/:branchId          - 403 Forbidden
  POST   /upload/bulk                   - 403 Forbidden

RESTRICTIONS:
  ├─ Maximum 1 branch
  ├─ Maximum 10 staff members
  ├─ Maximum 500 menu items
  ├─ Maximum 1000 orders/month
  └─ Response: {
      error: "Feature requires Professional plan or higher",
      upgrade_url: "https://saas.com/upgrade/123e456..."
     }


PROFESSIONAL TIER ($299/month)
═════════════════════════════════════════════════════════════════

✅ ALL BASIC ENDPOINTS PLUS:

  GET    /inventory/:tenantId           - Stock management
  POST   /inventory/:tenantId           - Add inventory
  PUT    /inventory/:itemId             - Update stock

  POST   /billing/:tenantId             - Create invoice
  GET    /billing/:tenantId/invoices    - View invoices
  GET    /billing/:tenantId/summary     - Billing summary

  GET    /report/inventory/:tenantId    - Inventory reports
  GET    /report/staff/:tenantId        - Staff reports
  GET    /report/payment/:tenantId      - Payment reports

  GET    /dashboard/analytics/:tenantId - Advanced analytics
  GET    /dashboard/top-products        - Top products

  GET    /kot/branch/:branchId          - KOT access
  POST   /kot/:id/print                 - Print KOT

❌ STILL BLOCKED:
  POST   /bookings/                     - 403 Forbidden
  POST   /upload/bulk                   - 403 Forbidden

RESTRICTIONS:
  ├─ Maximum 5 branches
  ├─ Maximum 50 staff members
  ├─ Maximum 2000 menu items
  ├─ Maximum 10000 orders/month
  └─ Advanced reporting available


ENTERPRISE TIER (Custom)
═════════════════════════════════════════════════════════════════

✅ ALL ENDPOINTS AVAILABLE:

  CORE:
  ├─ All BASIC + PROFESSIONAL endpoints
  ├─ POST /bookings/                   - Full reservation system
  ├─ GET /bookings/branch/:branchId    - View reservations

  ADVANCED:
  ├─ POST /upload/bulk                 - Bulk import/export
  ├─ GET /upload/status                - Import status
  ├─ Full API access for integrations

RESTRICTIONS:
  ├─ Unlimited branches
  ├─ Unlimited staff
  ├─ Unlimited menu items
  ├─ Unlimited orders
  ├─ Custom integrations
  ├─ Dedicated account manager
  └─ SLA: 99.9% uptime guarantee
```

---

## 5. CLIENT ONBOARDING FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: CAFE OWNER VISITS YOUR WEBSITE                           │
│ https://yourcompany.com/signup                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ Chooses Subscription Plan:         │
        │ • BASIC ($99/mo)                  │
        │ • PROFESSIONAL ($299/mo)          │
        │ • ENTERPRISE (Contact Sales)      │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Enters Registration Info:          │
        │ • Cafe Name                        │
        │ • Owner Name & Email              │
        │ • Password                        │
        │ • Location/Address                │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ System Creates Account             │
        │ (POST /tenants/)                  │
        │                                    │
        │ Creates:                           │
        │ ├─ Tenant record                  │
        │ ├─ Owner user                     │
        │ ├─ First branch                   │
        │ └─ Subscription (14-day trial)    │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Sends Welcome Email                │
        │ • Account credentials             │
        │ • Quick start guide                │
        │ • Link to dashboard                │
        │ • Support contact                  │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Owner Logs In                      │
        │ (POST /auth/login)                │
        │                                    │
        │ Receives:                          │
        │ • JWT Access Token                 │
        │ • Refresh Token                    │
        │ • User Info                        │
        │ • Tenant Info                      │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ STEP 2: STARTS USING APP           │
        │                                    │
        │ All requests include:              │
        │ • Authorization: Bearer {TOKEN}    │
        │ • tenantId extracted from token    │
        │                                    │
        │ First actions:                     │
        │ 1. Create menu items               │
        │    (POST /menu/:tenantId)         │
        │ 2. Add staff members               │
        │    (POST /staff/:tenantId)        │
        │ 3. Take first order                │
        │    (POST /orders/)                │
        │ 4. Generate report                 │
        │    (GET /report/sales/:tenantId)  │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ 14-DAY TRIAL PERIOD                │
        │ Owner uses all BASIC features FREE │
        │                                    │
        │ Timeline:                          │
        │ • Day 1-13: Full access            │
        │ • Day 10: Email: "4 days left"     │
        │ • Day 13: Email: "Last day!"       │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ STEP 3: PAYMENT REQUIRED           │
        │ (Day 14)                           │
        │                                    │
        │ Email: "Your trial ends tomorrow"  │
        │                                    │
        │ Owner choices:                     │
        │ A) Add payment card                │
        │    → Auto-charge $99 (BASIC)       │
        │    → Service continues             │
        │                                    │
        │ B) Upgrade to PROFESSIONAL         │
        │    → Add card                      │
        │    → Charge $299/mo                │
        │    → New features enabled          │
        │                                    │
        │ C) Do nothing                      │
        │    → Account suspended after 3d    │
        │    → Can reactivate within 60d     │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ STEP 4: ONGOING USAGE              │
        │                                    │
        │ Owner can:                         │
        │ • Manage all BASIC features        │
        │ • Monitor usage                    │
        │ • View billing history             │
        │ • Upgrade/downgrade anytime        │
        │                                    │
        │ Your company:                      │
        │ • Auto-charges on renewal date     │
        │ • Monitors usage metrics           │
        │ • Provides support                 │
        │ • Updates features                 │
        └────────────────────────────────────┘
```

---

## 6. DATA ISOLATION & SECURITY

### 6.1 Multi-Tenant Data Structure Example

```
TENANT A: "Coffee Dreams Cafe"
═════════════════════════════════════════════════════════════════

tenantId: 123e4567-e89b-12d3-a456-426614174000

├─ USERS (Staff)
│  ├─ User 1 (tenantId=123e)
│  │  ├─ name: "Sarah (Owner)"
│  │  ├─ role: "OWNER"
│  │  └─ branch: Main
│  │
│  ├─ User 2 (tenantId=123e)
│  │  ├─ name: "John (Waiter)"
│  │  ├─ role: "WAITER"
│  │  └─ branch: Main
│  │
│  └─ User 3 (tenantId=123e)
│     ├─ name: "Mike (Kitchen)"
│     ├─ role: "KITCHEN"
│     └─ branch: Main

├─ PRODUCTS (Menu)
│  ├─ Product 1 (tenantId=123e)
│  │  ├─ name: "Cappuccino"
│  │  ├─ price: 5.99
│  │  └─ category: Beverages
│  │
│  ├─ Product 2 (tenantId=123e)
│  │  ├─ name: "Espresso"
│  │  ├─ price: 3.99
│  │  └─ category: Beverages
│  │
│  └─ Product 3 (tenantId=123e)
│     ├─ name: "Croissant"
│     ├─ price: 2.50
│     └─ category: Pastries

├─ ORDERS
│  ├─ Order 1 (tenantId=123e)
│  │  ├─ orderId: #001
│  │  ├─ items: [Cappuccino, Croissant]
│  │  ├─ total: $8.49
│  │  └─ status: COMPLETED
│  │
│  └─ Order 2 (tenantId=123e)
│     ├─ orderId: #002
│     ├─ items: [Espresso]
│     ├─ total: $3.99
│     └─ status: IN_PROGRESS


TENANT B: "Pizza Palace"
═════════════════════════════════════════════════════════════════

tenantId: 456a7890-bcde-f123-4567-890abcdef123

├─ USERS (Staff)
│  ├─ User 1 (tenantId=456a)
│  │  ├─ name: "Marco (Owner)"
│  │  ├─ role: "OWNER"
│  │  └─ branch: Main
│  │
│  ├─ User 2 (tenantId=456a)
│  │  ├─ name: "Giuseppe (Chef)"
│  │  ├─ role: "KITCHEN"
│  │  └─ branch: Main
│  │
│  └─ User 3 (tenantId=456a)
│     ├─ name: "Antonio (Waiter)"
│     ├─ role: "WAITER"
│     └─ branch: Main

├─ PRODUCTS (Menu)
│  ├─ Product 1 (tenantId=456a)
│  │  ├─ name: "Margherita"
│  │  ├─ price: 12.99
│  │  └─ category: Pizza
│  │
│  ├─ Product 2 (tenantId=456a)
│  │  ├─ name: "Pepperoni"
│  │  ├─ price: 14.99
│  │  └─ category: Pizza
│  │
│  └─ Product 3 (tenantId=456a)
│     ├─ name: "Garlic Bread"
│     ├─ price: 4.99
│     └─ category: Appetizers

├─ ORDERS
│  ├─ Order 1 (tenantId=456a)
│  │  ├─ orderId: #001
│  │  ├─ items: [Margherita]
│  │  ├─ total: $12.99
│  │  └─ status: COMPLETED
│  │
│  └─ Order 2 (tenantId=456a)
│     ├─ orderId: #002
│     ├─ items: [Pepperoni, Garlic Bread]
│     ├─ total: $19.98
│     └─ status: IN_PROGRESS


KEY ISOLATION MECHANISM:
═════════════════════════════════════════════════════════════════

When Sarah (Coffee Dreams) logs in:
│
├─ JWT contains: tenantId = 123e4567...
│
├─ Database query for Menu:
│  WHERE tenantId = 123e4567 AND ...
│
├─ Result: Only Coffee Dreams menu items
│  ├─ Cappuccino
│  ├─ Espresso
│  └─ Croissant
│
└─ Pizza Palace menu stays completely hidden
   ├─ Margherita (NOT visible to Sarah)
   ├─ Pepperoni (NOT visible to Sarah)
   └─ Garlic Bread (NOT visible to Sarah)


RESULT:
✅ Sarah can ONLY see her own data
✅ Marco cannot see Coffee Dreams data
✅ No cross-tenant data leakage possible
✅ Separation enforced at database query level
```

---

## 7. RESOURCE MANAGEMENT

### 7.1 Usage Tracking & Limits

```
YOUR ADMIN DASHBOARD TRACKS:
═════════════════════════════════════════════════════════════════

For Each Tenant:
┌─────────────────────────────────────────────────────────────┐
│ Tenant: Coffee Dreams Cafe (123e4567...)                    │
│ Plan: BASIC ($99/month)                                     │
│ Status: ACTIVE                                              │
│                                                              │
│ USAGE METRICS:                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Staff Members:        3 / 10                         │   │
│ │ ▓▓▓░░░░░░░░░░░░░░░░░                               │   │
│ │                                                      │   │
│ │ Menu Items:          45 / 500                       │   │
│ │ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │                                                      │   │
│ │ Monthly Orders:     287 / 1000                      │   │
│ │ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │                                                      │   │
│ │ Storage Used:      2.3 GB (unlimited)              │   │
│ │ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │                                                      │   │
│ │ API Calls Today:    1,234 / 100,000               │   │
│ │ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │                                                      │   │
│ │ Concurrent Users:     2 / 5                        │   │
│ │ ▓▓░░░░░░░░░░░░░░░░░░                             │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ALERTS:                                                     │
│ ⚠️ Approaching order limit (85% used next month)           │
│ ⚠️ Recommend upgrade to PROFESSIONAL tier                   │
│                                                              │
│ ACTIONS:                                                    │
│ [View Details] [Send Upgrade Email] [Suspend] [Renew]     │
└─────────────────────────────────────────────────────────────┘


AUTOMATIC ENFORCEMENT:
═════════════════════════════════════════════════════════════════

When Coffee Dreams tries to add a 4th staff member (limit=1 for BASIC):

Request: POST /staff/123e4567
Body: { email: "newstaff@cafe.com", name: "Lisa" }

System checks:
├─ Current staff count: 3
├─ Check plan limit: BASIC = 1 branch max
├─ 1 branch < limit ✓
│
├─ But also check: "Can they add MORE staff?"
├─ Current: 3 staff + 1 new = 4 staff
├─ BASIC tier limit: 10 staff
├─ 4 < 10 ✓ ALLOWED
│
└─ Response: Success! Staff member created

---

When Coffee Dreams tries to add a 11th staff member:

Request: POST /staff/123e4567
Body: { email: "staff11@cafe.com", name: "David" }

System checks:
├─ Current staff count: 10
├─ Check plan limit: BASIC = max 10 staff
├─ New total: 10 + 1 = 11
├─ 11 > 10 ✗ EXCEEDED
│
└─ Response: 403 Forbidden
   {
     error: "Staff limit exceeded",
     message: "Your BASIC plan allows maximum 10 staff members.
               You currently have 10.",
     suggestion: "Upgrade to PROFESSIONAL plan for 50 staff members",
     upgrade_link: "https://saas.com/upgrade/123e4567..."
   }

---

When Coffee Dreams tries to create 2nd branch (limit=1 for BASIC):

Request: POST /branches/123e4567
Body: { name: "Downtown Location", address: "123 Main St" }

System checks:
├─ Current branches: 1
├─ Check plan limit: BASIC = max 1 branch
├─ New total: 1 + 1 = 2
├─ 2 > 1 ✗ EXCEEDED
│
└─ Response: 403 Forbidden
   {
     error: "Branch limit exceeded",
     message: "Your BASIC plan allows only 1 location.
               You currently have 1.",
     suggestion: "Upgrade to PROFESSIONAL for 5 locations
                  or ENTERPRISE for unlimited",
     upgrade_link: "https://saas.com/upgrade/123e4567..."
   }
```

---

## 8. FILE STRUCTURE

### 8.1 Project Files Referenced (No Code Shown)

```
d:\cafe-saas-backend
│
├─ 📄 PRODUCTION_READINESS_AUDIT.md         [Production checklist]
│
├─ 📄 MULTI_TENANT_SAAS_VERIFICATION.md     [Tenant isolation proof]
│
├─ 📄 MULTI_TENANT_SAAS_ARCHITECTURE.md     [This document]
│
├─ prisma/
│  ├─ 📄 schema.prisma                      [Database models - 16 models]
│  │  ├─ Tenant model (with features/limits)
│  │  ├─ User model (with tenantId)
│  │  ├─ Product model (menu, with tenantId)
│  │  ├─ Order model (POS, with tenantId)
│  │  ├─ OrderItem model (order details)
│  │  ├─ Branch model (locations, with tenantId)
│  │  ├─ Staff model (employees, with tenantId)
│  │  ├─ Inventory model (stock, with tenantId)
│  │  ├─ StockMovement model (audit trail)
│  │  ├─ Booking model (reservations, with tenantId)
│  │  ├─ Invoice model (billing, with tenantId)
│  │  ├─ Payment model (transactions)
│  │  ├─ Report model (audit logs)
│  │  ├─ KOT model (kitchen tickets, with tenantId)
│  │  ├─ BulkImportJob model (async imports)
│  │  ├─ Subscription model (billing info)
│  │  └─ FeatureFlag model (subscription features)
│  │
│  └─ 📄 migrations/                        [Database versioning]
│
├─ src/
│  ├─ 📄 app.ts                             [Express app setup]
│  │
│  ├─ 📄 server.ts                          [Server bootstrap]
│  │
│  ├─ config/
│  │  ├─ 📄 db.config.ts                   [Prisma client]
│  │  ├─ 📄 env.config.ts                  [Environment variables]
│  │  ├─ 📄 cors.config.ts                 [CORS settings]
│  │  ├─ 📄 logger.ts                      [Logging setup]
│  │  └─ 📄 queue.config.ts                [Job queue setup]
│  │
│  ├─ middlewares/
│  │  ├─ 📄 auth.middleware.ts             [JWT validation]
│  │  ├─ 📄 tenant.middleware.ts           [TenantId extraction]
│  │  ├─ 📄 error.middleware.ts            [Error handling]
│  │  ├─ 📄 validate.middleware.ts         [Input validation]
│  │  └─ 📄 rateLimiter.middleware.ts      [Rate limiting]
│  │
│  ├─ controllers/ [12 controllers]
│  │  ├─ 📄 auth.controller.ts             [Login/Logout logic]
│  │  ├─ 📄 tenant.controller.ts           [Tenant management]
│  │  ├─ 📄 menu.controller.ts             [Menu endpoints]
│  │  ├─ 📄 order.controller.ts            [Order endpoints]
│  │  ├─ 📄 staff.controller.ts            [Staff endpoints]
│  │  ├─ 📄 report.controller.ts           [Report endpoints]
│  │  ├─ 📄 inventory.controller.ts        [Inventory endpoints]
│  │  ├─ 📄 billing.controller.ts          [Billing endpoints]
│  │  ├─ 📄 dashboard.controller.ts        [Dashboard endpoints]
│  │  ├─ 📄 booking.controller.ts          [Booking endpoints]
│  │  ├─ 📄 kot.controller.ts              [KOT endpoints]
│  │  └─ 📄 upload.controller.ts           [Upload endpoints]
│  │
│  ├─ services/ [12 services]
│  │  ├─ 📄 auth.service.ts                [Authentication logic]
│  │  ├─ 📄 tenant.service.ts              [Tenant operations]
│  │  ├─ 📄 menu.service.ts                [Menu operations]
│  │  ├─ 📄 order.service.ts               [Order operations]
│  │  ├─ 📄 staff.service.ts               [Staff operations]
│  │  ├─ 📄 report.service.ts              [Report generation]
│  │  ├─ 📄 inventory.service.ts           [Inventory operations]
│  │  ├─ 📄 billing.service.ts             [Billing logic]
│  │  ├─ 📄 dashboard.service.ts           [Dashboard data]
│  │  ├─ 📄 booking.service.ts             [Booking operations]
│  │  ├─ 📄 kot.service.ts                 [KOT operations]
│  │  └─ 📄 upload.service.ts              [Upload/import logic]
│  │
│  ├─ routes/ [12 route files]
│  │  ├─ 📄 index.ts                       [Main router (mounts all)]
│  │  ├─ 📄 auth.routes.ts                 [Auth endpoints]
│  │  ├─ 📄 tenant.routes.ts               [Tenant endpoints]
│  │  ├─ 📄 menu.routes.ts                 [Menu endpoints]
│  │  ├─ 📄 order.routes.ts                [Order endpoints]
│  │  ├─ 📄 staff.routes.ts                [Staff endpoints]
│  │  ├─ 📄 report.routes.ts               [Report endpoints]
│  │  ├─ 📄 inventory.routes.ts            [Inventory endpoints]
│  │  ├─ 📄 billing.routes.ts              [Billing endpoints]
│  │  ├─ 📄 dashboard.routes.ts            [Dashboard endpoints]
│  │  ├─ 📄 booking.routes.ts              [Booking endpoints]
│  │  ├─ 📄 kot.routes.ts                  [KOT endpoints]
│  │  └─ 📄 upload.routes.ts               [Upload endpoints]
│  │
│  ├─ validators/ [12 validators]
│  │  ├─ 📄 auth.validators.ts             [Login/refresh schemas]
│  │  ├─ 📄 tenant.validators.ts           [Tenant creation schema]
│  │  ├─ 📄 menu.validators.ts             [Menu item schemas]
│  │  ├─ 📄 order.validators.ts            [Order schemas]
│  │  ├─ 📄 staff.validators.ts            [Staff schemas]
│  │  ├─ 📄 report.validators.ts           [Report query schemas]
│  │  ├─ 📄 inventory.validators.ts        [Inventory schemas]
│  │  ├─ 📄 billing.validators.ts          [Billing schemas]
│  │  ├─ 📄 dashboard.validators.ts        [Dashboard schemas]
│  │  ├─ 📄 booking.validators.ts          [Booking schemas]
│  │  ├─ 📄 kot.validators.ts              [KOT schemas]
│  │  └─ 📄 upload.validators.ts           [Upload schemas]
│  │
│  ├─ utils/
│  │  ├─ 📄 response.util.ts               [Response formatting]
│  │  ├─ 📄 jwt.util.ts                    [JWT helper functions]
│  │  └─ 📄 tenant.utils.ts                [Tenant validation helpers]
│  │
│  └─ queues/
│     └─ 📄 queue.config.ts                [Job queue configuration]
│
├─ build/
│  └─ [Compiled JavaScript files from src/]
│
├─ 📄 package.json                          [Dependencies & scripts]
│
├─ 📄 tsconfig.json                         [TypeScript configuration]
│
├─ 📄 Dockerfile                            [Container image]
│
├─ 📄 docker-compose.yml                    [Local development setup]
│
└─ 📄 README.md                             [Project documentation]


DATABASE SCHEMA HIGHLIGHTS:
═════════════════════════════════════════════════════════════════

model Tenant {
  id              String    @id @default(cuid())
  name            String    @unique
  domain          String?
  subscription    Subscription?

  features        Int[]                    ← Feature IDs user has
  branchLimit     Int      @default(1)     ← Max branches
  staffLimit      Int      @default(10)    ← Max staff
  menuLimit       Int      @default(500)   ← Max menu items
  orderLimit      Int      @default(1000)  ← Monthly orders
  storageQuota    Int      @default(10)    ← GB storage

  users           User[]
  branches        Branch[]
  products        Product[]
  orders          Order[]
  invoices        Invoice[]
  bookings        Booking[]
  inventories     Inventory[]
  reports         Report[]
  kots            KOT[]
}

model User {
  id              String    @id @default(cuid())
  tenantId        String                  ← CRITICAL: Links to tenant
  email           String
  password        String
  name            String?
  role            Role      @default(STAFF)

  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId])                     ← Fast lookup by tenant
}

model Product {
  id              String    @id @default(cuid())
  tenantId        String                  ← CRITICAL: Links to tenant
  name            String
  price           Decimal
  category        String?
  isActive        Boolean   @default(true)

  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId])                     ← Fast lookup by tenant
}

model Order {
  id              String    @id @default(cuid())
  tenantId        String                  ← CRITICAL: Links to tenant
  branchId        String
  items           OrderItem[]
  total           Decimal
  status          OrderStatus
  createdAt       DateTime  @default(now())

  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId])                     ← Fast lookup by tenant
  @@index([tenantId, status])             ← Fast filtered queries
}

[... 13 more models, all with tenantId ...]
```

---

## SUMMARY

Your multi-tenant SaaS platform provides:

### For Your Company:

✅ **Subscription Control** - Manage plans, features, limits
✅ **Revenue Model** - Monthly recurring billing
✅ **Multi-Tenancy** - Single infrastructure serving many cafes
✅ **Feature Gating** - Different tiers get different features
✅ **Usage Tracking** - Know exactly what each tenant uses
✅ **Scalability** - Add tenants without adding infrastructure

### For Your Clients:

✅ **Complete Isolation** - Cannot see other cafe's data
✅ **Secure Access** - JWT + TenantId validation
✅ **Feature Access** - Only features they paid for
✅ **Easy Scaling** - Upgrade to more features anytime
✅ **Usage Monitoring** - See their consumption

### Architecture Strengths:

✅ **5-Layer Security** - Multiple protection layers
✅ **Type-Safe** - Prisma ORM prevents SQL injection
✅ **Isolated Queries** - WHERE tenantId on every query
✅ **Production Ready** - 10/10 readiness score
✅ **Scalable** - Handles unlimited tenants

---

**Document Complete** ✅
All sections show the architecture without exposing code.
Ready for business & technical stakeholders to understand the system.
