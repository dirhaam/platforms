'use client';

import type React from 'react';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
  EmojiPickerFooter
} from '@/components/ui/emoji-picker';
import { createSubdomainAction } from '@/app/actions';
import { rootDomain } from '@/lib/utils';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '@/lib/subdomain-constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

function SubdomainInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain">Subdomain</Label>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-subdomain"
            defaultValue={defaultValue}
            className="w-full rounded-r-none focus:z-10"
            required
          />
        </div>
        <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
          .{rootDomain}
        </span>
      </div>
    </div>
  );
}

function IconPicker({
  icon,
  setIcon,
  defaultValue
}: {
  icon: string;
  setIcon: (icon: string) => void;
  defaultValue?: string;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleEmojiSelect = ({ emoji }: { emoji: string }) => {
    setIcon(emoji);
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="icon">Icon</Label>
      <div className="flex flex-col gap-2">
        <input type="hidden" name="icon" value={icon} required />
        <div className="flex items-center gap-2">
          <Card className="flex-1 flex flex-row items-center justify-between p-2 border border-input rounded-md">
            <div className="min-w-[40px] min-h-[40px] flex items-center pl-[14px] select-none">
              {icon ? (
                <span className="text-3xl">{icon}</span>
              ) : (
                <span className="text-gray-400 text-sm font-normal">
                  No icon selected
                </span>
              )}
            </div>
            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto rounded-sm"
                  onClick={() => setIsPickerOpen(!isPickerOpen)}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Select Emoji
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[256px]"
                align="end"
                sideOffset={5}
              >
                <EmojiPicker
                  className="h-[300px] w-[256px]"
                  defaultValue={defaultValue}
                  onEmojiSelect={handleEmojiSelect}
                >
                  <EmojiPickerSearch />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
          </Card>
        </div>
        <p className="text-xs text-gray-500">
          Select an emoji to represent your subdomain
        </p>
      </div>
    </div>
  );
}

export function SubdomainForm() {
  const [icon, setIcon] = useState('');
  const [businessCategory, setBusinessCategory] = useState<string>('');

  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <SubdomainInput defaultValue={state?.subdomain} />

      <IconPicker icon={icon} setIcon={setIcon} defaultValue={state?.icon} />

      {/* Business Information Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Business Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            name="businessName"
            placeholder="Your Business Name"
            defaultValue={state?.businessName}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name *</Label>
          <Input
            id="ownerName"
            name="ownerName"
            placeholder="Your Full Name"
            defaultValue={state?.ownerName}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              defaultValue={state?.email}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+60123456789"
              defaultValue={state?.phone}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessCategory">Business Category *</Label>
          <Select name="businessCategory" value={businessCategory} onValueChange={setBusinessCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Select your business category" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDescription">Business Description</Label>
          <Textarea
            id="businessDescription"
            name="businessDescription"
            placeholder="Briefly describe your business and services..."
            defaultValue={state?.businessDescription}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Textarea
            id="address"
            name="address"
            placeholder="Your business address..."
            defaultValue={state?.address}
            rows={2}
          />
        </div>
      </div>

      {state?.error && (
        <div className="text-sm text-red-500">{state.error}</div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isPending || !icon || !businessCategory}
      >
        {isPending ? 'Creating...' : 'Create Business Subdomain'}
      </Button>
    </form>
  );
}
