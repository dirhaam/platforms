'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface FeatureToggleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function FeatureToggleCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabled = false
}: FeatureToggleCardProps) {
  return (
    <Card className={`transition-colors ${enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`${enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {icon}
            </div>
            <h5 className="font-medium text-sm">{title}</h5>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}