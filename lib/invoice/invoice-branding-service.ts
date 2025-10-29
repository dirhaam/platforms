import { createClient } from '@supabase/supabase-js';

export interface InvoiceBrandingSettings {
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
}

const CACHE_KEY_PREFIX = 'invoice_branding:';

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
      const cacheKey = `${CACHE_KEY_PREFIX}${tenantId}`;

      const { data, error } = await supabase
        .from('cache')
        .select('value')
        .eq('key', cacheKey)
        .maybeSingle();

      if (error) {
        console.error('[InvoiceBranding] Failed to load settings:', error);
        return {};
      }

      if (!data?.value) {
        return {};
      }

      const settings = data.value as InvoiceBrandingSettings;
      return sanitizeSettings(settings);
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
      const cacheKey = `${CACHE_KEY_PREFIX}${tenantId}`;

      const sanitized = sanitizeSettings(settings);

      const { error } = await supabase
        .from('cache')
        .upsert(
          {
            key: cacheKey,
            value: sanitized,
            expires_at: null,
          },
          { onConflict: 'key' }
        );

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
