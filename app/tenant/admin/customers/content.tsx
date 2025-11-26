'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerManagement } from '@/components/customer/CustomerManagement';

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
  );
}
