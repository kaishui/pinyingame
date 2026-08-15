import { LEVELS, GRADES, TYPES, DIFFS, COLS, ROWS, GROUP_CLASS, GROUP_COLOR, INITIAL_READS, FINAL_READS, Y_SPELL, W_SPELL, SYL_CHAR, TONE_CHAR, WORD_DECK, HOMO, LATIN, spellSyllable, markTone, toneCharOf } from './data-pinyin.js';
import { TEXTBOOK_DECK, CHINESE_GRADES, CHINESE_UNITS } from './data-chinese.js';
import './speech-shim.js';
import { ENGLISH_GRADES, ENGLISH_DECK } from './data-english.js';
import { MATH_GRADES, MATH_UNITS } from './data-math.js';

'use strict';

/* ============================================================
 * 四、全局状态
 * ============================================================ */
const STORE_KEY = 'pinyinWarrior.v2';
const STICKERS = ['🦄','🌈','🎀','🧁','🍓','🌸','🦋','💖','⭐','🏰','🐰','👑','🍭','🧸','✨','🌷','🍬','💜'];
let state = loadState();
let currentLevel = -1;
let currentItem = 0;
let streak = 0;
let heard = false;
let scope = { lo: 0, hi: 0, start: 0 }; // 当前闯关范围
let tableTone = 0;            // 总览表当前声调（0=原音）
let wordDeck = [];            // 刷单词卡组
let wordIndex = 0;
let wordScore = 0;
let wordStreak = 0;
let wordHeard = false;
let wordMode = 'word';        // word | text | random
let wordInfinite = false;
let currentEntry = null;      // 当前展示的词语卡

// 英语刷句子
let englishGrade = 'random';
let englishDeck = [];
let englishIndex = 0;
let englishScore = 0;
let englishStreak = 0;
let englishHeard = false;
let englishInfinite = false;
let currentEnglish = null;
// 数学选择题
let mathGrade = 'random';
let mathGradeId = 'random';
let mathUnitIdx = -1;
let mathDeck = [];
let mathIndex = 0;
let mathScore = 0;
let mathStreak = 0;
let mathInfinite = false;
let currentMath = null;
let currentMathOpts = [];
let currentMathAns = 0;

function defaultState() {
  return {
    name: '', unlocked: 0, done: {}, stars: {}, partial: null,
    stickers: [], settings: { grade: 'g1', type: 'all', difficulty: 'easy' }
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = Object.assign(defaultState(), JSON.parse(raw));
    s.settings = Object.assign(defaultState().settings, s.settings);
    return s;
  } catch (e) { return defaultState(); }
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ============================================================
 * 五、工具
 * ============================================================ */
const $ = (id) => document.getElementById(id);
const totalStars = () => Object.values(state.stars).reduce((a, b) => a + (b || 0), 0);
const doneCount = () => Object.keys(state.done).length;
const allDone = () => LEVELS.every((_, i) => state.done[i]);
const gradeOf = (i) => GRADES.find(g => i >= g.range[0] && i < g.range[1]);

function toast(msg, ms) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), ms || 2200);
}
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}
function stripTones(s) {
  return s
    .replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e').replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o').replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/ń/g, 'n').replace(/ň/g, 'n').replace(/ǹ/g, 'n')
    .replace(/ḿ/g, 'm');
}
function burstConfetti() {
  const emojis = ['🎉','⭐','🌟','✨','🎊','💛','💖','🧁','🎀','🌸'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.className = 'confetti';
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.animationDuration = (1.4 + Math.random() * 1.6) + 's';
    s.style.fontSize = (18 + Math.random() * 22) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}
const PRAISES = ['太棒了！','真厉害！','读得真标准！','你是小天才！','好棒好棒！','真了不起！','棒极了！','继续加油哦！'];
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* 根据运行环境更新语音提示（iOS 不支持网页语音识别 / 手机需 https） */
function updateSupportTips() {
  $('support-warning').hidden = !!getSR();
  const tip = $('support-tip');
  if (!getSR()) {
    tip.hidden = true;
    return;
  }
  tip.hidden = false;
  const insecure = location.protocol === 'http:' && ['localhost', '127.0.0.1'].indexOf(location.hostname) === -1;
  if (insecure) {
    tip.innerHTML = '📱 手机访问需使用 <b>HTTPS</b>（或用 localhost）。当前是 http 明文，浏览器会禁用麦克风，请改用 https 部署。';
  } else {
    tip.innerHTML = '🔊 语音识别已接入<b>讯飞</b>（国内可用）。请使用 Chrome / Edge 并<b>允许麦克风权限</b>。';
  }
}

/* ============================================================
 * 六、语音合成（优先女声）
 * ============================================================ */
let voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
function pickVoice(lang) {
  const want = (lang === 'en-US') ? /^en[-_]/i : /^zh/i;
  const list = voices.filter(v => want.test(v.lang));
  if (!list.length) return null;
  if (lang === 'en-US') return list.find(v => /en[-_]US/i.test(v.lang)) || list[0] || null;
  // 优先挑选女声（常见中文女声引擎名）
  const female = /huihui|yaoyao|xiaoxiao|meijia|tingting|sinji|shanshan|lili|female|girl|女/i;
  return list.find(v => female.test(v.name)) ||
         list.find(v => /zh[-_]CN/i.test(v.lang)) ||
         list[0] || null;
}
let speakQueue = [];
let isSpeaking = false;
function speak(text, lang) {
  if (!text) return;
  speakQueue.push({ text, lang: lang || 'zh-CN' });
  drainSpeak();
}
function drainSpeak() {
  if (isSpeaking || speakQueue.length === 0) return;
  isSpeaking = true;
  const item = speakQueue.shift();
  const text = item.text, lang = item.lang;
  let done = false;
  const finish = () => { if (done) return; done = true; isSpeaking = false; drainSpeak(); };

  // 原生 App（安卓/iOS）：用 TTS 插件（安卓 WebView 不支持 speechSynthesis）
  if (window.__TTS_NATIVE__ && window.__ttsSpeak) {
    let safety = setTimeout(() => finish(), Math.max(3000, text.length * 400 + 2500));
    try {
      window.__ttsSpeak(text, () => { clearTimeout(safety); finish(); }, lang);
    } catch (e) { clearTimeout(safety); finish(); }
    return;
  }

  // 网页：用 Web Speech API
  if (!('speechSynthesis' in window)) { finish(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.rate = lang === 'en-US' ? 0.85 : 0.7;
  u.pitch = 1.15;   // 稍高音调，更贴近女生/儿童嗓音
  u.volume = 1;
  u.onend = finish;
  u.onerror = finish;
  const watchdog = setTimeout(() => { speechSynthesis.resume(); setTimeout(finish, 600); }, 8000);
  u.addEventListener('end', () => clearTimeout(watchdog));
  u.addEventListener('error', () => clearTimeout(watchdog));
  speechSynthesis.resume();
  speechSynthesis.speak(u);
}
function stopSpeak() {
  if (window.__TTS_NATIVE__ && window.__ttsStop) { try { window.__ttsStop(); } catch (e) {} }
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
  speakQueue = [];
  isSpeaking = false;
}
function currentItemObj() { return LEVELS[currentLevel].items[currentItem]; }
function playRead() { const it = currentItemObj(); stopSpeak(); speak(it.read); }
function playWord(w) { stopSpeak(); speak(w[0]); }
function playDemo() {
  heard = true;
  updateMicHint();
  const it = currentItemObj();
  stopSpeak();
  speak(it.read);
  it.words.forEach(w => speak(w[0]));
}

/* ============================================================
 * 七、音效（Web Audio）
 * ============================================================ */
let audioCtx = null;
function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
function tone(freq, when, dur, type, vol) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.2, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(when); o.stop(when + dur);
}
function playSuccessSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.12, 0.22, 'sine', 0.22));
}
function playFailSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(220, t, 0.22, 'sine', 0.12);
  tone(174.6, t + 0.18, 0.3, 'sine', 0.12);
}

/* ============================================================
 * 八、语音识别与判定
 * ============================================================ */
function getSR() { return window.SpeechRecognition || window.webkitSpeechRecognition; }
let speechLang = 'zh-CN';
function setSpeechLang(lang) {
  speechLang = lang || 'zh-CN';
  window.__SPEECH_LANG__ = speechLang;
}
let recognition = null;
let recognizing = false;

function initRecognition() {
  const SR = getSR();
  if (!SR) return null;
  const r = new SR();
  r.lang = speechLang;
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => {
    const texts = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) texts.push(res[j].transcript);
    }
    handleResult(texts);
  };
  r.onerror = (e) => {
    recognizing = false;
    setRecording(false);
    let msg = '识别出错了，请再试一次';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') msg = '麦克风权限被拒绝，请在地址栏允许麦克风后重试';
    else if (e.error === 'no-speech') msg = '没有听清哦，请大声一点再试一次';
    else if (e.error === 'audio-capture') msg = '没有检测到麦克风设备';
    else if (e.error === 'network') msg = '语音识别需连接 Google 服务器，国内网络通常连不上；请改用安卓 App，或接入讯飞/百度等国内语音识别';
    else if (e.error === 'not-available') msg = '设备缺少语音识别服务（请确认已安装 Google 或系统语音服务）';
    else if (e.error === 'aborted') return;
    showFeedback('fail', '🎤 ' + msg);
  };
  r.onend = () => { recognizing = false; setRecording(false); };
  return r;
}

function judge(item, raw) {
  let t = String(raw || '').toLowerCase();
  t = t.replace(/[\s\u3000，。！？、,.!?~～\-—_"'“”‘’()（）\[\]【】《》<>:：;；]/g, '');
  if (!t) return false;
  const tLatin = stripTones(t);
  const chars = new Set();
  (HOMO[item.py] || '').split('').forEach(c => chars.add(c));
  if (item.read) item.read.split('').forEach(c => chars.add(c));
  (item.words || []).forEach(([h]) => { h.split('').forEach(c => chars.add(c)); chars.add(h); });
  for (const c of chars) { if (c && t.indexOf(c) !== -1) return true; }
  if (/^[a-zv]+$/.test(tLatin)) {
    const targets = (LATIN[item.py] || [item.py]).map(x => x.toLowerCase());
    for (const tg of targets) { if (tLatin === tg) return true; }
  }
  return false;
}
function handleResult(texts) {
  const it = currentItemObj();
  const ok = texts.some(t => judge(it, t));
  const shown = (texts[0] || '').trim();
  if (ok) onCorrect(shown); else onWrong(shown);
}
async function onMicClick() {
  if (!heard) { toast('👂 先听一听示范，再跟读哦！'); playDemo(); return; }
  if (!getSR()) { showFeedback('fail', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome / Edge'); return; }
  // 非安全上下文（http 局域网 IP）下浏览器禁用麦克风；不再用 getUserMedia 抢占麦克风（会与识别器抢音频导致“收不到声音”）
  if (!window.__SPEECH_NATIVE__ && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    showFeedback('fail', '🔒 当前非安全环境（需 HTTPS 或 localhost），浏览器禁用了麦克风');
    return;
  }
  startRecognition();
}
function startRecognition() {
  stopSpeak();
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;
  try {
    recognizing = true;
    setRecording(true);
    $('mic-hint').textContent = '👂 正在聆听，请大声读…';
    recognition.start();
  } catch (e) {
    recognizing = false; setRecording(false);
    showFeedback('fail', '🎤 启动识别失败，请重试');
  }
}
function setRecording(on) {
  document.body.classList.toggle('recording', on);
  $('mic-btn').disabled = on;
}

/* ============================================================
 * 九、关卡流程
 * ============================================================ */
function onCorrect(shown) {
  streak++;
  updateStreak();
  playSuccessSound();
  speak(rnd(PRAISES));
  const label = shown ? ('你读的是「' + shown + '」') : '';
  showFeedback('success', '✅ 读对了！⭐ 获得一颗星 ' + label);
  burstConfetti();
  const completed = currentItem + 1;
  state.partial = { level: currentLevel, item: completed };
  saveState();
  setTimeout(() => {
    if (completed >= LEVELS[currentLevel].items.length) levelComplete();
    else { currentItem = completed; renderLevel(); autoDemo(); }
  }, 1500);
}
function onWrong(shown) {
  streak = 0;
  updateStreak();
  playFailSound();
  speak('再试一次哦');
  const label = shown ? ('听到：「' + shown + '」') : '';
  showFeedback('fail', '❌ 再试一次吧 ' + label);
}
function levelComplete() {
  state.done[currentLevel] = true;
  state.stars[currentLevel] = LEVELS[currentLevel].items.length;
  state.unlocked = Math.max(state.unlocked, currentLevel + 1);
  state.partial = null;
  // 每过一关得一张贴纸
  if (!state.stickers.length || state.stickers.length < doneCount()) {
    const have = new Set(state.stickers);
    const pool = STICKERS.filter(s => !have.has(s));
    const pick = pool.length ? rnd(pool) : rnd(STICKERS);
    if (!have.has(pick)) state.stickers.push(pick);
  }
  saveState();
  playSuccessSound();
  speak('太棒了，过关啦！你得到了一张贴纸！');
  showFeedback('success', '🎉 过关啦！得 ' + LEVELS[currentLevel].items.length + ' 颗星 + 贴纸一张！');
  burstConfetti();
  setTimeout(() => { renderHome(); renderMap(); }, 2200);
}
function enterLevel(i) {
  if (i < scope.lo || i >= scope.hi) return;
  if (!isUnlocked(i)) { toast('🔒 先完成前面的关卡哦'); return; }
  setSpeechLang('zh-CN');
  currentLevel = i;
  const items = LEVELS[i].items;
  currentItem = (state.partial && state.partial.level === i)
    ? Math.min(state.partial.item, items.length - 1) : 0;
  streak = 0;
  renderLevel();
  switchScreen('level-screen');
  autoDemo();
}
function isUnlocked(i) {
  if (state.settings.difficulty === 'hard') return true;
  const g = gradeOf(i);
  if (i === g.range[0]) return true;
  return !!state.done[i - 1];
}

/* ============================================================
 * 十、范围（年级 ∩ 类型）与难度起点
 * ============================================================ */
function computeScope() {
  const g = GRADES.find(x => x.id === state.settings.grade);
  const t = TYPES.find(x => x.id === state.settings.type);
  const lo = Math.max(g.range[0], t.range[0]);
  const hi = Math.min(g.range[1], t.range[1]);
  const empty = lo >= hi;
  let start = empty ? 0 : lo;
  if (!empty && state.settings.difficulty === 'hard') start = hi - 1;
  scope = { lo, hi, start, empty };
  return scope;
}

/* ============================================================
 * 十一、界面渲染
 * ============================================================ */
function renderHome() {
  switchScreen('home-screen');
  $('total-stars').textContent = totalStars();
  $('done-count').textContent = doneCount();
  $('total-count').textContent = LEVELS.length;
  $('sticker-count').textContent = state.stickers.length;
  updateSupportTips();

  // 贴纸
  const sr = $('sticker-row');
  sr.innerHTML = '';
  if (state.stickers.length) {
    state.stickers.forEach(s => { const sp = document.createElement('span'); sp.textContent = s; sr.appendChild(sp); });
  } else {
    sr.innerHTML = '<span style="font-size:13px;color:#c4a9c8;font-weight:700;">还没有贴纸，快去闯关吧～</span>';
  }

  // 年级 chips
  const gc = $('grade-chips');
  gc.innerHTML = '';
  GRADES.forEach(g => {
    const b = document.createElement('button');
    b.className = 'chip grade' + (state.settings.grade === g.id ? ' on' : '');
    b.textContent = g.emoji + ' ' + g.name + '（' + g.desc + '）';
    b.onclick = () => { state.settings.grade = g.id; saveState(); renderHome(); };
    gc.appendChild(b);
  });
  // 类型 chips
  const tc = $('type-chips');
  tc.innerHTML = '';
  TYPES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.settings.type === t.id ? ' on' : '');
    b.textContent = t.name;
    b.onclick = () => { state.settings.type = t.id; saveState(); renderHome(); };
    tc.appendChild(b);
  });
  // 难度 chips
  const dc = $('diff-chips');
  dc.innerHTML = '';
  DIFFS.forEach(d => {
    const b = document.createElement('button');
    b.className = 'chip diff' + (state.settings.difficulty === d.id ? ' on' : '');
    b.textContent = d.name;
    b.onclick = () => { state.settings.difficulty = d.id; saveState(); renderHome(); };
    dc.appendChild(b);
  });
  $('diff-hint').textContent = '💡 ' + DIFFS.find(d => d.id === state.settings.difficulty).desc;
}

function renderMap() {
  computeScope();
  switchScreen('map-screen');
  const g = GRADES.find(x => x.id === state.settings.grade);
  const t = TYPES.find(x => x.id === state.settings.type);
  $('map-title').textContent = '闯关地图';
  $('map-sub').textContent = g.name + ' · ' + t.name;
  $('map-stars').textContent = totalStars();

  const path = $('map-path');
  path.innerHTML = '';
  $('map-empty').hidden = !scope.empty;

  if (scope.empty) return;

  let firstInScope = null;
  for (let i = scope.lo; i < scope.hi; i++) {
    const lv = LEVELS[i];
    if (i > scope.lo) {
      const link = document.createElement('div');
      link.className = 'link';
      path.appendChild(link);
    }
    const done = !!state.done[i];
    const unlocked = isUnlocked(i);
    let cls = 'node ';
    if (done) cls += 'done';
    else if (unlocked) { cls += 'current clickable'; if (i === scope.start) cls += ' start'; }
    else cls += 'locked';
    let circle = done ? '⭐' : (unlocked ? String(i + 1) : '🔒');
    const node = document.createElement('div');
    node.className = cls;
    node.innerHTML =
      '<div class="node-circle">' + circle + '</div>' +
      '<div class="node-label">第' + (i + 1) + '关</div>' +
      '<div class="node-sub">' + lv.cat + '</div>';
    if (unlocked) node.addEventListener('click', () => enterLevel(i));
    path.appendChild(node);
    if (i === scope.start) firstInScope = node;
  }

  // 自动滚动到起点并高亮
  $('map-start-btn').textContent = '🚀 从第 ' + (scope.start + 1) + ' 关开始';
  if (firstInScope) {
    setTimeout(() => {
      firstInScope.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 80);
  }
}

function renderLevel() {
  const lv = LEVELS[currentLevel];
  const items = lv.items;
  const it = items[currentItem];
  const hard = state.settings.difficulty === 'hard';

  $('level-cat').textContent = '第' + (currentLevel + 1) + '关 · ' + gradeOf(currentLevel).name + ' · ' + lv.cat;
  $('level-title').textContent = lv.name;
  $('level-stars').textContent = currentItem + ' / ' + items.length;
  $('progress-fill').style.width = (currentItem / items.length * 100) + '%';
  $('q-label').textContent = '第 ' + (currentItem + 1) + ' 个拼音 · 先听再读';

  const dots = $('progress-dots');
  dots.innerHTML = '';
  items.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'pdot ' + (i < currentItem ? 'done' : (i === currentItem ? 'current' : ''));
    dots.appendChild(d);
  });

  $('pinyin-big').textContent = it.py;
  const readEl = $('pinyin-read');
  if (hard) { readEl.textContent = '🔍 高手模式：自己先想一想怎么读'; }
  else { readEl.textContent = '读作：' + it.read; }
  $('pinyin-card').onclick = playRead;

  const wr = $('words-row');
  wr.innerHTML = '';
  it.words.forEach(w => {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML =
      '<div class="word-emoji">' + w[2] + '</div>' +
      '<div class="word-hanzi">' + w[0] + '</div>' +
      '<div class="word-pinyin">' + w[1] + '</div>';
    card.addEventListener('click', () => playWord(w));
    wr.appendChild(card);
  });

  $('demo-btn').onclick = playDemo;
  $('mic-btn').onclick = onMicClick;
  $('mic-btn').disabled = false;
  heard = false;
  updateMicHint();
  updateStreak();
  $('feedback').className = 'feedback';
  $('feedback').textContent = '';
  setRecording(false);
}
function updateMicHint() {
  $('mic-hint').textContent = heard ? '点击麦克风，大声跟读' : '先听示范，再跟读哦';
}
function updateStreak() {
  const bar = $('streak-bar');
  if (streak >= 2) {
    bar.innerHTML = streak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + streak + ' 次！获得小奖杯！'
      : '🔥 连续答对 ' + streak + ' 次！';
  } else { bar.innerHTML = ''; }
}
function showFeedback(kind, text) {
  const f = $('feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十二、音节总览表
 * ============================================================ */
function renderTable() {
  switchScreen('table-screen');

  // 图例
  const lg = $('table-legend');
  lg.innerHTML = '';
  COLS.forEach(c => {
    const span = document.createElement('span');
    span.className = 'lg';
    span.innerHTML = '<span class="dot" style="background:' + GROUP_COLOR[c.group] + '"></span>' + c.group + '呼';
    lg.appendChild(span);
  });

  // 声调切换（点击后可听/看不同声调）
  const tones = [
    { id: 0, name: '🔊 原音' },
    { id: 1, name: '一声 ā' },
    { id: 2, name: '二声 á' },
    { id: 3, name: '三声 ǎ' },
    { id: 4, name: '四声 à' }
  ];
  const tr = $('tone-row');
  tr.innerHTML = '';
  tones.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (tableTone === t.id ? ' on' : '');
    b.textContent = t.name;
    b.onclick = () => { tableTone = t.id; renderTable(); };
    tr.appendChild(b);
  });

  // 构建表格
  const allFinals = COLS.reduce((a, c) => a.concat(c.items), []);
  const colClass = {};
  COLS.forEach(c => c.items.forEach(f => { colClass[f] = GROUP_CLASS[c.group]; }));

  const scroll = $('table-scroll');
  scroll.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'syl';

  // 表头行
  const thead = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  corner.textContent = '🌸';
  corner.title = '声母 ↓ / 韵母 →';
  thead.appendChild(corner);
  allFinals.forEach(f => {
    const th = document.createElement('th');
    th.className = 'col-head ' + colClass[f];
    th.textContent = f;
    th.title = '韵母 ' + f + '，读作 ' + (FINAL_READS[f] || f);
    th.addEventListener('click', () => { stopSpeak(); speak(FINAL_READS[f] || f); });
    thead.appendChild(th);
  });
  table.appendChild(thead);

  // 数据行
  ROWS.forEach(row => {
    const tr = document.createElement('tr');
    const rh = document.createElement('th');
    rh.className = 'row-head' + (row.k === '∅' ? ' zero' : '');
    rh.textContent = row.k;
    rh.title = (row.k === '∅' ? '零声母（没有声母的音节）' : '声母 ' + row.k);
    rh.addEventListener('click', () => { stopSpeak(); speak(INITIAL_READS[row.k]); });
    tr.appendChild(rh);

    allFinals.forEach(f => {
      const td = document.createElement('td');
      if (row.finals.indexOf(f) !== -1) {
        const syl = spellSyllable(row.k, f);
        const display = tableTone ? markTone(syl, tableTone) : syl;
        const ch = tableTone ? toneCharOf(syl, tableTone) : (SYL_CHAR[syl] || syl);
        td.className = 'cell';
        td.textContent = display;
        td.title = '拼音 ' + syl + ' · ' + display + ' · 例字「' + ch + '」';
        td.addEventListener('click', () => { stopSpeak(); speak(ch); });
      } else {
        td.className = 'void';
        td.textContent = '';
      }
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  scroll.appendChild(table);
}

/* ============================================================
 * 十二点五、流利说 · 刷单词模式
 * ============================================================ */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function cleanText(raw) {
  return String(raw || '').toLowerCase().replace(/[\s\u3000，。！？、,.!?~～\-—_"'“”‘’()（）\[\]【】《》<>:：;；]/g, '');
}
function judgeWord(entry, text) {
  const t = cleanText(text);
  if (!t) return false;
  const w = entry[0];
  if (t.indexOf(w) !== -1) return true;
  const chars = w.split('').filter(c => c.trim());
  if (chars.length >= 2 && chars.every(c => t.indexOf(c) !== -1)) return true;
  return false;
}
let wordRecognition = null;
function initWordRecognition() {
  const SR = getSR();
  if (!SR) return null;
  const r = new SR();
  r.lang = speechLang;
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => {
    const texts = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) texts.push(res[j].transcript);
    }
    handleWordResult(texts);
  };
  r.onerror = (e) => {
    setWordRecording(false);
    let msg = '识别出错了，请再试一次';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') msg = '麦克风权限被拒绝，请在地址栏允许麦克风';
    else if (e.error === 'no-speech') msg = '没有听清哦，请大声一点再试一次';
    else if (e.error === 'audio-capture') msg = '没有检测到麦克风设备';
    else if (e.error === 'network') msg = '语音识别需连接 Google 服务器，国内网络通常连不上；请改用安卓 App，或接入讯飞/百度等国内语音识别';
    else if (e.error === 'not-available') msg = '设备缺少语音识别服务（请确认已安装 Google 或系统语音服务）';
    else if (e.error === 'aborted') return;
    showWordFeedback('fail', '🎤 ' + msg);
  };
  r.onend = () => setWordRecording(false);
  return r;
}
const WORD_CATS = [
  { id: 'random', ico: '🎲', tt: '随机词库', ds: '词语+课文随机 · 无限挑战', inf: true },
  { id: 'text', ico: '📚', tt: '课文朗读', ds: '小学课文 & 古诗 · 经典句子', inf: false },
  { id: 'word', ico: '🍎', tt: '词语闯关', ds: '常用词语 · 经典造句', inf: false },
];
function showWordMenu() {
  stopSpeak();
  switchScreen('word-screen');
  $('word-menu').hidden = false;
  $('word-textbook').hidden = true;
  $('word-play').hidden = true;
  const cats = $('word-cats');
  cats.innerHTML = '';
  WORD_CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">' + c.ico + '</div><div class="tt">' + c.tt + '</div><div class="ds">' + c.ds + '</div>';
    b.onclick = () => { if (c.id === 'text') showTextbookGrades(); else chooseWordMode(c.id); };
    cats.appendChild(b);
  });
}
function chooseWordMode(mode) {
  setSpeechLang('zh-CN');
  wordMode = mode;
  wordInfinite = (mode === 'random');
  wordScore = 0; wordStreak = 0; wordIndex = 0;
  wordDeck = wordInfinite
    ? WORD_DECK.concat(TEXTBOOK_DECK)
    : shuffle(mode === 'text' ? TEXTBOOK_DECK : WORD_DECK);
  $('word-menu').hidden = true;
  $('word-play').hidden = false;
  $('word-mode-label').textContent = '🗣️ ' + WORD_CATS.find(c => c.id === mode).tt;
  renderWord();
  wordDemo();
}
function renderWord() {
  currentEntry = wordInfinite
    ? wordDeck[Math.floor(Math.random() * wordDeck.length)]
    : wordDeck[wordIndex];
  const e = currentEntry;
  $('word-q-label').textContent = wordInfinite
    ? '🎲 随机词 · 已读对 ' + wordScore + ' 词 · 无限继续'
    : '第 ' + (wordIndex + 1) + ' / ' + wordDeck.length + ' 个';
  $('word-big-emoji').textContent = e[2];
  $('word-big').textContent = e[0];
  $('word-big-pinyin').textContent = e[1];
  $('word-sentence-text').textContent = e[3];
  $('word-score').textContent = wordScore;
  $('word-progress-wrap').hidden = wordInfinite;
  $('word-progress-dots').hidden = wordInfinite;
  if (!wordInfinite) {
    $('word-progress-fill').style.width = (wordIndex / wordDeck.length * 100) + '%';
    const dots = $('word-progress-dots');
    dots.innerHTML = '';
    wordDeck.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'pdot ' + (i < wordIndex ? 'done' : (i === wordIndex ? 'current' : ''));
      dots.appendChild(d);
    });
  }
  wordHeard = false;
  $('word-mic-hint').textContent = '先听示范，再跟读哦';
  $('word-feedback').className = 'feedback';
  $('word-feedback').textContent = '';
  updateWordStreak();
  setWordRecording(false);
}
function wordDemo() {
  wordHeard = true;
  $('word-mic-hint').textContent = '点击麦克风，大声读';
  const e = currentEntry;
  stopSpeak();
  speak(e[0]);
  speak(e[3]);
}
function updateWordStreak() {
  const bar = $('word-streak-bar');
  if (wordStreak >= 2) {
    bar.innerHTML = wordStreak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + wordStreak + ' 次！获得小奖杯！'
      : '🔥 连续答对 ' + wordStreak + ' 次！';
  } else { bar.innerHTML = ''; }
}
function setWordRecording(on) {
  document.body.classList.toggle('recording', on);
  $('word-mic-btn').disabled = on;
}
async function onWordMicClick() {
  if (!wordHeard) { toast('👂 先听一听示范，再跟读哦！'); wordDemo(); return; }
  if (!getSR()) { showWordFeedback('fail', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome / Edge'); return; }
  if (!window.__SPEECH_NATIVE__ && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    showWordFeedback('fail', '🔒 当前非安全环境（需 HTTPS 或 localhost），浏览器禁用了麦克风');
    return;
  }
  startWordRecognition();
}
function startWordRecognition() {
  stopSpeak();
  if (!wordRecognition) wordRecognition = initWordRecognition();
  if (!wordRecognition) return;
  try {
    setWordRecording(true);
    $('word-mic-hint').textContent = '👂 正在聆听，请大声读…';
    wordRecognition.start();
  } catch (e) {
    setWordRecording(false);
    showWordFeedback('fail', '🎤 启动识别失败，请重试');
  }
}
function handleWordResult(texts) {
  const entry = currentEntry;
  const ok = texts.some(t => judgeWord(entry, t));
  const shown = (texts[0] || '').trim();
  if (ok) wordCorrect(shown); else wordWrong(shown);
}
function wordCorrect(shown) {
  wordScore++; wordStreak++;
  updateWordStreak();
  playSuccessSound();
  speak(rnd(PRAISES));
  const label = shown ? ('你读的是「' + shown + '」') : '';
  showWordFeedback('success', '✅ 读对了！' + label);
  burstConfetti();
  setTimeout(() => {
    if (!wordInfinite && wordIndex + 1 >= wordDeck.length) wordRoundComplete();
    else { wordIndex++; renderWord(); wordDemo(); }
  }, 1500);
}
function wordWrong(shown) {
  wordStreak = 0;
  updateWordStreak();
  playFailSound();
  speak('再试一次哦');
  const label = shown ? ('听到：「' + shown + '」') : '';
  showWordFeedback('fail', '❌ 再试一次吧 ' + label);
}
function wordRoundComplete() {
  playSuccessSound();
  speak('太棒了，你读完了这一轮！');
  showWordFeedback('success', '🎉 本轮读完！累计读对 ' + wordScore + ' 词，再来一轮！');
  burstConfetti();
  setTimeout(() => { wordIndex = 0; wordDeck = shuffle(wordDeck); renderWord(); wordDemo(); }, 2400);
}
function showWordFeedback(kind, text) {
  const f = $('word-feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十三、证书
 * ============================================================ */
function showCert() {
  $('name-input').value = state.name || '';
  $('cert-stars').textContent = totalStars();
  $('cert-total').textContent = LEVELS.length;
  $('cert-date').textContent = '颁发日期：' + new Date().toLocaleDateString('zh-CN');
  updateCertText();
  const holder = $('cert-stickers');
  holder.innerHTML = '';
  (state.stickers.length ? state.stickers : ['🎀']).forEach(s => {
    const sp = document.createElement('span'); sp.textContent = s; holder.appendChild(sp);
  });
  switchScreen('cert-screen');
}
function updateCertText() {
  const name = state.name ? state.name : '小勇士';
  $('cert-text').textContent = '恭喜「' + name + '」完成全部 ' + LEVELS.length +
    ' 关拼音闯关，成为真正的拼音小勇士！';
}

/* ============================================================
 * 十三点五、英语流利说 · 刷句子
 * ============================================================ */
function judgeEnglish(target, recognized) {
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const t = norm(target);
  const r = norm(recognized);
  if (!t || !r) return false;
  if (r.indexOf(t) !== -1) return true;
  const tw = t.split(' ').filter(Boolean);
  const rw = r.split(' ').filter(Boolean);
  let hit = 0;
  for (const w of tw) { if (rw.indexOf(w) !== -1) hit++; }
  return tw.length > 0 && (hit / tw.length) >= 0.6;
}
function showEnglishMenu() {
  stopSpeak();
  switchScreen('english-screen');
  $('english-menu').hidden = false;
  $('english-play').hidden = true;
  const cats = $('english-cats');
  cats.innerHTML = '';
  ['小学', '初中', '高中'].forEach(g => {
    const label = document.createElement('div');
    label.className = 'grade-group-label';
    label.textContent = g;
    cats.appendChild(label);
    ENGLISH_GRADES.filter(x => x.group === g).forEach(gr => {
      const b = document.createElement('button');
      b.className = 'word-cat';
      b.innerHTML = '<div class="tt">' + gr.name + '</div>';
      b.onclick = () => startEnglishMode(gr.id);
      cats.appendChild(b);
    });
  });
  const rb = document.createElement('button');
  rb.className = 'word-cat random';
  rb.innerHTML = '<div class="ico">🎲</div><div class="tt">随机混合</div>';
  rb.onclick = () => startEnglishMode('random');
  cats.appendChild(rb);
}
function startEnglishMode(gradeId) {
  englishGrade = gradeId;
  englishInfinite = (gradeId === 'random');
  englishScore = 0; englishStreak = 0; englishIndex = 0;
  englishDeck = englishInfinite
    ? Object.keys(ENGLISH_DECK).reduce((a, k) => a.concat(ENGLISH_DECK[k]), [])
    : shuffle(ENGLISH_DECK[gradeId].slice());
  setSpeechLang('en-US');
  $('english-menu').hidden = true;
  $('english-play').hidden = false;
  $('english-mode-label').textContent = '🔤 ' + (ENGLISH_GRADES.find(g => g.id === gradeId) || { name: '' }).name;
  renderEnglish();
  switchScreen('english-screen');
  englishDemo();
}
function currentEnglishEntry() {
  if (englishInfinite) return englishDeck[Math.floor(Math.random() * englishDeck.length)];
  return englishDeck[englishIndex];
}
function renderEnglish() {
  currentEnglish = currentEnglishEntry();
  const e = currentEnglish;
  $('english-q-label').textContent = englishInfinite
    ? '🎲 随机 · 已读对 ' + englishScore + ' 句 · 无限继续'
    : '第 ' + (englishIndex + 1) + ' / ' + englishDeck.length + ' 句';
  $('english-sentence').textContent = e[0];
  $('english-translation').textContent = e[1];
  $('english-score').textContent = englishScore;
  $('english-progress-wrap').hidden = englishInfinite;
  $('english-progress-dots').hidden = englishInfinite;
  if (!englishInfinite) {
    $('english-progress-fill').style.width = (englishIndex / englishDeck.length * 100) + '%';
    const dots = $('english-progress-dots');
    dots.innerHTML = '';
    englishDeck.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'pdot ' + (i < englishIndex ? 'done' : (i === englishIndex ? 'current' : ''));
      dots.appendChild(d);
    });
  }
  englishHeard = false;
  $('english-mic-hint').textContent = '先听示范，再跟读哦';
  $('english-feedback').className = 'feedback';
  $('english-feedback').textContent = '';
  updateEnglishStreak();
  setEnglishRecording(false);
}
function englishDemo() {
  englishHeard = true;
  $('english-mic-hint').textContent = '点击麦克风，大声读句子';
  const e = currentEnglish;
  stopSpeak();
  speak(e[0], 'en-US');
}
function updateEnglishStreak() {
  const bar = $('english-streak-bar');
  if (englishStreak >= 2) {
    bar.innerHTML = englishStreak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + englishStreak + ' 次！获得小奖杯！'
      : '🔥 连续答对 ' + englishStreak + ' 次！';
  } else { bar.innerHTML = ''; }
}
function setEnglishRecording(on) {
  document.body.classList.toggle('recording', on);
  $('english-mic-btn').disabled = on;
}
let englishRecognition = null;
function initEnglishRecognition() {
  const SR = getSR();
  if (!SR) return null;
  const r = new SR();
  r.lang = 'en-US';
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => {
    const texts = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) texts.push(res[j].transcript);
    }
    handleEnglishResult(texts);
  };
  r.onerror = (e) => {
    setEnglishRecording(false);
    let msg = '识别出错了，请再试一次';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') msg = '麦克风权限被拒绝，请在地址栏允许麦克风';
    else if (e.error === 'no-speech') msg = '没有听清哦，请大声一点再试一次';
    else if (e.error === 'audio-capture') msg = '没有检测到麦克风设备';
    else if (e.error === 'network') msg = '语音识别需连接 Google 服务器，国内网络通常连不上；请改用安卓 App，或接入讯飞/百度等国内语音识别';
    else if (e.error === 'not-available') msg = '设备缺少语音识别服务（请确认已安装 Google 或系统语音服务）';
    else if (e.error === 'aborted') return;
    showEnglishFeedback('fail', '🎤 ' + msg);
  };
  r.onend = () => setEnglishRecording(false);
  return r;
}
async function onEnglishMicClick() {
  if (!englishHeard) { toast('👂 先听一听示范，再跟读哦！'); englishDemo(); return; }
  if (!getSR()) { showEnglishFeedback('fail', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome / Edge'); return; }
  if (!window.__SPEECH_NATIVE__ && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    showEnglishFeedback('fail', '🔒 当前非安全环境（需 HTTPS 或 localhost），浏览器禁用了麦克风');
    return;
  }
  startEnglishRecognition();
}
function startEnglishRecognition() {
  stopSpeak();
  setSpeechLang('en-US');
  if (!englishRecognition) englishRecognition = initEnglishRecognition();
  if (!englishRecognition) return;
  try {
    setEnglishRecording(true);
    $('english-mic-hint').textContent = '👂 正在聆听，请大声读…';
    englishRecognition.start();
  } catch (e) {
    setEnglishRecording(false);
    showEnglishFeedback('fail', '🎤 启动识别失败，请重试');
  }
}
function handleEnglishResult(texts) {
  const target = currentEnglish ? currentEnglish[0] : '';
  const ok = texts.some(t => judgeEnglish(target, t));
  const shown = (texts[0] || '').trim();
  if (ok) englishCorrect(shown); else englishWrong(shown);
}
function englishCorrect(shown) {
  englishScore++; englishStreak++;
  updateEnglishStreak();
  playSuccessSound();
  speak(rnd(PRAISES), 'zh-CN');
  const label = shown ? ('你读的是「' + shown + '」') : '';
  showEnglishFeedback('success', '✅ 读对了！' + label);
  burstConfetti();
  setTimeout(() => {
    if (!englishInfinite && englishIndex + 1 >= englishDeck.length) englishRoundComplete();
    else { englishIndex++; renderEnglish(); englishDemo(); }
  }, 1500);
}
function englishWrong(shown) {
  englishStreak = 0;
  updateEnglishStreak();
  playFailSound();
  speak('Try again!', 'en-US');
  const label = shown ? ('听到：「' + shown + '」') : '';
  showEnglishFeedback('fail', '❌ 再试一次吧 ' + label);
}
function englishRoundComplete() {
  playSuccessSound();
  speak('Great job!', 'en-US');
  showEnglishFeedback('success', '🎉 本轮读完！累计读对 ' + englishScore + ' 句，再来一轮！');
  burstConfetti();
  setTimeout(() => { englishIndex = 0; englishDeck = shuffle(englishDeck); renderEnglish(); englishDemo(); }, 2400);
}
function showEnglishFeedback(kind, text) {
  const f = $('english-feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十三点六、数学选择题
 * ============================================================ */
function allMathItems() {
  return Object.keys(MATH_UNITS).reduce((a, g) => a.concat(MATH_UNITS[g].reduce((b, u) => b.concat(u.items), [])), []);
}
function showMathMenu() {
  stopSpeak();
  switchScreen('math-screen');
  $('math-menu').hidden = false;
  $('math-units').hidden = true;
  $('math-play').hidden = true;
  const cats = $('math-cats');
  cats.innerHTML = '';
  MATH_GRADES.forEach(g => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">' + g.ico + '</div><div class="tt">' + g.name + '</div>';
    b.onclick = () => { if (g.id === 'random') startMathUnit('random', -1); else showMathUnits(g.id); };
    cats.appendChild(b);
  });
}
function showMathUnits(gradeId) {
  mathGradeId = gradeId;
  stopSpeak();
  $('math-menu').hidden = true;
  $('math-units').hidden = false;
  $('math-play').hidden = true;
  $('math-unit-title').textContent = MATH_GRADES.find(g => g.id === gradeId).name + ' · 选择单元';
  const cats = $('math-unit-cats');
  cats.innerHTML = '';
  const rb = document.createElement('button');
  rb.className = 'word-cat random';
  rb.innerHTML = '<div class="ico">🎲</div><div class="tt">本年级随机</div>';
  rb.onclick = () => startMathUnit(gradeId, -1);
  cats.appendChild(rb);
  MATH_UNITS[gradeId].forEach((u, i) => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">📘</div><div class="tt">' + u.name + '</div><div class="ds">' + u.items.length + ' 题</div>';
    b.onclick = () => startMathUnit(gradeId, i);
    cats.appendChild(b);
  });
}
function startMathUnit(gradeId, unitIdx) {
  mathGradeId = gradeId;
  mathUnitIdx = unitIdx;
  mathInfinite = (unitIdx === -1);
  mathScore = 0; mathStreak = 0; mathIndex = 0;
  if (gradeId === 'random') {
    mathDeck = allMathItems();
  } else if (unitIdx === -1) {
    mathDeck = MATH_UNITS[gradeId].reduce((a, u) => a.concat(u.items), []);
  } else {
    mathDeck = shuffle(MATH_UNITS[gradeId][unitIdx].items.slice());
  }
  const label = gradeId === 'random'
    ? '全部随机'
    : (unitIdx === -1
      ? MATH_GRADES.find(g => g.id === gradeId).name + ' · 随机'
      : MATH_GRADES.find(g => g.id === gradeId).name + ' · ' + MATH_UNITS[gradeId][unitIdx].name);
  $('math-menu').hidden = true;
  $('math-units').hidden = true;
  $('math-play').hidden = false;
  $('math-mode-label').textContent = '🧮 ' + label;
  renderMath();
  switchScreen('math-screen');
}
function currentMathEntry() {
  if (mathInfinite) return mathDeck[Math.floor(Math.random() * mathDeck.length)];
  return mathDeck[mathIndex];
}
function renderMath() {
  currentMath = currentMathEntry();
  const q = currentMath;
  $('math-q-label').textContent = mathInfinite
    ? '🎲 随机 · 已答对 ' + mathScore + ' 题 · 无限继续'
    : '第 ' + (mathIndex + 1) + ' / ' + mathDeck.length + ' 题';
  $('math-question').textContent = q.q;
  $('math-score').textContent = mathScore;
  $('math-progress-wrap').hidden = mathInfinite;
  $('math-progress-dots').hidden = mathInfinite;
  if (!mathInfinite) {
    $('math-progress-fill').style.width = (mathIndex / mathDeck.length * 100) + '%';
  }
  const opts = $('math-options');
  opts.innerHTML = '';
  // 打乱选项顺序，避免正确答案总在固定位置（如总在 B）
  const idx = shuffle([0, 1, 2, 3]);
  currentMathOpts = idx.map(i => q.opts[i]);
  currentMathAns = idx.indexOf(q.ans);
  currentMathOpts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'math-option';
    b.textContent = o;
    b.onclick = () => answerMath(i);
    opts.appendChild(b);
  });
  $('math-feedback').className = 'feedback';
  $('math-feedback').textContent = '';
  updateMathStreak();
}
function answerMath(i) {
  const buttons = $('math-options').querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);
  if (i === currentMathAns) {
    buttons[i].classList.add('right');
    mathScore++; mathStreak++;
    updateMathStreak();
    playSuccessSound();
    showMathFeedback('success', '✅ 答对了！' + currentMathOpts[currentMathAns]);
    burstConfetti();
    setTimeout(() => {
      if (!mathInfinite && mathIndex + 1 >= mathDeck.length) mathRoundComplete();
      else { mathIndex++; renderMath(); }
    }, 1200);
  } else {
    buttons[i].classList.add('wrong');
    buttons[currentMathAns].classList.add('right');
    mathStreak = 0;
    updateMathStreak();
    playFailSound();
    showMathFeedback('fail', '❌ 正确答案是 ' + currentMathOpts[currentMathAns]);
    setTimeout(() => {
      if (!mathInfinite && mathIndex + 1 >= mathDeck.length) mathRoundComplete();
      else { mathIndex++; renderMath(); }
    }, 1800);
  }
}
function mathRoundComplete() {
  playSuccessSound();
  showMathFeedback('success', '🎉 本轮完成！累计答对 ' + mathScore + ' 题，再来一轮！');
  burstConfetti();
  setTimeout(() => { mathIndex = 0; mathDeck = shuffle(mathDeck); renderMath(); }, 2000);
}
function updateMathStreak() {
  const bar = $('math-streak-bar');
  if (mathStreak >= 2) {
    bar.innerHTML = mathStreak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + mathStreak + ' 题！'
      : '🔥 连续答对 ' + mathStreak + ' 题！';
  } else { bar.innerHTML = ''; }
}
function showMathFeedback(kind, text) {
  const f = $('math-feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十三点七、乘法口诀总览
 * ============================================================ */
function numToCn(n) {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return d[n];
  if (n < 20) return '十' + (n % 10 === 0 ? '' : d[n % 10]);
  const t = Math.floor(n / 10), o = n % 10;
  return d[t] + '十' + (o === 0 ? '' : d[o]);
}
function showMulTable() {
  stopSpeak();
  switchScreen('mul-screen');
  renderMulTable();
}
function renderMulTable() {
  const wrap = $('mul-grid');
  wrap.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'mul-cell head';
  corner.textContent = '×';
  wrap.appendChild(corner);
  for (let j = 1; j <= 9; j++) {
    const h = document.createElement('div');
    h.className = 'mul-cell head';
    h.textContent = j;
    wrap.appendChild(h);
  }
  for (let i = 1; i <= 9; i++) {
    const rh = document.createElement('div');
    rh.className = 'mul-cell head';
    rh.textContent = i;
    wrap.appendChild(rh);
    for (let j = 1; j <= 9; j++) {
      const c = document.createElement('div');
      c.className = 'mul-cell';
      c.textContent = i * j;
      const ii = i, jj = j;
      c.onclick = () => { stopSpeak(); speak(numToCn(ii) + '乘' + numToCn(jj) + '等于' + numToCn(ii * jj), 'zh-CN'); };
      wrap.appendChild(c);
    }
  }
}

/* ============================================================
 * 十三点八、人教版语文课文（年级 → 单元）
 * ============================================================ */
let textGrade = 'g1u';
let textUnit = 0;
function showTextbookGrades() {
  stopSpeak();
  switchScreen('word-screen');
  $('word-menu').hidden = true;
  $('word-textbook').hidden = false;
  $('word-play').hidden = true;
  const cats = $('textbook-grade-cats');
  cats.innerHTML = '';
  CHINESE_GRADES.forEach(g => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">' + g.ico + '</div><div class="tt">' + g.name + '</div>';
    b.onclick = () => showTextbookUnits(g.id);
    cats.appendChild(b);
  });
}
function showTextbookUnits(gradeId) {
  textGrade = gradeId;
  stopSpeak();
  $('word-menu').hidden = true;
  $('word-textbook').hidden = false;
  $('word-play').hidden = true;
  $('textbook-unit-title').textContent = CHINESE_GRADES.find(g => g.id === gradeId).name + ' · 选择单元';
  const cats = $('textbook-unit-cats');
  cats.innerHTML = '';
  CHINESE_UNITS[gradeId].forEach((u, i) => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">📘</div><div class="tt">' + u.name + '</div><div class="ds">' + u.items.length + ' 句</div>';
    b.onclick = () => startTextbookUnit(gradeId, i);
    cats.appendChild(b);
  });
}
function startTextbookUnit(gradeId, unitIdx) {
  textGrade = gradeId;
  textUnit = unitIdx;
  wordMode = 'text';
  wordInfinite = false;
  wordDeck = shuffle(CHINESE_UNITS[gradeId][unitIdx].items.slice());
  wordIndex = 0; wordScore = 0; wordStreak = 0;
  setSpeechLang('zh-CN');
  $('word-menu').hidden = true;
  $('word-textbook').hidden = true;
  $('word-play').hidden = false;
  $('word-mode-label').textContent = '📖 ' + CHINESE_GRADES.find(g => g.id === gradeId).name + ' · ' + CHINESE_UNITS[gradeId][unitIdx].name;
  renderWord();
  switchScreen('word-screen');
  wordDemo();
}

/* ============================================================
 * 十四、事件绑定与初始化
 * ============================================================ */
function bindEvents() {
  $('go-level').addEventListener('click', () => { computeScope(); if (scope.empty) { toast('这个组合里没有关卡，换个年级或类型试试～'); return; } enterLevel(scope.start); });
  $('go-table').addEventListener('click', renderTable);
  $('go-cert').addEventListener('click', () => { if (allDone()) showCert(); else toast('🏆 还没全部通关哦，继续加油！'); });
  $('go-words').addEventListener('click', showWordMenu);
  $('word-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('word-play-back-btn').addEventListener('click', () => { if (wordMode === 'text') showTextbookUnits(textGrade); else showWordMenu(); });
  $('word-demo-btn').addEventListener('click', wordDemo);
  $('word-mic-btn').addEventListener('click', onWordMicClick);
  $('go-english').addEventListener('click', showEnglishMenu);
  $('english-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('english-play-back-btn').addEventListener('click', showEnglishMenu);
  $('english-demo-btn').addEventListener('click', englishDemo);
  $('english-mic-btn').addEventListener('click', onEnglishMicClick);
  $('go-math').addEventListener('click', showMathMenu);
  $('go-mul').addEventListener('click', showMulTable);
  $('mul-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('textbook-back-btn').addEventListener('click', showWordMenu);
  $('math-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('math-unit-back-btn').addEventListener('click', showMathMenu);
  $('math-play-back-btn').addEventListener('click', () => { if (mathGradeId === 'random') showMathMenu(); else showMathUnits(mathGradeId); });
  $('back-btn').addEventListener('click', () => { stopSpeak(); renderMap(); });
  $('map-home-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('map-start-btn').addEventListener('click', () => { computeScope(); if (!scope.empty) enterLevel(scope.start); });
  $('table-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('cert-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('reset-btn').addEventListener('click', () => {
    if (confirm('确定要清空所有进度，重新开始吗？')) {
      stopSpeak();
      state = defaultState();
      saveState();
      currentLevel = -1; currentItem = 0; streak = 0;
      renderHome();
    }
  });
  $('name-input').addEventListener('input', (e) => { state.name = e.target.value.trim(); saveState(); updateCertText(); });
  $('print-btn').addEventListener('click', () => window.print());
}

function initSparkles() {
  const box = $('sparkles');
  const icons = ['✨','💖','🌸','🦋','⭐','🎀'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.textContent = icons[i % icons.length];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.fontSize = (14 + Math.random() * 18) + 'px';
    s.style.animationDuration = (9 + Math.random() * 9) + 's';
    s.style.animationDelay = (Math.random() * 9) + 's';
    box.appendChild(s);
  }
}

(function init() {
  if (!('speechSynthesis' in window)) toast('⚠️ 当前浏览器不支持语音合成，将无法听到示范发音');
  initSparkles();
  bindEvents();
  renderHome();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
