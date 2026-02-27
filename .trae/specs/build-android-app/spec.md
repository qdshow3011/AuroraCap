# Android 安装包构建规范

## 背景说明
需要将 mobile 应用构建为 Android APK 安装包，使应用可以在 Android 设备上直接安装和运行。

## 变更内容

### 1. Expo 项目配置
- 配置 app.json 添加 Android 构建相关配置
- 设置 applicationId 和版本号
- 配置 Android 图标和启动图

### 2. Android 签名配置
- 生成 Android 签名密钥库（keystore）
- 配置签名密钥信息
- 设置构建签名配置

### 3. EAS Build 配置
- 安装和配置 EAS CLI
- 配置 eas.json 构建配置文件
- 设置 Android 构建渠道

### 4. 构建流程
- 使用 EAS Build 进行云端构建
- 生成 APK 或 AAB 安装包
- 提供下载链接

## 影响范围

### 受影响的功能模块
- mobile 应用构建流程
- Android 应用签名和打包

### 受影响的代码文件
- apps/mobile/app.json - Expo 配置文件
- apps/mobile/eas.json - EAS 构建配置
- apps/mobile/package.json - 依赖配置

## 新增需求规范

### 需求：配置 Android 构建环境

#### 场景：配置 Expo 项目
- **当** 配置 app.json 文件
- **则** 包含 Android 平台配置，包括 applicationId、versionCode、icon、adaptiveIcon 等

#### 场景：配置 EAS Build
- **当** 配置 eas.json 文件
- **则** 包含 preview 和 production 构建配置，支持 Android APK 构建

### 需求：执行 Android 构建

#### 场景：构建 APK 安装包
- **当** 运行 eas build --platform android --profile preview
- **则** 成功生成 APK 文件并提供下载链接

#### 场景：安装到 Android 设备
- **当** 下载 APK 文件到 Android 设备
- **则** 可以安装并运行应用

## 技术实现注意事项

1. Android 构建不需要付费开发者账号
2. 需要生成签名密钥库用于发布构建
3. APK 可以直接安装，AAB 需要上传到 Google Play
4. 支持 Android 5.0 (API 21) 及以上版本
5. 需要配置自适应图标（Adaptive Icon）以支持 Android 8.0+
