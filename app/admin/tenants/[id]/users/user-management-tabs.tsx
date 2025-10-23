'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Shield, UserCheck, Plus, Trash2, Edit2 } from 'lucide-react';
import { CreateUserDialog } from './create-user-dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface UserManagementTabsProps {
  tenantId: string;
  tenantSubdomain: string;
  owner: User | null;
  admins: User[];
  staff: User[];
}

export function UserManagementTabs({
  tenantId,
  tenantSubdomain,
  owner,
  admins,
  staff,
}: UserManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<'owner' | 'admin' | 'staff'>('owner');

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('owner')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition ${
            activeTab === 'owner'
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Crown className="w-4 h-4 inline mr-2" />
          Owner
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition ${
            activeTab === 'admin'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Admin ({admins.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition ${
            activeTab === 'staff'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />
          Staff ({staff.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'owner' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Business Owner
              </CardTitle>
              <CardDescription>
                The primary owner of {tenantSubdomain}.booqing.my.id
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {owner ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{owner.name}</td>
                      <td className="py-3 px-4">{owner.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          owner.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {owner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(owner.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-500">No owner assigned yet</p>
                <CreateUserDialog
                  tenantId={tenantId}
                  tenantSubdomain={tenantSubdomain}
                  defaultRole="admin"
                  roleLabel="Owner"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'admin' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Administrators
              </CardTitle>
              <CardDescription>
                Users with admin permissions
              </CardDescription>
            </div>
            <CreateUserDialog
              tenantId={tenantId}
              tenantSubdomain={tenantSubdomain}
              defaultRole="admin"
              roleLabel="Admin"
            />
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No admins yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{admin.name}</td>
                        <td className="py-3 px-4">{admin.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            admin.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'staff' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Staff Members
              </CardTitle>
              <CardDescription>
                Regular staff users
              </CardDescription>
            </div>
            <CreateUserDialog
              tenantId={tenantId}
              tenantSubdomain={tenantSubdomain}
              defaultRole="staff"
              roleLabel="Staff"
            />
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staff yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{member.name}</td>
                        <td className="py-3 px-4">{member.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
