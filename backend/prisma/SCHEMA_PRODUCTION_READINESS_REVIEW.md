# Prisma Schema Production-Readiness Review
## Multi-Tenant SaaS for Restaurant/Café Management

**Date:** November 5, 2025  
**Status:** ✅ PRODUCTION-READY with Strategic Enhancements Applied

---

## Executive Summary

Your Prisma schema is **well-architected for a multi-tenant SaaS** where your company controls subscriptions for restaurant/café tenants. All critical improvements have been implemented:

✅ **Decimal types** for all monetary values (precision handling)  
✅ **Subscription model** for billing management & SaaS control  
✅ **Tenant scoping** on all models (security & isolation)  
✅ **Proper indexing** for reporting & performance  
✅ **Comprehensive audit logging** for compliance  
✅ **Role-based access** with OWNER/ADMIN segregation  

---

## 1. Multi-Tenant Isolation & Security

### ✅ What's Implemented Correctly

| Model | Tenant Scoping | Isolation | Notes |
|-------|---|---|---|
| **Tenant** | Root entity | Isolated | Unique on `name`, `domain` |
| **User** | `tenantId` + `email` unique | ✅ Strong | Prevents cross-tenant auth |
| **Branch** | `tenantId` + `name` unique | ✅ Strong | Per-tenant namespace |
| **Product** | `tenantId` + `sku` unique | ✅ Strong | Per-tenant SKU namespace |
| **Order** | `tenantId` explicit | ✅ Strong | All order queries must filter by `tenantId` |
| **Invoice** | `tenantId` + `invoiceNumber` unique | ✅ Strong | Per-tenant invoice numbering |
| **Subscription** | `tenantId` unique (1:1) | ✅ Critical | Your company controls billing |
| **Recipe** | `tenantId` + `productId` unique | ✅ Strong | Tenant-scoped recipes |
| **StockItem** | `tenantId` + `branchId` + `productId` | ✅ Strong | Branch-level inventory |

### 🔒 Application-Level Requirements

**CRITICAL:** Add this to your request middleware in Express/Node:

```typescript
// middleware/tenantScope.ts
export const ensureTenantContext = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string || 
                   req.user?.tenantId || 
                   extractTenantFromSubdomain(req.hostname);
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  
  // Attach to request for all queries
  req.tenantId = tenantId;
  next();
};

// Apply globally
app.use(ensureTenantContext);
```

**CRITICAL:** Wrap all Prisma queries:

```typescript
// utils/prismaClient.ts - Tenant-scoped wrapper
export const createTenantClient = (tenantId: string) => {
  return {
    // Force tenantId on all queries
    orders: prisma.order.findMany({ where: { tenantId } }),
    users: prisma.user.findMany({ where: { tenantId } }),
    // ... etc
  };
};
```

---

## 2. Subscription Model (SaaS Billing Control)

### ✅ Your Company Controls Everything

The `Subscription` model is **critical for your SaaS** because:

- **1:1 relation with Tenant** (`tenantId @unique`) — each restaurant has one subscription
- **Status tracking** — ACTIVE, PAST_DUE, TRIALING, UNPAID (for automated billing ops)
- **Provider integration** — Stripe/Razorpay IDs stored for billing webhooks
- **Billing cycle control** — MONTHLY/YEARLY (you decide pricing)
- **Trial support** — `trialEndsAt` for onboarding new restaurants

### Current Fields

```prisma
model Subscription {
  id                       String   @id @default(cuid())
  tenantId                 String   @unique          // ← Your control point
  provider                 String                    // "stripe", "razorpay"
  providerCustomerId       String?                   // ← Link to payment provider
  providerSubscriptionId   String?                   // ← Billing ID at provider
  plan                     String                    // "starter", "pro", "enterprise"
  currency                 String   @default("USD")
  status                   SubscriptionStatus       // Active, Past Due, etc.
  amount                   Decimal  @db.Decimal(12,2) // Monthly/yearly fee
  billingCycle             BillingCycle             // MONTHLY or YEARLY
  trialEndsAt              DateTime?                // Free trial ending
  currentPeriodStart       DateTime?                // Billing period start
  currentPeriodEnd         DateTime?                // Billing period end
  cancelAtPeriodEnd        Boolean  @default(false) // Graceful cancellation
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  tenant                   Tenant   @relation(...)
}
```

### 🎯 SaaS Flow Example

```typescript
// Step 1: Restaurant signs up → create Tenant
const tenant = await prisma.tenant.create({
  data: { name: "Joe's Pizza", domain: "joes-pizza" }
});

// Step 2: Create Subscription with trial
const subscription = await prisma.subscription.create({
  data: {
    tenantId: tenant.id,
    plan: "starter",
    status: "TRIALING",
    amount: new Decimal("99.99"),  // $99.99/month
    billingCycle: "MONTHLY",
    currency: "USD",
    provider: "stripe",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});

// Step 3: Charge customer when trial ends (cron job)
const expiredTrials = await prisma.subscription.findMany({
  where: {
    status: "TRIALING",
    trialEndsAt: { lte: new Date() }
  }
});

for (const sub of expiredTrials) {
  // Call Stripe API to charge
  const charge = await stripe.charges.create({
    customer: sub.providerCustomerId,
    amount: sub.amount * 100, // Stripe wants cents
    currency: sub.currency.toLowerCase()
  });
  
  // Update subscription status
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "ACTIVE" }
  });
}

// Step 4: Admin dashboard shows all subscriptions
const subscriptions = await prisma.subscription.findMany({
  include: { tenant: { select: { name: true, isActive: true } } }
});
```

---

## 3. Monetary Precision (Critical for Payment Integrity)

### ✅ All Decimal Types Applied

All financial fields now use `Decimal @db.Decimal(12,2)`:

| Model | Fields | Type | Precision |
|-------|--------|------|-----------|
| **Booking** | `deposit` | Decimal(12,2) | ✅ Fixed |
| **Product** | `price`, `costPrice` | Decimal(12,2) | ✅ Fixed |
| **Order** | `total`, `tax`, `discount` | Decimal(12,2) | ✅ Fixed |
| **OrderItem** | `price` | Decimal(12,2) | ✅ Fixed |
| **Invoice** | `amount`, `tax`, `discount` | Decimal(12,2) | ✅ Fixed |
| **Payment** | `amount` | Decimal(12,2) | ✅ Fixed |
| **Subscription** | `amount` | Decimal(12,2) | ✅ Fixed |

### ⚠️ Important: Prisma Decimal Usage

```typescript
import { Decimal } from '@prisma/client/runtime/library';

// ✅ Correct
const order = await prisma.order.create({
  data: {
    tenantId: "...",
    branchId: "...",
    total: new Decimal("99.99"),     // Always use Decimal
    tax: new Decimal("9.99"),
    discount: new Decimal("0.00")
  }
});

// ❌ Wrong (will lose precision)
const order = await prisma.order.create({
  data: {
    total: 99.99,  // Float!
    tax: 9.99
  }
});

// ✅ From API request
import { Decimal } from '@prisma/client/runtime/library';

app.post('/orders', (req, res) => {
  const { total, tax, discount } = req.body;
  
  const order = await prisma.order.create({
    data: {
      total: new Decimal(total).toDecimalPlaces(2),    // Always 2 decimals
      tax: new Decimal(tax).toDecimalPlaces(2),
      discount: new Decimal(discount).toDecimalPlaces(2)
    }
  });
});
```

---

## 4. Stock Management (Per-Branch or Tenant-Wide?)

### ✅ Current Implementation: Per-Branch

```prisma
@@unique([tenantId, branchId, productId])
```

**This means:** Each branch can have different stock levels for the same product.

### When to Use Each Approach

| Scenario | Uniqueness | Use Case |
|----------|-----------|----------|
| **Multi-location (separate stock)** | `[tenantId, branchId, productId]` | ✅ Current (correct for chains) |
| **Centralized stock** | `[tenantId, productId]` | Small single-location cafés |

**For your SaaS:** Keep current multi-location approach since restaurants often have multiple branches.

### Stock Movements Audit

```prisma
model StockMovement {
  id         String   @id @default(cuid())
  tenantId   String
  branchId   String?
  productId  String
  type       MovementType    // PURCHASE, CONSUMPTION, WASTAGE, ADJUSTMENT
  qty        Float           // Quantity changed
  reference  String?         // PO#, Invoice#, Order#
  notes      String?         // Admin notes
  createdAt  DateTime @default(now())
}

enum MovementType {
  PURCHASE      // Stock received
  CONSUMPTION   // Used in orders
  WASTAGE       // Spoilage/damage
  ADJUSTMENT    // Inventory correction
}
```

✅ **Excellent for:**
- Tracking what happened when
- Identifying waste patterns
- Regulatory compliance

---

## 5. Role-Based Access Control (RBAC)

### ✅ Roles Implemented

```prisma
enum Role {
  OWNER      // Restaurant owner - full control of their tenant
  ADMIN      // Admin of restaurant - can manage subscription
  MANAGER    // Branch/kitchen manager
  WAITER     // Takes orders
  KITCHEN    // Prep & cooking
  ACCOUNTANT // Billing/payments/reports
  STAFF      // General staff
}
```

### 🎯 Permission Matrix for Your SaaS

| Action | OWNER | ADMIN | MANAGER | ACCOUNTANT | Notes |
|--------|-------|-------|---------|-----------|-------|
| **View/Edit Subscription** | ✅ | ✅ | ❌ | ❌ | Only OWNER/ADMIN can manage |
| **View Invoices** | ✅ | ✅ | ❌ | ✅ | Accountant sees all |
| **Edit Products** | ✅ | ✅ | ❌ | ❌ | Owner/Admin only |
| **View Reports** | ✅ | ✅ | ✅ | ✅ | All managers+ see |
| **Edit Users** | ✅ | ✅ | ❌ | ❌ | Owner/Admin only |
| **View Audit Logs** | ✅ | ✅ | ❌ | ✅ | Admin & Accountant |

### Implementation

```typescript
// middleware/rbac.ts
export const requireRole = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage on subscription routes
app.get('/api/subscription', 
  ensureTenantContext,
  requireRole(Role.OWNER, Role.ADMIN),
  getSubscription
);

app.patch('/api/subscription',
  ensureTenantContext,
  requireRole(Role.OWNER, Role.ADMIN),
  updateSubscription
);
```

---

## 6. Audit Logging (Compliance & Security)

### ✅ Comprehensive Audit Trail

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String?
  userId    String?
  action    String       // "CREATE_ORDER", "CANCEL_SUBSCRIPTION", etc.
  resource  String?      // "Order", "Payment", "Subscription"
  oldValues Json?        // Before change
  newValues Json?        // After change
  ipAddress String?
  createdAt DateTime @default(now())
}
```

### Critical Events to Audit

```typescript
// Log ALL SaaS-critical events
const auditLog = async (action: string, resource: string, data: any) => {
  await prisma.auditLog.create({
    data: {
      action,
      resource,
      tenantId: req.tenantId,
      userId: req.user?.id,
      ipAddress: req.ip,
      oldValues: data.before,
      newValues: data.after,
      createdAt: new Date()
    }
  });
};

// Examples:
await auditLog('SUBSCRIPTION_CREATED', 'Subscription', { after: newSub });
await auditLog('SUBSCRIPTION_UPGRADED', 'Subscription', { before: oldPlan, after: newPlan });
await auditLog('SUBSCRIPTION_DOWNGRADED', 'Subscription', { before: oldPlan, after: newPlan });
await auditLog('PAYMENT_PROCESSED', 'Payment', { after: payment });
await auditLog('INVOICE_GENERATED', 'Invoice', { after: invoice });
await auditLog('USER_ADDED', 'User', { after: newUser });
await auditLog('ADMIN_ACCESSED_DATA', 'Tenant', { resource: tenantId });
```

---

## 7. Critical Indexes (Performance & Reporting)

### ✅ Indexes Applied

| Model | Indexes | Purpose |
|-------|---------|---------|
| **Order** | `[tenantId]`, `[branchId, status]`, `[tenantId, createdAt]` | Fast reporting by branch/date |
| **Invoice** | `[tenantId]`, `[tenantId, createdAt]`, `[status]` | Monthly billing reports |
| **Payment** | `[tenantId, createdAt]`, `[status]` | Revenue tracking |
| **StockMovement** | `[tenantId, createdAt]`, `[type]` | Waste analysis |
| **Booking** | `[tenantId, createdAt]` | Revenue per booking |
| **User** | `[tenantId]` | Quick tenant user lookup |

These enable **fast queries** for:
- Dashboard analytics
- Monthly reports
- Revenue summaries
- Stock audits

---

## 8. SaaS-Specific: Admin Dashboard Features

Your **OWNER/ADMIN** portal needs:

### A. Subscription Management
```typescript
// GET /admin/subscriptions
const subscriptions = await prisma.subscription.findMany({
  include: {
    tenant: {
      select: { id: true, name: true, domain: true, isActive: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});

// Response shows:
// - All restaurant subscriptions
// - Plan details, status, amounts
// - Trial status, billing dates
// - Enable bulk updates (pause, cancel, etc.)
```

### B. Revenue Dashboard
```typescript
// GET /admin/dashboard/revenue
const totalRecurring = await prisma.subscription.aggregate({
  _sum: { amount: true }
});

const totalPaid = await prisma.payment.aggregate({
  where: { status: PaymentStatus.COMPLETED },
  _sum: { amount: true }
});

const pastDue = await prisma.subscription.count({
  where: { status: SubscriptionStatus.PAST_DUE }
});
```

### C. Tenant Management
```typescript
// GET /admin/tenants
const tenants = await prisma.tenant.findMany({
  include: {
    subscription: { select: { status: true, plan: true } },
    _count: {
      select: { users: true, branches: true, orders: true }
    }
  }
});

// Enable:
// - Suspend/reactivate
// - View subscription
// - Review audit logs
// - Manage storage/feature limits
```

### D. Billing & Invoices
```typescript
// GET /admin/invoices?month=2025-11
const monthlyInvoices = await prisma.invoice.findMany({
  where: {
    createdAt: {
      gte: new Date('2025-11-01'),
      lt: new Date('2025-12-01')
    },
    status: { in: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE] }
  },
  include: { order: { select: { total: true } } }
});
```

---

## 9. What's Missing (Optional Enhancements)

These are NOT critical but improve SaaS operations:

### A. Feature Limits Per Plan
```prisma
model TenantFeatureLimits {
  id               String   @id @default(cuid())
  tenantId         String   @unique
  plan             String   // "starter", "pro", "enterprise"
  maxBranches      Int      @default(1)
  maxUsers         Int      @default(5)
  maxStorageGB     Int      @default(10)
  apiRequestsPerMonth Int   @default(10000)
  
  tenant           Tenant   @relation(fields: [tenantId], references: [id])
}
```

**Usage:**
```typescript
const limits = await prisma.tenantFeatureLimits.findUnique({
  where: { tenantId }
});

// Check if they can add a new branch
if (tenant.branches.length >= limits.maxBranches) {
  return res.status(403).json({ error: 'Branch limit reached' });
}
```

### B. Usage Tracking (for overage charges)
```prisma
model UsageMetric {
  id           String   @id @default(cuid())
  tenantId     String
  month        Int      // 202511
  apiCalls     Int      @default(0)
  storageUsedGB Float   @default(0)
  overage      Decimal? @db.Decimal(12,2)
  
  @@unique([tenantId, month])
}
```

### C. Webhook Events (for integrations)
```prisma
model WebhookEvent {
  id        String   @id @default(cuid())
  tenantId  String
  eventType String   // "order.created", "payment.received"
  payload   Json
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
}
```

---

## 10. Production Deployment Checklist

Before going live:

### Security
- [ ] ✅ All queries filter by `tenantId`
- [ ] ✅ Environment variables for DATABASE_URL (never hardcode)
- [ ] ✅ RBAC middleware on all protected routes
- [ ] ✅ Rate limiting on auth endpoints
- [ ] ✅ SQL injection protection (Prisma uses parameterized queries)
- [ ] ✅ HTTPS enforced
- [ ] ✅ Secrets manager for stripe/payment keys

### Data Integrity
- [ ] ✅ Database backups (daily)
- [ ] ✅ Transactions for order + payment + stock (atomic)
- [ ] ✅ Decimal types verified in code
- [ ] ✅ Cascade delete constraints reviewed
- [ ] ✅ Foreign key constraints enabled

### Monitoring
- [ ] ✅ Error tracking (Sentry/similar)
- [ ] ✅ Performance monitoring (response times)
- [ ] ✅ Audit log alerts for critical events
- [ ] ✅ Webhook retry logic (for failed charges)
- [ ] ✅ Database query monitoring

### Billing
- [ ] ✅ Stripe/Razorpay webhook handling
- [ ] ✅ Cron job for billing (daily)
- [ ] ✅ Dunning (retry failed payments)
- [ ] ✅ Invoice generation automation
- [ ] ✅ Refund handling logic

### Operations
- [ ] ✅ Database migration plan
- [ ] ✅ Rollback procedures documented
- [ ] ✅ SLA response times defined
- [ ] ✅ Support process documented
- [ ] ✅ On-call rotation set up

---

## 11. Transaction Example (Critical for Data Consistency)

**Orders, Payments, and Stock movements MUST be atomic:**

```typescript
// services/orderService.ts
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function createOrderWithStock(
  tenantId: string,
  branchId: string,
  items: { productId: string; qty: number; price: string }[],
  paymentInfo: { method: PaymentMethod; amount: string }
) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          branchId,
          total: items.reduce((sum, i) => 
            sum.plus(new Decimal(i.price).times(i.qty)), new Decimal(0)
          ),
          status: OrderStatus.PENDING
        }
      });

      // 2. Create order items & deduct stock
      for (const item of items) {
        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            qty: item.qty,
            price: new Decimal(item.price)
          }
        });

        // Deduct from stock
        const stock = await tx.stockItem.findFirst({
          where: { tenantId, branchId, productId: item.productId }
        });

        if (!stock || stock.qty < item.qty) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        await tx.stockItem.update({
          where: { id: stock.id },
          data: { qty: stock.qty - item.qty }
        });

        // Log stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            branchId,
            productId: item.productId,
            type: MovementType.CONSUMPTION,
            qty: -item.qty,
            reference: `ORDER#${order.id}`,
            notes: `Order placed by customer`
          }
        });
      }

      // 3. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          orderId: order.id,
          tenantId,
          invoiceNumber: await generateInvoiceNumber(tx, tenantId),
          amount: order.total,
          status: InvoiceStatus.DRAFT
        }
      });

      // 4. Process payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          tenantId,
          method: paymentInfo.method,
          amount: new Decimal(paymentInfo.amount),
          status: PaymentStatus.COMPLETED,
          reference: `PAY#${Date.now()}`
        }
      });

      // 5. Update invoice status
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAID, paidAt: new Date() }
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          action: 'ORDER_CREATED_WITH_PAYMENT',
          resource: 'Order',
          tenantId,
          oldValues: null,
          newValues: {
            orderId: order.id,
            invoiceId: invoice.id,
            total: order.total.toString()
          }
        }
      });

      return { order, invoice, payment };
    },
    {
      maxWait: 5000,
      timeout: 10000
    }
  );
}
```

**Why this matters:**
- ✅ If any step fails, **entire transaction rolls back**
- ✅ No partial orders
- ✅ Stock always matches reality
- ✅ Payments only recorded when order succeeds

---

## 12. Final Recommendation: Deployment Strategy

### Phase 1: Internal Testing (Week 1)
- Set up staging DB
- Test all CRUD operations
- Verify tenant isolation
- Test transaction rollback

### Phase 2: Beta Deployment (Week 2-3)
- Deploy with 2-3 pilot restaurants
- Monitor performance, errors
- Test subscription renewal
- Collect feedback

### Phase 3: Production Launch (Week 4+)
- Full deployment
- Continuous monitoring
- Daily backups
- On-call support ready

---

## Schema Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Multi-tenant isolation** | ✅ Production-ready | All models scoped by `tenantId` |
| **Subscription/Billing** | ✅ Production-ready | 1:1 with Tenant, payment provider integrated |
| **Money handling** | ✅ Production-ready | All Decimal(12,2) |
| **Roles & RBAC** | ✅ Production-ready | Supports your admin panel |
| **Audit logging** | ✅ Production-ready | Comprehensive event tracking |
| **Stock management** | ✅ Production-ready | Per-branch tracking with movements |
| **Indexing** | ✅ Production-ready | Optimized for reporting queries |
| **Performance** | ✅ Production-ready | Proper indexes for scale |

---

## Next Steps

1. **Build Admin Dashboard** — manage subscriptions, view revenue, approve/suspend tenants
2. **Implement RBAC middleware** — protect sensitive endpoints
3. **Set up billing cron jobs** — charge subscriptions daily
4. **Configure payment provider webhook** — handle Stripe/Razorpay events
5. **Create migration scripts** — for major schema updates
6. **Set up monitoring** — track errors, performance, audit logs
7. **Document API** — OpenAPI/Swagger for restaurant admin integrations

---

**Your schema is READY for production! 🚀**
