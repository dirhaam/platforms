'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubdomainStep } from '@/components/registration/SubdomainStep';
import { BusinessInfoStep } from '@/components/registration/BusinessInfoStep';
import { ReviewStep } from '@/components/registration/ReviewStep';

export interface RegistrationData {
  // Step 1: Subdomain & Icon
  subdomain: string;
  icon: string;
  
  // Step 2: Business Information
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: string;
  businessDescription?: string;
  address?: string;
}

interface RegistrationWizardProps {
  onComplete: (data: RegistrationData) => void;
  isSubmitting?: boolean;
  error?: string;
}

const STEPS = [
  { id: 1, title: 'Subdomain', description: 'Choose your unique subdomain' },
  { id: 2, title: 'Business Info', description: 'Tell us about your business' },
  { id: 3, title: 'Review', description: 'Review and confirm your details' }
];

export function RegistrationWizard({ onComplete, isSubmitting, error }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<RegistrationData>>({});
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  const updateData = (stepData: Partial<RegistrationData>) => {
    setData(prev => ({ ...prev, ...stepData }));
    // Clear step error when data is updated
    setStepErrors(prev => ({ ...prev, [currentStep]: '' }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!data.subdomain || !data.icon) {
          setStepErrors(prev => ({ ...prev, 1: 'Please fill in all required fields' }));
          return false;
        }
        break;
      case 2:
        if (!data.businessName || !data.ownerName || !data.email || !data.phone || !data.businessCategory) {
          setStepErrors(prev => ({ ...prev, 2: 'Please fill in all required fields' }));
          return false;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          setStepErrors(prev => ({ ...prev, 2: 'Please enter a valid email address' }));
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    if (validateStep(2)) { // Validate business info before completing
      onComplete(data as RegistrationData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SubdomainStep
            data={data}
            onUpdate={updateData}
            error={stepErrors[1]}
          />
        );
      case 2:
        return (
          <BusinessInfoStep
            data={data}
            onUpdate={updateData}
            error={stepErrors[2]}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={data as RegistrationData}
            onEdit={(step: number) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          {error && (
            <div className="mt-4 text-sm text-red-500">{error}</div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Business'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}