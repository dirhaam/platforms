import { createClient } from '@supabase/supabase-js';

export interface InvoiceBrandingSettings {
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
}

const TABLE_NAME = 'invoice_branding_settings';

const createSupabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const sanitizeSettings = (
  settings: Partial<InvoiceBrandingSettings>
): InvoiceBrandingSettings => {
  const cleanValue = (value?: string) =>
    value?.trim().slice(0, 1000) || undefined;

  return {
    logoUrl: cleanValue(settings.logoUrl),
    headerText: cleanValue(settings.headerText),
    footerText: cleanValue(settings.footerText),
  };
};

export class InvoiceBrandingService {
  static async getSettings(tenantId: string): Promise<InvoiceBrandingSettings> {
    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('logo_url, header_text, footer_text')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        console.error('[InvoiceBranding] Failed to load settings:', error);
        return {};
      }

      if (!data) {
        return {};
      }

      return sanitizeSettings({
        logoUrl: data.logo_url ?? undefined,
        headerText: data.header_text ?? undefined,
        footerText: data.footer_text ?? undefined,
      });
    } catch (error) {
      console.error('[InvoiceBranding] Unexpected error loading settings:', error);
      return {};
    }
  }

  static async updateSettings(
    tenantId: string,
    settings: Partial<InvoiceBrandingSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseClient();
      const sanitized = sanitizeSettings(settings);
      const payload = {
        tenant_id: tenantId,
        logo_url: sanitized.logoUrl ?? null,
        header_text: sanitized.headerText ?? null,
        footer_text: sanitized.footerText ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(payload, { onConflict: 'tenant_id' });

      if (error) {
        console.error('[InvoiceBranding] Failed to save settings:', error);
        return { success: false, error: 'Failed to save invoice branding settings' };
      }

      return { success: true };
    } catch (error) {
      console.error('[InvoiceBranding] Unexpected error saving settings:', error);
      return { success: false, error: 'Unexpected error saving settings' };
    }
  }
}
