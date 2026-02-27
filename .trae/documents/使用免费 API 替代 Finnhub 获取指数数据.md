# 使用免费 API 替代 Finnhub 获取指数数据

## 问题分析
当前使用的 Finnhub API 免费版本无法获取指数数据（返回全零或错误信息），需要付费订阅才能访问 CFD 指数数据。

## 解决方案
创建 Yahoo Finance API 和 Alpha Vantage API 服务，并在指数管理页面上添加选择功能，让用户可以二选一使用不同的免费 API 获取指数数据。

## 实施计划

### 步骤 1：创建 Yahoo Finance API 服务文件
- 创建 `yahoo-finance-free.service.ts` 文件
- 实现与当前 `finnhub.service.ts` 相同的接口
- 配置 API 调用参数和错误处理
- 测试能否成功获取指数数据

### 步骤 2：创建 Alpha Vantage API 服务文件
- 创建 `alpha-vantage.service.ts` 文件
- 实现与当前 `finnhub.service.ts` 相同的接口
- 配置 API 调用参数和错误处理（注意：免费版有 5 次/分钟的调用限制）
- 测试能否成功获取指数数据

### 步骤 3：修改 index-management.tsx 文件
- 添加 API 选择功能（Yahoo Finance 或 Alpha Vantage）
- 更新导入语句，根据用户选择使用相应的 API 服务
- 确保数据源配置正确
- 添加 API 选择的 UI 组件

### 步骤 4：更新数据源配置
- 在数据源选项中添加 Yahoo Finance 和 Alpha Vantage
- 更新相关的映射和显示逻辑

### 步骤 5：测试 API 连接和数据获取
- 测试两个 API 是否能够成功获取指数数据
- 验证数据格式是否正确
- 确保错误处理逻辑正常工作
- 测试 API 选择功能是否正常

### 步骤 6：更新配置和文档
- 更新相关配置文件
- 确保代码注释和文档保持最新

## 预期结果
- 能够使用免费 API 获取指数数据
- 指数值不再为零，显示真实的市场数据
- 用户可以在指数管理页面上选择使用 Yahoo Finance 或 Alpha Vantage API
- 系统运行稳定，无错误信息

## 备选方案
如果新的 API 仍然存在限制，可以保留当前的模拟数据机制作为备用方案，确保即使 API 失败也能显示有意义的数据。