# 极光资管 (Aurora Capital) 全栈系统需求规格说明书 (V5.2)

## 1. 项目综述

### 1.1 项目背景
"极光资管 (Aurora Capital)" 是一款专业的离岸基金管理平台。系统定位为 B2C 金融服务工具，连接盈透证券 (IBKR) 的真实底层数据与雅虎财经行情，为观察员、正式客户及合伙人提供全方位的资产管理、行情监控及资讯服务。

### 1.2 核心设计原则
- **多端一致性** : Web 端（PC/平板）与 App 端在功能逻辑、资产数据及内容展示上保持 100% 同步。
- **金融级安全性** : 采用严密的 RLS (行级安全) 与全链路操作审计，确保客户资产隐私与合规。
- **增长驱动** : 以邀请码为核心的推荐体系，支持合伙人通过专属驾驶舱进行高效获客与资产监控。
- **全栈 TypeScript** : 全局使用 TypeScript 生态，并针对 Vercel Serverless 环境进行优化。

### 1.3 技术栈与托管
- **后端** : Supabase (DB, Auth, Realtime, Storage)。
- **中间层/API** : Next.js API Routes (Serverless Functions)。
- **管理后台** : React + Refine (部署于 Vercel)。
- **用户 Web 端** : Next.js 14 (部署于 Vercel)。
- **移动端** : React Native (Expo)。
- **数据同步** : Vercel Cron Jobs + Supabase Edge Functions。

## 2. 任务 A：数据库与安全 (Supabase SQL)

### 2.1 核心数据模型 (Schema)
- **Profiles (用户资料)** : 存储角色 (Admin, Partner, User, Guest)、推荐关系 (invited_by)、KYC 状态及资产统计。
- **Invite Codes (邀请码管理)** : 存储码值、关联合伙人、使用限制及有效期。
- **Funds (基金产品)** : 存储净值 (NAV)、营销标签、风险等级及图表所需的 marketing_json。
- **User Positions (持仓明细)** : 存储用户持有的基金份额、平均成本。
- **Transaction Logs (交易流水)** : 记录所有手动调仓、申购、赎回的历史变动，包含操作人 ID。
- **System Config (系统配置)** : 存储全局主题样式（主色调、Logo URL、多语言开关、公告）。
- **Audit Logs (审计日志)** : 记录管理员的所有敏感操作轨迹。

### 2.2 关键逻辑实现 (RPC)
- **check_and_use_invite_code(code)** : 注册时强校验邀请码，验证通过后建立层级绑定。
- **admin_adjust_position()** : 管理员调仓接口，必须联动写入流水日志。

## 3. 任务 B：数据同步逻辑 (Serverless 适配版)

由于部署于 Vercel 环境，取消传统的常驻 Worker 进程，改为 Serverless 任务模式：

### 3.1 盈透证券 (IBKR) 同步 (Vercel Cron)
- **定时触发** : 通过 vercel.json 配置每日 Cron 任务，触发特定的 API Route。
- **逻辑** : 呼叫 IBKR Flex API 获取数据，校验 10% 异常波动，更新 Supabase 数据。

### 3.2 实时指数同步 (Yahoo Finance)
- **实时策略** : 由于 Serverless 无法维持长连接，改为由 Supabase Edge Functions 或 Vercel Edge Functions 定时触发更新（或在前端用户访问时按需刷新缓存）。
- **标的** : ^IXIC (纳指), ^GSPC (标普500), ^DJI (道指)。

## 4. 任务 C：Web 管理后台 (React/Refine)

### 4.1 核心功能模块
- **仪表盘 (Dashboard)** : 全局 KPI、连接监控（展示最近同步成功的时间戳）、转化分析漏斗。
- **用户中心** : 客户管理、合伙人管理（业绩返佣、下级穿透）。
- **邀请码管理** : 独立模块，支持批量生成、有效性统计。
- **资管中心** : 持仓管理（以客户为中心调仓）、产品管理（营销信息编辑）、盈透配置。
- **内容运营** : Markdown 内参发布、实时快讯。
- **系统设置** : 多主题式样定制、全局参数配置。

## 5. 任务 D：移动端 App (React Native / Expo)

### 5.1 注册与登录
- **起始页** : 广告 Banner + 三按钮布局（注册/登录/观察员）+ 中英文切换。
- **注册流** : 强制邀请码验证。

### 5.2 角色视图与体验
- **观察员模式** : 资产区域高斯模糊。
- **多主题渲染** : 动态拉取 Vercel 托管的系统配置进行 UI 渲染。

## 6. 用户网页端 (Next.js PC 与平板桌面版)

### 6.1 视觉与响应式设计
- **Vercel 部署优化** : 利用 Next.js 的图片优化 (next/image) 和静态生成 (ISR) 提高访问速度。
- **响应式** : 适配 PC 宽屏与 iPad 等平板桌面触控体验。
- **高斯模糊同步** : 与 App 逻辑一致，根据权限状态动态模糊资产数据。

## 7. 部署与 CI/CD (Vercel 专项)

### 7.1 环境管理
- **环境变量** : 在 Vercel 控制台配置 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IBKR_FLEX_TOKEN 等。
- **Preview Deployments** : 开启 GitHub 联动，每个 PR 自动生成预览环境。

### 7.2 性能优化
- **Edge Runtime** : 关键行情接口使用 Edge Runtime 降低响应延迟。
- **缓存策略** : 对非实时资讯文章使用静态预渲染 (SSG)，减少对 Supabase 的直接查询频率。

## 8. 未来扩展 (Roadmap)
- **KYC 自动审核** : 集成护照/证件扫描 API。
- **多币种换算** : 支持 USD/HKD/CNY 实时汇率切换显示。
- **AI 投资顾问** : 接入 Gemini API 生成投资周报。
