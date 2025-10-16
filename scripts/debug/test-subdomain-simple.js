const fs = require('fs');

// Test subdomain extraction logic with debugging
function testSubdomainExtraction() {
  console.log('=== Testing Subdomain Extraction ===');
  
  // Read environment variables
  let envContent = '';
  try {
    envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }

  // Exact same logic as in route.ts
  const hostname = 'www.booqing.my.id';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'booqing.my.id';
  const rootDomainFormatted = rootDomain.split(':')[0];
  
  console.log('Hostname:', hostname);
  console.log('Root Domain:', rootDomain);
  console.log('Root Domain Formatted:', `'${rootDomainFormatted}'`);
  
  // Step by step logic
  console.log('\n--- Step by Step Logic ---');
  console.log('1. hostname !== rootDomainFormatted:', hostname !== rootDomainFormatted);
  console.log('2. hostname.endsWith(`.${rootDomainFormatted}`):', hostname.endsWith(`.${rootDomainFormatted}`));
  console.log(`3. .${rootDomainFormatted} = '.${rootDomainFormatted}'`);
  
  const isSubdomain = 
    hostname !== rootDomainFormatted && 
    hostname.endsWith(`.${rootDomainFormatted}`);

  console.log('4. isSubdomain =', isSubdomain);
  
  let subdomain = null;
  if (isSubdomain) {
    subdomain = hostname.replace(`.${rootDomainFormatted}`, '');
  }
  
  console.log('5. Extracted Subdomain:', subdomain);
  console.log('Expected: www');
  
  // Test what энд with returns
  console.log('\n--- String.endsWith() Debug ---');
  const suffix = `.${rootDomainFormatted}`;
  console.log(`Testing: '${hostname}'.endsWith('${suffix}')`);
  console.log('Result:', hostname.endsWith(suffix));
  console.log('Last characters:', hostname.slice(-suffix.length));
  console.log('Should match:', suffix);
}

testSubdomainExtraction();
