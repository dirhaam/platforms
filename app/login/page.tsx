'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Users } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'superadmin' | 'owner' | 'staff'>('superadmin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const type = searchParams.get('type');
  const errorParam = searchParams.get('error');

  // Set default login type based on URL parameter
  useState(() => {
    if (type === 'superadmin') {
      setLoginType('superadmin');
    }
  });

  // Show error from URL parameter
  useState(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_tenant':
          setError('Invalid tenant access');
          break;
        case 'unauthorized':
          setError('Unauthorized access');
          break;
        default:
          setError('Authentication error');
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          loginType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to intended page or dashboard
        if (data.user.isSuperAdmin) {
          router.push('/admin');
        } else {
          router.push(redirect);
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to Booqing
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Platform Administration Login
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Choose your login type and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="superadmin" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Super Admin
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Owner
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Staff
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="superadmin" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Super Administrator</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Platform-wide access to all tenants and administrative features.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="owner" className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Business Owner</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Full access to your business tenant and all features.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="staff" className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-800 mb-2">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">Staff Member</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Access to assigned features and daily operations.
                    </p>
                  </div>
                </TabsContent>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </Tabs>

            {loginType === 'superadmin' && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Default SuperAdmin Credentials:</strong><br />
                  Email: dirhamrozi@gmail.com<br />
                  Password: 12345nabila
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}