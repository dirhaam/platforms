'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, Building, Users } from 'lucide-react';

export default function SmartLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add global error catcher
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🔥 Global error caught:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔥 Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 Component mounted');
    return () => console.log('🔄 Component unmounted');
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('superadmin');

  const redirectTo = searchParams.get('redirect') || '/admin/success';

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit Called!');
    e.preventDefault();
    console.log('🔍 Prevented default');
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Submitting login...');
      console.log('🔍 Form data:', formData);
      console.log('🔍 Selected role:', selectedRole);
      console.log('🔍 Email includes @booqing.my.id?', formData.email.includes('@booqing.my.id'));
      console.log('🔍 Role is superadmin?', selectedRole === 'superadmin');

      // SuperAdmin flow - authenticate through API with proper password validation
      if (formData.email.includes('@booqing.my.id') && selectedRole === 'superadmin') {
        console.log('✅ SuperAdmin login - Condition met, validating password...');
        // Continue to API authentication below for proper password validation
      }
      
      // For tenant owners and staff - using the actual API
      console.log('🔄 Attempting API authentication...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          loginType: selectedRole as 'owner' | 'staff' | 'superadmin',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ API authentication successful');
        
        // Clear any previous error messages
        setError(null);
        
        // Show success message
        setTimeout(() => {
          setError('Login successful! Redirecting...');
        }, 100);
        
        // Store in localStorage (primary method)
        try {
          localStorage.setItem('tenant-auth', JSON.stringify(result.user));
          console.log('✅ localStorage storage successful');
        } catch (error) {
          console.error('❌ localStorage failed:', error);
        }
        
        // Store in sessionStorage (backup method)
        try {
          sessionStorage.setItem('tenant-auth', JSON.stringify(result.user));
          console.log('✅ sessionStorage backup successful');
        } catch (error) {
          console.warn('⚠️ SessionStorage backup failed:', error);
        }
        
        // Safe to redirect - cookie has been set by the API response
        console.log('✅ Session cookie set by API - redirecting to dashboard...');
        setTimeout(() => {
          console.log('🚀 Redirecting to admin dashboard...');
          window.location.href = '/admin/dashboard';
        }, 1000); // Short delay to show success message
        return;
      } else {
        console.error('❌ API authentication failed:', result.error);
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className={`mb-6 ${
            error.includes('successful') || error.includes('Redirecting') 
              ? 'border-green-200 bg-green-50 text-green-800' 
              : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" onClick={() => console.log('🔗 Form clicked')}>
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Login As</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-600">Super Admin</div>
                      <div className="text-sm text-gray-500">Platform-wide administrator</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Business Owner</div>
                      <div className="text-sm text-gray-500">Business owner account</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Staff Member</div>
                      <div className="text-sm text-gray-500">Staff account</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                console.log('📧 Email changed:', e.target.value);
                setFormData(prev => ({ ...prev, email: e.target.value }));
              }}
              placeholder="admin@booqing.my.id"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="button"  // Change to button instead of submit
            className="w-full"
            disabled={isLoading}
            onClick={(e) => {
              console.log('🚀 Manual button clicked!');
              handleSubmit(e as any);
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
