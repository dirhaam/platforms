export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TenantsList } from '@/components/admin/TenantsList';
import { BoxIcon } from '@/components/ui/box-icon';

export default async function TenantsPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-[#35365f] flex items-center justify-center">
            <BoxIcon name="building-house" size={24} className="text-primary dark:text-[#a5a7ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#d5d5e2]">Manajemen Tenant</h1>
            <p className="text-sm text-gray-500 dark:text-[#7e7f96]">
              Kelola semua tenant di platform
            </p>
          </div>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 dark:bg-[#7c7eff] dark:hover:bg-[#6c6eee]">
          <Link href="/admin/tenants/create" className="flex items-center gap-2">
            <BoxIcon name="plus" size={18} />
            <span>Buat Tenant</span>
          </Link>
        </Button>
      </div>
      
      <TenantsList initialSession={session} />
    </div>
  );
}