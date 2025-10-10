'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ExportDialog } from './ExportDialog';
import { ReportGenerator } from './ReportGenerator';
// Platform analytics will be handled separately

interface AnalyticsPageProps {
  tenantId: string;
  isAdmin?: boolean;
}

export function AnalyticsPage({ tenantId, isAdmin = false }: AnalyticsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Platform-wide analytics and reporting' : 'Business insights and performance metrics'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportDialog 
            tenantId={tenantId}
            trigger={
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Data Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isAdmin ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Analytics</h3>
              <p className="text-gray-500">Platform-wide analytics dashboard coming soon.</p>
            </div>
          ) : (
            <AnalyticsDashboard tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportGenerator tenantId={tenantId} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ExportDialog 
              tenantId={tenantId}
              defaultDataType="bookings"
              trigger={
                <div className="p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Bookings Data</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export all booking information including customer details, services, and status
                  </p>
                </div>
              }
            />

            <ExportDialog 
              tenantId={tenantId}
              defaultDataType="customers"
              trigger={
                <div className="p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Customer Data</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export customer information, contact details, and booking history
                  </p>
                </div>
              }
            />

            <ExportDialog 
              tenantId={tenantId}
              defaultDataType="services"
              trigger={
                <div className="p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Services Data</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export service catalog with pricing, performance metrics, and settings
                  </p>
                </div>
              }
            />

            <ExportDialog 
              tenantId={tenantId}
              defaultDataType="financial"
              trigger={
                <div className="p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Download className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="font-medium">Financial Data</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export revenue, payment status, and financial performance data
                  </p>
                </div>
              }
            />
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Export Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Excel format (.xlsx) is recommended for data analysis and manipulation</li>
              <li>• CSV format is ideal for importing into other systems</li>
              <li>• PDF format provides a formatted, printable version of your data</li>
              <li>• All exports respect your selected date range and include relevant data only</li>
              <li>• Large datasets may take a few moments to generate</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}