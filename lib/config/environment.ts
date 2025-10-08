// Enhanced environment configuration building on existing lib/utils.ts

// Re-export existing configuration
export const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

// Database configuration
export const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Redis configuration (existing)
export const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
export const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Application configuration
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Booqing Platform',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
  rootDomain,
  protocol,
} as const;

// WhatsApp configuration
export const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL || '',
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
} as const;

// Storage configuration
export const storageConfig = {
  provider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3' | 'cloudinary',
  bucket: process.env.STORAGE_BUCKET || '',
  region: process.env.STORAGE_REGION || '',
} as const;

// Database configuration
export const databaseConfig = {
  url: databaseUrl,
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
  ssl: process.env.NODE_ENV === 'production',
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000'),
  idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
} as const;

// Validation function
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (!redisUrl || !redisToken) {
    errors.push('Redis configuration (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Environment interface for type safety
export interface EnvironmentConfig {
  app: typeof appConfig;
  database: typeof databaseConfig;
  redis: {
    url: string;
    token: string;
  };
  whatsapp: typeof whatsappConfig;
  storage: typeof storageConfig;
}

export const environment: EnvironmentConfig = {
  app: appConfig,
  database: databaseConfig,
  redis: {
    url: redisUrl || '',
    token: redisToken || '',
  },
  whatsapp: whatsappConfig,
  storage: storageConfig,
};