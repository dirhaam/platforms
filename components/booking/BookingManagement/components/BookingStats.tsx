import { Calendar, Clock, Users, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Booking, Service, Customer } from '../types';

interface BookingStatsProps {
  todayBookings: Booking[];
  upcomingBookings: Booking[];
  customers: Customer[];
  services: Service[];
}

export function BookingStats({ todayBookings, upcomingBookings, customers, services }: BookingStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{todayBookings.length}</div>
              <div className="text-sm text-gray-600">Today's Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">{customers.length}</div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{services.length}</div>
              <div className="text-sm text-gray-600">Active Services</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
