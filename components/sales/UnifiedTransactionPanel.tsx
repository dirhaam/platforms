import React, { useState } from 'react';
import { SalesTransaction } from '@/types/sales';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface UnifiedTransactionPanelProps {
    transaction: SalesTransaction;
    onClose: () => void;
    onGenerateInvoice?: (transaction: SalesTransaction) => Promise<void>;
    isGeneratingInvoice?: boolean;
}

export function UnifiedTransactionPanel({
    transaction,
    onClose,
    onGenerateInvoice,
    isGeneratingInvoice,
}: UnifiedTransactionPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'financials'>('overview');

    const formatCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;
    const formatDate = (date?: Date | string) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const STATUS_COLORS: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        failed: 'bg-red-100 text-red-800 border-red-200',
    };

    const renderOverviewTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-6">
                {/* Transaction Info Card */}
                <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Transaction Info</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-txt-secondary">
                                <i className='bx bx-hash text-lg'></i>
                            </div>
                            <div>
                                <p className="text-xs text-txt-muted">Transaction Number</p>
                                <p className="text-sm font-medium text-txt-primary">{transaction.transactionNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-txt-secondary">
                                <i className='bx bx-calendar text-lg'></i>
                            </div>
                            <div>
                                <p className="text-xs text-txt-muted">Date</p>
                                <p className="text-sm font-medium text-txt-primary">{formatDate(transaction.transactionDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-txt-secondary">
                                <i className='bx bx-store text-lg'></i>
                            </div>
                            <div>
                                <p className="text-xs text-txt-muted">Source</p>
                                <p className="text-sm font-medium text-txt-primary">{transaction.source?.replace('_', ' ').toUpperCase() || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Card */}
                {transaction.customer && (
                    <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                        <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Customer Details</h4>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-txt-secondary">
                                <i className='bx bx-user text-xl'></i>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-txt-primary">{transaction.customer.name}</p>
                                <div className="mt-1 space-y-1">
                                    {transaction.customer.phone && (
                                        <div className="flex items-center gap-2 text-xs text-txt-secondary">
                                            <i className='bx bx-phone'></i>
                                            {transaction.customer.phone}
                                        </div>
                                    )}
                                    {transaction.customer.email && (
                                        <div className="flex items-center gap-2 text-xs text-txt-secondary">
                                            <i className='bx bx-envelope'></i>
                                            {transaction.customer.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="font-medium text-txt-primary">Payment Summary</h4>
                        <Badge className={transaction.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {transaction.paymentStatus?.toUpperCase() || 'PENDING'}
                        </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-txt-secondary">Total Amount</span>
                            <span className="font-medium text-txt-primary">{formatCurrency(transaction.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-txt-secondary">Paid Amount</span>
                            <span className="font-medium text-green-600">{formatCurrency(transaction.paidAmount)}</span>
                        </div>
                        {transaction.totalAmount > (transaction.paidAmount || 0) && (
                            <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                                <span className="text-txt-secondary">Remaining</span>
                                <span className="font-medium text-orange-600">{formatCurrency(transaction.totalAmount - (transaction.paidAmount || 0))}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    {onGenerateInvoice && (
                        <button
                            onClick={() => onGenerateInvoice(transaction)}
                            disabled={isGeneratingInvoice}
                            className="p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <i className='bx bx-file'></i>
                            </div>
                            <p className="text-xs font-medium text-txt-primary">Generate Invoice</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderItemsTab = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-txt-muted font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transaction.items && transaction.items.length > 0 ? (
                            transaction.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-txt-primary">{item.serviceName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-txt-primary">{transaction.serviceName || transaction.service?.name || 'Service'}</p>
                                </td>
                                <td className="px-4 py-3 text-right">1</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(transaction.subtotal)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(transaction.subtotal)}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50/50 font-medium">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-txt-secondary">Subtotal</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(transaction.subtotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    const renderFinancialsTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-txt-primary mb-4">Financial Breakdown</h4>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-txt-secondary">Subtotal</span>
                        <span className="font-medium">{formatCurrency(transaction.subtotal)}</span>
                    </div>
                    {transaction.taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-txt-secondary">Tax ({transaction.taxRate}%)</span>
                            <span className="font-medium text-red-600">+{formatCurrency(transaction.taxAmount)}</span>
                        </div>
                    )}
                    {transaction.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-txt-secondary">Discount</span>
                            <span className="font-medium text-green-600">-{formatCurrency(transaction.discountAmount)}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                        <span className="text-txt-primary">Total</span>
                        <span className="text-primary">{formatCurrency(transaction.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {transaction.payments && transaction.payments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <h4 className="font-medium text-txt-primary">Payment History</h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {transaction.payments.map((payment, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                        <i className='bx bx-money'></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-txt-primary">{payment.paymentMethod?.toUpperCase() || 'PAYMENT'}</p>
                                        <p className="text-xs text-txt-muted">{formatDate(payment.paidAt)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-txt-primary">{formatCurrency(payment.paymentAmount)}</p>
                                    {payment.paymentReference && (
                                        <p className="text-xs text-txt-muted">Ref: {payment.paymentReference}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-card shadow-card flex flex-col h-full overflow-hidden border-0">
            {/* HEADER SECTION */}
            <div className="p-6 border-b border-gray-100 bg-white z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <i className='bx bx-receipt text-2xl'></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-txt-primary">{transaction.transactionNumber}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${STATUS_COLORS[transaction.status] || 'bg-gray-100 text-gray-800'} border px-2 py-0.5 text-xs font-semibold capitalize shadow-none`}>
                                    {transaction.status}
                                </Badge>
                                <span className="text-txt-muted text-sm">•</span>
                                <span className="text-txt-muted text-sm">{formatDate(transaction.transactionDate)}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-txt-muted hover:text-txt-primary">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* TABS HEADER */}
            <div className="px-6 border-b border-gray-100 flex gap-6 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: 'bx bx-grid-alt' },
                    { id: 'items', label: 'Items', icon: 'bx bx-list-ul' },
                    { id: 'financials', label: 'Financials', icon: 'bx bx-dollar-circle' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
              py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 px-1
              ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-txt-muted hover:text-txt-primary hover:border-gray-200'}
            `}
                    >
                        <i className={`${tab.icon} text-base`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 bg-body/30">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'items' && renderItemsTab()}
                {activeTab === 'financials' && renderFinancialsTab()}
            </div>
        </div>
    );
}
