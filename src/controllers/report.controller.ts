/**
 * report.controller.ts
 * Handles reporting and export endpoints.
 *
 * Generates reports, exports data, and provides analytics exports.
 */

import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response.util";
import * as ReportService from "../services/report.service";

/**
 * Get sales report
 */
export const getSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate, format = "json" } = req.query;
    const report = await ReportService.getSalesReport(
      tenantId,
      startDate as string,
      endDate as string,
      format as string
    );

    if (format === "pdf" || format === "csv") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-report.${format}"`
      );
      res.setHeader(
        "Content-Type",
        format === "pdf" ? "application/pdf" : "text/csv"
      );
      return res.send(report);
    }

    return successResponse(res, report, "Sales report generated");
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory report
 */
export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { format = "json" } = req.query;
    const report = await ReportService.getInventoryReport(
      tenantId,
      format as string
    );

    if (format === "pdf" || format === "csv") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="inventory-report.${format}"`
      );
      res.setHeader(
        "Content-Type",
        format === "pdf" ? "application/pdf" : "text/csv"
      );
      return res.send(report);
    }

    return successResponse(res, report, "Inventory report generated");
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff performance report
 */
export const getStaffPerformanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    const report = await ReportService.getStaffPerformanceReport(
      tenantId,
      startDate as string,
      endDate as string
    );
    return successResponse(res, report, "Staff performance report generated");
  } catch (error) {
    next(error);
  }
};

/**
 * Export sales data
 */
export const exportSalesData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { format = "csv" } = req.query;
    const data = await ReportService.exportSalesData(
      tenantId,
      format as string
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sales-export.${format}"`
    );
    res.setHeader(
      "Content-Type",
      format === "pdf" ? "application/pdf" : "text/csv"
    );
    return res.send(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get custom report
 */
export const getCustomReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const reportParams = req.body;
    const report = await ReportService.getCustomReport(tenantId, reportParams);
    return successResponse(res, report, "Custom report generated");
  } catch (error) {
    next(error);
  }
};
