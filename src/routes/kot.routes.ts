
import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import KOTController from '../controllers/kot.controller';

const router = Router();

router.get('/branch/:branchId', authMiddleware, KOTController.listByBranch);
router.post('/:id/print', authMiddleware, KOTController.printKOT);

export default router;
