"use client";

import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { SalesSummary } from '@/types/sales';

interface SalesSummaryCardsProps {
  summary: SalesSummary;
}

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                IDR {summary.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                IDR {summary.totalPaid.toLocaleString('id-ID')}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                IDR {summary.totalPending.toLocaleString('id-ID')}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
