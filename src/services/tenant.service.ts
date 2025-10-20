/**
 * tenant.service.ts
 * Creates tenant, default branch and seed admin user. Minimal validations here.
 */

import prisma from "../config/db.config";
import bcrypt from "bcrypt";

class TenantService {
  static async createTenant(data: any) {
    // In production validate data strictly and handle uniqueness, domain mapping, billing init.
    const passwordHash = await bcrypt.hash(data.password || "change-me", 10);
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain,
        branches: {
          create: [{ name: data.branchName || "Main Branch" }],
        },
        users: {
          create: [
            { email: data.email, password: passwordHash, role: "OWNER" },
          ],
        },
      },
      include: { branches: true, users: true },
    });
    return tenant;
  }

  static async getTenant(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: { branches: true },
    });
  }
}

export default TenantService;
