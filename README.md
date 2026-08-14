# 🧚‍♀️ 拼音小勇士

面向 6–9 岁小女生的拼音学习闯关游戏，卡通粉嫩主题 + 仙女小助手。
覆盖 **声母、韵母、整体认读音节**，支持 **分年级、分类型、可选难度起点**、
**音节总览表（横竖可点、四声提示）**，以及 **流利说·刷单词**（随机词库 + 小学课文，无限闯关）。

已封装为 **Capacitor 应用**（安卓 + iOS），语音识别在原生端走系统 API、在网页端走 Web Speech API。

## 快速开始（网页）

```bash
npm install

# 开发（Vite 热更新，localhost 麦克风可用）
npm run dev

# 或：构建后由极简 Node 服务器托管
npm run build
npm run serve        # http://localhost:8080
```

> 网页端语音识别（Web Speech API）需要 **Chrome / Edge** + HTTPS/localhost；
> iOS Safari 网页不支持语音识别，请用安卓或原生 App。

## 打包安卓 / iOS（Capacitor，已配置）

```bash
npm run build          # 构建网页到 dist/
npx cap sync           # 同步网页 + 插件到原生工程

# 安卓：需要 Android Studio + Android SDK
npx cap open android

# iOS：需要 macOS + Xcode；插件使用 CocoaPods，首次需 pod install
npx cap open ios
cd ios/App && pod install
```

语音识别插件：`@capacitor-community/speech-recognition`（v7）
- 安卓：系统 `SpeechRecognizer`（已声明 `RECORD_AUDIO` 权限）
- iOS：系统 `SFSpeechRecognizer`（已在 `Info.plist` 加入语音识别 + 麦克风用途说明）

适配层在 `src/speech-shim.js`：原生环境用插件并模拟 Web Speech API 接口，
网页环境继续用浏览器原生 `SpeechRecognition`，主程序逻辑无需分支。

## 功能一览

- **先听后说**：自动/点击播放标准发音（`SpeechSynthesis`，**优先女声**，语速稍慢、音调稍高）。
- **跟读闯关**：语音识别判定对错，读对得 ⭐，读错可重试。
- **分年级 / 分类型 / 难度起点**：一年级上（声母）/ 下（韵母）/ 二年级（整体认读）；轻松 / 进阶 / 高手。
- **音节总览表**：声母 × 韵母完整音节表（408 个合法音节），横点声母、竖点韵母、点格子听音节；
  顶部可切换 **一声/二声/三声/四声**，格子显示带声调拼音并朗读对应声调。
- **流利说 · 刷单词**：🎲 随机词库（无限）/ 📚 课文朗读（小学课文 & 古诗）/ 🍎 词语闯关（经典造句），均可无限续关。
- **可玩性**：过关得 ⭐ + 随机贴纸、连续答对 🏆、多样鼓励语、庆祝彩纸、音效。
- **荣誉证书**：全部通关后输入名字生成证书，可打印；进度存 `localStorage`。
- **PWA**：`manifest.webmanifest` + `sw.js` + 图标，可安装到主屏 / 离线使用。

## 项目结构

```
pinyin-warrior/
├── index.html              # Vite 入口（HTML + 内联 CSS）
├── src/main.js             # 游戏逻辑（原单文件内联 JS）
├── src/speech-shim.js      # 语音识别适配层（Web ↔ Capacitor 原生）
├── vite.config.mjs         # Vite 构建配置
├── capacitor.config.json   # Capacitor 配置（appId/webDir）
├── public/                 # 静态资源（manifest、sw.js、图标）
├── android/                # 安卓原生工程（cap add 生成）
├── ios/                    # iOS 原生工程（cap add 生成）
├── server.js               # 极简 Node 静态服务器（服务 dist/）
├── tools/make-icons.js     # PWA 图标生成脚本
└── README.md
```

## 内容覆盖

- **声母（7 关）**：b p m f / d t n l / g k h / j q x / zh ch sh r / z c s / y w
- **韵母（7 关）**：a o e / i u ü / ai ei ui / ao ou iu / ie üe er / an en in un ün / ang eng ing ong
- **整体认读音节（4 关）**：zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan yin yun ying

每个拼音搭配 2 个常用汉字/词语，配有 emoji 与带声调拼音标注。
