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
        <Card className="h-full shadow-card border-none bg-white rounded-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-txt-primary">{title}</CardTitle>
                {description && <CardDescription className="text-txt-secondary">{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'bar' ? (
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef1" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a1acb8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a1acb8', fontSize: 12 }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(105, 108, 255, 0.05)' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
                                        backgroundColor: '#fff',
                                        color: '#566a7f'
                                    }}
                                    itemStyle={{ color: '#696cff' }}
                                />
                                <Bar dataKey="value" fill="#696cff" radius={[4, 4, 0, 0]} barSize={20} />
                                {data.some(d => d.value2) && (
                                    <Bar dataKey="value2" fill="#03c3ec" radius={[4, 4, 0, 0]} barSize={20} />
                                )}
                            </BarChart>
                        ) : (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#696cff" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#696cff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef1" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a1acb8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a1acb8', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
                                        backgroundColor: '#fff'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#696cff"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
