export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';


export default async function TenantsPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <p className="text-gray-600">
          Manage all tenants on the platform
        </p>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Tenant management interface will be implemented here.
        <br />
        This will include tenant creation, editing, and management features.
      </div>
    </div>
  );
}