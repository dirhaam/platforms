'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { PermissionGate } from '@/components/tenant/permission-gate';

export default function StaffPageContent() {
  return (
    <PermissionGate feature="staff">
      <StaffPageInner />
    </PermissionGate>
  );
}

function StaffPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }
    fetchStaff();
  }, [subdomain, router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      console.log('[StaffPage] Fetching staff for subdomain:', subdomain);

      const response = await fetch('/api/admin/staff', {
        credentials: 'include',
        headers: {
          'x-tenant-id': subdomain!,
          'Content-Type': 'application/json'
        }
      });

      console.log('[StaffPage] Response status:', response.status);

      // Handle 401 - redirect to login
      if (response.status === 401) {
        console.log('[StaffPage] Unauthorized - redirecting to login');
        router.push(`/tenant/login?subdomain=${subdomain}&redirect=/tenant/admin/staff`);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[StaffPage] Staff data received:', data);
      setStaff(data.staff || []);
    } catch (error) {
      console.error('[StaffPage] Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Staff"
        description="Manage team members and permissions"
        action={
          <Button
            className="gap-2"
            onClick={() => router.push(`/tenant/admin/staff/create?subdomain=${subdomain}`)}
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </Button>
        }
      />

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading staff...</p>
          ) : staff.length === 0 ? (
            <p className="text-gray-600">No staff members yet. Add your first team member to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Role</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => router.push(`/tenant/admin/staff/${member.id}?subdomain=${subdomain}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {member.name}
                        </button>
                      </td>
                      <td className="py-3 px-4">{member.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{member.role || 'staff'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={member.is_active ? 'default' : 'outline'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/tenant/admin/staff/${member.id}?subdomain=${subdomain}`)}
                            title="View Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
