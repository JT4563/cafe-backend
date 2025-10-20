
/**
 * Route index — registers all routes under /api/v1
 * Keep this file as the central place to add new domain routes.
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import bookingRoutes from './booking.routes';
import orderRoutes from './order.routes';
import kotRoutes from './kot.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/bookings', bookingRoutes);
router.use('/orders', orderRoutes);
router.use('/kot', kotRoutes);
router.use('/upload', uploadRoutes);

router.get('/', (_req, res) => res.json({ ok: true, version: '1.0.0' }));

export default router;
