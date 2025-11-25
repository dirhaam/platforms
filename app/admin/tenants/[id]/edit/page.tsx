'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, FileText,
  Loader2, Save, MessageSquare, BarChart3, Users, Settings, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  const tenantId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [formData, setFormData] = useState<Partial<TenantData>>({});
  const [activeSection, setActiveSection] = useState<'business' | 'contact' | 'features'>('business');

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${tenantId}`);
        if (!response.ok) throw new Error('Failed to fetch tenant');
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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tenant');
      }

      setSuccess(true);
      toast.success('Tenant berhasil diupdate');
      setTimeout(() => router.push(`/admin/tenants/${tenantId}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(err instanceof Error ? err.message : 'Gagal update tenant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <Button asChild>
          <Link href="/admin/tenants">Back to Tenants</Link>
        </Button>
      </div>
    );
  }

  const sections = [
    { id: 'business' as const, label: 'Business Info', icon: Building2 },
    { id: 'contact' as const, label: 'Contact', icon: User },
    { id: 'features' as const, label: 'Features', icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/tenants/${tenantId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
          <p className="text-gray-500">{tenant?.businessName}</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">Tenant berhasil diupdate! Redirecting...</p>
        </div>
      )}

      {/* Section Nav */}
      <div className="flex gap-2 border-b pb-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeSection === section.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Business Info Section */}
        {activeSection === 'business' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>Basic information about the business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Subdomain cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Category *</Label>
                  <select
                    id="businessCategory"
                    name="businessCategory"
                    value={formData.businessCategory || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="salon">Salon & Kecantikan</option>
                    <option value="barbershop">Barbershop</option>
                    <option value="spa">Spa & Massage</option>
                    <option value="clinic">Klinik</option>
                    <option value="gym">Gym & Fitness</option>
                    <option value="photography">Photography</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      formData.subscriptionPlan === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                      formData.subscriptionPlan === 'premium' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {formData.subscriptionPlan}
                    </Badge>
                    <Link href={`/admin/tenants/${tenantId}/subscription`} className="text-sm text-blue-600 hover:underline">
                      Manage subscription
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                  placeholder="Describe the business..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Owner and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="ownerName"
                      name="ownerName"
                      value={formData.ownerName || ''}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        {activeSection === 'features' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable features for this tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeatureToggle
                icon={MessageSquare}
                label="WhatsApp Integration"
                description="Enable WhatsApp messaging and notifications"
                checked={formData.whatsappEnabled || false}
                onCheckedChange={(checked) => handleSwitchChange('whatsappEnabled', checked)}
              />
              <FeatureToggle
                icon={MapPin}
                label="Home Visit"
                description="Allow customers to book home visit services"
                checked={formData.homeVisitEnabled || false}
                onCheckedChange={(checked) => handleSwitchChange('homeVisitEnabled', checked)}
              />
              <FeatureToggle
                icon={BarChart3}
                label="Analytics"
                description="Access to analytics and reporting dashboard"
                checked={formData.analyticsEnabled || false}
                onCheckedChange={(checked) => handleSwitchChange('analyticsEnabled', checked)}
              />
              <FeatureToggle
                icon={Users}
                label="Multi Staff"
                description="Support for multiple staff members"
                checked={formData.multiStaffEnabled || false}
                onCheckedChange={(checked) => handleSwitchChange('multiStaffEnabled', checked)}
              />
              <FeatureToggle
                icon={FileText}
                label="Custom Templates"
                description="Create and use custom message templates"
                checked={formData.customTemplatesEnabled || false}
                onCheckedChange={(checked) => handleSwitchChange('customTemplatesEnabled', checked)}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/tenants/${tenantId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FeatureToggle({ 
  icon: Icon, 
  label, 
  description, 
  checked, 
  onCheckedChange 
}: {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
      checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checked ? 'bg-green-100' : 'bg-gray-200'}`}>
          <Icon className={`w-5 h-5 ${checked ? 'text-green-600' : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
