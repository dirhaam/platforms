'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TenantData {
  id: string;
  business_name: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}

interface SubscriptionManagementFormProps {
  tenantId: string;
  initialTenant: TenantData;
}

const PLANS = [
  { value: 'basic', label: 'Basic', description: 'Standard features' },
  { value: 'premium', label: 'Premium', description: 'Advanced features' },
  { value: 'enterprise', label: 'Enterprise', description: 'Full access' },
];

const STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
];

export function SubscriptionManagementForm({
  tenantId,
  initialTenant,
}: SubscriptionManagementFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subscriptionPlan: initialTenant.subscription_plan || 'basic',
    subscriptionStatus: initialTenant.subscription_status || 'active',
    subscriptionExpiresAt: initialTenant.subscription_expires_at
      ? new Date(initialTenant.subscription_expires_at).toISOString().split('T')[0]
      : '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate date if provided
      if (formData.subscriptionExpiresAt) {
        const expiryDate = new Date(formData.subscriptionExpiresAt);
        if (isNaN(expiryDate.getTime())) {
          throw new Error('Invalid expiry date');
        }
      }

      const response = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionPlan: formData.subscriptionPlan,
          subscriptionStatus: formData.subscriptionStatus,
          subscriptionExpiresAt: formData.subscriptionExpiresAt
            ? formData.subscriptionExpiresAt
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      setSuccessMessage('Subscription updated successfully');
      toast.success('Subscription updated successfully');

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    formData.subscriptionPlan !== initialTenant.subscription_plan ||
    formData.subscriptionStatus !== initialTenant.subscription_status ||
    formData.subscriptionExpiresAt !==
      (initialTenant.subscription_expires_at
        ? new Date(initialTenant.subscription_expires_at).toISOString().split('T')[0]
        : '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Manage Subscription
        </CardTitle>
        <CardDescription>
          Update subscription plan, status, and expiry date
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">{successMessage}</p>
              <p className="text-sm text-green-800 mt-1">Page will refresh in 2 seconds...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subscription Plan */}
          <div>
            <Label htmlFor="subscriptionPlan" className="text-base font-semibold mb-3 block">
              Subscription Plan
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <label key={plan.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="subscriptionPlan"
                    value={plan.value}
                    checked={formData.subscriptionPlan === plan.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.subscriptionPlan === plan.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{plan.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Subscription Status */}
          <div>
            <Label htmlFor="subscriptionStatus" className="text-base font-semibold mb-3 block">
              Status
            </Label>
            <select
              id="subscriptionStatus"
              name="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="mt-3 flex items-center gap-2">
              <p className="text-sm text-gray-600">Current:</p>
              {STATUSES.map((status) =>
                status.value === initialTenant.subscription_status ? (
                  <Badge key={status.value} className={status.color}>
                    {status.label}
                  </Badge>
                ) : null
              )}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <Label htmlFor="subscriptionExpiresAt" className="text-base font-semibold mb-3 block">
              Expiration Date
            </Label>
            <Input
              id="subscriptionExpiresAt"
              name="subscriptionExpiresAt"
              type="date"
              value={formData.subscriptionExpiresAt}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              {formData.subscriptionExpiresAt
                ? `Expires on: ${new Date(formData.subscriptionExpiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}`
                : 'No expiration date set'}
            </p>
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Changes to be applied:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                {formData.subscriptionPlan !== initialTenant.subscription_plan && (
                  <li>
                    • Plan: <span className="font-semibold">{initialTenant.subscription_plan}</span> →{' '}
                    <span className="font-semibold">{formData.subscriptionPlan}</span>
                  </li>
                )}
                {formData.subscriptionStatus !== initialTenant.subscription_status && (
                  <li>
                    • Status: <span className="font-semibold">{initialTenant.subscription_status}</span> →{' '}
                    <span className="font-semibold">{formData.subscriptionStatus}</span>
                  </li>
                )}
                {formData.subscriptionExpiresAt !==
                  (initialTenant.subscription_expires_at
                    ? new Date(initialTenant.subscription_expires_at).toISOString().split('T')[0]
                    : '') && (
                  <li>
                    • Expiry Date:{' '}
                    <span className="font-semibold">
                      {initialTenant.subscription_expires_at
                        ? new Date(initialTenant.subscription_expires_at).toLocaleDateString()
                        : 'None'}
                    </span>{' '}
                    →{' '}
                    <span className="font-semibold">
                      {formData.subscriptionExpiresAt
                        ? new Date(formData.subscriptionExpiresAt).toLocaleDateString()
                        : 'None'}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={saving || !hasChanges}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
            {hasChanges && (
              <p className="text-sm text-amber-600 flex items-center">
                You have unsaved changes
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
