import { NextResponse } from 'next/server';
import { rootDomain, protocol } from '@/lib/utils';

export async function GET() {
  return NextResponse.json({
    rootDomain,
    protocol,
    nodeEnv: process.env.NODE_ENV,
    nextPublicRootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    message: 'For subdomain demo.booqing.my.id to work, NEXT_PUBLIC_ROOT_DOMAIN should be set to booqing.my.id'
  });
}
