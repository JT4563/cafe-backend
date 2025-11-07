# 🏢 TENANT OWNER REGISTRATION & MULTI-SHOP ARCHITECTURE

**Date**: November 7, 2025  
**Version**: 1.0  
**Status**: 🟢 PRODUCTION READY

---

## 📋 TABLE OF CONTENTS
1. What is a Tenant Owner?
2. Multi-Shop Architecture
3. Registration Process Flow
4. API Endpoints
5. Real-World Example
6. Authentication Security

---

## 1️⃣ WHAT IS A TENANT OWNER?

### Definition
A **Tenant Owner** is the primary administrator who:
- Creates and owns a cafe/restaurant business unit (called a "Tenant")
- Manages multiple shops/branches under one business entity
- Has full access to all features and staff management
- Pays subscription fees for the entire business

### Key Characteristics
```
Tenant Owner
├─ Email: owner@cafemaster.com
├─ Role: OWNER
├─ Tenant: Cafe Master (single tenant record in database)
├─ Branches: Can manage multiple branches
│  ├─ Main Branch (Downtown)
│  ├─ Branch 2 (Mall)
│  └─ Branch 3 (Airport)
└─ Permissions: Full access to all data under this tenant
```

---

## 2️⃣ MULTI-SHOP ARCHITECTURE EXPLAINED

### The SaaS Model: One Tenant = Multiple Shops

In our system, the architecture works like this:

```
┌─────────────────────────────────────────────────────────┐
│                    CAFE MASTER (TENANT)                  │
│                    owner@cafemaster.com                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Branch 1: Downtown Coffee Shop                          │
│  ├─ Staff: Manager, Waiter, Barista                      │
│  ├─ Menu Items: 45 products                              │
│  ├─ Orders Today: 234                                    │
│  └─ Revenue: $2,345                                      │
│                                                           │
│  Branch 2: Mall Food Court                               │
│  ├─ Staff: Manager, 2 Waiters                            │
│  ├─ Menu Items: 62 products                              │
│  ├─ Orders Today: 456                                    │
│  └─ Revenue: $5,432                                      │
│                                                           │
│  Branch 3: Airport Lounge                                │
│  ├─ Staff: Manager, Cashier                              │
│  ├─ Menu Items: 35 products                              │
│  ├─ Orders Today: 123                                    │
│  └─ Revenue: $1,890                                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
     ↑
     │ Uses SINGLE Account
     └─ One Login: owner@cafemaster.com + password
```

### Why One Owner Can Have Multiple Shops?

**Reason 1: Business Model**
- One person/company owns multiple cafe locations
- They want unified management from one dashboard
- Billing is by tenant, not by branch

**Reason 2: Cost Efficiency**
- Pay ONE subscription for all branches
- Instead of separate subscriptions per location
- Cost: $99/month for all 3 branches (not $99 × 3)

**Reason 3: Management Simplicity**
- View all orders across all locations
- Generate reports for entire business
- Manage staff hierarchy across branches
- Unified inventory management

**Reason 4: Data Organization**
```
Database Structure:
├─ Tenants Table (1 record for Cafe Master)
├─ Branches Table (3 records linked to tenant)
├─ Users Table (1 owner + 10 staff members linked to tenant)
├─ Menu Items (97 items linked to tenant)
└─ Orders (813 orders for the tenant)
```

---

## 3️⃣ REGISTRATION PROCESS FLOW

### Step 1: Owner Registers (Creates New Tenant)

**Endpoint**: `POST /api/v1/auth/register`

**What Happens**:
```
User Registration
    ↓
Validates Input (email, password, name, tenantName)
    ↓
Check if email already exists
    ↓
Check if tenant name already exists
    ↓
Hash password with bcrypt
    ↓
CREATE TRANSACTION:
    ├─ Create Tenant record (Cafe Master)
    ├─ Create Branch record (Main Branch - default)
    ├─ Create User record (Owner role)
    └─ Set isActive = true
    ↓
Generate Tokens (access + refresh)
    ↓
Return tokens + user data
```

**Request Body**:
```json
{
  "email": "owner@cafemaster.com",
  "password": "SecurePass123!",
  "name": "Raj Patel",
  "tenantName": "Cafe Master"
}
```

**Response (201 Created)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmhduvafy0003jjvamwpoezsi",
    "email": "owner@cafemaster.com",
    "name": "Raj Patel",
    "role": "OWNER",
    "tenantId": "cmhduva1m0001jjvamv7sjr1l",
    "isActive": true
  },
  "tenant": {
    "id": "cmhduva1m0001jjvamv7sjr1l",
    "name": "Cafe Master",
    "domain": "cafemaster.saas.com",
    "isActive": true
  }
}
```

### Step 2: Owner Logs In

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "owner@cafemaster.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Step 3: Owner Can Create Additional Branches

**Endpoint**: `POST /api/v1/tenants` (After Authentication)

**Request Header**:
```
Authorization: Bearer {{accessToken}}
```

**Request Body**:
```json
{
  "name": "Pizza Paradise",
  "email": "owner2@pizzaparadise.com",
  "password": "NewOwnerPass123",
  "domain": "pizzaparadise.saas.com",
  "branchName": "Main Branch"
}
```

⚠️ **NOTE**: This creates a NEW TENANT (new business), not a branch of existing tenant.

To add a branch to EXISTING tenant, use branch management endpoints.

---

## 4️⃣ API ENDPOINTS FOR TENANT MANAGEMENT

### Authentication Required? ✅ YES (for most endpoints)

#### ❌ PUBLIC (No Auth Required)
```
POST /api/v1/auth/register     - Create new tenant owner account
POST /api/v1/auth/login        - Owner login
POST /api/v1/auth/refresh      - Refresh access token
```

#### ✅ PROTECTED (Auth Required)
```
GET /api/v1/tenants            - List all tenants (Admin only)
GET /api/v1/tenants/:id        - Get tenant details
POST /api/v1/tenants           - Create new tenant (if owner)
```

---

## 5️⃣ REAL-WORLD EXAMPLE

### Scenario: Raj Patel Owns Cafe Master with 3 Branches

#### Day 1: Registration
```
1. Raj goes to signup page
2. Enters:
   - Email: owner@cafemaster.com
   - Password: SecurePass123
   - Name: Raj Patel
   - Business Name: Cafe Master

3. System creates:
   ✅ Tenant: Cafe Master (ID: tenant_123)
   ✅ User: Raj Patel as OWNER
   ✅ Branch: Main Branch (default)
   ✅ Tokens generated
```

#### Day 2: Raj Logs In
```
1. Raj goes to login page
2. Enters email + password
3. Gets access token
4. Can now:
   - Add menu items
   - Create orders
   - Add staff
   - View reports
```

#### Day 30: Raj Adds 2 More Branches
```
1. Raj logs in
2. Goes to Branch Management
3. Creates:
   ✅ Downtown Branch
   ✅ Airport Branch

4. All 3 branches share:
   - Same tenant ID
   - Same user account
   - Combined billing
   - Unified dashboard
```

#### Day 60: Revenue Report
```
1. Raj generates sales report
2. Report shows TOTAL across all 3 branches:
   - Total Orders: 8,234
   - Total Revenue: $45,678
   - Average per branch: $15,226
   - Best performing: Downtown (45%)
```

---

## 6️⃣ AUTHENTICATION SECURITY

### How Auth Works

#### Token Structure
```
Authorization Header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Decoded Token Contains:
{
  "userId": "cmhduvafy0003jjvamwpoezsi",
  "tenantId": "cmhduva1m0001jjvamv7sjr1l",
  "email": "owner@cafemaster.com",
  "role": "OWNER",
  "iat": 1762491490,
  "exp": 1762577890
}
```

#### Access Token (24 hours)
- Used for API requests
- Expires after 24 hours
- Contains user identity

#### Refresh Token (7 days)
- Used to get new access token
- Expires after 7 days
- More secure, longer lived

### Endpoint Security Levels

```
LEVEL 1: Public
├─ /auth/register     - Anyone
├─ /auth/login        - Anyone
└─ /auth/refresh      - Anyone with refresh token

LEVEL 2: Authenticated
├─ /tenants           - Need valid accessToken
├─ /tenants/:id       - Need valid accessToken
├─ /menu/*            - Need valid accessToken
├─ /orders/*          - Need valid accessToken
└─ /staff/*           - Need valid accessToken

LEVEL 3: Owner Only (Future)
├─ /tenants/create    - Only OWNER role
├─ /staff/bulk-add    - Only OWNER/MANAGER
└─ /billing/*         - Only OWNER
```

---

## 7️⃣ FAQ

### Q1: Can multiple people be owners of same tenant?
**A**: Currently NO, but can be added. One owner registration = one owner account. Staff can be added with other roles.

### Q2: Why register creates a tenant, not a branch?
**A**: Registration is for NEW business signup. Each business is separate tenant. To add branches, use branch API after login.

### Q3: What if owner has 2 businesses?
**A**: Create 2 separate accounts:
- Account 1: owner1@cafe1.com (Tenant: Cafe Master)
- Account 2: owner2@cafe2.com (Tenant: Pizza Paradise)

Switch between logins as needed.

### Q4: How is data isolated between tenants?
**A**: Each query includes tenantId check:
```sql
SELECT * FROM orders 
WHERE tenantId = 'tenant_123'  -- Only this tenant's data
```

### Q5: Can I have 10 branches under one account?
**A**: YES! Unlimited branches per tenant.

### Q6: Are all requests authenticated?
**A**: Most are. Only auth endpoints (register, login, refresh) are public.

---

## 📊 DATA MODEL VISUALIZATION

```
┌────────────────┐
│    TENANTS     │ (Business Entity)
│────────────────│
│ id             │
│ name           │ ← "Cafe Master"
│ domain         │
│ isActive       │
│ createdAt      │
└────────────────┘
        │ 1:N
        │
        ├─────────────────────────────────┐
        │                                 │
┌────────────────┐            ┌──────────────────┐
│   BRANCHES     │            │      USERS       │
│────────────────│            │──────────────────│
│ id             │            │ id               │
│ tenantId (FK)  │            │ tenantId (FK)    │
│ name           │            │ email            │
│ address        │            │ password         │
│ phone          │            │ name             │
│ email          │            │ role: OWNER,... │
└────────────────┘            │ isActive         │
        │                      └──────────────────┘
        │ 1:N                          │
        │                             │
        │                    ┌────────────────┐
        │                    │    PRODUCTS    │
        │                    │────────────────│
        │                    │ id             │
        │                    │ tenantId (FK)  │
        │                    │ name           │
        │                    │ price          │
        │                    │ category       │
        │                    └────────────────┘
        │
        ├─────────────────┐
        │ 1:N             │
┌────────────────┐  ┌──────────────┐
│    ORDERS      │  │    TABLES    │
│────────────────│  │──────────────│
│ id             │  │ id           │
│ tenantId (FK)  │  │ tenantId(FK) │
│ branchId (FK)  │  │ branchId(FK) │
│ items[]        │  │ number       │
│ total          │  │ capacity     │
└────────────────┘  └──────────────┘
```

---

## 🔐 AUTHENTICATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                   USER REGISTRATION                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. User fills signup form                              │
│     └─ Email, Password, Name, Business Name             │
│                                                           │
│  2. POST /api/v1/auth/register                          │
│     └─ Send form data                                   │
│                                                           │
│  3. Server validates                                    │
│     ├─ Email format ✓                                   │
│     ├─ Email not exists ✓                               │
│     ├─ Tenant name not exists ✓                         │
│     └─ Password strength ✓                              │
│                                                           │
│  4. Hash password + Create records                       │
│     ├─ Tenant created                                   │
│     ├─ Branch created (default)                         │
│     ├─ User created (OWNER role)                        │
│     └─ Password hashed with bcrypt                      │
│                                                           │
│  5. Generate tokens                                     │
│     ├─ Access Token (24h validity)                      │
│     └─ Refresh Token (7d validity)                      │
│                                                           │
│  6. Return response 201 Created                         │
│     ├─ Tokens                                           │
│     ├─ User data                                        │
│     └─ Tenant data                                      │
│                                                           │
│  7. Client stores tokens                                │
│     ├─ localStorage.accessToken                         │
│     └─ localStorage.refreshToken                        │
│                                                           │
│  8. Client ready to make API calls                      │
│     └─ All requests include: Authorization: Bearer...   │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    USER LOGIN                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. User fills login form                               │
│     └─ Email, Password                                  │
│                                                           │
│  2. POST /api/v1/auth/login                             │
│     └─ Send credentials                                 │
│                                                           │
│  3. Server validates                                    │
│     ├─ Email exists ✓                                   │
│     ├─ Password matches hash ✓                          │
│     └─ User isActive = true ✓                           │
│                                                           │
│  4. Generate tokens                                     │
│     ├─ Access Token (24h)                               │
│     └─ Refresh Token (7d)                               │
│                                                           │
│  5. Return response 200 OK                              │
│     ├─ Tokens                                           │
│     └─ User data                                        │
│                                                           │
│  6. Client can make requests with token                 │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              ACCESS TOKEN EXPIRED? REFRESH               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. User makes API request                              │
│     └─ Authorization: Bearer {expired_token}            │
│                                                           │
│  2. Server returns 401 Unauthorized                     │
│     └─ Token expired or invalid                         │
│                                                           │
│  3. Client calls refresh endpoint                       │
│     └─ POST /api/v1/auth/refresh                        │
│     └─ Body: { refreshToken: "..." }                    │
│                                                           │
│  4. Server validates refresh token                      │
│     ├─ Refresh token valid ✓                            │
│     ├─ Refresh token not expired ✓                      │
│     └─ User still exists ✓                              │
│                                                           │
│  5. Generate NEW access token                           │
│     └─ 24h validity from now                            │
│                                                           │
│  6. Return response 200 OK                              │
│     └─ New accessToken                                  │
│                                                           │
│  7. Client stores new token                             │
│     └─ localStorage.accessToken = new_token             │
│                                                           │
│  8. Retry original request with new token               │
│     └─ Request succeeds ✅                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ SECURITY CHECKLIST

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens use HS256 algorithm
- ✅ Access tokens expire after 24 hours
- ✅ Refresh tokens expire after 7 days
- ✅ All endpoints (except auth) require valid token
- ✅ TenantId validated in every request
- ✅ User role checked for sensitive operations
- ✅ Email uniqueness enforced
- ✅ Tenant name uniqueness enforced
- ✅ Password never returned in responses

---

## 🚀 NEXT STEPS

1. **Setup in Postman**:
   - Set `baseUrl`: http://localhost:4000/api/v1
   - First request: POST /auth/register
   - Automatic token extraction in Tests tab
   - Use {{accessToken}} in all subsequent requests

2. **Test Auth Flow**:
   - Register new owner
   - Login with credentials
   - Refresh token when expired
   - Create tenant/branch
   - Add staff members

3. **Monitor Security**:
   - Check token expiry times
   - Verify auth header format
   - Test with invalid tokens
   - Verify error messages

---

**Document Status**: ✅ COMPLETE  
**Last Updated**: November 7, 2025  
**Maintained By**: Backend Team

