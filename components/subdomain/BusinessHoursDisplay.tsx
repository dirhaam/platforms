import React from 'react';
import { Clock, XCircle } from 'lucide-react';

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursDisplayProps {
  businessHours?: BusinessHours | null | string;
  className?: string;
  compact?: boolean;
  onlyToday?: boolean;
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
  // Parse input (supports string | object | null | undefined)
  let schedule: BusinessHours | null | undefined = businessHours as any;
  if (typeof businessHours === 'string') {
    try {
      schedule = JSON.parse(businessHours);
    } catch {
      schedule = null;
    }
  }
  if (!schedule) {
    return compact || onlyToday ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <XCircle className="h-4 w-4" style={{ color: 'var(--muted-foreground, #9ca3af)' }} />
        <span className="text-sm" style={{ color: 'var(--muted-foreground, #6b7280)' }}>No hours set</span>
      </div>
    ) : (
      <div className={`p-2 ${className}`} style={{ color: 'var(--muted-foreground, #6b7280)' }}>
        Business hours not set
      </div>
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

  const getCurrentStatus = () => {
    if (!todayHours?.isOpen || !todayHours) {
      return { status: 'closed' as const, label: 'Closed' };
    }
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    if (currentTime >= openTime && currentTime < closeTime) {
      return { status: 'open' as const, label: 'Open Now' };
    }
    return { status: 'closed' as const, label: 'Closed' };
  };
  const currentStatus = getCurrentStatus();

  // =========================
  // RENDER ONLY TODAY
  // =========================
  if (compact || onlyToday) {
    const statusNode = renderStatus
      ? renderStatus({ isOpen: currentStatus.status === 'open', label: currentStatus.label })
      : (
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: currentStatus.status === 'open' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
            color: currentStatus.status === 'open' ? 'var(--success-color, #16a34a)' : 'var(--danger-color, #ef4444)',
            border: `1px solid ${currentStatus.status === 'open' ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {currentStatus.label}
        </span>
      );

    const content = (
      <>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: 'var(--primary-color, #3b82f6)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--foreground, #0f172a)' }}>
            {dayNames[currentDay as keyof typeof dayNames]}
          </span>
          {statusNode}
        </div>
        <div className="text-sm" style={{ color: 'var(--foreground, #0f172a)' }}>
          {todayHours?.isOpen ? (
            <span>{todayHours.openTime} - {todayHours.closeTime}</span>
          ) : (
            <span style={{ color: 'var(--danger-color, #ef4444)' }}>Closed</span>
          )}
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
    const isToday = dayKey === (currentDay as keyof typeof dayNames);
    const isOpen = Boolean(hours?.isOpen);
    const badgeNode = isToday && renderStatus
      ? renderStatus({ isOpen, label: isOpen ? 'Open Now' : 'Closed' })
      : isToday
        ? (
          <span
            className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: isOpen ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
              color: isOpen ? 'var(--success-color, #16a34a)' : 'var(--danger-color, #ef4444)',
              border: `1px solid ${isOpen ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        )
        : null;

    return (
      <div
        key={dayKey}
        className="flex items-center justify-between px-3 py-2 rounded-lg border"
        style={{
          backgroundColor: isToday ? 'var(--info-bg, rgba(59,130,246,0.08))' : 'var(--surface, #ffffff)',
          borderColor: isToday ? 'var(--primary-color, #3b82f6)' : 'var(--border-color, #e5e7eb)',
        }}
      >
        <span className="text-sm font-medium" style={{ color: isToday ? 'var(--primary-color, #3b82f6)' : 'var(--foreground, #0f172a)' }}>
          {dayNames[dayKey]}{isToday && <span className="ml-1 text-xs" style={{ color: 'var(--primary-color, #3b82f6)' }}>(Today)</span>}
        </span>
        <span className="text-sm flex items-center" style={{ color: 'var(--foreground, #0f172a)' }}>
          {hours && hours.isOpen ? (
            <>
              {hours.openTime} - {hours.closeTime} {badgeNode}
            </>
          ) : (
            <span style={{ color: 'var(--danger-color, #ef4444)' }}>Closed</span>
          )}
        </span>
      </div>
    );
  });

  return <div className={className}>{weekContent}</div>;
}
