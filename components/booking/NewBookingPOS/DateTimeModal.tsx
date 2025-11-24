import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BlockingDateCalendar } from '@/components/booking/BlockingDateCalendar';
import { TimeSlot } from '@/types/booking';
import { formatTime, groupSlotsByPeriod } from './helpers';

interface DateTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStep: 'date' | 'time';
  onStepChange: (step: 'main' | 'date' | 'time' | 'homevisit') => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  selectedTimeSlot: TimeSlot | undefined;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  availableSlots: TimeSlot[];
  blockedDates: Map<string, string>;
  serviceId: string;
  subdomain: string;
}

export function DateTimeModal({
  open,
  onOpenChange,
  currentStep,
  onStepChange,
  selectedDate,
  onDateSelect,
  selectedTimeSlot,
  onTimeSlotSelect,
  availableSlots,
  blockedDates,
  serviceId,
  subdomain,
}: DateTimeModalProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      onDateSelect(dateStr);
      onStepChange('time');
      
      setTimeout(() => {
        if (serviceId && subdomain) {
          fetch(
            `/api/bookings/availability?serviceId=${serviceId}&date=${dateStr}`,
            { headers: { 'x-tenant-id': subdomain } }
          ).then(r => r.json()).then(data => {
            // This will be handled by parent component's fetchAvailableSlots
          }).catch(err => console.error('Error fetching slots:', err));
        }
      }, 0);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    onTimeSlotSelect(slot);
    onStepChange('main');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        onStepChange('main');
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 [&>button]:hidden rounded-card shadow-lg border-0">
        <DialogTitle className="sr-only">{currentStep === 'date' ? 'Select Date' : 'Select Time'}</DialogTitle>
        <DialogDescription className="sr-only">Choose your preferred appointment {currentStep === 'date' ? 'date' : 'time slot'}</DialogDescription>
        
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-txt-primary">
              {currentStep === 'date' ? 'Select Date' : 'Select Time'}
            </h4>
            <p className="text-xs text-txt-secondary mt-0.5">
              {currentStep === 'date' ? 'Choose your preferred appointment date' : 'Available slots for the selected date'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStepChange('main')}
            className="text-txt-muted hover:bg-gray-100 hover:text-txt-primary rounded-full"
          >
            <i className='bx bx-x text-2xl'></i>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {currentStep === 'date' && (
            <div className="flex justify-center">
              <BlockingDateCalendar
                selected={selectedDate ? new Date(selectedDate + 'T00:00') : undefined}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                blockedDates={blockedDates}
              />
            </div>
          )}

          {currentStep === 'time' && selectedDate && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary-light/30 p-3 rounded-md border border-primary-light">
                <i className='bx bx-calendar-check text-lg'></i>
                Selected Date: {new Date(selectedDate + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              
              {availableSlots.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <i className='bx bx-clock-5 text-4xl text-txt-muted mb-3'></i>
                  <p className="text-sm text-txt-secondary">No available time slots for this date.</p>
                  <Button variant="link" onClick={() => onStepChange('date')} className="text-primary mt-2">Pick another date</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);
                    
                    return (
                      <>
                        {morning.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <i className='bx bx-sun'></i> Morning
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {morning.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  className={`
                                    py-2 px-1 rounded-md text-sm font-medium border transition-all
                                    ${selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                      ? 'bg-primary text-white border-primary shadow-md' 
                                      : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                  `}
                                >
                                  {formatTime(slot.start)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {afternoon.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <i className='bx bx-sun text-warning'></i> Afternoon
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {afternoon.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  className={`
                                    py-2 px-1 rounded-md text-sm font-medium border transition-all
                                    ${selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                      ? 'bg-primary text-white border-primary shadow-md' 
                                      : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                  `}
                                >
                                  {formatTime(slot.start)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {evening.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <i className='bx bx-moon text-primary-dark'></i> Evening
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {evening.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  className={`
                                    py-2 px-1 rounded-md text-sm font-medium border transition-all
                                    ${selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                      ? 'bg-primary text-white border-primary shadow-md' 
                                      : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                  `}
                                >
                                  {formatTime(slot.start)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3 justify-between pt-6 border-t border-gray-100 mt-4">
                <Button
                  variant="outline"
                  onClick={() => onStepChange('date')}
                  className="text-txt-secondary"
                >
                  <i className='bx bx-arrow-left mr-1'></i> Back to Date
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onStepChange('main')}
                  className="text-txt-muted"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
