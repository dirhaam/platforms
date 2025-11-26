export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Users, Key } from 'lucide-react';
import Link from 'next/link';
import { SuperAdminsList } from './list';

export default async function SuperAdminsPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Management</h1>
          <p className="text-gray-600">
            Manage platform super administrators
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/superadmins/create">
            <Plus className="w-4 h-4 mr-2" />
            Add SuperAdmin
          </Link>
        </Button>
      </div>
      
      <SuperAdminsList currentUserEmail={session.email} />
    </div>
  );
}