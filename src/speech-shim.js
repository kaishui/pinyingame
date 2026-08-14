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
  window.__ttsSpeak = (text, done) => {
    TextToSpeech.speak({ text, lang: 'zh-CN', rate: 0.6, pitch: 1.1, volume: 1.0 })
      .then(() => { if (done) done(); })
      .catch(() => { if (done) done(); });
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
      try {
        // popup: true 在安卓走系统语音对话框，最可靠（自动开始/结束并返回最终结果，无需手动 stop）
        const res = await SpeechRecognition.start({
          language: this.lang || 'zh-CN',
          maxResults: Math.min(this.maxAlternatives || 1, 5),
          partialResults: false,
          popup: true
        });
        const matches = (res && res.matches) || [];
        if (matches.length) {
          if (this.onresult) this.onresult({ results: [matches.map((t) => ({ transcript: t }))] });
          if (this.onend) this.onend();
        } else {
          this._fail('no-speech');
        }
      } catch (e) {
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
