# Android 安装包构建任务

## 任务 1: 检查并配置 Expo 项目
- [ ] 检查 apps/mobile/app.json 配置
- [ ] 确认 Android applicationId 设置
- [ ] 检查 Android 图标配置（包括自适应图标）
- [ ] 验证版本号和 versionCode

## 任务 2: 配置 EAS Build
- [ ] 检查 eas.json 配置文件
- [ ] 添加/更新 preview 构建配置（生成 APK）
- [ ] 添加/更新 production 构建配置（生成 AAB）
- [ ] 确认 EAS CLI 已安装

## 任务 3: 配置 Android 签名
- [ ] 生成 Android 签名密钥库（keystore）
- [ ] 配置签名密钥信息到 EAS
- [ ] 验证签名配置正确

## 任务 4: 执行 Android 构建
- [ ] 运行 eas build --platform android --profile preview
- [ ] 监控构建进度
- [ ] 获取构建完成的 APK 文件下载链接

## 任务 5: 验证安装
- [ ] 下载 APK 文件
- [ ] 在 Android 设备上安装测试
- [ ] 验证应用正常运行

# 任务依赖关系
- 任务 2 依赖 任务 1
- 任务 4 依赖 任务 2 和 任务 3
- 任务 5 依赖 任务 4
