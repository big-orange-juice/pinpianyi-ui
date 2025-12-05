'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Button, Card, Space, Typography, Result, Tag } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function PriceAnalysisPage() {
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
          <Space align='center' className='text-slate-800'>
            <div className='flex items-center gap-3'>
              <span className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600'>
                <TrendingUp size={28} />
              </span>
              <div>
                <Title level={3} className='!m-0'>
                  价盘分析矩阵
                </Title>
                <Text type='secondary'>深度分析价格竞争态势和策略洞察</Text>
              </div>
            </div>
          </Space>

          <Result
            icon={<TrendingUp size={64} className='text-slate-300' />}
            title='价盘分析页面'
            subTitle='此页面包含详细的价格分析矩阵、竞争对手策略洞察和深度经营诊断报告。'
            extra={
              <Card className='bg-blue-50 border-blue-200' size='small'>
                <Space direction='vertical' size={4}>
                  <Tag color='blue' bordered={false} className='w-max'>
                    🚀 迁移完成
                  </Tag>
                  <Paragraph className='!m-0 text-blue-700 text-sm'>
                    已成功从 React 迁移到 Next.js App Router
                  </Paragraph>
                  <Text className='text-xs text-blue-600'>
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
