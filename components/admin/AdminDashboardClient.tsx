'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus,
  Activity,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogIn,
  LogOut,
  Clock,
  Globe,
  Settings,
  BarChart3,
  Database,
  Eye,
  Loader2,
  Crown,
  Zap,
  Building
} from 'lucide-react';
import Link from 'next/link';

interface SecurityLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  resource: string | null;
  details: any;
  createdAt: string;
}

interface DashboardData {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    byPlan: {
      basic: number;
      premium: number;
      enterprise: number;
    };
  };
  securityLogs: SecurityLog[];
}

interface AdminDashboardClientProps {
  session: {
    name: string;
    email: string;
    role: string;
  };
  initialData: DashboardData;
}

export function AdminDashboardClient({ session, initialData }: AdminDashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData({
          tenants: result.tenants,
          securityLogs: result.security.recentLogs,
        });
        setSystemHealth(result.systemHealth.database === 'healthy' ? 'healthy' : 'degraded');
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string, success: boolean) => {
    if (!success) return <XCircle className="w-4 h-4 text-red-500" />;
    switch (action) {
      case 'login':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      password_change: 'Password Changed',
      password_reset: 'Password Reset',
    };
    return labels[action] || action;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const failedLogins = data.securityLogs.filter(log => log.action === 'login' && !log.success);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.name}
          </h1>
          <p className="text-gray-500">Platform Administration Dashboard</p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Banner */}
      <Card className={`border-l-4 ${
        systemHealth === 'healthy' ? 'border-l-green-500 bg-green-50' :
        systemHealth === 'degraded' ? 'border-l-yellow-500 bg-yellow-50' :
        'border-l-red-500 bg-red-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {systemHealth === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : systemHealth === 'degraded' ? (
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  System Status: {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  All services are running normally
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/monitoring">
                <Activity className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Tenants */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/tenants'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-xs">All</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.tenants.total}</p>
            <p className="text-xs text-gray-500">Total Tenants</p>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
            </div>
            <p className="text-2xl font-bold text-green-600">{data.tenants.active}</p>
            <p className="text-xs text-gray-500">Active Tenants</p>
          </CardContent>
        </Card>

        {/* Suspended */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <Badge className="bg-red-100 text-red-700 text-xs">Suspended</Badge>
            </div>
            <p className="text-2xl font-bold text-red-600">{data.tenants.suspended}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </CardContent>
        </Card>

        {/* Basic Plan */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building className="w-5 h-5 text-gray-600" />
              <Badge variant="outline" className="text-xs">Basic</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-600">{data.tenants.byPlan.basic}</p>
            <p className="text-xs text-gray-500">Basic Plan</p>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700 text-xs">Premium</Badge>
            </div>
            <p className="text-2xl font-bold text-purple-600">{data.tenants.byPlan.premium}</p>
            <p className="text-xs text-gray-500">Premium Plan</p>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-5 h-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-xs">Enterprise</Badge>
            </div>
            <p className="text-2xl font-bold text-amber-600">{data.tenants.byPlan.enterprise}</p>
            <p className="text-xs text-gray-500">Enterprise Plan</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="default">
              <Link href="/admin/tenants/create">
                <Plus className="w-4 h-4 mr-2" />
                Create New Tenant
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/tenants">
                <Building2 className="w-4 h-4 mr-2" />
                Manage Tenants
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/monitoring">
                <Activity className="w-4 h-4 mr-2" />
                System Monitoring
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/superadmins">
                <Shield className="w-4 h-4 mr-2" />
                Manage Admins
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Platform Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Security & Login Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Login Activity
                </CardTitle>
                <CardDescription>Recent authentication events</CardDescription>
              </div>
              {failedLogins.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {failedLogins.length} Failed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.securityLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No security logs found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      !log.success ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {getActionIcon(log.action, log.success)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {getActionLabel(log.action)}
                        </span>
                        <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                        {log.resource && (
                          <Badge variant="outline" className="text-xs">
                            {log.resource}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {log.tenantId !== 'platform' && log.tenantId !== 'unknown' 
                          ? `Tenant: ${log.tenantId.slice(0, 8)}...` 
                          : 'Platform'}
                        {log.ipAddress && ` • IP: ${log.ipAddress}`}
                      </p>
                      {log.details && typeof log.details === 'object' && log.details.email && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Email: {log.details.email}
                        </p>
                      )}
                      {!log.success && log.details?.reason && (
                        <p className="text-xs text-red-600 mt-0.5">
                          Reason: {log.details.reason}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-auto py-4 flex-col">
          <Link href="/admin/analytics">
            <BarChart3 className="w-6 h-6 mb-2" />
            <span className="text-sm">Analytics</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col">
          <Link href="/admin/logs">
            <Database className="w-6 h-6 mb-2" />
            <span className="text-sm">Logs</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col">
          <Link href="/admin/security">
            <Shield className="w-6 h-6 mb-2" />
            <span className="text-sm">Security</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col">
          <Link href="/admin/whatsapp">
            <Globe className="w-6 h-6 mb-2" />
            <span className="text-sm">WhatsApp</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
