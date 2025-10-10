'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { NotificationSettingsData } from '@/lib/settings/settings-service';

interface NotificationSettingsProps {
  tenantId: string;
  initialData: NotificationSettingsData;
}

export default function NotificationSettings({ tenantId, initialData }: NotificationSettingsProps) {
  const [formData, setFormData] = useState<NotificationSettingsData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof NotificationSettingsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Notification settings updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via SMS</p>
            </div>
            <Switch
              id="smsNotifications"
              checked={formData.smsNotifications}
              onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsappNotifications">WhatsApp Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via WhatsApp</p>
            </div>
            <Switch
              id="whatsappNotifications"
              checked={formData.whatsappNotifications}
              onCheckedChange={(checked) => handleInputChange('whatsappNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which events trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="bookingConfirmations">Booking Confirmations</Label>
              <p className="text-sm text-gray-500">New bookings and confirmations</p>
            </div>
            <Switch
              id="bookingConfirmations"
              checked={formData.bookingConfirmations}
              onCheckedChange={(checked) => handleInputChange('bookingConfirmations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="paymentReminders">Payment Reminders</Label>
              <p className="text-sm text-gray-500">Overdue payments and reminders</p>
            </div>
            <Switch
              id="paymentReminders"
              checked={formData.paymentReminders}
              onCheckedChange={(checked) => handleInputChange('paymentReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dailySummary">Daily Summary</Label>
              <p className="text-sm text-gray-500">Daily business summary reports</p>
            </div>
            <Switch
              id="dailySummary"
              checked={formData.dailySummary}
              onCheckedChange={(checked) => handleInputChange('dailySummary', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyReports">Weekly Reports</Label>
              <p className="text-sm text-gray-500">Weekly business performance reports</p>
            </div>
            <Switch
              id="weeklyReports"
              checked={formData.weeklyReports}
              onCheckedChange={(checked) => handleInputChange('weeklyReports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>
            Configure when to send appointment reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reminderHours">Send reminders (hours before appointment)</Label>
            <Input
              id="reminderHours"
              type="number"
              value={formData.reminderHours}
              onChange={(e) => handleInputChange('reminderHours', parseInt(e.target.value))}
              min="1"
              max="168"
              placeholder="24"
            />
            <p className="text-sm text-gray-500">
              Customers will receive reminders this many hours before their appointment
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Notification Settings'
          )}
        </Button>
      </div>
    </form>
  );
}