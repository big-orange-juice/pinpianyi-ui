'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Target,
  TrendingDown,
  UserCircle,
  MapPin,
  DollarSign,
  Star
} from 'lucide-react';
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import KpiCard from '@/components/KpiCard';
import PriceChart from '@/components/PriceChart';
import {
  createAlertColumns,
  type AlertCategory,
  type AlertTableRecord
} from '@/components/dashboard/alertTableColumns';
import { MOCK_COMPETITORS, MOCK_PRODUCTS, getHistoryData } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { Platform, ProductTag } from '@/types';
import {
  PRODUCT_TAG_OPTIONS,
  buildSelectOptions,
  mapProductTags
} from '@/utils/uiOptions';

type KpiFilterType = 'ALL' | 'LOSING' | 'INVERSION' | 'EST_LOSS' | 'ADVANTAGE';

interface AlertItem {
  id: string;
  skuId: string;
  product: string;
  spec: string;
  ourPrice: number;
  jdPrice?: number;
  yjpPrice?: number;
  xsjPrice?: number;
  minCompPrice: number;
  gap: number;
  profit: number;
  estMarginAfterMatch: number;
  category: string;
  type: AlertCategory;
  tags: ProductTag[];
  isSpecial: boolean;
  sortVal: number;
}

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  const [activeKpiFilter, setActiveKpiFilter] =
    useState<KpiFilterType>('LOSING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'ALL_TOP' | 'SPECIAL'>(
    'ALL_TOP'
  );
  const [displayProduct, setDisplayProduct] = useState<{
    data: any[];
    name: string;
  }>(getHistoryData('TOP001'));

  const {
    costThreshold,
    currentUser,
    selectedTag,
    setSelectedTag,
    selectedPlatform,
    setSelectedPlatform,
    availablePlatforms,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedRegion,
    setSelectedRegion,
    monitoredProductIds,
    specialAttentionIds,
    toggleSpecialAttention
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
    const r = new Set<string>();
    Object.values(MOCK_COMPETITORS).forEach((arr) =>
      arr.forEach((c) => r.add(c.region))
    );
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
    setActiveKpiFilter((prev) => (prev === type ? 'ALL' : type));
    setSelectedAlertId(null);
  };

  const regionFilteredCompetitors = useMemo(() => {
    const filteredComps: Record<string, any[]> = {};
    Object.keys(MOCK_COMPETITORS).forEach((skuId) => {
      filteredComps[skuId] = MOCK_COMPETITORS[skuId].filter(
        (c) =>
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

    MOCK_PRODUCTS.forEach((p) => {
      if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id))
        return;
      if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id))
        return;
      if (
        selectedTag !== 'ALL' &&
        (!p.tags || !p.tags.includes(selectedTag as ProductTag))
      )
        return;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

      const comps = regionFilteredCompetitors[p.id] || [];
      if (comps.length === 0) return;

      if (p.ourPrice < p.ourCost) {
        inversionCount++;
      }

      const minCompPrice = Math.min(...comps.map((c) => c.activityPrice));

      if (p.ourPrice > minCompPrice) {
        priceDisadvantageCount++;
        const gap = p.ourPrice - minCompPrice;
        totalEstDailyLoss += gap * (p.last7DaysSales / 7);
      }

      if (p.ourPrice < minCompPrice) {
        priceAdvantageCount++;
      }
    });

    return {
      inversionCount,
      priceDisadvantageCount,
      priceAdvantageCount,
      totalEstDailyLoss
    };
  }, [
    regionFilteredCompetitors,
    selectedTag,
    selectedCategory,
    selectedBrand,
    monitoredProductIds,
    activeViewMode,
    specialAttentionIds
  ]);

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    MOCK_PRODUCTS.forEach((p) => {
      if (monitoredProductIds.length > 0 && !monitoredProductIds.includes(p.id))
        return;
      if (activeViewMode === 'SPECIAL' && !specialAttentionIds.includes(p.id))
        return;
      if (
        selectedTag !== 'ALL' &&
        (!p.tags || !p.tags.includes(selectedTag as ProductTag))
      )
        return;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return;

      const comps = regionFilteredCompetitors[p.id] || [];
      if (comps.length === 0) return;

      const minCompPrice = Math.min(...comps.map((c) => c.activityPrice));
      const jdComp = comps.find((c) => c.platform.includes('京东'));
      const yjpComp = comps.find((c) => c.platform.includes('易久批'));
      const xsjComp = comps.find((c) => c.platform.includes('鲜世纪'));

      const gap = p.ourPrice - minCompPrice;
      const profit = p.ourPrice - p.ourCost;
      const isInternalInversion = p.ourPrice < p.ourCost;
      const isLosing = p.ourPrice > minCompPrice;
      const isWinning = p.ourPrice < minCompPrice;
      const isSpecial = specialAttentionIds.includes(p.id);

      const baseData: AlertItem = {
        id: p.id,
        skuId: p.id,
        product: p.name,
        spec: p.spec,
        ourPrice: p.ourPrice,
        jdPrice: jdComp?.activityPrice,
        yjpPrice: yjpComp?.activityPrice,
        xsjPrice: xsjComp?.activityPrice,
        minCompPrice,
        gap,
        profit,
        estMarginAfterMatch: isLosing ? minCompPrice - p.ourCost : profit,
        tags: mapProductTags(p.tags),
        isSpecial,
        type: 'LOSING',
        category: '价格劣势',
        sortVal: gap
      };

      if (isInternalInversion) {
        list.push({
          ...baseData,
          type: 'INVERSION',
          category: '成本倒挂',
          sortVal: profit
        });
      }
      if (isLosing) {
        list.push({
          ...baseData,
          type: 'LOSING',
          category: '价格劣势',
          sortVal: gap
        });
      }
      if (isWinning) {
        list.push({
          ...baseData,
          type: 'ADVANTAGE',
          category: '价格优势',
          sortVal: gap
        });
      }
    });

    let filtered = list;
    if (activeKpiFilter === 'LOSING')
      filtered = list.filter((i) => i.type === 'LOSING');
    else if (activeKpiFilter === 'INVERSION')
      filtered = list.filter((i) => i.type === 'INVERSION');
    else if (activeKpiFilter === 'ADVANTAGE')
      filtered = list.filter((i) => i.type === 'ADVANTAGE');
    else if (activeKpiFilter === 'EST_LOSS')
      filtered = list.filter((i) => i.type === 'LOSING');

    if (activeKpiFilter === 'INVERSION') {
      return filtered.sort((a, b) => a.profit - b.profit);
    }
    return filtered.sort((a, b) => b.sortVal - a.sortVal);
  }, [
    regionFilteredCompetitors,
    selectedTag,
    selectedCategory,
    selectedBrand,
    monitoredProductIds,
    activeViewMode,
    specialAttentionIds,
    activeKpiFilter
  ]);

  const alertTableData = useMemo<AlertTableRecord[]>(
    () => alerts.map((alert, idx) => ({ ...alert, key: `${alert.id}-${idx}` })),
    [alerts]
  );

  const columns = useMemo(
    () => createAlertColumns(toggleSpecialAttention),
    [toggleSpecialAttention]
  );

  const tableTitleMap: Record<KpiFilterType, string> = {
    ALL: '全部预警',
    LOSING: '价格劣势列表',
    INVERSION: '成本倒挂列表',
    ADVANTAGE: '价格优势列表',
    EST_LOSS: '损失排行'
  };

  const segmentedOptions = [
    { label: '全部商品', value: 'ALL_TOP' },
    {
      label: (
        <Space size={4}>
          <Star size={12} /> 关注
        </Space>
      ),
      value: 'SPECIAL'
    }
  ];

  return (
    <div className='p-8 animate-fade-in space-y-8'>
      <div className='flex flex-wrap gap-4 justify-between'>
        <div>
          <Title level={2} className='!m-0 text-slate-800'>
            运营仪表盘
          </Title>
          <Space size='small' className='text-slate-500 mt-1'>
            <UserCircle size={16} />
            <span>
              {currentUser.name} · {currentUser.role}
            </span>
          </Space>
        </div>
        <Space size='middle' wrap className='justify-end'>
          <Tag
            color='blue'
            className='px-3 py-2 text-sm flex items-center gap-2'
            bordered={false}>
            <MapPin size={14} /> {selectedRegion} 大区
          </Tag>
          <Input.Search
            allowClear
            placeholder='输入SKU或名称查看历史曲线'
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onSearch={() => handleHistoryQuery()}
            className='w-64'
          />
          <Link href='/analysis' className='inline-block'>
            <Button type='primary' size='large'>
              深度分析
            </Button>
          </Link>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <Select
              size='large'
              value={selectedRegion}
              onChange={(val) => setSelectedRegion(val)}
              options={buildSelectOptions(regions, '全部区域')}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              size='large'
              value={selectedPlatform}
              onChange={(val) => setSelectedPlatform(val as Platform | 'ALL')}
              options={buildSelectOptions(availablePlatforms, '全部平台')}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              size='large'
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={buildSelectOptions(categories, '全部品类')}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              size='large'
              value={selectedBrand}
              onChange={(val) => setSelectedBrand(val)}
              options={buildSelectOptions(brands, '全部品牌')}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              size='large'
              value={selectedTag}
              onChange={(val) => setSelectedTag(val as ProductTag | 'ALL')}
              options={PRODUCT_TAG_OPTIONS}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Segmented
              size='large'
              block
              value={activeViewMode}
              options={segmentedOptions}
              onChange={(val) =>
                setActiveViewMode(val as 'ALL_TOP' | 'SPECIAL')
              }
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title='价格劣势商品'
            value={kpis.priceDisadvantageCount}
            icon={<TrendingDown size={24} />}
            color='red'
            onClick={() => handleKpiClick('LOSING')}
            isActive={activeKpiFilter === 'LOSING'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title='成本倒挂预警'
            value={kpis.inversionCount}
            icon={<AlertTriangle size={24} />}
            color='orange'
            onClick={() => handleKpiClick('INVERSION')}
            isActive={activeKpiFilter === 'INVERSION'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title='价格优势商品'
            value={kpis.priceAdvantageCount}
            icon={<Target size={24} />}
            color='green'
            onClick={() => handleKpiClick('ADVANTAGE')}
            isActive={activeKpiFilter === 'ADVANTAGE'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title='预估日损失'
            value={`¥${kpis.totalEstDailyLoss.toFixed(0)}`}
            icon={<DollarSign size={24} />}
            color='blue'
            onClick={() => handleKpiClick('EST_LOSS')}
            isActive={activeKpiFilter === 'EST_LOSS'}
          />
        </Col>
      </Row>

      <PriceChart
        data={displayProduct.data}
        title='价格走势分析'
        productName={displayProduct.name}
      />

      <Card
        title={tableTitleMap[activeKpiFilter]}
        extra={<Text type='secondary'>共 {alerts.length} 条记录</Text>}>
        <Table
          columns={columns}
          dataSource={alertTableData}
          pagination={false}
          scroll={{ x: 1100 }}
          rowClassName={(record) =>
            record.key === selectedAlertId
              ? 'alert-row-selected cursor-pointer'
              : 'cursor-pointer'
          }
          onRow={(record) => ({
            onClick: () => handleSelectProduct(record.skuId, record.key)
          })}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
