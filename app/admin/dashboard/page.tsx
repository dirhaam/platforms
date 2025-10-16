'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          // Not authenticated, redirect to login
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Authentication failed</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {userData.role === 'superadmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userData.name} ({userData.email})
              </span>
              <button
                onClick={() => {
                  // Simple logout - clear cookies and redirect
                  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              🎉 Login Successful!
            </h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium">Authentication Info:</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>User ID:</strong> {userData.id}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Name:</strong> {userData.name}</p>
                  <p><strong>Role:</strong> {userData.role}</p>
                  <p><strong>Super Admin:</strong> {userData.isSuperAdmin ? 'Yes' : 'No'}</p>
                  <p><strong>Permissions:</strong> {JSON.stringify(userData.permissions)}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-blue-800 font-medium">Next Steps:</h3>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>Authentication system is working</li>
                  <li>SuperAdmin can now manage all tenants</li>
                  <li>Database connection is successful</li>
                  <li>Ready to implement admin features</li>
                </ul>
              </div>

              <div className="space-x-4 mt-6">
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Test Sign Up
                </button>
                <button
                  onClick={() => window.location.href = '/logout'}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Logout Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
