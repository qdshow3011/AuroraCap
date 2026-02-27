# iOS 临时安装 App 构建规范

## 背景说明

需要将 mobile 应用构建为 iOS 临时安装包（Ad Hoc Distribution），使应用可以在未上架 App Store 的情况下安装到指定 iOS 设备上进行测试。

## 变更内容

### 1. Expo 项目配置

* 配置 app.json 添加 iOS 构建相关配置

* 设置 bundle identifier 和版本号

* 配置 iOS 图标和启动图

### 2. iOS 证书和描述文件

* 需要 Apple Developer 账号（个人或企业）

* 生成 iOS Distribution 证书

* 创建 Ad Hoc 描述文件（Provisioning Profile）

* 注册测试设备 UDID

### 3. EAS Build 配置

* 安装和配置 EAS CLI

* 配置 eas.json 构建配置文件

* 设置 Ad Hoc 构建渠道

### 4. 构建流程

* 使用 EAS Build 进行云端构建

* 生成 .ipa 安装包

* 提供安装方式（TestFlight 或 OTA 安装）

## 影响范围

### 受影响的功能模块

* mobile 应用构建流程

* iOS 应用签名和分发

### 受影响的代码文件

* apps/mobile/app.json - Expo 配置文件

* apps/mobile/eas.json - EAS 构建配置

* apps/mobile/package.json - 依赖配置

## 新增需求规范

### 需求：配置 iOS 构建环境

#### 场景：配置 Expo 项目

* **当** 配置 app.json 文件

* **则** 包含 iOS 平台配置，包括 bundleIdentifier、buildNumber、icon、splash 等

#### 场景：配置 EAS Build

* **当** 配置 eas.json 文件

* **则** 包含 preview 和 production 构建配置，支持 Ad Hoc 分发

### 需求：执行 iOS 构建

#### 场景：构建 Ad Hoc 安装包

* **当** 运行 eas build --platform ios --profile preview

* **则** 成功生成 .ipa 文件并提供下载链接

#### 场景：安装到测试设备

* **当** 使用生成的安装链接或二维码

* **则** 可以在已注册 UDID 的 iOS 设备上安装应用

## 技术实现注意事项

1. 需要有效的 Apple Developer 账号（年费 $99）
2. 需要 macOS 环境进行本地构建，或使用 EAS 云服务
3. Ad Hoc 分发最多支持 100 台测试设备
4. 测试设备需要提前注册 UDID
5. 描述文件和证书有效期为一年，需要定期更新

