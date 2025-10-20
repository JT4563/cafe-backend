
/**
 * jwt.util.ts
 * Small helpers to sign and verify tokens.
 */

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

export function sign(payload: any, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verify(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
