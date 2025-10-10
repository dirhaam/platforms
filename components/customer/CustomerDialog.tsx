'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Customer, CreateCustomerRequest } from '@/types/booking';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCustomerRequest) => void;
  title: string;
  initialData?: Customer;
}

export function CustomerDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  initialData
}: CustomerDialogProps) {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    whatsappNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          phone: initialData.phone,
          email: initialData.email || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
          whatsappNumber: initialData.whatsappNumber || ''
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          whatsappNumber: ''
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.whatsappNumber && formData.whatsappNumber.length < 10) {
      newErrors.whatsappNumber = 'WhatsApp number must be at least 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting customer form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-fill WhatsApp number from phone
  const handlePhoneChange = (value: string) => {
    handleInputChange('phone', value);
    
    // Auto-fill WhatsApp number if it's empty
    if (!formData.whatsappNumber && value.length >= 10) {
      handleInputChange('whatsappNumber', value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Full Name *</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter customer's full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Phone Number *</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address (optional)"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Number</span>
            </Label>
            <Input
              id="whatsappNumber"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
              placeholder="Enter WhatsApp number (optional)"
              className={errors.whatsappNumber ? 'border-red-500' : ''}
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-600">{errors.whatsappNumber}</p>
            )}
            <p className="text-xs text-gray-500">
              Used for automated booking reminders and notifications
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Address</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter customer's address (optional)"
              rows={2}
            />
            <p className="text-xs text-gray-500">
              Required for home visit services
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about the customer (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}