import React from 'react';
import { Label } from '@/components/ui/label';
import { Service } from '@/types/booking';

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string;
  onServiceSelect: (serviceId: string) => void;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onServiceSelect,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Service</Label>
      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {services.map(service => (
          <div
            key={service.id}
            onClick={() => onServiceSelect(service.id)}
            className={`
              relative p-3 rounded-lg border cursor-pointer transition-all duration-200 flex justify-between items-center group
              ${selectedServiceId === service.id
                ? 'border-primary bg-primary-light shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50'}
            `}
          >
            <div>
              <div className={`text-sm font-semibold ${selectedServiceId === service.id ? 'text-primary' : 'text-txt-primary'}`}>
                {service.name}
              </div>
              <div className={`text-xs mt-1 ${selectedServiceId === service.id ? 'text-primary/80' : 'text-txt-muted'}`}>
                <i className='bx bx-time-five inline-block mr-1'></i>{service.duration} min
              </div>
            </div>
            <div className={`text-sm font-bold ${selectedServiceId === service.id ? 'text-primary' : 'text-txt-primary'}`}>
              IDR {service.price.toLocaleString('id-ID')}
            </div>
            
            {selectedServiceId === service.id && (
                <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-primary"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
