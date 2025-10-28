/**
 * report.routes.ts
 * Routes for reporting and exports.
 */

import { Router } from "express";
import {
  getSalesReport,
  getInventoryReport,
  getStaffPerformanceReport,
  getPaymentReport,
  exportSalesData,
  getDashboardSummary,
} from "../controllers/report.controller";
import authMiddleware from "../middlewares/auth.middleware";
import tenantMiddleware from "../middlewares/tenant.middleware";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/sales/:tenantId", getSalesReport);
router.get("/inventory/:tenantId", getInventoryReport);
router.get("/staff/:tenantId", getStaffPerformanceReport);
router.get("/payment/:tenantId", getPaymentReport);
router.get("/dashboard/:tenantId", getDashboardSummary);
router.post("/export/sales/:tenantId", exportSalesData);

export default router;
