/**
 * staff.validators.ts
 * Validation schemas for staff management endpoints
 */

const Joi = require("joi");

export const createStaffSchema = Joi.object({
  email: Joi.string().required().email().max(100).messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  name: Joi.string().optional().max(100),
  password: Joi.string().required().min(8).max(100).messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string()
    .required()
    .valid(
      "OWNER",
      "ADMIN",
      "MANAGER",
      "WAITER",
      "KITCHEN",
      "ACCOUNTANT",
      "STAFF"
    )
    .messages({
      "any.only":
        "role must be one of: OWNER, ADMIN, MANAGER, WAITER, KITCHEN, ACCOUNTANT, STAFF",
    }),
  branchId: Joi.string().optional().uuid(),
});

export const updateStaffSchema = Joi.object({
  name: Joi.string().optional().max(100),
  role: Joi.string()
    .optional()
    .valid(
      "OWNER",
      "ADMIN",
      "MANAGER",
      "WAITER",
      "KITCHEN",
      "ACCOUNTANT",
      "STAFF"
    ),
  branchId: Joi.string().optional().uuid(),
  password: Joi.string().optional().min(8).max(100),
});

export const assignRoleSchema = Joi.object({
  role: Joi.string()
    .required()
    .valid(
      "OWNER",
      "ADMIN",
      "MANAGER",
      "WAITER",
      "KITCHEN",
      "ACCOUNTANT",
      "STAFF"
    )
    .messages({
      "any.only":
        "role must be one of: OWNER, ADMIN, MANAGER, WAITER, KITCHEN, ACCOUNTANT, STAFF",
    }),
});

export const tenantIdParamSchema = Joi.object({
  tenantId: Joi.string().uuid().required().messages({
    "string.guid": "tenantId must be a valid UUID",
  }),
});

export const staffIdParamSchema = Joi.object({
  staffId: Joi.string().uuid().required().messages({
    "string.guid": "staffId must be a valid UUID",
  }),
});

export const branchIdParamSchema = Joi.object({
  branchId: Joi.string().uuid().required().messages({
    "string.guid": "branchId must be a valid UUID",
  }),
});

export const staffQuerySchema = Joi.object({
  page: Joi.number().optional().positive(),
  limit: Joi.number().optional().positive().max(100),
});
