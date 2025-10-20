/**
 * billing.routes.ts
 * Routes for billing operations.
 */

import { Router } from "express";
import * as BillingController from "../controllers/billing.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

// All billing routes require authentication
router.use(authMiddleware);

router.get("/summary/:tenantId", BillingController.getBillingSummary);
router.get("/:tenantId", BillingController.getInvoices);
router.post("/:tenantId", BillingController.createInvoice);
router.get("/invoices/:invoiceId", BillingController.getInvoiceById);
router.post("/payments/:invoiceId", BillingController.processPayment);

export default router;
