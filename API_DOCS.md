# 拼便宜 UI 后端 API 文档（Demo + 推荐补齐）

本项目为 Next.js App Router 前端，当前以 `services/dataService.ts` + `constants.ts` 的内存 Mock 数据驱动页面，同时内置了少量 Next Route Handler 作为 Demo API（`/api/products`、`/api/competitors`、`/api/history`）。

本文档包含两部分：
- **现有 Demo API（已实现）**：当前仓库可直接访问的接口
- **推荐补齐的后端 API**：把页面中“本地状态/Mock”替换为真实后端时需要的接口清单（含 demo 地址、参数、字段说明）

## 通用说明

- Base URL（本地开发）：`http://localhost:3000`
- 返回格式：`application/json`
- 通用错误格式：`{ "error": string }` + 对应 HTTP 状态码
- 字符编码：UTF-8

## 项目功能总览（前端页面/模块）

### 页面

- `/` 仪表盘：KPI 概览、预警表格、商品历史走势图、筛选/特别关注
- `/analysis` 价盘分析矩阵：多维筛选 + 价差分布图 + 竞对矩阵表 + 导出/生成经营研报
- `/config` 竞对策略配置：规则配置（按类目/按 SKU）、区域多选、导入导出
- `/data` 数据采集配置：竞品平台维护、字段发现/待审核/映射表、重点 SKU 导入、特别关注管理

### 全局组件

- 左侧导航 + 系统设置：成本倒挂阈值（全局参数）
- 运营 Agent（当前版本前端模拟回复，真实 AI 需要后端支持）

## 需要后端 API 支持的功能清单（按页面）

> 说明：当前仓库大部分数据来自 Mock/本地 state；下表列出“如果要接真实后端”需要的 API。

| 模块 | 具体功能 | 需要的后端能力 | 建议接口（demo 地址） | 当前实现 |
| --- | --- | --- | --- | --- |
| 仪表盘 `/` | 商品列表/筛选条件来源 | 商品主数据查询（类目/品牌/标签等） | `GET /api/products`（可扩展 query） | Mock + 已有 Demo API |
| 仪表盘 `/` | 竞品价格对比、最低价计算 | 按 SKU 返回竞品报价（含活动价） | `GET /api/competitors`（可扩展 query） | Mock + 已有 Demo API |
| 仪表盘 `/` | 商品历史走势图 | 价格/销量/库存时序数据 | `GET /api/history?productId=...`（可扩展范围/粒度） | Mock + 已有 Demo API |
| 仪表盘 `/` | 预警列表（劣势/倒挂/预计损失等） | 后端聚合计算（更快、更一致） | `GET /api/alerts`（推荐新增） | 前端本地计算 |
| 仪表盘 `/` | 特别关注/重点监控持久化 | 用户维度持久化 | `GET/PUT /api/user/preferences` | 本地 store |
| 价盘矩阵 `/analysis` | 大表筛选/分页/排序 | 后端查询 + 分页 + 聚合（平台=ALL 聚合） | `GET /api/analysis/matrix` | 前端本地计算 |
| 价盘矩阵 `/analysis` | 导出 CSV | 后端导出（大数据量） | `GET /api/analysis/export` | 前端生成 Blob |
| 价盘矩阵 `/analysis` | 经营研报生成 | 服务端生成报告/调用 LLM | `POST /api/reports/generate` | 前端本地生成 |
| 策略配置 `/config` | 规则 CRUD | 规则配置持久化、版本化 | `GET/POST/PUT/DELETE /api/strategy-rules` | 本地 state |
| 策略配置 `/config` | 规则导入导出 | 文件/文本导入导出 | `POST /api/strategy-rules/import`、`GET /api/strategy-rules/export` | 前端本地处理 |
| 数据采集 `/data` | 平台维护（新增平台） | 平台元数据持久化 | `GET/POST /api/data/platforms` | 本地 store |
| 数据采集 `/data` | 新字段发现/扫描 | 触发爬虫/差异检测 | `POST /api/data/scan` | 前端模拟 |
| 数据采集 `/data` | 字段待审核/映射 CRUD | 映射表持久化 + 审核流 | `GET/POST/PUT/DELETE /api/data/fields` | 前端本地 state |
| 数据采集 `/data` | TOP SKU 导入 | 解析/校验/落库 | `POST /api/data/monitored-products/import` | 前端本地解析 |
| 全局 Agent | 对话/工具调用/会话 | 流式对话 + 工具编排 + 会话存储 | `POST /api/agent/chat`、`GET /api/agent/sessions` | 目前禁用/模拟 |
| 全局通知 | 通知拉取/已读 | 通知中心 | `GET/POST /api/notifications`、`PATCH /api/notifications/:id/read` | 本地 store |

## 现有 Demo API（已实现）

### 1) 获取内部商品列表

- 路径：`GET /api/products`
- 描述：返回内部标准化商品（含成本、售价、标签等），供仪表盘/分析页使用。
- 成功响应：`200 OK`
- 响应体：`Product[]`
- 失败响应：`500 { error: "Failed to fetch products" }`

### Product 字段

| 字段              | 类型                                       | 说明                                       |
| ----------------- | ------------------------------------------ | ------------------------------------------ |
| id                | string                                     | SKU 编号（如 `TOP001`）                    |
| name              | string                                     | 标准化商品名                               |
| brand             | string                                     | 品牌                                       |
| category          | string                                     | 一级类目                                   |
| subCategory       | string                                     | 二级类目                                   |
| spec              | string                                     | 规格描述（如 `250ml*24/箱`）               |
| barcode           | string                                     | 条码                                       |
| ourCost           | number                                     | 我方成本价                                 |
| ourPrice          | number                                     | 我方当前售价                               |
| salesVolume       | number                                     | 月销量（30 天）                            |
| last7DaysSales    | number                                     | 近 7 日销量                                |
| inventory         | number                                     | 库存量                                     |
| turnoverDays      | number                                     | 周转天数（库存/日均销量）                  |
| productionDate    | string                                     | 生产日期 `YYYY-MM-DD`                      |
| stockAge          | number                                     | 库龄（天）                                 |
| strategyRole      | "Traffic" \| "Profit" \| "General"         | 商品角色                                   |
| listingStatus     | "Active" \| "SoldOut"                      | 在售状态                                   |
| sellThroughRate   | number                                     | 动销率（占位字段）                         |
| sellThroughStatus | "FAST" \| "MEDIUM" \| "SLOW" \| "STAGNANT" | 动销标签                                   |
| salesAmount       | number                                     | 销售额（ourPrice \* salesVolume）          |
| grossMarginRate   | number                                     | 毛利率（%）                                |
| tags              | string[]                                   | 业务标签（如 “新品/爆品/高库存风险/常规”） |

### 2) 获取竞品列表（按我方 SKU 分组）

- 路径：`GET /api/competitors`
- 描述：返回以我方 SKU 为 key 的竞品列表，供价格矩阵/对比使用。
- 成功响应：`200 OK`
- 响应体：`Record<string, CompetitorData[]>`（键为我方 SKU `id`）。
- 失败响应：`500 { error: "Failed to fetch competitors" }`

### CompetitorData 字段

| 字段                | 类型           | 说明                                                |
| ------------------- | -------------- | --------------------------------------------------- |
| platform            | string         | 平台（`京东万商`/`易久批`/`鲜世纪`）                |
| competitorSkuName   | string         | 竞品原始名称                                        |
| price               | number         | 展示价（常规价）                                    |
| dailyPrice          | number         | 日常价（同 price）                                  |
| activityPrice       | number         | 活动后实际价（用于价差计算）                        |
| activityType        | string         | 活动类型（直降/满减/秒杀/…）                        |
| activityDescription | string         | 活动描述或阶梯价文本                                |
| stockStatus         | string         | 库存状态（IN_STOCK/LOW_STOCK/OUT_OF_STOCK/LIMITED） |
| moq                 | number?        | 最小起订量（部分平台）                              |
| tierPricing         | string?        | 阶梯价描述（易久批）                                |
| deliveryType        | string?        | 配送类型（自营物流/三方物流/直送）                  |
| productionDate      | string?        | 生产日期（部分平台）                                |
| limitQuantity       | number \| null | 限购数量（鲜世纪秒杀等）                            |
| lastUpdated         | string         | 更新时间（ISO 字符串）                              |
| region              | string         | 区域/仓库                                           |
| mappingStatus       | string         | 字段映射状态（MATCHED/…）                           |
| verificationStatus  | string?        | 二次核对状态（已核对/未核对/存疑）                  |
| priceTrend          | string         | 价格趋势（稳定/波动/上涨/下跌）                     |

### 3) 获取单 SKU 价格历史/事件曲线

- 路径：`GET /api/history?productId=<id或名称>`
- 描述：返回指定 SKU 的价格/销量/库存历史（模拟数据）。
- 查询参数：
  - `productId` (可选，默认 `TOP001`)，可传 SKU ID 或商品名关键字（如 “农夫”）。
- 成功响应：`200 OK`
- 响应体：
  ```json
  {
    "data": ChartDataPoint[],
    "name": "<匹配到的商品名>"
  }
  ```
- 失败响应：`500 { error: "Failed to fetch history data" }`

### ChartDataPoint 字段

| 字段                      | 类型     | 说明                   |
| ------------------------- | -------- | ---------------------- |
| name                      | string   | 横轴标签（如 `10/20`） |
| date                      | string   | 日期 `YYYY-MM-DD`      |
| ourPrice                  | number   | 我方价                 |
| jdPrice                   | number?  | 京东价                 |
| yjpPrice                  | number?  | 易久批价               |
| xsjPrice                  | number?  | 鲜世纪价               |
| marketMedian              | number?  | 市场中位价             |
| marketMin                 | number?  | 市场最低价             |
| salesVolume               | number?  | 当期销量               |
| inventoryLevel            | number?  | 当期库存               |
| jdEvent/yjpEvent/xsjEvent | string?  | 平台事件标签           |
| isLowest                  | boolean? | 是否当前最低（占位）   |

## 推荐补齐的后端 API（用于替换本地 Mock/State）

以下接口**当前仓库未实现**，用于你落真实后端时对齐前端功能。demo 地址沿用 `http://localhost:3000` 作为示例。

### A) 用户与全局设置

#### A1. 获取当前用户信息

- `GET /api/me`
- 用途：提供 `currentUser`（姓名/角色/默认区域/管辖平台等）
- 响应示例：
  ```json
  {"name":"张运营","role":"高级商品运营专家","region":"上海","managedPlatform":"ALL"}
  ```

#### A2. 获取/更新用户偏好（重点/特别关注）

- `GET /api/user/preferences`
- `PUT /api/user/preferences`
- 用途：持久化 `monitoredProductIds`、`specialAttentionIds`、默认筛选项
- 请求体示例：
  ```json
  {"monitoredProductIds":["TOP001"],"specialAttentionIds":["TOP001","TOP005"]}
  ```

#### A3. 获取/更新系统全局参数

- `GET /api/settings`
- `PUT /api/settings`
- 用途：侧边栏“成本倒挂阈值”等全局参数
- 字段：
  - `costThreshold`: number（0-30）

### B) 商品与竞品（查询增强版）

#### B1. 商品查询（支持过滤/分页）

- `GET /api/products`
- Query（建议）：
  - `category`、`brand`、`tag`、`search`（SKU/名称模糊）
  - `page`、`pageSize`
- 响应（建议）：
  ```json
  {"items": [/* Product[] */], "total": 123}
  ```

#### B2. 竞品查询（支持按 SKU/平台/区域过滤）

- `GET /api/competitors`
- Query（建议）：
  - `productIds`：逗号分隔（`TOP001,TOP002`）
  - `platform`：平台名或 `ALL`
  - `region`：区域或 `ALL`

### C) 仪表盘预警与聚合（推荐新增）

#### C1. 获取 KPI 汇总

- `GET /api/dashboard/kpis`
- Query（建议）：`region`、`platform`、`tag`、`category`、`brand`、`viewMode`（ALL_TOP/SPECIAL）
- 响应字段示例：
  ```json
  {"inversionCount": 3, "priceDisadvantageCount": 20, "priceAdvantageCount": 8, "totalEstDailyLoss": 12345.6}
  ```

#### C2. 获取预警列表

- `GET /api/alerts`
- Query（建议）：同上 + `sort`、`page`、`pageSize`
- 响应字段（建议最小集）：
  - `skuId`、`product`、`spec`、`ourPrice`、`minCompPrice`、`gap`、`profit`、`category`、`type`、`tags`、`isSpecial`

### D) 价盘分析矩阵（推荐新增）

#### D1. 获取矩阵数据（平台=ALL 返回聚合，指定平台返回明细）

- `GET /api/analysis/matrix`
- Query（建议）：
  - `region`、`platform`、`category`、`brand`、`activityType`、`priceStatus`、`search`
  - `costThreshold`（用于倒挂判定）
  - `page`、`pageSize`
- 响应（建议）：
  - `mode`: "AGGREGATED" | "DETAILED"
  - `items`: 聚合行或明细行数组
  - `total`

#### D2. 导出矩阵 CSV

- `GET /api/analysis/export`
- Query：与 `D1` 一致
- 响应：`text/csv`（或返回下载链接）

#### D3. 生成经营研报

- `POST /api/reports/generate`
- 用途：替换前端本地 `createLocalReport`，支持接入 LLM / 模板化报告
- 请求体（建议）：
  ```json
  {"region":"上海","platform":"ALL","filters":{ "category":"ALL","brand":"ALL" },"costThreshold":10}
  ```
- 响应体：`AnalysisReport`

### E) 策略配置（竞对策略规则）

> 对应 `/config` 页面 `AnalysisRule`。

#### E1. 规则列表

- `GET /api/strategy-rules?targetType=CATEGORY|SKU`

#### E2. 新增规则

- `POST /api/strategy-rules`

#### E3. 更新规则

- `PUT /api/strategy-rules/:id`

#### E4. 删除规则

- `DELETE /api/strategy-rules/:id`

#### E5. 导入/导出

- `POST /api/strategy-rules/import`（文件或文本）
- `GET /api/strategy-rules/export`（导出文件）

### F) 数据采集配置（字段审核/映射）

> 对应 `/data` 页面 `CrawlerField` 以及平台列表维护。

#### F1. 平台列表

- `GET /api/data/platforms`
- `POST /api/data/platforms`（新增平台）

#### F2. 字段列表（按平台 + 状态）

- `GET /api/data/fields?platform=<name>&status=PENDING_REVIEW|MAPPED`

#### F3. 触发扫描/发现新字段

- `POST /api/data/scan`
- 请求体示例：`{"platform":"京东万商"}`
- 响应示例：`{"newFields": [/* CrawlerField[] */]}`

#### F4. 确认映射（审核通过）

- `PUT /api/data/fields/:key/confirm`
- 请求体示例：`{"platform":"京东万商","localField":"memberPrice","label":"会员分层价","description":"..."}`

#### F5. 字段增删改（映射表维护）

- `POST /api/data/fields`（新增映射字段）
- `PUT /api/data/fields/:key`（编辑）
- `DELETE /api/data/fields/:key?platform=<name>`（删除）

#### F6. 重点 SKU 导入/管理

- `POST /api/data/monitored-products/import`
  - 用途：把用户粘贴的文本解析为 SKU 列表并校验
  - 请求体：`{"text":"TOP001\nTOP002\n..."}`
  - 响应：`{"products": [/* Product[] */], "invalid": ["TOP999"]}`
- `PUT /api/data/monitored-products`（保存监控列表）
- `PUT /api/data/special-attention`（保存特别关注列表）

### G) Agent / 通知中心（若要启用 AI）

#### G1. Agent 对话（建议流式）

- `POST /api/agent/chat`
- 请求体（建议）：
  ```json
  {"sessionId":"...","message":"请分析红牛价格", "attachments":[{"name":"x.csv","content":"..."}]}
  ```
- 响应：SSE/Chunked（流式文本 + tool_calls），或普通 JSON（最小可用）

#### G2. 会话管理

- `GET /api/agent/sessions`
- `POST /api/agent/sessions`（新会话）
- `GET /api/agent/sessions/:id`（加载会话）

#### G3. 通知中心

- `GET /api/notifications`
- `POST /api/notifications`（创建通知：系统/字段发现/风险）
- `PATCH /api/notifications/:id/read`

## 数据来源与限制

- 数据均来源于 `services/dataService.ts` 与 `constants.ts` 的内存 Mock，重启即重置。
- 无分页、无过滤参数（除 `/api/history` 的 `productId`）。
- 无鉴权、无速率限制；生产需加鉴权/缓存/分页。

## 示例请求

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/competitors
curl "http://localhost:3000/api/history?productId=TOP002"
```
