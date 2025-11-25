import React, { useState } from 'react';
import { SalesTransaction } from '@/types/sales';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UnifiedTransactionPanel } from './UnifiedTransactionPanel';

interface SalesTransactionPanelProps {
  transaction: SalesTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateInvoice?: (transaction: SalesTransaction) => Promise<void>;
  isGeneratingInvoice?: boolean;
}

export function SalesTransactionPanel({
  transaction,
  open,
  onOpenChange,
  onGenerateInvoice,
  isGeneratingInvoice,
}: SalesTransactionPanelProps) {
  const [localGenerating, setLocalGenerating] = useState(false);

  if (!transaction) return null;

  const handleGenerateInvoice = async (tx: SalesTransaction) => {
    if (!onGenerateInvoice) return;

    try {
      setLocalGenerating(true);
      await onGenerateInvoice(tx);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLocalGenerating(false);
    }
  };

  const isLoading = localGenerating || isGeneratingInvoice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-card bg-body border-0">
        <UnifiedTransactionPanel
          transaction={transaction}
          onClose={() => onOpenChange(false)}
          onGenerateInvoice={onGenerateInvoice ? handleGenerateInvoice : undefined}
          isGeneratingInvoice={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
