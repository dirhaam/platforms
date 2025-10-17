export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trash2, Edit2 } from 'lucide-react';
import CreateStaffDialog from './create-staff-dialog';

export default async function TenantStaffPage({
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
    .select('id, subdomain, business_name')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    redirect('/admin/tenants');
  }

  // Get staff members
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id, name, email, role, is_active, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-gray-600 mt-2">
          Manage staff members for <strong>{tenant.business_name}</strong>
        </p>
      </div>

      {/* Staff List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Members
            </CardTitle>
            <CardDescription>
              {staffMembers?.length || 0} staff member(s)
            </CardDescription>
          </div>
          <CreateStaffDialog tenantId={tenantId} tenantSubdomain={tenant.subdomain} />
        </CardHeader>
        <CardContent>
          {!staffMembers || staffMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No staff members yet</p>
              <CreateStaffDialog tenantId={tenantId} tenantSubdomain={tenant.subdomain} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff) => (
                    <tr key={staff.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{staff.name}</td>
                      <td className="py-3 px-4">{staff.email}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            staff.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            Staff members can login to <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id/admin</code>
          </p>
          <p>They can manage bookings, customers, services, and messages based on their assigned role and permissions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
