'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Trash2, 
  Edit, 
  Eye, 
  Settings, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Crown,
  Zap,
  BarChart3,
  Palette,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { rootDomain, protocol } from '@/lib/utils';
import type { EnhancedTenant } from '@/lib/subdomain-constants';
import { TenantEditDialog } from '@/components/admin/TenantEditDialog';
import { FeatureToggleCard } from '@/components/admin/FeatureToggleCard';

interface TenantManagementProps {
  tenants: EnhancedTenant[];
  onFeatureToggle: (tenantId: string, feature: string, enabled: boolean) => Promise<void>;
  onTenantDelete: (tenantId: string) => Promise<void>;
  onTenantEdit: (tenantId: string, data: Partial<EnhancedTenant>) => Promise<void>;
}

export function TenantManagement({ 
  tenants, 
  onFeatureToggle, 
  onTenantDelete, 
  onTenantEdit 
}: TenantManagementProps) {
  const [selectedTenant, setSelectedTenant] = useState<EnhancedTenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);

  const handleEditTenant = (tenant: EnhancedTenant) => {
    setSelectedTenant(tenant);
    setIsEditDialogOpen(true);
  };

  const handleFeatureToggle = async (tenant: EnhancedTenant, feature: string, enabled: boolean) => {
    await onFeatureToggle(tenant.id, feature, enabled);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'enterprise':
        return <Crown className="h-4 w-4 text-purple-500" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No tenants have been created yet.</p>
          <p className="text-gray-400 text-sm mt-2">
            Tenants will appear here once they register through the main website.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{tenant.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{tenant.businessName}</CardTitle>
                      {getPlanIcon(tenant.subscription.plan)}
                      <Badge variant={getStatusBadgeVariant(tenant.subscription.status)}>
                        {tenant.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">{tenant.subdomain}.{rootDomain}</span>
                      <span>•</span>
                      <span>{tenant.businessCategory}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedTenant(
                      expandedTenant === tenant.id ? null : tenant.id
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTenant(tenant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Link
                    href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTenantDelete(tenant.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{tenant.ownerName}</span>
                  </div>
                  {tenant.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{tenant.email}</span>
                    </div>
                  )}
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  {tenant.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{tenant.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Updated: {tenant.updatedAt.toLocaleDateString()}</span>
                  </div>
                  {tenant.subscription.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Expires: {tenant.subscription.expiresAt.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Management - Expanded View */}
              {expandedTenant === tenant.id && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Feature Management
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FeatureToggleCard
                      icon={<Phone className="h-4 w-4" />}
                      title="WhatsApp Integration"
                      description="Enable WhatsApp messaging and automation"
                      enabled={tenant.features.whatsapp}
                      onToggle={(enabled: boolean) => handleFeatureToggle(tenant, 'whatsapp', enabled)}
                    />
                    <FeatureToggleCard
                      icon={<MapPin className="h-4 w-4" />}
                      title="Home Visit Booking"
                      description="Allow customers to book home visits"
                      enabled={tenant.features.homeVisit}
                      onToggle={(enabled: boolean) => handleFeatureToggle(tenant, 'homeVisit', enabled)}
                    />
                    <FeatureToggleCard
                      icon={<BarChart3 className="h-4 w-4" />}
                      title="Advanced Analytics"
                      description="Detailed business insights and reports"
                      enabled={tenant.features.analytics}
                      onToggle={(enabled: boolean) => handleFeatureToggle(tenant, 'analytics', enabled)}
                    />
                    <FeatureToggleCard
                      icon={<Palette className="h-4 w-4" />}
                      title="Custom Templates"
                      description="Custom landing page templates"
                      enabled={tenant.features.customTemplates}
                      onToggle={(enabled: boolean) => handleFeatureToggle(tenant, 'customTemplates', enabled)}
                    />
                    <FeatureToggleCard
                      icon={<Users className="h-4 w-4" />}
                      title="Multi-Staff Management"
                      description="Multiple staff accounts and roles"
                      enabled={tenant.features.multiStaff}
                      onToggle={(enabled: boolean) => handleFeatureToggle(tenant, 'multiStaff', enabled)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {selectedTenant && (
        <TenantEditDialog
          tenant={selectedTenant}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedTenant(null);
          }}
          onSave={async (data: Partial<EnhancedTenant>) => {
            await onTenantEdit(selectedTenant.id, data);
            setIsEditDialogOpen(false);
            setSelectedTenant(null);
          }}
        />
      )}
    </div>
  );
}