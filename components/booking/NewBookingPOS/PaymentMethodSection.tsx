import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PaymentMethodSectionProps {
  paymentMethod: string;
  dpAmount: number;
  onPaymentMethodChange: (method: string) => void;
  onDpAmountChange: (amount: number) => void;
}

export function PaymentMethodSection({
  paymentMethod,
  dpAmount,
  onPaymentMethodChange,
  onDpAmountChange,
}: PaymentMethodSectionProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 border border-gray-100">
      <h5 className="text-sm font-bold text-txt-primary uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Payment Method</h5>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { id: 'cash', label: 'Cash', icon: 'bx-money' },
          { id: 'card', label: 'Card', icon: 'bx-credit-card' },
          { id: 'qris', label: 'QRIS', icon: 'bx-qr-scan' },
          { id: 'transfer', label: 'Transfer', icon: 'bx-transfer' }
        ].map(method => (
          <button
            key={method.id}
            type="button"
            onClick={() => onPaymentMethodChange(method.id)}
            className={`
              flex items-center gap-2 justify-center py-2.5 px-3 rounded-md border text-sm font-medium transition-all
              ${paymentMethod === method.id 
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' 
                : 'bg-white text-txt-secondary border-gray-200 hover:bg-gray-50 hover:border-primary/50'}
            `}
          >
            <i className={`bx ${method.icon} text-lg`}></i>
            {method.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dpAmount" className="text-xs font-semibold text-txt-secondary">Down Payment (Optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xs">IDR</span>
          <Input
            id="dpAmount"
            type="number"
            min="0"
            placeholder="0"
            value={dpAmount || ''}
            onChange={(e) => onDpAmountChange(parseInt(e.target.value) || 0)}
            className="pl-9 h-9 text-sm bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
