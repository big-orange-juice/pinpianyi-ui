

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Label, Area, Bar } from 'recharts';
import { ChartDataPoint } from '../types';
import { Layers, BarChart3, Package, TrendingUp } from 'lucide-react';

interface PriceChartProps {
  data: ChartDataPoint[];
  title: string;
  productName?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200 text-xs z-50 min-w-[220px]">
        <p className="font-bold text-slate-700 mb-2 pb-2 border-b border-slate-100">{label}</p>
        
        {/* Prices Section */}
        <div className="space-y-1.5 mb-3">
            {payload.filter((p: any) => !['salesVolume', 'inventoryLevel'].includes(p.dataKey)).map((p: any, idx: number) => {
            const dataPoint = p.payload;
            let extraInfo = '';
            
            if (p.name === '京东万商' && dataPoint.jdEvent) extraInfo = dataPoint.jdEvent;
            if (p.name === '易久批' && dataPoint.yjpEvent) extraInfo = dataPoint.yjpEvent;
            if (p.name === '鲜世纪' && dataPoint.xsjEvent) extraInfo = dataPoint.xsjEvent;

            return (
                <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                        <span className="font-medium text-slate-600">{p.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">¥{p.value}</span>
                </div>
                {extraInfo && <div className="text-[10px] text-red-500 bg-red-50 px-1 py-0.5 rounded w-fit ml-3.5 mt-0.5">{extraInfo}</div>}
                </div>
            );
            })}
        </div>

        {/* Overlays Section */}
        {payload.some((p: any) => ['salesVolume', 'inventoryLevel'].includes(p.dataKey)) && (
             <div className="pt-2 border-t border-slate-100 space-y-1.5">
                 {payload.filter((p: any) => ['salesVolume', 'inventoryLevel'].includes(p.dataKey)).map((p: any, idx: number) => (
                      <div key={`overlay-${idx}`} className="flex justify-between items-center gap-4 text-slate-500">
                          <span className="font-medium flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }}></div>
                               {p.name}
                          </span>
                          <span className="font-mono">{p.value} {p.dataKey === 'salesVolume' ? '件' : '箱'}</span>
                      </div>
                 ))}
             </div>
        )}
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, title, productName }) => {
  // Toggle States
  const [showSales, setShowSales] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  // Find the lowest point to add a reference annotation
  let lowestPoint: { val: number, date: string, platform: string } | null = null;
  data.forEach(d => {
      if (d.jdPrice && (!lowestPoint || d.jdPrice < lowestPoint.val)) lowestPoint = { val: d.jdPrice, date: d.date, platform: 'JD' };
      if (d.yjpPrice && (!lowestPoint || d.yjpPrice < lowestPoint.val)) lowestPoint = { val: d.yjpPrice, date: d.date, platform: 'YJP' };
      if (d.xsjPrice && (!lowestPoint || d.xsjPrice < lowestPoint.val)) lowestPoint = { val: d.xsjPrice, date: d.date, platform: 'XSJ' };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[520px] flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">历史价格走势图</h3>
            {productName && (
                <p className="text-sm text-slate-500 mt-1 max-w-md truncate">
                    商品：<span className="font-medium text-blue-600">{productName}</span>
                </p>
            )}
          </div>
          
          {/* Chart Controls */}
          <div className="flex flex-wrap items-center gap-2">
              <button 
                  onClick={() => setShowSales(!showSales)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showSales ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                  <BarChart3 size={14} /> 叠加销量
              </button>
              <button 
                  onClick={() => setShowInventory(!showInventory)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showInventory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                  <Package size={14} /> 叠加库存
              </button>
              <button 
                  onClick={() => setShowBenchmarks(!showBenchmarks)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showBenchmarks ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                  <TrendingUp size={14} /> 市场基准线
              </button>
          </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            
            <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
                dy={10}
            />
            
            {/* Left Y-Axis: Price */}
            <YAxis 
                yAxisId="left"
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']} 
                tickFormatter={(val) => `¥${val}`}
            />

            {/* Right Y-Axis: Volume/Stock */}
            <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#cbd5e1" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                hide={!showSales && !showInventory}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }}/>
            
            {/* --- OVERLAYS (Rendered first to be behind lines) --- */}
            {showInventory && (
                <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="inventoryLevel" 
                    name="库存量" 
                    stroke="none" 
                    fill="#e0e7ff" 
                    fillOpacity={0.4}
                />
            )}
            
            {showSales && (
                <Bar 
                    yAxisId="right"
                    dataKey="salesVolume" 
                    name="销量" 
                    fill="#fed7aa" 
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                    opacity={0.6}
                />
            )}

            {/* --- MAIN LINES --- */}

            {/* Our Price */}
            <Line 
                yAxisId="left"
                type="stepAfter" 
                dataKey="ourPrice" 
                name="我方售价" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }} 
                zIndex={20}
            />
            
            {/* Market Benchmarks */}
            {showBenchmarks && (
                <>
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="marketMedian" 
                        name="市场中位数" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false}
                        opacity={0.7}
                    />
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="marketMin" 
                        name="市场最低价" 
                        stroke="#059669" 
                        strokeWidth={1} 
                        strokeDasharray="3 3" 
                        dot={false}
                        opacity={0.5}
                    />
                </>
            )}

            {/* Competitors */}
            <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="jdPrice" 
                name="京东万商" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={(props: any) => {
                    const hasEvent = props.payload.jdEvent;
                    if (hasEvent) return <circle cx={props.cx} cy={props.cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />;
                    return null;
                }}
            />
            
            <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="yjpPrice" 
                name="易久批" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={false}
            />

            <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="xsjPrice" 
                name="鲜世纪" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={false}
            />

            {/* Annotation for Lowest Price */}
            {lowestPoint && (
                 <ReferenceDot yAxisId="left" x={lowestPoint.date} y={lowestPoint.val} r={5} fill="#f59e0b" stroke="white" strokeWidth={2}>
                    <Label 
                        value={`低 ¥${lowestPoint.val}`} 
                        position="top" 
                        fill="#f59e0b" 
                        fontSize={11} 
                        fontWeight="bold"
                        offset={10}
                        className="bg-white shadow-sm"
                    />
                 </ReferenceDot>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 justify-center">
         <span>提示：点击顶部按钮可叠加【销量/库存/市场基准】图层，辅助归因分析。</span>
      </div>
    </div>
  );
};

export default PriceChart;