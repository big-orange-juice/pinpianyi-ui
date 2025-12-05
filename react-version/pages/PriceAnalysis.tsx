
import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS, MOCK_COMPETITORS } from '../constants';
import { PriceComparisonRow, StockStatus, ActivityType, Platform, PriceStatusFilter, PriceTrend, SellThroughStatus } from '../types';
import { generateDiagnosisReport } from '../services/geminiService';
import { Loader2, Filter, Search, MapPin, ArrowUpRight, ArrowDownRight, Minus, Activity, FileText, BarChart3, ScatterChart as ScatterIcon, Percent, MessageSquare, AlertCircle, Package, TrendingDown, Tag, Clock, XCircle, Download } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import AnalysisReportModal from '../components/AnalysisReportModal';

const PriceAnalysis: React.FC = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Interactive Filter State for Bar Chart
  const [selectedBarFilter, setSelectedBarFilter] = useState<string | null>(null);

  const { 
      selectedPlatform, setSelectedPlatform,
      selectedCategory, setSelectedCategory,
      selectedActivity, setSelectedActivity,
      selectedRegion, setSelectedRegion,
      selectedPriceStatus, setSelectedPriceStatus,
      searchTerm, setSearchTerm,
      costThreshold,
      openAgent,
      isReportModalOpen, setReportModalOpen,
      reportData, setReportData,
      availablePlatforms,
      currentUser
  } = useAppContext();

  // Data Source for Filters
  const categories = useMemo(() => Array.from(new Set(MOCK_PRODUCTS.map(p => p.category))), []);
  const brands = useMemo(() => Array.from(new Set(MOCK_PRODUCTS.map(p => p.brand))), []);
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  
  const regions = useMemo(() => {
      const set = new Set<string>();
      Object.values(MOCK_COMPETITORS).forEach(list => list.forEach(c => set.add(c.region)));
      return Array.from(set);
  }, []);

  // Helper function to determine the bucket for a row
  const getBucket = (gapPercent: number, isInversion: boolean) => {
      if (isInversion) return '严重倒挂';
      if (gapPercent > 5) return '劣势 (>5%)';
      if (gapPercent > 0.5) return '劣势 (0-5%)';
      if (gapPercent >= -0.5) return '持平';
      return '优势';
  };

  // --- 1. Base Data Calculation (Filters from Dropdowns Only) ---
  const baseTableData: PriceComparisonRow[] = useMemo(() => {
    let rows: PriceComparisonRow[] = [];

    MOCK_PRODUCTS.forEach(product => {
      // Filter Logic
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return;
      if (selectedBrand !== 'ALL' && product.brand !== selectedBrand) return;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && !product.id.toLowerCase().includes(searchTerm.toLowerCase())) return;

      const competitorEntries = MOCK_COMPETITORS[product.id] || [];
      
      competitorEntries.forEach(compData => {
          if (selectedRegion !== 'ALL' && compData.region !== selectedRegion) return;
          if (selectedPlatform !== 'ALL' && compData.platform !== selectedPlatform) return;
          if (selectedActivity !== 'ALL' && compData.activityType !== selectedActivity) return;

          const effectiveCompPrice = compData.activityPrice < compData.price ? compData.activityPrice : compData.price;
          const gap = product.ourPrice - effectiveCompPrice;
          const criticalPriceThreshold = product.ourCost * (1 - costThreshold / 100);
          const isBelowCriticalCost = effectiveCompPrice < criticalPriceThreshold;

          // Our Internal Margin Rate
          const marginRate = product.grossMarginRate / 100; 

          // Simulated Competitor Margin (If we sold at their price)
          // Sim Margin = Competitor Price - Our Cost
          const simMargin = effectiveCompPrice - product.ourCost;
          const simMarginRate = simMargin / effectiveCompPrice;
          
          let status: 'Win' | 'Lose' | 'Draw' = 'Draw';
          if (gap < -0.5) status = 'Win'; 
          if (gap > 0.5) status = 'Lose';

          // Price Status Filter (Dropdown)
          if (selectedPriceStatus === 'COST_INVERSION' && !isBelowCriticalCost) return;
          if (selectedPriceStatus === 'LOSING' && status !== 'Lose') return;
          if (selectedPriceStatus === 'WINNING' && status !== 'Win') return;

          let alertLevel: 'Normal' | 'Warning' | 'Critical' = 'Normal';
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
              if (compData.platform === Platform.XIAN_SHI_JI && compData.stockStatus === StockStatus.LIMITED) {
                  recommendation = '竞对限购(忽略)';
                  alertLevel = 'Warning'; 
                  note = '虚假低价(限购)';
              }
          }

          if (compData.activityType !== '无活动') {
               note = compData.activityDescription || '大促';
          }

          const estCompMargin = (effectiveCompPrice - (product.ourCost * 0.95)) / effectiveCompPrice;

          rows.push({
            product,
            competitorData: compData,
            priceGap: gap,
            costGap: product.ourCost - effectiveCompPrice,
            marginRate, // Our current margin
            competitorEstimatedMargin: estCompMargin,
            simulatedMargin: simMargin,
            simulatedMarginRate: simMarginRate,
            status,
            alertLevel,
            recommendation,
            analysisNote: note
          });
      });
    });
    return rows;
  }, [selectedPlatform, selectedCategory, selectedBrand, selectedActivity, selectedRegion, selectedPriceStatus, searchTerm, costThreshold]);

  // --- 2. Chart Data (Derived from Base Data, NOT filtered by Chart Click) ---
  const gapDistData = useMemo(() => {
      const buckets = { '严重倒挂': 0, '劣势 (>5%)': 0, '劣势 (0-5%)': 0, '持平': 0, '优势': 0 };
      
      baseTableData.forEach(row => {
          const gapPercent = (row.priceGap / row.product.ourPrice) * 100;
          // Determine logic for 'Critical Inversion' vs just price gap
          // We use the alertLevel and logic consistent with table generation
          const isBelow = row.competitorData.activityPrice < row.product.ourCost * (1 - costThreshold / 100);
          
          const bucketName = getBucket(gapPercent, isBelow);
          if (buckets[bucketName as keyof typeof buckets] !== undefined) {
             buckets[bucketName as keyof typeof buckets]++;
          }
      });
      
      return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [baseTableData, costThreshold]);

  // --- 3. Filtered Table Data (Applies Chart Click Filter) ---
  const filteredTableData = useMemo(() => {
      if (!selectedBarFilter) return baseTableData;

      return baseTableData.filter(row => {
          const gapPercent = (row.priceGap / row.product.ourPrice) * 100;
          const isBelow = row.competitorData.activityPrice < row.product.ourCost * (1 - costThreshold / 100);
          const bucket = getBucket(gapPercent, isBelow);
          return bucket === selectedBarFilter;
      });
  }, [baseTableData, selectedBarFilter, costThreshold]);

  // --- 4. Grouping Logic (Uses Filtered Data) ---
  const groupedTableData = useMemo(() => {
      if (selectedPlatform !== 'ALL') return null;
      
      const groups: Record<string, { product: any, rows: PriceComparisonRow[] }> = {};
      
      // Use filteredTableData here so the table updates when chart is clicked
      filteredTableData.forEach(row => {
          if (!groups[row.product.id]) {
              groups[row.product.id] = { product: row.product, rows: [] };
          }
          groups[row.product.id].rows.push(row);
      });
      
      return Object.values(groups);
  }, [filteredTableData, selectedPlatform]);

  const handleDeepDiagnosis = async () => {
     setIsGeneratingReport(true);
     const context = `区域:${selectedRegion}, 平台:${selectedPlatform}`;
     const report = await generateDiagnosisReport(context, filteredTableData);
     setIsGeneratingReport(false);
     if (report) { setReportData(report); setReportModalOpen(true); } 
     else { alert("报告生成失败，请重试。"); }
  };
  
  const handleExport = () => {
    const headers = ['SKU ID', '商品名称', '品牌', '类目', '规格', '我方售价', '成本', '竞对平台', '竞对价格', '价差', '状态', '建议', '分析备注'];
    const csvRows = [headers.join(',')];

    filteredTableData.forEach(row => {
        csvRows.push([
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
        ].join(','));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `price_analysis_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformColor = (p: string) => {
      if (p.includes('京东')) return 'text-red-700 bg-red-50 border-red-100';
      if (p.includes('易久批')) return 'text-purple-700 bg-purple-50 border-purple-100';
      if (p.includes('鲜世纪')) return 'text-green-700 bg-green-50 border-green-100';
      return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getTrendIcon = (trend: PriceTrend) => {
      switch (trend) {
          case PriceTrend.RISING: return <ArrowUpRight size={14} className="text-red-500" />;
          case PriceTrend.FALLING: return <ArrowDownRight size={14} className="text-green-500" />;
          case PriceTrend.FLUCTUATING: return <Activity size={14} className="text-orange-500" />;
          default: return <Minus size={14} className="text-slate-300" />;
      }
  };

  const formatDateTime = (dateStr: string) => {
      try {
          const d = new Date(dateStr);
          return d.toLocaleDateString() + ' ' + d.getHours() + ':' + d.getMinutes();
      } catch (e) {
          return dateStr;
      }
  };

  const getSellThroughBadge = (status: SellThroughStatus) => {
      switch (status) {
          case 'FAST': return (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 畅销
             </span>
          );
          case 'MEDIUM': return (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 平销
             </span>
          );
          case 'SLOW': return (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> 慢销
             </span>
          );
          case 'STAGNANT': return (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> 滞销
             </span>
          );
          default: return null;
      }
  };

  const handleBarClick = (data: any) => {
      if (selectedBarFilter === data.name) {
          setSelectedBarFilter(null); // Toggle off
      } else {
          setSelectedBarFilter(data.name);
      }
  };

  const clearBarFilter = () => setSelectedBarFilter(null);

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans text-slate-800 pb-24 max-w-[100vw] overflow-x-hidden">
      <AnalysisReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} report={reportData} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                全网价盘分析矩阵
                <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">City Report</span>
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={14}/> 区域: <span className="font-bold text-slate-700">{selectedRegion}</span>
                </div>
                {costThreshold > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 text-xs font-bold">
                        <Activity size={12} /> 缓冲阈值 {costThreshold}%
                    </div>
                )}
            </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleExport}
                className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 font-medium text-sm"
            >
                <Download size={16} className="text-slate-500" />
                导出表格
            </button>
            <button 
                onClick={handleDeepDiagnosis}
                disabled={isGeneratingReport}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg shadow hover:bg-slate-800 transition-all flex items-center gap-2 font-medium disabled:opacity-70 text-sm"
            >
                {isGeneratingReport ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16} className="text-blue-400" />} 
                {isGeneratingReport ? 'AI 正在分析...' : '生成深度经营研报'}
            </button>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left: Filter & Charts (Stacked) */}
        <div className="xl:col-span-1 space-y-6">
            
            {/* Optimized Filters Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
               <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <Filter size={16} className="text-blue-600" /> 核心筛选
               </div>
               
               <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">1. 区域与平台</label>
                      <div className="grid grid-cols-2 gap-2">
                          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-700">
                              <option value="ALL">全区域</option>
                              {regions.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'ALL')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none">
                              <option value="ALL">全平台</option>
                              {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">2. 品类与品牌</label>
                      <div className="grid grid-cols-2 gap-2">
                          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none">
                              <option value="ALL">全品类</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none">
                              <option value="ALL">全品牌</option>
                              {brands.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">3. 状态与搜索</label>
                      <div className="space-y-2">
                          <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value as ActivityType | 'ALL')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none">
                              <option value="ALL">全活动类型</option>
                              {Object.values(ActivityType).map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索 SKU..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none" />
                          </div>
                      </div>
                   </div>
               </div>
            </div>

            {/* Charts - Compact Vertical Stack */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                     <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                         <BarChart3 size={14} className="text-indigo-600"/> 价格分布
                     </h3>
                     {selectedBarFilter && (
                        <button onClick={clearBarFilter} className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full hover:bg-red-100">
                             已筛选: {selectedBarFilter} <XCircle size={10} />
                        </button>
                     )}
                     {!selectedBarFilter && (
                         <button onClick={() => openAgent('解读左侧图表')} className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">AI 解读</button>
                     )}
                </div>
                <div className="h-40 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={gapDistData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                          <XAxis dataKey="name" tick={{fontSize:9}} axisLine={false} tickLine={false} interval={0}/>
                          <ReTooltip contentStyle={{borderRadius:'8px', fontSize:'12px'}} cursor={{fill: '#f1f5f9'}}/>
                          <Bar 
                            dataKey="count" 
                            radius={[4,4,0,0]} 
                            cursor="pointer"
                            onClick={(data) => handleBarClick(data)}
                          >
                             {gapDistData.map((e,i) => (
                                 <Cell 
                                    key={i} 
                                    fill={e.name.includes('倒挂') ? '#ef4444' : e.name.includes('劣势') ? '#f59e0b' : '#10b981'}
                                    opacity={selectedBarFilter && selectedBarFilter !== e.name ? 0.3 : 1}
                                 />
                             ))}
                          </Bar>
                       </BarChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-400 text-center">点击柱状图可筛选列表</p>
            </div>
        </div>

        {/* Right: Main Data Table */}
        <div className="xl:col-span-3">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold">
                         <th colSpan={3} className="p-3 text-center border-r border-slate-200">商品基础信息</th>
                         <th colSpan={3} className="p-3 text-center border-r border-slate-200 bg-slate-100/50">内部运营指标</th>
                         {/* Dynamic Header ColSpan */}
                         <th colSpan={selectedPlatform === 'ALL' ? availablePlatforms.length : 3} className="p-3 text-center border-r border-slate-200">
                             竞对实时情报 ({selectedPlatform === 'ALL' ? '多平台' : '单平台'})
                         </th>
                         <th className="p-3 text-center bg-slate-100/50">智能决策</th>
                      </tr>
                      <tr className="text-xs font-semibold text-slate-500 bg-white border-b border-slate-100">
                        {/* Product */}
                        <th className="p-4 w-[240px]">SKU 信息</th>
                        <th className="p-4 w-[120px]">类目/品牌</th>
                        <th className="p-4 w-[100px] border-r border-slate-100">规格</th>
                        
                        {/* Internal */}
                        <th className="p-4 w-[120px] bg-slate-50/30">状态/动销</th>
                        <th className="p-4 w-[120px] bg-slate-50/30">销售额</th>
                        <th className="p-4 w-[100px] border-r border-slate-100 bg-slate-50/30">成本/毛利</th>
                        
                        {/* Competitor: Dynamic Columns if ALL */}
                        {selectedPlatform === 'ALL' ? (
                            availablePlatforms.map(p => (
                                <th key={p} className="p-4 w-[160px] border-r border-slate-100 last:border-0">
                                    {p}
                                </th>
                            ))
                        ) : (
                            <>
                                <th className="p-4 w-[180px]">竞对平台/时间</th>
                                <th className="p-4 w-[120px]">价格对比</th>
                                <th className="p-4 w-[180px] border-r border-slate-100">活动情报</th>
                            </>
                        )}

                        {/* Strategy: Empty Header if ALL */}
                        <th className="p-4 w-[120px] bg-slate-50/30">
                            {selectedPlatform === 'ALL' ? '建议策略 (Empty)' : '建议策略'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {/* --- RENDER LOGIC: Check for Grouping (ALL) vs Single (Filtered) --- */}
                      {(selectedPlatform === 'ALL' && groupedTableData) ? (
                        /* GROUPED VIEW (One row per SKU, Dynamic Platform Columns) */
                        groupedTableData.map((group, index) => {
                            const { product, rows } = group;
                            return (
                             <tr key={`${product.id}-group-${index}`} className="hover:bg-blue-50/30 transition-colors group">
                                {/* 1. Product Info */}
                                <td className="p-4 align-top">
                                    <div className="flex items-start gap-2">
                                        {product.tags?.includes('爆品') && <Tag size={14} className="text-red-500 mt-1 shrink-0"/>}
                                        <div>
                                            <div className="font-bold text-slate-800 line-clamp-2 leading-snug">{product.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-mono">{product.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="text-slate-600 font-medium text-xs">{product.category}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{product.brand}</div>
                                </td>
                                <td className="p-4 border-r border-slate-100 text-slate-500 align-top text-xs">{product.spec}</td>
                                
                                {/* 2. Internal Ops */}
                                <td className="p-4 align-top bg-slate-50/30">
                                    <div className="flex flex-col gap-1.5 items-start">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${product.listingStatus === 'Active' ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            {product.listingStatus === 'Active' ? '在售' : '下架'}
                                        </span>
                                        {getSellThroughBadge(product.sellThroughStatus)}
                                    </div>
                                </td>
                                <td className="p-4 align-top bg-slate-50/30">
                                    <div className="font-bold text-slate-700 font-mono">¥{(product.salesAmount / 10000).toFixed(1)}w</div>
                                </td>
                                <td className="p-4 border-r border-slate-100 align-top bg-slate-50/30">
                                    <div className="text-xs text-slate-500 mb-1">成本 ¥{product.ourCost}</div>
                                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${product.grossMarginRate > 15 ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {product.grossMarginRate}%
                                    </span>
                                </td>

                                {/* 3. Dynamic Competitor Columns */}
                                {availablePlatforms.map(platformName => {
                                    const row = rows.find(r => r.competitorData.platform === platformName);
                                    if (!row) {
                                        return (
                                            <td key={platformName} className="p-4 align-top border-r border-slate-100 last:border-0 text-center text-slate-300">
                                                -
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={platformName} className="p-4 align-top border-r border-slate-100 last:border-0">
                                            {/* Price Comparison */}
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-mono font-bold text-slate-800">¥{row.competitorData.activityPrice}</span>
                                                <span className={`text-[10px] font-bold ${row.priceGap > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {row.priceGap > 0 ? `+${row.priceGap}` : row.priceGap}
                                                </span>
                                            </div>
                                            
                                            {/* Activity Tag Only */}
                                            <div className="mb-1.5">
                                                {row.competitorData.activityType !== '无活动' ? (
                                                     <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold truncate block w-fit max-w-full">
                                                        {row.competitorData.activityType}
                                                     </span>
                                                ) : <span className="text-xs text-slate-300">-</span>}
                                            </div>

                                            {/* Simulated Margin */}
                                            <div className={`text-[10px] font-mono ${row.simulatedMargin > 0 ? 'text-slate-500' : 'text-red-500 font-bold'}`}>
                                                毛利: {row.simulatedMarginRate > 0 ? '+' : ''}{(row.simulatedMarginRate * 100).toFixed(0)}%
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* 4. Strategy (Empty as requested) */}
                                <td className="p-4 align-top bg-slate-50/30">
                                    {/* Empty content */}
                                </td>
                             </tr>
                            );
                        })
                      ) : (
                        /* FLAT VIEW (Filtered by Platform) - Original Design */
                        filteredTableData.map((row, index) => {
                            const isCritical = row.alertLevel === 'Critical';
                            const isProfitable = row.simulatedMargin > 0;
                            return (
                                <tr key={`${row.product.id}-${index}`} className="hover:bg-blue-50/30 transition-colors group">
                                  {/* 1. Product Info */}
                                  <td className="p-4 align-top">
                                      <div className="flex items-start gap-2">
                                          {row.product.tags?.includes('爆品') && <Tag size={14} className="text-red-500 mt-1 shrink-0"/>}
                                          <div>
                                            <div className="font-bold text-slate-800 line-clamp-2 leading-snug">{row.product.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-mono">{row.product.id}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 align-top">
                                      <div className="text-slate-600 font-medium text-xs">{row.product.category}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">{row.product.brand}</div>
                                  </td>
                                  <td className="p-4 border-r border-slate-100 text-slate-500 align-top text-xs">{row.product.spec}</td>
                                  
                                  {/* 2. Internal Ops Metrics */}
                                  <td className="p-4 align-top bg-slate-50/30">
                                      <div className="flex flex-col gap-1.5 items-start">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${row.product.listingStatus === 'Active' ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                              {row.product.listingStatus === 'Active' ? '在售' : '下架'}
                                          </span>
                                          {getSellThroughBadge(row.product.sellThroughStatus)}
                                      </div>
                                  </td>
                                  <td className="p-4 align-top bg-slate-50/30">
                                      <div className="font-bold text-slate-700 font-mono">¥{(row.product.salesAmount / 10000).toFixed(1)}w</div>
                                  </td>
                                  <td className="p-4 border-r border-slate-100 align-top bg-slate-50/30">
                                      <div className="text-xs text-slate-500 mb-1">成本 ¥{row.product.ourCost}</div>
                                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${row.product.grossMarginRate > 15 ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {row.product.grossMarginRate}%
                                      </span>
                                  </td>
                                  
                                  {/* 3. Competitor Intel */}
                                  <td className="p-4 align-top">
                                      <div className={`text-[10px] px-1.5 py-0.5 rounded border w-fit mb-1 font-bold ${getPlatformColor(row.competitorData.platform)}`}>
                                          {row.competitorData.platform}
                                      </div>
                                      <div className="text-[10px] text-slate-400 line-through">日常 ¥{row.competitorData.dailyPrice}</div>
                                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                          <Clock size={10} />
                                          <span className="scale-90 origin-left">{formatDateTime(row.competitorData.lastUpdated)}</span>
                                      </div>
                                  </td>
                                  <td className="p-4 align-top">
                                      <div className="font-bold text-red-600 text-base font-mono">¥{row.competitorData.activityPrice}</div>
                                      <div className={`text-[10px] font-bold mt-0.5 ${row.priceGap > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                          {row.priceGap > 0 ? `贵 ${row.priceGap.toFixed(1)}` : `优 ${Math.abs(row.priceGap).toFixed(1)}`}
                                      </div>
                                  </td>
                                  <td className="p-4 border-r border-slate-100 align-top">
                                       {row.competitorData.activityType !== '无活动' ? (
                                           <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded border border-orange-100 inline-block w-full leading-tight" title={row.competitorData.activityDescription}>
                                               <span className="font-bold">[{row.competitorData.activityType}]</span>
                                               <br/>
                                               <span className="scale-90 origin-left block mt-0.5">{row.competitorData.activityDescription}</span>
                                           </div>
                                       ) : <span className="text-slate-300 text-xs">-</span>}
                                       {row.competitorData.limitQuantity && (
                                           <div className="mt-1 text-[10px] text-red-500 border border-red-100 bg-red-50 px-1 rounded w-fit">
                                               限购 {row.competitorData.limitQuantity}
                                           </div>
                                       )}
                                  </td>

                                  {/* 4. Strategy */}
                                  <td className="p-4 align-top bg-slate-50/30">
                                      {/* Strategy Column: Now shows estimated margin for single view still? Or keep as is? User only asked about "Multi-platform" view. Keeping single view as is for utility. */}
                                      <div className={`flex items-center gap-1 font-bold text-xs ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                                          {isCritical && <AlertCircle size={12}/>}
                                          {row.recommendation}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                          {getTrendIcon(row.competitorData.priceTrend)} {row.analysisNote}
                                      </div>
                                  </td>
                                </tr>
                            )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default PriceAnalysis;
