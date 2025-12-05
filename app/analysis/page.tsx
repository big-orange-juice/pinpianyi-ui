'use client';

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback
} from 'react';
import Link from 'next/link';
import { Button, Card, Select, Input, Slider, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeft,
  MapPin,
  Activity as ActivityIcon,
  Filter,
  Download,
  FileText,
  Search as SearchIcon,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  Clock,
  Tag
} from 'lucide-react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DatasetComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { MOCK_PRODUCTS, MOCK_COMPETITORS } from '@/constants';
import {
  ActivityType,
  Platform,
  PriceComparisonRow,
  PriceTrend,
  SellThroughStatus,
  PriceStatusFilter,
  StockStatus,
  AnalysisReport
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import AnalysisReportModal from '@/components/AnalysisReportModal';

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  DatasetComponent,
  CanvasRenderer
]);

const PRICE_STATUS_OPTIONS: { label: string; value: PriceStatusFilter }[] = [
  { label: '所有状态', value: 'ALL' },
  { label: '成本倒挂', value: 'COST_INVERSION' },
  { label: '处于劣势', value: 'LOSING' },
  { label: '处于优势', value: 'WINNING' }
];

type GapDatum = { name: string; count: number };

type AggregatedTableRecord = {
  key: string;
  product: (typeof MOCK_PRODUCTS)[number];
  competitorsMap: Record<string, PriceComparisonRow | undefined>;
};

type DetailedTableRecord = PriceComparisonRow & { key: string };

const GapDistributionChart: React.FC<{
  data: GapDatum[];
  activeFilter: string | null;
  onSelect: (name: string) => void;
}> = ({ data, activeFilter, onSelect }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    chart.setOption({
      grid: { left: 24, right: 8, top: 24, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          return `${item.name}: ${item.value} 条`;
        }
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: { fontSize: 11 },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e2e8f0' }
        },
        minInterval: 1
      },
      series: [
        {
          type: 'bar',
          barWidth: '40%',
          data: data.map((item) => ({
            name: item.name,
            value: item.count,
            itemStyle: {
              color: item.name.includes('倒挂')
                ? '#ef4444'
                : item.name.includes('劣势')
                ? '#f97316'
                : '#10b981',
              opacity: activeFilter && activeFilter !== item.name ? 0.35 : 1
            }
          })),
          emphasis: {
            itemStyle: { opacity: 1 }
          }
        }
      ]
    });

    const handleClick = (params: any) => {
      onSelect(params.name);
    };

    chart.on('click', handleClick);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.off('click', handleClick);
      chart.dispose();
    };
  }, [data, activeFilter, onSelect]);

  return <div ref={chartRef} className='h-48 w-full' />;
};

const PriceAnalysisPage = () => {
  const [selectedBarFilter, setSelectedBarFilter] = useState<string | null>(
    null
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const {
    selectedPlatform,
    setSelectedPlatform,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedActivity,
    setSelectedActivity,
    selectedRegion,
    setSelectedRegion,
    selectedPriceStatus,
    setSelectedPriceStatus,
    searchTerm,
    setSearchTerm,
    costThreshold,
    setCostThreshold,
    openAgent,
    isReportModalOpen,
    setReportModalOpen,
    reportData,
    setReportData,
    availablePlatforms,
    currentUser
  } = useAppStore();

  const categories = useMemo(
    () => Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category))),
    []
  );
  const brands = useMemo(
    () => Array.from(new Set(MOCK_PRODUCTS.map((p) => p.brand))),
    []
  );
  const regions = useMemo(() => {
    const unique = new Set<string>(['ALL']);
    Object.values(MOCK_COMPETITORS).forEach((rows) =>
      rows.forEach((row) => unique.add(row.region))
    );
    return Array.from(unique);
  }, []);

  const getBucket = useCallback((gapPercent: number, isInversion: boolean) => {
    if (isInversion) return '严重倒挂';
    if (gapPercent > 5) return '劣势 (>5%)';
    if (gapPercent > 0.5) return '劣势 (0-5%)';
    if (gapPercent >= -0.5) return '持平';
    return '优势';
  }, []);

  const baseTableData: PriceComparisonRow[] = useMemo(() => {
    const rows: PriceComparisonRow[] = [];

    MOCK_PRODUCTS.forEach((product) => {
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory)
        return;
      if (selectedBrand !== 'ALL' && product.brand !== selectedBrand) return;
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return;

      const competitorEntries = MOCK_COMPETITORS[product.id] || [];

      competitorEntries.forEach((compData) => {
        if (selectedRegion !== 'ALL' && compData.region !== selectedRegion)
          return;
        if (
          selectedPlatform !== 'ALL' &&
          compData.platform !== selectedPlatform
        )
          return;
        if (
          selectedActivity !== 'ALL' &&
          compData.activityType !== selectedActivity
        )
          return;

        const effectiveCompPrice = Math.min(
          compData.activityPrice,
          compData.price
        );
        const gap = product.ourPrice - effectiveCompPrice;
        const criticalPriceThreshold =
          product.ourCost * (1 - costThreshold / 100);
        const isBelowCriticalCost =
          costThreshold > 0 && effectiveCompPrice < criticalPriceThreshold;

        const marginRate = product.grossMarginRate / 100;
        const simulatedMargin = effectiveCompPrice - product.ourCost;
        const simulatedMarginRate = simulatedMargin / effectiveCompPrice;

        let status: PriceComparisonRow['status'] = 'Draw';
        if (gap < -0.5) status = 'Win';
        if (gap > 0.5) status = 'Lose';

        if (selectedPriceStatus === 'COST_INVERSION' && !isBelowCriticalCost)
          return;
        if (selectedPriceStatus === 'LOSING' && status !== 'Lose') return;
        if (selectedPriceStatus === 'WINNING' && status !== 'Win') return;

        let alertLevel: PriceComparisonRow['alertLevel'] = 'Normal';
        let recommendation = '维持观察';
        let note = '价格稳定';

        if (status === 'Lose') {
          if (product.strategyRole === 'Traffic') {
            alertLevel = 'Critical';
            recommendation = '流量品跟价';
          } else {
            alertLevel = 'Warning';
            recommendation = '促销应对';
          }
          note = '处于劣势';
        }

        if (isBelowCriticalCost) {
          alertLevel = 'Critical';
          recommendation = '⚠ 成本倒挂';
          note = '击穿成本';
          if (
            compData.platform === Platform.XIAN_SHI_JI &&
            compData.stockStatus === StockStatus.LIMITED
          ) {
            recommendation = '竞对限购(忽略)';
            alertLevel = 'Warning';
            note = '虚假低价(限购)';
          }
        }

        if (compData.activityType !== ActivityType.NONE) {
          note = compData.activityDescription || '大促';
        }

        const estCompMargin =
          (effectiveCompPrice - product.ourCost * 0.95) / effectiveCompPrice;

        rows.push({
          product,
          competitorData: compData,
          priceGap: gap,
          costGap: product.ourCost - effectiveCompPrice,
          marginRate,
          competitorEstimatedMargin: estCompMargin,
          simulatedMargin,
          simulatedMarginRate,
          status,
          alertLevel,
          recommendation,
          analysisNote: note
        });
      });
    });

    return rows;
  }, [
    selectedCategory,
    selectedBrand,
    searchTerm,
    selectedRegion,
    selectedPlatform,
    selectedActivity,
    selectedPriceStatus,
    costThreshold
  ]);

  const gapDistData = useMemo(() => {
    const buckets: Record<string, number> = {
      严重倒挂: 0,
      '劣势 (>5%)': 0,
      '劣势 (0-5%)': 0,
      持平: 0,
      优势: 0
    };

    baseTableData.forEach((row) => {
      const gapPercent = (row.priceGap / row.product.ourPrice) * 100;
      const isBelow =
        costThreshold > 0 &&
        row.competitorData.activityPrice <
          row.product.ourCost * (1 - costThreshold / 100);
      const bucket = getBucket(gapPercent, isBelow);
      buckets[bucket] += 1;
    });

    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [baseTableData, costThreshold, getBucket]);

  const filteredTableData = useMemo(() => {
    if (!selectedBarFilter) return baseTableData;
    return baseTableData.filter((row) => {
      const gapPercent = (row.priceGap / row.product.ourPrice) * 100;
      const isBelow =
        costThreshold > 0 &&
        row.competitorData.activityPrice <
          row.product.ourCost * (1 - costThreshold / 100);
      return getBucket(gapPercent, isBelow) === selectedBarFilter;
    });
  }, [baseTableData, costThreshold, selectedBarFilter, getBucket]);

  const groupedTableData = useMemo(() => {
    if (selectedPlatform !== 'ALL') return null;
    const groups: Record<
      string,
      { product: (typeof MOCK_PRODUCTS)[number]; rows: PriceComparisonRow[] }
    > = {};

    filteredTableData.forEach((row) => {
      if (!groups[row.product.id]) {
        groups[row.product.id] = { product: row.product, rows: [] };
      }
      groups[row.product.id].rows.push(row);
    });

    return Object.values(groups);
  }, [filteredTableData, selectedPlatform]);

  const aggregatedTableData = useMemo<AggregatedTableRecord[]>(() => {
    if (selectedPlatform !== 'ALL' || !groupedTableData) return [];
    return groupedTableData.map(({ product, rows }) => {
      const competitorsMap: Record<string, PriceComparisonRow | undefined> = {};
      availablePlatforms.forEach((platform) => {
        competitorsMap[platform] = rows.find(
          (entry) => entry.competitorData.platform === platform
        );
      });
      return {
        key: product.id,
        product,
        competitorsMap
      };
    });
  }, [availablePlatforms, groupedTableData, selectedPlatform]);

  const detailedTableData = useMemo<DetailedTableRecord[]>(() => {
    if (selectedPlatform === 'ALL') return [];
    return filteredTableData.map((row, index) => ({
      ...row,
      key: `${row.product.id}-${row.competitorData.platform}-${index}`
    }));
  }, [filteredTableData, selectedPlatform]);

  const handleBarSelect = useCallback((bucket: string) => {
    setSelectedBarFilter((prev) => (prev === bucket ? null : bucket));
  }, []);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${date} ${hours}:${minutes}`;
    } catch (error) {
      return dateStr;
    }
  };

  const getPlatformBadge = (platform: string) => {
    if (platform.includes('京东'))
      return 'text-red-700 bg-red-50 border-red-100';
    if (platform.includes('易久批'))
      return 'text-purple-700 bg-purple-50 border-purple-100';
    if (platform.includes('鲜世纪'))
      return 'text-green-700 bg-green-50 border-green-100';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getTrendIcon = (trend: PriceTrend) => {
    switch (trend) {
      case PriceTrend.RISING:
        return <ArrowUpRight size={14} className='text-red-500' />;
      case PriceTrend.FALLING:
        return <ArrowDownRight size={14} className='text-green-500' />;
      case PriceTrend.FLUCTUATING:
        return <ActivityIcon size={14} className='text-orange-500' />;
      default:
        return <Minus size={14} className='text-slate-300' />;
    }
  };

  const getSellThroughBadge = (status: SellThroughStatus) => {
    switch (status) {
      case 'FAST':
        return (
          <span className='flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200'>
            <div className='w-1.5 h-1.5 rounded-full bg-emerald-500' /> 畅销
          </span>
        );
      case 'MEDIUM':
        return (
          <span className='flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200'>
            <div className='w-1.5 h-1.5 rounded-full bg-blue-500' /> 平销
          </span>
        );
      case 'SLOW':
        return (
          <span className='flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200'>
            <div className='w-1.5 h-1.5 rounded-full bg-orange-500' /> 慢销
          </span>
        );
      case 'STAGNANT':
        return (
          <span className='flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200'>
            <div className='w-1.5 h-1.5 rounded-full bg-slate-400' /> 滞销
          </span>
        );
      default:
        return null;
    }
  };

  const createLocalReport = useCallback((): AnalysisReport => {
    const total = filteredTableData.length;
    const losingRows = filteredTableData.filter((row) => row.status === 'Lose');
    const winningRows = filteredTableData.filter((row) => row.status === 'Win');
    const criticalRows = filteredTableData.filter(
      (row) => row.alertLevel === 'Critical'
    );
    const avgGap = total
      ? filteredTableData.reduce((sum, row) => sum + row.priceGap, 0) / total
      : 0;
    const issueItems = losingRows
      .slice(0, 3)
      .map(
        (row) =>
          `SKU ${row.product.name} 在 ${
            row.competitorData.platform
          } 价差 +${row.priceGap.toFixed(1)} 元 (${row.competitorData.region})`
      );
    const opportunityItems = winningRows
      .slice(0, 3)
      .map(
        (row) =>
          `${row.product.name} 对 ${
            row.competitorData.platform
          } 保持 ${Math.abs(row.priceGap).toFixed(1)} 元优势，可酌情放量。`
      );

    const marketTrend: AnalysisReport['marketTrend'] = (() => {
      if (!total) return 'Stable';
      if (criticalRows.length / total > 0.2 || losingRows.length / total > 0.45)
        return 'Bearish';
      if (winningRows.length / total > 0.4 && losingRows.length / total < 0.3)
        return 'Bullish';
      return 'Stable';
    })();

    const summary = total
      ? `共分析 ${total} 条竞品记录，${losingRows.length} 条处于劣势，${
          criticalRows.length
        } 条触发成本预警。需关注 ${selectedRegion} · ${
          selectedPlatform === 'ALL' ? '全平台' : selectedPlatform
        } 的流量品，防止劣势扩散。`
      : '当前筛选条件下暂无竞品数据，请调整筛选后重试。';

    const keyPlatforms = losingRows.filter(
      (row) =>
        row.competitorData.platform.includes('京东') ||
        row.competitorData.platform.includes('易久批')
    );
    const chartInsights = total
      ? `平均价差 ${avgGap >= 0 ? '+' : ''}${avgGap.toFixed(1)} 元，其中 ${
          criticalRows.length
        } 条记录低于成本阈值 (${costThreshold}%)。京东/易久批贡献了 ${
          keyPlatforms.length
        } 条风险，建议与采购/运营同步守价。`
      : '暂无可视化数据。';

    const strategies = total
      ? [
          {
            focus: '流量品护盘',
            action:
              '对价差>+2且属于流量品的SKU立即触发限时调价或补贴方案，防止被竞对截流。',
            impact: '48小时内劣势SKU占比下降20%'
          },
          {
            focus: '活动协同',
            action:
              '提前一周锁定竞对大促节奏，为重点SKU准备同频促销或凑单机制。',
            impact: '大促期毛利率保持在安全红线以上'
          },
          {
            focus: '优势放大',
            action:
              '对优势价差SKU安排补货与在线曝光位，形成“优价+低库存”组合拳。',
            impact: '优势SKU销量周环比+15%'
          }
        ]
      : [
          {
            focus: '数据补全',
            action:
              '重新拉取该区域/平台的数据或放宽筛选条件，确保具备可执行的诊断依据。',
            impact: '完成基础数据诊断'
          }
        ];

    const opportunities = opportunityItems.length
      ? opportunityItems
      : ['暂无明显优势SKU，但可通过调价/活动创造机会。'];
    const issues = issueItems.length
      ? issueItems
      : ['当前暂无重大价差劣势，保持常规巡检即可。'];

    const riskAssessment = total
      ? `若不处理上述 ${
          criticalRows.length || 0
        } 条高风险记录，可能导致重点SKU毛利被压缩 ${costThreshold}% 以上，建议在48小时内完成复盘。`
      : '未获取到数据，短期风险无法评估。';

    return {
      title: `价盘诊断 - ${selectedRegion} · ${
        selectedPlatform === 'ALL' ? '全平台' : selectedPlatform
      }`,
      executiveSummary: summary,
      marketTrend,
      chartInsights,
      coreIssues: issues,
      opportunities,
      strategies,
      riskAssessment,
      generatedAt: new Date()
    };
  }, [filteredTableData, selectedRegion, selectedPlatform, costThreshold]);

  const handleDeepDiagnosis = () => {
    setIsGeneratingReport(true);
    window.setTimeout(() => {
      setReportData(createLocalReport());
      setReportModalOpen(true);
      setIsGeneratingReport(false);
    }, 600);
  };

  const handleExport = () => {
    const headers = [
      'SKU ID',
      '商品名称',
      '品牌',
      '类目',
      '规格',
      '我方售价',
      '成本',
      '竞对平台',
      '竞对价格',
      '价差',
      '状态',
      '建议',
      '分析备注'
    ];

    const csvRows = filteredTableData.map((row) => [
      row.product.id,
      `"${row.product.name}"`,
      row.product.brand,
      row.product.category,
      `"${row.product.spec}"`,
      row.product.ourPrice,
      row.product.ourCost,
      row.competitorData.platform,
      row.competitorData.activityPrice,
      row.priceGap.toFixed(2),
      row.status,
      `"${row.recommendation}"`,
      `"${row.analysisNote}"`
    ]);

    const blob = new Blob(
      [
        `\uFEFF${headers.join(',')}\n${csvRows
          .map((row) => row.join(','))
          .join('\n')}`
      ],
      {
        type: 'text/csv;charset=utf-8;'
      }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `price_analysis_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const aggregatedColumns: ColumnsType<AggregatedTableRecord> = [
    {
      title: '商品基础信息',
      children: [
        {
          title: 'SKU 信息',
          key: 'sku',
          width: 260,
          fixed: 'left',
          render: (_, record) => (
            <div className='flex items-start gap-2'>
              {record.product.tags?.includes('爆品') && (
                <Tag size={14} className='text-red-500 mt-1' />
              )}
              <div>
                <div className='font-bold text-slate-800 leading-snug line-clamp-2'>
                  {record.product.name}
                </div>
                <div className='text-[10px] text-slate-400 mt-1 font-mono'>
                  {record.product.id}
                </div>
              </div>
            </div>
          )
        },
        {
          title: '类目/品牌',
          key: 'category',
          width: 150,
          render: (_, record) => (
            <div>
              <div className='text-slate-700 text-xs font-semibold'>
                {record.product.category}
              </div>
              <div className='text-[10px] text-slate-400 mt-0.5'>
                {record.product.brand}
              </div>
            </div>
          )
        },
        {
          title: '规格',
          key: 'spec',
          width: 110,
          render: (_, record) => (
            <span className='text-xs text-slate-500'>
              {record.product.spec}
            </span>
          )
        }
      ]
    },
    {
      title: '内部运营指标',
      children: [
        {
          title: '状态/动销',
          key: 'status',
          width: 150,
          render: (_, record) => (
            <div className='flex flex-col gap-1 items-start'>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  record.product.listingStatus === 'Active'
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                {record.product.listingStatus === 'Active' ? '在售' : '下架'}
              </span>
              {getSellThroughBadge(record.product.sellThroughStatus)}
            </div>
          )
        },
        {
          title: '销售额',
          key: 'sales',
          width: 130,
          render: (_, record) => (
            <span className='font-bold text-slate-800 font-mono'>
              ¥{(record.product.salesAmount / 10000).toFixed(1)}w
            </span>
          )
        },
        {
          title: '成本/毛利',
          key: 'cost',
          width: 140,
          render: (_, record) => (
            <div>
              <div className='text-xs text-slate-500 mb-1'>
                成本 ¥{record.product.ourCost}
              </div>
              <span
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  record.product.grossMarginRate > 15
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                {record.product.grossMarginRate}%
              </span>
            </div>
          )
        }
      ]
    },
    {
      title: '竞对实时情报',
      children: availablePlatforms.map((platform) => ({
        title: platform,
        key: platform,
        width: 180,
        render: (_, record) => {
          const row = record.competitorsMap[platform];
          if (!row) {
            return <span className='text-xs text-slate-300'>--</span>;
          }
          return (
            <div className='space-y-1 text-xs'>
              <div className='flex items-baseline gap-2'>
                <span className='font-bold text-slate-800 font-mono'>
                  ¥{row.competitorData.activityPrice}
                </span>
                <span
                  className={`font-bold ${
                    row.priceGap > 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                  {row.priceGap > 0
                    ? `+${row.priceGap.toFixed(1)}`
                    : row.priceGap.toFixed(1)}
                </span>
              </div>
              {row.competitorData.activityType !== ActivityType.NONE ? (
                <span className='px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold'>
                  {row.competitorData.activityType}
                </span>
              ) : (
                <span className='text-[10px] text-slate-300'>-</span>
              )}
              <div
                className={`text-[10px] font-mono ${
                  row.simulatedMargin > 0
                    ? 'text-slate-500'
                    : 'text-red-500 font-bold'
                }`}>
                毛利 {row.simulatedMarginRate > 0 ? '+' : ''}
                {(row.simulatedMarginRate * 100).toFixed(0)}%
              </div>
            </div>
          );
        }
      }))
    },
    {
      title: '智能决策',
      children: [
        {
          title: '策略留白',
          key: 'strategy',
          width: 160,
          render: () => <span className='text-xs text-slate-400'>-</span>
        }
      ]
    }
  ];

  const detailedColumns: ColumnsType<DetailedTableRecord> = [
    {
      title: '商品基础信息',
      children: [
        {
          title: 'SKU 信息',
          key: 'sku',
          width: 260,
          fixed: 'left',
          render: (_, record) => (
            <div className='flex items-start gap-2'>
              {record.product.tags?.includes('爆品') && (
                <Tag size={14} className='text-red-500 mt-1' />
              )}
              <div>
                <div className='font-bold text-slate-800 leading-snug line-clamp-2'>
                  {record.product.name}
                </div>
                <div className='text-[10px] text-slate-400 mt-1 font-mono'>
                  {record.product.id}
                </div>
              </div>
            </div>
          )
        },
        {
          title: '类目/品牌',
          key: 'category',
          width: 150,
          render: (_, record) => (
            <div>
              <div className='text-slate-700 text-xs font-semibold'>
                {record.product.category}
              </div>
              <div className='text-[10px] text-slate-400 mt-0.5'>
                {record.product.brand}
              </div>
            </div>
          )
        },
        {
          title: '规格',
          key: 'spec',
          width: 110,
          render: (_, record) => (
            <span className='text-xs text-slate-500'>
              {record.product.spec}
            </span>
          )
        }
      ]
    },
    {
      title: '内部运营指标',
      children: [
        {
          title: '状态/动销',
          key: 'status',
          width: 150,
          render: (_, record) => (
            <div className='flex flex-col gap-1 items-start'>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  record.product.listingStatus === 'Active'
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                {record.product.listingStatus === 'Active' ? '在售' : '下架'}
              </span>
              {getSellThroughBadge(record.product.sellThroughStatus)}
            </div>
          )
        },
        {
          title: '销售额',
          key: 'sales',
          width: 130,
          render: (_, record) => (
            <span className='font-bold text-slate-800 font-mono'>
              ¥{(record.product.salesAmount / 10000).toFixed(1)}w
            </span>
          )
        },
        {
          title: '成本/毛利',
          key: 'cost',
          width: 140,
          render: (_, record) => (
            <div>
              <div className='text-xs text-slate-500 mb-1'>
                成本 ¥{record.product.ourCost}
              </div>
              <span
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  record.product.grossMarginRate > 15
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                {record.product.grossMarginRate}%
              </span>
            </div>
          )
        }
      ]
    },
    {
      title: '竞对实时情报',
      children: [
        {
          title: '竞对平台/时间',
          key: 'platform',
          width: 200,
          render: (_, record) => (
            <div className='space-y-1 text-[10px]'>
              <div
                className={`px-1.5 py-0.5 rounded border w-fit font-bold ${getPlatformBadge(
                  record.competitorData.platform
                )}`}>
                {record.competitorData.platform}
              </div>
              <div className='text-slate-400 line-through'>
                日常 ¥{record.competitorData.dailyPrice}
              </div>
              <div className='flex items-center gap-1 text-slate-400'>
                <Clock size={10} />
                <span>{formatDateTime(record.competitorData.lastUpdated)}</span>
              </div>
            </div>
          )
        },
        {
          title: '价格对比',
          key: 'priceGap',
          width: 150,
          render: (_, record) => (
            <div className='space-y-1'>
              <div className='font-bold text-red-600 text-base font-mono'>
                ¥{record.competitorData.activityPrice}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  record.priceGap > 0 ? 'text-red-500' : 'text-emerald-500'
                }`}>
                {record.priceGap > 0
                  ? `贵 ${record.priceGap.toFixed(1)}`
                  : `优 ${Math.abs(record.priceGap).toFixed(1)}`}
              </div>
            </div>
          )
        },
        {
          title: '活动情报',
          key: 'activity',
          width: 220,
          render: (_, record) => (
            <div className='space-y-1'>
              {record.competitorData.activityType !== ActivityType.NONE ? (
                <div className='text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded border border-orange-100'>
                  <strong>[{record.competitorData.activityType}]</strong>
                  <br />
                  <span className='text-[10px]'>
                    {record.competitorData.activityDescription || '大促'}
                  </span>
                </div>
              ) : (
                <span className='text-slate-300 text-xs'>-</span>
              )}
              {record.competitorData.limitQuantity && (
                <div className='text-[10px] text-red-500 border border-red-100 bg-red-50 px-1 rounded w-fit'>
                  限购 {record.competitorData.limitQuantity}
                </div>
              )}
            </div>
          )
        }
      ]
    },
    {
      title: '智能决策',
      children: [
        {
          title: selectedPlatform === 'ALL' ? '策略留白' : '建议策略',
          key: 'decision',
          width: 220,
          render: (_, record) => (
            <div>
              <div
                className={`flex items-center gap-1 font-bold text-xs ${
                  record.alertLevel === 'Critical'
                    ? 'text-red-600'
                    : 'text-slate-700'
                }`}>
                {record.alertLevel === 'Critical' && <AlertCircle size={12} />}
                {record.recommendation}
              </div>
              <div className='text-[10px] text-slate-400 mt-1 flex items-center gap-1'>
                {getTrendIcon(record.competitorData.priceTrend)}{' '}
                {record.analysisNote}
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const tableColumns =
    selectedPlatform === 'ALL' ? aggregatedColumns : detailedColumns;
  const dataSource =
    selectedPlatform === 'ALL' ? aggregatedTableData : detailedTableData;
  const tableScroll = { x: 'max-content', y: 520 };
  const resolvedColumns = tableColumns as ColumnsType<any>;
  const resolvedDataSource = dataSource as any[];

  return (
    <div className='min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50'>
      <div className='px-6 md:px-8 py-8 space-y-6 animate-fade-in w-full'>
        <AnalysisReportModal
          isOpen={isReportModalOpen}
          onClose={() => setReportModalOpen(false)}
          report={reportData}
        />

        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-5 py-5 shadow-sm'>
          <div className='flex items-center gap-3'>
            <Link href='/' className='inline-flex'>
              <Button type='text' icon={<ArrowLeft size={18} />}>
                返回仪表盘
              </Button>
            </Link>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold text-slate-900'>
                  全网价盘分析矩阵
                </h1>
                <span className='text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100'>
                  {currentUser.region} City Report
                </span>
              </div>
              <div className='flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500'>
                <span className='flex items-center gap-1'>
                  <MapPin size={14} /> 区域：
                  <strong className='text-slate-700'>{selectedRegion}</strong>
                </span>
                {costThreshold > 0 && (
                  <span className='flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 text-xs font-bold'>
                    <ActivityIcon size={12} /> 缓冲阈值 {costThreshold}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='flex gap-3'>
            <Button
              className='border-slate-200 shadow-sm hover:!border-slate-300'
              icon={<Download size={16} />}
              onClick={handleExport}>
              导出表格
            </Button>
            <Button
              type='primary'
              loading={isGeneratingReport}
              icon={isGeneratingReport ? undefined : <FileText size={16} />}
              onClick={handleDeepDiagnosis}>
              {isGeneratingReport ? 'AI 正在分析...' : '生成深度经营研报'}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
          <div className='xl:col-span-1 space-y-6'>
            <Card
              className='shadow-lg border-0 bg-white/90 backdrop-blur'
              title={
                <span className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                  <Filter size={16} /> 核心筛选
                </span>
              }>
              <div className='space-y-4'>
                <div>
                  <div className='text-xs text-slate-500 mb-1'>区域与平台</div>
                  <div className='grid grid-cols-2 gap-2'>
                    <Select
                      value={selectedRegion}
                      onChange={(value) => setSelectedRegion(value)}
                      options={regions.map((region) => ({
                        label: region === 'ALL' ? '全区域' : region,
                        value: region
                      }))}
                      className='w-full'
                      size='large'
                    />
                    <Select
                      value={selectedPlatform}
                      onChange={(value) =>
                        setSelectedPlatform(value as Platform | 'ALL')
                      }
                      options={[
                        { label: '全平台', value: 'ALL' },
                        ...availablePlatforms.map((platform) => ({
                          label: platform,
                          value: platform
                        }))
                      ]}
                      className='w-full'
                      size='large'
                    />
                  </div>
                </div>
                <div>
                  <div className='text-xs text-slate-500 mb-1'>品类与品牌</div>
                  <div className='grid grid-cols-2 gap-2'>
                    <Select
                      value={selectedCategory}
                      onChange={(value) => setSelectedCategory(value)}
                      options={[
                        { label: '全品类', value: 'ALL' },
                        ...categories.map((category) => ({
                          label: category,
                          value: category
                        }))
                      ]}
                      size='large'
                    />
                    <Select
                      value={selectedBrand}
                      onChange={(value) => setSelectedBrand(value)}
                      options={[
                        { label: '全品牌', value: 'ALL' },
                        ...brands.map((brand) => ({
                          label: brand,
                          value: brand
                        }))
                      ]}
                      size='large'
                    />
                  </div>
                </div>
                <div>
                  <div className='text-xs text-slate-500 mb-1'>状态与搜索</div>
                  <Space direction='vertical' size='small' className='w-full'>
                    <Select
                      value={selectedActivity}
                      onChange={(value) =>
                        setSelectedActivity(value as ActivityType | 'ALL')
                      }
                      options={[
                        { label: '全活动类型', value: 'ALL' },
                        ...Object.values(ActivityType).map((activity) => ({
                          label: activity,
                          value: activity
                        }))
                      ]}
                      size='large'
                    />
                    <Select
                      value={selectedPriceStatus}
                      onChange={(value) => setSelectedPriceStatus(value)}
                      options={PRICE_STATUS_OPTIONS}
                      size='large'
                    />
                    <Input
                      size='large'
                      prefix={
                        <SearchIcon size={14} className='text-slate-400' />
                      }
                      placeholder='搜索 SKU...'
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </Space>
                </div>
                <div>
                  <div className='text-xs text-slate-500 mb-2 flex justify-between'>
                    <span>成本倒挂阈值</span>
                    <span className='font-semibold text-slate-700'>
                      {costThreshold}%
                    </span>
                  </div>
                  <Slider
                    value={costThreshold}
                    min={0}
                    max={30}
                    onChange={(value) => setCostThreshold(value as number)}
                  />
                </div>
              </div>
            </Card>

            <Card
              className='shadow-lg border-0 bg-white/90 backdrop-blur'
              title={
                <span className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                  <ActivityIcon size={14} /> 价格分布
                </span>
              }
              extra={
                selectedBarFilter ? (
                  <Button
                    size='small'
                    type='text'
                    icon={<XCircle size={12} />}
                    onClick={() => setSelectedBarFilter(null)}>
                    清除筛选
                  </Button>
                ) : (
                  <Button
                    size='small'
                    type='text'
                    onClick={() =>
                      openAgent('请帮我解读价盘分析矩阵左侧的分布图。')
                    }>
                    AI 解读
                  </Button>
                )
              }>
              <GapDistributionChart
                data={gapDistData}
                activeFilter={selectedBarFilter}
                onSelect={handleBarSelect}
              />
              <p className='text-[11px] text-center text-slate-400'>
                点击柱状图可筛选列表
              </p>
            </Card>
          </div>

          <div className='xl:col-span-3'>
            <Card
              className='shadow-lg border-0 bg-white/95 backdrop-blur rounded-2xl'
              bodyStyle={{ padding: 0 }}>
              <Table
                size='small'
                columns={resolvedColumns}
                dataSource={resolvedDataSource}
                pagination={false}
                scroll={tableScroll}
                sticky
                rowKey='key'
                locale={{ emptyText: '当前筛选暂无数据' }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceAnalysisPage;
