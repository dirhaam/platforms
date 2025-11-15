import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursDisplayProps {
  businessHours: BusinessHours | null;
  className?: string;
  compact?: boolean;
}

export default function BusinessHoursDisplay({ 
  businessHours, 
  className = '',
  compact = false,
}: BusinessHoursDisplayProps) {
  // Handle if businessHours is still a string
  let schedule = businessHours;
  if (typeof businessHours === 'string') {
    try {
      schedule = JSON.parse(businessHours);
    } catch (e) {
      console.error('Error parsing businessHours:', e);
      schedule = null;
    }
  }

  if (!schedule) {
    return compact ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <XCircle className="h-4 w-4" style={{ color: 'var(--muted-foreground, #9ca3af)' }} />
        <span className="text-sm" style={{ color: 'var(--muted-foreground, #6b7280)' }}>No hours set</span>
      </div>
    ) : (
      <div className={`p-4 text-center ${className}`} style={{ color: 'var(--muted-foreground, #6b7280)' }}>
        Business hours not set
      </div>
    );
  }

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = schedule[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  const getCurrentStatus = () => {
    if (!isOpenToday || !todayHours) {
      return { status: 'closed', message: 'Closed today' };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    if (currentTime < openTime) {
      return { 
        status: 'closed', 
        message: `Opens at ${todayHours.openTime}` 
      };
    } else if (currentTime >= openTime && currentTime < closeTime) {
      return { 
        status: 'open', 
        message: `Open until ${todayHours.closeTime}` 
      };
    } else {
      return { 
        status: 'closed', 
        message: 'Closed for today' 
      };
    }
  };

  const currentStatus = getCurrentStatus();

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  } as const;

  const dayOrder: Array<keyof typeof dayNames> = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {currentStatus.status === 'open' ? (
          <CheckCircle className="h-4 w-4" style={{ color: 'var(--success-color, #16a34a)' }} />
        ) : (
          <XCircle className="h-4 w-4" style={{ color: 'var(--danger-color, #ef4444)' }} />
        )}
        <span className="text-sm font-medium" style={{ color: currentStatus.status === 'open' ? 'var(--success-color, #16a34a)' : 'var(--danger-color, #ef4444)' }}>
          {currentStatus.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5" style={{ color: 'var(--primary-color, #3b82f6)' }} />
        <span className="font-semibold" style={{ color: 'var(--foreground, #0f172a)' }}>Business Hours</span>
        <span
          className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: currentStatus.status === 'open' ? 'color-mix(in srgb, var(--success-color, #16a34a) 15%, transparent)' : 'color-mix(in srgb, var(--danger-color, #ef4444) 15%, transparent)',
            color: currentStatus.status === 'open' ? 'var(--success-color, #16a34a)' : 'var(--danger-color, #ef4444)',
            border: `1px solid ${currentStatus.status === 'open' ? 'color-mix(in srgb, var(--success-color, #16a34a) 40%, transparent)' : 'color-mix(in srgb, var(--danger-color, #ef4444) 40%, transparent)'}`,
          }}
        >
          {currentStatus.status === 'open' ? 'Open Now' : 'Closed'}
        </span>
      </div>

      <div className="space-y-2">
        {dayOrder.map((dayKey) => {
          const hours = (schedule as BusinessHours)[dayKey];
          const isToday = dayKey === (currentDay as keyof typeof dayNames);
          return (
            <div
              key={dayKey}
              className="flex items-center justify-between px-3 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: isToday ? 'var(--info-bg, rgba(59,130,246,0.08))' : 'var(--surface, #ffffff)',
                borderColor: isToday ? 'color-mix(in srgb, var(--primary-color, #3b82f6) 40%, #e5e7eb)' : 'var(--border-color, #e5e7eb)',
              }}
            >
              <div className="flex flex-col w-40">
                <span className="font-medium text-sm" style={{ color: isToday ? 'var(--primary-color, #3b82f6)' : 'var(--foreground, #0f172a)' }}>
                  {dayNames[dayKey]}{isToday && <span className="text-xs ml-1 font-medium" style={{ color: 'var(--primary-color, #3b82f6)' }}>(Today)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hours && hours.isOpen ? (
                  <>
                    <span className="text-sm" style={{ color: 'var(--foreground, #0f172a)' }}>
                      {hours.openTime} - {hours.closeTime}
                    </span>
                    {isToday && currentStatus.status === 'open' && (
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--success-color, #16a34a) 15%, transparent)',
                          color: 'var(--success-color, #16a34a)',
                          border: '1px solid color-mix(in srgb, var(--success-color, #16a34a) 40%, transparent)'
                        }}
                      >
                        Open Now
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold" style={{ color: 'var(--danger-color, #ef4444)' }}>Closed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentStatus.status === 'closed' && (
        <div className="mt-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--info-bg, rgba(59,130,246,0.08))' }}>
          <p className="text-sm" style={{ color: 'var(--primary-color, #3b82f6)' }}>
            <strong>Next opening:</strong> {getNextOpening(schedule, currentDay as keyof typeof dayNames)}
          </p>
        </div>
      )}
    </div>
  );
}

function getNextOpening(businessHours: BusinessHours | null, currentDay: string): string {
  if (!businessHours) {
    return 'Check back later';
  }
  
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentIndex = dayOrder.indexOf(currentDay);
  
  // Check remaining days this week
  for (let i = 1; i < 7; i++) {
    const nextDayIndex = (currentIndex + i) % 7;
    const nextDay = dayOrder[nextDayIndex];
    const nextDayHours = businessHours[nextDay];
    
    if (nextDayHours?.isOpen) {
      const dayName = {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
      }[nextDay];
      
      return `${dayName} at ${nextDayHours.openTime}`;
    }
  }
  
  return 'Check back later';
}