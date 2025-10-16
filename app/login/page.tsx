import SmartLoginForm from '@/components/auth/SmartLoginForm';
import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import Link from 'next/link';

// Make this a server component that accepts search params
export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  console.log('🚀 LoginPage server component rendered!');
  
  // Note: In Next.js 14.1+, searchParams is a Promise
  const message = (async () => {
    const params = await searchParams;
    return params?.message as string | undefined;
  })();

  // Since we need to use async/await, we'll use a React component that handles the async data
  return <LoginPageContent searchParamsPromise={searchParams} />;
}

// Separate component to handle async data
async function LoginPageContent({ 
  searchParamsPromise 
}: { 
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const searchParams = await searchParamsPromise;
  const message = searchParams?.message as string | undefined;

  console.log('🔍 About to render JSX, message:', message);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign In to Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link 
              href="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        <SmartLoginForm />
        {/* <SimpleLoginForm /> */}

        {/* Quick Access for Development */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-3">Quick Access (Development)</p>
            <div className="space-y-2">
              <div className="text-xs text-gray-400">
                <strong>Super Admin:</strong> Use your configured superadmin credentials
              </div>
              <div className="text-xs text-gray-400">
                <strong>Test Owner:</strong> test@owner.com / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
