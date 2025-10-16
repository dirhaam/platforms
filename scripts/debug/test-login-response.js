const http = require('http');

async function testLoginWithCookies() {
  console.log('=== Testing Login with Cookie Response ===');
  
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
      'Host': 'www.booqing.my.id',
      'Referer': 'https://www.booqing.my.id/login',
      'User-Agent': 'Mozilla/5.0 (Test API)',
      'X-Forwarded-For': '127.0.0.1'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Cookies:', res.headers['set-cookie']);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('Response:', result);
          resolve({ headers: res.headers, response: result });
        } catch (e) {
          console.log('Raw Response:', body);
          resolve({ headers: res.headers, response: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testWithFetch() {
  console.log('\n=== Testing with node-fetch style ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.booqing.my.id',
        'Referer': 'https://www.booqing.my.id/login',
        'User-Agent': 'Mozilla/5.0 (Test API)',
        'X-Forwarded-For': '127.0.0.1'
      },
      body: JSON.stringify({
        email: 'dirhams@mail.com',
        password: 'admin123',
        loginType: 'owner'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Cookies:', response.headers.get('set-cookie'));
    
    const result = await response.json();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run tests
async function runTests() {
  try {
    await testLoginWithCookies();
    await testWithFetch();
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();
