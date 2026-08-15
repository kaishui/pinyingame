// 讯飞语音听写（IAT）WebSocket 客户端 —— 网页版语音识别（国内可用）
// 认证：HMAC-SHA256 签名；音频：16kHz / 16bit / 单声道 PCM。
// 模拟 Web Speech Recognition 接口（onresult/onerror/onend），供主程序无侵入使用。
//
// 密钥从环境变量读取（.env，已被 .gitignore 忽略，不提交到仓库）：
//   VITE_XF_APPID / VITE_XF_APIKEY / VITE_XF_APISECRET
// 说明：Vite 会在构建时把 VITE_* 变量内联进前端包，正式公开上线仍建议由后端代理持有密钥。

const APP_ID = import.meta.env.VITE_XF_APPID || '';
const API_KEY = import.meta.env.VITE_XF_APIKEY || '';
const API_SECRET = import.meta.env.VITE_XF_APISECRET || '';
const HOST = 'iat-api.xfyun.cn';
const WS_URL = 'wss://' + HOST + '/v2/iat';

async function xfAuthUrl() {
  const date = new Date().toUTCString();
  const signatureOrigin = 'host: ' + HOST + '\ndate: ' + date + '\nGET /v2/iat HTTP/1.1';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureOrigin));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  const authOrigin = 'api_key="' + API_KEY + '", algorithm="hmac-sha256", headers="host date request-line", signature="' + signature + '"';
  const authorization = btoa(authOrigin);
  return WS_URL + '?authorization=' + encodeURIComponent(authorization) +
    '&date=' + encodeURIComponent(date) + '&host=' + HOST;
}

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return out;
}

// 讯飞 IAT 二进制帧：首字节 status（0=首帧 1=中间帧 2=末帧）+ 小端 Int16 PCM
function buildFrame(status, int16) {
  const bytes = new Uint8Array(1 + int16.length * 2);
  bytes[0] = status;
  for (let i = 0; i < int16.length; i++) {
    const v = int16[i];
    bytes[1 + i * 2] = v & 0xff;
    bytes[2 + i * 2] = (v >> 8) & 0xff;
  }
  return bytes.buffer;
}

export class XunfeiSpeechRecognition {
  constructor() {
    this.lang = 'zh-CN';
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 5;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
    this._ws = null;
    this._stream = null;
    this._ctx = null;
    this._processor = null;
    this._text = '';
    this._finished = false;
  }

  async start() {
    this._finished = false;
    this._text = '';
    if (this.onstart) this.onstart();
    try {
      if (!APP_ID || !API_KEY || !API_SECRET) { this._fail('not-available'); return; }
      if (!window.crypto || !crypto.subtle) { this._fail('not-available'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._stream = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      this._ctx = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      this._processor = processor;

      const url = await xfAuthUrl();
      const ws = new WebSocket(url);
      this._ws = ws;
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        const lang = (window.__SPEECH_LANG__ === 'en-US' || this.lang === 'en-US') ? 'en_us' : 'zh_cn';
        const business = { language: lang, domain: 'iat' };
        if (lang === 'zh_cn') business.accent = 'mandarin';
        ws.send(JSON.stringify({ common: { app_id: APP_ID }, business }));
      };
      ws.onmessage = (e) => this._onMessage(e.data);
      ws.onerror = () => this._fail('network');
      ws.onclose = () => this._onClose();

      let hasSpeech = false;
      let silent = 0;
      let buffers = 0;
      let firstSent = false;
      let ended = false;

      processor.onaudioprocess = (e) => {
        if (ended) return;
        const input = e.inputBuffer.getChannelData(0);
        const int16 = floatTo16BitPCM(input);
        let sum = 0;
        for (let i = 0; i < int16.length; i++) sum += int16[i] * int16[i];
        const rms = Math.sqrt(sum / int16.length);
        if (rms > 350) { hasSpeech = true; silent = 0; }
        else if (hasSpeech) { silent++; }

        const CHUNK = 640; // 40ms
        for (let i = 0; i < int16.length; i += CHUNK) {
          const slice = int16.subarray(i, Math.min(i + CHUNK, int16.length));
          const status = firstSent ? 1 : 0;
          firstSent = true;
          if (ws.readyState === 1) ws.send(buildFrame(status, slice));
        }
        buffers++;
        // 静音约 2 秒或最长约 10 秒后结束
        if ((hasSpeech && silent >= 8) || buffers >= 40) {
          ended = true;
          if (ws.readyState === 1) ws.send(buildFrame(2, new Int16Array(0)));
        }
      };
      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (e) {
      this._fail('audio-capture');
    }
  }

  _onMessage(raw) {
    try {
      const msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
      if (msg.code === 10163) { this._fail('no-speech'); return; }
      if (msg.code !== 0) { this._fail('network'); return; }
      const data = msg.data;
      if (data && data.result && data.result.ws) {
        data.result.ws.forEach((w) => (w.cw || []).forEach((cw) => { this._text += cw.w; }));
      }
      if (data && data.status === 2) this._finish();
    } catch (e) { /* 忽略无法解析的帧 */ }
  }

  _onClose() {
    if (!this._finished) {
      if (this._text.trim()) this._finish();
      else this._fail('no-speech');
    }
  }

  _finish() {
    if (this._finished) return;
    this._finished = true;
    this._cleanup();
    const t = this._text.trim();
    if (t) {
      if (this.onresult) this.onresult({ results: [[{ transcript: t }]] });
      if (this.onend) this.onend();
    } else {
      this._fail('no-speech');
    }
  }

  _fail(code) {
    if (this._finished) return;
    this._finished = true;
    this._cleanup();
    if (this.onerror) this.onerror({ error: code });
    if (this.onend) this.onend();
  }

  _cleanup() {
    try { this._ws && this._ws.close(); } catch (e) {}
    try { this._processor && this._processor.disconnect(); } catch (e) {}
    try { this._ctx && this._ctx.close(); } catch (e) {}
    try { this._stream && this._stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    this._ws = null; this._processor = null; this._ctx = null; this._stream = null;
  }

  stop() {
    this._cleanup();
    if (this.onend) this.onend();
  }

  abort() {
    this.stop();
  }
}
