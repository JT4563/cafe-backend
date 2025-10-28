/**
 * inventory.routes.ts
 * Routes for inventory management.
 */

import { Router } from "express";
import * as InventoryController from "../controllers/inventory.controller";
import authMiddleware from "../middlewares/auth.middleware";
import {
  validateRequest,
  validateParams,
} from "../middlewares/validate.middleware";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  tenantIdParamSchema,
  itemIdParamSchema,
} from "../validators/inventory.validators";

const router = Router();

router.use(authMiddleware);

// More specific routes FIRST (before generic :tenantId)
router.get(
  "/:tenantId/low-stock",
  validateParams(tenantIdParamSchema),
  InventoryController.getLowStockItems
);

// Generic routes after specific ones
router.get(
  "/:tenantId",
  validateParams(tenantIdParamSchema),
  InventoryController.getInventoryItems
);
router.post(
  "/:tenantId",
  validateParams(tenantIdParamSchema),
  validateRequest(createInventoryItemSchema),
  InventoryController.createInventoryItem
);
router.put(
  "/:itemId",
  validateParams(itemIdParamSchema),
  validateRequest(updateInventoryItemSchema),
  InventoryController.updateInventoryItem
);
router.delete(
  "/:itemId",
  validateParams(itemIdParamSchema),
  InventoryController.deleteInventoryItem
);

export default router;
