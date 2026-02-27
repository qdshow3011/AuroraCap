# Android 安装包构建检查清单

## 配置检查
- [ ] app.json 包含完整的 Android 配置
- [ ] applicationId 格式正确（如 com.company.appname）
- [ ] Android 图标资源已配置（包括自适应图标 foreground 和 background）
- [ ] eas.json 包含 preview 和 production 配置
- [ ] EAS CLI 已全局安装

## Android 签名配置
- [ ] Android 签名密钥库（keystore）已生成
- [ ] 密钥库密码和密钥密码已记录
- [ ] 签名配置已上传到 EAS
- [ ] 密钥库文件已安全备份

## 构建检查
- [ ] eas build 命令执行成功
- [ ] 构建日志无错误
- [ ] 成功生成 APK 文件
- [ ] 获取到有效的下载链接

## 安装验证
- [ ] APK 文件可以正常下载
- [ ] 在 Android 设备上可以安装（可能需要允许未知来源）
- [ ] 应用可以正常启动
- [ ] 核心功能运行正常
