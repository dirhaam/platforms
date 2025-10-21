'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

export default function SetupPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const searchParams = useSearchParams();
  const [subdomain, setSubdomain] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then((p) => setSubdomain(p.subdomain));
  }, [params]);

  const success = searchParams?.get('success') === 'true';
  const encodedPassword = searchParams?.get('pass');
  const email = searchParams?.get('email');

  let temporaryPassword = '';
  if (encodedPassword) {
    try {
      temporaryPassword = atob(encodedPassword);
    } catch (e) {
      console.error('Failed to decode password:', e);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!success || !temporaryPassword || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Setup Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Your business workspace is ready!</p>
            <Button asChild className="w-full">
              <Link href={`/s/${subdomain}`}>
                Go to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">🎉 Setup Complete!</CardTitle>
            <CardDescription className="text-green-800">
              Your business workspace is ready. Save your temporary login credentials below.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temporary Login Credentials</CardTitle>
            <CardDescription>
              Use these credentials to login as the business owner. You can change your password anytime after login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-4 py-3 rounded-md font-mono text-sm text-gray-900">
                  {email}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(email)}
                >
                  {copied && email.includes('@') ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Temporary Password</label>
              <div className="flex items-center gap-2">
                <code className={`flex-1 px-4 py-3 rounded-md font-mono text-sm ${
                  showPassword 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {showPassword ? temporaryPassword : '•'.repeat(temporaryPassword.length)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(temporaryPassword)}
                >
                  {copied && !email.includes('@') ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-900">
            <strong>⚠️ Important:</strong> This is a temporary password. After logging in, please change it to a strong password of your choice.
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Login to your dashboard</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Go to <code className="bg-gray-100 px-2 py-1 rounded text-xs">/tenant/login</code> and login with your email and password above.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Change your password</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Update your password in the settings after login.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Set up your services</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Add your business services and configure your booking settings.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/tenant/login">
              Go to Login
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/s/${subdomain}`}>
              View Landing Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
