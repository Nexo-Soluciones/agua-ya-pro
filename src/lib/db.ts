import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

// Store in globalThis in both dev and production to reuse connections across warm serverless lambdas
globalForPrisma.prisma = db;
