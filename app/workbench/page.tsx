'use client';

import WorkbenchHtml from '@/app/workbench/workbenchHtml';

export default WorkbenchHtml;

/*

import React, { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Input,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { InboxOutlined } from '@ant-design/icons';
import {
  ClipboardList,
  Link2,
  PackageOpen,
  ShoppingBag,
  Unlink
} from 'lucide-react';
import KpiCard from '@/components/KpiCard';

const { Title, Text } = Typography;

type Priority = 'P1' | 'P2' | 'P3' | 'P4';

type ProductBrief = {
  name: string;
  skuId: string;
  spec: string;
  price: number;
};

type PendingMatch = {
  id: string;
  priority: Priority;
  similarity: number;
  our: ProductBrief;
  candidate: ProductBrief;
  otherCandidatesCount: number;
};

type LinkedRecord = {
  id: string;
  tag: '正常' | '重点' | '替代品';
  ourSkuId: string;
  ourName: string;
  compSkuId: string;
  compName: string;
  updatedAt: string;
};

type UnlinkedRecord = {
  id: string;
  priority: '高' | '中' | '低';
  name: string;
  skuId: string;
  reason: string;
  createdAt: string;
};

const priorityMeta: Record<Priority, { label: string; tagColor: string }> = {
  P1: { label: '1级 - 最高优先级', tagColor: 'red' },
  P2: { label: '2级 - 高优先级', tagColor: 'orange' },
  P3: { label: '3级 - 中优先级', tagColor: 'gold' },
  P4: { label: '4级 - 低优先级', tagColor: 'default' }
};

const formatPrice = (value: number) => `¥${value.toFixed(2)}`;

const WorkbenchPage: React.FC = () => {
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState<
    'pending' | 'linked' | 'unlinked' | 'import'
  >('pending');

  // ---- 工作台 KPI（仅四张卡） ----
  const kpis = useMemo(
    () => [
      {
        title: '待确认商品',
        value: 56,
        icon: <ClipboardList size={18} />,
        color: 'orange' as const
      },
      {
        title: '采购复核',
        value: 23,
        icon: <ShoppingBag size={18} />,
        color: 'blue' as const
      },
      {
        title: '已关联商品',
        value: '1,234',
        icon: <Link2 size={18} />,
        color: 'green' as const
      },
      {
        title: '未关联商品',
        value: 89,
        icon: <Unlink size={18} />,
        color: 'red' as const
      }
    ],
    []
  );

  // ---- 待确认商品（demo 数据，结构对齐 HTML 的“一对多候选”含义） ----
  const [pendingQuery, setPendingQuery] = useState('');
  const [pendingPriorityFilter, setPendingPriorityFilter] = useState<
    'ALL' | Priority
  >('ALL');

  const pendingMatches = useMemo<PendingMatch[]>(
    () => [
      {
        id: 'PM001',
        priority: 'P1',
        similarity: 0.92,
        our: {
          name: '拼便宜自营·抽纸 3层 120抽 x 24包',
          skuId: 'TOP-001',
          spec: '24包/箱',
          price: 49.9
        },
        candidate: {
          name: '竞品A·抽纸 3层 120抽 x 24包',
          skuId: 'JD-8899001',
          spec: '24包/箱',
          price: 46.9
        },
        otherCandidatesCount: 2
      },
      {
        id: 'PM002',
        priority: 'P2',
        similarity: 0.86,
        our: {
          name: '拼便宜自营·洗衣液 3kg',
          skuId: 'TOP-002',
          spec: '3kg/桶',
          price: 39.9
        },
        candidate: {
          name: '竞品B·洗衣液 3.2kg',
          skuId: 'YJP-2288002',
          spec: '3.2kg/桶',
          price: 37.9
        },
        otherCandidatesCount: 1
      }
    ],
    []
  );

  const filteredPendingMatches = useMemo(() => {
    const q = pendingQuery.trim();
    return pendingMatches.filter((item) => {
      const hitQuery =
        q.length === 0 ||
        item.our.name.includes(q) ||
        item.our.skuId.includes(q) ||
        item.candidate.name.includes(q) ||
        item.candidate.skuId.includes(q);

      const hitPriority =
        pendingPriorityFilter === 'ALL' ||
        item.priority === pendingPriorityFilter;

      return hitQuery && hitPriority;
    });
  }, [pendingMatches, pendingQuery, pendingPriorityFilter]);

  // ---- 已关联商品 ----
  const [linkedQuery, setLinkedQuery] = useState('');
  const [linkedTagFilter, setLinkedTagFilter] = useState<
    'ALL' | LinkedRecord['tag']
  >('ALL');

  const linkedRecords = useMemo<LinkedRecord[]>(
    () => [
      {
        id: 'LK001',
        tag: '重点',
        ourSkuId: 'TOP-001',
        ourName: '抽纸 3层 120抽 x 24包',
        compSkuId: 'JD-8899001',
        compName: '竞品A 抽纸 3层 120抽 x 24包',
        updatedAt: '2025-12-20 10:12'
      },
      {
        id: 'LK002',
        tag: '正常',
        ourSkuId: 'TOP-010',
        ourName: '洗洁精 1.2kg',
        compSkuId: 'JD-8899010',
        compName: '竞品A 洗洁精 1.2kg',
        updatedAt: '2025-12-18 16:40'
      },
      {
        id: 'LK003',
        tag: '替代品',
        ourSkuId: 'TOP-022',
        ourName: '垃圾袋 45*55 100只',
        compSkuId: 'XSJ-1199022',
        compName: '竞品C 垃圾袋 45*55 90只',
        updatedAt: '2025-12-17 09:05'
      }
    ],
    []
  );

  const filteredLinkedRecords = useMemo(() => {
    const q = linkedQuery.trim();
    return linkedRecords.filter((row) => {
      const hitQuery =
        q.length === 0 ||
        row.ourSkuId.includes(q) ||
        row.ourName.includes(q) ||
        row.compSkuId.includes(q) ||
        row.compName.includes(q);

      const hitTag = linkedTagFilter === 'ALL' || row.tag === linkedTagFilter;
      return hitQuery && hitTag;
    });
  }, [linkedRecords, linkedQuery, linkedTagFilter]);

  const linkedColumns = useMemo<ColumnsType<LinkedRecord>>(
    () => [
      {
        title: '标签',
        dataIndex: 'tag',
        width: 96,
        render: (tag: LinkedRecord['tag']) => {
          const color =
            tag === '重点' ? 'orange' : tag === '替代品' ? 'blue' : 'green';
          return <Tag color={color}>{tag}</Tag>;
        }
      },
      {
        title: '拼便宜商品',
        key: 'our',
        render: (_, row) => (
          <div>
            <div className='font-medium text-slate-800'>{row.ourName}</div>
            <div className='text-xs text-slate-500'>{row.ourSkuId}</div>
          </div>
        )
      },
      {
        title: '竞品商品',
        key: 'comp',
        render: (_, row) => (
          <div>
            <div className='font-medium text-slate-800'>{row.compName}</div>
            <div className='text-xs text-slate-500'>{row.compSkuId}</div>
          </div>
        )
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 160
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_, row) => (
          <Button
            danger
            type='link'
            onClick={() => message.info(`演示：已移除关联（${row.id}）`)}>
            移除关联
          </Button>
        )
      }
    ],
    [message]
  );

  // ---- 未关联商品 ----
  const [unlinkedQuery, setUnlinkedQuery] = useState('');
  const [unlinkedPriorityFilter, setUnlinkedPriorityFilter] = useState<
    'ALL' | UnlinkedRecord['priority']
  >('ALL');

  const unlinkedRecords = useMemo<UnlinkedRecord[]>(
    () => [
      {
        id: 'UL001',
        priority: '高',
        name: '牙膏 180g',
        skuId: 'TOP-101',
        reason: '规格差异较大，候选匹配度不足',
        createdAt: '2025-12-21'
      },
      {
        id: 'UL002',
        priority: '中',
        name: '沐浴露 1L',
        skuId: 'TOP-102',
        reason: '同名不同款，无法确认同款关系',
        createdAt: '2025-12-19'
      },
      {
        id: 'UL003',
        priority: '低',
        name: '一次性手套 100只',
        skuId: 'TOP-103',
        reason: '竞品侧暂无有效商品链接',
        createdAt: '2025-12-16'
      }
    ],
    []
  );

  const filteredUnlinkedRecords = useMemo(() => {
    const q = unlinkedQuery.trim();
    return unlinkedRecords.filter((row) => {
      const hitQuery =
        q.length === 0 || row.name.includes(q) || row.skuId.includes(q);
      const hitPriority =
        unlinkedPriorityFilter === 'ALL' ||
        row.priority === unlinkedPriorityFilter;
      return hitQuery && hitPriority;
    });
  }, [unlinkedRecords, unlinkedQuery, unlinkedPriorityFilter]);

  // ---- 批量导入（演示版） ----
  const [importStep, setImportStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const importPreviewRows = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => ({
        key: idx + 1,
        ourSkuId: `TOP-${200 + idx}`,
        compSkuId: `JD-${9000000 + idx}`,
        similarity: `${(0.9 - idx * 0.05).toFixed(2)}`,
        action: '待导入'
      })),
    []
  );

  const importPreviewColumns = useMemo<
    ColumnsType<(typeof importPreviewRows)[number]>
  >(
    () => [
      { title: '拼便宜SKU', dataIndex: 'ourSkuId' },
      { title: '竞品SKU', dataIndex: 'compSkuId' },
      { title: '相似度', dataIndex: 'similarity', width: 120 },
      {
        title: '状态',
        dataIndex: 'action',
        width: 120,
        render: () => <Tag color='blue'>待导入</Tag>
      }
    ],
    []
  );

  const uploadProps: UploadProps = {
    multiple: false,
    fileList,
    beforeUpload: () => false,
    onChange: (info) => {
      setFileList(info.fileList.slice(-1));
      if (info.fileList.length > 0) {
        setImportStep(2);
      }
    }
  };

  const renderProductSide = (label: string, p: ProductBrief) => {
    return (
      <div>
        <Text className='text-xs text-slate-400'>{label}</Text>
        <div className='mt-2'>
          <div className='font-semibold text-slate-800'>{p.name}</div>
          <div className='text-sm text-slate-600 mt-1'>
            SKU：{p.skuId}
            <span className='mx-2 text-slate-300'>|</span>
            规格：{p.spec}
          </div>
          <div className='text-base font-bold text-red-500 mt-2'>
            {formatPrice(p.price)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='max-w-[1400px] mx-auto p-6'>
      <div className='flex items-start justify-between gap-4 mb-6'>
        <div>
          <Title level={3} className='!m-0'>
            我的工作台
          </Title>
          <Text className='text-slate-500'>
            将演示页面中的核心流程统一集成在一个菜单里
          </Text>
        </div>
      </div>

      <div className='mb-6'>
        <Row gutter={[16, 16]}>
          {kpis.map((kpi) => (
            <Col key={kpi.title} xs={24} sm={12} lg={6}>
              <KpiCard
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
              />
            </Col>
          ))}
        </Row>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-slate-100 p-4'>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          items={[
            {
              key: 'pending',
              label: '待确认商品',
              children: (
                <div>
                  <div className='flex flex-wrap gap-3 mb-4'>
                    <Input
                      value={pendingQuery}
                      onChange={(e) => setPendingQuery(e.target.value)}
                      placeholder='搜索商品/SKU...'
                      className='max-w-[420px]'
                      allowClear
                    />
                    <Select
                      value={pendingPriorityFilter}
                      onChange={setPendingPriorityFilter}
                      style={{ width: 180 }}
                      options={[
                        { label: '优先级排序（全部）', value: 'ALL' },
                        { label: '1级 - 最高优先级', value: 'P1' },
                        { label: '2级 - 高优先级', value: 'P2' },
                        { label: '3级 - 中优先级', value: 'P3' },
                        { label: '4级 - 低优先级', value: 'P4' }
                      ]}
                    />
                    <Button
                      type='primary'
                      onClick={() => {
                        setActiveTab('import');
                        message.info('已切换到批量导入');
                      }}>
                      批量导入
                    </Button>
                  </div>

                  <div className='space-y-4'>
                    {filteredPendingMatches.map((item) => (
                      <Card
                        key={item.id}
                        className='border-slate-100'
                        styles={{ body: { padding: 16 } }}>
                        <div className='flex items-center justify-between gap-3 mb-3'>
                          <div className='flex items-center gap-2'>
                            <Tag color={priorityMeta[item.priority].tagColor}>
                              {priorityMeta[item.priority].label}
                            </Tag>
                            <Text className='text-slate-500'>
                              匹配度 {(item.similarity * 100).toFixed(0)}%（另有{' '}
                              {item.otherCandidatesCount} 个候选）
                            </Text>
                          </div>
                          <Tag color='blue'>一对多候选（演示）</Tag>
                        </div>

                        <Row
                          gutter={[16, 16]}
                          className='bg-slate-50 rounded-xl p-4'>
                          <Col xs={24} lg={12}>
                            {renderProductSide('拼便宜商品', item.our)}
                          </Col>
                          <Col xs={24} lg={12}>
                            {renderProductSide(
                              '候选竞品商品（Top1）',
                              item.candidate
                            )}
                          </Col>
                        </Row>

                        <Divider className='!my-4' />

                        <Space wrap>
                          <Button
                            type='primary'
                            onClick={() =>
                              message.success(`演示：已确认关联（${item.id}）`)
                            }>
                            确认关联
                          </Button>
                          <Button
                            onClick={() =>
                              message.info(
                                `演示：标记需要采购复核（${item.id}）`
                              )
                            }>
                            需要采购复核
                          </Button>
                          <Button
                            danger
                            onClick={() =>
                              message.warning(
                                `演示：已确认未关联（${item.id}）`
                              )
                            }>
                            确认未关联
                          </Button>
                        </Space>
                      </Card>
                    ))}

                    {filteredPendingMatches.length === 0 ? (
                      <div className='text-slate-500 text-sm p-6 text-center'>
                        暂无匹配结果
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            },
            {
              key: 'linked',
              label: '已关联商品',
              children: (
                <div>
                  <div className='flex flex-wrap gap-3 mb-4'>
                    <Input
                      value={linkedQuery}
                      onChange={(e) => setLinkedQuery(e.target.value)}
                      placeholder='搜索商品/SKU...'
                      className='max-w-[420px]'
                      allowClear
                    />
                    <Select
                      value={linkedTagFilter}
                      onChange={setLinkedTagFilter}
                      style={{ width: 160 }}
                      options={[
                        { label: '标签（全部）', value: 'ALL' },
                        { label: '正常', value: '正常' },
                        { label: '重点', value: '重点' },
                        { label: '替代品', value: '替代品' }
                      ]}
                    />
                    <Button onClick={() => message.info('演示：导出数据')}>
                      导出数据
                    </Button>
                  </div>

                  <Table
                    rowKey='id'
                    columns={linkedColumns}
                    dataSource={filteredLinkedRecords}
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              )
            },
            {
              key: 'unlinked',
              label: '未关联商品',
              children: (
                <div>
                  <div className='flex flex-wrap gap-3 mb-4'>
                    <Input
                      value={unlinkedQuery}
                      onChange={(e) => setUnlinkedQuery(e.target.value)}
                      placeholder='搜索商品/SKU...'
                      className='max-w-[420px]'
                      allowClear
                    />
                    <Select
                      value={unlinkedPriorityFilter}
                      onChange={setUnlinkedPriorityFilter}
                      style={{ width: 160 }}
                      options={[
                        { label: '优先级（全部）', value: 'ALL' },
                        { label: '高', value: '高' },
                        { label: '中', value: '中' },
                        { label: '低', value: '低' }
                      ]}
                    />
                    <Button onClick={() => message.info('演示：新品触发记录')}>
                      新品触发记录
                    </Button>
                  </div>

                  <div className='space-y-3'>
                    {filteredUnlinkedRecords.map((row) => (
                      <Card
                        key={row.id}
                        className='border-slate-100'
                        styles={{ body: { padding: 16 } }}>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <div>
                            <div className='flex items-center gap-2'>
                              <Tag
                                color={
                                  row.priority === '高'
                                    ? 'red'
                                    : row.priority === '中'
                                    ? 'orange'
                                    : 'default'
                                }>
                                {row.priority}优先级
                              </Tag>
                              <span className='font-semibold text-slate-800'>
                                {row.name}
                              </span>
                              <Text className='text-slate-500 text-sm'>
                                {row.skuId}
                              </Text>
                            </div>
                            <div className='text-sm text-slate-600 mt-2'>
                              未关联原因：{row.reason}
                            </div>
                            <div className='text-xs text-slate-400 mt-1'>
                              记录时间：{row.createdAt}
                            </div>
                          </div>

                          <Space wrap>
                            <Button
                              type='primary'
                              onClick={() =>
                                message.info(`演示：进入重新匹配（${row.id}）`)
                              }>
                              重新匹配
                            </Button>
                            <Button
                              onClick={() =>
                                message.success(`演示：已归档（${row.id}）`)
                              }>
                              归档
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}

                    {filteredUnlinkedRecords.length === 0 ? (
                      <div className='text-slate-500 text-sm p-6 text-center'>
                        暂无未关联商品
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            },
            {
              key: 'import',
              label: '批量导入',
              children: (
                <div>
                  <Steps
                    current={importStep}
                    items={[
                      { title: '下载模板' },
                      { title: '上传文件' },
                      { title: '预览校验' },
                      { title: '开始导入' }
                    ]}
                  />

                  <Divider />

                  <Space direction='vertical' size={12} className='w-full'>
                    <Card
                      className='border-slate-100'
                      styles={{ body: { padding: 16 } }}>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <div className='flex items-center gap-2'>
                            <PackageOpen size={18} className='text-blue-600' />
                            <Text className='font-semibold text-slate-800'>
                              1）下载导入模板
                            </Text>
                          </div>
                          <Text className='text-slate-500'>
                            Excel 模板字段：拼便宜SKU、竞品SKU、相似度（可选）等
                          </Text>
                        </div>
                        <Button
                          type='primary'
                          onClick={() => {
                            setImportStep(1);
                            message.info('演示：已下载模板');
                          }}>
                          下载模板
                        </Button>
                      </div>
                    </Card>

                    <Card
                      className='border-slate-100'
                      styles={{ body: { padding: 16 } }}>
                      <div className='flex items-center gap-2 mb-2'>
                        <InboxOutlined className='text-blue-600' />
                        <Text className='font-semibold text-slate-800'>
                          2）上传 Excel 文件
                        </Text>
                      </div>
                      <Upload.Dragger {...uploadProps} className='bg-slate-50'>
                        <p className='ant-upload-drag-icon'>
                          <InboxOutlined />
                        </p>
                        <p className='ant-upload-text'>
                          点击或拖拽文件到此处上传
                        </p>
                        <p className='ant-upload-hint'>
                          演示版：不做真实解析，仅展示流程与交互
                        </p>
                      </Upload.Dragger>
                    </Card>

                    <Card
                      className='border-slate-100'
                      styles={{ body: { padding: 16 } }}>
                      <div className='flex items-start justify-between gap-4 mb-3'>
                        <div>
                          <div className='flex items-center gap-2'>
                            <ClipboardList
                              size={18}
                              className='text-blue-600'
                            />
                            <Text className='font-semibold text-slate-800'>
                              3）预览校验
                            </Text>
                          </div>
                          <Text className='text-slate-500'>
                            校验 SKU 是否存在、重复关联、相似度阈值等
                          </Text>
                        </div>
                        <Button
                          onClick={() => {
                            if (fileList.length === 0) {
                              message.warning('请先上传文件');
                              return;
                            }
                            setImportStep(3);
                            message.success('演示：预览校验通过');
                          }}>
                          预览校验
                        </Button>
                      </div>

                      <Table
                        size='middle'
                        rowKey='key'
                        columns={importPreviewColumns}
                        dataSource={importPreviewRows}
                        pagination={false}
                      />
                    </Card>

                    <Card
                      className='border-slate-100'
                      styles={{ body: { padding: 16 } }}>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <div className='flex items-center gap-2'>
                            <Link2 size={18} className='text-blue-600' />
                            <Text className='font-semibold text-slate-800'>
                              4）开始导入
                            </Text>
                          </div>
                          <Text className='text-slate-500'>
                            导入后将生成/更新关联关系，并进入待确认或已关联列表
                          </Text>
                        </div>
                        <Button
                          type='primary'
                          onClick={() => {
                            if (fileList.length === 0) {
                              message.warning('请先上传文件');
                              return;
                            }
                            message.success('演示：导入已开始');
                          }}>
                          开始导入
                        </Button>
                      </div>

                      <Divider className='!my-4' />
                      <Text className='text-xs text-slate-400'>
                        说明：本页面是把 HTML 演示流程“集成进现有
                        UI”的骨架版本， 后续可接入真实接口与文件解析。
                      </Text>
                    </Card>
                  </Space>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default WorkbenchPage;

*/
