
import { DataService } from './services/dataService';
import { Product, CompetitorData, ScatterPoint, RadarPoint } from './types';

// Initial Load from Data Service
// In a real app, this might be async, but for the demo we load it synchronously
export const MOCK_PRODUCTS: Product[] = DataService.getInternalProducts();
export const MOCK_COMPETITORS: Record<string, CompetitorData[]> = DataService.getCompetitors();

// Enhanced Data for Dashboard Line Chart (Simulating rich history with events)
// This remains a simulation helper as historical data is complex to generate from flat rows
export const MOCK_HISTORY_DATA_REDBULL = [
  { name: '10/20', date: '2023-10-20', ourPrice: 113, jdPrice: 118, yjpPrice: 114, xsjPrice: 112, marketMedian: 114, marketMin: 112, salesVolume: 120, inventoryLevel: 1400 },
  { name: '10/25', date: '2023-10-25', ourPrice: 113, jdPrice: 118, yjpPrice: 112, xsjPrice: 111, marketMedian: 113.6, marketMin: 111, salesVolume: 135, inventoryLevel: 1280 },
  { name: '10/31', date: '2023-10-31', ourPrice: 113, jdPrice: 115, jdEvent: '双11预热满减', yjpPrice: 111, xsjPrice: 109, xsjEvent: '万圣节秒杀', marketMedian: 111.6, marketMin: 109, salesVolume: 200, inventoryLevel: 1080 },
  { name: '11/05', date: '2023-11-05', ourPrice: 113, jdPrice: 116, yjpPrice: 110, xsjPrice: 108, marketMedian: 111.3, marketMin: 108, salesVolume: 180, inventoryLevel: 900 },
  { name: '11/10', date: '2023-11-10', ourPrice: 113, jdPrice: 114, jdEvent: '双11高潮', yjpPrice: 110, xsjPrice: 105, xsjEvent: '亏本引流', marketMedian: 109.6, marketMin: 105, salesVolume: 240, inventoryLevel: 660 },
  { name: '11/12', date: '2023-11-12', ourPrice: 113, jdPrice: 115, yjpPrice: 110, xsjPrice: 108, marketMedian: 111, marketMin: 108, salesVolume: 210, inventoryLevel: 450 },
];

export const MOCK_HISTORY_DATA_NONGFU = [
  { name: '10/20', date: '2023-10-20', ourPrice: 28, jdPrice: 32, yjpPrice: 29, xsjPrice: 28, marketMedian: 29.6, marketMin: 28, salesVolume: 300, inventoryLevel: 3500 },
  { name: '10/25', date: '2023-10-25', ourPrice: 28, jdPrice: 31, yjpPrice: 28.5, xsjPrice: 27, marketMedian: 28.8, marketMin: 27, salesVolume: 320, inventoryLevel: 3180 },
  { name: '10/31', date: '2023-10-31', ourPrice: 28, jdPrice: 29.9, jdEvent: '多买多折', yjpPrice: 28, xsjPrice: 26, marketMedian: 28, marketMin: 26, salesVolume: 450, inventoryLevel: 2730 },
  { name: '11/05', date: '2023-11-05', ourPrice: 28, jdPrice: 29.9, yjpPrice: 28, xsjPrice: 25, xsjEvent: '限购5件', marketMedian: 27.6, marketMin: 25, salesVolume: 410, inventoryLevel: 2320 },
  { name: '11/10', date: '2023-11-10', ourPrice: 28, jdPrice: 29.9, yjpPrice: 27.5, xsjPrice: 25, marketMedian: 27.4, marketMin: 25, salesVolume: 500, inventoryLevel: 1820 },
];

export const getHistoryData = (searchTerm: string) => {
    // Exact ID match for better demo experience
    const product = MOCK_PRODUCTS.find(p => p.id === searchTerm || p.name === searchTerm);
    
    // If specific mock data exists, return it
    if (searchTerm.includes('农夫') || searchTerm === 'TOP002') return { data: MOCK_HISTORY_DATA_NONGFU, name: '农夫山泉饮用天然水 550ml*24' };
    
    // Default fallback to Red Bull curves but with correct Product Name if found
    return { 
        data: MOCK_HISTORY_DATA_REDBULL, 
        name: product ? `${product.name} ${product.spec}` : (searchTerm === 'TOP001' ? '红牛维生素功能饮料 250ml*24' : '红牛维生素功能饮料 250ml*24') 
    };
};

export const getScatterData = (): ScatterPoint[] => {
  const data: ScatterPoint[] = [];
  MOCK_PRODUCTS.forEach(p => {
    const comps = MOCK_COMPETITORS[p.id] || [];
    comps.forEach(c => {
      const gapPercent = ((p.ourPrice - c.activityPrice) / p.ourPrice) * 100;
      const marginPercent = ((p.ourPrice - p.ourCost) / p.ourPrice) * 100;
      
      data.push({
        id: p.id + c.platform,
        name: p.name.substring(0, 6) + '...',
        brand: p.brand,
        x: parseFloat(gapPercent.toFixed(1)), // Price Gap
        y: p.salesVolume + (Math.random() * 1000 - 500), // Jitter for visualization
        z: marginPercent, // Bubble size ~ Margin
        status: gapPercent > 5 ? 'Lose' : gapPercent < -2 ? 'Win' : 'Critical'
      });
    });
  });
  
  // Add dummy data to make charts look populated
  for(let i=0; i<15; i++) {
     data.push({
        id: `DUMMY_${i}`,
        name: `模拟品_${i}`,
        brand: i % 2 === 0 ? '统一' : '康师傅',
        x: Math.floor(Math.random() * 20 - 10),
        y: Math.floor(Math.random() * 8000 + 1000),
        z: Math.floor(Math.random() * 20 + 5),
        status: Math.random() > 0.5 ? 'Lose' : 'Win'
     });
  }
  return data;
};

export const getRadarData = (): RadarPoint[] => {
  // Simulated aggregated metrics
  return [
    { subject: '价格竞争力', Our: 85, Comp: 78, fullMark: 100 },
    { subject: '品类覆盖率', Our: 92, Comp: 88, fullMark: 100 },
    { subject: '库存稳定性', Our: 90, Comp: 65, fullMark: 100 },
    { subject: '活动频次', Our: 60, Comp: 85, fullMark: 100 },
    { subject: '毛利健康度', Our: 75, Comp: 70, fullMark: 100 },
    { subject: '物流时效', Our: 88, Comp: 95, fullMark: 100 },
  ];
};
