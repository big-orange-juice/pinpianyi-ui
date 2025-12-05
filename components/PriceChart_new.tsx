'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ChartDataPoint } from '../types';
import { Layers, BarChart3, Package, TrendingUp } from 'lucide-react';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
]);

interface PriceChartProps {
  data: ChartDataPoint[];
  title: string;
  productName?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, title, productName }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showSales, setShowSales] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          
          const dataIndex = params[0].dataIndex;
          const dataPoint = data[dataIndex];
          
          let html = `<div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">${dataPoint.name}</div>`;
          
          params.forEach((param: any) => {
            if (param.seriesType === 'line') {
              html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
                  <span style="margin-right: 16px;">${param.seriesName}</span>
                  <span style="font-weight: bold;">¥${param.value}</span>
                </div>
              `;
            } else if (param.seriesType === 'bar') {
              html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; color: #64748b;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; margin-right: 8px;"></span>
                  <span style="margin-right: 16px;">${param.seriesName}</span>
                  <span style="font-family: monospace;">${param.value} 件</span>
                </div>
              `;
            }
          });
          
          return html;
        },
      },
      legend: {
        data: ['我方价格', '京东万商', '易久批', '鲜世纪', ...(showBenchmarks ? ['市场最低价', '市场中位数'] : []), ...(showSales ? ['销量'] : []), ...(showInventory ? ['库存'] : [])],
        top: 10,
        textStyle: {
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: showSales || showInventory ? '12%' : '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(d => d.name),
        axisLabel: {
          fontSize: 11,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '价格 (¥)',
          position: 'left',
          axisLabel: {
            formatter: '¥{value}',
            fontSize: 11,
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#e2e8f0',
            },
          },
        },
        ...(showSales || showInventory ? [{
          type: 'value',
          name: showSales ? '销量' : '库存',
          position: 'right',
          axisLabel: {
            formatter: '{value}',
            fontSize: 11,
          },
          splitLine: {
            show: false,
          },
        }] : []),
      ],
      series: [
        {
          name: '我方价格',
          type: 'line',
          data: data.map(d => d.ourPrice),
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
          symbol: 'circle',
          symbolSize: 8,
        },
        {
          name: '京东万商',
          type: 'line',
          data: data.map(d => d.jdPrice || null),
          lineStyle: {
            width: 2,
            color: '#ef4444',
          },
          itemStyle: {
            color: '#ef4444',
          },
          symbol: 'diamond',
          symbolSize: 6,
        },
        {
          name: '易久批',
          type: 'line',
          data: data.map(d => d.yjpPrice || null),
          lineStyle: {
            width: 2,
            color: '#10b981',
          },
          itemStyle: {
            color: '#10b981',
          },
          symbol: 'triangle',
          symbolSize: 6,
        },
        {
          name: '鲜世纪',
          type: 'line',
          data: data.map(d => d.xsjPrice || null),
          lineStyle: {
            width: 2,
            color: '#f59e0b',
          },
          itemStyle: {
            color: '#f59e0b',
          },
          symbol: 'rect',
          symbolSize: 6,
        },
        ...(showBenchmarks ? [
          {
            name: '市场最低价',
            type: 'line',
            data: data.map(d => d.marketMin || null),
            lineStyle: {
              width: 2,
              type: 'dashed',
              color: '#6366f1',
            },
            itemStyle: {
              color: '#6366f1',
            },
            symbol: 'none',
          },
          {
            name: '市场中位数',
            type: 'line',
            data: data.map(d => d.marketMedian || null),
            lineStyle: {
              width: 2,
              type: 'dotted',
              color: '#8b5cf6',
            },
            itemStyle: {
              color: '#8b5cf6',
            },
            symbol: 'none',
          },
        ] : []),
        ...(showSales ? [{
          name: '销量',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(d => d.salesVolume || 0),
          itemStyle: {
            color: 'rgba(251, 146, 60, 0.3)',
          },
        }] : []),
        ...(showInventory ? [{
          name: '库存',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(d => d.inventoryLevel || 0),
          itemStyle: {
            color: 'rgba(59, 130, 246, 0.2)',
          },
        }] : []),
      ],
    };

    myChart.setOption(option);

    const handleResize = () => {
      myChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data, showSales, showInventory, showBenchmarks]);

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
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showInventory ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={14} /> 库存水位
          </button>
          <button 
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showBenchmarks ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Layers size={14} /> 市场基准线
          </button>
        </div>
      </div>
      
      <div ref={chartRef} className="flex-1 w-full" style={{ minHeight: '400px' }} />
    </div>
  );
};

export default PriceChart;
