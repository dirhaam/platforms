'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Crown, Shield, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  tenantId: string;
  tenantSubdomain: string;
  defaultRole: 'admin' | 'staff';
  roleLabel: string;
}

export function CreateUserDialog({
  tenantId,
  tenantSubdomain,
  defaultRole,
  roleLabel,
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

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

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/tenants/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: defaultRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      alert(`${roleLabel} user ${formData.name} created successfully!`);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (defaultRole === 'admin') return <Crown className="w-4 h-4" />;
    return <UserCheck className="w-4 h-4" />;
  };

  const getRoleColor = () => {
    if (defaultRole === 'admin') return 'yellow';
    return 'green';
  };

  const colorClass = getRoleColor();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          {getRoleIcon()}
          Create {roleLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create {roleLabel}</DialogTitle>
          <DialogDescription>
            Create a new {roleLabel.toLowerCase()} for <code>{tenantSubdomain}.booqing.my.id</code>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Info */}
          <div className={`p-3 rounded-lg border-2 border-${colorClass}-200 bg-${colorClass}-50`}>
            <p className={`text-sm font-medium text-${colorClass}-900`}>
              {defaultRole === 'admin' 
                ? '👑 Owner/Admin - Full access to all features'
                : '👤 Staff - Can manage assigned bookings and customers'
              }
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Min 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {/* Permissions Info */}
          {defaultRole === 'admin' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">Permissions:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Manage all bookings</li>
                <li>✓ Manage customers</li>
                <li>✓ Manage services</li>
                <li>✓ Manage staff members</li>
                <li>✓ View analytics</li>
              </ul>
            </div>
          )}

          {defaultRole === 'staff' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <p className="font-medium mb-2">Permissions:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Manage bookings</li>
                <li>✓ Manage customers</li>
                <li>✓ View assigned services</li>
                <li>✗ Cannot manage staff</li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create {roleLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
