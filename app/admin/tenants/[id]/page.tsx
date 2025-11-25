export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { TenantDetailView } from '@/components/admin/TenantDetailView';

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  const { id: tenantId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    redirect('/admin/tenants');
  }

  const [
    { data: staffMembers },
    { data: services },
    { data: customers },
    { data: bookings },
  ] = await Promise.all([
    supabase.from('staff').select('id, name, role, email, phone').eq('tenant_id', tenantId),
    supabase.from('services').select('id, name, price, duration').eq('tenant_id', tenantId),
    supabase.from('customers').select('id').eq('tenant_id', tenantId),
    supabase.from('bookings').select('id, status').eq('tenant_id', tenantId),
  ]);

  return (
    <TenantDetailView 
      tenant={tenant}
      stats={{
        staffCount: staffMembers?.length || 0,
        servicesCount: services?.length || 0,
        customersCount: customers?.length || 0,
        bookingsCount: bookings?.length || 0,
        completedBookings: bookings?.filter(b => b.status === 'completed').length || 0,
      }}
      staffMembers={staffMembers || []}
      services={services || []}
    />
  );
}
