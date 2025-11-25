export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, BarChart3, MessageSquare, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  // Get staff count
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id')
    .eq('tenant_id', tenantId);

  // Get services count
  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('tenant_id', tenantId);

  // Get customers count
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenantId);

  // Get bookings count
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('tenant_id', tenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{tenant.emoji}</span>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.business_name}</h1>
          </div>
          <p className="text-gray-600">{tenant.business_description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Subdomain</p>
          <code className="text-lg font-mono font-semibold">{tenant.subdomain}</code>
          <p className="text-xs text-gray-500 mt-1">.booqing.my.id</p>
        </div>
      </div>

      {/* Status & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Status</p>
            <Badge className="mt-2" variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
              {tenant.subscription_status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Plan</p>
            <p className="text-lg font-semibold capitalize mt-2">{tenant.subscription_plan}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Contact</p>
            <p className="text-sm font-medium mt-2">{tenant.owner_name}</p>
            <p className="text-xs text-gray-500">{tenant.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Phone</p>
            <p className="text-lg font-semibold mt-2">{tenant.phone}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff Members</p>
                <p className="text-2xl font-bold mt-1">{staffMembers?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-2xl font-bold mt-1">{services?.length || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold mt-1">{customers?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bookings</p>
                <p className="text-2xl font-bold mt-1">{bookings?.length || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users and permissions (Owner, Admin, Staff)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {staffMembers?.length || 0} user(s)
              </p>
              <Button asChild className="w-full">
                <Link href={`/admin/tenants/${tenantId}/users`}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Configuration */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              WhatsApp Setup
            </CardTitle>
            <CardDescription>
              Configure WhatsApp API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Configure WhatsApp integration for this tenant
              </p>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href={`/admin/tenants/${tenantId}/whatsapp`}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Configure
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Settings
            </CardTitle>
            <CardDescription>
              Edit tenant configuration and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/admin/tenants/${tenantId}/edit`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Details
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                <Link href={`/admin/tenants/${tenantId}/subscription`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Access Information</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            <strong>Tenant Admin URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id/admin</code>
          </p>
          <p>
            <strong>Landing Page:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id</code>
          </p>
          <p className="text-sm mt-3">
            Staff members can login with their email and password to manage bookings, customers, and services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
