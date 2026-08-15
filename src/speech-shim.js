// 语音识别 + 语音合成适配层：
// - 原生环境（安卓 / iOS，通过 Capacitor）：
//   · 识别用 @capacitor-community/speech-recognition（iOS SFSpeechRecognizer / 安卓 SpeechRecognizer）
//   · 合成用 @capacitor-community/text-to-speech（安卓 WebView 不支持 speechSynthesis）
//   两者都模拟成 Web API，主程序无需分支。
// - 网页环境：不做任何事，主程序用浏览器原生 SpeechRecognition / speechSynthesis。
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
  window.__SPEECH_NATIVE__ = true;

  // ---- 原生 TTS（中文女声语速稍慢）----
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

  // ---- 原生语音识别 ----
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
      // 优先系统语音对话框（安卓最可靠）；若设备没有系统语音 UI（无 Google 语音界面）则回退后台监听
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

  window.SpeechRecognition = NativeSpeechRecognition;
}
