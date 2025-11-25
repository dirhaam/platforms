'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  HardDrive,
  Users,
  Calendar,
  Briefcase,
  UserCheck,
  ExternalLink,
  XCircle,
  Loader2,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastChecked: string;
}

interface MonitoringData {
  timestamp: string;
  projectRef: string | null;
  database: {
    connections: number;
    maxConnections: number;
    activeQueries: number;
    cacheHitRatio: number;
    dbSizeMB: number;
  };
  tables: {
    tenants: number;
    bookings: number;
    customers: number;
    services: number;
    staff: number;
  };
  performance: {
    avgResponseTimeMs: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  health: {
    database: string;
    api: string;
    storage: string;
    realtime: string;
  };
  services: ServiceStatus[];
  rawPrometheus: Record<string, number> | null;
}

export function SystemMonitoring() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/monitoring');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      toast.error('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchMetrics, autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(2)} GB`;
    return `${mb} MB`;
  };

  const formatPercentage = (ratio: number) => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchMetrics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const overallHealth = data?.services.every(s => s.status === 'online') ? 'healthy' : 
    data?.services.some(s => s.status === 'offline') ? 'critical' : 'degraded';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
            {data?.projectRef && (
              <span className="ml-2">
                | Project: <code className="bg-gray-100 px-1 rounded">{data.projectRef}</code>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://supabase.com/dashboard/project/_/reports"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Supabase Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card className={`border-l-4 ${
        overallHealth === 'healthy' ? 'border-l-green-500' :
        overallHealth === 'degraded' ? 'border-l-yellow-500' : 'border-l-red-500'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallHealth)}
              <div>
                <h2 className="text-xl font-semibold">
                  System Status: {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
                </h2>
                <p className="text-sm text-gray-500">
                  {data?.services.filter(s => s.status === 'online').length} of {data?.services.length} services online
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(overallHealth)}>
              {overallHealth.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Database Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.database.connections || 0}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((data?.database.connections || 0) / (data?.database.maxConnections || 100)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {data?.database.maxConnections || 100}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(data?.database.cacheHitRatio || 0)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(data?.database.cacheHitRatio || 0) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: &gt;95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(data?.database.dbSizeMB || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Active queries: {data?.database.activeQueries || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.performance.avgResponseTimeMs || 0}ms
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Error rate: {data?.performance.errorRate?.toFixed(2) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Overview
          </CardTitle>
          <CardDescription>
            Total records across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{data?.tables.tenants || 0}</p>
              <p className="text-xs text-blue-600">Tenants</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{data?.tables.bookings || 0}</p>
              <p className="text-xs text-green-600">Bookings</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{data?.tables.customers || 0}</p>
              <p className="text-xs text-purple-600">Customers</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-900">{data?.tables.services || 0}</p>
              <p className="text-xs text-orange-600">Services</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <Users className="h-6 w-6 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-900">{data?.tables.staff || 0}</p>
              <p className="text-xs text-pink-600">Staff</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Service Health
          </CardTitle>
          <CardDescription>
            Real-time status of Supabase services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data?.services.map((service) => (
              <div
                key={service.name}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  service.status === 'online' ? 'bg-green-50 border-green-200' :
                  service.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      {service.responseTime}ms
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.health && Object.entries(data.health).map(([key, status]) => (
              <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(status)}
                <div>
                  <p className="font-medium capitalize">{key}</p>
                  <p className="text-xs text-gray-500 capitalize">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Prometheus Metrics (if available) */}
      {data?.rawPrometheus && Object.keys(data.rawPrometheus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Raw Prometheus Metrics
            </CardTitle>
            <CardDescription>
              Direct metrics from Supabase endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
              {Object.entries(data.rawPrometheus).slice(0, 20).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-gray-800">
                  <span>{key}</span>
                  <span className="text-yellow-400">{value}</span>
                </div>
              ))}
              {Object.keys(data.rawPrometheus).length > 20 && (
                <p className="text-gray-500 mt-2">
                  ... and {Object.keys(data.rawPrometheus).length - 20} more metrics
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About System Monitoring</p>
              <p>
                Metrics are fetched from Supabase's Prometheus-compatible endpoint.
                For detailed reports and analytics, visit the{' '}
                <a
                  href="https://supabase.com/dashboard/project/_/reports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Supabase Dashboard
                </a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
