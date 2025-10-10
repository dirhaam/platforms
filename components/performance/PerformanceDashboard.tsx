'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Zap, 
  Server, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  summary: {
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
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      percentage: number;
    };
    uptime: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: boolean;
      cache: boolean;
      memory: boolean;
      responseTime: boolean;
    };
  };
  cache: {
    totalKeys: number;
  };
  database: {
    isHealthy: boolean;
    avgResponseTime?: number;
  };
  recommendations: string[];
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(300000); // 5 minutes

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/performance/metrics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }

      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No performance data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value={60000}>Last 1 minute</option>
            <option value={300000}>Last 5 minutes</option>
            <option value={900000}>Last 15 minutes</option>
            <option value={3600000}>Last 1 hour</option>
          </select>
          <Button onClick={fetchMetrics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getHealthStatusIcon(metrics.health.status)}
            <span>System Health</span>
            <Badge 
              variant={metrics.health.status === 'healthy' ? 'default' : 'destructive'}
              className={getHealthStatusColor(metrics.health.status)}
            >
              {metrics.health.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Database</span>
              {metrics.health.checks.database ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Cache</span>
              {metrics.health.checks.cache ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">Memory</span>
              {metrics.health.checks.memory ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Response Time</span>
              {metrics.health.checks.responseTime ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.summary.apiRequests.total}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(metrics.summary.apiRequests.avgResponseTime)}ms
            </p>
            {metrics.summary.apiRequests.slowRequests > 0 && (
              <p className="text-xs text-red-600">
                {metrics.summary.apiRequests.slowRequests} slow requests
              </p>
            )}
          </CardContent>
        </Card>

        {/* Database Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.summary.databaseQueries.total}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(metrics.summary.databaseQueries.avgDuration)}ms
            </p>
            {metrics.summary.databaseQueries.slowQueries > 0 && (
              <p className="text-xs text-red-600">
                {metrics.summary.databaseQueries.slowQueries} slow queries
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.summary.cacheOperations.hitRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cache.totalKeys} keys cached
            </p>
            <Progress 
              value={metrics.summary.cacheOperations.hitRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.system.uptime)}</div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: {formatBytes(metrics.system.memory.used)}</span>
                <span>Total: {formatBytes(metrics.system.memory.total)}</span>
              </div>
              <Progress 
                value={metrics.system.memory.percentage} 
                className={`h-2 ${
                  metrics.system.memory.percentage > 90 ? 'bg-red-200' :
                  metrics.system.memory.percentage > 70 ? 'bg-yellow-200' :
                  'bg-green-200'
                }`}
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(metrics.system.memory.percentage)}% used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5" />
              <span>CPU Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(metrics.system.cpu.percentage)}%
              </div>
              <Progress 
                value={metrics.system.cpu.percentage} 
                className={`h-2 ${
                  metrics.system.cpu.percentage > 80 ? 'bg-red-200' :
                  metrics.system.cpu.percentage > 60 ? 'bg-yellow-200' :
                  'bg-green-200'
                }`}
              />
              <p className="text-xs text-muted-foreground">
                Current CPU utilization
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Recommendations</span>
            </CardTitle>
            <CardDescription>
              Suggestions to improve system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}