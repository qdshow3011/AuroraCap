# iOS 临时安装 App 构建检查清单

## 配置检查
- [ ] app.json 包含完整的 iOS 配置
- [ ] bundleIdentifier 格式正确（如 com.company.appname）
- [ ] iOS 图标资源已配置（所有尺寸）
- [ ] eas.json 包含 preview 和 production 配置
- [ ] EAS CLI 已全局安装

## Apple Developer 配置
- [ ] 拥有有效的 Apple Developer 账号
- [ ] iOS Distribution 证书已生成并下载
- [ ] Ad Hoc Provisioning Profile 已创建
- [ ] 测试设备 UDID 已注册到 Apple Developer

## 构建检查
- [ ] eas build 命令执行成功
- [ ] 构建日志无错误
- [ ] 成功生成 .ipa 文件
- [ ] 获取到有效的下载链接

## 安装验证
- [ ] 可以通过链接或二维码下载
- [ ] 在已注册设备上可以安装
- [ ] 应用可以正常启动
- [ ] 核心功能运行正常
