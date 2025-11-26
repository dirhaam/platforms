'use client';

import { Button } from '@/components/ui/button';

interface LogsDialogProps {
  open: boolean;
  logs: string[];
  logFilter: string;
  logCategories: Record<string, number>;
  onClose: () => void;
  onFilterChange: (filter: string) => void;
}

export function LogsDialog({
  open,
  logs,
  logFilter,
  logCategories,
  onClose,
  onFilterChange,
}: LogsDialogProps) {
  if (!open) return null;

  const getLogColor = (log: string) => {
    if (log.includes('ERROR') || log.includes('error')) return 'bg-red-100';
    if (log.includes('WARN') || log.includes('warning')) return 'bg-yellow-100';
    if (log.includes('booking') || log.includes('reminder') || log.includes('jadwal')) return 'bg-blue-100';
    if (log.includes('payment') || log.includes('invoice') || log.includes('pembayaran')) return 'bg-green-100';
    if (log.includes('System health') || log.includes('INFO:')) return 'bg-purple-100';
    return 'bg-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">WhatsApp Logs</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', 'booking', 'payment', 'general', 'system'].map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={logFilter === filter ? 'default' : 'outline'}
              onClick={() => onFilterChange(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({logCategories[filter] || 0})
            </Button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 ${getLogColor(log)} rounded text-sm font-mono break-all`}
                >
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              {logFilter === 'all' ? 'No logs available' : `No ${logFilter} logs available`}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-gray-600">
          <div className="font-semibold mb-2">Color Legend:</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span>Errors</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 rounded"></div>
              <span>Warnings</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 rounded"></div>
              <span>Booking/Reminders</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-100 rounded"></div>
              <span>System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
