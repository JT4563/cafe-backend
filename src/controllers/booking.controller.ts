/**
 * booking.controller.ts
 * Booking endpoints for reservations. Includes minimal validation.
 */

import { Request, Response, NextFunction } from "express";
import BookingService from "../services/booking.service";

class BookingController {
  static async createBooking(
    req: Request & any,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payload = req.body;
      const tenantId = req.user?.tenantId;
      const booking = await BookingService.create({ ...payload, tenantId });
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  }

  static async listByBranch(
    req: Request & any,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { branchId } = req.params;
      const list = await BookingService.listByBranch(branchId);
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
}

export default BookingController;
