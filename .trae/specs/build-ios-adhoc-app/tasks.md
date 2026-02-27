# iOS 临时安装 App 构建任务

## 任务 1: 检查并配置 Expo 项目
- [ ] 检查 apps/mobile/app.json 配置
- [ ] 确认 iOS bundleIdentifier 设置
- [ ] 检查 iOS 图标配置
- [ ] 验证版本号和构建号

## 任务 2: 配置 EAS Build
- [ ] 检查 eas.json 配置文件
- [ ] 添加/更新 preview 构建配置（Ad Hoc）
- [ ] 添加/更新 production 构建配置
- [ ] 确认 EAS CLI 已安装

## 任务 3: 配置 Apple Developer 证书
- [ ] 检查 Apple Developer 账号权限
- [ ] 生成或更新 iOS Distribution 证书
- [ ] 创建 Ad Hoc Provisioning Profile
- [ ] 注册测试设备 UDID

## 任务 4: 执行 iOS 构建
- [ ] 运行 eas build --platform ios --profile preview
- [ ] 监控构建进度
- [ ] 获取构建完成的 .ipa 文件下载链接

## 任务 5: 验证安装
- [ ] 提供安装二维码或链接
- [ ] 在已注册设备上测试安装
- [ ] 验证应用正常运行

# 任务依赖关系
- 任务 2 依赖 任务 1
- 任务 4 依赖 任务 2 和 任务 3
- 任务 5 依赖 任务 4
