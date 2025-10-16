'use client';

import { useState, useEffect } from 'react';

export default function SimpleLoginForm() {
  const [email, setEmail] = useState('admin@booqing.my.id');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🎯 SimpleLoginForm mounted');
    return () => console.log('🎯 SimpleLoginForm unmounted');
  }, []);

  const handleLogin = () => {
    console.log('🚀 Simple login started!');
    console.log('📧 Email:', email);
    console.log('📍 Current URL:', window.location.href);
    
    setLoading(true);
    
    // Set session - try both localStorage and sessionStorage
    const sessionData = {
      userId: 'test-id',
      tenantId: 'platform',
      role: 'superadmin',
      permissions: ['*'],
      email: email,
      name: 'Test Admin',
      isSuperAdmin: true,
    };
    
    console.log('💾 Setting session data:', sessionData);
    
    // Method 1: Try localStorage (most reliable for local development)
    try {
      localStorage.setItem('auth-token', JSON.stringify(sessionData));
      console.log('✅ localStorage set successfully');
    } catch (error) {
      console.error('❌ localStorage failed:', error);
    }
    
    // Method 2: Try sessionStorage
    try {
      sessionStorage.setItem('auth-token', JSON.stringify(sessionData));
      console.log('✅ sessionStorage set successfully');
    } catch (error) {
      console.error('❌ sessionStorage failed:', error);
    }
    
    // Method 3: Still try cookie (might work on some browsers)
    const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
    const cookieString = `auth-token=${cookieValue}; path=/; max-age=3600; SameSite=Lax;`;
    
    document.cookie = cookieString;
    console.log('🍪 Cookie string set:', cookieString);
    console.log('🍪 Current cookies after setting:', document.cookie);
    
    // 立即验证cookie是否设置成功
    setTimeout(() => {
      console.log('🍪 Cookies after 500ms:', document.cookie);
      
      // Try to read it back
      const cookies = document.cookie.split(';').reduce((acc: { [key: string]: string }, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('🍪 Parsed cookies:', cookies);
      const storedToken = cookies['auth-token'];
      if (storedToken) {
        try {
          const parsed = JSON.parse(decodeURIComponent(storedToken));
          console.log('🍪 Successfully stored token:', parsed);
        } catch (error) {
          console.error('🍪 Failed to parse stored token:', error);
        }
      } else {
        console.error('🍪 No auth-token found in cookies!');
      }
    }, 500);
    
    // Test redirect
    console.log('🔄 About to redirect...');
    
    // Wait longer for cookie to be set properly
    setTimeout(() => {
      console.log('⏰ Verifying cookie before redirect...');
      
      // Final verification before redirect
      // Try localStorage first
      let storedToken = null;
      try {
        storedToken = localStorage.getItem('auth-token');
        console.log('📋 localStorage check:', storedToken ? 'FOUND' : 'NOT FOUND');
      } catch (error) {
        console.error('❌ localStorage check failed:', error);
      }
      
      // Fallback to sessionStorage
      if (!storedToken) {
        try {
          storedToken = sessionStorage.getItem('auth-token');
          console.log('📋 sessionStorage check:', storedToken ? 'FOUND' : 'NOT FOUND');
        } catch (error) {
          console.error('❌ sessionStorage check failed:', error);
        }
      }
      
      // Fallback to cookies
      if (!storedToken) {
        const cookies = document.cookie.split(';').reduce((acc: { [key: string]: string }, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {});
        storedToken = cookies['auth-token'];
        console.log('🍪 Cookie check:', storedToken ? 'FOUND' : 'NOT FOUND');
      }
      if (storedToken) {
        try {
          const parsed = JSON.parse(decodeURIComponent(storedToken));
          console.log('✅ Final verification success - token valid:', parsed.email);
          
          // Now safe to redirect
          console.log('🚀 Redirecting now...');
          window.location.href = 'http://localhost:3000/test-success';
        } catch (error) {
          console.error('❌ Final verification failed:', error);
        }
      } else {
        console.error('❌ Final verification failed - no token found');
      }
    }, 2000); // Increased wait time
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Simple Login Test</h2>
      <div className="text-gray-600 mb-4">
        Current URL: 
        <span suppressHydrationWarning>
          {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
        </span>
      </div>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border rounded mb-4"
      />
      
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 mb-2"
      >
        {loading ? 'Loading...' : 'Login'}
      </button>
      
      {/* Test manual redirect */}
      <button
        onClick={() => {
          console.log('🧪 Manual redirect test to success page');
          
          // Test if success page exists by checking different targets
          try {
            console.log(' Trying http://localhost:3000/test-success...');
            const newWindow = window.open('http://localhost:3000/test-success', '_blank');
            if (newWindow) {
              newWindow.close();
              console.log(' Success page exists! Redirecting main window...');
              window.location.href = 'http://localhost:3000/test-success';
            } else {
              console.log(' Popup blocked. Trying alternative...');
            }
          } catch (error) {
            console.error(' Redirect failed:', error);
          }
        }}
        className="w-full bg-green-600 text-white p-2 rounded mb-2"
      >
        Test Success Page Exists
      </button>
      
      {/* Bypass redirect */}
      <button
        onClick={() => {
          console.log('🧪 Creating manual success page');
          window.location.href = '/admin/dashboard';
        }}
        className="w-full bg-blue-600 text-white p-2 rounded mb-2"
      >
        Go to Dashboard (Bypass)
      </button>
      
      {/* Test cookie setting */}
      <button
        onClick={() => {
          console.log('🧪 Cookie test');
          document.cookie = 'test=test123; path=/; max-age=3600';
          console.log('Cookie set:', document.cookie);
        }}
        className="w-full bg-purple-600 text-white p-2 rounded"
      >
        Test Cookie Set
      </button>
    </div>
  );
}
