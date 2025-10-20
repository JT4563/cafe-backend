/**
 * inventory.routes.ts
 * Routes for inventory management.
 */

import { Router } from "express";
import * as InventoryController from "../controllers/inventory.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:tenantId", InventoryController.getInventoryItems);
router.post("/:tenantId", InventoryController.createInventoryItem);
router.put("/:itemId", InventoryController.updateInventoryItem);
router.delete("/:itemId", InventoryController.deleteInventoryItem);
router.get("/:tenantId/low-stock", InventoryController.getLowStockItems);

export default router;
