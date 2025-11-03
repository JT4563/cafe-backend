/**
 * order.service.ts
 * Production-ready order management with POS integration.
 * Handles order creation, items, KOT generation, and order lifecycle.
 */

import prisma from "../config/db.config";
import { getQueue } from "../queues/queue.config";
import logger from "../config/logger";

interface OrderItemData {
  productId: string;
  qty: number;
  price: number;
  specialRequest?: string;
}

interface CreateOrderData {
  tenantId: string;
  branchId: string;
  tableId?: string;
  userId?: string;
  items: OrderItemData[];
  tax?: number;
  discount?: number;
  notes?: string;
}

class OrderService {
  /**
   * Create new order with items and KOT
   */
  static async createOrder(data: CreateOrderData) {
    try {
      const {
        items,
        tenantId,
        branchId,
        userId,
        tableId,
        tax = 0,
        discount = 0,
        notes,
      } = data;

      // Validate input
      if (!items || items.length === 0) {
        throw new Error("Order must have at least one item");
      }

      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error("Tenant not found");
      }

      // Verify branch exists
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId },
      });

      if (!branch) {
        throw new Error("Branch not found for tenant");
      }

      // Verify products exist
      const productIds = items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products not found for tenant");
      }

      // Calculate total
      const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const finalTotal = total - discount + tax;

      // Create order with items in transaction
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            tenantId,
            branchId,
            tableId: tableId || null,
            userId: userId || null,
            total: finalTotal,
            tax,
            discount,
            status: "PENDING",
            notes,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                specialRequest: item.specialRequest,
                status: "PENDING",
              })),
            },
          },
          include: { items: true },
        });

        // Create KOT
        await tx.kOT.create({
          data: {
            orderId: newOrder.id,
            tenantId,
            branchId,
            payload: items as any,
          },
        });

        return newOrder;
      });

      logger.info(`Order created: ${order.id} for tenant ${tenantId}`);

      // Enqueue print job for KOT
      const q = getQueue("printers");
      await q.add("print-kot", {
        orderId: order.id,
        tenantId,
        branchId,
      });

      return {
        id: order.id,
        tenantId: order.tenantId,
        branchId: order.branchId,
        total: order.total,
        tax: order.tax,
        discount: order.discount,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt,
      };
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  /**
   * Get order by ID with items
   */
  static async getOrder(orderId: string, tenantId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          items: {
            include: {
              product: { select: { name: true, category: true } },
            },
          },
          invoices: { select: { id: true, status: true, amount: true } },
          table: { select: { id: true, name: true } },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    } catch (error) {
      logger.error("Error fetching order:", error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    tenantId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          completedAt: status === "COMPLETED" ? new Date() : null,
        },
        include: { items: true },
      });

      logger.info(`Order ${orderId} status updated to ${status}`);
      return updated;
    } catch (error) {
      logger.error("Error updating order status:", error);
      throw error;
    }
  }

  /**
   * Add item to existing order
   */
  static async addOrderItem(
    orderId: string,
    tenantId: string,
    itemData: OrderItemData
  ) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: itemData.productId, tenantId },
      });

      if (!product) {
        throw new Error("Product not found for tenant");
      }

      // Create order item
      const item = await prisma.orderItem.create({
        data: {
          orderId,
          productId: itemData.productId,
          qty: itemData.qty,
          price: itemData.price,
          specialRequest: itemData.specialRequest,
          status: "PENDING",
        },
        include: { product: { select: { name: true } } },
      });

      // Update order total
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          total: {
            increment: itemData.price * itemData.qty,
          },
        },
      });

      logger.info(`Item added to order ${orderId}`);
      return { item, updatedTotal: updatedOrder.total };
    } catch (error) {
      logger.error("Error adding order item:", error);
      throw error;
    }
  }

  /**
   * Remove item from order
   */
  static async removeOrderItem(itemId: string, tenantId: string) {
    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("Order item not found");
      }

      // Get order to verify tenant
      const order = await prisma.order.findFirst({
        where: { id: item.orderId, tenantId },
      });

      if (!order) {
        throw new Error("Order not found for tenant");
      }

      // Remove item
      await prisma.orderItem.delete({
        where: { id: itemId },
      });

      // Update order total
      const itemTotal = item.price * item.qty;
      await prisma.order.update({
        where: { id: item.orderId },
        data: {
          total: {
            decrement: itemTotal,
          },
        },
      });

      logger.info(`Item ${itemId} removed from order`);
      return { success: true };
    } catch (error) {
      logger.error("Error removing order item:", error);
      throw error;
    }
  }

  /**
   * Update order item status
   */
  static async updateOrderItemStatus(
    itemId: string,
    tenantId: string,
    status:
      | "PENDING"
      | "SENT_TO_KITCHEN"
      | "PREPARING"
      | "READY"
      | "SERVED"
      | "CANCELLED"
  ) {
    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("Order item not found");
      }

      // Verify order belongs to tenant
      const order = await prisma.order.findFirst({
        where: { id: item.orderId, tenantId },
      });

      if (!order) {
        throw new Error("Order not found for tenant");
      }

      const updated = await prisma.orderItem.update({
        where: { id: itemId },
        data: { status },
      });

      logger.info(`Order item ${itemId} status updated to ${status}`);
      return updated;
    } catch (error) {
      logger.error("Error updating order item status:", error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(tenantId: string, branchId?: string) {
    try {
      const query: any = { where: { tenantId } };
      if (branchId) query.where.branchId = branchId;

      const orders = await prisma.order.findMany(query);

      const totalOrders = orders.length;
      const completedOrders = orders.filter(
        (o) => o.status === "COMPLETED"
      ).length;
      const cancelledOrders = orders.filter(
        (o) => o.status === "CANCELLED"
      ).length;
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      logger.info(`Order stats generated for tenant ${tenantId}`);

      return {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders: totalOrders - completedOrders - cancelledOrders,
        totalRevenue,
        averageOrderValue,
        completionRate:
          totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      };
    } catch (error) {
      logger.error("Error getting order stats:", error);
      throw error;
    }
  }

  /**
   * Get orders by branch with pagination
   */
  static async getOrdersByBranch(
    tenantId: string,
    branchId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { tenantId, branchId },
          skip,
          take: limit,
          include: {
            items: { select: { productId: true, qty: true, price: true } },
            table: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({
          where: { tenantId, branchId },
        }),
      ]);

      logger.info(`Fetched ${orders.length} orders from branch ${branchId}`);

      return {
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching branch orders:", error);
      throw error;
    }
  }

  /**
   * Get orders by table
   */
  static async getOrdersByTable(tableId: string, tenantId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          tableId,
          tenantId,
          status: { not: "COMPLETED" },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, category: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return orders;
    } catch (error) {
      logger.error("Error fetching table orders:", error);
      throw error;
    }
  }

  /**
   * Void order
   */
  static async voidOrder(orderId: string, tenantId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      logger.info(`Order ${orderId} voided`);
      return updated;
    } catch (error) {
      logger.error("Error voiding order:", error);
      throw error;
    }
  }
}

export default OrderService;
