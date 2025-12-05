
import React, { useMemo, useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import { AlertTriangle, Zap, Target, Activity, TrendingDown, Search, Download, UserCircle, MapPin, Layout, Tag, DollarSign, Package, AlertCircle, BarChart3, ChevronRight, ShoppingBag, Layers, Award, Star } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import { MOCK_PRODUCTS, MOCK_COMPETITORS, getHistoryData } from '../constants';
import { Link } from 'react-router-dom';
import { Platform, ProductTag } from '../types';
import { useAppContext } from '../contexts/AppContext';

// KPI Filter Types
// LOSING: 价格劣势 (Our > Min Comp) - "Price Disadvantage"
// INVERSION: 倒挂预警 (Our Price < Our Cost) - "Cost Inversion"
// EST_LOSS: 预估损失 (Value)
// ADVANTAGE: 价格优势 (Our < Min Comp) - "Price Advantage"
type KpiFilterType = 'ALL' | 'LOSING' | 'INVERSION' | 'EST_LOSS' | 'ADVANTAGE';

const Dashboard: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  
  // Interactive States - Default to LOSING (Price Disadvantage) as requested
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType>('LOSING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'ALL_TOP' | 'SPECIAL'>('ALL_TOP');
  
  const [displayProduct, setDisplayProduct] = useState<{data: any[], name: string}>(getHistoryData('TOP001'));
  
  const { 
      costThreshold, currentUser,
      selectedTag, setSelectedTag,
      selectedPlatform, setSelectedPlatform, 
      availablePlatforms,
      selectedCategory, setSelectedCategory,
      selectedBrand, setSelectedBrand,
      selectedRegion, setSelectedRegion,
      monitoredProductIds,
      specialAttentionIds, toggleSpecialAttention
  } = useAppContext();

  // Distinct Lists for Filters
  const categories = useMemo(() => Array.from(new Set(MOCK_PRODUCTS.map(p => p.category))), []);
  const brands = useMemo(() => Array.from(new Set(MOCK_PRODUCTS.map(p => p.brand))), []);
  const regions = useMemo(() => {
    const r = new Set<string>();
    Object.values(MOCK_COMPETITORS).forEach(arr => arr.forEach(c => r.add(c.region)));
    return Array.from(r);
  }, []);

  const handleHistoryQuery = () => {
      const result = getHistoryData(queryInput);
      setDisplayProduct(result);
  };

  const handleSelectProduct = (skuId: string, alertId: string) => {
      setSelectedAlertId(alertId);
      const result = getHistoryData(skuId);
      setDisplayProduct(result);
  };

  const handleKpiClick = (type: KpiFilterType) => {
      setActiveKpiFilter(prev => prev === type ? 'ALL' : type);
      setSelectedAlertId(null);
  };

  // Filter Logic based on Context
  const regionFilteredCompetitors = useMemo(() => {
      const filteredComps: Record<string, any[]> = {};
      Object.keys(MOCK_COMPETITORS).forEach(skuId => {
          filteredComps[skuId] = MOCK_COMPETITORS[skuId].filter(c => 
              (selectedRegion === 'ALL' || c.region === selectedRegion) && 
              (selectedPlatform === 'ALL' || c.platform === selectedPlatform)
          );
      });
      return filteredComps;
  }, [selectedRegion, selectedPlatform]);

  // Main Logic Calculation
  const kpis = useMemo(() => {
    let inversionCount = 0; // Our Price < Our Cost
    let priceDisadvantageCount = 0; // Our Price > Min Comp
    let priceAdvantageCount = 0; // Our Price < Min Comp
    let totalEstDailyLoss = 0;

    MOCK_PRODUCTS.forEach(p => {
        // Global Monitored Filter
        if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id)) return;

        // View Mode Filter
        if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id)) return;

        // Apply Global Filters
        if (selectedTag !== 'ALL' && (!p.tags || !p.tags.includes(selectedTag as ProductTag))) return;
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
        if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

        const comps = regionFilteredCompetitors[p.id] || [];
        if (comps.length === 0) return;

        // 1. Internal Inversion Check (Abnormal)
        // Definition: Our Selling Price < Our Cost (Negative Gross Margin)
        if (p.ourPrice < p.ourCost) {
            inversionCount++;
        }

        // 2. Competitor Price Analysis
        // Find lowest competitor price
        const minCompPrice = Math.min(...comps.map(c => c.activityPrice));
        
        // Price Disadvantage
        if (p.ourPrice > minCompPrice) {
            priceDisadvantageCount++;
            // Simple Loss Calc: Gap * Daily Sales
            const gap = p.ourPrice - minCompPrice;
            totalEstDailyLoss += gap * (p.last7DaysSales / 7);
        }

        // Price Advantage
        if (p.ourPrice < minCompPrice) {
            priceAdvantageCount++;
        }
    });

    return { inversionCount, priceDisadvantageCount, priceAdvantageCount, totalEstDailyLoss };
  }, [regionFilteredCompetitors, selectedTag, selectedCategory, selectedBrand, monitoredProductIds, activeViewMode, specialAttentionIds]);

  // List Data Generation
  const alerts = useMemo(() => {
      const list: any[] = [];
      MOCK_PRODUCTS.forEach(p => {
          // Global Monitored Filter
          if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id)) return;

          // View Mode Filter
          if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id)) return;

          if (selectedTag !== 'ALL' && (!p.tags || !p.tags.includes(selectedTag as ProductTag))) return;
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
          if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

          const comps = regionFilteredCompetitors[p.id] || [];
          if (comps.length === 0) return;

          // Pricing logic
          const minCompPrice = Math.min(...comps.map(c => c.activityPrice));
          const jdComp = comps.find(c => c.platform.includes('京东'));
          const yjpComp = comps.find(c => c.platform.includes('易久批'));
          const xsjComp = comps.find(c => c.platform.includes('鲜世纪'));

          const gap = p.ourPrice - minCompPrice;
          const profit = p.ourPrice - p.ourCost;

          // Flags
          const isInternalInversion = p.ourPrice < p.ourCost;
          const isLosing = p.ourPrice > minCompPrice;
          const isWinning = p.ourPrice < minCompPrice;
          
          const isSpecial = specialAttentionIds.includes(p.id);

          // Common Data Structure
          const baseData = {
              id: p.id,
              skuId: p.id,
              product: p.name,
              spec: p.spec, // Added Spec info
              ourPrice: p.ourPrice,
              cost: p.ourCost,
              jdPrice: jdComp?.activityPrice,
              yjpPrice: yjpComp?.activityPrice,
              xsjPrice: xsjComp?.activityPrice,
              minCompPrice,
              gap, // + means expensive (Losing), - means cheap (Winning)
              profit,
              estMarginAfterMatch: isLosing ? (minCompPrice - p.ourCost) : profit,
              tags: p.tags || [],
              isSpecial
          };

          if (isInternalInversion) {
               list.push({ ...baseData, type: 'INVERSION', category: '成本倒挂', sortVal: profit }); // Negative profit
          }
          if (isLosing) {
               list.push({ ...baseData, type: 'LOSING', category: '价格劣势', sortVal: gap }); // Positive gap
          }
          if (isWinning) {
               list.push({ ...baseData, type: 'ADVANTAGE', category: '价格优势', sortVal: gap }); // Negative gap
          }
      });
      
      // Filter based on Active Tab
      let filtered = list;
      if (activeKpiFilter === 'LOSING') filtered = list.filter(i => i.type === 'LOSING');
      else if (activeKpiFilter === 'INVERSION') filtered = list.filter(i => i.type === 'INVERSION');
      else if (activeKpiFilter === 'ADVANTAGE') filtered = list.filter(i => i.type === 'ADVANTAGE');
      else if (activeKpiFilter === 'EST_LOSS') filtered = list.filter(i => i.type === 'LOSING'); // Est Loss is a subset of losing

      // Sorting
      if (activeKpiFilter === 'INVERSION') {
          return filtered.sort((a,b) => a.profit - b.profit); // Most negative profit first
      }
      return filtered.sort((a,b) => b.sortVal - a.sortVal); // Biggest gap first (for losing)
  }, [regionFilteredCompetitors, selectedTag, selectedCategory, selectedBrand, activeKpiFilter, monitoredProductIds, activeViewMode, specialAttentionIds]);

  // Export Function
  const handleExport = () => {
      // Define headers based on active filter per requirement
      const headers = activeKpiFilter === 'INVERSION' 
          ? ['商品ID', '商品名称', '规格', '当前售价', '当前成本价', '毛利额', '毛利率%']
          : ['商品ID', '商品名称', '规格', '当前售价', '京东万商', '易久批', '鲜世纪', '与最低竞对差值', '当前成本', '预估跟价后毛利'];
      
      const csvContent = [
          headers.join(','),
          ...alerts.map(item => {
              if (activeKpiFilter === 'INVERSION') {
                  return [
                      item.skuId, `"${item.product}"`, `"${item.spec}"`, item.ourPrice, item.cost, item.profit.toFixed(2), ((item.profit/item.ourPrice)*100).toFixed(1)
                  ].join(',');
              } else {
                  return [
                      item.skuId, `"${item.product}"`, `"${item.spec}"`, item.ourPrice, 
                      item.jdPrice || '-', item.yjpPrice || '-', item.xsjPrice || '-',
                      item.gap.toFixed(2), item.cost, item.estMarginAfterMatch.toFixed(2)
                  ].join(',');
              }
          })
      ].join('\n');

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `price_monitor_${activeKpiFilter}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Header with Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Top重点关注品价格监控
             </h2>
             
             {/* View Mode Toggle */}
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveViewMode('ALL_TOP')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeViewMode === 'ALL_TOP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   全部Top关注品
                </button>
                <button 
                   onClick={() => setActiveViewMode('SPECIAL')}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeViewMode === 'SPECIAL' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <Star size={12} className="fill-orange-400 text-orange-400" />
                   特别关注 ({specialAttentionIds.length})
                </button>
             </div>
          </div>
          
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
             <Target size={14} className="text-blue-500"/>
             当前监控范围：<span className="font-bold text-slate-700">{currentUser.region}</span> 核心仓 · 实时竞价
             {monitoredProductIds.length !== MOCK_PRODUCTS.length && (
                 <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold ml-2 border border-orange-200">
                     已启用自定义关注列表 ({monitoredProductIds.length} SKU)
                 </span>
             )}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
             {/* Region Filter */}
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                 <MapPin size={14} className="text-slate-500"/>
                 <select 
                    value={selectedRegion} 
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="text-xs font-bold bg-transparent outline-none text-slate-700 cursor-pointer min-w-[60px]"
                 >
                     <option value="ALL">全区域</option>
                     {regions.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
             </div>

             {/* Platform Filter */}
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                 <Layout size={14} className="text-slate-500"/>
                 <select 
                    value={selectedPlatform} 
                    onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'ALL')}
                    className="text-xs font-bold bg-transparent outline-none text-slate-700 cursor-pointer min-w-[60px]"
                 >
                     <option value="ALL">全平台</option>
                     {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
             </div>
             
             {/* Category Filter */}
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                 <Layers size={14} className="text-slate-500"/>
                 <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs font-bold bg-transparent outline-none text-slate-700 cursor-pointer min-w-[60px]"
                 >
                     <option value="ALL">全类目</option>
                     {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>

             {/* Brand Filter (Requested Update) */}
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                 <ShoppingBag size={14} className="text-slate-500"/>
                 <select 
                    value={selectedBrand} 
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="text-xs font-bold bg-transparent outline-none text-slate-700 cursor-pointer min-w-[60px]"
                 >
                     <option value="ALL">全品牌</option>
                     {brands.map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
             </div>

             {/* Tag Filter */}
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                 <Tag size={14} className="text-slate-500"/>
                 <select 
                    value={selectedTag} 
                    onChange={(e) => setSelectedTag(e.target.value as ProductTag | 'ALL')}
                    className="text-xs font-bold bg-transparent outline-none text-slate-700 cursor-pointer min-w-[60px]"
                 >
                     <option value="ALL">全标签</option>
                     <option value="新品">新品</option>
                     <option value="爆品">爆品</option>
                     <option value="高库存风险">高库存风险</option>
                     <option value="常规">常规</option>
                 </select>
             </div>

             {/* User Profile Card */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 ml-1">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <UserCircle size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Interactive KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="价格劣势" 
          value={`${kpis.priceDisadvantageCount} SKUs`}
          trend={kpis.priceDisadvantageCount > 0 ? "需调价" : "优势显著"}
          trendUp={kpis.priceDisadvantageCount === 0} 
          icon={<Zap size={24} />} 
          color={kpis.priceDisadvantageCount > 0 ? 'red' : 'blue'} 
          isActive={activeKpiFilter === 'LOSING'}
          onClick={() => handleKpiClick('LOSING')}
        />
        <KpiCard 
          title="异常/倒挂预警" 
          value={`${kpis.inversionCount} SKUs`}
          trend="售价低于成本"
          trendUp={false} 
          icon={<AlertTriangle size={24} />} 
          color="red" 
          isActive={activeKpiFilter === 'INVERSION'}
          onClick={() => handleKpiClick('INVERSION')}
        />
        <KpiCard 
          title="预估日销售/毛利损失" 
          value={`¥${Math.round(kpis.totalEstDailyLoss).toLocaleString()}`} 
          trend="劣势价差 x 销量" 
          trendUp={kpis.totalEstDailyLoss === 0} 
          icon={<DollarSign size={24} />} 
          color={kpis.totalEstDailyLoss > 1000 ? 'red' : 'orange'} 
          isActive={activeKpiFilter === 'EST_LOSS'}
          onClick={() => handleKpiClick('EST_LOSS')}
        />
        <KpiCard 
          title="价格优势商品" 
          value={`${kpis.priceAdvantageCount} SKUs`}
          trend="全网最低价" 
          trendUp={true} 
          icon={<Award size={24} />} 
          color="green" 
          isActive={activeKpiFilter === 'ADVANTAGE'}
          onClick={() => handleKpiClick('ADVANTAGE')}
        />
      </div>

      {/* Main Content Grid: Chart & List Interaction */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[750px]">
        
        {/* Left Column: Chart & Search */}
        <div className="xl:col-span-1 flex flex-col gap-4 h-full">
            {/* Chart Container */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                         <BarChart3 size={18} className="text-slate-700"/>
                         <h3 className="font-bold text-slate-800">商品价格走势</h3>
                    </div>
                </div>
                
                {/* Search in Chart Area */}
                <div className="relative w-full mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleHistoryQuery()}
                        placeholder="输入商品名/ID查询走势..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="flex-1 min-h-0">
                    <PriceChart data={displayProduct.data} title="" productName={displayProduct.name} />
                </div>
            </div>
        </div>
        
        {/* Right Column: Interactive Abnormal List */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle size={18} className="text-orange-500"/> 异常监控列表
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">
                       当前视图: 
                       <span className={`ml-1 font-bold ${activeKpiFilter === 'INVERSION' ? 'text-red-600' : activeKpiFilter === 'ADVANTAGE' ? 'text-green-600' : 'text-blue-600'}`}>
                           {activeKpiFilter === 'INVERSION' ? '成本倒挂 (Internal Loss)' : activeKpiFilter === 'ADVANTAGE' ? '价格优势 (Winning)' : '价格劣势 (Disadvantage)'}
                       </span>
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <button 
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                 >
                     <Download size={14}/> 导出表格
                 </button>
            </div>
          </div>

          {/* TABLE HEADER - DYNAMIC */}
          {/* Added first column for Selection (40px) */}
          <div className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 px-4 py-3 grid gap-2 items-center" 
               style={{ gridTemplateColumns: activeKpiFilter === 'INVERSION' ? '40px 60px 2fr 1fr 1fr 1fr 1fr' : '40px 60px 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
              <div className="text-center">关注</div>
              <div>ID</div>
              <div>商品名称 / 规格</div>
              <div className="text-right">当前售价</div>
              
              {activeKpiFilter === 'INVERSION' ? (
                  <>
                    <div className="text-right">当前成本价</div>
                    <div className="text-right">毛利额</div>
                    <div className="text-right">毛利率%</div>
                  </>
              ) : (
                  <>
                    <div className="text-right">京东万商</div>
                    <div className="text-right">易久批</div>
                    <div className="text-right">鲜世纪</div>
                    <div className="text-right">与最低竞对差值</div>
                    <div className="text-right text-slate-400">当前成本</div>
                    <div className="text-right">跟价后毛利</div>
                  </>
              )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {alerts.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-sm">
                    <Target size={32} className="mb-2 opacity-50"/>
                    <p>当前筛选条件下无数据</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {alerts.map((item, idx) => {
                        const isSelected = selectedAlertId === item.id;
                        return (
                           <div 
                              key={idx}
                              onClick={() => handleSelectProduct(item.skuId, item.id)}
                              className={`px-4 py-3 grid gap-2 items-center text-xs transition-colors cursor-pointer hover:bg-blue-50/50 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                              style={{ gridTemplateColumns: activeKpiFilter === 'INVERSION' ? '40px 60px 2fr 1fr 1fr 1fr 1fr' : '40px 60px 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}
                           >
                                {/* Selection Star */}
                                <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); toggleSpecialAttention(item.skuId); }}>
                                    <Star 
                                        size={16} 
                                        className={`cursor-pointer transition-colors hover:scale-110 ${item.isSpecial ? 'fill-orange-400 text-orange-400' : 'text-slate-300 hover:text-orange-300'}`}
                                    />
                                </div>

                                <div className="font-mono text-slate-400">{item.skuId.slice(-4)}</div>
                                <div>
                                    <div className="font-bold text-slate-700 truncate" title={item.product}>{item.product}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{item.spec}</div>
                                    <div className="flex gap-1 mt-1">
                                        {item.tags.map((t: string) => (
                                            <span key={t} className="text-[10px] px-1 rounded bg-slate-100 text-slate-500 scale-90 origin-left">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right font-bold text-blue-600 font-mono">¥{item.ourPrice}</div>

                                {activeKpiFilter === 'INVERSION' ? (
                                    <>
                                        <div className="text-right font-mono text-slate-600">¥{item.cost}</div>
                                        <div className="text-right font-mono font-bold text-red-600">¥{item.profit.toFixed(2)}</div>
                                        <div className="text-right font-mono text-red-500">{((item.profit/item.ourPrice)*100).toFixed(1)}%</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-right font-mono text-slate-600">{item.jdPrice || '-'}</div>
                                        <div className="text-right font-mono text-slate-600">{item.yjpPrice || '-'}</div>
                                        <div className="text-right font-mono text-slate-600">{item.xsjPrice || '-'}</div>
                                        <div className={`text-right font-mono font-bold ${item.gap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {item.gap > 0 ? `+${item.gap.toFixed(1)}` : item.gap.toFixed(1)}
                                        </div>
                                        <div className="text-right font-mono text-slate-400">¥{item.cost}</div>
                                        <div className={`text-right font-mono font-bold ${item.estMarginAfterMatch > 0 ? 'text-slate-700' : 'text-red-600'}`}>
                                            ¥{item.estMarginAfterMatch.toFixed(1)}
                                        </div>
                                    </>
                                )}
                           </div>
                        );
                    })}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
