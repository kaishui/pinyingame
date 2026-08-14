// 语音识别适配层：
// - 原生环境（安卓 / iOS，通过 Capacitor）：用 @capacitor-community/speech-recognition 插件
//   （iOS 走 SFSpeechRecognizer，安卓走系统 SpeechRecognizer），并模拟 Web Speech API 接口，
//   让主程序无需改动即可使用。
// - 网页环境：不做任何事，主程序继续使用浏览器原生 SpeechRecognition / webkitSpeechRecognition。
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
  window.__SPEECH_NATIVE__ = true;

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
      try {
        const avail = await SpeechRecognition.available();
        if (!avail.available) { this._fail('not-allowed'); return; }
        const perm = await SpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== 'granted') { this._fail('not-allowed'); return; }
      } catch (e) {
        this._fail('not-allowed');
        return;
      }
      if (this.onstart) this.onstart();
      try {
        const res = await SpeechRecognition.start({
          language: this.lang || 'zh-CN',
          maxResults: Math.min(this.maxAlternatives || 1, 5),
          partialResults: false,
          popup: false
        });
        const matches = (res && res.matches) || [];
        if (matches.length) {
          if (this.onresult) {
            this.onresult({ results: [matches.map((t) => ({ transcript: t }))] });
          }
          if (this.onend) this.onend();
        } else {
          this._fail('no-speech');
        }
      } catch (e) {
        this._fail('audio-capture');
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
