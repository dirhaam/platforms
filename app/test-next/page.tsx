export default function TestNextPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px' }}>
      <h1>✅ Next.js App is Working!</h1>
      <p>If you see this page, the Next.js app is deployed correctly on Vercel.</p>
      <hr />
      <h2>Testing Subdomain Routing</h2>
      
      <h3>Step 1: Check request headers from root domain</h3>
      <p>
        <a href="/api/debug/request-headers" target="_blank">
          /api/debug/request-headers
        </a>
      </p>
      
      <h3>Step 2: Access subdomain</h3>
      <p>
        Try accessing: <code>https://demo.booqing.my.id/</code>
      </p>
      
      <h3>Current Debug Info:</h3>
      <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
{`Host: ${typeof window !== 'undefined' ? window.location.hostname : 'N/A (server-side)'}
Pathname: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
`}
      </pre>
    </div>
  );
}
