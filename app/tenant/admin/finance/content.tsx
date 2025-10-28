'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceManagement } from '@/components/invoice/InvoiceManagement';

export default function InvoicePageContent() {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">
          Generate invoices, download PDFs, and send them directly via WhatsApp
        </p>
      </div>

      <InvoiceManagement tenantId={subdomain} />
    </div>
  );
}
