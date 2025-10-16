// Test all critical API endpoints and routes
const http = require('http');

class EndpointTester {
  constructor() {
    this.cookies = new Map();
  }

  parseSetCookie(setCookieHeader) {
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookies.forEach(cookieStr => {
      const [nameValue, ...attributes] = cookieStr.split(';').map(s => s.trim());
      const [name, value] = nameValue.split('=');
      if (name && value) {
        this.cookies.set(name, {
          value,
          attributes: attributes.reduce((acc, attr) => {
            const [key, val] = attr.split('=');
            acc[key.toLowerCase()] = val || true;
            return acc;
          }, {})
        });
      }
    });
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, data]) => `${name}=${data.value}`)
      .join('; ');
  }

  async request(options, body = null) {
    if (this.cookies.size > 0) {
      options.headers = options.headers || {};
      options.headers['Cookie'] = this.getCookieHeader();
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        if (res.headers['set-cookie']) {
          this.parseSetCookie(res.headers['set-cookie']);
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData,
              cookies: Array.from(this.cookies.entries())
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              cookies: Array.from(this.cookies.entries())
            });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(body);
      }
      req.end();
    });
  }
}

async function testCriticalEndpoints() {
  console.log('🧪 CRITICAL ENDPOINTS TESTING');
  console.log('==============================');
  
  const tester = new EndpointTester();

  // === API Endpoints Testing ===
  console.log('\n📡 API ENDPOINTS TEST:');
  
  const apiTests = [
    {
      name: 'Login API (www.localhost)',
      path: '/api/auth/login',
      method: 'POST',
      body: JSON.stringify({
        email: 'dirhams@mail.com',
        password: 'admin123',
        loginType: 'owner'
      }),
      headers: {
        'Host': 'www.localhost:3000',
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Login API (demo.localhost - should fail)',
      path: '/api/auth/login',
      method: 'POST',
      body: JSON.stringify({
        email: 'dirhams@mail.com',
        password: 'admin123',
        loginType: 'owner'
      }),
      headers: {
        'Host': 'demo.localhost:3000',
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'SuperAdmin Login API',
      path: '/api/auth/login',
      method: 'POST',
      body: JSON.stringify({
        email: 'dirhamrozi@gmail.com',
        password: '12345nabila',
        loginType: 'superadmin'
      }),
      headers: {
        'Host': 'localhost:3000',
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const test of apiTests) {
    console.log(`\n🔌 ${test.name}`);
    
    try {
      const response = await tester.request({
        hostname: 'localhost',
        port: 3000,
        path: test.path,
        method: test.method,
        headers: test.headers
      }, test.body);

      console.log(`   Status: ${response.status}`);
      if (response.data.success !== undefined) {
        console.log(`   Success: ${response.data.success}`);
        if (response.data.error) {
          console.log(`   Error: ${response.data.error}`);
        }
        if (response.data.user) {
          console.log(`   User Role: ${response.data.user.role}`);
        }
      }
      
      // Check for cookies
      if (response.headers['set-cookie']) {
        console.log(`   🍪 Cookies set: ${response.headers['set-cookie'].length} item(s)`);
      } else {
        console.log(`   🚨 No cookies set`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // === Protected Routes Testing (with cookies) ===
  console.log('\n🛡️  PROTECTED ROUTES TEST:');
  
  // First, login to get cookies
  console.log('\n🔐 Logging in to get session...');
  const loginResponse = await tester.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Host': 'www.localhost:3000',
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    email: 'dirhams@mail.com',
    password: 'admin123',
    loginType: 'owner'
  }));

  console.log('Login Status:', loginResponse.status);
  console.log('Has session cookie:', loginResponse.data.success && tester.cookies.has('tenant-auth'));

  if (loginResponse.data.success) {
    const protectedRouteTests = [
      {
        name: 'Admin Dashboard (www)',
        path: '/admin/dashboard',
        host: 'www.localhost:3000'
      },
      {
        name: 'Admin Bookings (www)',
        path: '/admin/bookings', 
        host: 'www.localhost:3000'
      },
      {
        name: 'Admin Root (www)',
        path: '/admin',
        host: 'www.localhost:3000'
      },
      {
        name: 'Admin Dashboard (no subdomain)',
        path: '/admin/dashboard',
        host: 'localhost:3000'
      }
    ];

    for (const test of protectedRouteTests) {
      console.log(`\n🏠 ${test.name}`);
      
      try {
        const response = await tester.request({
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: 'GET',
          headers: {
            'Host': test.host,
            'User-Agent': 'Mozilla/5.0'
          }
        });

        console.log(`   Status: ${response.status}`);
        
        if (response.status >= 300 && response.status < 400) {
          // Redirect
          console.log(`   🔄 Redirected to: ${response.headers.location}`);
          if (response.headers.location?.includes('login')) {
            console.log(`   🚨 Redirected to login (should not happen with valid session)`);
          }
        } else if (response.status === 200) {
          console.log(`   ✅ Access granted`);
          
          // Check content
          const content = response.data.toLowerCase();
          if (content.includes('sign in') || content.includes('login')) {
            console.log(`   🚨 Still showing login page`);
          } else if (content.includes('dashboard') || content.includes('admin')) {
            console.log(`   ✅ Shows admin content`);
          }
        } else if (response.status === 404) {
          console.log(`   🚨 404 Not Found (middleware issue?)`);
        } else {
          console.log(`   ❌ Unexpected status: ${response.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  // === Subdomain Route Testing ===
  console.log('\n🌐 SUBDOMAIN ROUTE TEST:');
  
  const subdomainTests = [
    { host: 'www.localhost:3000', path: '/' },
    { host: 'demo.localhost:3000', path: '/' },
    { host: 'api.localhost:3000', path: '/' },
    { host: 'localhost:3000', path: '/' }
  ];

  for (const test of subdomainTests) {
    console.log(`\n🔗 ${test.host}${test.path}`);
    
    try {
      const response = await tester.request({
        hostname: 'localhost',
        port: 3000,
        path: test.path,
        method: 'GET',
        headers: {
          'Host': test.host
        }
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.status >= 300 && response.status < 400) {
        console.log(`   🔄 Redirect to: ${response.headers.location}`);
      } else if (response.status === 200) {
        console.log(`   ✅ Success`);
        // Check if it's rewritten to subdomain page
        if (test.host !== 'localhost:3000' && response.headers['x-matched-path']) {
          console.log(`   📍 Rewritten to: ${response.headers['x-matched-path']}`);
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // === Environment Variable Test ===
  console.log('\n⚙️  ENVIRONMENT VARIABLE TEST:');
  
  try {
    const envTestResponse = await tester.request({
      hostname: 'localhost', 
      port: 3000,
      path: '/api/test/env',
      method: 'GET'
    });
    
    console.log(`Env Test Status: ${envTestResponse.status}`);
    if (envTestResponse.status === 200) {
      console.log('✅ Environment test API working');
    } else if (envTestResponse.status === 404) {
      console.log('ℹ️  Environment test API not implemented (normal)');
    }
  } catch (error) {
    console.log('Environment test failed:', error.message);
  }

  console.log('\n🎯 CRITICAL ISSUES SUMMARY:');
  console.log('==========================');
  console.log('1. Check if login API sets cookies properly');
  console.log('2. Verify subdomain extraction is working');
  console.log('3. Test middleware redirect logic');
  console.log('4. Check RLS policies impact on API calls');
  console.log('5. Validate session persistence across requests');
}

testCriticalEndpoints().catch(console.error);
