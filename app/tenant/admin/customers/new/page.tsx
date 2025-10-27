'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NewCustomerForm } from '@/components/forms/NewCustomerForm';

export default function CustomerNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <NewCustomerForm
            subdomain={subdomain || ''}
            onSuccess={() => router.push(`/tenant/admin/customers?subdomain=${subdomain}`)}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
