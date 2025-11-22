import React from 'react';
import { Label } from '@/components/ui/label';
import { TimeSlot } from '@/types/booking';
import { formatTime } from './helpers';

interface ScheduleSectionProps {
  scheduledAt: string;
  selectedTimeSlot: TimeSlot | undefined;
  onOpenDateTimePicker: () => void;
}

export function ScheduleSection({
  scheduledAt,
  selectedTimeSlot,
  onOpenDateTimePicker,
}: ScheduleSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Schedule</Label>
      <button
        type="button"
        onClick={onOpenDateTimePicker}
        className={`
          w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left
          ${scheduledAt 
            ? 'border-primary/50 bg-white text-txt-primary shadow-sm' 
            : 'border-dashed border-gray-300 bg-gray-50 text-txt-muted hover:bg-white hover:border-primary/30'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${scheduledAt ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-txt-muted'}`}>
            <i className='bx bx-calendar'></i>
          </div>
          <div>
            <div className="text-sm font-medium">
              {scheduledAt 
                ? new Date(scheduledAt + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                : 'Select Date'}
            </div>
            <div className="text-xs text-txt-secondary">
              {selectedTimeSlot ? formatTime(selectedTimeSlot.start) : 'Select Time'}
            </div>
          </div>
        </div>
        <i className='bx bx-chevron-right text-xl text-txt-muted'></i>
      </button>
    </div>
  );
}
