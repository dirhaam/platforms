export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import Link from 'next/link';
import { TenantsList } from '@/components/admin/TenantsList';

export default async function TenantsPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">
            Manage all tenants on the platform
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Link>
        </Button>
      </div>
      
      <TenantsList initialSession={session} />
    </div>
  );
}