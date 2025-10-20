
import { Router } from 'express';
import BookingController from '../controllers/booking.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, BookingController.createBooking);
router.get('/branch/:branchId', authMiddleware, BookingController.listByBranch);

export default router;
