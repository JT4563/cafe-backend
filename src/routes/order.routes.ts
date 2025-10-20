
import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import OrderController from '../controllers/order.controller';

const router = Router();

router.post('/', authMiddleware, OrderController.createOrder);
router.get('/:id', authMiddleware, OrderController.getOrder);

export default router;
