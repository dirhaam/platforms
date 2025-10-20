export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TenantLoginContent from './content';

export default function TenantLoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-gray-600">Loading login form...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TenantLoginContent />
    </Suspense>
  );
}
