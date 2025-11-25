export const runtime = 'nodejs';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ContactPage from '@/components/subdomain/ContactPage';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

async function getContactPageData(subdomain: string) {
  const supabase = getSupabaseClient();

  // Get tenant by subdomain
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, subdomain, business_name, business_category, logo, emoji, phone, email, address, brand_colors')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (tenantError || !tenant) {
    return null;
  }

  // Fetch active contact links
  const { data: links } = await supabase
    .from('contact_links')
    .select('id, title, url, icon, icon_type, background_color, text_color, display_order')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Fetch contact page settings
  const { data: settings } = await supabase
    .from('contact_page_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  // Fetch social media links
  const { data: socialMedia } = await supabase
    .from('tenant_social_media')
    .select('id, platform, url, display_order')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return {
    tenant: {
      id: tenant.id,
      subdomain: tenant.subdomain,
      businessName: tenant.business_name,
      businessCategory: tenant.business_category,
      logo: tenant.logo,
      emoji: tenant.emoji,
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      brandColors: tenant.brand_colors,
    },
    links: links || [],
    settings: settings ? {
      pageTitle: settings.page_title,
      pageDescription: settings.page_description,
      profileImage: settings.profile_image,
      backgroundType: settings.background_type,
      backgroundValue: settings.background_value,
      buttonStyle: settings.button_style,
      buttonShadow: settings.button_shadow,
      fontFamily: settings.font_family,
      showSocialIcons: settings.show_social_icons,
      showLogo: settings.show_logo,
    } : null,
    socialMedia: socialMedia || [],
  };
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getContactPageData(subdomain);

  if (!data) {
    return {
      title: 'Page Not Found'
    };
  }

  const title = data.settings?.pageTitle || data.tenant.businessName;
  const description = data.settings?.pageDescription || `Connect with ${data.tenant.businessName}`;

  return {
    title: `${title} - Contact`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function ContactPageRoute({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  const data = await getContactPageData(subdomain);
  
  if (!data) {
    notFound();
  }

  return (
    <ContactPage
      tenant={data.tenant}
      links={data.links}
      settings={data.settings}
      socialMedia={data.socialMedia}
    />
  );
}
