import React from 'react';
import { Card, Typography } from 'antd';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'orange';
  onClick?: () => void;
  isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  trendUp,
  icon,
  color,
  onClick,
  isActive
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600'
  } as const;

  return (
    <Card
      hoverable
      onClick={onClick}
      className={`border transition-all duration-200 cursor-pointer relative overflow-hidden ${
        isActive
          ? 'ring-2 ring-blue-500 border-transparent shadow-lg shadow-blue-100/60'
          : 'border-slate-100 shadow-sm'
      }`}
      styles={{ body: { padding: 24 } }}>
      {isActive && (
        <div className='absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-bl-lg' />
      )}
      <div className='flex justify-between items-start gap-4'>
        <div>
          <Typography.Text className='text-sm font-medium text-slate-500 block mb-1'>
            {title}
          </Typography.Text>
          <Typography.Title level={3} className='!m-0 !text-slate-800'>
            {value}
          </Typography.Title>
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]}`}>{icon}</div>
      </div>
      {trend && (
        <div className='mt-4 flex items-center text-xs'>
          <Typography.Text
            className={
              trendUp
                ? '!text-emerald-600 font-medium'
                : '!text-red-500 font-medium'
            }>
            {trend}
          </Typography.Text>
          <Typography.Text className='text-slate-400 ml-2'>
            vs 上次数据采集时间
          </Typography.Text>
        </div>
      )}
    </Card>
  );
};

export default KpiCard;
