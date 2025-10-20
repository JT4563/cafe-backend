
/**
 * booking.service.ts
 * Booking logic: simple create and list.
 * Production: add overlap checks, waitlist, SMS/email confirmation.
 */

import prisma from '../config/db.config';

class BookingService {
  static async create(data: any) {
    // minimal: create booking
    const b = await prisma.booking.create({ data });
    return b;
  }

  static async listByBranch(branchId: string) {
    return prisma.booking.findMany({ where: { branchId }, orderBy: { startTime: 'desc' }});
  }
}

export default BookingService;
