

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LIMITED = 'LIMITED'
}

export enum ActivityType {
  DIRECT_DISCOUNT = '直降',
  VOLUME_DISCOUNT = '满减/阶梯', 
  GIFT = '赠品',
  FLASH_SALE = '秒杀',
  HIDDEN_CODE = '隐藏码/返利',
  COUPON = '平台券',
  NONE = '无活动'
}

export enum MappingStatus {
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  GUESS = 'GUESS'
}

export enum Platform {
  JD_WANSHANG = '京东万商',
  YI_JIU_PI = '易久批',
  XIAN_SHI_JI = '鲜世纪'
}

export enum PriceTrend {
  STABLE = '稳定',
  FLUCTUATING = '波动',
  RISING = '上涨',
  FALLING = '下跌'
}

export type PriceStatusFilter = 'ALL' | 'COST_INVERSION' | 'LOSING' | 'WINNING';

export type ProductTag = '新品' | '爆品' | '高库存风险' | '常规';

export type SellThroughStatus = 'FAST' | 'MEDIUM' | 'SLOW' | 'STAGNANT';

// --- Internal App Model ---

export interface Product {
  id: string;
  name: string; // Our standardized name
  brand: string;
  category: string; // Level 1 Category (e.g., Beverage)
  subCategory: string; // Level 2 Category
  spec: string; // e.g., 500ml*12
  barcode: string; // 69 code
  ourCost: number; // Logistics cost + product cost (Base for margin analysis)
  ourPrice: number; // Platform selling price
  salesVolume: number; // Monthly
  last7DaysSales: number; // New: Weekly trend for operational analysis
  inventory: number;
  turnoverDays: number; // Inventory Health Indicator
  productionDate: string; // YYYY-MM-DD
  stockAge?: number; // Days in stock
  strategyRole: 'Traffic' | 'Profit' | 'General'; // Traffic driver vs Profit generator
  
  // New Operational Metrics
  listingStatus: 'Active' | 'SoldOut'; // 在售状态
  sellThroughRate: number; // 动销率 (0-100) (Still kept for calculation)
  sellThroughStatus: SellThroughStatus; // Display Status
  salesAmount: number; // 销售额
  grossMarginRate: number; // 正常在售商品平均毛利率 (Internal)
  tags?: ProductTag[]; // Business Tags
}

export interface CompetitorData {
  platform: Platform | string; // Data Source dimension (dynamic)
  competitorSkuName: string; // Raw name from crawling
  
  // Price fields
  price: number; // Current Display Price (Usually Promo Price if active)
  dailyPrice: number; // Regular/Daily Price (For calculating discount depth)
  activityPrice: number; // Final calculated price after all rules (The real price used for gap analysis)
  
  // Platform Specific Attributes (Based on docs)
  moq?: number; // Minimum Order Quantity (Common in YiJiuPi/JD)
  tierPricing?: string; // e.g., "Buy 10 cases @ 38.0" (YiJiuPi)
  deliveryType?: '自营物流' | '三方物流' | '供应商直送'; // (JD Wanshang)
  productionDate?: string; // (YiJiuPi/XianShiJi - critical for pricing old stock)
  
  activityType: ActivityType;
  activityDescription: string; // e.g., "Buy 2 get 5% off"
  
  stockStatus: StockStatus;
  limitQuantity: number | null; // If limited (XianShiJi often limits loss leaders)
  lastUpdated: string;
  region: string; // City/Warehouse
  mappingStatus: MappingStatus;
  
  // New field for Secondary Check logic
  verificationStatus?: '已核对' | '未核对' | '存疑'; 
  
  // Trend
  priceTrend: PriceTrend;
}

export interface PriceComparisonRow {
  product: Product;
  competitorData: CompetitorData;
  priceGap: number; // Our Price - Competitor Price
  costGap: number; // Our Cost - Competitor Price (To check if they are selling below our cost)
  marginRate: number; // (Our Price - Our Cost) / Our Price
  competitorEstimatedMargin: number; // Estimated based on our cost
  
  // New Margin Analysis Metrics
  simulatedMargin: number; // (Comp Price - Our Cost)
  simulatedMarginRate: number; // (Comp Price - Our Cost) / Comp Price
  
  status: 'Win' | 'Lose' | 'Draw';
  alertLevel: 'Normal' | 'Warning' | 'Critical';
  recommendation: string; // Heuristic recommendation
  analysisNote: string; // Dynamic analysis note (e.g. "Deep discount but limited stock")
}

// --- Raw Data Interfaces (Simulating Excel/CSV Imports) ---

export interface RawSupplierProduct {
  ppy_sku_id: string;
  product_name: string;
  brand_name: string;
  category_l1: string;
  category_l2: string;
  spec_desc: string;
  barcode: string;
  cost_price: number;
  selling_price: number;
  stock_qty: number;
  sales_7d: number;
  sales_30d: number;
  prod_date: string;
  tags_str: string; // e.g. "新品,爆品"
  strategy_role: string; // "Traffic" | "Profit"
}

export interface RawCompetitorRow {
  platform_source: string; // 'JD_WANSHANG' | 'XIAN_SHI_JI' | 'YI_JIU_PI'
  our_sku_id_ref: string; // Foreign key to match (simulating mapping)
  comp_sku_name: string;
  
  // JD Fields
  jd_price?: number;
  jd_promo_price?: number;
  jd_stock_state?: string; // '有货'
  jd_delivery?: string;
  
  // XSJ Fields
  xsj_price?: number;
  xsj_limit_num?: number;
  xsj_prod_date?: string;
  
  // YJP Fields
  yjp_sell_price?: number;
  yjp_level_price_desc?: string;
  yjp_min_buy_num?: number;
  
  region_name: string;
  update_time: string;
}

export interface StrategyInsight {
  title: string;
  type: 'Pricing' | 'Assortment' | 'Promotion' | 'Stock';
  description: string;
  actionItem: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface CompetitorDeepAnalysis {
  productStructure: string; 
  pricingStrategy: string; 
  activityStrategy: string; 
  userStrategy: string; 
  exposureStrategy: string; 
  fulfillmentStrategy: string; 
  retentionStrategy: string; 
  regionalStrategy: string; 
}

export interface ChartDataPoint {
  name: string;
  date: string;
  ourPrice: number;
  jdPrice?: number;
  yjpPrice?: number;
  xsjPrice?: number;
  marketMedian?: number;
  marketMin?: number;
  salesVolume?: number;
  inventoryLevel?: number;
  jdEvent?: string;
  yjpEvent?: string;
  xsjEvent?: string;
  isLowest?: boolean;
}

export interface CrawlerField {
  key: string; 
  label: string; 
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'Array';
  description: string;
  sourcePlatform: Platform | string;
  mappingStatus: 'UNMAPPED' | 'PENDING_REVIEW' | 'MAPPED'; 
  semanticLabel?: string; 
  localField?: string; 
  isMapped?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  hasFile?: boolean;
  fileName?: string;
  isToolUse?: boolean;
  actionType?: 'VIEW_REPORT'; 
}

export interface ChatSession {
  id: string;
  title: string;
  startTime: Date;
  messages: Message[];
}

export interface SystemNotification {
  id: string;
  type: 'CRITICAL' | 'INFO' | 'NEW_FIELD';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionPayload?: any; 
}

export interface AnalysisReport {
  title: string;
  executiveSummary: string;
  marketTrend: 'Bullish' | 'Bearish' | 'Stable';
  chartInsights: string; 
  coreIssues: string[]; 
  opportunities: string[]; 
  strategies: {
    focus: string;
    action: string;
    impact: string;
  }[];
  riskAssessment: string;
  generatedAt: Date;
}

export interface ScatterPoint {
  id: string;
  x: number; 
  y: number; 
  z: number; 
  name: string;
  brand: string;
  status: 'Win' | 'Lose' | 'Critical';
}

export interface RadarPoint {
  subject: string;
  Our: number;
  Comp: number;
  fullMark: number;
}