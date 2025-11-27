'use client';

import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string; // Format: "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TimePicker({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Pilih waktu",
  className = "" 
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value on mount and when value changes
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '');
      setSelectedMinute(minute || '');
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes (00, 15, 30, 45 for simplicity, or 00-59)
  const minutes = ['00', '15', '30', '45'];

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    const newValue = `${hour}:${selectedMinute || '00'}`;
    onChange(newValue);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    const newValue = `${selectedHour || '00'}:${minute}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const displayValue = value ? value : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left text-sm
          bg-white dark:bg-[#2b2c40] 
          border border-gray-200 dark:border-[#4e4f6c] 
          rounded-md 
          text-txt-primary dark:text-[#d5d5e2]
          transition-all duration-150
          focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${!value ? 'text-txt-muted dark:text-[#7e7f96]' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <i className='bx bx-time text-lg'></i>
            {displayValue}
          </span>
          <i className={`bx bx-chevron-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-lg shadow-lg overflow-hidden">
          <div className="flex">
            {/* Hours Column */}
            <div className="flex-1 border-r border-gray-200 dark:border-[#4e4f6c]">
              <div className="px-3 py-2 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] bg-gray-50 dark:bg-[#232333] border-b border-gray-200 dark:border-[#4e4f6c]">
                Jam
              </div>
              <div className="max-h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourSelect(hour)}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors
                      ${selectedHour === hour 
                        ? 'bg-primary text-white' 
                        : 'text-txt-primary dark:text-[#d5d5e2] hover:bg-gray-100 dark:hover:bg-[#35365f]'
                      }
                    `}
                  >
                    {hour}:00
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1">
              <div className="px-3 py-2 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] bg-gray-50 dark:bg-[#232333] border-b border-gray-200 dark:border-[#4e4f6c]">
                Menit
              </div>
              <div className="max-h-48 overflow-y-auto">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteSelect(minute)}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors
                      ${selectedMinute === minute 
                        ? 'bg-primary text-white' 
                        : 'text-txt-primary dark:text-[#d5d5e2] hover:bg-gray-100 dark:hover:bg-[#35365f]'
                      }
                    `}
                  >
                    :{minute}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-t border-gray-200 dark:border-[#4e4f6c] bg-gray-50 dark:bg-[#232333]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange('08:00');
                  setIsOpen(false);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] rounded hover:bg-primary/20 transition-colors"
              >
                08:00
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('09:00');
                  setIsOpen(false);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] rounded hover:bg-primary/20 transition-colors"
              >
                09:00
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('17:00');
                  setIsOpen(false);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] rounded hover:bg-primary/20 transition-colors"
              >
                17:00
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('21:00');
                  setIsOpen(false);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] rounded hover:bg-primary/20 transition-colors"
              >
                21:00
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
