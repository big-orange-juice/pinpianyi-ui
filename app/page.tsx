'use client';

import React, { useMemo, useState } from 'react';
import KpiCard from '@/components/KpiCard';
import DelegationModal from '@/components/DelegationModal';
import { AlertTriangle, Zap, Target, Activity, TrendingDown, Search, Download, UserCircle, MapPin, Layout, Tag, DollarSign, Package, AlertCircle, BarChart3, ChevronRight, ShoppingBag, Layers, Award, Star, Bot } from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import { MOCK_PRODUCTS, MOCK_COMPETITORS, getHistoryData } from '@/constants';
import Link from 'next/link';
import { Platform, ProductTag, DelegationTaskType } from '@/types';
import { useAppStore } from '@/store/useAppStore';

type KpiFilterType = 'ALL' | 'LOSING' | 'INVERSION' | 'EST_LOSS' | 'ADVANTAGE';

const Dashboard: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType>('LOSING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'ALL_TOP' | 'SPECIAL'>('ALL_TOP');
  const [displayProduct, setDisplayProduct] = useState<{data: any[], name: string}>(getHistoryData('TOP001'));
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegationTarget, setDelegationTarget] = useState<{ productName: string; productId: string } | null>(null);
  
  const { 
      costThreshold, currentUser,
      selectedTag, setSelectedTag,
      selectedPlatform, setSelectedPlatform, 
      availablePlatforms,
      selectedCategory, setSelectedCategory,
      selectedBrand, setSelectedBrand,
      selectedRegion, setSelectedRegion,
      monitoredProductIds,
      specialAttentionIds, toggleSpecialAttention,
      delegateToAgent
  } = useAppStore();

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

  const handleOpenDelegation = (productName: string, productId: string) => {
    setDelegationTarget({ productName, productId });
    setIsDelegationModalOpen(true);
  };

  const handleDelegate = (taskType: DelegationTaskType, customInstructions?: string) => {
    if (delegationTarget) {
      delegateToAgent(delegationTarget.productName, delegationTarget.productId, taskType, customInstructions);
    }
  };

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

  const kpis = useMemo(() => {
    let inversionCount = 0;
    let priceDisadvantageCount = 0;
    let priceAdvantageCount = 0;
    let totalEstDailyLoss = 0;

    MOCK_PRODUCTS.forEach(p => {
        if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id)) return;
        if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id)) return;
        if (selectedTag !== 'ALL' && (!p.tags || !p.tags.includes(selectedTag as ProductTag))) return;
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
        if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

        const comps = regionFilteredCompetitors[p.id] || [];
        if (comps.length === 0) return;

        if (p.ourPrice < p.ourCost) {
            inversionCount++;
        }

        const minCompPrice = Math.min(...comps.map(c => c.activityPrice));
        
        if (p.ourPrice > minCompPrice) {
            priceDisadvantageCount++;
            const gap = p.ourPrice - minCompPrice;
            totalEstDailyLoss += gap * (p.last7DaysSales / 7);
        }

        if (p.ourPrice < minCompPrice) {
            priceAdvantageCount++;
        }
    });

    return { inversionCount, priceDisadvantageCount, priceAdvantageCount, totalEstDailyLoss };
  }, [regionFilteredCompetitors, selectedTag, selectedCategory, selectedBrand, monitoredProductIds, activeViewMode, specialAttentionIds]);

  const alerts = useMemo(() => {
      const list: any[] = [];
      MOCK_PRODUCTS.forEach(p => {
          if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id)) return;
          if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id)) return;
          if (selectedTag !== 'ALL' && (!p.tags || !p.tags.includes(selectedTag as ProductTag))) return;
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
          if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

          const comps = regionFilteredCompetitors[p.id] || [];
          if (comps.length === 0) return;

          const minCompPrice = Math.min(...comps.map(c => c.activityPrice));
          const jdComp = comps.find(c => c.platform.includes('京东'));
          const yjpComp = comps.find(c => c.platform.includes('易久批'));
          const xsjComp = comps.find(c => c.platform.includes('鲜世纪'));

          const gap = p.ourPrice - minCompPrice;
          const profit = p.ourPrice - p.ourCost;
          const isInternalInversion = p.ourPrice < p.ourCost;
          const isLosing = p.ourPrice > minCompPrice;
          const isWinning = p.ourPrice < minCompPrice;
          const isSpecial = specialAttentionIds.includes(p.id);

          const baseData = {
              id: p.id,
              skuId: p.id,
              product: p.name,
              spec: p.spec,
              ourPrice: p.ourPrice,
              cost: p.ourCost,
              jdPrice: jdComp?.activityPrice,
              yjpPrice: yjpComp?.activityPrice,
              xsjPrice: xsjComp?.activityPrice,
              minCompPrice,
              gap,
              profit,
              estMarginAfterMatch: isLosing ? (minCompPrice - p.ourCost) : profit,
              tags: p.tags || [],
              isSpecial
          };

          if (isInternalInversion) {
               list.push({ ...baseData, type: 'INVERSION', category: '成本倒挂', sortVal: profit });
          }
          if (isLosing) {
               list.push({ ...baseData, type: 'LOSING', category: '价格劣势', sortVal: gap });
          }
          if (isWinning) {
               list.push({ ...baseData, type: 'ADVANTAGE', category: '价格优势', sortVal: gap });
          }
      });
      
      let filtered = list;
      if (activeKpiFilter === 'LOSING') filtered = list.filter(i => i.type === 'LOSING');
      else if (activeKpiFilter === 'INVERSION') filtered = list.filter(i => i.type === 'INVERSION');
      else if (activeKpiFilter === 'ADVANTAGE') filtered = list.filter(i => i.type === 'ADVANTAGE');
      else if (activeKpiFilter === 'EST_LOSS') filtered = list.filter(i => i.type === 'LOSING');

      if (activeKpiFilter === 'INVERSION') {
          return filtered.sort((a,b) => a.profit - b.profit);
      }
      return filtered.sort((a,b) => b.sortVal - a.sortVal);
  }, [regionFilteredCompetitors, selectedTag, selectedCategory, selectedBrand, monitoredProductIds, activeViewMode, specialAttentionIds, activeKpiFilter]);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">运营仪表盘</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <UserCircle size={16} /> {currentUser.name} · {currentUser.role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 font-medium text-sm">
              <MapPin size={16} /> {selectedRegion} 大区
            </div>
            <Link href="/analysis">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                <BarChart3 size={16} /> 深度分析
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">全部区域</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select 
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'ALL')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">全部平台</option>
          {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">全部品类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">全部品牌</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value as ProductTag | 'ALL')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">全部标签</option>
          <option value="爆品">爆品</option>
          <option value="新品">新品</option>
          <option value="高库存风险">高库存风险</option>
          <option value="常规">常规</option>
        </select>

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveViewMode('ALL_TOP')}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeViewMode === 'ALL_TOP' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            全部商品
          </button>
          <button 
            onClick={() => setActiveViewMode('SPECIAL')}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeViewMode === 'SPECIAL' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            <Star size={12} /> 关注
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="价格劣势商品"
          value={kpis.priceDisadvantageCount}
          icon={<TrendingDown size={24} />}
          color="red"
          onClick={() => handleKpiClick('LOSING')}
          isActive={activeKpiFilter === 'LOSING'}
        />
        <KpiCard 
          title="成本倒挂预警"
          value={kpis.inversionCount}
          icon={<AlertTriangle size={24} />}
          color="orange"
          onClick={() => handleKpiClick('INVERSION')}
          isActive={activeKpiFilter === 'INVERSION'}
        />
        <KpiCard 
          title="价格优势商品"
          value={kpis.priceAdvantageCount}
          icon={<Target size={24} />}
          color="green"
          onClick={() => handleKpiClick('ADVANTAGE')}
          isActive={activeKpiFilter === 'ADVANTAGE'}
        />
        <KpiCard 
          title="预估日损失"
          value={`¥${kpis.totalEstDailyLoss.toFixed(0)}`}
          icon={<DollarSign size={24} />}
          color="blue"
          onClick={() => handleKpiClick('EST_LOSS')}
          isActive={activeKpiFilter === 'EST_LOSS'}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <PriceChart 
          data={displayProduct.data}
          title="价格走势分析"
          productName={displayProduct.name}
        />
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            {activeKpiFilter === 'ALL' && '全部预警'}
            {activeKpiFilter === 'LOSING' && '价格劣势列表'}
            {activeKpiFilter === 'INVERSION' && '成本倒挂列表'}
            {activeKpiFilter === 'ADVANTAGE' && '价格优势列表'}
            {activeKpiFilter === 'EST_LOSS' && '损失排行'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">共 {alerts.length} 条记录</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-600">商品</th>
                <th className="text-right p-4 font-semibold text-slate-600">我方价格</th>
                <th className="text-right p-4 font-semibold text-slate-600">京东</th>
                <th className="text-right p-4 font-semibold text-slate-600">易久批</th>
                <th className="text-right p-4 font-semibold text-slate-600">鲜世纪</th>
                <th className="text-right p-4 font-semibold text-slate-600">价差</th>
                <th className="text-right p-4 font-semibold text-slate-600">状态</th>
                <th className="text-center p-4 font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, idx) => (
                <tr 
                  key={`${alert.id}-${idx}`} 
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedAlertId === `${alert.id}-${idx}` ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectProduct(alert.skuId, `${alert.id}-${idx}`)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {alert.isSpecial && <Star size={14} className="text-orange-500 fill-orange-500" />}
                      <div>
                        <div className="font-medium text-slate-800">{alert.product}</div>
                        <div className="text-xs text-slate-500">{alert.spec}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-800">¥{alert.ourPrice}</td>
                  <td className="p-4 text-right font-mono text-slate-600">{alert.jdPrice ? `¥${alert.jdPrice}` : '-'}</td>
                  <td className="p-4 text-right font-mono text-slate-600">{alert.yjpPrice ? `¥${alert.yjpPrice}` : '-'}</td>
                  <td className="p-4 text-right font-mono text-slate-600">{alert.xsjPrice ? `¥${alert.xsjPrice}` : '-'}</td>
                  <td className={`p-4 text-right font-mono font-bold ${alert.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.gap > 0 ? '+' : ''}{alert.gap.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      alert.type === 'INVERSION' ? 'bg-orange-100 text-orange-700' :
                      alert.type === 'LOSING' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSpecialAttention(alert.id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="关注"
                      >
                        <Star size={16} className={alert.isSpecial ? 'text-orange-500 fill-orange-500' : 'text-slate-400'} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelegation(alert.product, alert.id);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
                        title="委派给云智能体"
                      >
                        <Bot size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delegation Modal */}
      {delegationTarget && (
        <DelegationModal
          isOpen={isDelegationModalOpen}
          onClose={() => setIsDelegationModalOpen(false)}
          productName={delegationTarget.productName}
          productId={delegationTarget.productId}
          onDelegate={handleDelegate}
        />
      )}
    </div>
  );
};

export default Dashboard;
