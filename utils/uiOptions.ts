import type { ProductTag } from '@/types';

export interface SelectOption {
  label: string;
  value: string;
}

export const buildSelectOptions = (
  items: string[],
  allLabel: string,
  allValue = 'ALL'
): SelectOption[] => [
  { label: allLabel, value: allValue },
  ...items.map((item) => ({ label: item, value: item }))
];

export const PRODUCT_TAG_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: '全部标签' },
  { value: '爆品', label: '爆品' },
  { value: '新品', label: '新品' },
  { value: '高库存风险', label: '高库存风险' },
  { value: '常规', label: '常规' }
];

export const mapProductTags = (tags?: ProductTag[]): ProductTag[] =>
  tags ? tags : [];
