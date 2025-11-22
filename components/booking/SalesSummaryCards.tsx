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
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-success">
            <i className='bx bx-dollar text-2xl'></i>
          </div>
          <div className="dropdown">
             <button className="text-txt-muted hover:text-txt-primary transition-colors">
               <i className='bx bx-dots-vertical-rounded text-xl'></i>
             </button>
          </div>
        </div>
        <span className="block text-txt-secondary font-semibold mb-1 text-sm">Total Revenue</span>
        <h3 className="text-xl font-bold text-txt-primary mb-1">
          IDR {summary.totalRevenue.toLocaleString('id-ID')}
        </h3>
        <div className="flex items-center gap-1 text-xs text-success font-medium">
           <i className='bx bx-up-arrow-alt'></i>
           <span>+12.5%</span>
           <span className="text-txt-muted font-normal ml-1">vs last month</span>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-info">
            <i className='bx bx-trending-up text-2xl'></i>
          </div>
          <button className="text-txt-muted hover:text-txt-primary transition-colors">
            <i className='bx bx-dots-vertical-rounded text-xl'></i>
          </button>
        </div>
        <span className="block text-txt-secondary font-semibold mb-1 text-sm">Transactions</span>
        <h3 className="text-xl font-bold text-txt-primary mb-1">
          {summary.totalTransactions}
        </h3>
        <div className="flex items-center gap-1 text-xs text-success font-medium">
           <i className='bx bx-up-arrow-alt'></i>
           <span>+5.2%</span>
           <span className="text-txt-muted font-normal ml-1">vs last month</span>
        </div>
      </div>

      {/* Paid Amount */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
            <i className='bx bx-wallet text-2xl'></i>
          </div>
          <button className="text-txt-muted hover:text-txt-primary transition-colors">
            <i className='bx bx-dots-vertical-rounded text-xl'></i>
          </button>
        </div>
        <span className="block text-txt-secondary font-semibold mb-1 text-sm">Paid Amount</span>
        <h3 className="text-xl font-bold text-txt-primary mb-1">
          IDR {summary.totalPaid.toLocaleString('id-ID')}
        </h3>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
           <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
        </div>
      </div>

      {/* Pending Amount */}
      <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-warning">
            <i className='bx bx-time-five text-2xl'></i>
          </div>
          <button className="text-txt-muted hover:text-txt-primary transition-colors">
            <i className='bx bx-dots-vertical-rounded text-xl'></i>
          </button>
        </div>
        <span className="block text-txt-secondary font-semibold mb-1 text-sm">Pending Amount</span>
        <h3 className="text-xl font-bold text-txt-primary mb-1">
          IDR {summary.totalPending.toLocaleString('id-ID')}
        </h3>
        <p className="text-xs text-txt-muted mt-1">
           Needs attention
        </p>
      </div>

    </div>
  );
}