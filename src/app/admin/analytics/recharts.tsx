"use client";
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
import { formatMoney } from '@/lib/format';

export function AdvancedRevenueChart({ data }: { data: any[] }) {
  // Convert basic array of numbers into recharts format
  const chartData = data.map((value, i) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      month: months[i],
      revenue: value / 100, // Convert cents to dollars for chart
    };
  });

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a4d2e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#1a4d2e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => `$${value}`}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#1a4d2e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConversionFunnelChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} width={120} />
          <Tooltip 
             formatter={(value: any, name: any, props: any) => [`${Number(value).toLocaleString()} (${props.payload.pct}%)`, 'Users']}
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" fill="#1a4d2e" radius={[0, 4, 4, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
