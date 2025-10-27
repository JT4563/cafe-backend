import { Router } from "express";
import {
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
  assignRole,
  getStaffByBranch,
} from "../controllers/staff.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:tenantId", getAllStaff);
router.post("/:tenantId", createStaff);
router.get("/:tenantId/:staffId", getStaffById);
router.put("/:tenantId/:staffId", updateStaff);
router.patch("/:tenantId/:staffId/deactivate", deactivateStaff);
router.post("/:tenantId/:staffId/role", assignRole);
router.get("/:tenantId/branch/:branchId", getStaffByBranch);

export default router;
