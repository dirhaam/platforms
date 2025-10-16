'use client';

import { Suspense } from 'react';
import SmartLoginForm from '@/components/auth/SmartLoginForm';

function LoginPageContent() {
  return (
    <div className="text-center">
      <h1>Authentication Required</h1>
      <p>Please use the SmartLoginForm component</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Suspense fallback={<LoginPageContent />}>
          <SmartLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
