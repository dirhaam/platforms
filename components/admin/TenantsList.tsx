"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal, 
  Loader2,
  Globe,
  Users,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';

interface Tenant {
  id: string;
  subdomain: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  emoji: string;
  website?: string;
  
  // Features
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  
  // Subscription
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: string;
}

interface TenantsListProps {
  initialSession: any;
}

export function TenantsList({ initialSession }: TenantsListProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }
      
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to delete "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(tenantId);
    
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tenant');
      }

      toast.success(`Tenant "${tenantName}" deleted successfully`);
      setTenants(prev => prev.filter(tenant => tenant.id !== tenantId));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete tenant');
    } finally {
      setIsDeleting(null);
    }
  };

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTenantUrl = (subdomain: string) => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) {
      return `http://${subdomain}.localhost:3000`;
    }
    // Remove www. prefix if present
    const hostname = window.location.hostname.replace(/^www\./, '');
    return `https://${subdomain}.${hostname}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading tenants...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Yet</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Create your first tenant to get started with the platform.
            </p>
            <Button asChild>
              <Link href="/admin/tenants/create">
                <Building2 className="w-4 h-4 mr-2" />
                Create First Tenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Tenants ({tenants.length})</CardTitle>
              <div className="text-sm text-gray-500">
                Showing {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{tenant.emoji}</div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {tenant.businessName}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Globe className="w-3 h-3" />
                              <a
                                href={getTenantUrl(tenant.subdomain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 transition-colors"
                              >
                                {tenant.subdomain}
                              </a>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{tenant.ownerName}</div>
                          <div className="text-sm text-gray-500">{tenant.email}</div>
                          <div className="text-sm text-gray-500">{tenant.phone}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tenant.businessCategory}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            variant={getSubscriptionBadgeVariant(tenant.subscriptionStatus)}
                            className="capitalize"
                          >
                            {tenant.subscriptionStatus}
                          </Badge>
                          <div className="text-sm text-gray-500 capitalize">
                            {tenant.subscriptionPlan}
                          </div>
                          {tenant.subscriptionExpiresAt && (
                            <div className="text-xs text-gray-400">
                              Expires: {formatDate(Number(tenant.subscriptionExpiresAt))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tenant.whatsappEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              WhatsApp
                            </Badge>
                          )}
                          {tenant.homeVisitEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              Home Visit
                            </Badge>
                          )}
                          {tenant.analyticsEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              Analytics
                            </Badge>
                          )}
                          {tenant.multiStaffEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              Multi-Staff
                            </Badge>
                          )}
                          {tenant.customTemplatesEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              Templates
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(tenant.createdAt)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a 
                                href={getTenantUrl(tenant.subdomain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center w-full"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Site
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/tenants/${tenant.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(tenant.id, tenant.businessName)}
                              disabled={isDeleting === tenant.id}
                              className="text-red-600"
                            >
                              {isDeleting === tenant.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
