# iOS / iPad / iPhone 打包与签名指南

「拼音小勇士」的 iOS 构建已经全自动跑通（GitHub Actions 的 macOS runner + Xcode + CocoaPods），
但产出**可安装到真机的包**需要 Apple 签名。本文件说明两条路：免费 Apple ID 侧载、付费开发者签名。

## 现状

- Release 中的 `PinyinWarrior-iOS-unsigned.ipa` 是**未签名**包，不能直接安装。
- 构建链路（`build-ios.yml`）已验证：`npm ci → vite build → cap sync ios → pod install → xcodebuild`。
- 语音识别插件（`@capacitor-community/speech-recognition`）在 iOS 走 `SFSpeechRecognizer`，需联网。

## 方案 A：免费 Apple ID 侧载（无需付费，7 天有效）

适合个人自用。用你的 Apple ID 给未签名 IPA 重签名后安装：

1. 下载 `PinyinWarrior-iOS-unsigned.ipa`。
2. 用 **Sideloadly**（macOS/Windows，https://sideloadly.io/）或 **AltStore**（https://altstore.io/）打开它。
3. 登录你的 Apple ID（免费账号即可），选择设备，安装。
4. 手机「设置 → 通用 → VPN 与设备管理」里信任你的开发者证书。

限制：免费账号签名 **7 天过期**、同时最多 **3 个 App**，到期需重装。

## 方案 B：付费 Apple Developer 签名（永久，99 美元/年）

产出可直接安装、长期有效的 IPA（或上传 TestFlight / App Store）。

### 1. 准备证书与描述文件

在 Apple Developer 后台（developer.apple.com）完成：

- 创建一个 **iOS Distribution 证书**（导出为 `.p12`，记下密码）。
- 在 App ID 注册 `com.kaishui.pinyingame`，勾选 Speech Recognition 能力。
- 创建 **App Store / Ad Hoc 描述文件**（`.mobileprovision`），关联你的设备或 App Store。

### 2. 配置仓库 Secrets

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret 名 | 内容 |
|-----------|------|
| `BUILD_CERTIFICATE_BASE64` | `base64 -i cert.p12 | tr -d '\n'` |
| `P12_PASSWORD` | 证书密码 |
| `BUILD_PROVISION_PROFILE_BASE64` | `base64 -i profile.mobileprovision | tr -d '\n'` |
| `KEYCHAIN_PASSWORD` | 临时钥匙串密码（自定义） |

### 3. 触发签名构建

仓库 Actions → Build iOS → Run workflow → 勾选「是否签名」→ Run。

工作流会自动：导入证书 → 归档 → 导出 IPA → 上传 artifact 并（tag 触发时）挂到 release。

> 提示：`ios/App/ExportOptions.plist` 目前 `method = app-store-connect`；
> 若要打 Ad Hoc（限注册设备）请改为 `ad-hoc`。

## 本地（macOS + Xcode）手动打包

```bash
npm install && npm run build
npx cap sync ios
cd ios/App && pod install
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -sdk iphoneos -archivePath build/App.xcarchive archive
# 导出 IPA（需在 Xcode 里配置好签名 Team 与描述文件）
```
