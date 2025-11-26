'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewChatDialogProps {
  open: boolean;
  phone: string;
  onClose: () => void;
  onPhoneChange: (phone: string) => void;
  onStartChat: () => void;
}

export function NewChatDialog({
  open,
  phone,
  onClose,
  onPhoneChange,
  onStartChat,
}: NewChatDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Start New Chat</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Customer Phone Number
            </label>
            <Input
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onStartChat}
              disabled={!phone.trim()}
              className="flex-1"
            >
              Start Chat
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
