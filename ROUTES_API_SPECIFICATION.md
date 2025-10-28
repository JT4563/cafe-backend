# Complete API Specification - Routes Checking

**Generated**: October 28, 2025
**Status**: ✅ All Routes Validated & Fixed
**Base URL**: `/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Billing](#billing)
3. [Booking](#booking)
4. [Dashboard](#dashboard)
5. [Inventory](#inventory)

---

## Authentication

### 1. POST `/auth/login`

**Description**: User login with email and password
**Auth Required**: ❌ No
**Validation**: ✅ Yes (Email format, Password min 6 chars)

#### Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response (200 OK)

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "tenantId": "550e8400-e29b-41d4-a716-446655440001",
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "My Cafe",
      "isActive": true
    }
  }
}
```

#### Error Responses

- **400 Bad Request** - Invalid email or missing fields

```json
{
  "error": "Validation failed",
  "details": ["Email must be a valid email address"]
}
```

- **401 Unauthorized** - Invalid credentials or account disabled

```json
{
  "error": "Invalid email or password"
}
```

---

### 2. POST `/auth/refresh`

**Description**: Refresh access token using refresh token
**Auth Required**: ❌ No
**Validation**: ✅ Yes (RefreshToken required)

#### Request

```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### Response (200 OK)

```json
{
  "accessToken": "eyJhbGc..."
}
```

#### Error Responses

- **400 Bad Request** - Missing refresh token
- **401 Unauthorized** - Invalid refresh token

---

## Billing

### 1. GET `/billing/:tenantId/summary`

**Description**: Get billing summary for a tenant
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (200 OK)

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRevenue": 15000.5,
  "totalInvoiced": 12000.0,
  "totalPaid": 10000.0,
  "totalPending": 2000.0,
  "pendingInvoices": 3,
  "paidInvoices": 15,
  "overallRevenueTrend": 12.5
}
```

---

### 2. GET `/billing/:tenantId`

**Description**: Get all invoices with pagination
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID, Page/Limit validation)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "page": 1,
  "limit": 10
}
```

#### Response (200 OK)

```json
{
  "invoices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "invoiceNumber": "INV-20251028-00001",
      "amount": 1000.0,
      "tax": 100.0,
      "discount": 50.0,
      "status": "PAID",
      "createdAt": "2025-10-28T10:30:00Z",
      "order": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2025-10-28T10:00:00Z"
      },
      "payments": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "amount": 1000.0,
          "status": "COMPLETED",
          "createdAt": "2025-10-28T11:00:00Z"
        }
      ]
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

### 3. POST `/billing/:tenantId`

**Description**: Create a new invoice
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (All required fields, Amount > 0)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Request Body

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440003",
  "amount": 1000.0,
  "tax": 100.0,
  "discount": 50.0,
  "dueDate": "2025-11-28"
}
```

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "orderId": "550e8400-e29b-41d4-a716-446655440003",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceNumber": "INV-20251028-00001",
  "amount": 1050.0,
  "tax": 100.0,
  "discount": 50.0,
  "status": "DRAFT",
  "dueDate": "2025-11-28",
  "createdAt": "2025-10-28T12:00:00Z"
}
```

#### Error Responses

- **400 Bad Request** - Missing required fields or invalid data
- **400 Bad Request** - Invoice already exists for order
- **400 Bad Request** - Order not found

---

### 4. GET `/billing/:tenantId/invoices/:invoiceId`

**Description**: Get invoice details with full information
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId & InvoiceId UUID)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceId": "550e8400-e29b-41d4-a716-446655440005"
}
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "invoiceNumber": "INV-20251028-00001",
  "amount": 1050.0,
  "status": "PAID",
  "totalPaid": 1050.0,
  "amountDue": 0,
  "percentagePaid": 100,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "items": []
  },
  "payments": []
}
```

---

### 5. POST `/billing/:tenantId/invoices/:invoiceId/payments`

**Description**: Process payment for an invoice
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (Amount > 0, Valid payment method)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceId": "550e8400-e29b-41d4-a716-446655440005"
}
```

#### Request Body

```json
{
  "amount": 500.0,
  "method": "CARD",
  "reference": "TXN-12345"
}
```

**Valid Payment Methods**:

- CASH
- CARD
- UPI
- BANK_TRANSFER
- WALLET
- CHEQUE

#### Response (201 Created)

```json
{
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "invoiceId": "550e8400-e29b-41d4-a716-446655440005",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "CARD",
    "amount": 500.00,
    "status": "COMPLETED",
    "reference": "TXN-12345",
    "createdAt": "2025-10-28T12:30:00Z"
  },
  "invoice": { ... }
}
```

#### Error Responses

- **400 Bad Request** - Invalid payment method
- **400 Bad Request** - Payment amount exceeds remaining due
- **400 Bad Request** - Invalid amount (≤ 0)

---

## Booking

### 1. POST `/booking`

**Description**: Create a new booking/reservation
**Auth Required**: ✅ Yes (tenantId from JWT)
**Validation**: ✅ Yes (All required fields, date validation)

#### Request Body

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440010",
  "tableId": "550e8400-e29b-41d4-a716-446655440011",
  "customerName": "John Smith",
  "customerPhone": "1234567890",
  "partySize": 4,
  "startTime": "2025-10-29T18:00:00Z",
  "endTime": "2025-10-29T20:00:00Z",
  "deposit": 100.0,
  "notes": "VIP customer"
}
```

**Required Fields**: branchId, customerName, partySize, startTime, endTime
**Optional Fields**: tableId, customerPhone, deposit, notes

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440012",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "branchId": "550e8400-e29b-41d4-a716-446655440010",
  "tableId": "550e8400-e29b-41d4-a716-446655440011",
  "customerName": "John Smith",
  "customerPhone": "1234567890",
  "partySize": 4,
  "startTime": "2025-10-29T18:00:00Z",
  "endTime": "2025-10-29T20:00:00Z",
  "deposit": 100.0,
  "notes": "VIP customer",
  "status": "PENDING",
  "createdAt": "2025-10-28T13:00:00Z"
}
```

#### Error Responses

- **400 Bad Request** - Missing required fields
- **400 Bad Request** - PartySize ≤ 0
- **400 Bad Request** - End time before start time
- **400 Bad Request** - Booking in the past
- **400 Bad Request** - Table capacity exceeded
- **400 Bad Request** - Table not available for this time slot

---

### 2. GET `/booking/branch/:branchId`

**Description**: Get all bookings for a branch
**Auth Required**: ✅ Yes (tenantId from JWT)
**Validation**: ⚠️ Partial (Branch ID, pagination)

#### Path Parameters

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440010"
}
```

#### Query Parameters

```json
{
  "page": 1,
  "limit": 20
}
```

#### Response (200 OK)

```json
{
  "bookings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "customerName": "John Smith",
      "partySize": 4,
      "startTime": "2025-10-29T18:00:00Z",
      "status": "PENDING"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## Dashboard

### 1. GET `/dashboard/overview/:tenantId`

**Description**: Get dashboard overview (today and overall stats)
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (200 OK)

```json
{
  "totalOrders": 150,
  "totalRevenue": 45000.0,
  "todayOrders": 12,
  "todayRevenue": 3500.0,
  "totalCustomers": 98,
  "totalBookings": 45
}
```

---

### 2. GET `/dashboard/analytics/:tenantId`

**Description**: Get sales analytics for date range
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID, Date format)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-28"
}
```

#### Response (200 OK)

```json
{
  "totalOrders": 120,
  "totalRevenue": 42000.0,
  "totalTax": 4200.0,
  "totalDiscount": 2100.0,
  "startDate": "2025-10-01",
  "endDate": "2025-10-28",
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "total": 350.0,
      "tax": 35.0,
      "discount": 0,
      "status": "COMPLETED"
    }
  ]
}
```

---

### 3. GET `/dashboard/charts/:tenantId`

**Description**: Get revenue charts (daily, weekly, monthly)
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (200 OK)

```json
{
  "daily": [
    {
      "date": "2025-10-28",
      "revenue": 3500.0
    }
  ],
  "weekly": [
    {
      "week": "2025-10-26",
      "revenue": 24000.0
    }
  ],
  "monthly": [
    {
      "month": "2025-10",
      "revenue": 42000.0
    }
  ]
}
```

---

### 4. GET `/dashboard/top-products/:tenantId`

**Description**: Get top selling products
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID, Limit validation)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "limit": 10
}
```

#### Response (200 OK)

```json
[
  {
    "productId": "550e8400-e29b-41d4-a716-446655440020",
    "productName": "Espresso",
    "quantity": 150,
    "revenue": 4500.0
  },
  {
    "productId": "550e8400-e29b-41d4-a716-446655440021",
    "productName": "Cappuccino",
    "quantity": 120,
    "revenue": 4200.0
  }
]
```

---

## Inventory

### 1. GET `/inventory/:tenantId`

**Description**: Get all inventory items with pagination
**Auth Required**: ✅ Yes (tenantId from JWT)
**Validation**: ✅ Yes (TenantId UUID, Pagination)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440010",
  "page": 1,
  "limit": 50
}
```

#### Response (200 OK)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "branchId": "550e8400-e29b-41d4-a716-446655440010",
      "productId": "550e8400-e29b-41d4-a716-446655440020",
      "qty": 100,
      "minQty": 20,
      "product": { ... },
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 50
}
```

---

### 2. POST `/inventory/:tenantId`

**Description**: Create a new inventory item
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (Required fields, Quantity validation)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440010"
}
```

#### Request Body

```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440020",
  "qty": 100,
  "minQty": 20
}
```

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "branchId": "550e8400-e29b-41d4-a716-446655440010",
  "productId": "550e8400-e29b-41d4-a716-446655440020",
  "qty": 100,
  "minQty": 20,
  "product": { ... },
  "createdAt": "2025-10-28T14:00:00Z"
}
```

#### Error Responses

- **400 Bad Request** - Negative quantity
- **400 Bad Request** - Product not found
- **400 Bad Request** - Stock item already exists

---

### 3. PUT `/inventory/:itemId`

**Description**: Update inventory item
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (ItemId UUID, At least one field required)

#### Path Parameters

```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440030"
}
```

#### Request Body

```json
{
  "qty": 150,
  "minQty": 25
}
```

**Note**: At least one field must be provided for update

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "qty": 150,
  "minQty": 25,
  "updatedAt": "2025-10-28T14:30:00Z"
}
```

---

### 4. DELETE `/inventory/:itemId`

**Description**: Delete inventory item (only if qty = 0)
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (ItemId UUID)

#### Path Parameters

```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440030"
}
```

#### Response (200 OK)

```json
{
  "message": "Inventory item deleted"
}
```

#### Error Responses

- **400 Bad Request** - Cannot delete item with remaining quantity

---

### 5. GET `/inventory/:tenantId/low-stock`

**Description**: Get items with quantity below minimum
**Auth Required**: ✅ Yes
**Validation**: ✅ Yes (TenantId UUID)

#### Path Parameters

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Query Parameters

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440010"
}
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440031",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "productId": "550e8400-e29b-41d4-a716-446655440022",
    "qty": 15,
    "minQty": 20,
    "product": { ... }
  }
]
```

---

## Common Response Codes

| Code | Meaning      | Example                          |
| ---- | ------------ | -------------------------------- |
| 200  | OK           | Successful GET request           |
| 201  | Created      | Successful POST request          |
| 400  | Bad Request  | Validation error, missing fields |
| 401  | Unauthorized | Missing/invalid auth token       |
| 403  | Forbidden    | Insufficient permissions         |
| 404  | Not Found    | Resource not found               |
| 500  | Server Error | Internal server error            |

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error description",
  "details": ["Specific error 1", "Specific error 2"]
}
```

Or for validation errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Email must be a valid email address",
    "Password must be at least 6 characters"
  ]
}
```

---

## Authentication Header

Include JWT token in Authorization header for all protected routes:

```
Authorization: Bearer <accessToken>
```

---

## Generated\*\*: October 28, 2025

**Last Updated**: With Route Fixes & Validation
**Total Endpoints**: 14
**Status**: ✅ All Validated
