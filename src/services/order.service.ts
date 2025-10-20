
/**
 * order.service.ts
 * Creates order, order items, writes KOT and enqueues print job.
 * This service is the core POS integration point.
 */

import prisma from '../config/db.config';
import { Queue } from 'bullmq';
import { getQueue } from '../queues/queue.config';

class OrderService {
  static async createOrder(data: any) {
    // data: { branchId, tableId?, items: [{ productId, qty, price }], tenantId, userId }
    const { items, tenantId, branchId, userId, tableId } = data;
    // calculate total
    const total = items.reduce((s:any,i:any)=> s + (i.price * i.qty), 0);
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        tableId,
        userId,
        total,
        items: { create: items.map((it:any)=> ({ productId: it.productId, qty: it.qty, price: it.price })) }
      },
      include: { items: true }
    });

    // create KOT
    const kot = await prisma.kOT.create({
      data: { orderId: order.id, branchId, payload: { items } }
    });

    // enqueue print job to printers queue
    const q = getQueue('printers');
    await q.add('print-kot', { kotId: kot.id, tenantId });

    return { order, kot };
  }

  static async getOrder(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true }});
  }
}

export default OrderService;
