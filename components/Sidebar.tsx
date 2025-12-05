'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Database,
  Settings,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';
import { Button, Form, InputNumber, Menu, Modal, Typography } from 'antd';
import { useAppStore } from '@/store/useAppStore';

const { Title, Text, Paragraph } = Typography;

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { costThreshold, setCostThreshold } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(costThreshold);

  const navItems = [
    { path: '/', label: '仪表盘', icon: <LayoutDashboard size={18} /> },
    {
      path: '/analysis',
      label: '价盘分析矩阵',
      icon: <TrendingUp size={18} />
    },
    {
      path: '/config',
      label: '竞对策略配置',
      icon: <SlidersHorizontal size={18} />
    },
    { path: '/data', label: '数据采集配置', icon: <Database size={18} /> }
  ];

  const handleOpenSettings = () => {
    setTempThreshold(costThreshold);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setCostThreshold(Number(tempThreshold));
    setIsSettingsOpen(false);
  };

  const menuItems = navItems.map((item) => ({
    key: item.path,
    icon: item.icon,
    label: (
      <Link href={item.path} className='block text-inherit no-underline'>
        {item.label}
      </Link>
    )
  }));

  return (
    <>
      <aside className='w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-10 shadow-xl'>
        <div className='p-6 border-b border-slate-800'>
          <Title level={4} className='!text-white !m-0 leading-tight'>
            <span className='bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent'>
              拼便宜
            </span>
            <br />
            商品运营Agent
          </Title>
          <Text className='text-xs text-slate-400 mt-2 block'>
            智能商品运营与竞价系统
          </Text>
        </div>

        <div className='flex-1 overflow-y-auto px-2 py-4'>
          <Menu
            className='bg-transparent border-0 sidebar-menu'
            items={menuItems}
            mode='inline'
            selectedKeys={[pathname]}
            inlineIndent={16}
            theme='dark'
          />
        </div>

        <div className='p-4 border-t border-slate-800'>
          <Button
            block
            type='text'
            icon={<Settings size={18} />}
            className='!text-slate-300 hover:!text-white hover:!bg-slate-800'
            onClick={handleOpenSettings}>
            系统设置
          </Button>
        </div>
      </aside>

      <Modal
        title='系统全局参数配置'
        open={isSettingsOpen}
        okText='保存设置'
        cancelText='取消'
        centered
        onOk={handleSaveSettings}
        onCancel={() => setIsSettingsOpen(false)}
        destroyOnClose>
        <Form layout='vertical' size='large'>
          <Form.Item
            label={
              <span className='flex items-center gap-2 font-semibold text-slate-700'>
                <AlertTriangle size={16} className='text-orange-500' />{' '}
                成本倒挂预警阈值 (%)
              </span>
            }>
            <InputNumber
              min={0}
              max={20}
              value={tempThreshold}
              onChange={(value) => setTempThreshold(value ?? 0)}
              addonAfter='%'
              className='w-full'
            />
          </Form.Item>
          <Paragraph className='text-xs text-slate-500 mb-0'>
            当竞对价格低于
            <span className='font-mono bg-slate-100 px-1 rounded mx-1'>
              我方成本 x {(100 - tempThreshold).toFixed(0)}%
            </span>
            时，系统将判定为
            <span className='text-red-600 font-medium mx-1'>
              Critical (严重倒挂)
            </span>
            。 设置缓冲值可过滤轻微价格波动。
          </Paragraph>
        </Form>
      </Modal>
    </>
  );
};

export default Sidebar;
