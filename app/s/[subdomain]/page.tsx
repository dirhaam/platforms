import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TenantService } from '@/lib/subdomain/tenant-service';
import TenantLandingPage from '@/components/subdomain/TenantLandingPage';
import ModernTemplate from '@/components/subdomain/templates/ModernTemplate';

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
  
  // Get tenant data
  const tenantData = await TenantService.getTenantLandingData(subdomain);
  
  if (!tenantData) {
    notFound();
  }

  // Get services and business hours
  const [services, businessHours] = await Promise.all([
    TenantService.getTenantServices(tenantData.id),
    TenantService.getTenantBusinessHours(tenantData.id),
  ]);

  // Select template based on tenant preferences or business category
  const templateId = tenantData.template.id;

  // Render appropriate template
  switch (templateId) {
    case 'modern':
      return (
        <ModernTemplate
          tenant={tenantData}
          services={services}
          businessHours={businessHours || undefined}
        />
      );
    
    case 'classic':
    case 'minimal':
    case 'beauty':
    case 'healthcare':
    default:
      // For now, use the default TenantLandingPage for other templates
      // Additional template components can be created later
      return (
        <TenantLandingPage
          tenant={tenantData}
          services={services}
          businessHours={businessHours || undefined}
          template={templateId as 'modern' | 'classic' | 'minimal'}
        />
      );
  }
}
