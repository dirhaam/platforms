import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers);
  const host = request.headers.get('host');
  const hostname = host?.split(':')[0];
  
  // Simple subdomain extraction (same logic as middleware)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const rootDomainFormatted = rootDomain.split(':')[0];
  
  let extractedSubdomain = null;
  if (hostname) {
    const isSubdomain =
      hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname.endsWith(`.${rootDomainFormatted}`);
    
    if (isSubdomain) {
      extractedSubdomain = hostname.replace(`.${rootDomainFormatted}`, '');
    }
  }

  return NextResponse.json({
    success: true,
    request: {
      host,
      hostname,
      rootDomain,
      rootDomainFormatted,
      extractedSubdomain,
      url: request.url,
      nextUrl: request.nextUrl.toString(),
    },
    analysis: {
      isRoot: hostname === rootDomainFormatted,
      isWWW: hostname === `www.${rootDomainFormatted}`,
      endsWithRoot: hostname?.endsWith(`.${rootDomainFormatted}`),
      couldBeSubdomain: hostname?.includes('.') && hostname?.endsWith(`.${rootDomainFormatted}`),
    },
    message: extractedSubdomain 
      ? `Subdomain "${extractedSubdomain}" detected. Try accessing https://${extractedSubdomain}.booqing.my.id/`
      : `No subdomain detected. Request is from root domain.`
  });
}
