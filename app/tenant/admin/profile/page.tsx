'use client';

import { Suspense } from 'react';
import ProfileContent from './content';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
