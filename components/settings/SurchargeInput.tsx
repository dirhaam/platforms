'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SurchargeInputProps {
  label: string;
  placeholder?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  helperText?: string;
  disabled?: boolean;
  min?: number;
  step?: number;
  id?: string;
}

export function SurchargeInput({
  label,
  placeholder,
  value,
  onChange,
  helperText,
  disabled = false,
  min = 0,
  step = 1000,
  id
}: SurchargeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        placeholder={placeholder}
      />
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
