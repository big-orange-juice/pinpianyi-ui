'use client';

import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Button, Card, Result, Space, Tag, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function StrategyConfigPage() {
  return (
    <div className='p-8 animate-fade-in space-y-6'>
      <Link href='/' className='inline-flex'>
        <Button
          type='text'
          icon={<ArrowLeft size={18} />}
          className='text-slate-600 hover:!text-slate-800'>
          返回仪表盘
        </Button>
      </Link>

      <Card className='shadow-sm'>
        <Space direction='vertical' size='middle' className='w-full'>
          <Space align='center'>
            <div className='flex items-center gap-3 text-slate-800'>
              <span className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600'>
                <SlidersHorizontal size={28} />
              </span>
              <div>
                <Title level={3} className='!m-0'>
                  竞对策略配置
                </Title>
                <Text type='secondary'>配置竞争对手监控策略和自动调价规则</Text>
              </div>
            </div>
          </Space>

          <Result
            icon={<SlidersHorizontal size={64} className='text-slate-300' />}
            title='竞对策略配置页面'
            subTitle='此页面包含竞争对手深度分析、策略路线图和自动化调价配置功能。'
            extra={
              <Card className='bg-purple-50 border-purple-200' size='small'>
                <Space direction='vertical' size={4}>
                  <Tag color='purple' bordered={false} className='w-max'>
                    🚀 迁移完成
                  </Tag>
                  <Paragraph className='!m-0 text-purple-700 text-sm'>
                    已成功从 React 迁移到 Next.js App Router
                  </Paragraph>
                  <Text className='text-xs text-purple-600'>
                    使用 Zustand · ECharts · Tailwind CSS
                  </Text>
                </Space>
              </Card>
            }
          />
        </Space>
      </Card>
    </div>
  );
}
