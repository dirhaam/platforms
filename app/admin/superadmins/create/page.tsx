export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { SuperAdminService } from '@/lib/auth/superadmin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { SuperAdminCreateForm } from './form';

export default async function CreateSuperAdminPage() {
  // Verify session in a try-catch to handle any session-related errors
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error('Session validation error:', error);
    redirect('/login?type=superadmin');
  }

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
      
      <SuperAdminCreateForm />
    </div>
  );
}