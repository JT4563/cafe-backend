import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { createBookingSchema } from "../validators/booking.validators";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateRequest(createBookingSchema),
  BookingController.createBooking
);
router.get("/branch/:branchId", authMiddleware, BookingController.listByBranch);

export default router;
