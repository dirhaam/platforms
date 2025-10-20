'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

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

      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': finalSubdomain,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          subdomain: finalSubdomain,
        }),
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!subdomain && (
              <div className="space-y-2">
                <label htmlFor="subdomain" className="text-sm font-medium">
                  Subdomain / Tenant
                </label>
                <Input
                  id="subdomain"
                  type="text"
                  placeholder="e.g., test-demo"
                  value={subdomainInput}
                  onChange={(e) => setSubdomainInput(e.target.value)}
                  disabled={loading}
                  required={!subdomain}
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            Tenant: <span className="font-mono">{subdomainInput || subdomain || 'not set'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
