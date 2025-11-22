'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartDataPoint {
    name: string;
    value: number;
    value2?: number;
}

interface DashboardChartsProps {
    type: 'bar' | 'area';
    title: string;
    description?: string;
    data: ChartDataPoint[];
}

export function DashboardCharts({ type, title, description, data }: DashboardChartsProps) {
    return (
        <Card className="h-full shadow-sm border-none">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'bar' ? (
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#697a8d', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#697a8d', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(105, 108, 255, 0.1)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                />
                                <Bar dataKey="value" fill="#696cff" radius={[4, 4, 0, 0]} barSize={30} />
                                {data.some(d => d.value2) && (
                                    <Bar dataKey="value2" fill="#03c3ec" radius={[4, 4, 0, 0]} barSize={30} />
                                )}
                            </BarChart>
                        ) : (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#696cff" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#696cff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#697a8d', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#697a8d', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#696cff"
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
