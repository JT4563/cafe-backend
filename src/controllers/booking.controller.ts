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
      const tenantId = req.user?.tenantId;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }

      const list = await BookingService.listByBranch(
        branchId,
        tenantId,
        page,
        limit
      );
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
}

export default BookingController;
