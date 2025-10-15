// Simple database module that works with both client and server environments
// Using only Supabase client to avoid Node.js module issues in Next.js

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for client-side and server-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For health checks and simple operations using Supabase client directly
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Test connection by making a simple query to Supabase
    const { error } = await supabase.from('tenant_subdomains').select('subdomain').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

export class DatabaseUtils {
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details?: string;
  }> {
    try {
      const start = Date.now();
      const { error } = await supabase.from('tenant_subdomains').select('subdomain').limit(1);
      const duration = Date.now() - start;

      if (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          details: error.message,
        };
      }

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