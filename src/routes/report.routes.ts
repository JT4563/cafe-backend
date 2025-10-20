/**
 * report.routes.ts
 * Routes for reporting and exports.
 */

import { Router } from "express";
import * as ReportController from "../controllers/report.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/sales/:tenantId", ReportController.getSalesReport);
router.get("/inventory/:tenantId", ReportController.getInventoryReport);
router.get("/staff/:tenantId", ReportController.getStaffPerformanceReport);
router.post("/export/sales/:tenantId", ReportController.exportSalesData);
router.post("/custom/:tenantId", ReportController.getCustomReport);

export default router;
