import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { ChartDataPoint } from '../types';

interface DashboardChartsProps {
  type: 'area' | 'bar';
  data: ChartDataPoint[];
  title: string;
  description?: string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ type, data, title, description }) => {
  return (
    <div className="bg-white rounded-card shadow-card h-full flex flex-col">
      <div className="p-6 pb-0">
         <div className="flex justify-between items-start">
            <div>
                <h5 className="text-lg font-semibold text-txt-primary">{title}</h5>
                {description && <p className="text-sm text-txt-muted mt-1">{description}</p>}
            </div>
            <button className="text-txt-muted hover:text-primary">
               <i className='bx bx-dots-vertical-rounded text-xl'></i>
            </button>
         </div>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
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
                tick={{ fill: '#a1acb8', fontSize: 13 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1acb8', fontSize: 13 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)' }}
                cursor={{ stroke: '#696cff', strokeWidth: 1, strokeDasharray: '4 4' }}
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
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef1" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1acb8', fontSize: 13 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1acb8', fontSize: 13 }} 
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)' }}
                 cursor={{ fill: 'rgba(105, 108, 255, 0.05)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="value" name="Revenue" fill="#696cff" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="value2" name="Expenses" fill="#03c3ec" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};