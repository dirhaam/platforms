export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionManagementForm } from '@/components/admin/SubscriptionManagementForm';

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  const { id: tenantId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get tenant details
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    redirect('/admin/tenants');
  }

  // Get activity logs for subscription changes
  const { data: activityLogs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('action', ['subscription_changed', 'feature_toggled'])
    .order('created_at', { ascending: false })
    .limit(10);

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isExpiringSoon = tenant.subscription_expires_at
    ? new Date(tenant.subscription_expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;

  const isExpired = tenant.subscription_expires_at
    ? new Date(tenant.subscription_expires_at).getTime() < Date.now()
    : false;

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/tenants/${tenantId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">{tenant.business_name}</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Current Plan</p>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold capitalize text-gray-900">
              {tenant.subscription_plan}
            </p>
            <p className="text-xs text-gray-500 mt-2">Billing Plan</p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <Settings className="w-4 h-4 text-green-600" />
            </div>
            <Badge variant={getSubscriptionBadgeVariant(tenant.subscription_status)} className="text-sm">
              {tenant.subscription_status}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Account Status</p>
          </CardContent>
        </Card>

        {/* Expiry Date */}
        <Card className={isExpired ? 'border-red-200 bg-red-50' : isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Expires</p>
              <Calendar className={isExpired ? 'w-4 h-4 text-red-600' : isExpiringSoon ? 'w-4 h-4 text-yellow-600' : 'w-4 h-4 text-gray-600'} />
            </div>
            <p className={`text-2xl font-bold ${isExpired ? 'text-red-900' : isExpiringSoon ? 'text-yellow-900' : 'text-gray-900'}`}>
              {formatDate(tenant.subscription_expires_at)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {isExpired ? 'Subscription Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning if expired */}
      {isExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Subscription Expired</p>
              <p className="text-sm text-red-800 mt-1">
                This subscription has expired. Update the expiry date or change the status to reactivate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Form */}
      <SubscriptionManagementForm tenantId={tenantId} initialTenant={tenant} />

      {/* Activity History */}
      {activityLogs && activityLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Recent subscription and feature changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {log.action === 'subscription_changed'
                        ? 'Subscription Changed'
                        : log.action === 'feature_toggled'
                        ? 'Feature Toggled'
                        : log.action}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card with Pricing */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Subscription Plans Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Basic</p>
              <p className="text-xs mt-1">IDR 199,000/bulan</p>
              <p className="text-xs mt-2">Standard features for small businesses</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Premium</p>
              <p className="text-xs mt-1">IDR 499,000/bulan</p>
              <p className="text-xs mt-2">Advanced features with priority support</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Enterprise</p>
              <p className="text-xs mt-1">IDR 999,000/bulan</p>
              <p className="text-xs mt-2">Full access with dedicated support</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
