'use client';

import { useState, useEffect } from 'react';

export default function TestSuccess() {
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    // Try multiple storage methods to find auth data
    let data = null;

    // Method 1: Try localStorage
    try {
      const localStorageData = localStorage.getItem('auth-token');
      if (localStorageData) {
        data = JSON.parse(localStorageData);
        console.log('📋 Found auth data in localStorage');
      }
    } catch (error) {
      console.error('📋 localStorage error:', error);
    }

    // Method 2: Try sessionStorage
    if (!data) {
      try {
        const sessionStorageData = sessionStorage.getItem('auth-token');
        if (sessionStorageData) {
          data = JSON.parse(sessionStorageData);
          console.log('📋 Found auth data in sessionStorage');
        }
      } catch (error) {
        console.error('📋 sessionStorage error:', error);
      }
    }

    // Method 3: Try cookies (original method)
    if (!data) {
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

      data = getCookie('auth-token');
      if (data) {
        console.log('🍪 Found auth data in cookies');
      }
    }

    console.log('🔍 Final auth data:', data);
    setAuthData(data);
  }, []);

  if (!authData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Authentication Data</h1>
          <p className="text-gray-600 mb-4">Please complete login flow first.</p>
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

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
            🎉 Success!
          </h2>
          
          <p className="mt-2 text-lg text-gray-600">
            Authentication flow completed
          </p>
        </div>

        <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Data</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Email:</span>
              <span className="text-gray-900">{authData.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Name:</span>
              <span className="text-gray-900">{authData.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Role:</span>
              <span className="text-green-600 font-medium">{authData.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Super Admin:</span>
              <span className="text-purple-600 font-medium">{authData.isSuperAdmin ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Permissions:</span>
              <span className="text-blue-600">{authData.permissions?.length} total</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Tenant ID:</span>
              <span className="text-gray-900">{authData.tenantId}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              window.location.href = '/admin/dashboard';
            }}
            className="w-full flex justify-center py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 mb-2"
          >
            Go to Admin Dashboard
          </button>
          
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Login
          </button>
          
          <button
            onClick={() => {
              document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.reload();
            }}
            className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
          >
            Clear Session
          </button>
        </div>
      </div>
    </div>
  );
}
