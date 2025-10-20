/**
 * menu.controller.ts
 * Handles menu management endpoints.
 *
 * Manages menu items, categories, pricing, and item details.
 */

import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response.util";
import * as MenuService from "../services/menu.service";

/**
 * Get all menu items
 */
export const getAllMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const { category } = req.query;
    const items = await MenuService.getAllMenuItems(
      tenantId,
      category as string | undefined
    );
    return successResponse(res, items, "Menu items fetched");
  } catch (error) {
    next(error);
  }
};

/**
 * Create menu item
 */
export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const item = await MenuService.createMenuItem(tenantId, req.body);
    return successResponse(res, item, "Menu item created", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu item by ID
 */
export const getMenuItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const item = await MenuService.getMenuItemById(itemId);
    return successResponse(res, item, "Menu item fetched");
  } catch (error) {
    next(error);
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const item = await MenuService.updateMenuItem(itemId, req.body);
    return successResponse(res, item, "Menu item updated");
  } catch (error) {
    next(error);
  }
};

/**
 * Delete menu item
 */
export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    await MenuService.deleteMenuItem(itemId);
    return successResponse(res, null, "Menu item deleted");
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu categories
 */
export const getMenuCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const categories = await MenuService.getMenuCategories(tenantId);
    return successResponse(res, categories, "Menu categories fetched");
  } catch (error) {
    next(error);
  }
};
