// Test middleware specific behavior
const http = require('http');

class MiddlewareTester {
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
            data: data.substring(0, 500), // Limit output for clarity
          });
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

async function testMiddlewareIssues() {
  console.log('🔍 MIDDLEWARE SPECIFIC TESTING');
  console.log('===============================');
  
  const tester = new MiddlewareTester();

  // STEP 1: Get working session
  console.log('\n🔐 Step 1: Login to get session');
  
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
  console.log('Has cookies:', tester.cookies.has('tenant-auth'));
  
  if (!loginResponse || loginResponse.status !== 200) {
    console.log('❌ Login failed, cannot test middleware');
    return;
  }

  // STEP 2: Test various URL patterns with same session
  console.log('\n🚪 Step 2: Test Middleware URL Patterns');
  
  const urlTests = [
    {
      name: 'admin/dashboard (www)',
      host: 'www.localhost:3000',
      path: '/admin/dashboard',
      expectedType: 'should_work'
    },
    {
      name: 'admin/bookings (www)',
      host: 'www.localhost:3000', 
      path: '/admin/bookings',
      expectedType: 'should_work'
    },
    {
      name: 'admin (www)',
      host: 'www.localhost:3000',
      path: '/admin',
      expectedType: 'should_work_or_redirect'
    },
    {
      name: 'admin/dashboard (no subdomain)',
      host: 'localhost:3000',
      path: '/admin/dashboard',
      expectedType: 'should_redirect_to_login'
    },
    {
      name: 'root path (www)',
      host: 'www.localhost:3000',
      path: '/',
      expectedType: 'should_rewrite_or_work'
    },
    {
      name: 'root path (no subdomain)',
      host: 'localhost:3000',
      path: '/',
      expectedType: 'should_work'
    }
  ];

  for (const test of urlTests) {
    console.log(`\n🔗 ${test.name}`);
    console.log(`   URL: http://${test.host}${test.path}`);
    
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
      
      // Analyze based on status
      if (response.status === 200) {
        console.log(`   ✅ Direct access allowed`);
        
        // Check content type
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.log(`   📄 HTML content response`);
          
          // Check for login page indicators
          if (response.data.toLowerCase().includes('sign in') || 
              response.data.toLowerCase().includes('login')) {
            console.log(`   🚨 Still shows login page (shouldn't with valid session)`);
          } else {
            console.log(`   ✅ Shows admin/dashboard content`);
          }
        } else {
          console.log(`   📄 Content: ${contentType}`);
        }
        
      } else if (response.status >= 300 && response.status < 400) {
        console.log(`   🔄 Redirect: ${response.headers.location}`);
        
        // Analyze redirect
        const location = response.headers.location || '';
        if (location.includes('login')) {
          console.log(`   🚨 Redirected to login (session not recognized)`);
        } else if (location.includes('unauthorized')) {
          console.log(`   🚨 Redirected to unauthorized (permissions issue)`);
        } else {
          console.log(`   ℹ️  Other redirect`);
        }
        
      } else if (response.status === 404) {
        console.log(`   ❌ 404 Not Found - DNS or routing issue`);
        console.log(`   🔍 This might indicate middleware rewrites aren't working`);
        
      } else if (response.status === 500) {
        console.log(`   ❌ 500 Server Error`);
        if (response.data.length > 0) {
          console.log(`   Error preview: ${response.data.substring(0, 200)}...`);
        }
      } else {
        console.log(`   ❌ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request error: ${error.message}`);
    }
  }

  // STEP 3: Test edgeauth session retrieval
  console.log('\n🧠 Step 3: Test EdgeAuth Session Logic');
  
  console.log('Current cookies:');
  for (const [name, data] of tester.cookies.entries()) {
    console.log(`  ${name}: ${data.value.substring(0, 20)}...`);
    console.log(`    HttpOnly: ${data.attributes.httponly}`);
    console.log(`    Secure: ${data.attributes.secure}`);
    console.log(`    SameSite: ${data.attributes.samesite}`);
  }

  // STEP 4: Debug session content
  console.log('\n📊 Step 4: Debug Session Content');
  
  try {
    const sessionTestResponse = await tester.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/debug/session',
      method: 'GET',
      headers: {
        'Host': 'www.localhost:3000'
      }
    });
    
    console.log('Session Debug Status:', sessionTestResponse.status);
    if (sessionTestResponse.status === 200) {
      console.log('✅ Session debug API working');
      console.log('Response:', sessionTestResponse.data);
    } else if (sessionTestResponse.status === 404) {
      console.log('ℹ️  Session debug API not implemented (normal)');
    }
  } catch (error) {
    console.log('Session debug failed:', error.message);
  }
}

testMiddlewareIssues().catch(console.error);
