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
  onlyToday?: boolean;
  // opsional: allow custom render
  renderWrapper?: (children: React.ReactNode) => React.ReactNode;
  renderStatus?: (props: { isOpen: boolean; label: string }) => React.ReactNode;
}

export default function BusinessHoursDisplay({
  businessHours,
  className = '',
  compact = false,
  onlyToday = false,
  renderWrapper,
  renderStatus,
}: BusinessHoursDisplayProps) {
  // Parse input
  let schedule = businessHours;
  if (typeof businessHours === 'string') {
    try { schedule = JSON.parse(businessHours); } catch { schedule = null; }
  }
  if (!schedule) {
    return compact ? (
      <div className={className}>
        <XCircle />
        <span>No hours set</span>
      </div>
    ) : (
      <div className={className}>Business hours not set</div>
    );
  }

  const dayNames = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
  } as const;
  const dayOrder: Array<keyof typeof dayNames> = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = schedule[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  // Status logic
  const statusText = isOpenToday ? 'Open Now' : 'Closed';

  // Custom render for status badge
  const StatusBadge = renderStatus
    ? renderStatus({ isOpen: isOpenToday, label: statusText })
    : (<span>{statusText}</span>);

  // =========================
  // RENDER ONLY TODAY
  // =========================
  if (compact || onlyToday) {
    const content = (
      <>
        <div>
          <Clock />
          <span>{dayNames[currentDay as keyof typeof dayNames]}</span>
          {StatusBadge}
        </div>
        <div>
          {isOpenToday
            ? <span>{todayHours.openTime} - {todayHours.closeTime}</span>
            : <span>Closed</span>
          }
        </div>
      </>
    );
    return renderWrapper ? <>{renderWrapper(content)}</> : <div className={className}>{content}</div>;
  }

  // =========================
  // RENDER FULL WEEK
  // =========================
  const weekContent = dayOrder.map((dayKey) => {
    const hours = schedule[dayKey];
    const isToday = dayKey === currentDay;
    return (
      <div key={dayKey}>
        <span>{dayNames[dayKey]}</span>
        <span>
          {hours && hours.isOpen
            ? (<>{hours.openTime} - {hours.closeTime}{isToday && StatusBadge}</>)
            : "Closed"
          }
        </span>
      </div>
    );
  });

  return (
    <div className={className}>
      {weekContent}
    </div>
  );
}
