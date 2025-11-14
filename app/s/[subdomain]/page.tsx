export const runtime = 'nodejs';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TenantService } from '@/lib/subdomain/tenant-service';
import TenantLandingPage from '@/components/subdomain/TenantLandingPage';
import ModernTemplate from '@/components/subdomain/templates/ModernTemplate';
import ClassicTemplate from '@/components/subdomain/templates/ClassicTemplate';
import MinimalTemplate from '@/components/subdomain/templates/MinimalTemplate';
import BeautyTemplate from '@/components/subdomain/templates/BeautyTemplate';
import HealthcareTemplate from '@/components/subdomain/templates/HealthcareTemplate';
import HealthcareV2Template from '@/components/subdomain/templates/HealthcareV2Template';

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenantData = await TenantService.getTenantLandingData(subdomain);

  if (!tenantData) {
    return {
      title: 'Page Not Found'
    };
  }

  return {
    title: `${tenantData.businessName} - Professional ${tenantData.businessCategory}`,
    description: tenantData.businessDescription || `${tenantData.businessName} - Professional ${tenantData.businessCategory} services. Book your appointment today.`,
    keywords: `${tenantData.businessCategory}, ${tenantData.businessName}, booking, appointment, ${subdomain}`,
    openGraph: {
      title: tenantData.businessName,
      description: tenantData.businessDescription || `Professional ${tenantData.businessCategory} services`,
      type: 'website',
      locale: 'en_US',
    },
  };
}

export default async function SubdomainPage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  console.log('[SubdomainPage] Rendering for subdomain:', subdomain);
  
  try {
    // Get tenant data
    console.log('[SubdomainPage] Getting tenant landing data...');
    const tenantData = await TenantService.getTenantLandingData(subdomain);
    
    console.log('[SubdomainPage] Tenant data received:', tenantData ? 'YES' : 'NO');
    
    if (!tenantData) {
      console.error('[SubdomainPage] No tenant data found, calling notFound()');
      notFound();
    }

    console.log('[SubdomainPage] Tenant ID:', tenantData.id);
    console.log('[SubdomainPage] Tenant Name:', tenantData.businessName);

    // Get services, business hours, and media data
    const [services, businessHours, videos, socialMedia, galleries] = await Promise.all([
      TenantService.getTenantServices(tenantData.id),
      TenantService.getTenantBusinessHours(tenantData.id),
      TenantService.getTenantVideos(tenantData.id),
      TenantService.getTenantSocialMedia(tenantData.id),
      TenantService.getTenantGalleries(tenantData.id),
    ]);
    
    console.log('[SubdomainPage] Business Hours received:', businessHours);
    console.log('[SubdomainPage] Services received - count:', services.length);
    if (services.length > 0) {
      console.log('[SubdomainPage] First service:', {
        id: services[0].id,
        name: services[0].name,
        tenantId: services[0].tenantId
      });
    }

    // Select template based on tenant preferences
    const templateId = tenantData.template?.id || 'modern';

    // Render appropriate template
    switch (templateId) {
      case 'modern':
        return (
          <ModernTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      case 'classic':
        return (
          <ClassicTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      case 'minimal':
        return (
          <MinimalTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      case 'beauty':
        return (
          <BeautyTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      case 'healthcare':
        return (
          <HealthcareTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      case 'healthcarev2':
        return (
          <HealthcareV2Template
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
      
      default:
        // Fallback to Modern if template not found
        return (
          <ModernTemplate
            tenant={tenantData}
            services={services}
            businessHours={businessHours || undefined}
            videos={videos}
            socialMedia={socialMedia}
            galleries={galleries}
          />
        );
    }
  } catch (error) {
    console.error('[SubdomainPage] Error:', error);
    console.error('[SubdomainPage] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[SubdomainPage] Stack:', error instanceof Error ? error.stack : 'N/A');
    notFound();
  }
}
