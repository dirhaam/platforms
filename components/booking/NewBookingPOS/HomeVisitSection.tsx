import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface HomeVisitSectionProps {
  isHomeVisit: boolean;
  onHomeVisitChange: (checked: boolean) => void;
  homeVisitAddress: string;
  homeVisitLat: number | undefined;
  homeVisitLng: number | undefined;
  onOpenHomeVisitModal: () => void;
}

export function HomeVisitSection({
  isHomeVisit,
  onHomeVisitChange,
  homeVisitAddress,
  homeVisitLat,
  homeVisitLng,
  onOpenHomeVisitModal,
}: HomeVisitSectionProps) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3">
        <Checkbox
          id="homeVisit"
          checked={isHomeVisit}
          onCheckedChange={(checked) => {
            onHomeVisitChange(checked as boolean);
            if (checked as boolean) {
              onOpenHomeVisitModal();
            }
          }}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="homeVisit" className="cursor-pointer text-sm font-medium text-txt-primary select-none flex items-center gap-2">
          <i className='bx bx-map-pin text-lg text-txt-secondary'></i>
          Home Visit Service
        </Label>
      </div>

      {isHomeVisit && homeVisitAddress && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in slide-in-from-top-2">
          <div className="flex gap-2 items-start">
            <i className='bx bx-check-circle text-success mt-0.5'></i>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-txt-primary truncate">{homeVisitAddress}</p>
              <p className="text-xs text-txt-muted font-mono mt-0.5">
                {homeVisitLat?.toFixed(4)}, {homeVisitLng?.toFixed(4)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHomeVisitModal}
            className="w-full mt-2 h-7 text-xs text-primary hover:text-primary-dark hover:bg-primary-light"
          >
            Change Location
          </Button>
        </div>
      )}
    </div>
  );
}
