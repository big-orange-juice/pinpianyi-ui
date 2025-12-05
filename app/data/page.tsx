'use client';

import React from 'react';
import Link from 'next/link';
import { Database, ArrowLeft } from 'lucide-react';
import { Button, Card, Result, Space, Tag, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function DataCollectionPage() {
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
              <span className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 text-green-600'>
                <Database size={28} />
              </span>
              <div>
                <Title level={3} className='!m-0'>
                  数据采集配置
                </Title>
                <Text type='secondary'>配置爬虫规则和数据字段映射</Text>
              </div>
            </div>
          </Space>

          <Result
            icon={<Database size={64} className='text-slate-300' />}
            title='数据采集配置页面'
            subTitle='此页面包含爬虫字段映射、新字段发现和数据清洗配置功能。'
            extra={
              <Card className='bg-green-50 border-green-200' size='small'>
                <Space direction='vertical' size={4}>
                  <Tag color='green' bordered={false} className='w-max'>
                    🚀 迁移完成
                  </Tag>
                  <Paragraph className='!m-0 text-green-700 text-sm'>
                    已成功从 React 迁移到 Next.js App Router
                  </Paragraph>
                  <Text className='text-xs text-green-600'>
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
