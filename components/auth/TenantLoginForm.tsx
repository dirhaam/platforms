'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
  loginType: 'owner' | 'staff';
}

export default function TenantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    loginType: 'owner',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
  const urlError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'invalid_tenant':
        return 'You do not have access to this tenant';
      case 'session_expired':
        return 'Your session has expired. Please log in again';
      default:
        return null;
    }
  };

  const displayError = error || getErrorMessage(urlError);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Login Type Selection */}
          <div className="space-y-2">
            <Label>Login as</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="loginType"
                  value="owner"
                  checked={formData.loginType === 'owner'}
                  onChange={(e) => handleInputChange('loginType', e.target.value as 'owner' | 'staff')}
                  className="text-blue-600"
                />
                <span className="text-sm">Business Owner</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="loginType"
                  value="staff"
                  checked={formData.loginType === 'staff'}
                  onChange={(e) => handleInputChange('loginType', e.target.value as 'owner' | 'staff')}
                  className="text-blue-600"
                />
                <span className="text-sm">Staff Member</span>
              </label>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Development Credentials Helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 p-3 rounded-md text-sm">
              <p className="font-medium text-blue-800 mb-1">Development Credentials:</p>
              <p className="text-blue-700">
                Owner: Use your registered email + password
              </p>
              <p className="text-blue-700">
                Staff: Use your staff email + password
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help accessing your account?{' '}
            <a href="mailto:support@booqing.my.id" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}