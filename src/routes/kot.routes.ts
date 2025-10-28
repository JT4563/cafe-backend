import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import tenantMiddleware from "../middlewares/tenant.middleware";
import KOTController from "../controllers/kot.controller";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/branch/:branchId", KOTController.listByBranch);
router.post("/:id/print", KOTController.printKOT);

export default router;
