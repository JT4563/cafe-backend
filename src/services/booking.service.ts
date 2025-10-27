/**
 * booking.service.ts
 * Production-ready booking/reservation management service.
 * Handles table reservations, availability checks, and booking lifecycle.
 */

import prisma from "../config/db.config";
import logger from "../config/logger";

interface BookingData {
  tenantId: string;
  branchId: string;
  tableId?: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  startTime: Date;
  endTime: Date;
  deposit?: number;
  notes?: string;
}

class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(bookingData: BookingData) {
    try {
      // Validate dates
      if (bookingData.startTime >= bookingData.endTime) {
        throw new Error("End time must be after start time");
      }

      if (bookingData.startTime < new Date()) {
        throw new Error("Cannot book in the past");
      }

      // Check table capacity if table is selected
      if (bookingData.tableId) {
        const table = await prisma.table.findUnique({
          where: { id: bookingData.tableId },
        });

        if (!table) {
          throw new Error("Table not found");
        }

        if (bookingData.partySize > table.capacity) {
          throw new Error(`Table capacity is ${table.capacity}`);
        }

        // Check for conflicting bookings
        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            tableId: bookingData.tableId,
            status: { in: ["PENDING", "CONFIRMED"] },
            OR: [
              {
                startTime: { lt: bookingData.endTime },
                endTime: { gt: bookingData.startTime },
              },
            ],
          },
        });

        if (conflictingBooking) {
          throw new Error("Table not available for this time slot");
        }
      }

      const booking = await prisma.booking.create({
        data: {
          tenantId: bookingData.tenantId,
          branchId: bookingData.branchId,
          tableId: bookingData.tableId,
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          partySize: bookingData.partySize,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          deposit: bookingData.deposit,
          notes: bookingData.notes,
          status: "PENDING",
        },
      });

      logger.info(`Booking created: ${booking.id}`);

      return booking;
    } catch (error) {
      logger.error("Error creating booking:", error);
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { table: true, branch: true },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      return booking;
    } catch (error) {
      logger.error("Error getting booking:", error);
      throw error;
    }
  }

  /**
   * Get all bookings for a branch
   */
  static async getBookingsByBranch(branchId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: { branchId },
          include: { table: true },
          skip,
          take: limit,
          orderBy: { startTime: "desc" },
        }),
        prisma.booking.count({ where: { branchId } }),
      ]);

      return { bookings, total, page, limit };
    } catch (error) {
      logger.error("Error getting bookings:", error);
      throw error;
    }
  }

  /**
   * Confirm a pending booking
   */
  static async confirmBooking(bookingId: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });

      logger.info(`Booking confirmed: ${bookingId}`);

      return booking;
    } catch (error) {
      logger.error("Error confirming booking:", error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string, reason?: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          notes: reason ? `Cancelled: ${reason}` : undefined,
        },
      });

      logger.info(`Booking cancelled: ${bookingId}`);

      return booking;
    } catch (error) {
      logger.error("Error cancelling booking:", error);
      throw error;
    }
  }

  /**
   * Complete a booking
   */
  static async completeBooking(bookingId: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" },
      });

      logger.info(`Booking completed: ${bookingId}`);

      return booking;
    } catch (error) {
      logger.error("Error completing booking:", error);
      throw error;
    }
  }

  /**
   * Check table availability
   */
  static async checkTableAvailability(
    tableId: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      const conflict = await prisma.booking.findFirst({
        where: {
          tableId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      return !conflict;
    } catch (error) {
      logger.error("Error checking availability:", error);
      throw error;
    }
  }

  /**
   * Get available tables for a branch
   */
  static async getAvailableTables(
    branchId: string,
    startTime: Date,
    endTime: Date,
    partySize: number
  ) {
    try {
      const tables = await prisma.table.findMany({
        where: {
          branchId,
          capacity: { gte: partySize },
          bookings: {
            none: {
              status: { in: ["PENDING", "CONFIRMED"] },
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          },
        },
      });

      return tables;
    } catch (error) {
      logger.error("Error getting available tables:", error);
      throw error;
    }
  }

  /**
   * Create a new booking (alias for createBooking)
   */
  static async create(bookingData: BookingData) {
    return this.createBooking(bookingData);
  }

  /**
   * List bookings by branch (alias for getBookingsByBranch)
   */
  static async listByBranch(branchId: string, page = 1, limit = 20) {
    return this.getBookingsByBranch(branchId, page, limit);
  }
}

export default BookingService;
