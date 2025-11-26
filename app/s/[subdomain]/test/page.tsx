export const dynamic = 'force-dynamic';

export default async function TestPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Page - Dynamic Routing Works!</h1>
      <p>Subdomain parameter received: <strong>{subdomain}</strong></p>
      <p>If you see this page, the dynamic routing `/s/[subdomain]` is working.</p>
      <p>Now try accessing: <a href={`https://${subdomain}.booqing.my.id/`}>{subdomain}.booqing.my.id</a></p>
    </div>
  );
}
