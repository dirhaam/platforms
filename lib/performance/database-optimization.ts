export interface SlowQueryMetadata {
  tenantId?: string;
  [key: string]: any;
}

/**
 * Lightweight database optimization helpers for the Supabase runtime.
 * Extend these hooks to persist telemetry into Supabase or an external
 * observability pipeline when needed.
 */
export class DatabaseOptimization {
  static async logSlowQuery(
    query: string,
    duration: number,
    metadata: SlowQueryMetadata = {}
  ): Promise<void> {
    console.warn('Slow query detected', {
      query,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}
