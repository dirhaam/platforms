'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield, User, Users, Info } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface DetectedRole {
  type: 'superadmin' | 'owner' | 'staff';
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export default function SmartLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [detectedRole, setDetectedRole] = useState<DetectedRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('owner');

  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
  const urlError = searchParams.get('error');

  // Auto-detect role based on email domain and context
  useEffect(() => {
    if (!formData.email) {
      setDetectedRole(null);
      setSelectedRole('owner');
      return;
    }

    const email = formData.email.toLowerCase().trim();
    let detected: DetectedRole | null = null;

    // SuperAdmin detection
    if (email.includes('superadmin') || email.includes('admin') || email.endsWith('@booqing.my.id')) {
      detected = {
        type: 'superadmin',
        confidence: 'high',
        reasons: ['SuperAdmin email pattern detected']
      };
    }
    // Staff detection
    else if (email.includes('@staff.') || email.includes('staff@') || email.startsWith('staff')) {
      detected = {
        type: 'staff',
        confidence: 'high',
        reasons: ['Staff email pattern detected']
      };
    }
    // Default to Owner
    else {
      detected = {
        type: 'owner',
        confidence: 'medium',
        reasons: ['Default user type']
      };
    }

    setDetectedRole(detected);
    setSelectedRole(detected.type);
  }, [formData.email]);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'owner': return 'Business Owner';
      case 'staff': return 'Staff Member';
      default: return 'User';
    }
  };

  const getRoleDescription = (role: DetectedRole | null) => {
    if (!role) return '';
    switch (role.type) {
      case 'superadmin':
        return 'Platform-wide administrator with full access';
      case 'owner':
        return 'Business owner with complete control';
      case 'staff':
        return 'Staff member with assigned permissions';
      default:
        return 'Platform user';
    }
  };

  const getRoleDescriptionColor = (role: DetectedRole | null) => {
    if (!role) return 'text-gray-600';
    switch (role.type) {
      case 'superadmin': return 'text-purple-800';
      case 'owner': return 'text-blue-800';
      case 'staff': return 'text-green-800';
      default:
        return 'text-gray-600';
    }
  };

  const getEmailInputClass = (role: DetectedRole | null) => {
    if (!role) return '';
    return role.confidence === 'high' ? 'ring-2 ring-purple-500 focus:ring-purple-500' : '';
  };

  const getPasswordPlaceholder = (role: DetectedRole | null) => {
    switch (role?.type) {
      case 'superadmin': return 'SuperAdmin password';
      case 'owner': return 'Your business password';
      case 'staff': return 'Staff password';
      default:
        return 'Enter your password';
    }
  };

  const getAvailableRoles = (currentRole: DetectedRole | null) => {
    const baseRoles = [
    { value: 'owner', label: 'Owner', icon: User },
    { value: 'staff', label: 'Staff', icon: Users }
  ];
    
    if (currentRole?.type !== 'superadmin') {
      return [
        ...baseRoles
      ];
    }
    
    // For superadmin, allow override to other roles for testing
    return baseRoles;
  };

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
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          loginType: selectedRole || (detectedRole?.type || 'owner'),
        }),
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
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    // Re-detect role when email changes
    if (field === 'email') {
      const newEmail = value.toLowerCase().trim();
      let detected: DetectedRole | null = null;

      if (newEmail.includes('superadmin') || newEmail.includes('admin') || newEmail.endsWith('@booqing.my.id')) {
        detected = {
          type: 'superadmin',
          confidence: 'high',
          reasons: ['SuperAdmin email pattern detected']
        };
      } else if (newEmail.includes('@staff.') || newEmail.includes('staff@') || newEmail.startsWith('staff')) {
        detected = {
          type: 'staff',
          confidence: 'high',
          reasons: ['Staff email pattern detected']
        };
      } else {
        detected = {
          type: 'owner',
          confidence: 'medium',
          reasons: ['Default user type']
        };
      }

      setDetectedRole(detected);
      setSelectedRole(detected.type);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your dashboard
          {detectedRole && (
            <span className={`text-xs ${getRoleDescriptionColor(detectedRole)} mt-2`}>
              Auto-detected: {getRoleDisplayName(detectedRole.type)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
              className={`pr-10 ${getEmailInputClass(detectedRole)}`}
            />
            {detectedRole && (
              <div className={`text-xs ${getRoleDescriptionColor(detectedRole)}`}>
                <Info className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  Detected: {getRoleDisplayName(detectedRole.type)}
                </span>
                <span className="text-xs opacity-75">
                  {getRoleDescription(detectedRole)}
                </span>
              </div>
            )}
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
                placeholder={getPasswordPlaceholder(detectedRole)}
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

          {/* Role Override Option */}
          {detectedRole && (
            <div className="space-y-2">
              <Label>Login as</Label>
              <div className="flex flex-wrap gap-2">
                {getAvailableRoles(detectedRole).map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      selectedRole === role.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {role.icon && <role.icon className="w-4 h-4" />}
                      {role.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Development Mode Help */}
          {process.env.NODE_ENV === 'development' && !detectedRole && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Development Tips:</span>
              </div>
              <ul className="text-yellow-700 space-y-1 mt-1">
                <li>• SuperAdmin: admin@booqing.my.id</li>
                <li>• Use your real business email for owner login</li>
                <li>• Auto-detection works best for most users</li>
              </ul>
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
              <>
                {detectedRole ? (
                  <div className="flex items-center gap-2">
                    {getRoleIcon(detectedRole.type)}
                    <span>Sign In as {detectedRole.type.charAt(0).toUpperCase() + detectedRole.type.slice(1)}</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </>
            )}
          </Button>
        </form>

        {/* Help Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Forgot your password?{' '}
            <a
              href="mailto:support@booqing.my.id"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Contact Support
            </a>
          </p>
          <p className="text-xs text-gray-500">
            Having trouble? Try our{' '}
            <a href="/demo" className="text-blue-600 hover:underline text-xs">
              demo site
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getRoleIcon(roleType: string) {
  switch (roleType) {
    case 'superadmin':
      return <Shield className="w-4 h-4" />;
    case 'owner':
      return <User className="w-4 h-4" />;
    case 'staff':
      return <Users className="w-4 h-4" />;
    default:
      return null;
  }
}
