'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Key } from 'lucide-react';

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  canAccessAllTenants: boolean;
  lastLoginAt: string | null;
  loginAttempts: number;
  lockedUntil: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export function SuperAdminsList({ currentUserEmail }: { currentUserEmail: string }) {
  const [superadmins, setSuperadmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuperAdmins = async () => {
      try {
        const response = await fetch('/api/admin/superadmins');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch superadmins');
        }

        setSuperadmins(data.superadmins || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch superadmins');
        console.error('Error fetching superadmins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuperAdmins();
  }, []);

  const activeSuperadmins = superadmins.filter(sa => sa.isActive).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total SuperAdmins</p>
                <p className="text-2xl font-bold text-gray-900">{superadmins.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active SuperAdmins</p>
                <p className="text-2xl font-bold text-gray-900">{activeSuperadmins}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Level</p>
                <p className="text-2xl font-bold text-green-600">High</p>
              </div>
              <Key className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current SuperAdmins</CardTitle>
          <CardDescription>
            List of all platform super administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading superadmins...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error: {error}
            </div>
          ) : superadmins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No superadmins found
            </div>
          ) : (
            <div className="space-y-4">
              {superadmins.map(sa => (
                <div key={sa.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{sa.name}</p>
                      <p className="text-sm text-gray-500">{sa.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sa.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sa.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {sa.email === currentUserEmail && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Current User
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
