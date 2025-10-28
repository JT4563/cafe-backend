import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import tenantMiddleware from "../middlewares/tenant.middleware";
import OrderController from "../controllers/order.controller";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post("/", OrderController.createOrder);
router.get("/:id", OrderController.getOrder);

export default router;
