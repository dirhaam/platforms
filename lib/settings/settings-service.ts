import { prisma } from '@/lib/database';
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
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          businessName: true,
          businessCategory: true,
          ownerName: true,
          email: true,
          phone: true,
          address: true,
          businessDescription: true,
          logo: true,
          brandColors: true,
        },
      });

      if (!tenant) return null;

      return {
        businessName: tenant.businessName,
        businessCategory: tenant.businessCategory,
        ownerName: tenant.ownerName,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        businessDescription: tenant.businessDescription,
        logo: tenant.logo,
        brandColors: tenant.brandColors as any,
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
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          businessName: data.businessName,
          businessCategory: data.businessCategory,
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          businessDescription: data.businessDescription,
          logo: data.logo,
          brandColors: data.brandColors,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating business profile:', error);
      return { success: false, error: 'Failed to update business profile' };
    }
  }

  // Get services
  static async getServices(tenantId: string): Promise<Service[]> {
    try {
      const services = await prisma.service.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      });

      return services;
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
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: serviceData.name,
          description: serviceData.description,
          duration: serviceData.duration,
          price: serviceData.price,
          category: serviceData.category,
          homeVisitAvailable: serviceData.homeVisitAvailable,
          homeVisitSurcharge: serviceData.homeVisitSurcharge,
          images: serviceData.images || [],
          requirements: serviceData.requirements || [],
        },
      });

      return { success: true, service };
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
      const service = await prisma.service.update({
        where: { id: serviceId },
        data: {
          ...serviceData,
          updatedAt: new Date(),
        },
      });

      return { success: true, service };
    } catch (error) {
      console.error('Error updating service:', error);
      return { success: false, error: 'Failed to update service' };
    }
  }

  // Delete service
  static async deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if service has any bookings
      const bookingCount = await prisma.booking.count({
        where: { serviceId },
      });

      if (bookingCount > 0) {
        // Soft delete by deactivating instead of hard delete
        await prisma.service.update({
          where: { id: serviceId },
          data: { isActive: false },
        });
      } else {
        // Hard delete if no bookings
        await prisma.service.delete({
          where: { id: serviceId },
        });
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
      const businessHours = await prisma.businessHours.findUnique({
        where: { tenantId },
      });

      return businessHours;
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
      await prisma.businessHours.upsert({
        where: { tenantId },
        update: {
          schedule,
          timezone,
          updatedAt: new Date(),
        },
        create: {
          tenantId,
          schedule,
          timezone,
        },
      });

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