import { NextRequest, NextResponse } from 'next/server';
import { getSubdomainData } from '@/lib/subdomains';
import { getTenant } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  const subdomain = request.nextUrl.searchParams.get('subdomain') || 'demo';

  try {
    console.log(`[debug-tenant-flow] Step 1: Getting tenant for subdomain: ${subdomain}`);
    
    const tenantFromDb = await getTenant(subdomain);
    console.log(`[debug-tenant-flow] Step 2: Result from getTenant:`, {
      found: !!tenantFromDb,
      keys: tenantFromDb ? Object.keys(tenantFromDb).slice(0, 10) : null,
      businessName: tenantFromDb?.businessName,
      ownerName: tenantFromDb?.ownerName,
    });

    console.log(`[debug-tenant-flow] Step 3: Getting subdomain data`);
    const subdomainData = await getSubdomainData(subdomain);
    console.log(`[debug-tenant-flow] Step 4: Result from getSubdomainData:`, {
      found: !!subdomainData,
      businessName: subdomainData?.businessName,
      ownerName: subdomainData?.ownerName,
    });

    return NextResponse.json({
      success: true,
      subdomain,
      step1_getTenant: {
        found: !!tenantFromDb,
        hasCamelCaseProps: tenantFromDb ? ('businessName' in tenantFromDb) : false,
        hasSnakeCaseProps: tenantFromDb ? ('business_name' in tenantFromDb) : false,
        sampleData: tenantFromDb ? {
          businessName: tenantFromDb.businessName,
          ownerName: tenantFromDb.ownerName,
          businessCategory: tenantFromDb.businessCategory,
        } : null,
      },
      step2_getSubdomainData: {
        found: !!subdomainData,
        hasCamelCaseProps: subdomainData ? ('businessName' in subdomainData) : false,
        sampleData: subdomainData ? {
          businessName: subdomainData.businessName,
          ownerName: subdomainData.ownerName,
          businessCategory: subdomainData.businessCategory,
        } : null,
      },
    });
  } catch (error) {
    console.error('[debug-tenant-flow] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
