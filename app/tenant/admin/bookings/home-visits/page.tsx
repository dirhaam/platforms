'use client';

import { Suspense } from 'react';
import HomeVisitAssignmentContent from './content';

export default function HomeVisitAssignmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
          <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
        </div>
      </div>
    }>
      <HomeVisitAssignmentContent />
    </Suspense>
  );
}
