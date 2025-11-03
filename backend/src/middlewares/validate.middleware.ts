/**
 * validate.middleware.ts
 * Request validation middleware.
 *
 * Can be used with validation schemas for request body/params validation.
 */

import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Validates request against a schema
 * Usage: app.post('/route', validateRequest(schema), controller);
 */
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((detail: any) => detail.message);
        logger.warn("Validation error:", messages);
        return res.status(400).json({
          error: "Validation failed",
          details: messages,
        });
      }

      req.body = value;
      next();
    } catch (err) {
      logger.error("Validation middleware error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Validates URL parameters against a schema
 */
export function validateParams(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((detail: any) => detail.message);
        return res.status(400).json({
          error: "Validation failed",
          details: messages,
        });
      }

      req.params = value;
      next();
    } catch (err) {
      logger.error("Params validation error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Validates query parameters against a schema
 */
export function validateQuery(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((detail: any) => detail.message);
        return res.status(400).json({
          error: "Validation failed",
          details: messages,
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error("Query validation error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
