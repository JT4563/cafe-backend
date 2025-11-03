/**
 * billing.service.ts
 * Handles billing operations via Prisma.
 *
 * Manages invoices, payments, and billing calculations.
 * Provides comprehensive billing and financial tracking for multi-tenant cafe system.
 */

import prisma from "../config/db.config";
import logger from "../config/logger";

interface BillingSummary {
  tenantId: string;
  totalRevenue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  pendingInvoices: number;
  paidInvoices: number;
  overallRevenueTrend: number;
}

interface InvoiceResponse {
  invoices: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateInvoiceData {
  orderId: string;
  invoiceNumber?: string;
  amount: number;
  tax?: number;
  discount?: number;
  dueDate?: Date;
}

/**
 * Get comprehensive billing summary for tenant
 * Includes revenue, invoiced amounts, payments, and trends
 */
export async function getBillingSummary(
  tenantId: string
): Promise<BillingSummary> {
  try {
    logger.info(`Fetching billing summary for tenant ${tenantId}`);

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Get all invoices for this tenant
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
    });

    // Get all payments for this tenant
    const payments = await prisma.payment.findMany({
      where: { tenantId },
    });

    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = invoices
      .filter((inv) =>
        ["DRAFT", "SENT", "VIEWED", "OVERDUE"].includes(inv.status)
      )
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingInvoices = invoices.filter(
      (inv) => !["PAID", "CANCELLED"].includes(inv.status)
    ).length;
    const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length;

    // Get total revenue from completed orders
    const orders = await prisma.order.findMany({
      where: { tenantId, status: "COMPLETED" },
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate revenue trend (this month vs last month)
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthOrders = orders.filter(
      (o) => new Date(o.createdAt) >= firstDayThisMonth
    );
    const lastMonthOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= firstDayLastMonth &&
        new Date(o.createdAt) <= lastDayLastMonth
    );

    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, o) => sum + o.total,
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, o) => sum + o.total,
      0
    );

    const overallRevenueTrend =
      lastMonthRevenue > 0
        ? parseFloat(
            (
              ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
              100
            ).toFixed(2)
          )
        : 0;

    logger.info(
      `Billing summary fetched: Total Revenue=${totalRevenue}, Total Invoiced=${totalInvoiced}, Total Paid=${totalPaid}`
    );

    return {
      tenantId,
      totalRevenue,
      totalInvoiced,
      totalPaid,
      totalPending,
      pendingInvoices,
      paidInvoices,
      overallRevenueTrend,
    };
  } catch (error) {
    logger.error("Error fetching billing summary:", error);
    throw error;
  }
}

/**
 * Get all invoices for tenant with pagination
 */
export async function getInvoices(
  tenantId: string,
  page: number = 1,
  limit: number = 10
): Promise<InvoiceResponse> {
  try {
    logger.info(
      `Fetching invoices for tenant ${tenantId}, page ${page}, limit ${limit}`
    );

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.invoice.count({
      where: { tenantId },
    });

    // Get paginated invoices with related data
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `Invoices fetched: total=${total}, page=${page}, limit=${limit}`
    );

    return {
      invoices,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    throw error;
  }
}

/**
 * Create a new invoice from an order
 */
export async function createInvoice(
  tenantId: string,
  invoiceData: CreateInvoiceData
) {
  try {
    logger.info(`Creating invoice for tenant ${tenantId}`);

    const { orderId, amount, tax = 0, discount = 0, dueDate } = invoiceData;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found for tenant ${tenantId}`);
    }

    // Check if invoice already exists for this order
    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId, tenantId },
    });

    if (existingInvoice && !["CANCELLED"].includes(existingInvoice.status)) {
      throw new Error(`Invoice already exists for order ${orderId}`);
    }

    // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      },
    });
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(
      5,
      "0"
    )}`;

    // Calculate final amount
    const finalAmount = amount + tax - discount;

    if (finalAmount <= 0) {
      throw new Error("Invoice amount must be positive");
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        tenantId,
        invoiceNumber,
        amount: finalAmount,
        tax,
        discount,
        status: "DRAFT",
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      },
      include: {
        order: true,
        payments: true,
      },
    });

    logger.info(
      `Invoice created: ${invoice.id} (${invoiceNumber}) for order ${orderId}`
    );

    return invoice;
  } catch (error) {
    logger.error("Error creating invoice:", error);
    throw error;
  }
}

/**
 * Get invoice by ID with full details
 */
export async function getInvoiceById(invoiceId: string, tenantId: string) {
  try {
    logger.info(`Fetching invoice ${invoiceId} for tenant ${tenantId}`);

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            branch: true,
            table: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found for tenant ${tenantId}`);
    }

    // Calculate payment summary
    const totalPaid = invoice.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const amountDue = invoice.amount - totalPaid;

    logger.info(`Invoice ${invoiceId} fetched successfully`);

    return {
      ...invoice,
      totalPaid,
      amountDue,
      percentagePaid: parseFloat(
        ((totalPaid / invoice.amount) * 100).toFixed(2)
      ),
    };
  } catch (error) {
    logger.error("Error fetching invoice:", error);
    throw error;
  }
}

/**
 * Process payment for an invoice
 */
export async function processPayment(
  invoiceId: string,
  tenantId: string,
  amount: number,
  method: string,
  reference?: string
) {
  try {
    logger.info(
      `Processing payment for invoice ${invoiceId}, amount ${amount}, method ${method}`
    );

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found for tenant ${tenantId}`);
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      throw new Error(`Invoice ${invoiceId} is already paid`);
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error("Payment amount must be positive");
    }

    // Get existing payments
    const existingPayments = await prisma.payment.findMany({
      where: { invoiceId, tenantId, status: "COMPLETED" },
    });

    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDue = invoice.amount - totalPaid;

    if (amount > remainingDue) {
      throw new Error(
        `Payment amount ${amount} exceeds remaining due ${remainingDue}`
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        tenantId,
        method: method as any,
        amount,
        status: "COMPLETED",
        reference: reference || null,
      },
    });

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= invoice.amount) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
      logger.info(`Invoice ${invoiceId} marked as PAID`);
    } else {
      // Mark as VIEWED if not paid yet
      if (invoice.status === "DRAFT" || invoice.status === "SENT") {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "VIEWED" },
        });
      }
    }

    logger.info(
      `Payment processed: ${payment.id} for invoice ${invoiceId}, amount ${amount}`
    );

    return {
      payment,
      invoice: await getInvoiceById(invoiceId, tenantId),
    };
  } catch (error) {
    logger.error("Error processing payment:", error);
    throw error;
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  tenantId: string,
  status: string
) {
  try {
    logger.info(`Updating invoice ${invoiceId} status to ${status}`);

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found for tenant ${tenantId}`);
    }

    // Validate status
    const validStatuses = [
      "DRAFT",
      "SENT",
      "VIEWED",
      "PAID",
      "OVERDUE",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: status as any },
      include: {
        payments: true,
      },
    });

    logger.info(`Invoice ${invoiceId} status updated to ${status}`);

    return updatedInvoice;
  } catch (error) {
    logger.error("Error updating invoice status:", error);
    throw error;
  }
}

/**
 * Get revenue analytics for date range
 */
export async function getRevenueAnalytics(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    logger.info(
      `Fetching revenue analytics for tenant ${tenantId} from ${startDate} to ${endDate}`
    );

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
    const totalDiscount = orders.reduce(
      (sum, order) => sum + order.discount,
      0
    );
    const orderCount = orders.length;
    const averageOrderValue =
      orderCount > 0 ? parseFloat((totalRevenue / orderCount).toFixed(2)) : 0;

    logger.info(
      `Revenue analytics: Total=${totalRevenue}, Orders=${orderCount}, Average=${averageOrderValue}`
    );

    return {
      startDate,
      endDate,
      totalRevenue,
      totalTax,
      totalDiscount,
      orderCount,
      averageOrderValue,
      netRevenue: totalRevenue - totalDiscount,
    };
  } catch (error) {
    logger.error("Error fetching revenue analytics:", error);
    throw error;
  }
}
