'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPendingItems } from '@/lib/offline/queue';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const updatePending = async () => {
      try {
        const pending = await getPendingItems();
        setPendingCount(pending.length);
      } catch (e) {
        // IndexedDB not ready yet
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync via service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC' });
        setIsSyncing(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setIsSyncing(false);
        if (event.data.synced > 0) {
          setShowSyncSuccess(true);
          setTimeout(() => setShowSyncSuccess(false), 3000);
        }
        updatePending();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    updatePending();
    const interval = setInterval(updatePending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC' });
      setIsSyncing(true);
    }
  };

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-lg border border-amber-200">
          <CloudOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline Mode</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* Pending sync indicator (online but has pending) */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <Button
          onClick={handleManualSync}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        >
          <Cloud className="w-4 h-4" />
          <span>Sync {pendingCount} items</span>
        </Button>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-lg border border-blue-200">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      )}

      {/* Sync success indicator */}
      {showSyncSuccess && (
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-lg border border-green-200 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Synced successfully!</span>
        </div>
      )}
    </div>
  );
}
