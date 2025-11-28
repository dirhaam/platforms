'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DatePickerString } from '@/components/ui/date-picker';
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';

interface LeaveRecord {
  id: string;
  dateStart: string;
  dateEnd: string;
  reason: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

interface Props {
  staffId: string;
  tenantId: string;
  staffName?: string;
}

export function StaffLeave({ staffId, tenantId, staffName }: Props) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    dateStart: '',
    dateEnd: '',
    reason: '',
    isPaid: true,
    notes: '',
  });

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (!staffId || !tenantId) return;
    
    let isMounted = true;
    const controller = new AbortController();

    const fetchLeaves = async () => {
      try {
        setFetchError(null);
        const response = await fetch(`/api/staff/${staffId}/leave`, {
          headers: { 'X-Tenant-ID': tenantId },
          signal: controller.signal,
        });
        
        if (!response.ok) {
          if (response.status === 503 && retryCount < MAX_RETRIES) {
            // Retry after delay for 503 errors
            setTimeout(() => {
              if (isMounted) setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1));
            return;
          }
          throw new Error(`Failed to fetch leaves (${response.status})`);
        }
        
        const data = await response.json();
        if (isMounted) {
          setLeaves(data.leave || []);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching leaves:', err);
        setFetchError(err instanceof Error ? err.message : 'Gagal memuat data cuti');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaves();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [staffId, tenantId, retryCount]);

  const refetchLeaves = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(`/api/staff/${staffId}/leave`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (!response.ok) throw new Error('Failed to fetch leaves');
      const data = await response.json();
      setLeaves(data.leave || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setFetchError(err instanceof Error ? err.message : 'Gagal memuat data cuti');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async () => {
    if (!formData.dateStart || !formData.dateEnd || !formData.reason) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const requestBody = {
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd,
        reason: formData.reason,
        isPaid: formData.isPaid,
        notes: formData.notes || undefined,
      };
      
      console.log('[StaffLeave] Creating leave:', { staffId, tenantId, requestBody });
      
      const response = await fetch(`/api/staff/${staffId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[StaffLeave] POST error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to create leave record (${response.status})`);
      }

      setSuccess(true);
      setOpenDialog(false);
      setFormData({
        dateStart: '',
        dateEnd: '',
        reason: '',
        isPaid: true,
        notes: '',
      });
      refetchLeaves();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave record?')) return;

    setDeleting(leaveId);
    setError(null);

    try {
      const response = await fetch(
        `/api/staff/${staffId}/leave?leaveId=${leaveId}`,
        {
          method: 'DELETE',
          headers: { 'X-Tenant-ID': tenantId },
        }
      );

      if (!response.ok) throw new Error('Failed to delete leave record');

      refetchLeaves();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const isLeaveActive = (record: LeaveRecord) => {
    const today = new Date().toISOString().split('T')[0];
    return record.dateStart <= today && record.dateEnd >= today;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <CardTitle>Leave Management</CardTitle>
            <CardDescription>
              {staffName && `${staffName}'s`} vacation and sick leave records
            </CardDescription>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Leave Record</DialogTitle>
                <DialogDescription>
                  Create a new vacation or sick leave record
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <DatePickerString
                    value={formData.dateStart}
                    onChange={(date) =>
                      setFormData({ ...formData, dateStart: date })
                    }
                    placeholder="Pilih tanggal mulai"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai *</Label>
                  <DatePickerString
                    value={formData.dateEnd}
                    onChange={(date) =>
                      setFormData({ ...formData, dateEnd: date })
                    }
                    placeholder="Pilih tanggal selesai"
                    minDate={formData.dateStart ? new Date(formData.dateStart) : undefined}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Vacation, Sick Leave, Holiday"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-paid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPaid: !!checked })
                    }
                  />
                  <Label htmlFor="is-paid" className="text-sm cursor-pointer">
                    Paid Leave
                  </Label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreateLeave}
                  disabled={creating}
                  className="w-full"
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Leave Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{fetchError}</span>
              <Button variant="ghost" size="sm" onClick={refetchLeaves}>
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Leave record updated successfully
            </AlertDescription>
          </Alert>
        )}

        {leaves.length === 0 && !fetchError ? (
          <p className="text-sm text-gray-500 py-4">
            No leave records. Click "Add Leave" to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {leaves.map((leave) => {
              const isActive = isLeaveActive(leave);
              return (
                <div
                  key={leave.id}
                  className={`rounded-lg border p-3 ${
                    isActive ? 'bg-orange-50 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium">
                          {formatDate(leave.dateStart)} to{' '}
                          {formatDate(leave.dateEnd)}
                        </p>
                        {isActive && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{leave.reason}</p>
                      {leave.notes && (
                        <p className="text-xs text-gray-500">{leave.notes}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {leave.isPaid && (
                          <Badge variant="outline" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLeave(leave.id)}
                      disabled={deleting === leave.id}
                    >
                      {deleting === leave.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
