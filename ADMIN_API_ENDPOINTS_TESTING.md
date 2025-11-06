# Admin Panel API Endpoints - Complete Testing Guide

**Date**: November 6, 2025
**Status**: ✅ Production Ready
**Backend Base URL**: `http://localhost:3000/api/v1`

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Subscription Management (Core SaaS)](#subscription-management-core-saas)
3. [Tenant Management](#tenant-management)
4. [Billing & Invoicing](#billing--invoicing)
5. [Reports & Analytics](#reports--analytics)
6. [Admin Services Implementation](#admin-services-implementation)

---

## 🔐 Authentication Endpoints

### 1. Admin Login

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:

```json
{
  "email": "admin@saas.com",
  "password": "admin123"
}
```

**Response (200 - Success)**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "admin@saas.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Response (401 - Unauthorized)**:

```json
{
  "error": "Invalid credentials"
}
```

---

## 💳 Subscription Management (Core SaaS)

### 1. Create Subscription for New Tenant

**Endpoint**: `POST /api/v1/subscriptions/admin`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**:

```json
{
  "tenantId": "tenant-456",
  "plan": "STARTER",
  "monthlyAmount": 999.0,
  "trialDays": 14,
  "currency": "USD",
  "billingCycle": "MONTHLY"
}
```

**Response (201 - Created)**:

```json
{
  "id": "sub-789",
  "tenantId": "tenant-456",
  "provider": "stripe",
  "providerCustomerId": "cus_abc123",
  "providerSubscriptionId": "sub_stripe_123",
  "plan": "STARTER",
  "currency": "USD",
  "status": "TRIALING",
  "amount": "999.00",
  "billingCycle": "MONTHLY",
  "trialEndsAt": "2025-11-20T10:30:00Z",
  "currentPeriodStart": "2025-11-06T10:30:00Z",
  "currentPeriodEnd": "2025-12-06T10:30:00Z",
  "cancelAtPeriodEnd": false,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z",
  "tenant": {
    "id": "tenant-456",
    "name": "Pizza Palace",
    "domain": "pizza-palace.com"
  }
}
```

---

### 2. Get Subscription for Single Tenant

**Endpoint**: `GET /api/v1/subscriptions/:tenantId`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**URL Parameters**:

```
tenantId: tenant-456
```

**Response (200 - Success)**:

```json
{
  "id": "sub-789",
  "tenantId": "tenant-456",
  "provider": "stripe",
  "providerCustomerId": "cus_abc123",
  "providerSubscriptionId": "sub_stripe_123",
  "plan": "STARTER",
  "currency": "USD",
  "status": "ACTIVE",
  "amount": "999.00",
  "billingCycle": "MONTHLY",
  "trialEndsAt": null,
  "currentPeriodStart": "2025-12-06T10:30:00Z",
  "currentPeriodEnd": "2026-01-06T10:30:00Z",
  "cancelAtPeriodEnd": false,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-12-06T10:30:00Z",
  "tenant": {
    "id": "tenant-456",
    "name": "Pizza Palace",
    "domain": "pizza-palace.com"
  }
}
```

**Response (404 - Not Found)**:

```json
{
  "error": "Subscription not found for tenant"
}
```

---

### 3. List All Subscriptions (Admin Dashboard)

**Endpoint**: `GET /api/v1/subscriptions/admin`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters** (All Optional):

```
?status=ACTIVE&plan=STARTER&search=pizza&page=1&limit=10
```

**Response (200 - Success)**:

```json
{
  "subscriptions": [
    {
      "id": "sub-789",
      "tenantId": "tenant-456",
      "provider": "stripe",
      "providerCustomerId": "cus_abc123",
      "plan": "STARTER",
      "currency": "USD",
      "status": "ACTIVE",
      "amount": "999.00",
      "billingCycle": "MONTHLY",
      "trialEndsAt": null,
      "currentPeriodStart": "2025-12-06T10:30:00Z",
      "currentPeriodEnd": "2026-01-06T10:30:00Z",
      "cancelAtPeriodEnd": false,
      "createdAt": "2025-11-06T10:30:00Z",
      "tenant": {
        "id": "tenant-456",
        "name": "Pizza Palace",
        "domain": "pizza-palace.com"
      }
    },
    {
      "id": "sub-790",
      "tenantId": "tenant-457",
      "provider": "razorpay",
      "providerCustomerId": "cust_razorpay_456",
      "plan": "PROFESSIONAL",
      "currency": "USD",
      "status": "PAST_DUE",
      "amount": "2999.00",
      "billingCycle": "MONTHLY",
      "trialEndsAt": null,
      "currentPeriodStart": "2025-11-06T10:30:00Z",
      "currentPeriodEnd": "2025-12-06T10:30:00Z",
      "cancelAtPeriodEnd": false,
      "createdAt": "2025-10-06T10:30:00Z",
      "tenant": {
        "id": "tenant-457",
        "name": "Burger House",
        "domain": "burger-house.com"
      }
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 4. Update Subscription (Change Plan/Status)

**Endpoint**: `PATCH /api/v1/subscriptions/admin/:tenantId`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**URL Parameters**:

```
tenantId: tenant-456
```

**Request Body** (Any combination):

```json
{
  "plan": "PROFESSIONAL",
  "amount": 2999.0,
  "status": "ACTIVE",
  "billingCycle": "YEARLY"
}
```

**Response (200 - Updated)**:

```json
{
  "id": "sub-789",
  "tenantId": "tenant-456",
  "provider": "stripe",
  "providerCustomerId": "cus_abc123",
  "plan": "PROFESSIONAL",
  "currency": "USD",
  "status": "ACTIVE",
  "amount": "2999.00",
  "billingCycle": "YEARLY",
  "trialEndsAt": null,
  "currentPeriodStart": "2025-12-06T10:30:00Z",
  "currentPeriodEnd": "2026-12-06T10:30:00Z",
  "cancelAtPeriodEnd": false,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T11:00:00Z",
  "tenant": {
    "id": "tenant-456",
    "name": "Pizza Palace",
    "domain": "pizza-palace.com"
  }
}
```

---

### 5. Cancel Subscription

**Endpoint**: `DELETE /api/v1/subscriptions/admin/:tenantId`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**URL Parameters**:

```
tenantId: tenant-456
```

**Request Body**:

```json
{
  "immediate": false
}
```

**Response (200 - Cancelled)**:

```json
{
  "id": "sub-789",
  "tenantId": "tenant-456",
  "status": "CANCELED",
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2026-01-06T10:30:00Z",
  "message": "Subscription will be cancelled at the end of current billing period"
}
```

**If `immediate: true`**:

```json
{
  "id": "sub-789",
  "tenantId": "tenant-456",
  "status": "CANCELED",
  "cancelAtPeriodEnd": false,
  "message": "Subscription cancelled immediately"
}
```

---

### 6. Get SaaS Dashboard Metrics

**Endpoint**: `GET /api/v1/subscriptions/admin/dashboard/metrics`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response (200 - Success)**:

```json
{
  "activeSubscriptions": 45,
  "trialSubscriptions": 12,
  "pastDueSubscriptions": 3,
  "cancelledSubscriptions": 5,
  "monthlyRevenue": "134955.00",
  "totalMRR": "134955.00",
  "churnRate": 3.5,
  "planBreakdown": {
    "STARTER": 30,
    "PROFESSIONAL": 20,
    "ENTERPRISE": 5,
    "TRIAL": 12
  },
  "topTenants": [
    {
      "tenantId": "tenant-123",
      "name": "Premium Restaurant",
      "plan": "ENTERPRISE",
      "amount": "9999.00",
      "status": "ACTIVE"
    }
  ],
  "revenueByPlan": {
    "STARTER": "29970.00",
    "PROFESSIONAL": "59980.00",
    "ENTERPRISE": "49995.00"
  }
}
```

---

### 7. Get Subscriptions Expiring Soon (Billing Reminders)

**Endpoint**: `GET /api/v1/subscriptions/admin/expiring/soon`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?days=7
```

**Response (200 - Success)**:

```json
{
  "expiringSubscriptions": [
    {
      "id": "sub-123",
      "tenantId": "tenant-123",
      "tenantName": "Pizza Palace",
      "plan": "STARTER",
      "amount": "999.00",
      "currentPeriodEnd": "2025-11-13T10:30:00Z",
      "daysUntilExpiry": 7,
      "status": "ACTIVE"
    },
    {
      "id": "sub-124",
      "tenantId": "tenant-124",
      "tenantName": "Burger House",
      "plan": "PROFESSIONAL",
      "amount": "2999.00",
      "currentPeriodEnd": "2025-11-10T10:30:00Z",
      "daysUntilExpiry": 4,
      "status": "ACTIVE"
    }
  ],
  "total": 2
}
```

---

### 8. Get Expired Trials Ready to Charge

**Endpoint**: `GET /api/v1/subscriptions/admin/trials/expired`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response (200 - Success)**:

```json
{
  "expiredTrials": [
    {
      "id": "sub-456",
      "tenantId": "tenant-456",
      "tenantName": "Cafe Express",
      "plan": "STARTER",
      "amount": "999.00",
      "trialEndsAt": "2025-11-06T10:30:00Z",
      "status": "TRIALING",
      "providerCustomerId": "cus_trial_123"
    }
  ],
  "total": 1,
  "message": "Ready to charge for trial conversion"
}
```

---

### 9. Get Trials Expiring Soon (Send Warnings)

**Endpoint**: `GET /api/v1/subscriptions/admin/trials/expiring`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?days=3
```

**Response (200 - Success)**:

```json
{
  "expiringTrials": [
    {
      "id": "sub-789",
      "tenantId": "tenant-789",
      "tenantName": "New Restaurant",
      "plan": "PROFESSIONAL",
      "amount": "2999.00",
      "trialEndsAt": "2025-11-08T10:30:00Z",
      "daysUntilExpiry": 2,
      "status": "TRIALING"
    }
  ],
  "total": 1
}
```

---

## 👥 Tenant Management

### 1. Get All Tenants

**Endpoint**: `GET /api/v1/tenants`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters** (Optional):

```
?search=pizza&page=1&limit=10
```

**Response (200 - Success)**:

```json
{
  "tenants": [
    {
      "id": "tenant-123",
      "name": "Pizza Palace",
      "domain": "pizza-palace.com",
      "currency": "USD",
      "timezone": "America/New_York",
      "isActive": true,
      "createdAt": "2025-10-01T10:30:00Z",
      "updatedAt": "2025-11-06T10:30:00Z",
      "subscription": {
        "id": "sub-123",
        "plan": "STARTER",
        "status": "ACTIVE",
        "amount": "999.00"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Get Single Tenant

**Endpoint**: `GET /api/v1/tenants/:tenantId`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**URL Parameters**:

```
tenantId: tenant-123
```

**Response (200 - Success)**:

```json
{
  "id": "tenant-123",
  "name": "Pizza Palace",
  "domain": "pizza-palace.com",
  "currency": "USD",
  "timezone": "America/New_York",
  "isActive": true,
  "createdAt": "2025-10-01T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z",
  "branches": 3,
  "users": 12,
  "orders": 450,
  "subscription": {
    "id": "sub-123",
    "plan": "STARTER",
    "status": "ACTIVE",
    "amount": "999.00",
    "billingCycle": "MONTHLY"
  }
}
```

---

### 3. Create New Tenant

**Endpoint**: `POST /api/v1/tenants`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "New Restaurant",
  "domain": "new-restaurant.com",
  "currency": "USD",
  "timezone": "America/Los_Angeles"
}
```

**Response (201 - Created)**:

```json
{
  "id": "tenant-999",
  "name": "New Restaurant",
  "domain": "new-restaurant.com",
  "currency": "USD",
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z"
}
```

---

### 4. Update Tenant

**Endpoint**: `PATCH /api/v1/tenants/:tenantId`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**URL Parameters**:

```
tenantId: tenant-123
```

**Request Body**:

```json
{
  "name": "Pizza Palace Updated",
  "currency": "EUR",
  "timezone": "Europe/London"
}
```

**Response (200 - Updated)**:

```json
{
  "id": "tenant-123",
  "name": "Pizza Palace Updated",
  "domain": "pizza-palace.com",
  "currency": "EUR",
  "timezone": "Europe/London",
  "isActive": true,
  "createdAt": "2025-10-01T10:30:00Z",
  "updatedAt": "2025-11-06T11:00:00Z"
}
```

---

## 💰 Billing & Invoicing

### 1. Get Billing Summary

**Endpoint**: `GET /api/v1/billing/summary`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?tenantId=tenant-123
```

**Response (200 - Success)**:

```json
{
  "tenantId": "tenant-123",
  "totalRevenue": "45231.50",
  "totalInvoiced": "45231.50",
  "totalPaid": "42000.00",
  "totalPending": "3231.50",
  "pendingInvoices": 5,
  "paidInvoices": 42,
  "overallRevenueTrend": 12.5
}
```

---

### 2. Get All Invoices

**Endpoint**: `GET /api/v1/billing/invoices`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters** (Optional):

```
?tenantId=tenant-123&status=PENDING&page=1&limit=20
```

**Response (200 - Success)**:

```json
{
  "invoices": [
    {
      "id": "inv-123",
      "orderId": "order-456",
      "tenantId": "tenant-123",
      "invoiceNumber": "INV-2025-001",
      "amount": "5000.00",
      "tax": "500.00",
      "discount": "0.00",
      "status": "PENDING",
      "dueDate": "2025-11-13T10:30:00Z",
      "paidAt": null,
      "createdAt": "2025-11-06T10:30:00Z",
      "updatedAt": "2025-11-06T10:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 3. Get Single Invoice

**Endpoint**: `GET /api/v1/billing/invoices/:invoiceId`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**URL Parameters**:

```
invoiceId: inv-123
```

**Response (200 - Success)**:

```json
{
  "id": "inv-123",
  "orderId": "order-456",
  "tenantId": "tenant-123",
  "invoiceNumber": "INV-2025-001",
  "amount": "5000.00",
  "tax": "500.00",
  "discount": "0.00",
  "status": "PENDING",
  "dueDate": "2025-11-13T10:30:00Z",
  "paidAt": null,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z",
  "totalPaid": "0.00",
  "amountDue": "5000.00",
  "percentagePaid": 0,
  "payments": []
}
```

---

### 4. Process Payment for Invoice

**Endpoint**: `POST /api/v1/billing/invoices/:invoiceId/pay`

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**URL Parameters**:

```
invoiceId: inv-123
```

**Request Body**:

```json
{
  "tenantId": "tenant-123",
  "amount": 5000.0,
  "method": "CARD",
  "reference": "txn_stripe_abc123"
}
```

**Response (200 - Payment Processed)**:

```json
{
  "payment": {
    "id": "pay-789",
    "invoiceId": "inv-123",
    "tenantId": "tenant-123",
    "method": "CARD",
    "amount": "5000.00",
    "status": "COMPLETED",
    "reference": "txn_stripe_abc123",
    "createdAt": "2025-11-06T10:30:00Z",
    "updatedAt": "2025-11-06T10:30:00Z"
  },
  "invoice": {
    "id": "inv-123",
    "status": "PAID",
    "totalPaid": "5000.00",
    "amountDue": "0.00",
    "paidAt": "2025-11-06T10:30:00Z"
  }
}
```

---

## 📊 Reports & Analytics

### 1. Get Sales Report

**Endpoint**: `GET /api/v1/report/sales`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?tenantId=tenant-123&startDate=2025-11-01&endDate=2025-11-06
```

**Response (200 - Success)**:

```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-06"
  },
  "summary": {
    "totalOrders": 125,
    "paidOrders": 120,
    "totalRevenue": "45231.50",
    "totalTax": "4523.15",
    "totalDiscount": "0.00",
    "netRevenue": "45231.50",
    "averageOrderValue": 362.65,
    "totalItems": 450
  },
  "byBranch": {
    "branch-1": {
      "orders": 50,
      "revenue": "18092.60"
    },
    "branch-2": {
      "orders": 75,
      "revenue": "27138.90"
    }
  },
  "orders": [
    {
      "id": "order-456",
      "branch": "Main Branch",
      "total": "5000.00",
      "tax": "500.00",
      "discount": "0.00",
      "items": 8,
      "createdAt": "2025-11-06T10:30:00Z"
    }
  ]
}
```

---

### 2. Get Revenue Analytics

**Endpoint**: `GET /api/v1/report/revenue-analytics`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?tenantId=tenant-123&startDate=2025-11-01&endDate=2025-11-06
```

**Response (200 - Success)**:

```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-06",
  "totalRevenue": "45231.50",
  "totalTax": "4523.15",
  "totalDiscount": "0.00",
  "orderCount": 125,
  "averageOrderValue": 362.65,
  "netRevenue": "45231.50"
}
```

---

### 3. Get Staff Performance Report

**Endpoint**: `GET /api/v1/report/staff-performance`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?tenantId=tenant-123&startDate=2025-11-01&endDate=2025-11-06
```

**Response (200 - Success)**:

```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-06"
  },
  "totalStaff": 12,
  "activeStaff": 10,
  "topPerformers": [
    {
      "staffId": "user-123",
      "staffName": "John Doe",
      "role": "WAITER",
      "ordersCount": 45,
      "totalRevenue": "16245.50",
      "averageOrderValue": 361.01,
      "lastLogin": "2025-11-06T10:30:00Z"
    }
  ],
  "performance": [
    {
      "staffId": "user-123",
      "staffName": "John Doe",
      "role": "WAITER",
      "ordersCount": 45,
      "totalRevenue": "16245.50",
      "averageOrderValue": 361.01,
      "lastLogin": "2025-11-06T10:30:00Z"
    }
  ]
}
```

---

### 4. Get Dashboard Summary

**Endpoint**: `GET /api/v1/report/dashboard-summary`

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

```
?tenantId=tenant-123
```

**Response (200 - Success)**:

```json
{
  "sales": {
    "todayRevenue": "8945.50",
    "todayOrders": 23
  },
  "orders": {
    "pendingCount": 5
  },
  "inventory": {
    "lowStockCount": 8
  },
  "billing": {
    "pendingInvoices": 3
  }
}
```

---

## 🔧 Admin Services Implementation

Now let's update the admin services file to use the CORRECT backend endpoints:

### Updated `admin/src/api/services.ts`
