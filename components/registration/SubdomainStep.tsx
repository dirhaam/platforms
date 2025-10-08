'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch, EmojiPickerFooter } from '@/components/ui/emoji-picker';
import { Smile } from 'lucide-react';
import { rootDomain } from '@/lib/utils';
import type { RegistrationData } from '@/components/registration/RegistrationWizard';

interface SubdomainStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  error?: string;
}

export function SubdomainStep({ data, onUpdate, error }: SubdomainStepProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    onUpdate({ subdomain: value });
  };

  const handleEmojiSelect = ({ emoji }: { emoji: string }) => {
    onUpdate({ icon: emoji });
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Choose Your Unique Subdomain
        </h3>
        <p className="text-gray-600">
          This will be your business's web address where customers can find and book with you.
        </p>
      </div>

      <div className="space-y-4">
        {/* Subdomain Input */}
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain *</Label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Input
                id="subdomain"
                placeholder="your-business-name"
                value={data.subdomain || ''}
                onChange={handleSubdomainChange}
                className="w-full rounded-r-none focus:z-10"
                required
              />
            </div>
            <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
              .{rootDomain}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Only lowercase letters, numbers, and hyphens are allowed
          </p>
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <Label htmlFor="icon">Business Icon *</Label>
          <Card className="flex flex-row items-center justify-between p-3 border border-input rounded-md">
            <div className="min-w-[40px] min-h-[40px] flex items-center pl-[14px] select-none">
              {data.icon ? (
                <span className="text-3xl">{data.icon}</span>
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
                  onEmojiSelect={handleEmojiSelect}
                >
                  <EmojiPickerSearch />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
          </Card>
          <p className="text-xs text-gray-500">
            Choose an emoji that represents your business
          </p>
        </div>

        {/* Preview */}
        {data.subdomain && data.icon && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{data.icon}</span>
              <span className="text-blue-700 font-medium">
                {data.subdomain}.{rootDomain}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              This will be your business's web address
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
      </div>
    </div>
  );
}