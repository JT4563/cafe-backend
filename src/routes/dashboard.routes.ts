/**
 * dashboard.routes.ts
 * Routes for dashboard and analytics.
 */

import { Router } from "express";
import * as DashboardController from "../controllers/dashboard.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/overview/:tenantId", DashboardController.getDashboardOverview);
router.get("/analytics/:tenantId", DashboardController.getSalesAnalytics);
router.get("/charts/:tenantId", DashboardController.getRevenueCharts);
router.get("/top-products/:tenantId", DashboardController.getTopProducts);

export default router;
