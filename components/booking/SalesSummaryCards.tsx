'use client';

import React from 'react';

interface SalesSummaryData {
  totalRevenue: number;
  totalTransactions: number;
  totalPaid: number;
  totalPending: number;
}

interface SalesSummaryCardsProps {
  summary: SalesSummaryData;
}

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Total Revenue */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
        <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success mb-3">
          <i className='bx bx-wallet text-2xl'></i>
        </div>
        <span className="block text-txt-secondary text-sm mb-1">Total Revenue</span>
        <h3 className="text-2xl font-bold text-txt-primary mb-3">
          IDR {summary.totalRevenue.toLocaleString('id-ID')}
        </h3>
        <div className="flex items-center gap-1 text-xs text-success font-medium">
           <i className='bx bx-arrow-up'></i>
           <span>+12.5%</span>
           <span className="text-txt-muted font-normal ml-1">vs last month</span>
        </div>
      </div>

      {/* Transactions Count */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
        <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-info mb-3">
          <i className='bx bx-cart text-2xl'></i>
        </div>
        <span className="block text-txt-secondary text-sm mb-1">Total Transactions</span>
        <h3 className="text-2xl font-bold text-txt-primary mb-3">
          {summary.totalTransactions}
        </h3>
        <div className="flex items-center gap-1 text-xs text-success font-medium">
           <i className='bx bx-arrow-up'></i>
           <span>+5.2%</span>
           <span className="text-txt-muted font-normal ml-1">vs last month</span>
        </div>
      </div>

      {/* Paid Amount */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
        <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary mb-3">
          <i className='bx bx-check-circle text-2xl'></i>
        </div>
        <span className="block text-txt-secondary text-sm mb-1">Paid Amount</span>
        <h3 className="text-2xl font-bold text-txt-primary mb-3">
          IDR {summary.totalPaid.toLocaleString('id-ID')}
        </h3>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
           <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
        </div>
      </div>

      {/* Pending Amount */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
        <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning mb-3">
          <i className='bx bx-time-five text-2xl'></i>
        </div>
        <span className="block text-txt-secondary text-sm mb-1">Pending Amount</span>
        <h3 className="text-2xl font-bold text-txt-primary mb-3">
          IDR {summary.totalPending.toLocaleString('id-ID')}
        </h3>
        <p className="text-xs text-txt-muted">
          Needs attention
        </p>
      </div>

    </div>
  );
}