/**
 * billing.controller.ts
 * Handles billing-related endpoints.
 *
 * Manages invoices, payments, and billing information for tenants.
 */

import { Request, Response, NextFunction } from "express";
import { success } from "../utils/response.util";
import * as BillingService from "../services/billing.service";

/**
 * Get billing summary for a tenant
 */
export const getBillingSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const summary = await BillingService.getBillingSummary(tenantId);
    return res.status(200).json(success(summary, "Billing summary fetched"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices for a tenant
 */
export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const invoices = await BillingService.getInvoices(
      tenantId,
      Number(page),
      Number(limit)
    );
    return res.status(200).json(success(invoices, "Invoices fetched"));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const invoiceData = req.body;
    const invoice = await BillingService.createInvoice(tenantId, invoiceData);
    return res.status(201).json(success(invoice, "Invoice created"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await BillingService.getInvoiceById(invoiceId);
    return res.status(200).json(success(invoice, "Invoice fetched"));
  } catch (error) {
    next(error);
  }
};

/**
 * Process payment
 */
export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const { amount, method } = req.body;
    const payment = await BillingService.processPayment(
      invoiceId,
      amount,
      method
    );
    return res.status(201).json(success(payment, "Payment processed"));
  } catch (error) {
    next(error);
  }
};
