'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { InvoiceManagement } from '@/components/invoice/InvoiceManagement';
import { PermissionGate } from '@/components/tenant/permission-gate';

export default function InvoicePageContent() {
  return (
    <PermissionGate feature="finance">
      <InvoicePageInner />
    </PermissionGate>
  );
}

function InvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
    }
  }, [subdomain, router]);

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Invoices"
        description="Generate invoices, download PDFs, and send them directly via WhatsApp"
      />

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <InvoiceManagement tenantId={subdomain} />
        </CardContent>
      </Card>
    </div>
  );
}
