# 金融数据抓取服务

一个强大的金融数据抓取服务，支持多种数据源和自动回退机制。

## 功能特性

- **Tiingo API 集成**：优先使用 Tiingo API 获取准确的金融数据
- **Google Finance 网页抓取**：当 API 失败时，自动回退到网页抓取
- **动态 User-Agent**：生成真实的浏览器指纹，避免被识别为爬虫
- **Cloudflare Worker 代理**：通过 Cloudflare Worker 转发请求，彻底避开 IP 封锁
- **自动重试机制**：智能重试失败的请求，提高成功率
- **RESTful API**：提供完整的 REST API 接口

## 安装

```bash
cd services/financial-data-scraper
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并配置以下变量：

```env
TIINGO_API_KEY=your_tiingo_api_key_here
CLOUDFLARE_WORKER_URL=your_cloudflare_worker_url_here
PORT=3003
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
```

### 获取 Tiingo API Key

1. 访问 https://api.tiingo.com/
2. 注册账户
3. 在 Dashboard 中获取 API Key

### 部署 Cloudflare Worker

1. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

3. 部署 Worker：
   ```bash
   cd cloudflare-worker
   wrangler deploy
   ```

4. 复制 Worker URL 到 `.env` 文件

## 使用

### 启动服务

```bash
npm start
```

开发模式（自动重启）：
```bash
npm run dev
```

### 测试服务

```bash
npm test
```

### API 端点

#### 健康检查
```bash
GET /health
```

#### 获取所有指数
```bash
GET /api/indices
```

#### 获取单个指数
```bash
GET /api/indices/:symbol
```

示例：
```bash
curl http://localhost:3003/api/indices/^GSPC
```

#### 获取指数列表
```bash
GET /api/indices/list
```

#### 同步指数数据
```bash
POST /api/indices/sync
Content-Type: application/json

{
  "symbols": ["^GSPC", "^IXIC", "^DJI"]
}
```

## 数据源优先级

1. **Tiingo API**（优先）
   - 准确度高
   - 数据完整
   - 需要有效的 API Key

2. **Google Finance 网页抓取**（回退）
   - 无需 API Key
   - 使用动态 User-Agent
   - 可能被反爬虫机制阻止

3. **Cloudflare Worker 代理**（最后回退）
   - 通过代理访问 Google Finance
   - 避免 IP 封锁
   - 需要部署 Cloudflare Worker

## 支持的指数

- ^GSPC: S&P 500
- ^IXIC: NASDAQ Composite
- ^DJI: Dow Jones Industrial Average
- ^RUT: Russell 2000
- ^TNX: 10-Year Treasury Note Yield
- ^VIX: CBOE Volatility Index
- ^FTSE: FTSE 100
- ^N225: Nikkei 225
- ^HSI: Hang Seng Index
- ^STOXX50E: EURO STOXX 50

## 响应格式

```json
{
  "success": true,
  "source": "tiingo",
  "useProxy": false,
  "count": 10,
  "data": [
    {
      "symbol": "^GSPC",
      "name": "S&P 500",
      "price": 5234.18,
      "change": 45.23,
      "change_percent": 0.87,
      "previous_close": 5188.95,
      "open": 5190.12,
      "high": 5240.56,
      "low": 5185.34,
      "volume": 2456789000,
      "timestamp": "2024-01-06T10:30:00.000Z",
      "source": "tiingo"
    }
  ],
  "timestamp": "2024-01-06T10:30:00.000Z"
}
```

## 错误处理

服务会自动处理以下错误：
- API 请求失败
- 网络超时
- 数据格式错误
- 反爬虫机制阻止

当所有数据源都失败时，返回错误信息：
```json
{
  "success": false,
  "error": "所有数据源都失败了",
  "timestamp": "2024-01-06T10:30:00.000Z"
}
```

## 日志

服务会输出详细的日志信息，包括：
- 数据源选择
- 请求状态
- 错误信息
- 重试次数

## 性能优化

- 使用 Promise.all 并行请求
- 智能重试机制
- 请求超时控制
- 缓存机制（通过 Cloudflare Worker）

## 安全性

- CORS 配置
- 请求头过滤
- 错误信息脱敏
- API Key 保护

## 故障排除

### Tiingo API 失败

检查 API Key 是否正确配置：
```bash
echo $TIINGO_API_KEY
```

### Google Finance 网页抓取失败

检查网络连接和反爬虫机制，考虑使用 Cloudflare Worker 代理。

### Cloudflare Worker 代理失败

检查 Worker URL 是否正确配置，并确保 Worker 已成功部署。

## 许可证

MIT