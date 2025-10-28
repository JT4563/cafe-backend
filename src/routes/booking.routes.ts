import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import authMiddleware from "../middlewares/auth.middleware";
import tenantMiddleware from "../middlewares/tenant.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { createBookingSchema } from "../validators/booking.validators";

const router = Router();

// Apply auth and tenant middleware to all booking routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.post(
  "/",
  validateRequest(createBookingSchema),
  BookingController.createBooking
);
router.get("/branch/:branchId", BookingController.listByBranch);

export default router;
