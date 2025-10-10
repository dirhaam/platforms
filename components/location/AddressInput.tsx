'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Address, AddressValidation } from '@/types/location';
import { toast } from 'sonner';

interface AddressInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onAddressSelect: (address: Address) => void;
  onAddressChange?: (address: string) => void;
  tenantId: string;
  required?: boolean;
  disabled?: boolean;
}

export function AddressInput({
  label = 'Address',
  placeholder = 'Enter full address',
  value = '',
  onAddressSelect,
  onAddressChange,
  tenantId,
  required = false,
  disabled = false
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't validate empty input
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setValidationStatus('none');
      if (onAddressChange) {
      onAddressChange(inputValue);
    }
      return;
    }

    // Debounce validation
    debounceRef.current = setTimeout(() => {
      validateAddress(inputValue);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, tenantId]);

  const validateAddress = async (address: string) => {
    if (!address.trim()) return;

    setValidating(true);
    setValidationStatus('none');

    try {
      const response = await fetch('/api/location/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: address.trim(),
          tenantId
        })
      });

      if (response.ok) {
        const validation: AddressValidation = await response.json();
        
        if (validation.isValid && validation.address) {
          setValidationStatus('valid');
          setSuggestions([validation.address, ...(validation.suggestions || [])]);
          setShowSuggestions(true);
        } else {
          setValidationStatus('invalid');
          setSuggestions([]);
          setShowSuggestions(false);
          if (validation.error) {
            toast.error(`Address validation failed: ${validation.error}`);
          }
        }
      } else {
        setValidationStatus('invalid');
        setSuggestions([]);
        setShowSuggestions(false);
        toast.error('Failed to validate address');
      }
    } catch (error) {
      console.error('Error validating address:', error);
      setValidationStatus('invalid');
      setSuggestions([]);
      setShowSuggestions(false);
      toast.error('Address validation service unavailable');
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedAddress(null);
    onAddressChange?.(newValue);
  };

  const handleSuggestionSelect = (address: Address) => {
    setInputValue(address.fullAddress);
    setSelectedAddress(address);
    setShowSuggestions(false);
    onAddressSelect(address);
    onAddressChange?.(address.fullAddress);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const getValidationIcon = () => {
    if (validating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (validationStatus === 'valid') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (validationStatus === 'invalid') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <MapPin className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="address-input">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`pr-10 ${
            validationStatus === 'valid' ? 'border-green-500' :
            validationStatus === 'invalid' ? 'border-red-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {suggestion.fullAddress}
                      </p>
                      {suggestion.coordinates && (
                        <p className="text-xs text-muted-foreground">
                          {suggestion.coordinates.lat.toFixed(6)}, {suggestion.coordinates.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAddress && (
        <div className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Address validated and coordinates available
          </span>
        </div>
      )}
    </div>
  );
}