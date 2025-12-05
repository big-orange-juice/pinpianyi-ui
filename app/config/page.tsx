'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Settings,
  Layers,
  Tag as TagIcon,
  Plus,
  Save,
  Trash2,
  ShieldAlert,
  BarChart3,
  X,
  Edit3,
  AlertTriangle,
  Globe,
  Layout,
  MapPin,
  Filter,
  Search,
  ChevronDown,
  CheckSquare,
  Square,
  FileDown,
  Upload,
  Percent,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Button, Card, Input, Select, Slider, Radio, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Platform } from '@/types';

type RuleType = 'CATEGORY' | 'SKU';

interface AnalysisRule {
  id: string;
  targetType: RuleType;
  targetName: string;
  platform: Platform | 'ALL';
  region: string;
  marginThreshold: number;
  priceGapAlert: number;
  priceGapType: 'PERCENT' | 'ABSOLUTE';
  priority: 'High' | 'Medium' | 'Low';
}

const ALL_REGIONS = [
  '所有区域',
  '上海',
  '杭州',
  '苏州',
  '南京',
  '无锡',
  '宁波',
  '温州',
  '嘉兴',
  '南通',
  '徐州',
  '常州',
  '北京',
  '天津',
  '石家庄',
  '太原',
  '呼和浩特',
  '广州',
  '深圳',
  '佛山',
  '东莞',
  '厦门',
  '福州',
  '泉州',
  '武汉',
  '长沙',
  '郑州',
  '成都',
  '重庆',
  '西安',
  '合肥',
  '芜湖',
  '阜阳'
];

interface RegionMultiSelectProps {
  selected: string[];
  onChange: (regions: string[]) => void;
}

const RegionMultiSelect: React.FC<RegionMultiSelectProps> = ({
  selected,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = ALL_REGIONS.filter((region) =>
    region.includes(searchTerm)
  );
  const isAllSelected = selected.length === ALL_REGIONS.length;

  const toggleRegion = (region: string) => {
    if (selected.includes(region)) {
      onChange(selected.filter((item) => item !== region));
    } else {
      onChange([...selected, region]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange(['所有区域']);
    } else {
      onChange([...ALL_REGIONS]);
    }
  };

  const renderTriggerText = () => {
    if (selected.length === 0) return '请选择管辖区域';
    if (selected.length === ALL_REGIONS.length) return '全选 (所有站点)';
    if (selected.length === 1) return selected[0];
    const firstTwo = selected.slice(0, 2).join(', ');
    const remaining = selected.length - 2;
    return remaining > 0 ? `${firstTwo} +${remaining}` : firstTwo;
  };

  return (
    <div className='relative' ref={containerRef}>
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-bold min-w-[220px] transition-all ${
          isOpen
            ? 'border-blue-500 !text-blue-600'
            : 'border-slate-200 text-slate-700'
        }`}>
        <span className='flex items-center gap-2 truncate max-w-[200px]'>
          <MapPin size={16} className='text-blue-600' />
          {renderTriggerText()}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-2 w-[500px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden'>
          <div className='p-3 border-b border-slate-100 bg-slate-50'>
            <div className='relative'>
              <Search
                size={14}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='搜索城市站...'
                className='pl-8'
              />
            </div>
            <div className='flex justify-between items-center mt-2'>
              <span className='text-xs text-slate-500'>
                已选 {selected.length} 个区域
              </span>
              <Button type='link' size='small' onClick={handleSelectAll}>
                {isAllSelected ? '取消全选' : '选择全部'}
              </Button>
            </div>
          </div>
          <div className='p-3 max-h-[300px] overflow-y-auto custom-scrollbar'>
            <div className='grid grid-cols-4 gap-2'>
              {filteredRegions.map((region) => {
                const isSelected = selected.includes(region);
                return (
                  <Button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs font-medium ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-100 text-slate-600'
                    }`}>
                    {isSelected ? (
                      <CheckSquare size={14} />
                    ) : (
                      <Square size={14} className='text-slate-300' />
                    )}
                    <span className='truncate'>{region}</span>
                  </Button>
                );
              })}
            </div>
            {filteredRegions.length === 0 && (
              <div className='text-center py-6 text-slate-400 text-xs'>
                未找到相关城市站
              </div>
            )}
          </div>
          <div className='p-2 border-t border-slate-100 bg-slate-50 flex justify-end'>
            <Button type='primary' onClick={() => setIsOpen(false)}>
              确认
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const StrategyConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RuleType>('CATEGORY');
  const [selectedRegionFilters, setSelectedRegionFilters] = useState<string[]>([
    '所有区域',
    '上海',
    '杭州'
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [formData, setFormData] = useState<
    Omit<AnalysisRule, 'id' | 'targetType'>
  >({
    targetName: '',
    platform: 'ALL',
    region: '所有区域',
    marginThreshold: 10,
    priceGapAlert: 5,
    priceGapType: 'PERCENT',
    priority: 'Medium'
  });

  const currentRules = rules.filter(
    (rule) =>
      rule.targetType === activeTab &&
      (selectedRegionFilters.includes(rule.region) ||
        rule.region === '所有区域')
  );

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
      setRules((prev) => prev.filter((rule) => rule.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.targetName.trim()) {
      window.alert('请输入监控对象名称');
      return;
    }

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRuleId ? { ...rule, ...formData } : rule
        )
      );
    } else {
      const newRule: AnalysisRule = {
        id: Date.now().toString(),
        targetType: activeTab,
        ...formData
      };
      setRules((prev) => [...prev, newRule]);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'TargetType(CATEGORY/SKU)',
      'TargetName',
      'Platform',
      'Region',
      'Priority(High/Medium/Low)',
      'MarginThreshold(%)',
      'GapType(PERCENT/ABSOLUTE)',
      'GapValue'
    ];
    const content = `\uFEFF${headers.join(
      ','
    )}\nCATEGORY,示例类目,ALL,所有区域,Medium,10,PERCENT,5`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategy_rules_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const newRules: AnalysisRule[] = [];
      const startIndex = lines[0].toLowerCase().includes('targettype') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i += 1) {
        const columns = lines[i].split(',');
        if (columns.length >= 8) {
          newRules.push({
            id: `${Date.now().toString()}-${i}`,
            targetType: (columns[0].trim() as RuleType) || 'CATEGORY',
            targetName: columns[1].trim(),
            platform: ((columns[2].trim() as Platform) || 'ALL') as
              | Platform
              | 'ALL',
            region: columns[3].trim() || '所有区域',
            priority:
              (columns[4].trim() as 'High' | 'Medium' | 'Low') || 'Medium',
            marginThreshold: Number(columns[5]) || 10,
            priceGapType:
              (columns[6].trim() as 'PERCENT' | 'ABSOLUTE') || 'PERCENT',
            priceGapAlert: Number(columns[7]) || 5
          });
        }
      }
      setRules((prev) => [...prev, ...newRules]);
      window.alert(`成功导入 ${newRules.length} 条规则配置`);
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handlePriorityChange = (event: RadioChangeEvent) => {
    setFormData((prev) => ({ ...prev, priority: event.target.value }));
  };

  return (
    <div className='p-6 md:p-8 space-y-8'>
      <div className='flex items-center gap-2'>
        <Link href='/'>
          <Button type='text' icon={<ArrowLeft size={18} />}>
            返回仪表盘
          </Button>
        </Link>
      </div>
      <div className='flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6'>
        <div className='flex flex-col gap-2'>
          <h2 className='text-2xl font-bold text-black flex items-center gap-3'>
            <Settings className='text-blue-600' /> 竞对策略配置中心
          </h2>
          <p className='text-slate-500'>
            配置不同类目或单品SKU的监控标准，自定义价盘分析矩阵的分析维度与预警红线。
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Space>
            <Button
              icon={<FileDown size={16} />}
              onClick={handleDownloadTemplate}>
              模版下载
            </Button>
            <Button
              icon={<Upload size={16} />}
              type='primary'
              ghost
              onClick={handleImportClick}>
              批量导入
            </Button>
            <input
              type='file'
              ref={fileInputRef}
              className='hidden'
              accept='.csv,.txt'
              onChange={handleFileChange}
            />
          </Space>
          <div className='flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex flex-col px-2 border-r border-slate-100 mr-1'>
              <span className='text-[10px] text-slate-400 font-bold uppercase'>
                HIGHEST PRIORITY
              </span>
              <span className='text-sm font-bold text-slate-700 flex items-center gap-1'>
                <Filter size={14} className='text-blue-500' /> 管辖区域配置
              </span>
            </div>
            <RegionMultiSelect
              selected={selectedRegionFilters}
              onChange={setSelectedRegionFilters}
            />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-1 inline-flex'>
        <Button
          type={activeTab === 'CATEGORY' ? 'primary' : 'text'}
          className={
            activeTab === 'CATEGORY'
              ? 'px-6 py-2.5'
              : 'px-6 py-2.5 text-slate-600'
          }
          onClick={() => setActiveTab('CATEGORY')}
          icon={<Layers size={16} />}>
          行业类目规则
        </Button>
        <Button
          type={activeTab === 'SKU' ? 'primary' : 'text'}
          className={
            activeTab === 'SKU' ? 'px-6 py-2.5' : 'px-6 py-2.5 text-slate-600'
          }
          onClick={() => setActiveTab('SKU')}
          icon={<TagIcon size={16} />}>
          SKU 单品规则
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        {currentRules.map((rule) => (
          <Card
            key={rule.id}
            className='shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
            <div className='absolute top-0 left-0 px-4 py-1.5 rounded-br-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm z-10 bg-blue-600 text-white'>
              <MapPin size={12} /> {rule.region}
            </div>
            <div className='flex flex-col lg:flex-row gap-6 pt-6'>
              <div className='w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6'>
                <div className='flex items-center gap-2 mb-2'>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      rule.priority === 'High'
                        ? 'bg-red-50 text-red-600'
                        : rule.priority === 'Medium'
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                    {rule.priority === 'High'
                      ? 'High Priority'
                      : rule.priority === 'Medium'
                      ? 'Medium Priority'
                      : 'Low Priority'}
                  </span>
                </div>
                <h3 className='text-xl font-bold text-black mb-2'>
                  {rule.targetName}
                </h3>
                <div className='flex items-center gap-2 mt-2 flex-wrap'>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1 ${
                      rule.platform === 'ALL'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                    {rule.platform === 'ALL' ? (
                      <Globe size={12} />
                    ) : (
                      <Layout size={12} />
                    )}
                    {rule.platform === 'ALL' ? '全平台' : rule.platform}
                  </span>
                </div>
              </div>
              <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='flex flex-col gap-4 bg-white/90 border border-white/60 rounded-2xl p-4 shadow-sm'>
                  <div className='flex items-center justify-between text-sm font-bold text-slate-700'>
                    <span className='flex items-center gap-2'>
                      <ShieldAlert size={16} className='text-red-500' />{' '}
                      最低毛利红线
                    </span>
                    <span className='px-2 py-0.5 text-[11px] rounded-full bg-red-50 text-red-600 font-semibold'>
                      护盘监控
                    </span>
                  </div>
                  <div className='flex items-end justify-between gap-4'>
                    <div>
                      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Margin Threshold
                      </p>
                      <p className='text-3xl font-bold text-red-600 font-mono leading-none whitespace-nowrap'>
                        {rule.marginThreshold}%
                      </p>
                    </div>
                    <div className='text-right text-xs text-slate-400'>
                      <p>触发优先级</p>
                      <p className='text-sm font-semibold text-slate-700 whitespace-nowrap'>
                        {rule.priority}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className='w-full bg-slate-200 h-2 rounded-full overflow-hidden'>
                      <div
                        className='bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full'
                        style={{
                          width: `${Math.min(rule.marginThreshold * 2, 100)}%`
                        }}
                      />
                    </div>
                    <p className='text-[11px] text-slate-400 mt-2'>
                      毛利低于此阈值将触发限价/补贴策略提醒。
                    </p>
                  </div>
                </div>
                <div className='flex flex-col gap-4 bg-white/90 border border-white/60 rounded-2xl p-4 shadow-sm'>
                  <div className='flex items-center justify-between text-sm font-bold text-slate-700'>
                    <span className='flex items-center gap-2'>
                      <AlertTriangle size={16} className='text-orange-500' />{' '}
                      最大允许价差
                    </span>
                    <span className='px-2 py-0.5 text-[11px] rounded-full bg-orange-50 text-orange-600 font-semibold whitespace-nowrap'>
                      {rule.priceGapType === 'ABSOLUTE' ? '绝对值' : '百分比'}
                      监控
                    </span>
                  </div>
                  <div className='flex items-end justify-between gap-4'>
                    <div>
                      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Price Gap Limit
                      </p>
                      <p className='text-3xl font-bold text-orange-500 font-mono leading-none whitespace-nowrap'>
                        {rule.priceGapType === 'ABSOLUTE'
                          ? `¥${Number(rule.priceGapAlert).toFixed(1)}`
                          : `${rule.priceGapAlert}%`}
                      </p>
                    </div>
                    <div className='text-right text-xs text-slate-400'>
                      <p>超限后建议</p>
                      <p className='text-sm font-semibold text-slate-700 whitespace-nowrap'>
                        即刻复盘
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className='w-full bg-slate-200 h-2 rounded-full overflow-hidden'>
                      <div
                        className='bg-gradient-to-r from-orange-300 to-orange-500 h-full rounded-full'
                        style={{
                          width: `${Math.min(
                            rule.priceGapType === 'PERCENT'
                              ? (rule.priceGapAlert / 30) * 100
                              : (rule.priceGapAlert / 10) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <p className='text-[11px] text-slate-400 mt-2'>
                      超出该价差将触发竞对策略联动及告警推送。
                    </p>
                  </div>
                </div>
              </div>
              <div className='flex flex-col justify-center items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 gap-3 lg:w-32'>
                <Button
                  className='w-full'
                  icon={<Edit3 size={16} />}
                  onClick={() => handleOpenEdit(rule)}>
                  编辑
                </Button>
                <Button
                  danger
                  ghost
                  className='w-full'
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDelete(rule.id)}>
                  删除
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <Button
          onClick={handleOpenAdd}
          className='w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 flex flex-col items-center justify-center gap-3'
          icon={<Plus size={24} />}>
          点击添加新的 {activeTab === 'CATEGORY' ? '行业类目' : 'SKU单品'}{' '}
          监控策略
        </Button>
      </div>

      <div className='bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800'>
        <BarChart3 className='shrink-0 mt-0.5' size={20} />
        <div>
          <p className='font-bold mb-1'>配置生效说明：</p>
          <p className='opacity-90 leading-relaxed'>
            1. 优先级顺序： SKU单品规则 &gt; 行业类目规则 &gt; 系统默认规则。
            <br />
            2.
            区域维度：上方筛选器为“管辖视角”，您可以看到您所选区域内生效的所有规则（包含特定区域规则和通用规则）。
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]'>
            <div className='bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center'>
              <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                {editingRuleId ? <Edit3 size={18} /> : <Plus size={18} />}
                {editingRuleId ? '编辑策略规则' : '新建策略规则'}
                <span className='text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2'>
                  {activeTab === 'CATEGORY' ? '类目级' : 'SKU级'}
                </span>
              </h3>
              <Button
                type='text'
                icon={<X size={20} />}
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <div className='p-6 overflow-y-auto space-y-6'>
              <Input
                value={formData.targetName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetName: event.target.value
                  }))
                }
                placeholder={
                  activeTab === 'CATEGORY' ? '行业类目名称' : 'SKU商品名称'
                }
                addonBefore={<TagIcon size={14} />}
              />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Select
                  value={formData.platform}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, platform: value }))
                  }
                  options={[
                    { label: '全平台通用', value: 'ALL' },
                    ...Object.values(Platform).map((platform) => ({
                      label: platform,
                      value: platform
                    }))
                  ]}
                  placeholder='适用竞对平台'
                />
                <Select
                  value={formData.region}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, region: value }))
                  }
                  options={ALL_REGIONS.map((region) => ({
                    label: region,
                    value: region
                  }))}
                  placeholder='适用城市/区域'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  策略优先级
                </label>
                <Radio.Group
                  onChange={handlePriorityChange}
                  value={formData.priority}
                  className='w-full'>
                  <div className='grid grid-cols-3 gap-3'>
                    <Radio.Button value='High'>🔴 高</Radio.Button>
                    <Radio.Button value='Medium'>🟠 中</Radio.Button>
                    <Radio.Button value='Low'>🟢 低</Radio.Button>
                  </div>
                </Radio.Group>
              </div>
              <div className='bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5'>
                <h4 className='text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2'>
                  <AlertTriangle size={14} /> 阈值设定
                </h4>
                <div>
                  <div className='flex justify-between text-sm mb-2'>
                    <label className='font-semibold text-slate-700'>
                      最低毛利红线
                    </label>
                    <span className='font-bold text-blue-600'>
                      {formData.marginThreshold}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={50}
                    value={formData.marginThreshold}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        marginThreshold: value as number
                      }))
                    }
                  />
                </div>
                <div>
                  <div className='flex justify-between items-center text-sm mb-3'>
                    <label className='font-semibold text-slate-700'>
                      最大允许价差
                    </label>
                    <div className='flex bg-slate-200 rounded-lg p-0.5'>
                      <Button
                        size='small'
                        type={
                          formData.priceGapType === 'PERCENT'
                            ? 'primary'
                            : 'text'
                        }
                        icon={<Percent size={12} />}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            priceGapType: 'PERCENT'
                          }))
                        }>
                        百分比
                      </Button>
                      <Button
                        size='small'
                        type={
                          formData.priceGapType === 'ABSOLUTE'
                            ? 'primary'
                            : 'text'
                        }
                        icon={<DollarSign size={12} />}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            priceGapType: 'ABSOLUTE'
                          }))
                        }>
                        绝对值
                      </Button>
                    </div>
                  </div>
                  {formData.priceGapType === 'PERCENT' ? (
                    <Slider
                      min={0}
                      max={30}
                      value={formData.priceGapAlert}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          priceGapAlert: value as number
                        }))
                      }
                    />
                  ) : (
                    <Input
                      type='number'
                      prefix='¥'
                      value={formData.priceGapAlert}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          priceGapAlert: Number(event.target.value)
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            </div>
            <div className='p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3'>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button
                type='primary'
                icon={<Save size={18} />}
                onClick={handleSave}>
                {editingRuleId ? '保存修改' : '确认创建'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyConfigPage;
