import type { EnhancedTenant } from '@/types/database';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TenantValidation {
  /**
   * Comprehensive tenant data validation
   */
  static validateTenantData(data: Partial<EnhancedTenant>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Required field validation
    this.validateRequiredFields(data, result);
    
    // Format validation
    this.validateFormats(data, result);
    
    // Business logic validation
    this.validateBusinessLogic(data, result);
    
    // Set overall validity
    result.isValid = result.errors.length === 0;
    
    return result;
  }

  private static validateRequiredFields(data: Partial<EnhancedTenant>, result: ValidationResult): void {
    const requiredFields = [
      'subdomain',
      'businessName',
      'ownerName',
      'email',
      'phone',
      'businessCategory',
    ];

    for (const field of requiredFields) {
      const value = data[field as keyof EnhancedTenant];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        result.errors.push(`${field} is required`);
      }
    }
  }

  private static validateFormats(data: Partial<EnhancedTenant>, result: ValidationResult): void {
    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      result.errors.push('Invalid email format');
    }

    // Subdomain validation
    if (data.subdomain && !this.isValidSubdomain(data.subdomain)) {
      result.errors.push('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens');
    }

    // Phone validation
    if (data.phone && !this.isValidPhone(data.phone)) {
      result.warnings.push('Phone number format may be invalid');
    }

    // Business category validation
    if (data.businessCategory && !this.isValidBusinessCategory(data.businessCategory)) {
      result.errors.push('Invalid business category');
    }
  }

  private static validateBusinessLogic(data: Partial<EnhancedTenant>, result: ValidationResult): void {
    // Subscription validation
    if (data.subscription) {
      const { plan, status, expiresAt } = data.subscription;
      
      if (plan && !['basic', 'premium', 'enterprise'].includes(plan)) {
        result.errors.push('Invalid subscription plan');
      }
      
      if (status && !['active', 'suspended', 'cancelled'].includes(status)) {
        result.errors.push('Invalid subscription status');
      }
      
      if (expiresAt && new Date(expiresAt) < new Date()) {
        result.warnings.push('Subscription has expired');
      }
    }

    // Features validation
    if (data.features) {
      const featureKeys = ['whatsapp', 'homeVisit', 'analytics', 'customTemplates', 'multiStaff'];
      for (const key of featureKeys) {
        const value = data.features[key as keyof typeof data.features];
        if (value !== undefined && typeof value !== 'boolean') {
          result.errors.push(`Feature ${key} must be a boolean`);
        }
      }
    }

    // Timestamp validation
    if (data.createdAt && (typeof data.createdAt !== 'number' || data.createdAt <= 0)) {
      result.errors.push('Invalid createdAt timestamp');
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidSubdomain(subdomain: string): boolean {
    const subdomainRegex = /^[a-z0-9-]+$/;
    return subdomainRegex.test(subdomain) && 
           subdomain.length >= 2 && 
           subdomain.length <= 63 &&
           !subdomain.startsWith('-') && 
           !subdomain.endsWith('-');
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  private static isValidBusinessCategory(category: string): boolean {
    const validCategories = [
      'Beauty & Wellness',
      'Healthcare',
      'Fitness & Sports',
      'Education & Training',
      'Professional Services',
      'Home Services',
      'Automotive',
      'Food & Beverage',
      'Entertainment',
      'Other'
    ];
    return validCategories.includes(category);
  }

  /**
   * Validate migration data before processing
   */
  static validateMigrationData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!data) {
      result.errors.push('No data provided');
      result.isValid = false;
      return result;
    }

    // Check if it's legacy data
    if (this.isLegacyData(data)) {
      if (!data.emoji) {
        result.errors.push('Legacy data missing emoji');
      }
      if (!data.createdAt) {
        result.errors.push('Legacy data missing createdAt');
      }
    } else {
      // Validate as enhanced tenant data
      return this.validateTenantData(data);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private static isLegacyData(data: any): boolean {
    return data.emoji !== undefined && 
           data.createdAt !== undefined && 
           !data.businessName;
  }

  /**
   * Sanitize tenant data for safe storage
   */
  static sanitizeTenantData(data: Partial<EnhancedTenant>): Partial<EnhancedTenant> {
    const sanitized = { ...data };

    // Sanitize string fields
    if (sanitized.subdomain) {
      sanitized.subdomain = sanitized.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }

    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/[^\d\+\-\(\)\s]/g, '');
    }

    if (sanitized.businessName) {
      sanitized.businessName = sanitized.businessName.trim();
    }

    if (sanitized.ownerName) {
      sanitized.ownerName = sanitized.ownerName.trim();
    }

    return sanitized;
  }
}