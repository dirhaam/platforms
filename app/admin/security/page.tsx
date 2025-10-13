export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';


export default async function SecurityPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Audit</h1>
        <p className="text-gray-600">
          Monitor security events and audit logs across the platform
        </p>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Security dashboard and audit logs will be implemented here.
        <br />
        This will include security monitoring, audit trails, and access logs.
      </div>
    </div>
  );
}