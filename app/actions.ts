'use server';

import { setTenant, getTenant } from '@/lib/d1';

import { isValidIcon, type TenantRegistrationData, type BusinessCategory, BUSINESS_CATEGORIES } from '@/lib/subdomain-constants';
import { createEnhancedTenant } from '@/lib/subdomains';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export async function createSubdomainAction(
  prevState: any,
  formData: FormData
) {
  // Extract all form data
  const subdomain = formData.get('subdomain') as string;
  const icon = formData.get('icon') as string;
  const businessName = formData.get('businessName') as string;
  const ownerName = formData.get('ownerName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const businessCategory = formData.get('businessCategory') as BusinessCategory;
  const businessDescription = formData.get('businessDescription') as string;
  const address = formData.get('address') as string;

  // Validate required fields
  if (!subdomain || !icon || !businessName || !ownerName || !email || !phone || !businessCategory) {
    return { 
      success: false, 
      error: 'All required fields must be filled',
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address
    };
  }

  // Validate icon
  if (!isValidIcon(icon)) {
    return {
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address,
      success: false,
      error: 'Please enter a valid emoji (maximum 10 characters)'
    };
  }

  // Validate business category
  if (!BUSINESS_CATEGORIES.includes(businessCategory)) {
    return {
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address,
      success: false,
      error: 'Please select a valid business category'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address,
      success: false,
      error: 'Please enter a valid email address'
    };
  }

  // Sanitize subdomain
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address,
      success: false,
      error: 'Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.'
    };
  }

  // Check if subdomain already exists
  const subdomainAlreadyExists = await getTenant(sanitizedSubdomain);
  if (subdomainAlreadyExists) {
    return {
      subdomain,
      icon,
      businessName,
      ownerName,
      email,
      phone,
      businessCategory,
      businessDescription,
      address,
      success: false,
      error: 'This subdomain is already taken'
    };
  }

  // Create registration data
  const registrationData: TenantRegistrationData = {
    subdomain: sanitizedSubdomain,
    icon,
    businessName,
    ownerName,
    email,
    phone,
    businessCategory,
    businessDescription: businessDescription || undefined,
    address: address || undefined,
  };

  // Create enhanced tenant data
  const enhancedTenant = await createEnhancedTenant(registrationData);

  // Store in D1
  await setTenant(sanitizedSubdomain, enhancedTenant);

  // Log the tenant creation activity
  try {
    const { ActivityLogger } = await import('@/lib/admin/activity-logger');
    await ActivityLogger.logTenantCreated(enhancedTenant.id, enhancedTenant.businessName);
  } catch (error) {
    console.warn('Failed to log tenant creation activity:', error);
  }

  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
}

import { deleteTenant } from '@/lib/d1';

export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain');
  await deleteTenant(subdomain as string);
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}
