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
  // Parse if businessHours is string
  let schedule = businessHours;
  if (typeof businessHours === 'string') {
    try {
      schedule = JSON.parse(businessHours);
    } catch {
      schedule = null;
    }
  }
  if (!schedule) {
    return compact ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <XCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No hours set</span>
      </div>
    ) : (
      <div className={`p-4 text-center text-gray-500 ${className}`}>Business hours not set</div>
    );
  }

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
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];

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
      return { status: 'closed', message: `Opens at ${todayHours.openTime}` };
    } else if (currentTime >= openTime && currentTime < closeTime) {
      return { status: 'open', message: `Open until ${todayHours.closeTime}` };
    } else {
      return { status: 'closed', message: 'Closed for today' };
    }
  };

  const currentStatus = getCurrentStatus();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {currentStatus.status === 'open' ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${currentStatus.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
          {currentStatus.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-slate-700">Business Hours</span>
        <span
          className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border`}
          style={{
            backgroundColor: currentStatus.status === 'open' ? '#d1fae5' : '#fee2e2',
            color: currentStatus.status === 'open' ? '#059669' : '#dc2626',
            borderColor: currentStatus.status === 'open' ? '#34d399' : '#f87171',
          }}
        >
          {currentStatus.status === 'open' ? 'Open Now' : 'Closed'}
        </span>
      </div>

      {/* DAYS LIST */}
      <div className="space-y-2">
        {dayOrder.map((dayKey) => {
          const hours = (schedule as BusinessHours)[dayKey];
          const isToday = dayKey === currentDay;
          return (
            <div
              key={dayKey}
              className={
                "flex items-center justify-between px-4 py-2 transition-colors " +
                (isToday
                  ? "bg-blue-50 border border-blue-300 rounded-xl shadow-sm"
                  : "bg-white")
              }
            >
              <div className="flex flex-col w-40">
                <span className={`font-medium text-sm ${isToday ? "text-blue-700" : "text-slate-700"}`}>
                  {dayNames[dayKey]}
                  {isToday && <span className="text-xs ml-1 font-medium text-blue-600">(Today)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hours && hours.isOpen ? (
                  <>
                    <span className="text-sm text-slate-800">
                      {hours.openTime} - {hours.closeTime}
                    </span>
                    {/* SHOW BADGE ONLY TODAY */}
                    {isToday && currentStatus.status === 'open' && (
                      <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        Open Now
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-red-500">Closed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* TIDAK ADA NEXT OPENING BAGIAN DI BAWAH, sesuai gambar */}
    </div>
  );
}
