'use server';

import { setTenant, getTenant, deleteTenant } from '@/lib/database-service';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

  // Store in Supabase - both to tenants table and backup storage
  await setTenant(sanitizedSubdomain, enhancedTenant);

  // Generate a temporary password for owner (they should change it after login)
  const temporaryPassword = Math.random().toString(36).slice(-12).toUpperCase();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Also create in tenants table with owner credentials for authentication
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: enhancedTenant.id,
        subdomain: sanitizedSubdomain,
        email: email,
        owner_name: ownerName,
        business_name: businessName,
        business_category: businessCategory,
        business_description: businessDescription,
        phone: phone,
        address: address,
        emoji: icon,
        password_hash: passwordHash, // Owner can login with this
        subscription_plan: 'basic',
        subscription_status: 'active',
        whatsapp_enabled: false,
        home_visit_enabled: false,
        analytics_enabled: true,
        custom_templates_enabled: false,
        multi_staff_enabled: false,
        login_attempts: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!tenantError && tenant) {
      console.log('✅ Tenant created in Supabase with owner credentials:', sanitizedSubdomain);
      console.log('🔐 Temporary Owner Password:', temporaryPassword);
    } else {
      console.warn('⚠️ Failed to create tenant in Supabase tenants table:', tenantError?.message);
      // Continue anyway - legacy storage still worked
    }
  } catch (error) {
    console.warn('⚠️ Failed to create tenant credentials in Supabase:', error);
    // Continue anyway - registration still succeeds
  }

  // Log the tenant creation activity
  try {
    const { ActivityLogger } = await import('@/lib/admin/activity-logger');
    await ActivityLogger.logTenantCreated(enhancedTenant.id, enhancedTenant.businessName);
  } catch (error) {
    console.warn('Failed to log tenant creation activity:', error);
  }

  // Redirect to success page with credentials
  const encodedPassword = btoa(temporaryPassword); // Base64 encode for URL safety
  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}/setup?success=true&pass=${encodedPassword}&email=${encodeURIComponent(email)}`);
}



export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain');
  await deleteTenant(subdomain as string);
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}
