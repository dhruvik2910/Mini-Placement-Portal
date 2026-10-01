import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Probes the database to verify active connectivity
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number }> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return { connected: true, latencyMs };
  } catch {
    return { connected: false };
  }
}
