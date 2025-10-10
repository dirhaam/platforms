import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursDisplayProps {
  businessHours: BusinessHours;
  className?: string;
  compact?: boolean;
}

export default function BusinessHoursDisplay({ 
  businessHours, 
  className = '',
  compact = false 
}: BusinessHoursDisplayProps) {
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const todayHours = businessHours[currentDay];
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
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {currentStatus.status === 'open' ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${
          currentStatus.status === 'open' ? 'text-green-600' : 'text-red-600'
        }`}>
          {currentStatus.message}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Business Hours</span>
          <Badge 
            variant={currentStatus.status === 'open' ? 'default' : 'secondary'}
            className={currentStatus.status === 'open' ? 'bg-green-600' : 'bg-red-600'}
          >
            {currentStatus.status === 'open' ? 'Open Now' : 'Closed'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(businessHours).map(([day, hours]) => (
            <div 
              key={day} 
              className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                day === currentDay 
                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium capitalize">
                {day === currentDay ? (
                  <span className="text-blue-600">
                    {dayNames[day as keyof typeof dayNames]} (Today)
                  </span>
                ) : (
                  dayNames[day as keyof typeof dayNames]
                )}
              </span>
              <div className="flex items-center space-x-2">
                {hours.isOpen ? (
                  <>
                    <span className="text-gray-700">
                      {hours.openTime} - {hours.closeTime}
                    </span>
                    {day === currentDay && currentStatus.status === 'open' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Open Now
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-red-500 font-medium">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Next Opening Info */}
        {currentStatus.status === 'closed' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next opening:</strong> {getNextOpening(businessHours, currentDay)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getNextOpening(businessHours: BusinessHours, currentDay: string): string {
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