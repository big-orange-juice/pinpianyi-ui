
import React, { useState, useMemo } from 'react';
import { Database, Server, CheckCircle2, RefreshCw, Bot, Sparkles, Clock, ListTodo, Check, Plus, X, Edit2, Trash2, FileUp, Star, ArrowLeft, Search, Filter } from 'lucide-react';
import { Platform, CrawlerField, Product } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { MOCK_PRODUCTS } from '../constants';

const DataCollection: React.FC = () => {
  const { 
    openAgent, addNotification, availablePlatforms, addPlatform, 
    monitoredProductIds, setMonitoredProductIds, 
    specialAttentionIds, setSpecialAttentionIds 
  } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<string>(availablePlatforms[0] || Platform.JD_WANSHANG);
  const [isScanning, setIsScanning] = useState(false);
  
  // The Centralized Audit Queue
  const [pendingReviews, setPendingReviews] = useState<CrawlerField[]>([]);
  
  // State for the active item being analyzed/confirmed inside the queue
  const [analyzingFieldId, setAnalyzingFieldId] = useState<string | null>(null);
  const [selectedLocalMappings, setSelectedLocalMappings] = useState<Record<string, string>>({});
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, { label: string, desc: string, confidence: number }>>({});

  // Add Platform Modal
  const [isAddPlatformModalOpen, setIsAddPlatformModalOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformFields, setNewPlatformFields] = useState('');

  // Top Products Import Modal & Workflow
  const [isImportTopModalOpen, setIsImportTopModalOpen] = useState(false);
  const [importTopText, setImportTopText] = useState('');
  const [importStep, setImportStep] = useState<'INPUT' | 'SELECT'>('INPUT');
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [tempSpecialIds, setTempSpecialIds] = useState<Set<string>>(new Set());

  // Special Attention Management Modal
  const [isSpecialManageModalOpen, setIsSpecialManageModalOpen] = useState(false);
  const [specialManageSearch, setSpecialManageSearch] = useState('');
  const [currentSpecialSet, setCurrentSpecialSet] = useState<Set<string>>(new Set());

  // CRUD Field Modal
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CrawlerField | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<CrawlerField>>({});

  // Mock Local Fields for Mapping
  const LOCAL_SYSTEM_FIELDS = [
      { key: 'ourCost', label: '成本价' },
      { key: 'minPrice', label: '最低限价' },
      { key: 'memberPrice', label: '会员价' },
      { key: 'inventory', label: '库存' },
      { key: 'logisticsFee', label: '物流费用' },
      { key: 'tags', label: '商品标签' },
      { key: 'promoType', label: '活动类型' }
  ];

  // Existing Mapped Fields
  const [mappedFields, setMappedFields] = useState<CrawlerField[]>([
    { key: 'sku_id', label: 'SKU ID', type: 'String', isMapped: true, description: '商品唯一标识', sourcePlatform: Platform.JD_WANSHANG, mappingStatus: 'MAPPED', localField: 'externalId' },
    { key: 'price', label: '前台价', type: 'Number', isMapped: true, description: '页面展示价格', sourcePlatform: Platform.JD_WANSHANG, mappingStatus: 'MAPPED', localField: 'displayPrice' },
    { key: 'stock_status', label: '库存状态', type: 'String', isMapped: true, description: '是否有货', sourcePlatform: Platform.JD_WANSHANG, mappingStatus: 'MAPPED', localField: 'inventoryStatus' },
    { key: 'promotion_text', label: '促销文案', type: 'String', isMapped: true, description: '前台促销语', sourcePlatform: Platform.JD_WANSHANG, mappingStatus: 'MAPPED', localField: 'promoText' },
  ]);

  const currentPlatformMappedFields = mappedFields.filter(f => f.sourcePlatform === activeTab);
  const currentPlatformPendingFields = pendingReviews.filter(f => f.sourcePlatform === activeTab);

  // --- Core Logic: Add Field to Review Queue ---
  const addToReviewQueue = (newFields: CrawlerField[]) => {
      // Filter out duplicates
      const uniqueNewFields = newFields.filter(nf => 
          !pendingReviews.some(pf => pf.key === nf.key && pf.sourcePlatform === nf.sourcePlatform) && 
          !mappedFields.some(mf => mf.key === nf.key && mf.sourcePlatform === mf.sourcePlatform)
      );

      if (uniqueNewFields.length === 0) return;

      setPendingReviews(prev => [...uniqueNewFields, ...prev]);

      // Trigger Notification
      addNotification({
          type: 'NEW_FIELD',
          title: `发现 ${uniqueNewFields.length} 个新字段待审核`,
          message: `来源: ${uniqueNewFields[0].sourcePlatform}。请前往数据采集配置中心进行人工确认。`,
          actionPayload: { platform: uniqueNewFields[0].sourcePlatform, term: uniqueNewFields[0].key }
      });
  };

  // Trigger 1: Manual Scan
  const handleManualScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const mockField: CrawlerField = { 
           key: activeTab === Platform.JD_WANSHANG ? 'plus_vip_level_price' : 'bulk_purchase_limit', 
           label: '未知字段', 
           type: 'Number', 
           description: 'Detected via Manual Scan', 
           sourcePlatform: activeTab,
           mappingStatus: 'PENDING_REVIEW',
           isMapped: false
      };
      addToReviewQueue([mockField]);
      setIsScanning(false);
    }, 1500);
  };

  // Trigger 2: Simulate Background Crawler Report
  const handleSimulateBackgroundReport = () => {
      const mockFields: CrawlerField[] = [
          { 
             key: 'warehouse_distance_fee', 
             label: '未知费用', 
             type: 'Number', 
             description: 'Detected via Daily Crawler Report', 
             sourcePlatform: activeTab,
             mappingStatus: 'PENDING_REVIEW',
             isMapped: false 
          }
      ];
      addToReviewQueue(mockFields);
  };

  // Trigger 3: Add New Platform & Import Fields
  const handleImportPlatform = () => {
      if (!newPlatformName.trim()) {
          alert("请输入竞品平台名称");
          return;
      }
      
      // 1. Add Platform to Global Context
      addPlatform(newPlatformName);
      
      // 2. Parse CSV-like Input
      const lines = newPlatformFields.split('\n').filter(l => l.trim());
      const newFields: CrawlerField[] = lines.map(line => {
          const [key, desc] = line.split(/,|，/);
          return {
              key: key?.trim() || 'unknown_field',
              label: '导入字段',
              type: 'String',
              description: desc?.trim() || 'Imported from manual entry',
              sourcePlatform: newPlatformName,
              mappingStatus: 'PENDING_REVIEW',
              isMapped: false
          };
      });

      // 3. Add to Queue
      if (newFields.length > 0) {
          addToReviewQueue(newFields);
      }

      // 4. Switch Tab & Notify Agent
      setActiveTab(newPlatformName);
      setIsAddPlatformModalOpen(false);
      setNewPlatformName('');
      setNewPlatformFields('');
      
      openAgent(`我刚刚导入了新竞品平台【${newPlatformName}】的 ${newFields.length} 个字段，请帮我进行清洗和映射建议。`);
  };

  // Trigger 4: Import Top Focus Products
  const closeImportModal = () => {
      setIsImportTopModalOpen(false);
      setImportTopText('');
      setImportStep('INPUT');
      setParsedProducts([]);
      setTempSpecialIds(new Set());
  };

  const handleParseImport = () => {
      const ids = importTopText.match(/TOP\d{3}/g);
      if (!ids || ids.length === 0) {
          alert("未能识别有效的 SKU ID (格式如 TOP001)");
          return;
      }

      const uniqueIds = Array.from(new Set(ids));
      // Find matching products in mock database
      const validProducts = MOCK_PRODUCTS.filter(p => uniqueIds.includes(p.id));
      
      if (validProducts.length === 0) {
          alert("未在商品库中找到匹配的 SKU ID");
          return;
      }

      setParsedProducts(validProducts);
      setImportStep('SELECT');
  };

  const handleFinalImport = () => {
      const allIds = parsedProducts.map(p => p.id);
      const specialIds = Array.from(tempSpecialIds);
      
      setMonitoredProductIds(allIds);
      setSpecialAttentionIds(specialIds);
      
      openAgent(`已成功导入 ${allIds.length} 个重点关注品，其中 ${specialIds.length} 个已标记为【特别关注】。仪表盘已根据您的导入列表进行更新。`);
      closeImportModal();
  };

  const toggleTempSpecial = (id: string) => {
      const next = new Set(tempSpecialIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setTempSpecialIds(next);
  };

  const handleToggleSelectAllSpecial = () => {
      if (tempSpecialIds.size === parsedProducts.length) {
          setTempSpecialIds(new Set());
      } else {
          setTempSpecialIds(new Set(parsedProducts.map(p => p.id)));
      }
  };

  // Trigger 5: Manage Special Focus Products
  const handleOpenSpecialManage = () => {
    setCurrentSpecialSet(new Set(specialAttentionIds));
    setSpecialManageSearch('');
    setIsSpecialManageModalOpen(true);
  };

  const handleSaveSpecialManage = () => {
    setSpecialAttentionIds(Array.from(currentSpecialSet));
    setIsSpecialManageModalOpen(false);
    openAgent(`特别关注商品列表已更新，当前共关注 ${currentSpecialSet.size} 个重点 SKU。`);
  };

  const toggleSpecialInManage = (id: string) => {
    const next = new Set(currentSpecialSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCurrentSpecialSet(next);
  };

  const handleToggleSelectAllInManage = (filteredIds: string[]) => {
      // If all currently filtered IDs are selected, deselect them. Otherwise, select all filtered.
      const allSelected = filteredIds.every(id => currentSpecialSet.has(id));
      
      const next = new Set(currentSpecialSet);
      if (allSelected) {
          filteredIds.forEach(id => next.delete(id));
      } else {
          filteredIds.forEach(id => next.add(id));
      }
      setCurrentSpecialSet(next);
  };

  // Filter logic for Management Modal
  const filteredMonitoredProducts = useMemo(() => {
      return MOCK_PRODUCTS
        .filter(p => monitoredProductIds.includes(p.id))
        .filter(p => p.name.includes(specialManageSearch) || p.id.includes(specialManageSearch));
  }, [monitoredProductIds, specialManageSearch]);


  // Action: AI Analyze Single Field
  const handleAIAnalyze = (field: CrawlerField) => {
      setAnalyzingFieldId(field.key);
      
      // Simulate AI Latency
      setTimeout(() => {
          let analysis = { label: '', desc: '', confidence: 0 };
          let recLocal = '';

          // Heuristic Mock for Demo
          if (field.key.includes('vip') || field.key.includes('level')) {
              analysis = { label: '会员分层价', desc: '推测为不同等级会员的专属权益价。', confidence: 92 };
              recLocal = 'memberPrice';
          } else if (field.key.includes('fee') || field.key.includes('distance')) {
              analysis = { label: '远仓履约费', desc: '推测为跨区域调货产生的物流成本。', confidence: 88 };
              recLocal = 'logisticsFee';
          } else if (field.key.includes('limit')) {
              analysis = { label: '批量限购数', desc: '大宗采购的数量上限限制。', confidence: 85 };
              recLocal = 'inventory'; 
          } else if (field.key.includes('price')) {
              analysis = { label: '价格相关', desc: '商品价格字段。', confidence: 80 };
              recLocal = 'memberPrice';
          } else {
              analysis = { label: '未知属性', desc: '无法准确匹配，建议人工核查。', confidence: 40 };
          }

          setAiAnalysisResults(prev => ({ ...prev, [field.key]: analysis }));
          setSelectedLocalMappings(prev => ({ ...prev, [field.key]: recLocal }));
          setAnalyzingFieldId(null);
      }, 1500);
  };

  // Action: Confirm Mapping
  const handleConfirm = (field: CrawlerField) => {
      const targetLocalField = selectedLocalMappings[field.key];
      if (!targetLocalField) return;

      const newMappedField: CrawlerField = {
          ...field,
          label: aiAnalysisResults[field.key]?.label || field.label,
          description: aiAnalysisResults[field.key]?.desc || field.description,
          localField: targetLocalField,
          mappingStatus: 'MAPPED',
          isMapped: true
      };

      setMappedFields(prev => [...prev, newMappedField]);
      setPendingReviews(prev => prev.filter(f => f.key !== field.key));
      
      // Clean up temp state
      const newMappings = { ...selectedLocalMappings };
      delete newMappings[field.key];
      setSelectedLocalMappings(newMappings);

      openAgent(`我已经确认将字段 [${field.key}] 映射为 [${targetLocalField}]。请更新数据分析策略。`);
  };

  // CRUD Handlers
  const handleOpenCreateField = () => {
      setEditingField(null);
      setFieldForm({
          key: '',
          label: '',
          localField: '',
          description: '',
          sourcePlatform: activeTab,
          mappingStatus: 'MAPPED',
          isMapped: true,
          type: 'String'
      });
      setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CrawlerField) => {
      setEditingField(field);
      setFieldForm({ ...field });
      setIsFieldModalOpen(true);
  };

  const handleDeleteField = (fieldKey: string) => {
      if (window.confirm(`确定要删除字段 [${fieldKey}] 吗？此操作不可恢复。`)) {
          setMappedFields(prev => prev.filter(f => !(f.key === fieldKey && f.sourcePlatform === activeTab)));
          addNotification({
               type: 'INFO',
               title: '字段已删除',
               message: `字段 [${fieldKey}] 已从 [${activeTab}] 映射表中移除。`,
          });
      }
  };

  const handleSaveField = () => {
      if (!fieldForm.key || !fieldForm.label || !fieldForm.localField) {
          alert("请填写完整的字段信息 (Key, 业务名, 本地映射)");
          return;
      }

      if (editingField) {
          // Update
          setMappedFields(prev => prev.map(f => 
              (f.key === editingField.key && f.sourcePlatform === editingField.sourcePlatform) 
              ? { ...f, ...fieldForm } as CrawlerField 
              : f
          ));
      } else {
          // Create - Check duplicate
          if (mappedFields.some(f => f.key === fieldForm.key && f.sourcePlatform === activeTab)) {
              alert("该 Key 在当前平台已存在");
              return;
          }
          setMappedFields(prev => [...prev, fieldForm as CrawlerField]);
      }
      setIsFieldModalOpen(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <Database className="text-blue-600" /> 数据采集配置中心
           </h2>
           <p className="text-slate-500 mt-2">
             管理多平台爬虫字段映射与 Schema 变更审核。
           </p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={handleOpenSpecialManage}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-bold transition-colors shadow-sm"
              title="可视化管理特别关注商品"
            >
               <Star size={16} className="fill-orange-500 text-orange-500" /> 特别关注品管理
            </button>
            <button 
              onClick={() => setIsImportTopModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-bold transition-colors shadow-sm"
              title="导入Excel/CSV更新重点关注品"
            >
               <FileUp size={16} /> Top重点关注品导入
            </button>
            <button 
              onClick={handleSimulateBackgroundReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
              title="模拟后台爬虫在固定时间自动发现新字段"
            >
               <Clock size={16} /> 模拟每日爬虫报告
            </button>
            <button 
              onClick={handleManualScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-70 text-sm font-bold"
            >
               <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
               {isScanning ? '扫描中...' : '手动扫描变更'}
            </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 overflow-x-auto">
          {availablePlatforms.map(p => (
              <button key={p} onClick={() => setActiveTab(p)} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-all rounded-t-lg shrink-0 ${activeTab === p ? 'text-blue-600 border-x border-t border-slate-200 bg-white -mb-px z-10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 bg-slate-50 border-b border-slate-200'}`}>
                  <Server size={16} /> {p}
                  {pendingReviews.filter(f => f.sourcePlatform === p).length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                          {pendingReviews.filter(f => f.sourcePlatform === p).length}
                      </span>
                  )}
              </button>
          ))}
          <button 
             onClick={() => setIsAddPlatformModalOpen(true)}
             className="px-4 py-3 text-sm font-bold flex items-center gap-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all rounded-t-lg border-b border-slate-200"
          >
              <Plus size={16} /> 新增竞品
          </button>
      </div>

      {/* 1. AUDIT MODULE AREA (待审核区域) */}
      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
             <ListTodo size={20} className="text-orange-500" /> 
             待审核映射字段
             <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">
                {currentPlatformPendingFields.length} 待处理
             </span>
          </h3>

          {currentPlatformPendingFields.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle2 size={40} className="mb-3 text-slate-300" />
                  <p className="text-sm font-medium">当前平台 Schema 正常，无待审核字段。</p>
              </div>
          ) : (
              <div className="grid gap-4">
                  {currentPlatformPendingFields.map((field) => {
                      const analysis = aiAnalysisResults[field.key];
                      const isAnalyzing = analyzingFieldId === field.key;
                      const targetValue = selectedLocalMappings[field.key] || '';

                      return (
                        <div key={field.key} className="border border-orange-200 bg-orange-50/30 rounded-xl p-4 animate-fade-in">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                {/* Left: Source Field Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-bold text-slate-800 bg-white px-2 py-0.5 border rounded border-slate-200">{field.key}</span>
                                        <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded font-bold">NEW</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                                </div>

                                {/* Middle: AI Analysis */}
                                <div className="flex-[2] border-l border-r border-orange-100 px-6">
                                    {!analysis ? (
                                        <button 
                                            onClick={() => handleAIAnalyze(field)}
                                            disabled={isAnalyzing}
                                            className="text-indigo-600 text-sm font-bold flex items-center gap-2 hover:underline disabled:opacity-50"
                                        >
                                            <Bot size={16} className={isAnalyzing ? 'animate-bounce' : ''} />
                                            {isAnalyzing ? 'Agent 正在分析语义...' : '点击启动 AI 语义推演'}
                                        </button>
                                    ) : (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-indigo-700 font-bold text-sm flex items-center gap-1">
                                                    <Sparkles size={12}/> {analysis.label}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${analysis.confidence > 80 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                    置信度 {analysis.confidence}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{analysis.desc}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Action */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">映射至本地字段</label>
                                        <select 
                                            value={targetValue}
                                            onChange={(e) => setSelectedLocalMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="w-full text-sm border border-slate-300 rounded p-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">-- 请选择 --</option>
                                            {LOCAL_SYSTEM_FIELDS.map(lf => (
                                                <option key={lf.key} value={lf.key}>{lf.label} ({lf.key})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={() => handleConfirm(field)}
                                        disabled={!targetValue}
                                        className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Check size={16} /> 确认映射
                                    </button>
                                </div>
                            </div>
                        </div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* 2. MAPPED FIELDS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 text-sm">已生效字段映射表</h3>
              <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">最后更新: {new Date().toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <button 
                     onClick={handleOpenCreateField}
                     className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700"
                  >
                     <Plus size={14} /> 新增字段
                  </button>
              </div>
          </div>
          <div className="p-0">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 font-semibold uppercase border-b border-slate-100">
                      <tr>
                          <th className="p-4 pl-6">原始 Key</th>
                          <th className="p-4">中文业务名</th>
                          <th className="p-4">本地映射字段</th>
                          <th className="p-4">状态</th>
                          <th className="p-4 text-right pr-6">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {currentPlatformMappedFields.map((field) => (
                          <tr key={field.key} className="hover:bg-slate-50 group">
                              <td className="p-4 pl-6 font-mono text-slate-700">{field.key}</td>
                              <td className="p-4 font-bold text-slate-800">{field.label}</td>
                              <td className="p-4">
                                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-mono">
                                      {field.localField}
                                  </span>
                              </td>
                              <td className="p-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                                      <CheckCircle2 size={10} /> 已生效
                                  </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                  <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100">
                                      <button 
                                        onClick={() => handleOpenEditField(field)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="编辑"
                                      >
                                          <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteField(field.key)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="删除"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Create/Edit Field Modal */}
      {isFieldModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">
                          {editingField ? '编辑字段映射' : '手动新增字段'}
                      </h3>
                      <button onClick={() => setIsFieldModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">原始 Key <span className="text-red-500">*</span></label>
                          <input 
                             type="text" 
                             disabled={!!editingField} // Disable key editing
                             value={fieldForm.key}
                             onChange={(e) => setFieldForm({...fieldForm, key: e.target.value})}
                             placeholder="例如：sku_id, price_vip" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">中文业务名 <span className="text-red-500">*</span></label>
                          <input 
                             type="text" 
                             value={fieldForm.label}
                             onChange={(e) => setFieldForm({...fieldForm, label: e.target.value})}
                             placeholder="例如：会员价" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">本地映射字段 <span className="text-red-500">*</span></label>
                           <select 
                                value={fieldForm.localField}
                                onChange={(e) => setFieldForm({...fieldForm, localField: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                           >
                                <option value="">-- 请选择 --</option>
                                {LOCAL_SYSTEM_FIELDS.map(lf => (
                                    <option key={lf.key} value={lf.key}>{lf.label} ({lf.key})</option>
                                ))}
                           </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">描述说明</label>
                          <textarea 
                             value={fieldForm.description}
                             onChange={(e) => setFieldForm({...fieldForm, description: e.target.value})}
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 text-sm"
                          />
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button onClick={() => setIsFieldModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                              取消
                          </button>
                          <button onClick={handleSaveField} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                              保存配置
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Platform Modal */}
      {isAddPlatformModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">新增竞品平台数据源</h3>
                      <button onClick={() => setIsAddPlatformModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">竞品平台名称</label>
                          <input 
                             type="text" 
                             value={newPlatformName}
                             onChange={(e) => setNewPlatformName(e.target.value)}
                             placeholder="例如：美团快驴, 阿里零售通..." 
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">批量导入字段 (CSV格式)</label>
                          <textarea 
                             value={newPlatformFields}
                             onChange={(e) => setNewPlatformFields(e.target.value)}
                             placeholder="例如：&#10;field_key, 字段描述&#10;price_vip, VIP会员价&#10;stock_num, 库存数量" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 text-sm font-mono"
                          />
                          <p className="text-xs text-slate-400 mt-1">每行一个字段，使用逗号分隔 Key 和 描述。</p>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button onClick={() => setIsAddPlatformModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                              取消
                          </button>
                          <button onClick={handleImportPlatform} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                              确认导入并清洗
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Import Top Products Modal */}
      {isImportTopModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <FileUp size={20} className="text-blue-600" /> 
                          {importStep === 'INPUT' ? '导入 Top 重点关注品' : '确认与特别关注标记'}
                      </h3>
                      <button onClick={closeImportModal} className="text-slate-400 hover:text-slate-700">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  {importStep === 'INPUT' ? (
                      <div className="space-y-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-800 leading-relaxed">
                                  上传重点关注商品列表后，<span className="font-bold">仪表盘将仅展示这些商品</span>。
                                  下一步您可以从中筛选部分商品标记为 <span className="font-bold text-orange-600">★ 特别关注</span>。
                              </p>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">商品列表 (CSV/Excel 粘贴)</label>
                              <textarea 
                                 value={importTopText}
                                 onChange={(e) => setImportTopText(e.target.value)}
                                 placeholder="请输入 SKU ID 列表... &#10;&#10;例如：&#10;TOP001&#10;TOP002&#10;TOP014" 
                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-48 text-sm font-mono"
                              />
                              <p className="text-xs text-slate-400 mt-1">支持直接粘贴 Excel 列数据，系统将自动提取 TOPxxx 格式的 ID。</p>
                          </div>
                          
                          <div className="pt-4 flex gap-3">
                              <button onClick={closeImportModal} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                                  取消
                              </button>
                              <button onClick={handleParseImport} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                  下一步：解析与筛选
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col flex-1 overflow-hidden">
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center mb-3 shrink-0">
                               <span className="text-xs text-orange-800">
                                   已识别 <span className="font-bold">{parsedProducts.length}</span> 个有效商品。请勾选 <Star size={12} className="inline text-orange-500 fill-orange-500"/> 设为特别关注。
                               </span>
                               <button 
                                 onClick={handleToggleSelectAllSpecial}
                                 className="text-xs font-bold text-blue-600 hover:underline"
                               >
                                   {tempSpecialIds.size === parsedProducts.length ? '取消全选' : '全选特别关注'}
                               </button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 custom-scrollbar mb-4 bg-slate-50">
                               {parsedProducts.map(p => (
                                   <div 
                                      key={p.id} 
                                      className="p-3 flex items-center gap-3 hover:bg-white transition-colors cursor-pointer" 
                                      onClick={() => toggleTempSpecial(p.id)}
                                   >
                                        <div className={`p-1.5 rounded-lg transition-colors border ${tempSpecialIds.has(p.id) ? 'bg-orange-100 text-orange-500 border-orange-200' : 'bg-white text-slate-300 border-slate-200'}`}>
                                            <Star size={16} fill={tempSpecialIds.has(p.id) ? "currentColor" : "none"} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-700 line-clamp-1">{p.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                                                <span className="text-[10px] text-slate-500 bg-slate-200 px-1 rounded">{p.category}</span>
                                            </div>
                                        </div>
                                   </div>
                               ))}
                          </div>
                          
                          <div className="flex gap-3 shrink-0 pt-2 border-t border-slate-100">
                               <button onClick={() => setImportStep('INPUT')} className="flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                   <ArrowLeft size={16} /> 上一步
                               </button>
                               <button onClick={handleFinalImport} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                   确认导入 ({parsedProducts.length})
                               </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Special Attention Management Modal */}
      {isSpecialManageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Star size={20} className="fill-orange-500 text-orange-500" /> 
                          管理特别关注商品
                      </h3>
                      <button onClick={() => setIsSpecialManageModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                          <X size={20}/>
                      </button>
                  </div>

                  <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <Search size={16} className="text-slate-400" />
                          <input 
                            type="text"
                            value={specialManageSearch}
                            onChange={(e) => setSpecialManageSearch(e.target.value)}
                            placeholder="搜索 SKU ID 或名称..."
                            className="bg-transparent outline-none text-sm w-full"
                          />
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                          <span>从 Top 关注品 ({monitoredProductIds.length}) 中筛选</span>
                          <button 
                            onClick={() => handleToggleSelectAllInManage(filteredMonitoredProducts.map(p => p.id))}
                            className="font-bold text-blue-600 hover:underline"
                          >
                             全选/取消当前列表
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 custom-scrollbar bg-slate-50">
                           {filteredMonitoredProducts.length === 0 ? (
                               <div className="p-8 text-center text-slate-400 text-xs">没有找到匹配的商品</div>
                           ) : filteredMonitoredProducts.map(p => (
                               <div 
                                  key={p.id} 
                                  className="p-3 flex items-center gap-3 hover:bg-white transition-colors cursor-pointer" 
                                  onClick={() => toggleSpecialInManage(p.id)}
                               >
                                    <div className={`p-1.5 rounded-lg transition-colors border ${currentSpecialSet.has(p.id) ? 'bg-orange-100 text-orange-500 border-orange-200' : 'bg-white text-slate-300 border-slate-200'}`}>
                                        <Star size={16} fill={currentSpecialSet.has(p.id) ? "currentColor" : "none"} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-700 line-clamp-1">{p.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-200 px-1 rounded">{p.category}</span>
                                        </div>
                                    </div>
                                    {currentSpecialSet.has(p.id) && (
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                            已关注
                                        </span>
                                    )}
                               </div>
                           ))}
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center text-xs">
                           <span className="text-orange-800">当前共选中 <span className="font-bold text-lg">{currentSpecialSet.size}</span> 个</span>
                           <span className="text-orange-600 opacity-70">将在仪表盘"特别关注"视图中展示</span>
                      </div>

                      <div className="pt-2 flex gap-3">
                          <button onClick={() => setIsSpecialManageModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                              取消
                          </button>
                          <button onClick={handleSaveSpecialManage} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                              保存设置
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DataCollection;
