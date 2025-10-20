'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          An error occurred while processing your request.
        </p>
        <div className="mt-6">
          <button
            onClick={() => reset()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
