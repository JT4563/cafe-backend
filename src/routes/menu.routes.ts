/**
 * menu.routes.ts
 * Routes for menu management.
 */

import { Router } from "express";
import * as MenuController from "../controllers/menu.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:tenantId", MenuController.getAllMenuItems);
router.post("/:tenantId", MenuController.createMenuItem);
router.get("/items/:itemId", MenuController.getMenuItemById);
router.put("/:itemId", MenuController.updateMenuItem);
router.delete("/:itemId", MenuController.deleteMenuItem);
router.get("/:tenantId/categories", MenuController.getMenuCategories);

export default router;
