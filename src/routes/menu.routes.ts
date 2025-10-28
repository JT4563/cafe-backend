/**
 * menu.routes.ts
 * Routes for menu management.
 */

import { Router } from "express";
import {
  getAllMenuItems,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
  deactivateMenuItem,
  getMenuCategories,
  getMenuItemsByCategory,
} from "../controllers/menu.controller";
import authMiddleware from "../middlewares/auth.middleware";
import tenantMiddleware from "../middlewares/tenant.middleware";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/:tenantId", getAllMenuItems);
router.post("/:tenantId", createMenuItem);
router.get("/:tenantId/item/:itemId", getMenuItemById);
router.put("/:tenantId/:itemId", updateMenuItem);
router.patch("/:tenantId/:itemId/deactivate", deactivateMenuItem);
router.get("/:tenantId/categories", getMenuCategories);
router.get("/:tenantId/category/:category", getMenuItemsByCategory);

export default router;
