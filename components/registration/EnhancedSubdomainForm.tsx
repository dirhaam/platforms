'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { RegistrationWizard, type RegistrationData } from '@/components/registration/RegistrationWizard';
import { createSubdomainAction } from '@/app/actions';

type CreateState = {
  error?: string;
  success?: boolean;
  subdomain?: string;
  icon?: string;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  businessCategory?: string;
  businessDescription?: string;
  address?: string;
};

export function EnhancedSubdomainForm() {
  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  );

  const handleWizardComplete = (data: RegistrationData) => {
    // Create FormData from the wizard data
    const formData = new FormData();
    formData.append('subdomain', data.subdomain);
    formData.append('icon', data.icon);
    formData.append('businessName', data.businessName);
    formData.append('ownerName', data.ownerName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('businessCategory', data.businessCategory);
    
    if (data.businessDescription) {
      formData.append('businessDescription', data.businessDescription);
    }
    if (data.address) {
      formData.append('address', data.address);
    }

    // Submit the form data
    action(formData);
  };

  return (
    <RegistrationWizard
      onComplete={handleWizardComplete}
      isSubmitting={isPending}
      error={state?.error}
    />
  );
}