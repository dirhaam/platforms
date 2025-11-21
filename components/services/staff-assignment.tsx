'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  staffServiceId?: string;
  canPerform?: boolean;
  isSpecialist?: boolean;
}

interface Props {
  serviceId: string;
  tenantId: string;
}

export function StaffAssignment({ serviceId, tenantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  useEffect(() => {
    fetchAssignedStaff();
  }, [serviceId, tenantId]);

  const fetchAssignedStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/services/${serviceId}/staff`,
        {
          headers: { 'X-Tenant-ID': tenantId },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      setAssignedStaff(data.staff || []);
      
      // Fetch all staff for assignment dialog
      fetchAllStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStaff = async () => {
    try {
      // This would be a new API endpoint to get all staff
      // For now, we'll use a placeholder
      const response = await fetch('/api/staff', {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        const data = await response.json();
        setAllStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching all staff:', err);
    }
  };

  const handleAssignStaff = async () => {
    if (selectedStaff.length === 0) return;

    setAssigning(true);
    setError(null);
    setSuccess(false);

    try {
      for (const staffId of selectedStaff) {
        const response = await fetch(
          `/api/services/${serviceId}/staff`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': tenantId,
            },
            body: JSON.stringify({
              staffId,
              canPerform: true,
              isSpecialist: false,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to assign staff');
        }
      }

      setSuccess(true);
      setOpenDialog(false);
      setSelectedStaff([]);
      fetchAssignedStaff();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      // This would require a DELETE endpoint
      // For now, we'll show a placeholder
      console.log('Remove staff:', staffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing staff');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Assignment</CardTitle>
            <CardDescription>
              Assign staff members who can perform this service
            </CardDescription>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Assign Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Staff to Service</DialogTitle>
                <DialogDescription>
                  Select staff members who can perform this service
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {allStaff.length === 0 ? (
                  <p className="text-sm text-gray-500">No staff available</p>
                ) : (
                  allStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={staff.id}
                        checked={selectedStaff.includes(staff.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStaff([...selectedStaff, staff.id]);
                          } else {
                            setSelectedStaff(
                              selectedStaff.filter((s) => s !== staff.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={staff.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {staff.name}
                        <span className="ml-2 text-xs text-gray-500">
                          ({staff.email})
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>

              <Button
                onClick={handleAssignStaff}
                disabled={assigning || selectedStaff.length === 0}
                className="w-full"
              >
                {assigning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign {selectedStaff.length > 0 && `(${selectedStaff.length})`}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Staff assigned successfully
            </AlertDescription>
          </Alert>
        )}

        {assignedStaff.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No staff assigned yet. Click "Assign Staff" to add staff members.
          </p>
        ) : (
          <div className="space-y-2">
            {assignedStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {staff.isSpecialist && (
                    <Badge variant="secondary">Specialist</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStaff(staff.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
