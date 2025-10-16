'use client';

import { useState, useEffect } from 'react';

export default function AdminSuccess() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Get cookie data
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        try {
          return JSON.parse(decodeURIComponent(cookieValue || ''));
        } catch {
          return null;
        }
      }
      return null;
    };

    const authData = getCookie('auth-token');
    if (authData) {
      setUserData(authData);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Success!
          </h2>
          
          <p className="mt-2 text-lg text-gray-600">
            You're now logged in as Super Admin
          </p>
        </div>

        <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          
          {userData ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Email:</span>
                <span className="text-gray-900">{userData.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Name:</span>
                <span className="text-gray-900">{userData.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Role:</span>
                <span className="text-green-600 font-medium">{userData.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Super Admin:</span>
                <span className="text-purple-600 font-medium">{userData.isSuperAdmin ? 'YES' : 'NO'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Permissions:</span>
                <span className="text-blue-600">{userData.permissions?.length} permissions</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No user data found in session
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.href = '/admin/dashboard'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => {
              document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.href = '/login';
            }}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/signup'}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Test Sign Up Form →
          </button>
        </div>
      </div>
    </div>
  );
}
