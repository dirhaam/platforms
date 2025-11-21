'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Staff } from '@/types/booking';
import { StaffSchedule } from '@/components/staff/staff-schedule';
import { StaffLeave } from '@/components/staff/staff-leave';

interface StaffDetailContentProps {
  staffId: string;
}

export function StaffDetailContent({ staffId }: StaffDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff data
  useEffect(() => {
    if (!staffId || !subdomain) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/staff/${staffId}`, {
          headers: {
            'x-tenant-id': subdomain
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch staff');
        }

        const data = await response.json();
        setStaff(data.staff || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [staffId, subdomain]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Staff not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </Button>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">{staff.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{staff.email}</p>
              {staff.phone && <p className="text-sm text-gray-500">{staff.phone}</p>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-sm font-medium capitalize">{staff.role}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-medium">
                  {staff.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Joined</p>
                <p className="text-sm font-medium">
                  {new Date(staff.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Schedule and Leave Management */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Working Schedule */}
        <StaffSchedule
          staffId={staffId}
          tenantId={subdomain || ''}
          staffName={staff.name}
        />

        {/* Leave Management */}
        <StaffLeave
          staffId={staffId}
          tenantId={subdomain || ''}
          staffName={staff.name}
        />
      </div>
    </div>
  );
}
