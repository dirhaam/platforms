import { PrismaClient } from './generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Database configuration
const databaseConfig = {
  connectionLimit: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  maxUses: 7500,
  allowExitOnIdle: true,
};

// Create Prisma client with connection pooling
export const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Database utilities
export class DatabaseUtils {
  static async executeInTransaction<T>(
    callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(callback);
  }

  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details?: string;
  }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        details: `Response time: ${duration}ms`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default prisma;