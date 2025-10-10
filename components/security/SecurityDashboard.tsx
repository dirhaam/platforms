'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  Monitor
} from 'lucide-react';

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  suspiciousActivities: number;
  topActions: Array<{ action: string; count: number }>;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: any;
  timestamp: string;
}

interface SecurityDashboardProps {
  tenantId: string;
}

export default function SecurityDashboard({ tenantId }: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsResponse, logsResponse] = await Promise.all([
        fetch(`/api/security/metrics?days=${selectedDays}`),
        fetch(`/api/security/audit-logs?limit=20&days=${selectedDays}`)
      ]);

      if (!metricsResponse.ok || !logsResponse.ok) {
        throw new Error('Failed to fetch security data');
      }

      const metricsData = await metricsResponse.json();
      const logsData = await logsResponse.json();

      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      if (logsData.success) {
        setAuditLogs(logsData.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setError('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDays]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <Users className="h-4 w-4" />;
      case 'logout':
        return <Activity className="h-4 w-4" />;
      case 'change_password':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    
    switch (action) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'change_password':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={fetchData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.uniqueUsers} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalLogins > 0 
                  ? `${((metrics.failedLogins / metrics.totalLogins) * 100).toFixed(1)}% failure rate`
                  : 'No login attempts'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
              <Shield className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{metrics.suspiciousActivities}</div>
              <p className="text-xs text-muted-foreground">
                Security events flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Unique active users
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Actions */}
      {metrics && metrics.topActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Security Actions</CardTitle>
            <CardDescription>Most frequent security-related activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(action.action)}
                    <span className="capitalize">{action.action.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{action.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security-related activities</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No security events found</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getActionColor(log.action, log.success)}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                      {!log.success && (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{log.ipAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Monitor className="h-3 w-3" />
                          <span>{formatUserAgent(log.userAgent)}</span>
                        </div>
                      </div>
                      {log.details && (
                        <div className="text-xs bg-gray-50 p-2 rounded">
                          {typeof log.details === 'object' 
                            ? JSON.stringify(log.details, null, 2)
                            : log.details
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}