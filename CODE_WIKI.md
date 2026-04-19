# Aurora Capital 项目 Code Wiki

## 1. 项目概述

Aurora Capital 是一个金融资产管理系统，旨在为用户提供基金投资、资产管理、资讯获取等全方位金融服务。项目采用现代化的前后端分离架构，包含管理后台、移动应用和用户网站三个主要部分。

### 1.1 核心功能

- **用户管理**：客户、合伙人、管理员等多角色管理
- **资产管理**：现金余额、基金持仓、入金/出金、申购/赎回管理
- **产品管理**：基金产品的创建、编辑和管理
- **资讯中心**：金融快讯、内参文章管理和发布
- **消息系统**：系统消息、通知管理
- **合同管理**：电子合同的签署和管理
- **客服系统**：客户咨询和服务

## 2. 项目架构

### 2.1 整体架构

项目采用微服务架构，分为三个主要应用：

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Admin Panel   │      │  Mobile App     │      │   Web Portal    │
│  (React + Vite) │      │ (React Native)  │      │   (Next.js)     │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         ┌───────▼───────┐
                         │               │
                         │   Supabase    │
                         │  (Database)   │
                         │               │
                         └───────────────┘
```

### 2.2 技术栈

| 应用 | 前端框架 | 状态管理 | UI 库 | 后端服务 |
|------|---------|---------|-------|----------|
| Admin | React 18 | React Context | Ant Design 5 | Supabase |
| Mobile | React Native | React Context | 原生组件 | Supabase |
| Web | Next.js 14 | React Context | Mantine | Supabase |

## 3. 目录结构

```
├── apps/                  # 应用目录
│   ├── admin/             # 管理后台
│   ├── mobile/            # 移动应用
│   └── web/               # 用户网站
├── packages/              # 共享包
│   ├── types/             # TypeScript 类型定义
│   └── utils/             # 共享工具函数
├── services/              # 服务目录
│   └── financial-data-scraper/  # 金融数据抓取服务
├── supabase/              # Supabase 配置和迁移
│   ├── migrations/        # 数据库迁移文件
│   └── config.toml        # Supabase 配置
├── functions/             # 数据库函数
└── package.json           # 项目依赖
```

## 4. 核心模块

### 4.1 管理后台 (Admin)

管理后台是系统的核心控制中心，用于管理用户、产品、资产和资讯等。

#### 4.1.1 主要功能模块

- **用户中心**：管理注册用户、客户、合伙人、管理员等
- **资管中心**：管理现金余额、基金持仓、入金/出金、申购/赎回、产品、净值等
- **资讯中心**：管理快讯、内参文章、消息等
- **系统设置**：系统配置和管理

#### 4.1.2 关键文件

- [main.tsx](file:///workspace/apps/admin/src/main.tsx)：应用入口，包含登录逻辑和应用初始化
- [App.tsx](file:///workspace/apps/admin/src/App.tsx)：主应用组件，包含布局和导航
- [navigation.tsx](file:///workspace/apps/admin/src/config/navigation.tsx)：导航配置，定义了管理后台的路由结构

### 4.2 移动应用 (Mobile)

移动应用为用户提供便捷的移动端访问，支持基金查询、交易、资讯浏览等功能。

#### 4.2.1 主要功能模块

- **首页**：资产概览、产品推荐、资讯摘要
- **资管**：产品列表、资产状况
- **交易**：申购、赎回、交易记录
- **内参**：内参文章浏览和管理
- **我的**：个人信息、账户设置、消息中心

#### 4.2.2 关键文件

- [App.tsx](file:///workspace/apps/mobile/App.tsx)：应用入口，包含导航逻辑和状态管理
- [src/screens/](file:///workspace/apps/mobile/src/screens/)：包含所有屏幕组件
- [src/lib/supabase.ts](file:///workspace/apps/mobile/src/lib/supabase.ts)：Supabase 客户端配置

### 4.3 用户网站 (Web)

用户网站为用户提供桌面端访问，功能与移动应用类似，但针对桌面端进行了优化。

#### 4.3.1 主要功能模块

- **首页**：资产概览、产品推荐、市场资讯
- **产品中心**：基金产品列表和详情
- **交易中心**：申购、赎回操作
- **资讯中心**：金融快讯、内参文章
- **个人中心**：账户管理、交易记录

#### 4.3.2 关键文件

- [pages/](file:///workspace/apps/web/pages/)：Next.js 页面组件
- [components/](file:///workspace/apps/web/components/)：共享组件
- [lib/](file:///workspace/apps/web/lib/)：工具函数和配置

### 4.4 金融数据服务 (Financial Data Scraper)

金融数据服务负责抓取和处理金融市场数据，为系统提供实时的市场信息。

#### 4.4.1 主要功能

- 抓取金融新闻和市场数据
- 数据转换和存储
- 定时同步数据

#### 4.4.2 关键文件

- [financial-data-service.js](file:///workspace/services/financial-data-scraper/src/financial-data-service.js)：金融数据服务主文件
- [news-sync-service.js](file:///workspace/services/financial-data-scraper/src/news-sync-service.js)：新闻同步服务
- [google-finance-service.js](file:///workspace/services/financial-data-scraper/src/google-finance-service.js)：Google Finance 数据服务

## 5. 数据模型

### 5.1 核心数据表

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| users | 用户表 | id, name, email, phone, role, password |
| positions | 持仓表 | id, user_id, product_id, amount, latest_nav, current_value |
| products | 产品表 | id, product_number, name_cn, name_en, type, nav |
| deposit_withdrawal | 入金/出金表 | id, user_id, type, amount, status, created_at |
| subscription_redemption | 申购/赎回表 | id, user_id, product_id, type, amount, nav, status, created_at |
| contracts | 合同表 | id, user_id, product_id, type, status, signed_at |
| system_messages | 系统消息表 | id, title, content, audience_type, user_id |
| internal_references | 内参表 | id, title, content, category, status, created_at |
| news | 快讯表 | id, title, content, source, published_at |

### 5.2 关系图

```
users ──┬─── positions ─── products
        ├─── deposit_withdrawal
        ├─── subscription_redemption ─── products
        ├─── contracts ─── products
        └─── system_messages

internal_references
news
```

## 6. 核心 API/类/函数

### 6.1 管理后台 API

#### 6.1.1 认证相关

- **AdminLogin 组件**：管理后台登录组件，验证用户身份并检查权限
  - 位置：[main.tsx](file:///workspace/apps/admin/src/main.tsx#L38)
  - 功能：处理管理员登录逻辑，验证用户身份和权限

#### 6.1.2 导航相关

- **navigationConfig**：管理后台导航配置
  - 位置：[navigation.tsx](file:///workspace/apps/admin/src/config/navigation.tsx#L15)
  - 功能：定义管理后台的路由结构和菜单项

- **getFlattenedRoutes**：扁平化路由列表函数
  - 位置：[navigation.tsx](file:///workspace/apps/admin/src/config/navigation.tsx#L206)
  - 功能：将嵌套的导航配置转换为扁平化的路由列表

### 6.2 移动应用 API

#### 6.2.1 应用核心

- **App 组件**：移动应用主组件
  - 位置：[App.tsx](file:///workspace/apps/mobile/App.tsx)
  - 功能：管理应用状态和导航逻辑

- **fetchUserInfo**：获取用户信息函数
  - 位置：[App.tsx](file:///workspace/apps/mobile/App.tsx#L243)
  - 功能：从数据库获取用户详细信息和持仓数据

- **fetchUnreadMessagesCount**：获取未读消息数量函数
  - 位置：[App.tsx](file:///workspace/apps/mobile/App.tsx#L203)
  - 功能：计算用户的未读消息数量

### 6.3 金融数据服务 API

#### 6.3.1 数据抓取

- **FinancialDataService**：金融数据服务类
  - 位置：[financial-data-service.js](file:///workspace/services/financial-data-scraper/src/financial-data-service.js)
  - 功能：提供金融数据的抓取和处理功能

- **NewsSyncService**：新闻同步服务类
  - 位置：[news-sync-service.js](file:///workspace/services/financial-data-scraper/src/news-sync-service.js)
  - 功能：同步金融新闻数据

## 7. 依赖关系

### 7.1 核心依赖

| 依赖 | 版本 | 用途 | 应用 |
|------|------|------|------|
| @supabase/supabase-js | ^2.89.0 | 数据库和认证服务 | 所有应用 |
| react | ^18.2.0 | 前端框架 | 所有应用 |
| react-native | 0.74.5 | 移动应用框架 | Mobile |
| next | ^14.2.15 | 服务端渲染框架 | Web |
| antd | ^5.0.0 | UI 组件库 | Admin |
| @mantine/core | ^6.0.22 | UI 组件库 | Web |
| axios | ^1.13.2 | HTTP 客户端 | 所有应用 |
| expo | ^51.0.0 | React Native 工具链 | Mobile |

### 7.2 服务依赖

- **Supabase**：提供数据库、认证和存储服务
- **Google Finance API**：提供金融市场数据
- **Finnhub API**：提供金融新闻和市场数据

## 8. 项目运行方式

### 8.1 管理后台 (Admin)

1. **安装依赖**：
   ```bash
   cd apps/admin
   npm install
   ```

2. **配置环境变量**：
   - 复制 `.env.example` 为 `.env`
   - 填写 Supabase 相关配置

3. **启动开发服务器**：
   ```bash
   npm run dev
   ```

4. **构建生产版本**：
   ```bash
   npm run build
   ```

### 8.2 移动应用 (Mobile)

1. **安装依赖**：
   ```bash
   cd apps/mobile
   npm install
   ```

2. **配置环境变量**：
   - 复制 `.env.example` 为 `.env`
   - 填写 Supabase 相关配置

3. **启动开发服务器**：
   ```bash
   npm start
   ```

4. **运行在 iOS/Android**：
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

5. **构建 Web 版本**：
   ```bash
   npm run web
   ```

### 8.3 用户网站 (Web)

1. **安装依赖**：
   ```bash
   cd apps/web
   npm install
   ```

2. **配置环境变量**：
   - 复制 `.env.example` 为 `.env`
   - 填写 Supabase 相关配置

3. **启动开发服务器**：
   ```bash
   npm run dev
   ```

4. **构建生产版本**：
   ```bash
   npm run build
   ```

5. **启动生产服务器**：
   ```bash
   npm start
   ```

### 8.4 金融数据服务

1. **安装依赖**：
   ```bash
   cd services/financial-data-scraper
   npm install
   ```

2. **配置环境变量**：
   - 复制 `.env.example` 为 `.env`
   - 填写 API 密钥等配置

3. **运行服务**：
   ```bash
   npm start
   ```

## 9. 关键业务流程

### 9.1 用户登录流程

1. 用户输入手机号和密码
2. 系统验证用户身份（从数据库查询用户信息）
3. 检查用户权限（管理员或服务员角色）
4. 登录成功后进入管理后台

### 9.2 基金申购流程

1. 用户选择基金产品
2. 填写申购金额和相关信息
3. 系统验证用户资金充足性
4. 创建申购记录并更新用户持仓
5. 生成电子合同供用户签署
6. 申购成功后通知用户

### 9.3 基金赎回流程

1. 用户选择持仓的基金产品
2. 填写赎回金额和相关信息
3. 系统验证用户持仓充足性
4. 创建赎回记录并更新用户持仓
5. 赎回成功后通知用户

### 9.4 内参发布流程

1. 管理员撰写内参文章
2. 选择文章分类和发布状态
3. 系统保存内参文章
4. 发布后通知相关用户

## 10. 配置与部署

### 10.1 环境变量配置

| 变量名 | 描述 | 应用 |
|--------|------|------|
| VITE_SUPABASE_URL | Supabase 项目 URL | Admin |
| VITE_SUPABASE_ANON_KEY | Supabase 匿名访问密钥 | Admin |
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | Web |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名访问密钥 | Web |
| SUPABASE_URL | Supabase 项目 URL | Mobile |
| SUPABASE_ANON_KEY | Supabase 匿名访问密钥 | Mobile |

### 10.2 部署方式

- **管理后台**：Vercel 或其他静态网站托管服务
- **移动应用**：App Store (iOS) 和 Google Play (Android)
- **用户网站**：Vercel 或其他支持 Next.js 的托管服务
- **金融数据服务**：Cloudflare Workers 或其他 serverless 平台

## 11. 监控与维护

### 11.1 日志管理

- **前端日志**：使用 console.log 和错误边界捕获前端错误
- **后端日志**：Supabase 提供的日志功能
- **数据同步日志**：金融数据服务的同步日志

### 11.2 常见问题与解决方案

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 登录失败 | 密码错误或用户不存在 | 检查用户名和密码，确认用户权限 |
| 申购失败 | 资金不足或产品已关闭 | 检查账户余额，确认产品状态 |
| 数据同步失败 | API 密钥失效或网络问题 | 检查 API 密钥，确保网络连接正常 |
| 消息发送失败 | 数据库连接问题 | 检查数据库连接状态 |

## 12. 总结与亮点回顾

Aurora Capital 项目是一个功能完整的金融资产管理系统，具有以下亮点：

1. **多平台支持**：同时支持管理后台、移动应用和用户网站，满足不同场景的使用需求
2. **现代化技术栈**：采用 React、React Native、Next.js 等现代前端技术，提供良好的用户体验
3. **完整的金融功能**：涵盖基金申购/赎回、资产管理、资讯发布等核心金融业务
4. **灵活的权限管理**：支持多角色用户管理，满足不同权限需求
5. **实时数据同步**：通过金融数据服务，提供实时的市场资讯和数据
6. **电子合同管理**：实现了电子合同的签署和管理功能
7. **消息通知系统**：及时向用户推送重要信息和通知

项目架构清晰，代码组织合理，具有良好的可扩展性和维护性，为金融资产管理提供了一个全面、高效的解决方案。