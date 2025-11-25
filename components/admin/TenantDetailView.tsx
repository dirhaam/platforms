'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, Settings, BarChart3, MessageSquare, Smartphone,
  ArrowLeft, Globe, ExternalLink, Edit, CreditCard, MapPin, Calendar,
  Clock, CheckCircle, AlertTriangle, Copy, Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TenantDetailViewProps {
  tenant: any;
  stats: {
    staffCount: number;
    servicesCount: number;
    customersCount: number;
    bookingsCount: number;
    completedBookings: number;
  };
  staffMembers: any[];
  services: any[];
}

type TabType = 'overview' | 'users' | 'services' | 'settings';

export function TenantDetailView({ tenant, stats, staffMembers, services }: TenantDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  const getTenantUrl = (subdomain: string) => {
    if (typeof window === 'undefined') return '';
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) return `http://${subdomain}.localhost:3000`;
    const hostname = window.location.hostname.replace(/^www\./, '');
    return `https://${subdomain}.${hostname}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    suspended: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const planColors: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700',
    premium: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  const isExpired = tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < new Date();
  const isExpiringSoon = tenant.subscription_expires_at && 
    new Date(tenant.subscription_expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 && !isExpired;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Building2 },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'services' as TabType, label: 'Services', icon: Settings },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/tenants">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{tenant.emoji}</span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{tenant.business_name}</h1>
                <Badge className={statusColors[tenant.subscription_status]}>
                  {tenant.subscription_status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <a 
                  href={getTenantUrl(tenant.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {tenant.subdomain}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button 
                  onClick={() => copyToClipboard(getTenantUrl(tenant.subdomain))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/tenants/${tenant.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/tenants/${tenant.id}/subscription`}>
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </Link>
          </Button>
        </div>
      </div>

      {/* Expiry Warning */}
      {(isExpired || isExpiringSoon) && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <AlertTriangle className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`} />
          <div>
            <p className={`font-medium ${isExpired ? 'text-red-900' : 'text-yellow-900'}`}>
              {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
            </p>
            <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
              {isExpired 
                ? `Expired on ${new Date(tenant.subscription_expires_at).toLocaleDateString('id-ID')}`
                : `Expires on ${new Date(tenant.subscription_expires_at).toLocaleDateString('id-ID')}`
              }
            </p>
          </div>
          <Button size="sm" variant={isExpired ? 'destructive' : 'outline'} asChild className="ml-auto">
            <Link href={`/admin/tenants/${tenant.id}/subscription`}>
              Manage Subscription
            </Link>
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.staffCount}</p>
            <p className="text-sm text-gray-500">Staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.servicesCount}</p>
            <p className="text-sm text-gray-500">Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.customersCount}</p>
            <p className="text-sm text-gray-500">Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.bookingsCount}</p>
            <p className="text-sm text-gray-500">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium capitalize">{tenant.business_category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{tenant.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{tenant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{tenant.phone}</p>
                </div>
              </div>
              {tenant.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{tenant.address}</p>
                </div>
              )}
              {tenant.business_description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{tenant.business_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <Badge className={planColors[tenant.subscription_plan]}>
                    {tenant.subscription_plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={statusColors[tenant.subscription_status]}>
                    {tenant.subscription_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
                    {tenant.subscription_expires_at 
                      ? new Date(tenant.subscription_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={`/admin/tenants/${tenant.id}/subscription`}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <FeatureItem label="WhatsApp" enabled={tenant.whatsapp_enabled} icon={MessageSquare} />
                <FeatureItem label="Home Visit" enabled={tenant.home_visit_enabled} icon={MapPin} />
                <FeatureItem label="Analytics" enabled={tenant.analytics_enabled} icon={BarChart3} />
                <FeatureItem label="Multi Staff" enabled={tenant.multi_staff_enabled} icon={Users} />
                <FeatureItem label="Custom Templates" enabled={tenant.custom_templates_enabled} icon={Settings} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild>
                <Link href={`/admin/tenants/${tenant.id}/users`}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/admin/tenants/${tenant.id}/whatsapp`}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  WhatsApp Setup
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={getTenantUrl(tenant.subdomain)} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  View Site
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`${getTenantUrl(tenant.subdomain)}/admin`} target="_blank" rel="noopener noreferrer">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>{staffMembers.length} staff members</CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/tenants/${tenant.id}/users`}>
                Manage Users
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {staffMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No staff members yet</p>
            ) : (
              <div className="space-y-3">
                {staffMembers.slice(0, 5).map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{staff.role}</Badge>
                  </div>
                ))}
                {staffMembers.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{staffMembers.length - 5} more staff members
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'services' && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>{services.length} services available</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No services yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Rp {service.price?.toLocaleString('id-ID')}</span>
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/tenants/${tenant.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Business Info
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/tenants/${tenant.id}/subscription`}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscription Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/tenants/${tenant.id}/whatsapp`}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  WhatsApp Configuration
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access URLs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Landing Page</p>
                <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                  {tenant.subdomain}.booqing.my.id
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Admin Panel</p>
                <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                  {tenant.subdomain}.booqing.my.id/admin
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ label, enabled, icon: Icon }: { label: string; enabled: boolean; icon: any }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded ${enabled ? 'bg-green-50' : 'bg-gray-50'}`}>
      <Icon className={`w-4 h-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
      <span className={enabled ? 'text-green-700' : 'text-gray-500'}>{label}</span>
      {enabled ? (
        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
      ) : (
        <span className="text-xs text-gray-400 ml-auto">Off</span>
      )}
    </div>
  );
}
