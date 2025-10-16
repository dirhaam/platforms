const http = require('http');

async function testLocalhostCookie() {
  console.log('=== Testing Localhost Cookie & Session ===');
  
  const testData = {
    email: 'dirhams@mail.com',
    password: 'admin123',
    loginType: 'owner'
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Host': 'demo.localhost:3000',
      'Referer': 'http://demo.localhost:3000/login',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  console.log('Test Config:');
  console.log('- Host:', options.headers.Host);
  console.log('- Referer:', options.headers.Referer);
  console.log('- Data:', testData);

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('\n=== Response ===');
      console.log('Status:', res.statusCode);
      console.log('Status Message:', res.statusMessage);
      console.log('Headers:');
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Check specifically for cookies
      if (res.headers['set-cookie']) {
        console.log('\n=== Cookies Received ===');
        res.headers['set-cookie'].forEach((cookie, index) => {
          console.log(`Cookie ${index + 1}: ${cookie}`);
        });
        
        // Parse cookie for analysis
        const authCookie = res.headers['set-cookie'].find(c => c.includes('tenant-auth'));
        if (authCookie) {
          console.log('\n=== Auth Cookie Analysis ===');
          const parts = authCookie.split(';').map(p => p.trim());
          const [nameValue] = parts[0].split('=');
          const cookieName = nameValue;
          const cookieValue = parts[0].split('=')[1];
          
          console.log('Cookie Name:', cookieName);
          console.log('Cookie Value Length:', cookieValue?.length || 0);
          console.log('Cookie Value Preview:', cookieValue?.substring(0, 50) + (cookieValue?.length > 50 ? '...' : ''));
          
          // Check if inline session or session ID
          if (cookieValue?.startsWith('inline.')) {
            console.log('Session Type: INLINE (base64 encoded)');
            try {
              const decoded = Buffer.from(cookieValue.slice(7), 'base64').toString('utf-8');
              console.log('Decoded Session:', JSON.parse(decoded));
            } catch (e) {
              console.log('Failed to decode inline session');
            }
          } else {
            console.log('Session Type: DATABASE ID');
            console.log('Session ID:', cookieValue);
          }
        }
      } else {
        console.log('\n❌ NO COOKIES RECEIVED!');
      }
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('\n=== Response Body ===');
          console.log('Success:', result.success);
          console.log('Error:', result.error);
          console.log('User:', result.user);
          
          // If successful, check if cookie was sent
          if (result.success && !res.headers['set-cookie']) {
            console.log('\n❌ CRITICAL: Login successful but NO cookie set!');
            console.log('This explains why no session token appears in console.');
          }
          
        } catch (e) {
          console.log('\n=== Raw Response ===');
          console.log(body);
        }
        resolve({ status: res.statusCode, headers: res.headers, body: body });
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Also test with www.localhost (this might fail)
async function testWithWww() {
  console.log('\n\n=== Testing with www.localhost (EXPECTED TO FAIL) ===');
  
  const testData = {
    email: 'dirhams@mail.com',
    password: 'admin123',
    loginType: 'owner'
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Host': 'www.localhost:3000',
      'Referer': 'http://www.localhost:3000/login',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('Status with www.localhost:', res.statusCode);
          console.log('Response:', result);
        } catch (e) {
          console.log('Raw response www.localhost:', body);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run tests
async function runCookieTests() {
  try {
    await testLocalhostCookie();
    await testWithWww();
    
    console.log('\n\n=== CONCLUSION ===');
    console.log('Check:');
    console.log('1. Does demo.localhost work and set cookies?');
    console.log('2. Does www.localhost fail (expected with no www tenant)?');
    console.log('3. Are you testing with the right subdomain?');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runCookieTests();
