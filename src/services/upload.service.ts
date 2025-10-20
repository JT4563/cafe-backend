/**
 * upload.service.ts
 * Stores a BulkImportJob record and enqueues a background job.
 */

import prisma from "../config/db.config";
import { getQueue } from "../queues/queue.config";

class UploadService {
  static async enqueueBulkImport({ filePath, filename, tenantId }: any) {
    const job = await prisma.bulkImportJob.create({
      data: { tenantId, filename, status: "PENDING" },
    });
    const q = getQueue("bulkImport");
    await q.add("process-file", {
      jobId: job.id,
      filePath,
      filename,
      tenantId,
    });
    return job;
  }
}

export default UploadService;
