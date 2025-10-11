import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Star, ArrowRight } from 'lucide-react';
import { Service } from '@/types/booking';

interface ServiceShowcaseProps {
  services: Service[];
  onBookingClick: (service: Service) => void;
  displayMode?: 'grid' | 'list' | 'carousel';
  maxServices?: number;
  showPricing?: boolean;
  primaryColor?: string;
}

export default function ServiceShowcase({ 
  services, 
  onBookingClick,
  displayMode = 'grid',
  maxServices = 6,
  showPricing = true,
  primaryColor = '#3b82f6'
}: ServiceShowcaseProps) {
  const displayServices = services.slice(0, maxServices);

  if (displayMode === 'list') {
    return (
      <div className="space-y-4">
        {displayServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration} min</span>
                    </div>
                    {service.homeVisitAvailable && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>Home visit available</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  {showPricing && (
                    <div className="mb-4">
                      <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                        ${Number(service.price)}
                      </span>
                      {service.homeVisitAvailable && service.homeVisitSurcharge && (
                        <p className="text-sm text-gray-500">
                          +${Number(service.homeVisitSurcharge)} home visit
                        </p>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={() => onBookingClick(service)}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (displayMode === 'carousel') {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {displayServices.map((service) => (
          <Card 
            key={service.id} 
            className="flex-shrink-0 w-80 hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant="secondary">{service.category}</Badge>
              </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration} min</span>
                  </div>
                  {showPricing && (
                    <span className="font-bold text-lg" style={{ color: primaryColor }}>
                      ${Number(service.price)}
                    </span>
                  )}
                </div>
                
                {service.homeVisitAvailable && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <MapPin className="h-4 w-4" />
                    <span>Home visit available</span>
                    {service.homeVisitSurcharge && (
                      <span className="text-gray-500">
                        (+${Number(service.homeVisitSurcharge)})
                      </span>
                    )}
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={() => onBookingClick(service)}
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default grid mode
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayServices.map((service) => (
        <Card key={service.id} className="hover:shadow-lg transition-shadow group">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {service.name}
              </CardTitle>
              <Badge variant="secondary">{service.category}</Badge>
            </div>
            <CardDescription>{service.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{service.duration} min</span>
                </div>
                {showPricing && (
                  <span className="font-bold text-xl" style={{ color: primaryColor }}>
                    ${Number(service.price)}
                  </span>
                )}
              </div>
              
              {service.homeVisitAvailable && (
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                  <MapPin className="h-4 w-4" />
                  <span>Home visit available</span>
                  {service.homeVisitSurcharge && (
                    <span className="text-gray-500">
                      (+${Number(service.homeVisitSurcharge)})
                    </span>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={() => onBookingClick(service)}
                style={{ backgroundColor: primaryColor }}
              >
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}