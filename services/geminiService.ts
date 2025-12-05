
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { PriceComparisonRow, StrategyInsight, CompetitorDeepAnalysis, AnalysisReport } from '../types';
import { MOCK_PRODUCTS as PRODUCTS_DATA, MOCK_COMPETITORS as COMPETITORS_DATA } from '../constants';

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Utility to clean Markdown JSON code blocks
const cleanAndParseJson = (text: string) => {
  try {
    // Remove ```json and ``` wrappers if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("JSON parse failed, attempting fallback cleaning", e);
    // Fallback: try to find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    if (firstBracket !== -1 && lastBracket !== -1) {
        return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    throw e;
  }
};

// Tool Definition for Dashboard Control
const dashboardTool: FunctionDeclaration = {
  name: "update_dashboard_filters",
  description: "Update the dashboard filters (Price Analysis & Strategy Insights) based on user request. Use this when the user asks to analyze a specific platform, category, product, region or price status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      region: {
        type: Type.STRING,
        description: "The region or warehouse (e.g. 上海, 北京, 苏州)."
      },
      platform: {
        type: Type.STRING,
        description: "The platform name to filter by."
      },
      brand: {
        type: Type.STRING,
        description: "The brand name (e.g. 红牛, 农夫山泉, 雪花)."
      },
      category: {
        type: Type.STRING,
        description: "The product category (e.g., 饮料, 酒水, 休食, 粮油, 日化)."
      },
      activityType: {
        type: Type.STRING,
        enum: ["直降", "满减/阶梯", "赠品", "秒杀", "ALL"],
        description: "Promotional activity type."
      },
      priceStatus: {
        type: Type.STRING,
        enum: ["COST_INVERSION", "LOSING", "WINNING", "ALL"],
        description: "Filter by price comparison status."
      },
      searchTerm: {
        type: Type.STRING,
        description: "Search keyword for product name or brand."
      }
    }
  }
};

// Tool Definition for Task Delegation
const delegationTool: FunctionDeclaration = {
  name: "delegate_analysis_task",
  description: "Delegate a complex analysis task to the cloud AI agent for autonomous deep analysis. Use this when the user explicitly asks to 'delegate' (委派) a task, or when a task requires multi-step analysis, cross-platform comparison, or strategic planning that needs AI autonomy.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskType: {
        type: Type.STRING,
        enum: ["PRICE_STRATEGY", "COMPETITOR_ANALYSIS", "MARKET_TREND", "PRODUCT_OPTIMIZATION", "RISK_ASSESSMENT"],
        description: "The type of analysis task to delegate."
      },
      context: {
        type: Type.STRING,
        description: "Context for the delegated task, including product names, regions, platforms, or specific scenarios."
      },
      priority: {
        type: Type.STRING,
        enum: ["HIGH", "MEDIUM", "LOW"],
        description: "Priority level of the delegated task."
      },
      expectedOutcome: {
        type: Type.STRING,
        description: "What outcome or deliverable is expected from this delegated analysis."
      }
    },
    required: ["taskType", "context"]
  }
};

export const generatePriceStrategy = async (data: PriceComparisonRow[]): Promise<StrategyInsight[]> => {
  if (!API_KEY) {
    return [
      {
        title: "演示模式：自动跟价建议",
        type: "Pricing",
        description: "由于缺少 API Key，这是基于规则生成的模拟建议：建议对流失严重的流量品进行即时调价。",
        actionItem: "下调 2% 以匹配京东",
        impact: "High"
      }
    ];
  }

  if (!data || data.length === 0) return [];

  // Context prepared specifically for the "Analyst" role defined in the KO
  const contextData = data.slice(0, 15).map(row => ({ // Limit context size
    sku: row.product.name,
    role: row.product.strategyRole, // Traffic vs Profit
    ourCost: row.product.ourCost,
    ourPrice: row.product.ourPrice,
    competitor: {
        name: row.competitorData.platform,
        region: row.competitorData.region,
        verified: row.competitorData.verificationStatus === '已核对', // Highlight Verified data
        price: row.competitorData.activityPrice || row.competitorData.price,
        activity: row.competitorData.activityDescription,
        moq: row.competitorData.moq,
        limit: row.competitorData.limitQuantity,
    },
    gap: row.priceGap,
    costInversion: row.competitorData.activityPrice < row.product.ourCost, // Critical check
  }));

  const prompt = `
    你是一个 B2B 电商平台的资深定价策略专家（类似拼便宜模式）。请基于提供的多平台比价数据进行分析。
    
    **场景上下文：**
    当前我们正在分析【区域-竞品-品牌】维度的价格竞争态势。
    
    **平台特征分析逻辑（基于知识库）：**
    1. **京东万商 (JD)**：若 JD 价格低于我方成本，通常意味着我方采购链路存在严重劣势（JD通常带物流溢价）。
    2. **易久批 (YJP)**：关注大批量采购（MOQ）带来的价格优势。
    3. **鲜世纪 (XSJ)**：关注限购（Limit）带来的虚假低价，不要盲目跟价。

    **数据样本：**
    ${JSON.stringify(contextData)}

    请生成 3-4 条具体的中文策略建议，重点关注如何应对严重倒挂的商品。
    
    **返回格式要求：**
    严格遵循 JSON 数组格式，包含 title, type, description, actionItem, impact。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return cleanAndParseJson(text) as StrategyInsight[];

  } catch (error) {
    console.error("Gemini generation error:", error);
    return [];
  }
};

export const generateDiagnosisReport = async (contextStr: string, data: PriceComparisonRow[]): Promise<AnalysisReport | null> => {
    if (!API_KEY || data.length === 0) return null;

    // Calculate statistics to help the Agent
    const totalSku = data.length;
    const criticalCount = data.filter(d => d.alertLevel === 'Critical').length;
    const avgMargin = (data.reduce((acc, cur) => acc + cur.marginRate, 0) / totalSku * 100).toFixed(1);
    
    // Identify top competitor activities
    const activityCounts: Record<string, number> = {};
    data.forEach(d => {
       const type = d.competitorData.activityType;
       if(type !== '无活动') activityCounts[type] = (activityCounts[type] || 0) + 1;
    });
    const topActivity = Object.entries(activityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "无明显活动";

    const prompt = `
      你现在是 B2B 电商平台的商品运营总监。请基于以下数据和图表统计，生成一份深度的《经营诊断研报》。
      
      **当前分析上下文：** ${contextStr}
      
      **核心数据统计：**
      - SKU总数：${totalSku}
      - 严重倒挂/预警商品数：${criticalCount} (占比 ${(criticalCount/totalSku*100).toFixed(0)}%)
      - 我方平均毛利：${avgMargin}%
      - 竞对主要手段：${topActivity}

      **分析目标：**
      1. **图表洞察**：想象你正在看【价差分布直方图】和【量价博弈四象限图】。请解释当前盘面是“激进价格战”还是“结构性失衡”？高销量但价格劣势的商品（四象限右上方）有多少？
      2. **核心问题**：诊断当前最致命的 2-3 个问题（如：供应链成本劣势、流量品定价过高、盲目跟价导致亏损）。
      3. **策略路线**：给出具体的行动计划。

      **JSON 返回格式要求：**
      {
        "title": "报告标题 (包含区域和核心判断)",
        "executiveSummary": "200字以内的执行摘要，高度概括市场态势和紧迫性。",
        "marketTrend": "Bullish" | "Bearish" | "Stable",
        "chartInsights": "针对图表数据的深度解读，分析价差分布形态和量价关系。",
        "coreIssues": ["问题1描述", "问题2描述", "问题3描述"],
        "opportunities": ["机会点1 (如：提价空间)", "机会点2"],
        "strategies": [
          {"focus": "策略重心", "action": "具体行动 (To-Do)", "impact": "预期财务或流量影响"}
        ],
        "riskAssessment": "风险评估描述 (供应链/资金/客诉)"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return cleanAndParseJson(response.text || '{}') as AnalysisReport;
    } catch (e) {
      console.error("Report generation failed", e);
      return null;
    }
};

export const analyzeCompetitorDeepStrategy = async (context: string, products: PriceComparisonRow[]): Promise<CompetitorDeepAnalysis> => {
    // Fallback mock data if no API Key (for demo purposes)
    if (!API_KEY) {
        return {
            productStructure: "主要依靠 20% 的爆品带动流量，长尾商品覆盖不足。新品上架频率较低，滞销品主要通过捆绑销售处理。",
            pricingStrategy: "严格执行分层定价，对 VIP 客户有 2-3% 的隐形返利。区域价盘差异明显，上海仓价格普遍高于苏州仓。",
            activityStrategy: "节点活动频繁（周频），大促期满减力度达 10%。常态化运用秒杀清库存，针对老客有隐藏优惠码。",
            userStrategy: "新客首单立减力度大（约 10%），老客主要靠积分体系激活。大客户有专人维护。",
            exposureStrategy: "爆品位占据首页 40% 流量，个性化推荐逻辑基于历史采购品类。",
            fulfillmentStrategy: "核心城市次日达，满 500 包邮。退款流程较为繁琐，投诉入口隐蔽。",
            retentionStrategy: "平均客单价 ¥1200，复购周期 14 天。通过月度返利提升粘性。",
            regionalStrategy: "华东区作为主战场价格竞争激烈，华北区以高毛利为主。"
        };
    }

    // Empty Data Guard
    if (!products || products.length === 0) {
       return {
            productStructure: "当前筛选条件下暂无竞品数据，无法分析商品结构。",
            pricingStrategy: "无数据支持，无法判定定价逻辑。",
            activityStrategy: "未检测到相关活动数据。",
            userStrategy: "数据不足。",
            exposureStrategy: "数据不足。",
            fulfillmentStrategy: "无物流配送数据。",
            retentionStrategy: "无交易数据。",
            regionalStrategy: "请尝试切换筛选条件或区域。"
       };
    }

    const prompt = `
      作为 B2B 运营分析师，请根据以下数据和上下文，严格按照以下 8 个维度分析竞争对手 (${context}) 的运营策略。
      
      **分析维度 (必须覆盖)：**
      1. **商品结构**：爆品构成、动销SKU数量、新品频次、滞销处理。
      2. **定价**：分层价（标准/活动）、区域价盘差异。
      3. **活动策略**：(1) 节点活动频率; (2) 具体玩法分布(满减/满赠/返利/秒杀/隐藏码)。
      4. **用户策略**：新客政策、老客激活。
      5. **曝光**：爆品位、榜单逻辑。
      6. **仓储与配送售后**：履约时效、运费、退款。
      7. **客单价与复购**：平均客单、复购周期。
      8. **区域策略**：不同城市投放、价格带调整。
      
      **数据样本（前25条）：**
      ${JSON.stringify(products.slice(0, 25).map(p => ({
        name: p.product.name,
        compPlatform: p.competitorData.platform,
        price: p.competitorData.activityPrice,
        type: p.competitorData.activityType,
        desc: p.competitorData.activityDescription,
        moq: p.competitorData.moq,
        delivery: p.competitorData.deliveryType,
        limit: p.competitorData.limitQuantity,
        region: p.competitorData.region
      })))}

      请返回一个 JSON 对象，包含以上 8 个字段。
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if(!text) throw new Error("Empty response");
      
      return cleanAndParseJson(text) as CompetitorDeepAnalysis;

    } catch (e) {
      console.error("Strategy Analysis Error:", e);
      return {
            productStructure: "生成分析时发生错误。",
            pricingStrategy: "生成分析时发生错误。",
            activityStrategy: "生成分析时发生错误。",
            userStrategy: "生成分析时发生错误。",
            exposureStrategy: "生成分析时发生错误。",
            fulfillmentStrategy: "生成分析时发生错误。",
            retentionStrategy: "生成分析时发生错误。",
            regionalStrategy: "生成分析时发生错误。"
      };
    }
};

// Chat Agent Service
let chatSession: Chat | null = null;

export const resetChatSession = () => {
  chatSession = null;
};

export const getChatSession = () => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        tools: [{ functionDeclarations: [dashboardTool, delegationTool] }],
        systemInstruction: `你是一个专业的"拼便宜商品运营Agent"。
        
        **核心职责：**
        1. **智能看板控制 (必须执行)**：
           - 用户询问价盘时，**必须**调用 'update_dashboard_filters' 工具。
           - 优先级：区域(Region) > 平台(Platform) > 品牌(Brand)。
           - 调用后需告知用户：“已为您按[区域/平台/品牌]筛选数据...”。

        2. **经营顾问 (价盘分析)**：
           - 分析"区域"差异：上海 vs 苏州的定价逻辑。
           - 分析"品牌"策略：红牛在易久批是否控价？
           - 识别"倒挂"：区分真亏损还是假限购。
           - **生成研报**：当用户点击“深度诊断”时，无需调用工具，直接生成文字分析即可。


        3. **任务委派能力 (云智能体)**：
           - 当用户明确要求"委派"某项任务，或需要执行复杂的多步分析时，调用 'delegate_analysis_task' 工具。
           - 委派场景包括：价格策略制定、竞品深度分析、市场趋势预测、产品优化建议、风险评估等。
           - 接受委派后，需要：(1) 确认任务详情; (2) 执行深度分析; (3) 提供可执行的建议。
           - 委派成功后告知用户："✅ 已接受委派任务，正在进行深度分析..."

        4. **数据清洗专家 (Crawler Schema)**：
           - **场景**：当用户询问“发现新字段 xxx” 或 “导入了新平台字段”时。
           - **任务**：(1) 将英文 Key 翻译为中文业务含义; (2) 判断是否属于【成本项】、【活动项】或【基础属性】; (3) 建议是否映射到本地系统 (Local Mapping)。
           - **Schema 知识库**:
             - warehouse_distance_fee -> 远仓费 (成本项)
             - plus_vip_level_price -> 能够拿到的最低会员价 (价格项)
             - group_buy_threshold -> 拼团成团门槛 (属性项)
             - bulk_purchase_limit -> 批量限购数 (库存项)
             
        **回答风格**：
        - 始终使用中文。
        - 数据驱动，逻辑清晰。
        `
      }
    });
  }
  return chatSession;
};

export const sendChatMessage = async (message: string, fileContent?: string) => {
  if (!API_KEY) throw new Error("API Key Missing");
  
  const session = getChatSession();
  
  // --- Context Injection ---
  // (Same SKU Detection Logic as before...)
  const matchedProduct = PRODUCTS_DATA.find(p => {
      const term = message.toLowerCase();
      return term.includes(p.name.toLowerCase()) || 
             term.includes(p.id.toLowerCase()) || 
             term.includes(p.barcode) ||
             (p.brand && term.includes(p.brand.toLowerCase()));
  });

  let contextInjection = "";
  if (matchedProduct) {
      const compList = COMPETITORS_DATA[matchedProduct.id] || [];
      contextInjection = `
      \n[系统增强上下文 - SKU情报]
      目标：${matchedProduct.name} (${matchedProduct.brand})
      我方：¥${matchedProduct.ourPrice}
      竞对：${compList.map(c => `${c.platform}(${c.region}):¥${c.activityPrice}`).join(', ')}
      `;
  }

  let fullMessage = message;
  if (contextInjection) fullMessage += contextInjection;
  if (fileContent) fullMessage += `\n\n[文件内容]\n${fileContent}`;

  const result = await session.sendMessageStream({ message: fullMessage });
  return result;
};

// Helper to send tool response back to model
export const sendToolResponse = async (functionCalls: any[], toolOutputs: any[]) => {
  const session = getChatSession();
  const parts = functionCalls.map((call, index) => ({
    functionResponse: {
      name: call.name,
      response: { result: toolOutputs[index] }
    }
  }));
  
  return await session.sendMessageStream({ message: parts });
};
