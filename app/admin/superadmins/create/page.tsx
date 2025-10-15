export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function CreateSuperAdminPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/superadmins">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to SuperAdmins
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New SuperAdmin</h1>
          <p className="text-gray-600">
            Add a new super administrator to the platform
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Security Warning
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              SuperAdmins have full platform access including all tenants and administrative functions. 
              Only grant this access to trusted individuals.
            </p>
          </div>
        </div>
      </div>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SuperAdmin Information
          </CardTitle>
          <CardDescription>
            Enter the details for the new super administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              required
            />
            <p className="text-xs text-gray-500">
              This will be used for login and notifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter secure password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              SuperAdmin Permissions
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Full access to all tenant data and settings</li>
              <li>• Platform-wide analytics and monitoring</li>
              <li>• User and tenant management capabilities</li>
              <li>• System configuration and security settings</li>
              <li>• WhatsApp integration management</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" asChild>
              <Link href="/admin/superadmins">
                Cancel
              </Link>
            </Button>
            <Button type="submit">
              Create SuperAdmin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}