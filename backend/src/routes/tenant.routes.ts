import { Router } from "express";
import TenantController from "../controllers/tenant.controller";
import {
  validateRequest,
  validateParams,
} from "../middlewares/validate.middleware";
import {
  createTenantSchema,
  tenantIdParamSchema,
} from "../validators/tenant.validators";

const router = Router();

// POST /api/v1/tenants - create tenant (owner signup)
router.post(
  "/",
  validateRequest(createTenantSchema),
  TenantController.createTenant
);

// GET /api/v1/tenants - list all tenants
router.get(
  "/",
  TenantController.getAllTenants
);

// GET /api/v1/tenants/:id
router.get(
  "/:id",
  validateParams(tenantIdParamSchema),
  TenantController.getTenant
);

export default router;
