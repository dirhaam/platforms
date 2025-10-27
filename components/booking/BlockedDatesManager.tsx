'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
}

interface BlockedDatesManagerProps {
  tenantId: string;
  month?: string;
}

export function BlockedDatesManager({ tenantId, month }: BlockedDatesManagerProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load blocked dates
  useEffect(() => {
    fetchBlockedDates();
  }, [tenantId, month]);

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/bookings/blocked-dates', window.location.origin);
      url.searchParams.set('tenantId', tenantId);
      if (month) {
        url.searchParams.set('month', month);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch blocked dates');

      const data = await response.json();
      setBlockedDates(data.blockedDates || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/bookings/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          date: newDate,
          reason: newReason || undefined,
          isRecurring,
          recurringPattern: isRecurring ? recurringPattern : undefined,
          recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create blocked date');

      // Reset form and refresh
      setNewDate('');
      setNewReason('');
      setIsRecurring(false);
      setRecurringEndDate('');
      setIsOpen(false);

      await fetchBlockedDates();
    } catch (error) {
      console.error('Error creating blocked date:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/bookings/blocked-dates?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete blocked date');

      await fetchBlockedDates();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Blocked Dates
        </CardTitle>
        <CardDescription>
          Manage dates when bookings cannot be made (maintenance, holidays, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Block Date
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block a Date</DialogTitle>
              <DialogDescription>
                Prevent customers from booking on this date
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBlockedDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <Input
                  placeholder="e.g., Maintenance, Holiday, Closed"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                  Recurring Block
                </label>
              </div>

              {isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pattern</label>
                    <Select value={recurringPattern} onValueChange={(value: any) => setRecurringPattern(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Creating...' : 'Block Date'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading blocked dates...</div>
        ) : blockedDates.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No blocked dates. All dates are available for booking.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{formatDate(blocked.date)}</div>
                  <div className="text-sm text-gray-600">
                    {blocked.reason || 'No reason provided'}
                    {blocked.isRecurring && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {blocked.recurringPattern}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBlockedDate(blocked.id)}
                  disabled={deleting === blocked.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
