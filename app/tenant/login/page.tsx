export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TenantLoginContent from './content';

export default function TenantLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-body p-4">
          <Card className="w-full max-w-md shadow-card rounded-card border-none bg-white">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-txt-secondary">Loading login form...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TenantLoginContent />
    </Suspense>
  );
}
