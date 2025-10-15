import { CacheService } from '@/lib/cache/cache-service';
import { DatabaseOptimization } from './database-optimization';
import { db } from '@/lib/database/server';
import { tenants } from '@/lib/database/schema';

// Performance monitoring configuration
export const PERFORMANCE_CONFIG = {
  THRESHOLDS: {
    SLOW_QUERY: 1000, // 1 second
    SLOW_API: 2000, // 2 seconds
    HIGH_MEMORY: 500 * 1024 * 1024, // 500MB
    HIGH_CPU: 80, // 80%
  },
  METRICS_RETENTION: {
    REAL_TIME: 5 * 60, // 5 minutes
    HOURLY: 24 * 60 * 60, // 24 hours
    DAILY: 30 * 24 * 60 * 60, // 30 days
  },
  SAMPLING: {
    API_REQUESTS: 0.1, // Sample 10% of API requests
    DATABASE_QUERIES: 0.05, // Sample 5% of database queries
  },
} as const;

export interface PerformanceMetric {
  timestamp: number;
  type: 'api' | 'database' | 'cache' | 'system';
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    percentage: number;
  };
  uptime: number;
  timestamp: number;
}

export interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  tenantId?: string;
}

export interface DatabaseMetrics {
  query: string;
  duration: number;
  rowsAffected?: number;
  timestamp: number;
  tenantId?: string;
}

export interface CacheMetrics {
  operation: 'get' | 'set' | 'delete' | 'hit' | 'miss';
  key: string;
  duration?: number;
  size?: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true';

  // Record a performance metric
  static recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    // Add to in-memory store
    this.metrics.push(metric);

    // Keep only recent metrics in memory
    const cutoff = Date.now() - PERFORMANCE_CONFIG.METRICS_RETENTION.REAL_TIME * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

    // Log slow operations
    if (metric.type === 'api' && metric.value > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_API) {
      console.warn('Slow API detected:', {
        name: metric.name,
        duration: `${metric.value}ms`,
        tags: metric.tags,
      });
    }

    if (metric.type === 'database' && metric.value > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY) {
      console.warn('Slow query detected:', {
        name: metric.name,
        duration: `${metric.value}ms`,
        metadata: metric.metadata,
      });
    }
  }

  // API request monitoring
  static startApiTimer(endpoint: string, method: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      // Sample requests to avoid overwhelming metrics
      if (Math.random() < PERFORMANCE_CONFIG.SAMPLING.API_REQUESTS) {
        this.recordMetric({
          timestamp: Date.now(),
          type: 'api',
          name: `${method} ${endpoint}`,
          value: duration,
          unit: 'ms',
          tags: {
            endpoint,
            method,
          },
        });
      }
    };
  }

  // Database query monitoring
  static async monitorDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    tenantId?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Sample queries to avoid overwhelming metrics
      if (Math.random() < PERFORMANCE_CONFIG.SAMPLING.DATABASE_QUERIES) {
        this.recordMetric({
          timestamp: Date.now(),
          type: 'database',
          name: queryName,
          value: duration,
          unit: 'ms',
          tags: {
            tenantId: tenantId || 'unknown',
          },
        });
      }

      // Log slow queries
      if (duration > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY) {
        await DatabaseOptimization.logSlowQuery(queryName, duration, { tenantId });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        timestamp: Date.now(),
        type: 'database',
        name: queryName,
        value: duration,
        unit: 'ms',
        tags: {
          tenantId: tenantId || 'unknown',
          error: 'true',
        },
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  // Cache operation monitoring
  static recordCacheOperation(
    operation: CacheMetrics['operation'],
    key: string,
    duration?: number,
    size?: number
  ): void {
    this.recordMetric({
      timestamp: Date.now(),
      type: 'cache',
      name: `cache_${operation}`,
      value: duration || 0,
      unit: 'ms',
      tags: {
        operation,
        key_pattern: this.extractKeyPattern(key),
      },
      metadata: {
        key,
        size,
      },
    });
  }

  // Extract pattern from cache key for grouping
  private static extractKeyPattern(key: string): string {
    // Replace IDs with placeholders for grouping
    return key
      .replace(/:[a-f0-9-]{36}/g, ':id') // UUIDs
      .replace(/:[a-f0-9]{24}/g, ':id') // MongoDB ObjectIds
      .replace(/:\d+/g, ':id') // Numeric IDs
      .replace(/:\d{4}-\d{2}-\d{2}/g, ':date'); // Dates
  }

  // System metrics collection
  static async collectSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        percentage: process.cpuUsage().user / 1000000, // Convert to percentage (approximate)
      },
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  // Get performance summary
  static getPerformanceSummary(timeRange: number = 5 * 60 * 1000): {
    apiRequests: {
      total: number;
      avgResponseTime: number;
      slowRequests: number;
    };
    databaseQueries: {
      total: number;
      avgDuration: number;
      slowQueries: number;
    };
    cacheOperations: {
      total: number;
      hitRate: number;
    };
  } {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // API metrics
    const apiMetrics = recentMetrics.filter(m => m.type === 'api');
    const apiRequests = {
      total: apiMetrics.length,
      avgResponseTime: apiMetrics.length > 0 
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
        : 0,
      slowRequests: apiMetrics.filter(m => m.value > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_API).length,
    };

    // Database metrics
    const dbMetrics = recentMetrics.filter(m => m.type === 'database');
    const databaseQueries = {
      total: dbMetrics.length,
      avgDuration: dbMetrics.length > 0 
        ? dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length 
        : 0,
      slowQueries: dbMetrics.filter(m => m.value > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY).length,
    };

    // Cache metrics
    const cacheMetrics = recentMetrics.filter(m => m.type === 'cache');
    const cacheHits = cacheMetrics.filter(m => m.name === 'cache_hit').length;
    const cacheMisses = cacheMetrics.filter(m => m.name === 'cache_miss').length;
    const cacheOperations = {
      total: cacheMetrics.length,
      hitRate: (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0,
    };

    return {
      apiRequests,
      databaseQueries,
      cacheOperations,
    };
  }

  // Health check
  static async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: boolean;
      cache: boolean;
      memory: boolean;
      responseTime: boolean;
    };
    metrics: SystemMetrics;
  }> {
    const checks = {
      database: false,
      cache: false,
      memory: false,
      responseTime: false,
    };

    try {
      // Database health check
      const dbHealth = await this.checkDatabaseHealth();
      checks.database = dbHealth.isHealthy;
      checks.responseTime = (dbHealth.avgResponseTime || 0) < PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY;

      // Cache health check
      checks.cache = await CacheService.healthCheck();

      // Memory check
      const systemMetrics = await this.collectSystemMetrics();
      checks.memory = systemMetrics.memory.percentage < 90; // Less than 90% memory usage

      // Determine overall status
      const healthyChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyChecks === totalChecks) {
        status = 'healthy';
      } else if (healthyChecks >= totalChecks * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        checks,
        metrics: systemMetrics,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        checks,
        metrics: await this.collectSystemMetrics(),
      };
    }
  }

  // Performance recommendations
  static getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.getPerformanceSummary();

    if (summary.apiRequests.avgResponseTime > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_API) {
      recommendations.push('API response times are slow. Consider optimizing database queries or adding caching.');
    }

    if (summary.databaseQueries.avgDuration > PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY) {
      recommendations.push('Database queries are slow. Review query performance and consider adding indexes.');
    }

    if (summary.cacheOperations.hitRate < 70) {
      recommendations.push('Cache hit rate is low. Review caching strategy and TTL settings.');
    }

    if (summary.apiRequests.slowRequests > summary.apiRequests.total * 0.1) {
      recommendations.push('High number of slow API requests. Consider implementing request throttling or optimization.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Keep monitoring for any changes.');
    }

    return recommendations;
  }

  // Export metrics for external monitoring systems
  static exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusMetrics();
    }

    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
    }, null, 2);
  }

  private static async checkDatabaseHealth(): Promise<{ isHealthy: boolean; avgResponseTime?: number }> {
    try {
      const start = Date.now();
      await db.select().from(tenants).limit(1);
      const responseTime = Date.now() - start;
      return {
        isHealthy: responseTime < PERFORMANCE_CONFIG.THRESHOLDS.SLOW_QUERY,
        avgResponseTime: responseTime,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        isHealthy: false,
      };
    }
  }

  private static exportPrometheusMetrics(): string {
    const summary = this.getPerformanceSummary();
    
    return `
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${summary.apiRequests.total}

# HELP api_response_time_avg Average API response time in milliseconds
# TYPE api_response_time_avg gauge
api_response_time_avg ${summary.apiRequests.avgResponseTime}

# HELP database_queries_total Total number of database queries
# TYPE database_queries_total counter
database_queries_total ${summary.databaseQueries.total}

# HELP database_query_duration_avg Average database query duration in milliseconds
# TYPE database_query_duration_avg gauge
database_query_duration_avg ${summary.databaseQueries.avgDuration}

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate ${summary.cacheOperations.hitRate}
    `.trim();
  }

  // Clear old metrics
  static clearOldMetrics(): void {
    const cutoff = Date.now() - PERFORMANCE_CONFIG.METRICS_RETENTION.REAL_TIME * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  // Enable/disable monitoring
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  static isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}