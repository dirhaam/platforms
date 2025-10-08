'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rootDomain } from '@/lib/utils';
import type { RegistrationData } from '@/components/registration/RegistrationWizard';

interface ReviewStepProps {
  data: RegistrationData;
  onEdit: (step: number) => void;
}

export function ReviewStep({ data, onEdit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Review Your Information
        </h3>
        <p className="text-gray-600">
          Please review your details before creating your business booking system.
        </p>
      </div>

      <div className="space-y-4">
        {/* Subdomain & Icon */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Subdomain & Icon</CardTitle>
                <CardDescription>Your business web address</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(1)}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{data.icon}</span>
              <div>
                <div className="font-medium text-blue-700">
                  {data.subdomain}.{rootDomain}
                </div>
                <div className="text-sm text-gray-500">
                  Your customers will visit this address to book appointments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Business Information</CardTitle>
                <CardDescription>Your business details</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(2)}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Business Name</div>
                  <div className="text-sm text-gray-900">{data.businessName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Owner/Manager</div>
                  <div className="text-sm text-gray-900">{data.ownerName}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Email</div>
                  <div className="text-sm text-gray-900">{data.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Phone</div>
                  <div className="text-sm text-gray-900">{data.phone}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Business Category</div>
                <div className="text-sm text-gray-900">{data.businessCategory}</div>
              </div>
              
              {data.businessDescription && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Description</div>
                  <div className="text-sm text-gray-900">{data.businessDescription}</div>
                </div>
              )}
              
              {data.address && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Address</div>
                  <div className="text-sm text-gray-900">{data.address}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">1.</span>
                <span>Your business subdomain will be created instantly</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">2.</span>
                <span>You'll be redirected to your new business dashboard</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">3.</span>
                <span>You can start customizing your booking system and accepting appointments</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">4.</span>
                <span>Your customers can visit your subdomain to book appointments</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}