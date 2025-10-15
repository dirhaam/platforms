'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastChecked: Date;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  endpoint?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export function SystemMonitoring() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    lastChecked: new Date(),
  });
  
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Main Website',
      status: 'online',
      responseTime: 120,
      lastChecked: new Date(),
      endpoint: '/',
    },
    {
      name: 'Admin Dashboard',
      status: 'online',
      responseTime: 95,
      lastChecked: new Date(),
      endpoint: '/admin',
    },
    {
      name: 'Supabase Cache',
      status: 'online',
      responseTime: 15,
      lastChecked: new Date(),
    },
    {
      name: 'PostgreSQL Database',
      status: 'online',
      responseTime: 45,
      lastChecked: new Date(),
    },
    {
      name: 'WhatsApp API',
      status: 'degraded',
      responseTime: 350,
      lastChecked: new Date(),
    },
  ]);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, cores: 4 },
    memory: { used: 2.1, total: 8, percentage: 26 },
    storage: { used: 15.7, total: 50, percentage: 31 },
    network: { inbound: 1.2, outbound: 0.8 },
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'WhatsApp API Slow Response',
      message: 'WhatsApp API response time is above normal threshold (350ms)',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolved: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'New Tenant Registration',
      message: 'High volume of new tenant registrations detected',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolved: true,
    },
    {
      id: '3',
      type: 'error',
      title: 'Database Connection Pool',
      message: 'Database connection pool reached 90% capacity',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      resolved: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const refreshSystemStatus = async () => {
    setIsLoading(true);
    
    // Simulate API calls to check system status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update system health
    setSystemHealth({
      status: 'healthy',
      uptime: Math.floor(Math.random() * 30) + 1, // 1-30 days
      lastChecked: new Date(),
    });

    // Update service statuses with some randomization
    setServices(prev => prev.map(service => ({
      ...service,
      responseTime: Math.floor(Math.random() * 200) + 50,
      lastChecked: new Date(),
      status: Math.random() > 0.1 ? 'online' : 'degraded' as 'online' | 'degraded',
    })));

    // Update system metrics
    setSystemMetrics({
      cpu: { 
        usage: Math.floor(Math.random() * 40) + 20, 
        cores: 4 
      },
      memory: { 
        used: Math.round((Math.random() * 3 + 1) * 10) / 10, 
        total: 8, 
        percentage: Math.floor(Math.random() * 30) + 15 
      },
      storage: { 
        used: Math.round((Math.random() * 10 + 10) * 10) / 10, 
        total: 50, 
        percentage: Math.floor(Math.random() * 20) + 20 
      },
      network: { 
        inbound: Math.round((Math.random() * 2) * 10) / 10, 
        outbound: Math.round((Math.random() * 1.5) * 10) / 10 
      },
    });

    setIsLoading(false);
  };

  useEffect(() => {
    // Initial load
    refreshSystemStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertBadgeVariant = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
        return 'outline' as const;
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">System Monitoring</h2>
          <p className="text-gray-600 text-sm">
            Real-time system health and performance metrics
          </p>
        </div>
        <Button 
          onClick={refreshSystemStatus} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium">System Status: Healthy</p>
                <p className="text-sm text-gray-600">
                  Uptime: {systemHealth.uptime} days
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Last checked:</p>
              <p className="text-sm font-medium">
                {systemHealth.lastChecked.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.cpu.usage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${systemMetrics.cpu.usage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.cpu.cores} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.memory.percentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${systemMetrics.memory.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.memory.used}GB / {systemMetrics.memory.total}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.storage.percentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${systemMetrics.storage.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.storage.used}GB / {systemMetrics.storage.total}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>In:</span>
                <span className="font-medium">{systemMetrics.network.inbound} MB/s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Out:</span>
                <span className="font-medium">{systemMetrics.network.outbound} MB/s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-600">
                      Response time: {service.responseTime}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={service.status === 'online' ? 'default' : 'secondary'}
                    className={getStatusColor(service.status)}
                  >
                    {service.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {service.lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No system alerts</p>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{alert.title}</p>
                      <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                        {alert.type}
                      </Badge>
                      {alert.resolved && (
                        <Badge variant="outline" className="text-xs">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}