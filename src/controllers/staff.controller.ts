/**
 * staff.controller.ts
 * Handles staff/employee management endpoints.
 *
 * Manages team members, roles, and permissions.
 */

import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response.util";
import * as StaffService from "../services/staff.service";

/**
 * Get all staff members
 */
export const getAllStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const staff = await StaffService.getAllStaff(tenantId);
    return successResponse(res, staff, "Staff fetched");
  } catch (error) {
    next(error);
  }
};

/**
 * Create new staff member
 */
export const createStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId } = req.params;
    const staff = await StaffService.createStaff(tenantId, req.body);
    return successResponse(res, staff, "Staff created", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { staffId } = req.params;
    const staff = await StaffService.getStaffById(staffId);
    return successResponse(res, staff, "Staff fetched");
  } catch (error) {
    next(error);
  }
};

/**
 * Update staff
 */
export const updateStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { staffId } = req.params;
    const staff = await StaffService.updateStaff(staffId, req.body);
    return successResponse(res, staff, "Staff updated");
  } catch (error) {
    next(error);
  }
};

/**
 * Delete staff
 */
export const deleteStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { staffId } = req.params;
    await StaffService.deleteStaff(staffId);
    return successResponse(res, null, "Staff deleted");
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to staff
 */
export const assignRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { staffId } = req.params;
    const { role } = req.body;
    const staff = await StaffService.assignRole(staffId, role);
    return successResponse(res, staff, "Role assigned");
  } catch (error) {
    next(error);
  }
};
