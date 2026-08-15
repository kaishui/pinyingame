// 语音识别 + 语音合成适配层：
// - 原生环境（安卓 / iOS，通过 Capacitor）：
//   · 合成用 @capacitor-community/text-to-speech（安卓 WebView 不支持 speechSynthesis）
//   · 识别：
//       iOS  → @capacitor-community/speech-recognition（系统 SFSpeechRecognizer，最稳）
//       安卓 → 讯飞 WebSocket 听写（国内可用、不依赖 Google 语音，避免原生插件在无 Google 服务时闪退）
// - 网页环境：讯飞 WebSocket 听写（国内可用），替代连不上 Google 的 webkitSpeechRecognition
// 两者都模拟成 Web Speech API，主程序无需分支。
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { XunfeiSpeechRecognition } from './xfyun.js';

const isNative = !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const platform = isNative ? Capacitor.getPlatform() : 'web';

// ---- 原生 TTS（中文女声语速稍慢）----
if (isNative) {
  window.__TTS_NATIVE__ = true;
  // 预热：触发引擎异步初始化，避免首句发音被丢弃
  try { TextToSpeech.getSupportedLanguages().catch(() => {}); } catch (e) {}
  window.__ttsSpeak = (text, done, lang) => {
    const L = lang || 'zh-CN';
    const attempt = (n) => {
      TextToSpeech.speak({ text, lang: L, rate: L === 'en-US' ? 0.85 : 0.6, pitch: 1.1, volume: 1.0 })
        .then(() => { if (done) done(); })
        .catch((e) => {
          const msg = String((e && e.message) || e || '');
          // 引擎尚未就绪（异步初始化）→ 稍等后重试
          if (n < 5 && /not yet initialized|not available/i.test(msg)) {
            setTimeout(() => attempt(n + 1), 400);
          } else {
            if (done) done();
          }
        });
    };
    attempt(0);
  };
  window.__ttsStop = () => { TextToSpeech.stop().catch(() => {}); };
}

// ---- 原生语音识别（仅 iOS：系统 SFSpeechRecognizer）----
class NativeSpeechRecognition {
  constructor() {
    this.lang = 'zh-CN';
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 5;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
  }

  async start() {
    let avail;
    try { avail = await SpeechRecognition.available(); }
    catch (e) { this._fail('not-available'); return; }
    if (!avail.available) { this._fail('not-available'); return; }

    let perm;
    try { perm = await SpeechRecognition.requestPermissions(); }
    catch (e) { this._fail('not-allowed'); return; }
    if (perm.speechRecognition !== 'granted') { this._fail('not-allowed'); return; }

    if (this.onstart) this.onstart();

    const baseOpts = {
      language: window.__SPEECH_LANG__ || this.lang || 'zh-CN',
      maxResults: Math.min(this.maxAlternatives || 1, 5),
      partialResults: false
    };

    let res = null;
    // 优先系统语音对话框（iOS 最可靠）；若没有系统语音 UI 则回退后台监听
    try {
      res = await SpeechRecognition.start(Object.assign({}, baseOpts, { popup: true }));
    } catch (e) {
      const msg = String((e && e.message) || e || '');
      if (/no activity|activitynotfound|handle the intent|resolveActivity/i.test(msg)) {
        try {
          res = await SpeechRecognition.start(Object.assign({}, baseOpts, { popup: false }));
        } catch (e2) {
          this._fail('no-speech'); return;
        }
      } else {
        this._fail('no-speech'); return;
      }
    }

    const matches = (res && res.matches) || [];
    if (matches.length) {
      if (this.onresult) this.onresult({ results: [matches.map((t) => ({ transcript: t }))] });
      if (this.onend) this.onend();
    } else {
      this._fail('no-speech');
    }
  }

  _fail(code) {
    if (this.onerror) this.onerror({ error: code });
    if (this.onend) this.onend();
  }

  stop() {
    SpeechRecognition.stop().catch(() => {});
    if (this.onend) this.onend();
  }

  abort() {
    this.stop();
  }
}

// ---- 识别器选择 ----
if (platform === 'ios') {
  window.__SPEECH_NATIVE__ = true;
  window.SpeechRecognition = NativeSpeechRecognition;
} else {
  // 网页 + 安卓：讯飞语音听写（国内可用；安卓 WebView 里 getUserMedia 由 Capacitor 代理申请 RECORD_AUDIO 权限）
  window.SpeechRecognition = XunfeiSpeechRecognition;
}
