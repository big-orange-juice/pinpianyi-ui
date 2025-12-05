import React from 'react';

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

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, trendUp, icon, color, onClick, isActive }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const activeBorder = isActive ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-100';

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border ${activeBorder} hover:shadow-md transition-all cursor-pointer relative overflow-hidden`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-bl-lg"></div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs">
          <span className={trendUp ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs 上次数据采集时间</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;