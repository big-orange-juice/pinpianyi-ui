import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Star } from 'lucide-react';
import type { ProductTag } from '@/types';

const { Text } = Typography;

export type AlertCategory = 'INVERSION' | 'LOSING' | 'ADVANTAGE';

export interface AlertTableRecord {
  key: string;
  id: string;
  skuId: string;
  product: string;
  spec: string;
  ourPrice: number;
  jdPrice?: number;
  yjpPrice?: number;
  xsjPrice?: number;
  gap: number;
  category: string;
  type: AlertCategory;
  isSpecial: boolean;
  tags: ProductTag[];
}

const formatCurrency = (value?: number) =>
  value !== undefined ? `¥${value.toFixed(2)}` : '-';

export const createAlertColumns = (
  toggleSpecialAttention: (id: string) => void
): ColumnsType<AlertTableRecord> => [
  {
    title: '商品',
    dataIndex: 'product',
    key: 'product',
    width: 260,
    render: (_, record) => (
      <Space align='start'>
        <div>
          <div className='font-medium text-slate-800'>{record.product}</div>
          <Text type='secondary' className='text-xs'>
            {record.spec}
          </Text>
          {record.tags?.length ? (
            <Space size={[4, 4]} wrap className='mt-2'>
              {record.tags.map((tag) => (
                <Tag
                  key={`${record.id}-${tag}`}
                  color='blue'
                  bordered={false}
                  className='text-xs'>
                  {tag}
                </Tag>
              ))}
            </Space>
          ) : null}
        </div>
      </Space>
    )
  },
  {
    title: '我方价格',
    dataIndex: 'ourPrice',
    key: 'ourPrice',
    align: 'right',
    render: (value: number) => (
      <span className='font-mono text-slate-800'>{formatCurrency(value)}</span>
    )
  },
  {
    title: '京东',
    dataIndex: 'jdPrice',
    key: 'jdPrice',
    align: 'right',
    render: (value?: number) => (
      <span className='font-mono text-slate-600'>{formatCurrency(value)}</span>
    )
  },
  {
    title: '易久批',
    dataIndex: 'yjpPrice',
    key: 'yjpPrice',
    align: 'right',
    render: (value?: number) => (
      <span className='font-mono text-slate-600'>{formatCurrency(value)}</span>
    )
  },
  {
    title: '鲜世纪',
    dataIndex: 'xsjPrice',
    key: 'xsjPrice',
    align: 'right',
    render: (value?: number) => (
      <span className='font-mono text-slate-600'>{formatCurrency(value)}</span>
    )
  },
  {
    title: '价差',
    dataIndex: 'gap',
    key: 'gap',
    align: 'right',
    render: (value: number) => (
      <span
        className={`font-mono font-semibold ${
          value > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
        {value > 0 ? '+' : ''}
        {value.toFixed(2)}
      </span>
    )
  },
  {
    title: '状态',
    dataIndex: 'category',
    key: 'category',
    align: 'center',
    render: (_, record) => {
      const statusColor =
        record.type === 'INVERSION'
          ? 'orange'
          : record.type === 'LOSING'
          ? 'red'
          : 'green';
      return (
        <Tag color={statusColor} bordered={false} className='font-semibold'>
          {record.category}
        </Tag>
      );
    }
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    align: 'center',
    render: (_, record) => (
      <Button
        type='text'
        shape='circle'
        aria-label='标记关注'
        icon={
          <Star
            size={16}
            className={
              record.isSpecial
                ? 'text-orange-500 fill-orange-500'
                : 'text-slate-400'
            }
          />
        }
        onClick={(e) => {
          e.stopPropagation();
          toggleSpecialAttention(record.id);
        }}
      />
    )
  }
];
