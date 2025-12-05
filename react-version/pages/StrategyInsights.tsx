
import React, { useEffect, useState, useMemo } from 'react';
import { analyzeCompetitorDeepStrategy } from '../services/geminiService';
import { MOCK_PRODUCTS, MOCK_COMPETITORS } from '../constants';
import { 
    Filter, Loader2, RefreshCw, 
    Package, DollarSign, Ticket, Users, 
    Eye, Truck, RotateCcw, Map, FileSearch 
} from 'lucide-react';
import { PriceComparisonRow, Platform, ActivityType, CompetitorDeepAnalysis } from '../types';
import { useAppContext } from '../contexts/AppContext';

const StrategyInsights: React.FC = () => {
  const [aiAnalysis, setAiAnalysis] = useState<CompetitorDeepAnalysis | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters State from Global Context
  const { 
      selectedPlatform, setSelectedPlatform,
      selectedCategory, setSelectedCategory,
      selectedActivity, setSelectedActivity
  } = useAppContext();

  // Distinct categories for filter
  const categories = useMemo(() => Array.from(new Set(MOCK_PRODUCTS.map(p => p.category))), []);

  // 1. Filter Data Logic
  const filteredRows: PriceComparisonRow[] = useMemo(() => {
      let rows: PriceComparisonRow[] = [];
      MOCK_PRODUCTS.forEach(product => {
        if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return;
        
        const comps = MOCK_COMPETITORS[product.id] || [];
        comps.forEach(compData => {
            if (selectedPlatform !== 'ALL' && compData.platform !== selectedPlatform) return;
            if (selectedActivity !== 'ALL' && compData.activityType !== selectedActivity) return;

            const simulatedMargin = compData.activityPrice - product.ourCost;
            const simulatedMarginRate = compData.activityPrice > 0 ? simulatedMargin / compData.activityPrice : 0;

            rows.push({
                product,
                competitorData: compData,
                priceGap: product.ourPrice - compData.activityPrice,
                costGap: product.ourCost - compData.activityPrice,
                marginRate: (product.ourPrice - product.ourCost) / product.ourPrice,
                competitorEstimatedMargin: 0,
                simulatedMargin,
                simulatedMarginRate,
                status: 'Draw',
                alertLevel: 'Normal',
                recommendation: '',
                analysisNote: ''
            });
        });
      });
      return rows;
  }, [selectedPlatform, selectedCategory, selectedActivity]);


  useEffect(() => {
    const loadAnalysis = async () => {
        setIsUpdating(true);
        try {
            const contextLabel = `${selectedPlatform === 'ALL' ? '综合平台' : selectedPlatform} / ${selectedCategory === 'ALL' ? '全品类' : selectedCategory}`;
            const result = await analyzeCompetitorDeepStrategy(contextLabel, filteredRows);
            setAiAnalysis(result);
        } catch(e) {
            console.error("Strategy analysis failed", e);
            // Reset analysis on error to avoid stale/bad state
            setAiAnalysis(null);
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Debounce simple implementation
    const timer = setTimeout(() => {
        loadAnalysis();
    }, 800);
    return () => clearTimeout(timer);

  }, [filteredRows, selectedPlatform, selectedCategory]);

  // Helper to render Insight Card
  const InsightCard = ({ icon, title, content, colorClass }: any) => (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
              <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
                  {icon}
              </div>
              <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed flex-1 whitespace-pre-wrap">
              {isUpdating ? (
                  <span className="inline-block w-full space-y-2">
                      <span className="block w-3/4 h-3 bg-slate-100 rounded animate-pulse"></span>
                      <span className="block w-1/2 h-3 bg-slate-100 rounded animate-pulse"></span>
                      <span className="block w-full h-3 bg-slate-100 rounded animate-pulse"></span>
                  </span>
              ) : (
                 // Safe render: coerce to string to prevent object rendering crash
                 String(content || "暂无详细数据，请调整筛选条件。")
              )}
          </p>
      </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">运营策略洞察中心</h2>
           <p className="text-slate-500 mt-1">全维度解析竞对操盘逻辑 (KO文档标准)</p>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
           <div className="text-slate-500"><Filter size={16}/></div>
           
           <select 
                value={selectedPlatform} 
                onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'ALL')}
                className="py-1.5 px-2 border border-slate-200 rounded text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
             >
                 <option value="ALL">全平台</option>
                 {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
             </select>

             <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2 border border-slate-200 rounded text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
             >
                 <option value="ALL">全行业/类目</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>

             <select 
                value={selectedActivity} 
                onChange={(e) => setSelectedActivity(e.target.value as ActivityType | 'ALL')}
                className="py-1.5 px-2 border border-slate-200 rounded text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
             >
                 <option value="ALL">全活动类型</option>
                 {Object.values(ActivityType).map(a => <option key={a} value={a}>{a}</option>)}
             </select>

             <button className="text-slate-400 hover:text-blue-600 transition-colors ml-2" title="刷新分析">
                 <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
             </button>
        </div>
      </div>

      {/* Empty State Check */}
      {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
                  <FileSearch size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">当前筛选条件下无数据</h3>
              <p className="text-slate-500 mt-2 max-w-md text-center">
                  请尝试切换平台、类目或活动类型以获取更多分析结果。
              </p>
          </div>
      ) : (
        /* 8-Dimension Strategy Matrix */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {/* 1. 商品结构 */}
            <InsightCard 
                icon={<Package size={20}/>} 
                title="商品结构洞察" 
                content={aiAnalysis?.productStructure}
                colorClass="text-blue-600 bg-blue-50"
            />
            {/* 2. 定价策略 */}
            <InsightCard 
                icon={<DollarSign size={20}/>} 
                title="定价体系分析" 
                content={aiAnalysis?.pricingStrategy}
                colorClass="text-green-600 bg-green-50"
            />
            {/* 3. 活动策略 */}
            <InsightCard 
                icon={<Ticket size={20}/>} 
                title="活动玩法策略" 
                content={aiAnalysis?.activityStrategy}
                colorClass="text-red-600 bg-red-50"
            />
            {/* 4. 用户策略 */}
            <InsightCard 
                icon={<Users size={20}/>} 
                title="新老客/会员策略" 
                content={aiAnalysis?.userStrategy}
                colorClass="text-purple-600 bg-purple-50"
            />
            {/* 5. 曝光逻辑 */}
            <InsightCard 
                icon={<Eye size={20}/>} 
                title="流量曝光逻辑" 
                content={aiAnalysis?.exposureStrategy}
                colorClass="text-orange-600 bg-orange-50"
            />
            {/* 6. 仓配售后 */}
            <InsightCard 
                icon={<Truck size={20}/>} 
                title="仓配与售后效率" 
                content={aiAnalysis?.fulfillmentStrategy}
                colorClass="text-teal-600 bg-teal-50"
            />
            {/* 7. 客单复购 */}
            <InsightCard 
                icon={<RotateCcw size={20}/>} 
                title="客单价与复购" 
                content={aiAnalysis?.retentionStrategy}
                colorClass="text-indigo-600 bg-indigo-50"
            />
            {/* 8. 区域策略 */}
            <InsightCard 
                icon={<Map size={20}/>} 
                title="区域投放差异" 
                content={aiAnalysis?.regionalStrategy}
                colorClass="text-pink-600 bg-pink-50"
            />
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-slate-900 rounded-xl p-6 text-slate-300 text-sm flex items-start gap-4 shadow-lg">
         <div className="p-2 bg-slate-800 rounded shrink-0">
             <Loader2 size={20} className={`text-blue-400 ${isUpdating ? 'animate-spin' : ''}`} />
         </div>
         <div>
             <h4 className="font-bold text-white mb-1">AI 综合研判</h4>
             <p>
                {filteredRows.length === 0 ? "等待数据输入..." : (
                    isUpdating ? "正在整合多维度数据进行研判..." : 
                    `当前分析基于 ${filteredRows.length} 条市场数据。建议重点关注 "${selectedPlatform === 'ALL' ? '全网' : selectedPlatform}" 在${selectedCategory === 'ALL' ? '全品类' : selectedCategory}领域的布局。${aiAnalysis?.pricingStrategy?.includes('激进') ? '检测到激进的价格战信号，请留意毛利保护。' : '目前市场处于相对平稳期，建议侧重优化履约体验。'}`
                )}
             </p>
         </div>
      </div>
    </div>
  );
};

export default StrategyInsights;
