'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, BarChart3, Users, Activity, Monitor, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { rootDomain, protocol } from '@/lib/utils';
import type { EnhancedTenant } from '@/lib/subdomains';
import { TenantManagement } from '@/components/admin/TenantManagement';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';

type Tenant = EnhancedTenant;

function DashboardHeader() {
  // TODO: You can add authentication here with your preferred auth provider

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage tenants, features, and platform analytics</p>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>
    </div>
  );
}

function PlatformStats({ tenants }: { tenants: Tenant[] }) {
  const activeTenantsCount = tenants.filter(t => t.subscription.status === 'active').length;
  const premiumTenantsCount = tenants.filter(t => t.subscription.plan === 'premium' || t.subscription.plan === 'enterprise').length;
  const whatsappEnabledCount = tenants.filter(t => t.features.whatsapp).length;
  
  const stats = [
    {
      title: 'Total Tenants',
      value: tenants.length,
      icon: <Building2 className="h-5 w-5" />,
      description: `${activeTenantsCount} active`,
    },
    {
      title: 'Premium Tenants',
      value: premiumTenantsCount,
      icon: <BarChart3 className="h-5 w-5" />,
      description: `${Math.round((premiumTenantsCount / tenants.length) * 100) || 0}% of total`,
    },
    {
      title: 'WhatsApp Enabled',
      value: whatsappEnabledCount,
      icon: <Users className="h-5 w-5" />,
      description: `${Math.round((whatsappEnabledCount / tenants.length) * 100) || 0}% adoption`,
    },
    {
      title: 'Recent Activity',
      value: tenants.filter(t => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(t.updatedAt) > weekAgo;
      }).length,
      icon: <Activity className="h-5 w-5" />,
      description: 'Last 7 days',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="text-gray-500">{stat.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminDashboard({ tenants }: { tenants: Tenant[] }) {
  const [activeTab, setActiveTab] = useState<'tenants' | 'analytics' | 'monitoring'>('tenants');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFeatureToggle = async (tenantId: string, feature: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          updates: {
            [`${feature}Enabled`]: enabled,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature');
      }

      setNotification({
        type: 'success',
        message: `${feature} feature ${enabled ? 'enabled' : 'disabled'} successfully`,
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update feature. Please try again.',
      });
    }
  };

  const handleTenantDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete tenant');
      }

      setNotification({
        type: 'success',
        message: 'Tenant deleted successfully',
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete tenant. Please try again.',
      });
    }
  };

  const handleTenantEdit = async (tenantId: string, data: Partial<EnhancedTenant>) => {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          updates: data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant');
      }

      setNotification({
        type: 'success',
        message: 'Tenant updated successfully',
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update tenant. Please try again.',
      });
    }
  };

  // Clear notification after 5 seconds
  if (notification) {
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader />
      <PlatformStats tenants={tenants} />
      
      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tenants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tenant Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Platform Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monitoring'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              System Monitoring
            </div>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Tenant Management</h2>
              <Button asChild>
                <Link href={`${protocol}://${rootDomain}`}>
                  View Main Website
                </Link>
              </Button>
            </div>
            
            <TenantManagement
              tenants={tenants}
              onFeatureToggle={handleFeatureToggle}
              onTenantDelete={handleTenantDelete}
              onTenantEdit={handleTenantEdit}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <PlatformAnalytics tenants={tenants} />
        )}

        {activeTab === 'monitoring' && (
          <SystemMonitoring />
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded shadow-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
