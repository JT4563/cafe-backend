/**
 * auth.service.ts
 * Handles user authentication using Prisma client.
 * NOTE: password hashing and token signing must be secured in env vars.
 */

import prisma from "../config/db.config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "please-change-me";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "please-change-refresh";

class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  static async refreshToken(token: string) {
    try {
      const payload: any = jwt.verify(token, REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) throw new Error("Invalid refresh token");
      const accessToken = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      return { accessToken };
    } catch (err) {
      throw new Error("Invalid refresh token");
    }
  }
}

export default AuthService;
