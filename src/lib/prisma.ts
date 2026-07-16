import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

function createPrismaClient() {
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Prisma client will be created without a database connection.");
    return new PrismaClient({
      log: [],
    } as any);
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}