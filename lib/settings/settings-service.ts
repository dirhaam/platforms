import { createClient } from '@supabase/supabase-js';
import type { Tenant, Service, BusinessHours } from '@/types/database';

export interface BusinessProfileData {
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface LandingPageSettingsData {
  templateId: string;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutText?: string;
  showServices: boolean;
  showReviews: boolean;
  showContact: boolean;
  showGallery: boolean;
  customCss?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface NotificationSettingsData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  bookingConfirmations: boolean;
  paymentReminders: boolean;
  dailySummary: boolean;
  weeklyReports: boolean;
  reminderHours: number;
}

export class SettingsService {
  // Get business profile
  static async getBusinessProfile(tenantId: string): Promise<BusinessProfileData | null> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('businessName, businessCategory, ownerName, email, phone, address, businessDescription, logo, brandColors')
        .eq('id', tenantId)
        .limit(1)
        .single();

      if (error || !tenant) return null;

      return {
        businessName: tenant.businessName,
        businessCategory: tenant.businessCategory,
        ownerName: tenant.ownerName,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address ?? undefined,
        businessDescription: tenant.businessDescription ?? undefined,
        logo: tenant.logo ?? undefined,
        brandColors: (tenant.brandColors ?? undefined) as any,
      };
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }
  }

  // Update business profile
  static async updateBusinessProfile(
    tenantId: string,
    data: Partial<BusinessProfileData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const updatePayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };

      if (data.businessName) updatePayload.businessName = data.businessName;
      if (data.businessCategory) updatePayload.businessCategory = data.businessCategory;
      if (data.ownerName) updatePayload.ownerName = data.ownerName;
      if (data.email) updatePayload.email = data.email;
      if (data.phone) updatePayload.phone = data.phone;
      if (data.address) updatePayload.address = data.address;
      if (data.businessDescription) updatePayload.businessDescription = data.businessDescription;
      if (data.logo) updatePayload.logo = data.logo;
      if (data.brandColors) updatePayload.brandColors = data.brandColors;

      const { error } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('id', tenantId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating business profile:', error);
      return { success: false, error: 'Failed to update business profile' };
    }
  }

  // Get services
  static async getServices(tenantId: string): Promise<Service[]> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: results, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenantId', tenantId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (results || []) as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  // Create service
  static async createService(
    tenantId: string,
    serviceData: {
      name: string;
      description: string;
      duration: number;
      price: number;
      category: string;
      homeVisitAvailable: boolean;
      homeVisitSurcharge?: number;
      images?: string[];
      requirements?: string[];
    }
  ): Promise<{ success: boolean; service?: Service; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: service, error } = await supabase
        .from('services')
        .insert({
          id: crypto.randomUUID(),
          tenantId,
          name: serviceData.name,
          description: serviceData.description,
          duration: serviceData.duration,
          price: serviceData.price,
          category: serviceData.category,
          isActive: true,
          homeVisitAvailable: serviceData.homeVisitAvailable,
          homeVisitSurcharge: serviceData.homeVisitSurcharge,
          images: serviceData.images || [],
          requirements: serviceData.requirements || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !service) throw error || new Error('Failed to create service');
      return { success: true, service: service as Service };
    } catch (error) {
      console.error('Error creating service:', error);
      return { success: false, error: 'Failed to create service' };
    }
  }

  // Update service
  static async updateService(
    serviceId: string,
    serviceData: Partial<{
      name: string;
      description: string;
      duration: number;
      price: number;
      category: string;
      isActive: boolean;
      homeVisitAvailable: boolean;
      homeVisitSurcharge?: number;
      images: string[];
      requirements: string[];
    }>
  ): Promise<{ success: boolean; service?: Service; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const updatePayload: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (serviceData.name !== undefined) updatePayload.name = serviceData.name;
      if (serviceData.description !== undefined) updatePayload.description = serviceData.description;
      if (serviceData.duration !== undefined) updatePayload.duration = serviceData.duration;
      if (serviceData.price !== undefined) updatePayload.price = serviceData.price.toFixed(2);
      if (serviceData.category !== undefined) updatePayload.category = serviceData.category;
      if (serviceData.isActive !== undefined) updatePayload.isActive = serviceData.isActive;
      if (serviceData.homeVisitAvailable !== undefined) updatePayload.homeVisitAvailable = serviceData.homeVisitAvailable;
      if (serviceData.homeVisitSurcharge !== undefined) {
        updatePayload.homeVisitSurcharge = serviceData.homeVisitSurcharge?.toFixed(2);
      }
      if (serviceData.images !== undefined) updatePayload.images = serviceData.images;
      if (serviceData.requirements !== undefined) updatePayload.requirements = serviceData.requirements;

      const { data: service, error } = await supabase
        .from('services')
        .update(updatePayload)
        .eq('id', serviceId)
        .select()
        .single();

      if (error || !service) throw error || new Error('Failed to update service');
      return { success: true, service: service as Service };
    } catch (error) {
      console.error('Error updating service:', error);
      return { success: false, error: 'Failed to update service' };
    }
  }

  // Delete service
  static async deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if service has any bookings
      const { data: bookingsData, count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('serviceId', serviceId);

      if ((bookingCount ?? 0) > 0) {
        // Soft delete by deactivating
        const { error } = await supabase
          .from('services')
          .update({ isActive: false, updatedAt: new Date().toISOString() })
          .eq('id', serviceId);
        if (error) throw error;
      } else {
        // Hard delete if no bookings
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);
        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: 'Failed to delete service' };
    }
  }

  // Get business hours
  static async getBusinessHours(tenantId: string): Promise<BusinessHours | null> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: record, error } = await supabase
        .from('businessHours')
        .select('*')
        .eq('tenantId', tenantId)
        .limit(1)
        .single();

      if (error) return null;
      return (record as BusinessHours) ?? null;
    } catch (error) {
      console.error('Error fetching business hours:', error);
      return null;
    }
  }

  // Update business hours
  static async updateBusinessHours(
    tenantId: string,
    schedule: any,
    timezone: string = 'Asia/Jakarta'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Try to update first
      const { error: updateError } = await supabase
        .from('businessHours')
        .update({
          schedule,
          timezone,
          updatedAt: new Date().toISOString(),
        })
        .eq('tenantId', tenantId);

      // If no rows updated, insert
      if (updateError || !updateError) {
        const { data: existing, error: checkError } = await supabase
          .from('businessHours')
          .select('id')
          .eq('tenantId', tenantId)
          .limit(1)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from('businessHours')
            .insert({
              id: crypto.randomUUID(),
              tenantId,
              schedule,
              timezone,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          if (insertError) throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating business hours:', error);
      return { success: false, error: 'Failed to update business hours' };
    }
  }

  // Get landing page settings (mock implementation)
  static async getLandingPageSettings(tenantId: string): Promise<LandingPageSettingsData> {
    // For now, return default settings
    // In a real implementation, this would be stored in the database
    return {
      templateId: 'modern',
      heroTitle: '',
      heroSubtitle: '',
      aboutText: '',
      showServices: true,
      showReviews: true,
      showContact: true,
      showGallery: false,
      customCss: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    };
  }

  // Update landing page settings (mock implementation)
  static async updateLandingPageSettings(
    tenantId: string,
    settings: Partial<LandingPageSettingsData>
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in reality, this would update database
    console.log('Updating landing page settings for tenant:', tenantId, settings);
    return { success: true };
  }

  // Get notification settings (mock implementation)
  static async getNotificationSettings(tenantId: string): Promise<NotificationSettingsData> {
    // For now, return default settings
    return {
      emailNotifications: true,
      smsNotifications: false,
      whatsappNotifications: true,
      bookingConfirmations: true,
      paymentReminders: true,
      dailySummary: true,
      weeklyReports: false,
      reminderHours: 24,
    };
  }

  // Get landing page media
  static async getLandingPageMedia(tenantId: string) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Fetch videos
      const { data: videos } = await supabase
        .from('tenant_videos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      // Fetch social media
      const { data: socialMedia } = await supabase
        .from('tenant_social_media')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      // Fetch galleries with photos
      const { data: galleries } = await supabase
        .from('tenant_photo_galleries')
        .select(`
          *,
          photos:tenant_gallery_photos(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      return {
        videos: videos || [],
        socialMedia: socialMedia || [],
        galleries: galleries || [],
      };
    } catch (error) {
      console.error('Error fetching landing page media:', error);
      return {
        videos: [],
        socialMedia: [],
        galleries: [],
      };
    }
  }

  // Update notification settings (mock implementation)
  static async updateNotificationSettings(
    tenantId: string,
    settings: Partial<NotificationSettingsData>
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in reality, this would update database
    console.log('Updating notification settings for tenant:', tenantId, settings);
    return { success: true };
  }

  // Get available business categories
  static getBusinessCategories(): string[] {
    return [
      'Beauty & Wellness',
      'Healthcare',
      'Fitness & Sports',
      'Education & Training',
      'Professional Services',
      'Home Services',
      'Automotive',
      'Food & Beverage',
      'Entertainment',
      'Other',
    ];
  }

  // Get available landing page templates
  static getLandingPageTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    preview: string;
    category: string;
  }> {
    return [
      {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and contemporary design with bold typography',
        preview: '/templates/modern-preview.jpg',
        category: 'Professional',
      },
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional and elegant layout with timeless appeal',
        preview: '/templates/classic-preview.jpg',
        category: 'Traditional',
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple and focused design with lots of white space',
        preview: '/templates/minimal-preview.jpg',
        category: 'Simple',
      },
      {
        id: 'beauty',
        name: 'Beauty',
        description: 'Designed specifically for beauty and wellness businesses',
        preview: '/templates/beauty-preview.jpg',
        category: 'Industry-Specific',
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Professional template for medical and healthcare services',
        preview: '/templates/healthcare-preview.jpg',
        category: 'Industry-Specific',
      },
    ];
  }
}