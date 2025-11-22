'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerManagement } from '@/components/customer/CustomerManagement';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function CustomersPageContent() {
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
        title="Customers"
        description="Manage customer database and information"
      />

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <CustomerManagement
            tenantId={subdomain}
            onCustomerCreate={(customer) => {
              console.log('Customer created:', customer);
            }}
            onCustomerUpdate={(customerId, updates) => {
              console.log('Customer updated:', customerId, updates);
            }}
            onCustomerDelete={(customerId) => {
              console.log('Customer deleted:', customerId);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
