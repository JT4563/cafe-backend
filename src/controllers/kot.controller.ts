
/**
 * kot.controller.ts
 * Kitchen Order Ticket (KOT) endpoints - list and manual print trigger.
 */

import { Request, Response, NextFunction } from 'express';
import KOTService from '../services/kot.service';

class KOTController {
  static async listByBranch(req: Request & any, res: Response, next: NextFunction) {
    try {
      const list = await KOTService.listByBranch(req.params.branchId);
      res.json(list);
    } catch (err) { next(err); }
  }

  static async printKOT(req: Request & any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await KOTService.printKOT(id, req.user?.tenantId);
      res.json({ ok: true });
    } catch (err) { next(err); }
  }
}

export default KOTController;
