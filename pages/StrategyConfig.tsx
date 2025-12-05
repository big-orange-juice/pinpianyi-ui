
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Settings, Layers, Tag, Plus, Save, Trash2, ShieldAlert, BarChart3, ListFilter, X, Check, Edit3, AlertTriangle, Globe, Layout, MapPin, Filter, Search, ChevronDown, CheckSquare, Square, FileDown, Upload, FileSpreadsheet, Percent, DollarSign } from 'lucide-react';
import { Platform } from '../types';

type RuleType = 'CATEGORY' | 'SKU';

interface AnalysisRule {
  id: string;
  targetType: RuleType;
  targetName: string; 
  platform: Platform | 'ALL';
  region: string; 
  marginThreshold: number; 
  priceGapAlert: number;
  priceGapType: 'PERCENT' | 'ABSOLUTE'; // New: Support absolute value
  priority: 'High' | 'Medium' | 'Low';
}

// Expanded City List to demonstrate handling large datasets
const ALL_REGIONS = [
  '所有区域',
  '上海', '杭州', '苏州', '南京', '无锡', '宁波', '温州', '嘉兴', '南通', '徐州', '常州', // 华东
  '北京', '天津', '石家庄', '太原', '呼和浩特', // 华北
  '广州', '深圳', '佛山', '东莞', '厦门', '福州', '泉州', // 华南
  '武汉', '长沙', '郑州', // 华中
  '成都', '重庆', '西安', // 西部
  '合肥', '芜湖', '阜阳'
];

// --- Custom Multi-Select Component for Regions ---
interface RegionMultiSelectProps {
  selected: string[];
  onChange: (regions: string[]) => void;
}

const RegionMultiSelect: React.FC<RegionMultiSelectProps> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = ALL_REGIONS.filter(r => r.includes(searchTerm));
  const isAllSelected = ALL_REGIONS.length === selected.length;

  const toggleRegion = (region: string) => {
    if (region === '所有区域') {
       // Toggle logic for "All" is tricky in multi-select, 
       // usually specific rules are distinct from global.
       // Here we treat it as just another tag for filtering.
    }
    
    if (selected.includes(region)) {
      onChange(selected.filter(r => r !== region));
    } else {
      onChange([...selected, region]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange(['所有区域']); // Default revert to just Global or Empty
    } else {
      onChange(ALL_REGIONS);
    }
  };

  // Render trigger text
  const renderTriggerText = () => {
    if (selected.length === 0) return '请选择管辖区域';
    if (selected.length === ALL_REGIONS.length) return '全选 (所有站点)';
    if (selected.length === 1) return selected[0];
    
    const firstTwo = selected.slice(0, 2).join(', ');
    const remaining = selected.length - 2;
    return remaining > 0 ? `${firstTwo} +${remaining}` : firstTwo;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-bold min-w-[200px] transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <div className="flex items-center gap-2 text-slate-700 truncate max-w-[240px]">
           <MapPin size={16} className="text-blue-600 shrink-0"/>
           <span>{renderTriggerText()}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[480px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in-up flex flex-col overflow-hidden">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-100 bg-slate-50">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索城市站..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  autoFocus
                />
             </div>
             <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-slate-500">已选 {selected.length} 个区域</span>
                <button onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:underline">
                  {isAllSelected ? '取消全选' : '选择全部'}
                </button>
             </div>
          </div>

          {/* Grid List */}
          <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
             <div className="grid grid-cols-4 gap-2">
                {filteredRegions.map(region => {
                  const isSelected = selected.includes(region);
                  return (
                    <button 
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs font-medium transition-all ${
                        isSelected 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      {isSelected ? <CheckSquare size={14} className="shrink-0"/> : <Square size={14} className="shrink-0 text-slate-300"/>}
                      <span className="truncate">{region}</span>
                    </button>
                  );
                })}
             </div>
             {filteredRegions.length === 0 && (
               <div className="text-center py-6 text-slate-400 text-xs">未找到相关城市站</div>
             )}
          </div>
          
          {/* Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-end">
             <button onClick={() => setIsOpen(false)} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700">
               确认
             </button>
          </div>
        </div>
      )}
    </div>
  );
};


const StrategyConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RuleType>('CATEGORY');
  
  // Changed to Array for Multi-Select
  const [selectedRegionFilters, setSelectedRegionFilters] = useState<string[]>(['所有区域', '上海', '杭州']); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Mock Data
  const [rules, setRules] = useState<AnalysisRule[]>([
    {
      id: '1',
      targetType: 'CATEGORY',
      targetName: '饮料',
      platform: 'ALL',
      region: '上海',
      marginThreshold: 15,
      priceGapAlert: 3,
      priceGapType: 'PERCENT',
      priority: 'High'
    },
    {
      id: '2',
      targetType: 'CATEGORY',
      targetName: '粮油',
      platform: Platform.JD_WANSHANG,
      region: '杭州',
      marginThreshold: 10,
      priceGapAlert: 5,
      priceGapType: 'PERCENT',
      priority: 'Medium'
    },
    {
      id: '3',
      targetType: 'SKU',
      targetName: '红牛维生素功能饮料 250ml',
      platform: Platform.YI_JIU_PI,
      region: '所有区域',
      marginThreshold: 5,
      priceGapAlert: 1.5,
      priceGapType: 'ABSOLUTE',
      priority: 'High'
    },
    {
      id: '4',
      targetType: 'CATEGORY',
      targetName: '酒水',
      platform: 'ALL',
      region: '北京',
      marginThreshold: 20,
      priceGapAlert: 5,
      priceGapType: 'PERCENT',
      priority: 'Low'
    }
  ]);

  // Form State
  const [formData, setFormData] = useState<Omit<AnalysisRule, 'id' | 'targetType'>>({
    targetName: '',
    platform: 'ALL',
    region: '所有区域',
    marginThreshold: 10,
    priceGapAlert: 5,
    priceGapType: 'PERCENT',
    priority: 'Medium'
  });

  // Updated Filter Logic: Show if rule's region is in the selected set OR rule is global
  const currentRules = rules.filter(r => 
      r.targetType === activeTab && 
      (selectedRegionFilters.includes(r.region) || r.region === '所有区域')
  );

  // Handlers
  const handleOpenAdd = () => {
    setEditingRuleId(null);
    setFormData({
      targetName: '',
      platform: 'ALL',
      region: '所有区域',
      marginThreshold: 10,
      priceGapAlert: 5,
      priceGapType: 'PERCENT',
      priority: 'Medium'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: AnalysisRule) => {
    setEditingRuleId(rule.id);
    setFormData({
      targetName: rule.targetName,
      platform: rule.platform,
      region: rule.region,
      marginThreshold: rule.marginThreshold,
      priceGapAlert: rule.priceGapAlert,
      priceGapType: rule.priceGapType,
      priority: rule.priority
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条策略配置吗？')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.targetName.trim()) {
      alert('请输入监控对象名称');
      return;
    }

    if (editingRuleId) {
      // Update existing
      setRules(prev => prev.map(r => r.id === editingRuleId ? { ...r, ...formData } : r));
    } else {
      // Create new
      const newRule: AnalysisRule = {
        id: Date.now().toString(),
        targetType: activeTab,
        ...formData
      };
      setRules(prev => [...prev, newRule]);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const headers = ['TargetType(CATEGORY/SKU)', 'TargetName', 'Platform', 'Region', 'Priority(High/Medium/Low)', 'MarginThreshold(%)', 'GapType(PERCENT/ABSOLUTE)', 'GapValue'];
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + "CATEGORY,示例类目,ALL,所有区域,Medium,10,PERCENT,5\nSKU,示例商品TOP001,京东万商,上海,High,5,ABSOLUTE,1.5";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategy_rules_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        // Simple CSV parse
        const lines = text.split('\n').filter(l => l.trim());
        const newRules: AnalysisRule[] = [];
        
        // Skip header if present (simple check based on first column)
        const startIdx = lines[0].toLowerCase().includes('targettype') ? 1 : 0;
        
        for (let i = startIdx; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length >= 8) {
                 newRules.push({
                     id: Date.now().toString() + Math.random(),
                     targetType: (cols[0].trim() as RuleType) || 'CATEGORY',
                     targetName: cols[1].trim(),
                     platform: (cols[2].trim() as Platform | 'ALL') || 'ALL',
                     region: cols[3].trim() || '所有区域',
                     priority: (cols[4].trim() as any) || 'Medium',
                     marginThreshold: parseFloat(cols[5]) || 10,
                     priceGapType: (cols[6].trim() as 'PERCENT' | 'ABSOLUTE') || 'PERCENT',
                     priceGapAlert: parseFloat(cols[7]) || 5
                 });
            }
        }
        
        setRules(prev => [...prev, ...newRules]);
        alert(`成功导入 ${newRules.length} 条规则配置`);
        e.target.value = ''; // Reset
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black flex items-center gap-3">
              <Settings className="text-blue-600" /> 竞对策略配置中心
            </h2>
            <p className="text-slate-500">
              配置不同类目或单品SKU的监控标准，自定义“价盘分析矩阵”的分析维度与预警红线。
            </p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Import/Export Actions */}
            <div className="flex gap-2 mr-4">
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                  title="下载Excel导入模版"
                >
                    <FileDown size={16} /> 模版下载
                </button>
                <button 
                   onClick={handleImportClick}
                   className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all"
                >
                    <Upload size={16} /> 批量导入
                </button>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".csv,.txt"
                   onChange={handleFileChange} 
                />
            </div>

            {/* Updated Region Filter for Multi-Station Management */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm z-30">
                <div className="flex flex-col px-2 border-r border-slate-100 mr-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HIGHEST PRIORITY</span>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        <Filter size={14} className="text-blue-500" /> 管辖区域配置
                    </span>
                </div>
                
                {/* Custom Multi-Select Component */}
                <RegionMultiSelect 
                    selected={selectedRegionFilters} 
                    onChange={setSelectedRegionFilters} 
                />
            </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 inline-flex">
        <button
          onClick={() => setActiveTab('CATEGORY')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'CATEGORY' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers size={16} /> 行业类目规则
        </button>
        <button
          onClick={() => setActiveTab('SKU')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'SKU' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag size={16} /> SKU 单品规则
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-6">
        {currentRules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow group relative overflow-hidden">
            {/* Region Label Tag */}
            <div className={`absolute top-0 left-0 px-4 py-1.5 rounded-br-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm z-10 ${rule.region === '所有区域' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'}`}>
                <MapPin size={12} /> {rule.region}
            </div>

            {/* Left Info */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6 pt-8 lg:pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  rule.priority === 'High' ? 'bg-red-50 text-red-600' : 
                  rule.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {rule.priority === 'High' ? 'High Priority' : rule.priority === 'Medium' ? 'Medium Priority' : 'Low Priority'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">{rule.targetName}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                 <span className={`text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1 ${
                   rule.platform === 'ALL' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                 }`}>
                    {rule.platform === 'ALL' ? <Globe size={12}/> : <Layout size={12}/>}
                    {rule.platform === 'ALL' ? '全平台' : rule.platform}
                 </span>
              </div>
            </div>

            {/* Middle Settings */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Margin Threshold */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                   <ShieldAlert size={16} className="text-red-500"/> 最低毛利红线
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-200 h-full flex flex-col justify-center">
                   <div className="space-y-1">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-500">Margin Threshold</span>
                         <span className="font-mono font-bold text-red-600">{rule.marginThreshold}%</span>
                       </div>
                       <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full" style={{width: `${rule.marginThreshold * 2}%`}}></div>
                       </div>
                   </div>
                </div>
              </div>

              {/* Price Gap Threshold */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                   <AlertTriangle size={16} className="text-orange-500"/> 最大允许价差
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-200 h-full flex flex-col justify-center">
                   <div className="space-y-1">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-500">Price Gap ({rule.priceGapType === 'PERCENT' ? '百分比' : '绝对值'})</span>
                         <span className="font-mono font-bold text-orange-600">
                             {rule.priceGapType === 'ABSOLUTE' ? `¥${rule.priceGapAlert}` : `${rule.priceGapAlert}%`}
                         </span>
                       </div>
                       <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-orange-300 to-orange-500 h-full rounded-full" style={{width: rule.priceGapType === 'PERCENT' ? `${rule.priceGapAlert * 3}%` : '50%' }}></div>
                       </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex flex-col justify-center items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 gap-3 lg:w-32">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm w-full justify-center"
                  onClick={() => handleOpenEdit(rule)}
                >
                  <Edit3 size={16} /> 编辑
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all w-full justify-center"
                  onClick={() => handleDelete(rule.id)}
                >
                  <Trash2 size={16} /> 删除
                </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add Button */}
        <button 
          onClick={handleOpenAdd}
          className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/10 transition-all flex flex-col items-center justify-center gap-3 font-medium group"
        >
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
               <Plus size={28} className="text-slate-400 group-hover:text-blue-500" />
            </div>
            <span className="text-sm">点击添加新的 {activeTab === 'CATEGORY' ? '行业类目' : 'SKU单品'} 监控策略</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
         <BarChart3 className="shrink-0 mt-0.5" size={20} />
         <div>
           <p className="font-bold mb-1">配置生效说明：</p>
           <p className="opacity-90 leading-relaxed">
             1. <span className="font-bold">优先级顺序：</span> SKU单品规则 {'>'} 行业类目规则 {'>'} 系统默认规则。
             <br/>
             2. <span className="font-bold">区域维度：</span> 上方筛选器为“管辖视角”，您可以看到您所选区域内生效的所有规则（包含特定区域规则和通用规则）。
           </p>
         </div>
      </div>

      {/* EDIT/ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {editingRuleId ? <Edit3 size={18}/> : <Plus size={18}/>}
                    {editingRuleId ? '编辑策略规则' : '新建策略规则'}
                    <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2">
                       {activeTab === 'CATEGORY' ? '类目级' : 'SKU级'}
                    </span>
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                 
                 {/* Field: Name & Platform & Region */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {activeTab === 'CATEGORY' ? '行业类目名称' : 'SKU 商品名称'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                        type="text" 
                        value={formData.targetName}
                        onChange={(e) => setFormData({...formData, targetName: e.target.value})}
                        placeholder={activeTab === 'CATEGORY' ? "例如：饮料、粮油" : "例如：红牛维生素功能饮料"}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            适用竞对平台
                        </label>
                        <select 
                            value={formData.platform}
                            onChange={(e) => setFormData({...formData, platform: e.target.value as Platform | 'ALL'})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white text-black"
                        >
                            <option value="ALL" className="text-black">全平台通用</option>
                            {Object.values(Platform).map(p => (
                                <option key={p} value={p} className="text-black">{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            适用城市/区域
                        </label>
                        <select 
                            value={formData.region}
                            onChange={(e) => setFormData({...formData, region: e.target.value})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white text-black"
                        >
                            {ALL_REGIONS.map(r => (
                                <option key={r} value={r} className="text-black">{r}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 {/* Field: Priority */}
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">策略优先级</label>
                    <div className="flex gap-4">
                       {['High', 'Medium', 'Low'].map((p) => (
                          <label key={p} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                             formData.priority === p 
                             ? 'bg-blue-50 border-blue-500 text-blue-700' 
                             : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}>
                             <input 
                               type="radio" 
                               name="priority" 
                               className="hidden"
                               checked={formData.priority === p}
                               onChange={() => setFormData({...formData, priority: p as any})}
                             />
                             {p === 'High' && '🔴 高'}
                             {p === 'Medium' && '🟠 中'}
                             {p === 'Low' && '🟢 低'}
                          </label>
                       ))}
                    </div>
                 </div>

                 {/* Thresholds Section */}
                 <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                       <AlertTriangle size={14} /> 阈值设定
                    </h4>
                    
                    {/* Margin Slider */}
                    <div>
                       <div className="flex justify-between text-sm mb-2">
                          <label className="font-semibold text-slate-700">最低毛利红线 (Margin Threshold)</label>
                          <span className="font-bold text-blue-600">{formData.marginThreshold}%</span>
                       </div>
                       <input 
                         type="range" min="0" max="50" step="1"
                         value={formData.marginThreshold}
                         onChange={(e) => setFormData({...formData, marginThreshold: Number(e.target.value)})}
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                       />
                       <p className="text-xs text-slate-400 mt-1">当商品毛利低于此值时，系统将标记为"严重倒挂"。</p>
                    </div>

                    {/* Price Gap Control */}
                    <div>
                       <div className="flex justify-between items-center text-sm mb-3">
                          <label className="font-semibold text-slate-700">最大允许价差 (Max Price Gap)</label>
                          
                          {/* Type Toggle */}
                          <div className="flex bg-slate-200 rounded-lg p-0.5">
                              <button 
                                onClick={() => setFormData({...formData, priceGapType: 'PERCENT'})}
                                className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${formData.priceGapType === 'PERCENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                <Percent size={12} className="inline mr-0.5" /> 百分比
                              </button>
                              <button 
                                onClick={() => setFormData({...formData, priceGapType: 'ABSOLUTE'})}
                                className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${formData.priceGapType === 'ABSOLUTE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                <DollarSign size={12} className="inline mr-0.5" /> 绝对值
                              </button>
                          </div>
                       </div>
                       
                       {formData.priceGapType === 'PERCENT' ? (
                           <>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="range" min="0" max="30" step="1"
                                    value={formData.priceGapAlert}
                                    onChange={(e) => setFormData({...formData, priceGapAlert: Number(e.target.value)})}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                 />
                                 <span className="font-bold text-orange-600 w-12 text-right">{formData.priceGapAlert}%</span>
                             </div>
                           </>
                       ) : (
                           <div className="flex items-center gap-2">
                               <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                  <input 
                                     type="number" min="0" step="0.1"
                                     value={formData.priceGapAlert}
                                     onChange={(e) => setFormData({...formData, priceGapAlert: parseFloat(e.target.value) || 0})}
                                     className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
                                  />
                               </div>
                               <span className="text-xs text-slate-400">元</span>
                           </div>
                       )}
                       
                       <p className="text-xs text-slate-400 mt-2">
                           当竞对价格低于我方超过此{formData.priceGapType === 'PERCENT' ? '百分比' : '金额'}时，触发"价格劣势"预警。
                       </p>
                    </div>
                 </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSave}
                   className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2"
                 >
                   <Save size={18} />
                   {editingRuleId ? '保存修改' : '确认创建'}
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default StrategyConfig;
