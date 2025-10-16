// Simulate browser environment with proper cookie handling
const http = require('http');
const { URL } = require('url');

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
    // Add cookies to request
    if (this.cookies.size > 0) {
      options.headers = options.headers || {};
      options.headers['Cookie'] = this.getCookieHeader();
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        // Store cookies from response
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
              data:jsonData,
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

async function testRealBrowserFlow() {
  console.log('=== Testing Real Browser Flow Simulation ===');
  
  const browser = new BrowserSimulator();
  const loginData = {
    email: 'dirhams@mail.com',
    password: 'admin123',
    loginType: 'owner'
  };
  const postData = JSON.stringify(loginData);

  console.log('\n1. Testing Login to www.localhost:3000');
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Host': 'www.localhost:3000',
      'Referer': 'http://www.localhost:3000/login',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive'
    }
  };

  try {
    const loginResponse = await browser.request(loginOptions, postData);
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Success:', loginResponse.data.success);
    console.log('Set-Cookie Headers:', loginResponse.headers['set-cookie']);
    console.log('Stored Cookies:', loginResponse.cookies.length);
    
    if (loginResponse.cookies.length > 0) {
      console.log('Cookie Details:');
      loginResponse.cookies.forEach(([name, data]) => {
        console.log(`  ${name}: ${data.value.substring(0, 50)}...`);
        console.log(`    Secure: ${data.attributes.secure}`);
        console.log(`    HttpOnly: ${data.attributes.httponly}`);
        console.log(`    SameSite: ${data.attributes.samesite}`);
        console.log(`    Path: ${data.attributes.path}`);
        console.log(`    MaxAge: ${data.attributes['max-age']}`);
      });
    }

    // Test accessing protected route with cookies
    if (loginResponse.data.success) {
      console.log('\n2. Testing Protected Route Access');
      
      const protectedOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/dashboard',
        method: 'GET',
        headers: {
          'Host': 'www.localhost:3000',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      };

      const protectedResponse = await browser.request(protectedOptions);
      console.log('Protected Route Status:', protectedResponse.status);
      console.log('Has session:', browser.cookies.has('tenant-auth'));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRealBrowserFlow();
