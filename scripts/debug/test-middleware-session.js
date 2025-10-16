// Test middleware behavior with session
const http = require('http');

class BrowserSimulator {
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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
            cookies: Array.from(this.cookies.entries())
          });
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

async function testMiddlewareFlow() {
  console.log('=== Testing Middleware Flow ===');
  
  const browser = new BrowserSimulator();

  // Step 1: Login first
  console.log('1. Logging in...');
  const loginData = JSON.stringify({
    email: 'dirhams@mail.com',
    password: 'admin123',
    loginType: 'owner'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'Host': 'www.localhost:3000',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const loginResponse = await browser.request(loginOptions, loginData);
  console.log('Login Status:', loginResponse.status);
  console.log('Session Cookie Set:', browser.cookies.has('tenant-auth'));

  // Step 2: Test various admin routes
  const routes = [
    '/admin',
    '/admin/dashboard',
    '/admin/bookings',
    '/login', // Should not redirect if already logged in
    '/'      // Root
  ];

  for (const route of routes) {
    console.log(`\n2. Testing route: ${route}`);
    
    const routeOptions = {
      hostname: 'localhost',
      port: 3000,
      path: route,
      method: 'GET',
      headers: {
        'Host': 'www.localhost:3000',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const routeResponse = await browser.request(routeOptions);
    
    console.log(`  Status: ${routeResponse.status}`);
    console.log(`  Content-Type: ${routeResponse.headers['content-type']}`);
    console.log(`  Location Redirect: ${routeResponse.headers['location'] || 'none'}`);
    
    // Check if response indicates redirect
    if (routeResponse.status >= 300 && routeResponse.status < 400) {
      console.log(`  🔄 Redirected to: ${routeResponse.headers['location']}`);
    } else if (routeResponse.status === 200) {
      console.log(`  ✅ Success: ${routeResponse.data.substring(0, 100)}...`);
    } else {
      console.log(`  ❌ Error: ${routeResponse.data.substring(0, 200)}...`);
    }

    // Check for specific authentication indicators
    const data = routeResponse.data.toLowerCase();
    if (data.includes('sign in') || data.includes('login')) {
      console.log(`  🚨 Still showing login page`);
    }
    if (data.includes('dashboard') || data.includes('admin')) {
      console.log(`  ✅ Shows admin/dashboard content`);
    }
  }

  // Step 3: Test without session (clear cookies)
  console.log('\n3. Testing without session...');
  browser.cookies.clear();
  
  const noSessionOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: {
      'Host': 'www.localhost:3000',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const noSessionResponse = await browser.request(noSessionOptions);
  console.log('No Session Status:', noSessionResponse.status);
  console.log('Redirected to:', noSessionResponse.headers['location'] || 'none');
}

testMiddlewareFlow().catch(console.error);
