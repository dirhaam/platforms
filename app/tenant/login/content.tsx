'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TenantLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let subdomain = searchParams?.get('subdomain');
  const redirectUrl = searchParams?.get('redirect');

  // For development: if no subdomain, try to extract from window location
  if (typeof window !== 'undefined' && !subdomain) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
      // Extract subdomain from hostname (e.g., test-demo.example.com -> test-demo)
      const parts = hostname.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subdomainInput, setSubdomainInput] = useState(subdomain || '');
  const [loginType, setLoginType] = useState<'owner' | 'admin' | 'staff' | 'superadmin'>('owner');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalSubdomain = subdomainInput || subdomain;
    if (!finalSubdomain) {
      setError('Subdomain is required');
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      let endpoint = '/api/auth/staff-login';
      let body: any = {
        email: formData.email,
        password: formData.password,
        subdomain: finalSubdomain,
      };

      // Route to appropriate endpoint based on login type
      if (loginType === 'owner' || loginType === 'admin' || loginType === 'superadmin') {
        endpoint = '/api/auth/authenticate';
        body = {
          email: formData.email,
          password: formData.password,
          loginType: loginType,
        };
      } else {
        // Staff login uses staff-login endpoint
        body.loginType = 'staff';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': finalSubdomain,
        },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('Failed to parse response:', text);
        setError('Server error - please check console');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to dashboard or specified redirect URL
      const redirectPath = redirectUrl || `/tenant/admin?subdomain=${finalSubdomain}`;
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-body p-4">
      <Card className="w-full max-w-md shadow-card rounded-card border-none bg-white">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <i className='bx bxs-business text-3xl'></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-txt-primary">Welcome Back! 👋</CardTitle>
          <CardDescription className="text-txt-secondary">
            Please sign-in to your account and start the adventure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-danger border-none">
              <div className="flex items-center gap-2">
                <i className='bx bx-error-circle text-xl'></i>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-txt-secondary">Login As</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoginType('owner')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-2 text-sm rounded-md border transition-all duration-200 ${loginType === 'owner'
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-gray-50 border-transparent text-txt-secondary hover:bg-gray-100'
                    }`}
                  disabled={loading}
                >
                  <i className='bx bxs-crown text-lg'></i>
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('admin')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-2 text-sm rounded-md border transition-all duration-200 ${loginType === 'admin'
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-gray-50 border-transparent text-txt-secondary hover:bg-gray-100'
                    }`}
                  disabled={loading}
                >
                  <i className='bx bx-shield-quarter text-lg'></i>
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('staff')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-2 text-sm rounded-md border transition-all duration-200 ${loginType === 'staff'
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-gray-50 border-transparent text-txt-secondary hover:bg-gray-100'
                    }`}
                  disabled={loading}
                >
                  <i className='bx bx-user text-lg'></i>
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('superadmin')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-2 text-sm rounded-md border transition-all duration-200 ${loginType === 'superadmin'
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-gray-50 border-transparent text-txt-secondary hover:bg-gray-100'
                    }`}
                  disabled={loading}
                >
                  <i className='bx bx-key text-lg'></i>
                  SuperAdmin
                </button>
              </div>
            </div>

            {!subdomain && (
              <div className="space-y-1.5">
                <label htmlFor="subdomain" className="text-sm font-medium text-txt-secondary">
                  Subdomain / Tenant
                </label>
                <div className="relative">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="e.g., test-demo"
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value)}
                    disabled={loading}
                    required={!subdomain}
                    className="bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20 pl-10 h-11 transition-all"
                  />
                  <i className='bx bx-buildings absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xl'></i>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-txt-secondary">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20 pl-10 h-11 transition-all"
                />
                <i className='bx bx-envelope absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xl'></i>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-txt-secondary">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:text-primary-dark">Forgot Password?</a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20 pl-10 h-11 transition-all"
                />
                <i className='bx bx-lock-alt absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xl'></i>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white h-11 font-medium shadow-md hover:shadow-lg transition-all mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className='bx bx-loader-alt bx-spin mr-2 text-xl'></i>
                  Logging in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="text-xs text-txt-muted text-center pt-2">
            Tenant: <span className="font-mono text-txt-secondary font-medium">{subdomainInput || subdomain || 'not set'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
