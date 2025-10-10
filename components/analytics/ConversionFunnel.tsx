'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConversionMetrics } from '@/types/analytics';
import { TrendingDown, TrendingUp, Users, Calendar, CheckCircle } from 'lucide-react';

interface ConversionFunnelProps {
  tenantId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function ConversionFunnel({ tenantId, dateRange }: ConversionFunnelProps) {
  const [data, setData] = useState<ConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversionData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/conversion/${tenantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dateRange),
        });

        if (response.ok) {
          const conversionData = await response.json();
          setData(conversionData);
        }
      } catch (error) {
        console.error('Failed to fetch conversion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversionData();
  }, [tenantId, dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversion Data</h3>
        <p className="text-gray-500">Unable to load conversion metrics. Please try again.</p>
      </div>
    );
  }

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'website visits':
        return <Users className="h-5 w-5" />;
      case 'service views':
        return <TrendingUp className="h-5 w-5" />;
      case 'booking started':
        return <Calendar className="h-5 w-5" />;
      case 'booking completed':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <TrendingDown className="h-5 w-5" />;
    }
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-blue-600 bg-blue-50';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-50';
    if (rate >= 20) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const overallConversionRate = data.websiteVisits > 0 ? 
    (data.completedBookings / data.websiteVisits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Conversion Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate.toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Visitors to completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.bookingAttempts > 0 ? 
                ((data.completedBookings / data.bookingAttempts) * 100).toFixed(1) : 0
              }%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Started to completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop-off Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(100 - overallConversionRate).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Visitors who didn't convert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.conversionFunnel.map((stage, index) => {
              const isFirst = index === 0;
              const previousStage = index > 0 ? data.conversionFunnel[index - 1] : null;
              const dropOffCount = previousStage ? previousStage.count - stage.count : 0;
              const dropOffRate = previousStage ? 
                ((dropOffCount / previousStage.count) * 100) : 0;

              return (
                <div key={stage.stage} className="relative">
                  {/* Drop-off indicator */}
                  {!isFirst && dropOffCount > 0 && (
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <TrendingDown className="h-3 w-3" />
                        <span>{dropOffCount} dropped off ({dropOffRate.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}

                  {/* Stage */}
                  <div className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm">
                    <div className={`p-3 rounded-lg ${getConversionColor(stage.conversionRate)}`}>
                      {getStageIcon(stage.stage)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{stage.stage}</h3>
                        <Badge 
                          variant="secondary" 
                          className={getConversionColor(stage.conversionRate)}
                        >
                          {stage.conversionRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {stage.count.toLocaleString()}
                        </span>
                        {!isFirst && (
                          <span className="text-sm text-gray-500">
                            {((stage.count / data.conversionFunnel[0].count) * 100).toFixed(1)}% of total
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Funnel width visualization */}
                    <div className="w-16 h-8 relative">
                      <div 
                        className="absolute right-0 bg-blue-200 rounded"
                        style={{
                          width: `${Math.max(10, (stage.count / data.conversionFunnel[0].count) * 100)}%`,
                          height: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Analysis</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium">Best Converting Stage</div>
                  <div className="text-lg">
                    {data.conversionFunnel.reduce((best, current) => 
                      current.conversionRate > best.conversionRate ? current : best
                    ).stage}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.conversionFunnel.reduce((best, current) => 
                      current.conversionRate > best.conversionRate ? current : best
                    ).conversionRate.toFixed(1)}% conversion rate
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium">Total Conversions</div>
                  <div className="text-lg">{data.completedBookings}</div>
                  <div className="text-sm text-gray-600">
                    From {data.websiteVisits} website visits
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Optimization Opportunities</h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium">Biggest Drop-off</div>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      let maxDropOff = 0;
                      let maxDropOffStage = '';
                      
                      for (let i = 1; i < data.conversionFunnel.length; i++) {
                        const current = data.conversionFunnel[i];
                        const previous = data.conversionFunnel[i - 1];
                        const dropOff = previous.count - current.count;
                        
                        if (dropOff > maxDropOff) {
                          maxDropOff = dropOff;
                          maxDropOffStage = `${previous.stage} → ${current.stage}`;
                        }
                      }
                      
                      return maxDropOffStage || 'No significant drop-offs';
                    })()}
                  </div>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium">Improvement Potential</div>
                  <div className="text-sm text-gray-600">
                    Focus on reducing drop-offs between service views and booking starts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.websiteVisits}</div>
              <div className="text-sm text-gray-600">Website Visits</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.bookingAttempts}</div>
              <div className="text-sm text-gray-600">Booking Attempts</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.completedBookings}</div>
              <div className="text-sm text-gray-600">Completed Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overallConversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Conversion</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}