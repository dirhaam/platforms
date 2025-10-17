'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TenantData {
  id: string;
  subdomain: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  subscriptionPlan: string;
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [formData, setFormData] = useState<Partial<TenantData>>({});

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${tenantId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tenant');
        }
        const data = await response.json();
        setTenant(data);
        setFormData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tenant');
      }

      router.push('/admin/tenants?updated=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error && !tenant) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {error}</div>
        <Button asChild className="mt-4">
          <Link href="/admin/tenants">Back to Tenants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="subdomain">Subdomain *</Label>
            <Input
              id="subdomain"
              name="subdomain"
              value={formData.subdomain || ''}
              onChange={handleChange}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="businessCategory">Category *</Label>
            <Input
              id="businessCategory"
              name="businessCategory"
              value={formData.businessCategory || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
            <select
              id="subscriptionPlan"
              name="subscriptionPlan"
              value={formData.subscriptionPlan || 'basic'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <Label htmlFor="ownerName">Owner Name *</Label>
            <Input
              id="ownerName"
              name="ownerName"
              value={formData.ownerName || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="businessDescription">Business Description</Label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <Label>Features</Label>
          <div className="space-y-2">
            {[
              { key: 'whatsappEnabled', label: 'WhatsApp Enabled' },
              { key: 'homeVisitEnabled', label: 'Home Visit Enabled' },
              { key: 'analyticsEnabled', label: 'Analytics Enabled' },
              { key: 'customTemplatesEnabled', label: 'Custom Templates Enabled' },
              { key: 'multiStaffEnabled', label: 'Multi Staff Enabled' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  name={key}
                  checked={formData[key as keyof TenantData] as boolean || false}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor={key} className="ml-2 cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/tenants">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
