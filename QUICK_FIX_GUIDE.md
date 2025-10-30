# 🔧 QUICK FIX GUIDE - Mount Missing Routes

**Priority:** 🔴 CRITICAL
**Time to Fix:** 5 minutes
**Impact:** High - 6 services currently unavailable

---

## THE PROBLEM

Your application has 6 fully implemented services with proper controllers, but they're **not mounted** in the route registry.

```
Service            Status        Problem
──────────────────────────────────────────
Menu               ✅ Ready      ❌ Not mounted
Staff              ✅ Ready      ❌ Not mounted
Inventory          ✅ Ready      ❌ Not mounted
Report             ✅ Ready      ❌ Not mounted
Billing            ✅ Ready      ❌ Not mounted
Dashboard          ✅ Ready      ❌ Not mounted
```

**Result:** All 6 endpoints return `404 Not Found` even though the code exists!

---

## THE SOLUTION

### Step 1: Open `src/routes/index.ts`

Current content:

```typescript
import { Router } from "express";
import authRoutes from "./auth.routes";
import tenantRoutes from "./tenant.routes";
import bookingRoutes from "./booking.routes";
import orderRoutes from "./order.routes";
import kotRoutes from "./kot.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/bookings", bookingRoutes);
router.use("/orders", orderRoutes);
router.use("/kot", kotRoutes);
router.use("/upload", uploadRoutes);

router.get("/", (_req, res) => res.json({ ok: true, version: "1.0.0" }));

export default router;
```

### Step 2: Add Missing Imports

Add these 6 import statements after the existing imports:

```typescript
import menuRoutes from "./menu.routes";
import staffRoutes from "./staff.routes";
import inventoryRoutes from "./inventory.routes";
import reportRoutes from "./report.routes";
import billingRoutes from "./billing.routes";
import dashboardRoutes from "./dashboard.routes";
```

### Step 3: Add Missing Route Mounts

Add these 6 router.use() calls after the existing ones:

```typescript
router.use("/menu", menuRoutes);
router.use("/staff", staffRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/report", reportRoutes);
router.use("/billing", billingRoutes);
router.use("/dashboard", dashboardRoutes);
```

### Step 4: Final File Should Look Like

```typescript
import { Router } from "express";
import authRoutes from "./auth.routes";
import tenantRoutes from "./tenant.routes";
import bookingRoutes from "./booking.routes";
import orderRoutes from "./order.routes";
import kotRoutes from "./kot.routes";
import uploadRoutes from "./upload.routes";
import menuRoutes from "./menu.routes";
import staffRoutes from "./staff.routes";
import inventoryRoutes from "./inventory.routes";
import reportRoutes from "./report.routes";
import billingRoutes from "./billing.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/bookings", bookingRoutes);
router.use("/orders", orderRoutes);
router.use("/kot", kotRoutes);
router.use("/upload", uploadRoutes);
router.use("/menu", menuRoutes);
router.use("/staff", staffRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/report", reportRoutes);
router.use("/billing", billingRoutes);
router.use("/dashboard", dashboardRoutes);

router.get("/", (_req, res) => res.json({ ok: true, version: "1.0.0" }));

export default router;
```

---

## VERIFICATION

After applying the fix, all these endpoints should work:

```
✅ GET  /api/v1/menu/:tenantId
✅ POST /api/v1/menu/:tenantId
✅ GET  /api/v1/menu/:tenantId/item/:itemId
✅ PUT  /api/v1/menu/:tenantId/:itemId

✅ GET  /api/v1/staff/:tenantId
✅ POST /api/v1/staff/:tenantId
✅ GET  /api/v1/staff/:tenantId/:staffId
✅ PUT  /api/v1/staff/:tenantId/:staffId

✅ GET  /api/v1/inventory/:tenantId
✅ POST /api/v1/inventory/:tenantId
✅ GET  /api/v1/inventory/:tenantId/low-stock
✅ PUT  /api/v1/inventory/:itemId

✅ GET  /api/v1/report/sales/:tenantId
✅ GET  /api/v1/report/inventory/:tenantId
✅ GET  /api/v1/report/staff/:tenantId
✅ GET  /api/v1/report/payment/:tenantId

✅ GET  /api/v1/billing/summary?tenantId=xxx
✅ GET  /api/v1/billing/:tenantId/invoices
✅ GET  /api/v1/billing/:tenantId/payments
✅ POST /api/v1/billing/:tenantId/invoice

✅ GET  /api/v1/dashboard/overview?tenantId=xxx
✅ GET  /api/v1/dashboard/analytics?tenantId=xxx
✅ GET  /api/v1/dashboard/revenue?tenantId=xxx
```

---

## TESTING THE FIX

### After deployment, test with curl:

```bash
# Get a token first
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use the token to test menu route
curl -X GET http://localhost:4000/api/v1/menu/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 200 with menu items (not 404)
```

---

## DEPLOYMENT

After fixing:

1. Rebuild TypeScript: `npm run build`
2. Restart server: `npm start`
3. Test endpoints
4. Deploy to production

---

## SUMMARY

| Item                   | Status                                  |
| ---------------------- | --------------------------------------- |
| Problem identified     | ✅ YES                                  |
| Solution provided      | ✅ YES                                  |
| Time to implement      | ⏱️ 5 minutes                            |
| Risk level             | 🟢 VERY LOW                             |
| Backward compatibility | ✅ YES (only adding new routes)         |
| Testing required       | ✅ YES (simple curl test)               |
| Can you be fired?      | ⚠️ NO - You've identified and fixed it! |

---

**You're all set!** Apply this fix and you're good to go. 🚀
