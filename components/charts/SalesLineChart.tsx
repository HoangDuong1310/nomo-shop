import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Brush
} from 'recharts';

export interface SalesPoint {
  date: string;
  total: number;
  orders: number;
}

interface Props {
  data: SalesPoint[];
  currencyFormatter?: (v: number) => string;
  height?: number;
}

const formatShortDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
  } catch {
    return dateStr;
  }
};

const SalesLineChart: React.FC<Props> = ({ data, currencyFormatter, height = 260 }) => {
  if (!data || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#6b7280" fontSize={12} />
  <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickFormatter={(v: number)=>currencyFormatter?currencyFormatter(v):v.toString()} />
        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
  <Tooltip formatter={(value: any, name: string) => {
          if (name === 'total' && currencyFormatter) return [currencyFormatter(Number(value)), 'Doanh thu'];
          if (name === 'orders') return [value, 'Đơn hàng'];
          return [value, name];
  }} labelFormatter={(label: string)=>`Ngày: ${label}`} />
        <Legend />
        <Line type="monotone" dataKey="total" name="Doanh thu" stroke="#2563eb" strokeWidth={2} dot={false} yAxisId="left" />
        <Line type="monotone" dataKey="orders" name="Đơn hàng" stroke="#10b981" strokeWidth={2} dot={false} yAxisId="right" />
        <Brush dataKey="date" height={20} stroke="#9ca3af" travellerWidth={12}/>
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SalesBarChart: React.FC<Props> = ({ data, currencyFormatter, height = 260 }) => {
  if (!data || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#6b7280" fontSize={12} />
  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number)=>currencyFormatter?currencyFormatter(v):v.toString()} />
  <Tooltip formatter={(value: any, name: string) => {
          if (name === 'total' && currencyFormatter) return [currencyFormatter(Number(value)), 'Doanh thu'];
          if (name === 'orders') return [value, 'Đơn hàng'];
          return [value, name];
  }} labelFormatter={(label: string)=>`Ngày: ${label}`} />
        <Legend />
        <Bar dataKey="total" name="Doanh thu" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="orders" name="Đơn hàng" fill="#10b981" radius={[4,4,0,0]} />
        <Brush dataKey="date" height={20} stroke="#9ca3af" travellerWidth={12}/>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesLineChart;
