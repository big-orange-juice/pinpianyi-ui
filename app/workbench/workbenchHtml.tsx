'use client';

import React, { useMemo, useState } from 'react';
import { App } from 'antd';

type TabKey = 'pending' | 'linked' | 'unlinked' | 'import';

type Priority = 'P1' | 'P2';

type ProductBrief = {
  name: string;
  skuId: string;
  spec: string;
  price: number;
};

type PendingMatch = {
  id: string;
  priority: Priority;
  similarityText: string;
  our: ProductBrief;
  candidate: ProductBrief;
  matchDesc: string;
};

type LinkedCard = {
  id: string;
  tag: 'normal' | 'important' | 'replacement';
  our: ProductBrief;
  comp: ProductBrief;
  meta: string;
};

type UnlinkedTask = {
  id: string;
  priority: 'high' | 'medium';
  text: string;
  hint: string;
};

const formatPrice = (value: number) => `¥${value.toFixed(2)}`;

const badgeText = {
  normal: '正常',
  important: '重点',
  replacement: '替代品'
} as const;

const WorkbenchHtml: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const demoAlert = (text: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(text);
      return;
    }

    message.info(text);
  };

  // --- Dashboard ---
  const stats = useMemo(
    () => [
      { label: '待确认商品', value: '56', tone: 'warning' as const },
      { label: '采购复核', value: '23', tone: 'info' as const },
      { label: '已关联商品', value: '1,234', tone: 'success' as const },
      { label: '未关联商品', value: '89', tone: 'default' as const }
    ],
    []
  );

  const pendingMatches = useMemo<PendingMatch[]>(
    () => [
      {
        id: 'PM001',
        priority: 'P1',
        similarityText: '匹配度 92%（候选 3 个，一对多）',
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
        matchDesc: '系统判定：同款概率较高，建议直接关联'
      },
      {
        id: 'PM002',
        priority: 'P2',
        similarityText: '匹配度 86%（候选 2 个，一对多）',
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
        matchDesc: '系统提示：规格存在差异，建议采购复核'
      }
    ],
    []
  );

  const linkedCards = useMemo<LinkedCard[]>(
    () => [
      {
        id: 'LK001',
        tag: 'important',
        our: {
          name: '抽纸 3层 120抽 x 24包',
          skuId: 'TOP-001',
          spec: '24包/箱',
          price: 49.9
        },
        comp: {
          name: '竞品A 抽纸 3层 120抽 x 24包',
          skuId: 'JD-8899001',
          spec: '24包/箱',
          price: 46.9
        },
        meta: '更新时间：2025-12-20 10:12 | 负责人：张三 | 站点：上海'
      },
      {
        id: 'LK002',
        tag: 'normal',
        our: {
          name: '洗洁精 1.2kg',
          skuId: 'TOP-010',
          spec: '1.2kg/瓶',
          price: 12.9
        },
        comp: {
          name: '竞品A 洗洁精 1.2kg',
          skuId: 'JD-8899010',
          spec: '1.2kg/瓶',
          price: 11.9
        },
        meta: '更新时间：2025-12-18 16:40 | 负责人：李四 | 站点：杭州'
      }
    ],
    []
  );

  const unlinkedTasks = useMemo<UnlinkedTask[]>(
    () => [
      {
        id: 'UL001',
        priority: 'high',
        text: '新品：牙膏 180g（TOP-101）需要确认是否关联竞品',
        hint: '触发原因：竞品侧出现高相似商品，但信息不足'
      },
      {
        id: 'UL002',
        priority: 'medium',
        text: '沐浴露 1L（TOP-102）暂无可用竞品链接，待补充',
        hint: '触发原因：竞品侧链接失效/下架'
      }
    ],
    []
  );

  const StatCard = (props: {
    label: string;
    value: string;
    tone: 'warning' | 'info' | 'success' | 'default';
  }) => {
    const valueToneClass =
      props.tone === 'warning'
        ? 'text-red-500'
        : props.tone === 'info'
        ? 'text-blue-600'
        : props.tone === 'success'
        ? 'text-emerald-600'
        : 'text-slate-800';

    return (
      <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-100'>
        <div className='text-slate-500 text-sm mb-2'>{props.label}</div>
        <div className={`text-3xl font-bold ${valueToneClass}`}>
          {props.value}
        </div>
      </div>
    );
  };

  const ContentSection = (props: {
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    return (
      <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-100 mb-6'>
        <div className='flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100'>
          <div className='text-lg font-semibold text-slate-800'>
            {props.title}
          </div>
          {props.right ? (
            <div className='flex items-center gap-3'>{props.right}</div>
          ) : null}
        </div>
        {props.children}
      </div>
    );
  };

  const HtmlButton = (props: {
    variant: 'primary' | 'default' | 'danger' | 'success';
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const base =
      'px-4 py-2 rounded border text-sm transition-colors select-none';
    const cls =
      props.variant === 'primary'
        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500'
        : props.variant === 'success'
        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
        : props.variant === 'danger'
        ? 'bg-red-500 text-white border-red-500 hover:bg-red-400'
        : 'bg-white text-slate-600 border-slate-300 hover:text-blue-600 hover:border-blue-600';

    return (
      <button
        type='button'
        className={`${base} ${cls}`}
        onClick={props.onClick}>
        {props.children}
      </button>
    );
  };

  const Toolbar = (props: { children: React.ReactNode }) => (
    <div className='flex gap-3 mb-5 flex-wrap'>{props.children}</div>
  );

  const SearchInput = (props: {
    placeholder: string;
    value?: string;
    onChange?: (v: string) => void;
  }) => (
    <input
      className='flex-1 min-w-[240px] px-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-600'
      placeholder={props.placeholder}
      value={props.value ?? ''}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  );

  const FilterSelect = (props: {
    options: string[];
    value?: string;
    onChange?: (v: string) => void;
  }) => (
    <select
      className='px-4 py-2 border border-slate-300 rounded text-sm bg-white'
      value={props.value ?? props.options[0]}
      onChange={(e) => props.onChange?.(e.target.value)}>
      {props.options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  const SummaryCards = () => {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            tone={s.tone}
          />
        ))}
      </div>
    );
  };

  const TabBar = () => {
    const items: Array<{ key: TabKey; label: string }> = [
      { key: 'pending', label: '待确认商品' },
      { key: 'linked', label: '已关联商品' },
      { key: 'unlinked', label: '未关联商品' },
      { key: 'import', label: '批量导入' }
    ];

    return (
      <div className='bg-white rounded-lg shadow-sm border border-slate-100 mb-6'>
        <div className='px-6 flex gap-8 overflow-x-auto hide-scrollbar'>
          {items.map((it) => {
            const active = it.key === activeTab;
            return (
              <button
                key={it.key}
                type='button'
                onClick={() => setActiveTab(it.key)}
                className={
                  'relative py-5 text-sm transition-colors whitespace-nowrap ' +
                  (active
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-blue-600')
                }>
                {it.label}
                {active ? (
                  <span className='absolute left-0 right-0 bottom-0 h-[2px] bg-blue-600' />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const Pending = () => {
    const [q, setQ] = useState('');
    const [priority, setPriority] = useState('优先级排序');

    const items = pendingMatches.filter((x) => {
      const qq = q.trim();
      if (!qq) return true;
      return (
        x.our.name.includes(qq) ||
        x.our.skuId.includes(qq) ||
        x.candidate.name.includes(qq) ||
        x.candidate.skuId.includes(qq)
      );
    });

    const ProductCard = (props: { label: string; p: ProductBrief }) => (
      <div className='bg-white p-5'>
        <div className='text-xs text-slate-400 mb-3'>{props.label}</div>
        <div className='w-[120px] h-[120px] bg-slate-100 rounded flex items-center justify-center text-slate-300 text-5xl mb-3'>
          📦
        </div>
        <div className='text-sm leading-7'>
          <div className='font-semibold text-slate-800 mb-2'>
            {props.p.name}
          </div>
          <div className='text-slate-600'>SKU：{props.p.skuId}</div>
          <div className='text-slate-600'>规格：{props.p.spec}</div>
          <div className='text-red-500 text-lg font-bold my-2'>
            {formatPrice(props.p.price)}
          </div>
        </div>
      </div>
    );

    return (
      <div className='max-w-[1400px] mx-auto p-6'>
        <SummaryCards />
        <TabBar />
        <Toolbar>
          <SearchInput placeholder='搜索商品...' value={q} onChange={setQ} />
          <FilterSelect
            options={[
              '优先级排序',
              '最高优先级',
              '高优先级',
              '中优先级',
              '低优先级'
            ]}
            value={priority}
            onChange={setPriority}
          />
          <HtmlButton variant='primary' onClick={() => setActiveTab('import')}>
            批量导入
          </HtmlButton>
        </Toolbar>

        <ContentSection
          title='待确认商品 (56) - 备注（配置一下算法匹配竞品相似度>配置值 列出来， 一对多的）'
          right={
            <>
              <HtmlButton
                variant='default'
                onClick={() => demoAlert('功能演示中...')}>
                批量确认
              </HtmlButton>
              <HtmlButton
                variant='default'
                onClick={() => demoAlert('功能演示中...')}>
                导出
              </HtmlButton>
            </>
          }>
          {items.map((item) => {
            const priorityBar =
              item.priority === 'P1'
                ? 'bg-red-50 text-red-500'
                : 'bg-orange-50 text-orange-600';

            const priorityText =
              item.priority === 'P1' ? '1级 - 最高优先级' : '2级 - 高优先级';

            return (
              <div
                key={item.id}
                className='border border-slate-200 rounded-lg overflow-hidden mb-4 hover:shadow-md transition-shadow'>
                <div className={`${priorityBar} px-4 py-2 text-xs font-medium`}>
                  {priorityText}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200'>
                  <ProductCard label='拼便宜商品' p={item.our} />
                  <ProductCard
                    label='候选竞品商品（Top1）'
                    p={item.candidate}
                  />
                </div>

                <div className='bg-emerald-50 border border-emerald-200 px-4 py-3 mx-5 my-4 rounded text-sm text-emerald-700'>
                  {item.matchDesc}；{item.similarityText}
                </div>

                <div className='px-5 py-4 bg-slate-50 flex gap-3 justify-center flex-wrap'>
                  <HtmlButton
                    variant='success'
                    onClick={() => {
                      demoAlert('✓ 已确认关联，商品已移入已关联商品管理');
                      setActiveTab('linked');
                    }}>
                    确认关联
                  </HtmlButton>
                  <HtmlButton
                    variant='default'
                    onClick={() => {
                      demoAlert('商品将继续保留在待确认状态');
                    }}>
                    需要采购复核
                  </HtmlButton>
                  <HtmlButton
                    variant='danger'
                    onClick={() => {
                      demoAlert('✗ 已确认未关联，商品已移入未关联商品管理');
                      setActiveTab('unlinked');
                    }}>
                    确认未关联
                  </HtmlButton>
                </div>
              </div>
            );
          })}
        </ContentSection>
      </div>
    );
  };

  const Linked = () => {
    const [q, setQ] = useState('');
    const [tag, setTag] = useState('标签');

    const filtered = linkedCards.filter((x) => {
      const qq = q.trim();
      if (!qq) return true;
      return (
        x.our.name.includes(qq) ||
        x.our.skuId.includes(qq) ||
        x.comp.name.includes(qq) ||
        x.comp.skuId.includes(qq)
      );
    });

    const Badge = (props: { kind: LinkedCard['tag'] }) => {
      const cls =
        props.kind === 'normal'
          ? 'bg-emerald-50 text-emerald-600'
          : props.kind === 'important'
          ? 'bg-orange-50 text-orange-600'
          : 'bg-sky-50 text-sky-600';
      return (
        <span className={`px-3 py-1 rounded-full text-xs ${cls}`}>
          {badgeText[props.kind]}
        </span>
      );
    };

    const ProductSide = (props: { label: string; p: ProductBrief }) => (
      <div>
        <div className='text-xs text-slate-400 mb-2'>{props.label}</div>
        <div className='w-[120px] h-[120px] bg-slate-100 rounded flex items-center justify-center text-slate-300 text-5xl mb-3'>
          📦
        </div>
        <div className='text-sm leading-7'>
          <div className='font-semibold text-slate-800 mb-2'>
            {props.p.name}
          </div>
          <div className='text-slate-600'>SKU：{props.p.skuId}</div>
          <div className='text-slate-600'>规格：{props.p.spec}</div>
          <div className='text-red-500 text-lg font-bold my-2'>
            {formatPrice(props.p.price)}
          </div>
        </div>
      </div>
    );

    return (
      <div className='max-w-[1400px] mx-auto p-6'>
        <SummaryCards />
        <TabBar />
        <Toolbar>
          <SearchInput placeholder='搜索商品...' value={q} onChange={setQ} />
          <FilterSelect
            options={['标签', '正常', '重点', '替代品']}
            value={tag}
            onChange={setTag}
          />
          <HtmlButton
            variant='default'
            onClick={() => demoAlert('功能演示中...')}>
            导出数据
          </HtmlButton>
        </Toolbar>

        <ContentSection
          title='已关联商品 (1,234)'
          right={
            <HtmlButton
              variant='default'
              onClick={() => demoAlert('功能演示中...')}>
              批量管理
            </HtmlButton>
          }>
          <div className='flex flex-col gap-4'>
            {filtered.map((card) => (
              <div
                key={card.id}
                className='border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between px-5 py-4 bg-slate-50'>
                  <div className='font-semibold text-slate-800'>
                    关联对：{card.id}
                  </div>
                  <div className='flex gap-2'>
                    <Badge kind={card.tag} />
                  </div>
                </div>

                <div className='p-5 grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <ProductSide label='拼便宜商品' p={card.our} />
                  <ProductSide label='竞品商品' p={card.comp} />
                </div>

                <div className='text-sm text-slate-600 px-5 py-3 bg-slate-50 border-t border-slate-200'>
                  {card.meta}
                </div>

                <div className='px-5 py-4 bg-white border-t border-slate-200 flex gap-3 justify-center flex-wrap'>
                  <HtmlButton
                    variant='default'
                    onClick={() => demoAlert('打开商品详情页面')}>
                    查看详情
                  </HtmlButton>
                  <HtmlButton
                    variant='danger'
                    onClick={() => demoAlert('已移除关联，记录已更新（演示）')}>
                    移除关联
                  </HtmlButton>
                </div>
              </div>
            ))}
          </div>
        </ContentSection>
      </div>
    );
  };

  const Unlinked = () => {
    const [q, setQ] = useState('');
    const [prio, setPrio] = useState('优先级');

    const filtered = unlinkedTasks.filter((t) => {
      const qq = q.trim();
      if (!qq) return true;
      return t.text.includes(qq);
    });

    return (
      <div className='max-w-[1400px] mx-auto p-6'>
        <SummaryCards />
        <TabBar />
        <Toolbar>
          <SearchInput placeholder='搜索商品...' value={q} onChange={setQ} />
          <FilterSelect
            options={['优先级', '高优先级', '中优先级', '低优先级']}
            value={prio}
            onChange={setPrio}
          />
          <HtmlButton
            variant='default'
            onClick={() => demoAlert('功能演示中...')}>
            新品触发记录
          </HtmlButton>
        </Toolbar>

        <ContentSection title='未关联商品 (89)'>
          <div className='flex flex-col gap-3'>
            {filtered.map((task) => (
              <div
                key={task.id}
                className='px-4 py-4 border border-slate-200 rounded-lg flex items-center justify-between gap-4 hover:border-blue-600 hover:bg-blue-50 transition-colors'>
                <div className='flex-1'>
                  <span
                    className={
                      'inline-block text-xs px-2 py-0.5 rounded mr-3 ' +
                      (task.priority === 'high'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-orange-50 text-orange-600')
                    }>
                    {task.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                  <span className='text-slate-800'>{task.text}</span>
                  <div className='text-xs text-slate-500 mt-2'>{task.hint}</div>
                </div>
                <HtmlButton
                  variant='primary'
                  onClick={() => {
                    demoAlert('即将跳转到待确认商品');
                    setActiveTab('pending');
                  }}>
                  去处理
                </HtmlButton>
              </div>
            ))}
          </div>
        </ContentSection>
      </div>
    );
  };

  const ImportPage = () => {
    const Step = (props: {
      index: number;
      title: string;
      active?: boolean;
      last?: boolean;
    }) => {
      return (
        <div className='flex-1 text-center relative'>
          {!props.last ? (
            <div className='absolute top-[15px] left-1/2 w-full h-[2px] bg-slate-200 -z-10' />
          ) : null}
          <div
            className={
              'w-8 h-8 rounded-full inline-flex items-center justify-center mb-2 font-semibold ' +
              (props.active
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-400')
            }>
            {props.index}
          </div>
          <div className='text-sm text-slate-600'>{props.title}</div>
        </div>
      );
    };

    return (
      <div className='max-w-[1400px] mx-auto p-6'>
        <SummaryCards />
        <TabBar />
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-100'>
          <div className='flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100'>
            <div className='text-lg font-semibold text-slate-800'>批量导入</div>
            <div className='flex gap-3'>
              <HtmlButton
                variant='default'
                onClick={() => demoAlert('功能演示中...')}>
                下载模板
              </HtmlButton>
              <HtmlButton
                variant='primary'
                onClick={() => demoAlert('功能演示中...')}>
                开始导入
              </HtmlButton>
            </div>
          </div>

          <div className='flex justify-between mb-8'>
            <Step index={1} title='下载模板' active />
            <Step index={2} title='上传文件' active />
            <Step index={3} title='预览校验' />
            <Step index={4} title='开始导入' last />
          </div>

          <div
            className='border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-colors mb-8'
            onClick={() => demoAlert('请选择要上传的 Excel 文件')}>
            <div className='text-5xl text-blue-600 mb-4'>📤</div>
            <div className='text-slate-800 font-semibold mb-2'>
              点击上传 Excel 文件
            </div>
            <div className='text-sm text-slate-500'>
              支持 .xlsx / .xls；演示版不做真实解析
            </div>
          </div>

          <div className='mb-8'>
            <div className='text-sm font-semibold text-slate-800 mb-3'>
              预览数据（示例）
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr>
                    <th className='p-3 border border-slate-200 bg-slate-50 text-left text-sm font-semibold'>
                      拼便宜SKU
                    </th>
                    <th className='p-3 border border-slate-200 bg-slate-50 text-left text-sm font-semibold'>
                      竞品SKU
                    </th>
                    <th className='p-3 border border-slate-200 bg-slate-50 text-left text-sm font-semibold'>
                      相似度
                    </th>
                    <th className='p-3 border border-slate-200 bg-slate-50 text-left text-sm font-semibold'>
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className='p-3 border border-slate-200 text-sm'>
                        TOP-{200 + idx}
                      </td>
                      <td className='p-3 border border-slate-200 text-sm'>
                        JD-{9000000 + idx}
                      </td>
                      <td className='p-3 border border-slate-200 text-sm'>
                        {(0.9 - idx * 0.05).toFixed(2)}
                      </td>
                      <td className='p-3 border border-slate-200 text-sm'>
                        待导入
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='text-center'>
            <HtmlButton
              variant='primary'
              onClick={() => demoAlert('功能演示中...')}>
              开始导入
            </HtmlButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='bg-slate-100 min-h-screen font-sans'>
      {activeTab === 'pending' ? <Pending /> : null}
      {activeTab === 'linked' ? <Linked /> : null}
      {activeTab === 'unlinked' ? <Unlinked /> : null}
      {activeTab === 'import' ? <ImportPage /> : null}
    </div>
  );
};

export default WorkbenchHtml;
