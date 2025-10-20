/**
 * kot.service.ts
 * KOT listing and print orchestration.
 */

import prisma from "../config/db.config";
import { getQueue } from "../queues/queue.config";

class KOTService {
  static async listByBranch(branchId: string) {
    return prisma.kOT.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async printKOT(kotId: string, tenantId: string) {
    const q = getQueue("printers");
    await q.add("print-kot", { kotId, tenantId });
  }
}

export default KOTService;
