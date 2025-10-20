'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerManagement } from '@/components/customer/CustomerManagement';

export default function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');

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
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-2">Manage customer database and information</p>
      </div>

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
    </div>
  );
}
