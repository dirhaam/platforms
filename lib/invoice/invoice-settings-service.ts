import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export interface TaxServiceChargeSettings {
  taxPercentage: number;
  serviceChargeType: 'fixed' | 'percentage';
  serviceChargeValue: number;
  serviceChargeRequired: boolean;
}

export interface AdditionalFee {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
}

export interface InvoiceSettingsData {
  branding?: {
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  taxServiceCharge?: TaxServiceChargeSettings;
  additionalFees?: AdditionalFee[];
}

export class InvoiceSettingsService {
  static async getSettings(tenantId: string): Promise<InvoiceSettingsData> {
    try {
      const supabase = getSupabaseClient();

      // Get branding settings
      const { data: brandingData } = await supabase
        .from('invoice_branding_settings')
        .select('logo_url, header_text, footer_text')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      // Get tax/service charge settings
      const { data: taxChargeData } = await supabase
        .from('invoice_tax_service_charge')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      // Get additional fees
      const { data: feesData } = await supabase
        .from('invoice_additional_fees')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      return {
        branding: brandingData
          ? {
              logoUrl: brandingData.logo_url ?? undefined,
              headerText: brandingData.header_text ?? undefined,
              footerText: brandingData.footer_text ?? undefined,
            }
          : undefined,
        taxServiceCharge: taxChargeData
          ? {
              taxPercentage: taxChargeData.tax_percentage ?? 0,
              serviceChargeType: taxChargeData.service_charge_type ?? 'fixed',
              serviceChargeValue: taxChargeData.service_charge_value ?? 0,
              serviceChargeRequired: taxChargeData.service_charge_required ?? false,
            }
          : undefined,
        additionalFees: (feesData || []).map(fee => ({
          id: fee.id,
          name: fee.name,
          type: fee.type,
          value: fee.value,
        })),
      };
    } catch (error) {
      console.error('[InvoiceSettingsService] Error loading settings:', error);
      return {};
    }
  }

  static async updateSettings(
    tenantId: string,
    settings: InvoiceSettingsData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();

      // Update branding
      if (settings.branding) {
        const { error: brandingError } = await supabase
          .from('invoice_branding_settings')
          .upsert({
            tenant_id: tenantId,
            logo_url: settings.branding.logoUrl ?? null,
            header_text: settings.branding.headerText ?? null,
            footer_text: settings.branding.footerText ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'tenant_id' });

        if (brandingError) {
          console.error('[InvoiceSettingsService] Error saving branding:', brandingError);
          return { success: false, error: 'Failed to save branding settings' };
        }
      }

      // Update tax/service charge
      if (settings.taxServiceCharge) {
        const { error: taxChargeError } = await supabase
          .from('invoice_tax_service_charge')
          .upsert({
            tenant_id: tenantId,
            tax_percentage: settings.taxServiceCharge.taxPercentage ?? 0,
            service_charge_type: settings.taxServiceCharge.serviceChargeType ?? 'fixed',
            service_charge_value: settings.taxServiceCharge.serviceChargeValue ?? 0,
            service_charge_required: settings.taxServiceCharge.serviceChargeRequired ?? false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'tenant_id' });

        if (taxChargeError) {
          console.error('[InvoiceSettingsService] Error saving tax/charge:', taxChargeError);
          return { success: false, error: 'Failed to save tax and service charge settings' };
        }
      }

      // Update additional fees (delete old, insert new)
      if (settings.additionalFees) {
        // Delete existing fees for this tenant
        const { error: deleteError } = await supabase
          .from('invoice_additional_fees')
          .delete()
          .eq('tenant_id', tenantId);

        if (deleteError) {
          console.error('[InvoiceSettingsService] Error deleting fees:', deleteError);
          return { success: false, error: 'Failed to update fees' };
        }

        // Insert new fees
        if (settings.additionalFees.length > 0) {
          const { error: insertError } = await supabase
            .from('invoice_additional_fees')
            .insert(
              settings.additionalFees.map(fee => ({
                id: fee.id,
                tenant_id: tenantId,
                name: fee.name,
                type: fee.type,
                value: fee.value,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }))
            );

          if (insertError) {
            console.error('[InvoiceSettingsService] Error inserting fees:', insertError);
            return { success: false, error: 'Failed to save additional fees' };
          }
        }
      }

      console.log('[InvoiceSettingsService] ✅ All settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('[InvoiceSettingsService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error saving settings' };
    }
  }
}
