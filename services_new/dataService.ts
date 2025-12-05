
import { 
    Product, CompetitorData, RawSupplierProduct, RawCompetitorRow, 
    Platform, StockStatus, ActivityType, MappingStatus, PriceTrend, SellThroughStatus, ProductTag 
} from '../types';

// --- SIMULATED RAW DATA FROM FEISHU SHEETS (TOP 20 Representative Rows) ---
// In a real app, this would be fetched via API or File Upload parsing.

const RAW_PPY_PRODUCTS: RawSupplierProduct[] = [
    { ppy_sku_id: 'TOP001', product_name: '红牛维生素功能饮料', brand_name: '红牛', category_l1: '饮料', category_l2: '功能饮料', spec_desc: '250ml*24/箱', barcode: '6920202888883', cost_price: 108.0, selling_price: 113.0, stock_qty: 1200, sales_7d: 1450, sales_30d: 5800, prod_date: '2023-10-20', tags_str: '爆品', strategy_role: 'Traffic' },
    { ppy_sku_id: 'TOP002', product_name: '农夫山泉饮用天然水', brand_name: '农夫山泉', category_l1: '饮料', category_l2: '包装水', spec_desc: '550ml*24/箱', barcode: '6921168598583', cost_price: 26.5, selling_price: 28.0, stock_qty: 3000, sales_7d: 2100, sales_30d: 8500, prod_date: '2023-11-05', tags_str: '爆品', strategy_role: 'Traffic' },
    { ppy_sku_id: 'TOP003', product_name: '雪花勇闯天涯啤酒', brand_name: '雪花', category_l1: '酒水', category_l2: '啤酒', spec_desc: '500ml*12/箱', barcode: '6901234569999', cost_price: 38.0, selling_price: 45.0, stock_qty: 600, sales_7d: 800, sales_30d: 3200, prod_date: '2023-09-15', tags_str: '常规', strategy_role: 'Profit' },
    { ppy_sku_id: 'TOP004', product_name: '奥利奥原味夹心饼干', brand_name: '亿滋', category_l1: '休食', category_l2: '饼干', spec_desc: '97g*24/箱', barcode: '6901234568888', cost_price: 115.0, selling_price: 135.0, stock_qty: 200, sales_7d: 200, sales_30d: 900, prod_date: '2023-08-20', tags_str: '新品,常规', strategy_role: 'General' },
    { ppy_sku_id: 'TOP005', product_name: '金龙鱼食用调和油', brand_name: '金龙鱼', category_l1: '粮油', category_l2: '食用油', spec_desc: '5L*4/箱', barcode: '6901234567777', cost_price: 210.0, selling_price: 225.0, stock_qty: 400, sales_7d: 350, sales_30d: 1500, prod_date: '2023-10-01', tags_str: '爆品,高库存风险', strategy_role: 'Traffic' },
    { ppy_sku_id: 'TOP006', product_name: '海飞丝去屑洗发露', brand_name: '宝洁', category_l1: '日化', category_l2: '洗发护发', spec_desc: '400ml*12/箱', barcode: '6901234566666', cost_price: 280.0, selling_price: 320.0, stock_qty: 100, sales_7d: 90, sales_30d: 400, prod_date: '2023-06-15', tags_str: '高库存风险', strategy_role: 'Profit' },
    { ppy_sku_id: 'TOP007', product_name: '可口可乐', brand_name: '可口可乐', category_l1: '饮料', category_l2: '碳酸饮料', spec_desc: '330ml*24/箱', barcode: '6954767466663', cost_price: 38.5, selling_price: 42.0, stock_qty: 5000, sales_7d: 2500, sales_30d: 10000, prod_date: '2023-11-10', tags_str: '爆品', strategy_role: 'Traffic' },
    { ppy_sku_id: 'TOP008', product_name: '蓝月亮洗衣液', brand_name: '蓝月亮', category_l1: '日化', category_l2: '衣物清洁', spec_desc: '1kg*12/箱', barcode: '6923456789012', cost_price: 120.0, selling_price: 138.0, stock_qty: 800, sales_7d: 300, sales_30d: 1200, prod_date: '2023-09-01', tags_str: '常规', strategy_role: 'Profit' },
    { ppy_sku_id: 'TOP009', product_name: '伊利纯牛奶', brand_name: '伊利', category_l1: '乳品', category_l2: '常温奶', spec_desc: '250ml*24/箱', barcode: '6907878787878', cost_price: 65.0, selling_price: 72.0, stock_qty: 1500, sales_7d: 600, sales_30d: 2500, prod_date: '2023-10-25', tags_str: '爆品', strategy_role: 'Traffic' },
    { ppy_sku_id: 'TOP010', product_name: '康师傅红烧牛肉面', brand_name: '康师傅', category_l1: '休食', category_l2: '方便面', spec_desc: '100g*24/箱', barcode: '6901231231231', cost_price: 48.0, selling_price: 55.0, stock_qty: 2000, sales_7d: 800, sales_30d: 3500, prod_date: '2023-10-15', tags_str: '常规', strategy_role: 'General' },
    { ppy_sku_id: 'TOP011', product_name: '维达抽纸', brand_name: '维达', category_l1: '日化', category_l2: '纸品', spec_desc: '120抽*24包/箱', barcode: '6909876543210', cost_price: 58.0, selling_price: 68.0, stock_qty: 1000, sales_7d: 400, sales_30d: 1800, prod_date: '2023-09-20', tags_str: '新品', strategy_role: 'Profit' },
    { ppy_sku_id: 'TOP012', product_name: '百威啤酒', brand_name: '百威', category_l1: '酒水', category_l2: '啤酒', spec_desc: '500ml*18/箱', barcode: '6905555555555', cost_price: 105.0, selling_price: 120.0, stock_qty: 300, sales_7d: 150, sales_30d: 600, prod_date: '2023-08-10', tags_str: '高库存风险', strategy_role: 'Profit' },
    
    // --- ADDED MOCK DATA FOR DEMO ---
    
    // Inversion Example: Cost 62, Sell 58 (Loss -4)
    { ppy_sku_id: 'TOP013', product_name: '金典纯牛奶', brand_name: '伊利', category_l1: '乳品', category_l2: '高端奶', spec_desc: '250ml*12/箱', barcode: '6907878787888', cost_price: 62.0, selling_price: 58.0, stock_qty: 800, sales_7d: 400, sales_30d: 1600, prod_date: '2023-11-01', tags_str: '爆品', strategy_role: 'Traffic' }, 
    
    // Advantage Example: Sell 45, Comp Min 48 (Win +3)
    { ppy_sku_id: 'TOP014', product_name: '青岛啤酒经典', brand_name: '青岛啤酒', category_l1: '酒水', category_l2: '啤酒', spec_desc: '500ml*12/箱', barcode: '6901234560000', cost_price: 40.0, selling_price: 45.0, stock_qty: 500, sales_7d: 200, sales_30d: 800, prod_date: '2023-10-10', tags_str: '常规', strategy_role: 'Profit' },

    // Inversion Example 2: Cost 55, Sell 52 (Loss -3)
    { ppy_sku_id: 'TOP015', product_name: '元气森林白桃气泡水', brand_name: '元气森林', category_l1: '饮料', category_l2: '气泡水', spec_desc: '480ml*15/箱', barcode: '6970123456789', cost_price: 55.0, selling_price: 52.0, stock_qty: 1200, sales_7d: 600, sales_30d: 2400, prod_date: '2023-11-15', tags_str: '新品', strategy_role: 'Traffic' },

    // Advantage Example 2: Sell 52, Comp Min 55 (Win +3)
    { ppy_sku_id: 'TOP016', product_name: '百岁山矿泉水', brand_name: '百岁山', category_l1: '饮料', category_l2: '包装水', spec_desc: '570ml*24/箱', barcode: '6922222222222', cost_price: 48.0, selling_price: 52.0, stock_qty: 2000, sales_7d: 800, sales_30d: 3000, prod_date: '2023-10-20', tags_str: '爆品', strategy_role: 'General' },
];

const RAW_COMPETITORS: RawCompetitorRow[] = [
    // --- RED BULL (TOP001) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP001', comp_sku_name: '红牛(RedBull)维生素功能饮料250ml*24罐 (自营)', jd_price: 118.0, jd_promo_price: 114.0, jd_stock_state: '有货', jd_delivery: '自营物流', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP001', comp_sku_name: '红牛金罐 24罐装', yjp_sell_price: 112.0, yjp_level_price_desc: '1-49箱:112元; 50箱+:110元', yjp_min_buy_num: 50, region_name: '上海', update_time: '2023-11-14T09:00:00Z' },
    
    // --- NONGFU (TOP002) - Critical Loss Leader Example ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP002', comp_sku_name: '农夫山泉 饮用天然水 550ml*24/箱', jd_price: 32.0, jd_promo_price: 29.9, jd_stock_state: '有货', jd_delivery: '自营物流', region_name: '上海', update_time: '2023-11-14T09:30:00Z' },
    { platform_source: 'XIAN_SHI_JI', our_sku_id_ref: 'TOP002', comp_sku_name: '农夫山泉 550*24', xsj_price: 25.0, xsj_limit_num: 5, xsj_prod_date: '2023-11-01', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- SNOW BEER (TOP003) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP003', comp_sku_name: '雪花(Snow) 勇闯天涯 500ml*12听', jd_price: 45.0, jd_promo_price: 42.0, jd_stock_state: '有货', jd_delivery: '三方物流', region_name: '上海', update_time: '2023-11-14T14:00:00Z' },

    // --- OREO (TOP004) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP004', comp_sku_name: '奥利奥夹心饼干 97g*24 巧克力味', jd_price: 138.0, jd_promo_price: 132.0, jd_stock_state: '库存紧张', jd_delivery: '自营物流', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP004', comp_sku_name: '奥利奥夹心 97g', yjp_sell_price: 130.0, yjp_level_price_desc: '整件优惠', yjp_min_buy_num: 1, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- OIL (TOP005) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP005', comp_sku_name: '金龙鱼 食用调和油 5L*4桶/箱', jd_price: 235.0, jd_promo_price: 220.0, jd_stock_state: '有货', jd_delivery: '自营物流', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- HEAD & SHOULDERS (TOP006) - Old Stock Example ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP006', comp_sku_name: '海飞丝洗发露 400ml*12', jd_price: 330.0, jd_promo_price: 315.0, jd_stock_state: '有货', jd_delivery: '自营物流', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'XIAN_SHI_JI', our_sku_id_ref: 'TOP006', comp_sku_name: '海飞丝 (旧包装)', xsj_price: 270.0, xsj_limit_num: null, xsj_prod_date: '2022-12-01', region_name: '上海', update_time: '2023-11-13T10:00:00Z' },

    // --- COKE (TOP007) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP007', comp_sku_name: '可口可乐 330ml*24', jd_price: 43.0, jd_promo_price: 40.0, jd_stock_state: '有货', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP007', comp_sku_name: '可口可乐 330ml', yjp_sell_price: 39.0, region_name: '上海', update_time: '2023-11-14T09:00:00Z' },

    // --- BLUE MOON (TOP008) ---
    { platform_source: 'XIAN_SHI_JI', our_sku_id_ref: 'TOP008', comp_sku_name: '蓝月亮洗衣液', xsj_price: 135.0, xsj_limit_num: 2, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- YILI (TOP009) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP009', comp_sku_name: '伊利纯牛奶', jd_price: 75.0, jd_promo_price: 68.0, jd_stock_state: '有货', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP009', comp_sku_name: '伊利纯牛奶 250ml', yjp_sell_price: 66.0, region_name: '上海', update_time: '2023-11-14T09:00:00Z' },

    // --- MASTER KANG (TOP010) ---
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP010', comp_sku_name: '康师傅红烧牛肉面', jd_price: 58.0, jd_promo_price: 54.0, jd_stock_state: '有货', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- VIDA (TOP011) ---
    { platform_source: 'XIAN_SHI_JI', our_sku_id_ref: 'TOP011', comp_sku_name: '维达抽纸 120抽', xsj_price: 65.0, xsj_limit_num: null, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // --- BUDWEISER (TOP012) ---
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP012', comp_sku_name: '百威啤酒 500ml', yjp_sell_price: 118.0, region_name: '上海', update_time: '2023-11-14T09:00:00Z' },

    // --- NEW MOCK DATA ---
    // TOP013 (Inversion)
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP013', comp_sku_name: '金典纯牛奶 250ml*12', jd_price: 65.0, jd_promo_price: 60.0, jd_stock_state: '有货', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    
    // TOP014 (Advantage)
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP014', comp_sku_name: '青岛啤酒经典 500ml*12', jd_price: 55.0, jd_promo_price: 52.0, jd_stock_state: '有货', region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP014', comp_sku_name: '青岛啤酒经典', yjp_sell_price: 48.0, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // TOP015 (Inversion)
    { platform_source: 'XIAN_SHI_JI', our_sku_id_ref: 'TOP015', comp_sku_name: '元气森林白桃', xsj_price: 50.0, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },

    // TOP016 (Advantage)
    { platform_source: 'JD_WANSHANG', our_sku_id_ref: 'TOP016', comp_sku_name: '百岁山', jd_price: 60.0, jd_promo_price: 58.0, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
    { platform_source: 'YI_JIU_PI', our_sku_id_ref: 'TOP016', comp_sku_name: '百岁山', yjp_sell_price: 55.0, region_name: '上海', update_time: '2023-11-14T10:00:00Z' },
];

// --- ETL SERVICE (Transform Raw to App Model) ---

export const DataService = {
    // 1. Transform Supplier Data (PinPianYi)
    getInternalProducts: (): Product[] => {
        return RAW_PPY_PRODUCTS.map(raw => {
            // Helper to calculate stock age
            const stockAge = Math.floor((new Date().getTime() - new Date(raw.prod_date).getTime()) / (1000 * 3600 * 24));
            // Helper for inventory status
            let sellThroughStatus: SellThroughStatus = 'MEDIUM';
            if (raw.sales_30d > raw.stock_qty * 2) sellThroughStatus = 'FAST';
            if (raw.sales_30d < raw.stock_qty * 0.2) sellThroughStatus = 'SLOW';
            if (raw.sales_30d === 0) sellThroughStatus = 'STAGNANT';

            return {
                id: raw.ppy_sku_id,
                name: raw.product_name,
                brand: raw.brand_name,
                category: raw.category_l1,
                subCategory: raw.category_l2,
                spec: raw.spec_desc,
                barcode: raw.barcode,
                ourCost: raw.cost_price,
                ourPrice: raw.selling_price,
                salesVolume: raw.sales_30d,
                last7DaysSales: raw.sales_7d,
                inventory: raw.stock_qty,
                turnoverDays: parseFloat((raw.stock_qty / (raw.sales_30d / 30 || 1)).toFixed(1)),
                productionDate: raw.prod_date,
                stockAge,
                strategyRole: raw.strategy_role as 'Traffic' | 'Profit' | 'General',
                listingStatus: raw.stock_qty > 0 ? 'Active' : 'SoldOut',
                sellThroughRate: 0, // dynamic
                sellThroughStatus,
                salesAmount: raw.selling_price * raw.sales_30d,
                grossMarginRate: parseFloat(((raw.selling_price - raw.cost_price) / raw.selling_price * 100).toFixed(1)),
                tags: raw.tags_str.split(',') as ProductTag[]
            };
        });
    },

    // 2. Transform Competitor Data
    getCompetitors: (): Record<string, CompetitorData[]> => {
        const result: Record<string, CompetitorData[]> = {};

        RAW_COMPETITORS.forEach(raw => {
            const platform = raw.platform_source === 'JD_WANSHANG' ? Platform.JD_WANSHANG : 
                             raw.platform_source === 'YI_JIU_PI' ? Platform.YI_JIU_PI : 
                             Platform.XIAN_SHI_JI;
            
            // Map Fields based on Platform Type (Schema Mapping)
            let price = 0;
            let activityPrice = 0;
            let activityType = ActivityType.NONE;
            let activityDescription = "";
            let stockStatus = StockStatus.IN_STOCK;
            let moq: number | undefined = undefined;
            let tierPricing: string | undefined = undefined;
            let deliveryType: any = undefined;
            let limitQuantity: number | null = null;
            let productionDate: string | undefined = undefined;

            // -> JD Mapping Logic
            if (platform === Platform.JD_WANSHANG) {
                price = raw.jd_price || 0;
                activityPrice = raw.jd_promo_price || price;
                if (activityPrice < price) {
                    activityType = ActivityType.DIRECT_DISCOUNT;
                    activityDescription = "限时促销";
                }
                stockStatus = raw.jd_stock_state === '库存紧张' ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;
                deliveryType = raw.jd_delivery as any;
            } 
            // -> YJP Mapping Logic
            else if (platform === Platform.YI_JIU_PI) {
                price = raw.yjp_sell_price || 0;
                activityPrice = raw.yjp_sell_price || 0;
                if (raw.yjp_level_price_desc) {
                    activityType = ActivityType.VOLUME_DISCOUNT;
                    activityDescription = raw.yjp_level_price_desc;
                    tierPricing = raw.yjp_level_price_desc;
                    // Try to parse lower price from tier
                    const match = raw.yjp_level_price_desc.match(/(\d+)元/);
                    if (match && parseInt(match[1]) < activityPrice) {
                        activityPrice = parseInt(match[1]);
                    }
                }
                moq = raw.yjp_min_buy_num;
            }
            // -> XSJ Mapping Logic
            else if (platform === Platform.XIAN_SHI_JI) {
                price = raw.xsj_price || 0;
                activityPrice = raw.xsj_price || 0;
                if (raw.xsj_limit_num) {
                    activityType = ActivityType.FLASH_SALE;
                    activityDescription = `限购${raw.xsj_limit_num}件`;
                    limitQuantity = raw.xsj_limit_num;
                }
                productionDate = raw.xsj_prod_date;
            }

            const transformed: CompetitorData = {
                platform,
                competitorSkuName: raw.comp_sku_name,
                price,
                dailyPrice: price,
                activityPrice,
                activityType,
                activityDescription,
                stockStatus,
                moq,
                tierPricing,
                deliveryType,
                limitQuantity,
                productionDate,
                lastUpdated: raw.update_time,
                region: raw.region_name,
                mappingStatus: MappingStatus.MATCHED,
                verificationStatus: '已核对',
                priceTrend: PriceTrend.STABLE // Default
            };

            if (!result[raw.our_sku_id_ref]) {
                result[raw.our_sku_id_ref] = [];
            }
            result[raw.our_sku_id_ref].push(transformed);
        });

        return result;
    }
};
