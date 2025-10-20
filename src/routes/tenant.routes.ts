
import { Router } from 'express';
import TenantController from '../controllers/tenant.controller';

const router = Router();

// POST /api/v1/tenants - create tenant (owner signup)
router.post('/', TenantController.createTenant);

// GET /api/v1/tenants/:id
router.get('/:id', TenantController.getTenant);

export default router;
