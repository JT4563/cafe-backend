/**
 * staff.routes.ts
 * Routes for staff management.
 */

import { Router } from "express";
import * as StaffController from "../controllers/staff.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:tenantId", StaffController.getAllStaff);
router.post("/:tenantId", StaffController.createStaff);
router.get("/:staffId", StaffController.getStaffById);
router.put("/:staffId", StaffController.updateStaff);
router.delete("/:staffId", StaffController.deleteStaff);
router.post("/:staffId/role", StaffController.assignRole);

export default router;
