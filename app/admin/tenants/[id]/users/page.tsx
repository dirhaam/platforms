export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Crown, Shield, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { UserManagementTabs } from './user-management-tabs';

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tenantId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, subdomain, business_name, email')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    redirect('/admin/tenants');
  }

  // Get all users (staff)
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id, name, email, role, is_active, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Separate by role - owner is the first admin with email matching tenant owner_name or email
  const owner = staffMembers?.find(s => s.role === 'admin' && s.email === tenant.email) || null;
  const admins = staffMembers?.filter(s => s.role === 'admin' && s.email !== tenant.email) || [];
  const staff = staffMembers?.filter(s => s.role === 'staff') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage users and permissions for <strong>{tenant.business_name}</strong>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/tenants/${tenantId}`}>
            Back to Tenant
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{staffMembers?.length || 0}</p>
              </div>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Owner</p>
                <p className="text-2xl font-bold">{owner ? 1 : 0}</p>
              </div>
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <UserManagementTabs 
        tenantId={tenantId}
        tenantSubdomain={tenant.subdomain}
        owner={owner}
        admins={admins}
        staff={staff}
      />

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role-Based Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-3 text-sm">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4" /> Owner
            </p>
            <p>Full access to all features and user management. Can create and manage admins and staff.</p>
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Admin
            </p>
            <p>Can manage most features like services, bookings, customers, and staff except other admins.</p>
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Staff
            </p>
            <p>Can manage bookings, customers, and services assigned to them.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
