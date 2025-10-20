/**
 * inventory.controller.ts
 * Handles inventory management endpoints.
 *
 * Manages stock, ingredients, and inventory tracking.
 */

import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response.util";
import * as InventoryService from "../services/inventory.service";

/**
 * Get all inventory items
 */
export const getInventoryItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const items = await InventoryService.getInventoryItems(tenantId);
    return successResponse(res, items, "Inventory items fetched");
  } catch (error) {
    next(error);
  }
};

/**
 * Create inventory item
 */
export const createInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const item = await InventoryService.createInventoryItem(tenantId, req.body);
    return successResponse(res, item, "Inventory item created", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory item
 */
export const updateInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const item = await InventoryService.updateInventoryItem(itemId, req.body);
    return successResponse(res, item, "Inventory item updated");
  } catch (error) {
    next(error);
  }
};

/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    await InventoryService.deleteInventoryItem(itemId);
    return successResponse(res, null, "Inventory item deleted");
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock items
 */
export const getLowStockItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const items = await InventoryService.getLowStockItems(tenantId);
    return successResponse(res, items, "Low stock items fetched");
  } catch (error) {
    next(error);
  }
};
