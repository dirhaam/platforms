'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Activity,
  Calendar,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import type { EnhancedTenant } from '@/lib/subdomains';

interface PlatformAnalyticsProps {
  tenants: EnhancedTenant[];
}

interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  newTenantsThisMonth: number;
  premiumTenants: number;
  revenueEstimate: number;
  featureAdoption: {
    whatsapp: number;
    homeVisit: number;
    analytics: number;
    customTemplates: number;
    multiStaff: number;
  };
  tenantsByPlan: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  tenantsByStatus: {
    active: number;
    suspended: number;
    cancelled: number;
  };
  growthMetrics: {
    monthlyGrowthRate: number;
    churnRate: number;
    conversionRate: number;
  };
}

interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'tenant_created' | 'tenant_updated' | 'feature_toggled' | 'subscription_changed' | 'tenant_deleted';
  tenantId?: string;
  tenantName?: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export function PlatformAnalytics({ tenants }: PlatformAnalyticsProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const calculateMetrics = (tenantData: EnhancedTenant[]): SystemMetrics => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const activeTenants = tenantData.filter(t => t.subscription.status === 'active');
    const newThisMonth = tenantData.filter(t => new Date(t.createdAt) >= thisMonth);
    const newLastMonth = tenantData.filter(t => {
      const created = new Date(t.createdAt);
      return created >= lastMonth && created < thisMonth;
    });

    const premiumTenants = tenantData.filter(t => 
      t.subscription.plan === 'premium' || t.subscription.plan === 'enterprise'
    );

    // Calculate feature adoption rates
    const featureAdoption = {
      whatsapp: (tenantData.filter(t => t.features.whatsapp).length / tenantData.length) * 100,
      homeVisit: (tenantData.filter(t => t.features.homeVisit).length / tenantData.length) * 100,
      analytics: (tenantData.filter(t => t.features.analytics).length / tenantData.length) * 100,
      customTemplates: (tenantData.filter(t => t.features.customTemplates).length / tenantData.length) * 100,
      multiStaff: (tenantData.filter(t => t.features.multiStaff).length / tenantData.length) * 100,
    };

    // Calculate plan distribution
    const tenantsByPlan = {
      basic: tenantData.filter(t => t.subscription.plan === 'basic').length,
      premium: tenantData.filter(t => t.subscription.plan === 'premium').length,
      enterprise: tenantData.filter(t => t.subscription.plan === 'enterprise').length,
    };

    // Calculate status distribution
    const tenantsByStatus = {
      active: tenantData.filter(t => t.subscription.status === 'active').length,
      suspended: tenantData.filter(t => t.subscription.status === 'suspended').length,
      cancelled: tenantData.filter(t => t.subscription.status === 'cancelled').length,
    };

    // Calculate growth metrics
    const monthlyGrowthRate = newLastMonth.length > 0 
      ? ((newThisMonth.length - newLastMonth.length) / newLastMonth.length) * 100 
      : 0;

    const churnRate = tenantData.length > 0 
      ? (tenantsByStatus.cancelled / tenantData.length) * 100 
      : 0;

    const conversionRate = tenantData.length > 0 
      ? (premiumTenants.length / tenantData.length) * 100 
      : 0;

    // Estimate revenue (basic assumptions)
    const revenueEstimate = 
      (tenantsByPlan.basic * 29) + 
      (tenantsByPlan.premium * 99) + 
      (tenantsByPlan.enterprise * 299);

    return {
      totalTenants: tenantData.length,
      activeTenants: activeTenants.length,
      newTenantsThisMonth: newThisMonth.length,
      premiumTenants: premiumTenants.length,
      revenueEstimate,
      featureAdoption,
      tenantsByPlan,
      tenantsByStatus,
      growthMetrics: {
        monthlyGrowthRate,
        churnRate,
        conversionRate,
      },
    };
  };

  const fetchActivityLog = async (): Promise<ActivityLogEntry[]> => {
    try {
      const response = await fetch('/api/admin/activity?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch activity log');
      }
      const data = await response.json();
      return data.activities || [];
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      
      // Fallback to generating mock data based on tenant data
      const activities: ActivityLogEntry[] = [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      tenants.forEach((tenant) => {
        // Tenant creation activities
        if (new Date(tenant.createdAt) >= sevenDaysAgo) {
          activities.push({
            id: `created_${tenant.id}`,
            timestamp: new Date(tenant.createdAt),
            type: 'tenant_created',
            tenantId: tenant.id,
            tenantName: tenant.businessName,
            details: `New tenant "${tenant.businessName}" registered with ${tenant.subscription.plan} plan`,
            severity: 'success',
          });
        }

        // Recent updates
        if (tenant.updatedAt >= sevenDaysAgo) {
          activities.push({
            id: `updated_${tenant.id}_${tenant.updatedAt.getTime()}`,
            timestamp: tenant.updatedAt,
            type: 'tenant_updated',
            tenantId: tenant.id,
            tenantName: tenant.businessName,
            details: `Tenant "${tenant.businessName}" profile updated`,
            severity: 'info',
          });
        }

        // Subscription warnings for expiring tenants
        if (tenant.subscription.expiresAt && tenant.subscription.expiresAt <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          activities.push({
            id: `expiring_${tenant.id}`,
            timestamp: new Date(),
            type: 'subscription_changed',
            tenantId: tenant.id,
            tenantName: tenant.businessName,
            details: `Subscription for "${tenant.businessName}" expires soon`,
            severity: 'warning',
          });
        }
      });

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    const newMetrics = calculateMetrics(tenants);
    const newActivityLog = await fetchActivityLog();
    
    setMetrics(newMetrics);
    setActivityLog(newActivityLog);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [tenants]);

  const getActivityIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'tenant_created':
        return <Building2 className="h-4 w-4" />;
      case 'tenant_updated':
        return <Activity className="h-4 w-4" />;
      case 'feature_toggled':
        return <Zap className="h-4 w-4" />;
      case 'subscription_changed':
        return <DollarSign className="h-4 w-4" />;
      case 'tenant_deleted':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ActivityLogEntry['severity']) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Platform Analytics</h2>
          <p className="text-gray-600 text-sm">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenueEstimate}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.premiumTenants} premium subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            {metrics.growthMetrics.monthlyGrowthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.growthMetrics.monthlyGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.newTenantsThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.growthMetrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Basic to premium conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.growthMetrics.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.tenantsByStatus.cancelled} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.featureAdoption).map(([feature, rate]) => (
              <div key={feature} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-400" />
                  <span className="capitalize font-medium">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Basic</span>
                <Badge variant="outline">{metrics.tenantsByPlan.basic}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Premium</span>
                <Badge variant="default">{metrics.tenantsByPlan.premium}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Enterprise</span>
                <Badge variant="secondary">{metrics.tenantsByPlan.enterprise}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Active</span>
                </div>
                <Badge variant="default">{metrics.tenantsByStatus.active}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Suspended</span>
                </div>
                <Badge variant="secondary">{metrics.tenantsByStatus.suspended}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Cancelled</span>
                </div>
                <Badge variant="destructive">{metrics.tenantsByStatus.cancelled}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}