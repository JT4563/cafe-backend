/**
 * dashboard.routes.ts
 * Routes for dashboard and analytics.
 */

import { Router } from "express";
import * as DashboardController from "../controllers/dashboard.controller";
import authMiddleware from "../middlewares/auth.middleware";
import {
  validateParams,
  validateQuery,
} from "../middlewares/validate.middleware";
import {
  tenantIdParamSchema,
  analyticsQuerySchema,
  topProductsQuerySchema,
} from "../validators/dashboard.validators";

const router = Router();

router.use(authMiddleware);

router.get(
  "/overview/:tenantId",
  validateParams(tenantIdParamSchema),
  DashboardController.getDashboardOverview
);
router.get(
  "/analytics/:tenantId",
  validateParams(tenantIdParamSchema),
  validateQuery(analyticsQuerySchema),
  DashboardController.getSalesAnalytics
);
router.get(
  "/charts/:tenantId",
  validateParams(tenantIdParamSchema),
  DashboardController.getRevenueCharts
);
router.get(
  "/top-products/:tenantId",
  validateParams(tenantIdParamSchema),
  validateQuery(topProductsQuerySchema),
  DashboardController.getTopProducts
);

export default router;
