'use client';

import React from 'react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface StaffSelectorProps {
  staff: Staff[];
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
  loading?: boolean;
}

export function StaffSelector({ staff, selectedStaffId, onSelect, loading }: StaffSelectorProps) {
  const activeStaff = staff.filter(s => s.is_active);

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-txt-secondary dark:text-[#b2b2c4]">
          Staff (Opsional)
        </label>
        <div className="h-10 bg-gray-100 dark:bg-[#35365f] rounded-md animate-pulse" />
      </div>
    );
  }

  if (activeStaff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-txt-secondary dark:text-[#b2b2c4]">
        Assign Staff (Opsional)
      </label>
      <select
        value={selectedStaffId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-[#4e4f6c] 
                   bg-gray-50 dark:bg-[#2b2c40] text-txt-primary dark:text-[#d5d5e2]
                   focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                   transition-all duration-150"
      >
        <option value="">-- Tidak di-assign --</option>
        {activeStaff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.role})
          </option>
        ))}
      </select>
      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">
        Bisa di-assign nanti di menu Home Visit Assignment
      </p>
    </div>
  );
}
