// basic boiler plate of prisma
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // because next js HMR created multiple prisma instance so we cache it globally
    adapter: adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;

// Pooling Nextjs hot reload issue, so use above one
// export const prisma = new PrismaClient({
// adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})
// 1
//
