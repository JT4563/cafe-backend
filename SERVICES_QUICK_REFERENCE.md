# Quick Reference - Service Method Signatures

## October 27, 2025

---

## Tenant Service

```typescript
class TenantService {
  static async createTenant(data: CreateTenantData);
  static async getTenant(tenantId: string);
  static async updateTenant(tenantId: string, data: Partial<CreateTenantData>);
  static async createBranch(tenantId: string, branchData: any);
  static async getBranches(tenantId: string);
  static async deactivateTenant(tenantId: string);
}

// Usage:
const tenant = await TenantService.createTenant({
  name: "Cafe XYZ",
  email: "owner@cafe.com",
  password: "secure123",
  domain: "cafe-xyz.local",
});
```

---

## KOT Service

```typescript
class KOTService {
  // Creation
  static async createKOT(data: KOTData);

  // Retrieval
  static async getKOT(kotId: string, tenantId: string);
  static async listByBranch(
    branchId: string,
    tenantId: string,
    page?: number,
    limit?: number
  );
  static async getUnprintedKOTs(branchId: string, tenantId: string);

  // Printing
  static async printKOT(kotId: string, tenantId: string);
  static async printMultipleKOTs(kotIds: string[], tenantId: string);
  static async markAsPrinted(kotId: string, tenantId: string);

  // Deletion
  static async deleteKOT(kotId: string, tenantId: string);
}

// Usage:
const kot = await KOTService.createKOT({
  orderId: "ord_123",
  branchId: "branch_1",
  tenantId: "tenant_1",
  payload: {
    /* order details */
  },
});

const printed = await KOTService.printKOT(kot.id, "tenant_1");
```

---

## Inventory Service

```typescript
// Stock Item Operations
export async function getInventoryItems(
  tenantId: string,
  branchId?: string,
  page?: number,
  limit?: number
);
export async function getInventoryItem(itemId: string, tenantId: string);
export async function createInventoryItem(data: StockItemData);
export async function updateInventoryItem(
  itemId: string,
  tenantId: string,
  data: Partial<StockItemData>
);
export async function deleteInventoryItem(itemId: string, tenantId: string);

// Stock Movements
export async function recordStockMovement(data: StockMovementData);
export async function getStockMovements(
  tenantId: string,
  productId?: string,
  page?: number,
  limit?: number
);

// Analysis
export async function getLowStockItems(tenantId: string, branchId?: string);
export async function getLowStockItemsOptimized(
  tenantId: string,
  branchId?: string
);
export async function getStockSummary(tenantId: string, branchId?: string);
export async function adjustStock(
  tenantId: string,
  productId: string,
  adjustment: number,
  reason: string
);

// Usage:
const item = await createInventoryItem({
  tenantId: "tenant_1",
  productId: "prod_123",
  qty: 50,
  minQty: 10,
});

const movement = await recordStockMovement({
  tenantId: "tenant_1",
  productId: "prod_123",
  type: "PURCHASE",
  qty: 100,
  reference: "PO-2025-001",
});

const low = await getLowStockItems("tenant_1");
```

---

## Dashboard Service

```typescript
// Overview
export async function getDashboardOverview(tenantId: string, branchId?: string);
export async function getComprehensiveReport(
  tenantId: string,
  branchId?: string
);

// Analytics
export async function getSalesAnalytics(
  tenantId: string,
  startDate: string,
  endDate: string,
  branchId?: string
);
export async function getRevenueCharts(
  tenantId: string,
  branchId?: string,
  days?: number
);
export async function getTopProducts(
  tenantId: string,
  limit?: number,
  branchId?: string
);

// Statistics
export async function getBookingStats(tenantId: string, branchId?: string);
export async function getPaymentStats(tenantId: string, branchId?: string);

// Usage:
const overview = await getDashboardOverview("tenant_1");
// Returns: {
//   totalOrders, totalRevenue, todayOrders, todayRevenue,
//   totalCustomers, totalBookings
// }

const analytics = await getSalesAnalytics(
  "tenant_1",
  "2025-10-01",
  "2025-10-31"
);

const revenue = await getRevenueCharts("tenant_1", undefined, 30);
// Returns: { daily: [...], weekly: [...], monthly: [...] }

const products = await getTopProducts("tenant_1", 10);
```

---

## Booking Service

```typescript
class BookingService {
  // CRUD
  static async create(bookingData: BookingData);
  static async createBooking(bookingData: BookingData);
  static async getBookingById(bookingId: string, tenantId: string);

  // Listing
  static async getBookingsByBranch(
    branchId: string,
    tenantId: string,
    page?: number,
    limit?: number
  );
  static async listByBranch(
    branchId: string,
    tenantId: string,
    page?: number,
    limit?: number
  );
  static async getUpcomingBookings(
    branchId: string,
    tenantId: string,
    hours?: number
  );

  // Status Management
  static async updateBooking(
    bookingId: string,
    tenantId: string,
    updateData: Partial<BookingData>
  );
  static async confirmBooking(bookingId: string, tenantId: string);
  static async cancelBooking(
    bookingId: string,
    tenantId: string,
    reason?: string
  );
  static async completeBooking(bookingId: string, tenantId: string);
  static async markNoShow(bookingId: string, tenantId: string);

  // Availability
  static async checkTableAvailability(
    tableId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string
  );
  static async getAvailableTables(
    branchId: string,
    tenantId: string,
    startTime: Date,
    endTime: Date,
    partySize: number
  );
}

// Usage:
const booking = await BookingService.create({
  tenantId: "tenant_1",
  branchId: "branch_1",
  customerName: "John Doe",
  partySize: 4,
  startTime: new Date("2025-10-28T18:00"),
  endTime: new Date("2025-10-28T20:00"),
  tableId: "table_5",
  deposit: 500,
});

await BookingService.confirmBooking(booking.id, "tenant_1");

const available = await BookingService.getAvailableTables(
  "branch_1",
  "tenant_1",
  startTime,
  endTime,
  4
);
```

---

## Status Enums

### Booking Status

```
PENDING    → Initial state
CONFIRMED  → Confirmed by admin
COMPLETED  → Guest checked out
CANCELLED  → Cancelled
NO_SHOW    → Guest didn't show
```

### Order Status

```
PENDING      → Not yet processed
IN_PROGRESS  → Being prepared
COMPLETED    → Ready for delivery
CANCELLED    → Order cancelled
```

### OrderItem Status

```
PENDING         → Not sent to kitchen
SENT_TO_KITCHEN → Sent to kitchen
PREPARING       → Being prepared
READY           → Ready for delivery
SERVED          → Served to customer
CANCELLED       → Item cancelled
```

### Stock Movement Type

```
PURCHASE      → Goods received/purchased
CONSUMPTION   → Used in orders
WASTAGE       → Damaged or expired
ADJUSTMENT    → Manual correction
```

### Invoice Status

```
DRAFT    → Not yet sent
SENT     → Sent to customer
VIEWED   → Viewed by customer
PAID     → Payment received
OVERDUE  → Payment overdue
CANCELLED → Invoice cancelled
```

### Payment Status

```
PENDING    → Payment awaiting
COMPLETED  → Payment successful
FAILED     → Payment failed
REFUNDED   → Refund issued
```

---

## Error Handling

### Common Errors

```typescript
// Input Validation
throw new Error("Tenant ID is required");
throw new Error("Start date must be before end date");
throw new Error("Quantity cannot be negative");

// Resource Not Found
throw new Error("Tenant not found");
throw new Error("Booking not found");
throw new Error("Table not found");

// Business Logic
throw new Error("Table not available for this time slot");
throw new Error("Cannot book in the past");
throw new Error("Table capacity is X");
throw new Error("Insufficient stock for this movement");
throw new Error("Cannot update CONFIRMED bookings");

// Isolation/Permission
throw new Error("Branch not found or does not belong to this tenant");
throw new Error("KOT not found or does not belong to this tenant");
```

---

## Prisma Query Patterns

### Tenant Isolation

```typescript
// Always include tenantId filter
await prisma.booking.findMany({
  where: {
    tenantId: req.user.tenantId, // ← CRITICAL
    branchId: branchId,
  },
});
```

### Pagination

```typescript
const page = 1,
  limit = 20;
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.model.findMany({ skip, take: limit }),
  prisma.model.count({ where }),
]);

return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
```

### Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  const item1 = await tx.model1.create({ data: {...} });
  const item2 = await tx.model2.update({ where: {...}, data: {...} });
  return { item1, item2 };
});
```

### Aggregation

```typescript
const result = await prisma.order.aggregate({
  where: { tenantId },
  _sum: { total: true },
  _count: true,
});
```

---

## Controller Patterns

### Extract Auth Data

```typescript
const tenantId = req.user?.tenantId;
const branchId = req.params.branchId;
const page = req.query.page ? parseInt(req.query.page) : 1;

if (!tenantId) throw new Error("Unauthorized");
```

### Pagination Query

```typescript
const page = req.query.page ? parseInt(req.query.page) : 1;
const limit = req.query.limit ? parseInt(req.query.limit) : 20;
```

### Response

```typescript
import { successResponse } from "../utils/response.util";

successResponse(res, data, "Message", 200);
// or
res.status(201).json(data);
```

---

## Testing Quick Checklist

### Tenant Service

- [ ] Create tenant with unique name
- [ ] Reject duplicate tenant name
- [ ] Reject duplicate email
- [ ] Create default branch
- [ ] Create owner user

### KOT Service

- [ ] Create KOT with validation
- [ ] Prevent duplicate KOTs per order
- [ ] Mark as printed
- [ ] List unprinted KOTs
- [ ] Prevent deletion of printed KOTs

### Inventory Service

- [ ] Create stock item
- [ ] Record stock movements
- [ ] Get low stock items
- [ ] Prevent negative stock
- [ ] Track movement history

### Dashboard Service

- [ ] Get today's orders
- [ ] Calculate revenue
- [ ] Get top products
- [ ] Filter by date range
- [ ] Generate report

### Booking Service

- [ ] Create booking in future
- [ ] Prevent past bookings
- [ ] Detect table conflicts
- [ ] Check table capacity
- [ ] Update booking
- [ ] Mark as NO_SHOW
- [ ] Get available tables

---

**Ready for Production! ✅**
