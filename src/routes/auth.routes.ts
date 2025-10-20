
import { Router } from 'express';
import AuthController from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
router.post('/login', AuthController.login);

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', AuthController.refresh);

export default router;
