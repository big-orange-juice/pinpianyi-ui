# 拼便宜 UI 后端 API 对接清单（按页面/功能分类）

> 目标：按“页面 → 功能”把所有需要对接的 API 用表格列清楚（method / 参数 / 返回 / 对应页面功能），并标注“已实现 Demo / 建议新增”。

## 通用约定

- Base URL（本地开发）：`http://localhost:3000`
- Content-Type：`application/json; charset=utf-8`
- 通用错误：`{ "error": string }`
- 分页：Query `page`（从 1 开始）、`pageSize`；返回 `{ "items": T[], "total": number }`
- 时间：ISO-8601 字符串

工作台标签（确认管理）：

- 接口枚举：`important | normal | replacement`
- 展示文案：重点 / 正常 / 替代品（前端映射；如需后端返回中文可选加 `tagText`）

---

## 页面：`/` 仪表盘

| 页面功能                       | API                     | Method | 参数（Query/Body）                                                           | 返回（成功）                                                                                                  | 当前实现                         |
| ------------------------------ | ----------------------- | ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 商品列表（筛选条件来源/搜索）  | `/api/products`         | GET    | Query（建议）：`category?` `brand?` `tag?` `search?` `page?` `pageSize?`     | Demo：`Product[]`；建议上线：`{ items: Product[], total }`                                                    | ✅ 已实现 Demo（仅 `Product[]`） |
| 竞品报价（按我方 SKU 分组）    | `/api/competitors`      | GET    | Query（建议）：`productIds?` `platform?` `region?`                           | Demo：`Record<productId, CompetitorData[]>`                                                                   | ✅ 已实现 Demo                   |
| 单商品历史曲线                 | `/api/history`          | GET    | Query：`productId?`（默认 `TOP001`）                                         | `{ data: ChartDataPoint[], name: string }`                                                                    | ✅ 已实现 Demo                   |
| KPI 汇总（倒挂/劣势/预计损失） | `/api/dashboard/kpis`   | GET    | Query（建议）：`region?` `platform?` `tag?` `category?` `brand?` `viewMode?` | `DashboardKpis`（示例：`{ inversionCount, priceDisadvantageCount, priceAdvantageCount, totalEstDailyLoss }`） | ➕ 建议新增                      |
| 预警列表（分页/排序）          | `/api/alerts`           | GET    | Query（建议）：同上 + `sort?` `page?` `pageSize?`                            | `{ items: AlertItem[], total }`                                                                               | ➕ 建议新增                      |
| 特别关注/重点监控（持久化）    | `/api/user/preferences` | GET    | 无                                                                           | `{ monitoredProductIds: string[], specialAttentionIds: string[] }`                                            | ➕ 建议新增                      |
| 特别关注/重点监控（保存）      | `/api/user/preferences` | PUT    | Body：`{ monitoredProductIds: string[], specialAttentionIds: string[] }`     | 同上                                                                                                          | ➕ 建议新增                      |

---

## 页面：`/analysis` 价盘分析矩阵

| 页面功能                             | API                     | Method | 参数（Query/Body）                                                                                                                      | 返回（成功）                                                      | 当前实现                 |
| ------------------------------------ | ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| 矩阵数据（过滤/分页；平台=ALL 聚合） | `/api/analysis/matrix`  | GET    | Query（建议）：`region?` `platform?` `category?` `brand?` `activityType?` `priceStatus?` `search?` `costThreshold?` `page?` `pageSize?` | `{ mode: "AGGREGATED"\|"DETAILED", items: any[], total: number }` | ➕ 建议新增              |
| 导出 CSV（大数据量）                 | `/api/analysis/export`  | GET    | Query：同上                                                                                                                             | `text/csv` 或 `{ downloadUrl }`                                   | ➕ 建议新增              |
| 生成经营研报（可接 LLM）             | `/api/reports/generate` | POST   | Body：`{ region, platform, filters, costThreshold }`                                                                                    | `AnalysisReport`                                                  | ➕ 建议新增              |
| 依赖：商品基础数据                   | `/api/products`         | GET    | 同“仪表盘-商品列表”                                                                                                                     | `Product[]` / `{items,total}`                                     | ✅ 已实现 Demo（可复用） |
| 依赖：竞品基础数据                   | `/api/competitors`      | GET    | 同“仪表盘-竞品报价”                                                                                                                     | `Record<productId, CompetitorData[]>`                             | ✅ 已实现 Demo（可复用） |

---

## 页面：`/config` 竞对策略配置

| 页面功能                  | API                          | Method | 参数（Query/Body）              | 返回（成功）                           | 当前实现                                                  |
| ------------------------- | ---------------------------- | ------ | ------------------------------- | -------------------------------------- | --------------------------------------------------------- | ----------- |
| 规则列表（按类目/按 SKU） | `/api/strategy-rules`        | GET    | Query：`targetType=CATEGORY     | SKU`                                   | `{ items: AnalysisRule[], total }`（或 `AnalysisRule[]`） | ➕ 建议新增 |
| 新增规则                  | `/api/strategy-rules`        | POST   | Body：`AnalysisRule`（不含 id） | `AnalysisRule`（含 id）                | ➕ 建议新增                                               |
| 更新规则                  | `/api/strategy-rules/:id`    | PUT    | Body：`Partial<AnalysisRule>`   | `AnalysisRule`                         | ➕ 建议新增                                               |
| 删除规则                  | `/api/strategy-rules/:id`    | DELETE | 无                              | `{ success: true }`                    | ➕ 建议新增                                               |
| 导入规则                  | `/api/strategy-rules/import` | POST   | 文件（multipart）或 Body 文本   | `{ successCount, failCount, errors? }` | ➕ 建议新增                                               |
| 导出规则                  | `/api/strategy-rules/export` | GET    | Query（可选）：`targetType?`    | 文件流 或 `{ downloadUrl }`            | ➕ 建议新增                                               |

---

## 页面：`/data` 数据采集配置

| 页面功能                       | API                                   | Method | 参数（Query/Body）                                   | 返回（成功）                                              | 当前实现                           |
| ------------------------------ | ------------------------------------- | ------ | ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------- | ----------- |
| 平台列表（读取）               | `/api/data/platforms`                 | GET    | 无                                                   | `{ items: PlatformMeta[], total }`（或 `PlatformMeta[]`） | ➕ 建议新增                        |
| 平台新增                       | `/api/data/platforms`                 | POST   | Body：`{ name: string, ... }`                        | `PlatformMeta`                                            | ➕ 建议新增                        |
| 字段列表（按平台+状态）        | `/api/data/fields`                    | GET    | Query：`platform` `status=PENDING_REVIEW             | MAPPED` `page?` `pageSize?`                               | `{ items: CrawlerField[], total }` | ➕ 建议新增 |
| 触发扫描/发现新字段            | `/api/data/scan`                      | POST   | Body：`{ platform: string }`                         | `{ newFields: CrawlerField[] }`                           | ➕ 建议新增                        |
| 确认映射（审核通过）           | `/api/data/fields/:key/confirm`       | PUT    | Body：`{ platform, localField, label, description }` | `CrawlerField`（mappingStatus=MAPPED）                    | ➕ 建议新增                        |
| 新增映射字段                   | `/api/data/fields`                    | POST   | Body：`CrawlerField`（或最小字段）                   | `CrawlerField`                                            | ➕ 建议新增                        |
| 编辑映射字段                   | `/api/data/fields/:key`               | PUT    | Body：`Partial<CrawlerField>`                        | `CrawlerField`                                            | ➕ 建议新增                        |
| 删除映射字段                   | `/api/data/fields/:key`               | DELETE | Query：`platform`                                    | `{ success: true }`                                       | ➕ 建议新增                        |
| 重点 SKU 导入（文本解析/校验） | `/api/data/monitored-products/import` | POST   | Body：`{ text: string }`                             | `{ products: Product[], invalid: string[] }`              | ➕ 建议新增                        |
| 保存监控列表                   | `/api/data/monitored-products`        | PUT    | Body：`{ productIds: string[] }`（或直接数组）       | `{ productIds: string[] }`                                | ➕ 建议新增                        |
| 保存特别关注列表               | `/api/data/special-attention`         | PUT    | Body：`{ productIds: string[] }`（或直接数组）       | `{ productIds: string[] }`                                | ➕ 建议新增                        |

---

## 页面：`/workbench` 工作台

| 页面功能                           | API                                          | Method | 参数（Query/Body）                                            | 返回（成功）                                                           | 当前实现    |
| ---------------------------------- | -------------------------------------------- | ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| 顶部统计（待确认/已关联/未关联）   | `/api/workbench/stats`                       | GET    | Query（建议）：`region?` `platform?`                          | `{ pendingCount: number, linkedCount: number, unlinkedCount: number }` | ➕ 建议新增 |
| 待确认商品列表（搜索/优先级/分页） | `/api/workbench/pending-matches`             | GET    | Query（建议）：`q?` `priority?` `page?` `pageSize?`           | `{ items: PendingMatchDto[], total }`                                  | ➕ 建议新增 |
| 确认管理（选择标签并完成关联）     | `/api/workbench/pending-matches/:id/confirm` | POST   | Body：`{ selectedCandidateSkuId: string, tag: WorkbenchTag }` | `{ linkedId: string, tag: WorkbenchTag }`                              | ➕ 建议新增 |
| 已关联列表（搜索/标签/分页）       | `/api/workbench/linked`                      | GET    | Query（建议）：`q?` `tag?` `page?` `pageSize?`                | `{ items: LinkedItemDto[], total }`                                    | ➕ 建议新增 |
| 修改已关联标签                     | `/api/workbench/linked/:id/tag`              | PATCH  | Body：`{ tag: WorkbenchTag }`                                 | `LinkedItemDto`                                                        | ➕ 建议新增 |
| 取消关联                           | `/api/workbench/linked/:id`                  | DELETE | 无                                                            | `{ success: true }`                                                    | ➕ 建议新增 |
| 未关联任务列表（搜索/优先级/分页） | `/api/workbench/unlinked-tasks`              | GET    | Query（建议）：`q?` `priority?` `page?` `pageSize?`           | `{ items: UnlinkedTaskDto[], total }`（或 `UnlinkedTaskDto[]`）        | ➕ 建议新增 |
| 批量导入：下载模板                 | `/api/workbench/import/template`             | GET    | 无                                                            | 文件流（xlsx）                                                         | ➕ 建议新增 |
| 批量导入：预览/校验                | `/api/workbench/import/preview`              | POST   | 文件上传（multipart）                                         | `ImportPreviewResponse`（含 `importBatchId/items/errors`）             | ➕ 建议新增 |
| 批量导入：确认入库                 | `/api/workbench/import/commit`               | POST   | Body：`{ importBatchId: string }`                             | `ImportCommitResponse`（含 `successCount/failCount/errors`）           | ➕ 建议新增 |

---

## 全局：系统设置 / 用户

| 页面功能                       | API             | Method | 参数（Query/Body）                | 返回（成功）                              | 当前实现    |
| ------------------------------ | --------------- | ------ | --------------------------------- | ----------------------------------------- | ----------- |
| 获取当前用户信息               | `/api/me`       | GET    | 无                                | `{ name, role, region, managedPlatform }` | ➕ 建议新增 |
| 获取系统参数（成本倒挂阈值等） | `/api/settings` | GET    | 无                                | `{ costThreshold: number }`               | ➕ 建议新增 |
| 更新系统参数                   | `/api/settings` | PUT    | Body：`{ costThreshold: number }` | `{ costThreshold: number }`               | ➕ 建议新增 |

---

## 全局（可选）：Agent / 通知中心

| 页面功能               | API                           | Method | 参数（Query/Body）                               | 返回（成功）                                                          | 当前实现    |
| ---------------------- | ----------------------------- | ------ | ------------------------------------------------ | --------------------------------------------------------------------- | ----------- |
| Agent 对话（建议流式） | `/api/agent/chat`             | POST   | Body：`{ sessionId, message, attachments? }`     | SSE/Chunked；或 `{ reply, sessionId }`                                | ➕ 建议新增 |
| 会话列表               | `/api/agent/sessions`         | GET    | Query（建议）：`page?` `pageSize?`               | `{ items: ChatSession[], total }`（或 `ChatSession[]`）               | ➕ 建议新增 |
| 新建会话               | `/api/agent/sessions`         | POST   | Body：`{ title? }`                               | `ChatSession`                                                         | ➕ 建议新增 |
| 加载会话详情           | `/api/agent/sessions/:id`     | GET    | 无                                               | `ChatSession`                                                         | ➕ 建议新增 |
| 通知列表               | `/api/notifications`          | GET    | Query（建议）：`page?` `pageSize?`               | `{ items: SystemNotification[], total }`（或 `SystemNotification[]`） | ➕ 建议新增 |
| 创建通知               | `/api/notifications`          | POST   | Body：`{ type, title, message, actionPayload? }` | `SystemNotification`                                                  | ➕ 建议新增 |
| 标记已读               | `/api/notifications/:id/read` | PATCH  | Body：`{}`                                       | `{ success: true }`                                                   | ➕ 建议新增 |

---

## 附：类型来源

- `Product` / `CompetitorData` / `ChartDataPoint` / `AnalysisReport` / `CrawlerField` / `ChatSession` / `SystemNotification`：见 `types.ts`
- 工作台 DTO（`PendingMatchDto` / `LinkedItemDto` / `UnlinkedTaskDto` / ImportResponse 等）：建议后端按本表的字段落库/返回，前端再做展示映射
