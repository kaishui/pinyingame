// 右下角“意见反馈”悬浮按钮 + 弹窗面板
// 提交后写入 Supabase feedback 表（公开可写入，读取仅限服务端/控制台）。
// 附带的 IP 来自 visitor.js 的 getClientIp()（与在线统计共用，失败则为空）。

import { getClientIp } from './visitor.js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const MAX_CONTENT = 2000;
const MAX_CONTACT = 100;

function isReady() {
  return !!(SUPABASE_URL && SUPABASE_ANON);
}

function buildWidget() {
  const wrap = document.createElement('div');
  wrap.className = 'fb-wrap';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', '意见反馈');

  // 悬浮按钮
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fb-fab';
  btn.setAttribute('aria-label', '打开意见反馈');
  btn.innerHTML = '<span class="fb-fab-ico">💬</span><span class="fb-fab-txt">反馈</span>';

  // 面板
  const panel = document.createElement('div');
  panel.className = 'fb-panel';
  panel.hidden = true;

  const head = document.createElement('div');
  head.className = 'fb-head';
  const title = document.createElement('div');
  title.className = 'fb-title';
  title.textContent = '🧚‍♀️ 意见反馈';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'fb-close';
  close.setAttribute('aria-label', '关闭');
  close.textContent = '✕';
  head.appendChild(title);
  head.appendChild(close);

  const body = document.createElement('div');
  body.className = 'fb-body';

  const text = document.createElement('textarea');
  text.className = 'fb-text';
  text.rows = 4;
  text.maxLength = MAX_CONTENT;
  text.placeholder = '告诉我们你的想法、遇到的问题，或想玩的新内容…';

  const contact = document.createElement('input');
  contact.type = 'text';
  contact.className = 'fb-contact';
  contact.maxLength = MAX_CONTACT;
  contact.placeholder = '选填：联系方式（邮箱 / 微信）';

  const status = document.createElement('div');
  status.className = 'fb-status';
  status.setAttribute('aria-live', 'polite');

  const send = document.createElement('button');
  send.type = 'button';
  send.className = 'fb-send';
  send.textContent = '发送反馈 🚀';

  body.appendChild(text);
  body.appendChild(contact);
  body.appendChild(status);
  body.appendChild(send);

  panel.appendChild(head);
  panel.appendChild(body);
  wrap.appendChild(btn);
  wrap.appendChild(panel);

  // ---- 交互 ----
  let open = false;
  function setOpen(v) {
    open = v;
    panel.hidden = !v;
    btn.classList.toggle('active', v);
    if (v) text.focus();
  }
  btn.addEventListener('click', () => setOpen(!open));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('click', (e) => {
    if (open && !wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // ---- 提交 ----
  async function submit() {
    const content = text.value.trim();
    if (!content) {
      status.textContent = '请先写点内容再发送哦～';
      status.className = 'fb-status err';
      text.focus();
      return;
    }
    if (!isReady()) {
      status.textContent = '暂时无法发送（未配置服务器），请稍后再试。';
      status.className = 'fb-status err';
      return;
    }
    send.disabled = true;
    send.textContent = '发送中…';
    status.textContent = '';
    status.className = 'fb-status';
    try {
      let ip = null;
      try { ip = await getClientIp(); } catch (e) { ip = null; }
      const res = await fetch(SUPABASE_URL + '/rest/v1/feedback', {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: 'Bearer ' + SUPABASE_ANON,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          content: content.slice(0, MAX_CONTENT),
          contact: contact.value.trim().slice(0, MAX_CONTACT) || null,
          page: (location.pathname || '/').slice(0, 200),
          user_agent: (navigator.userAgent || '').slice(0, 300),
          ip: ip
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // 成功：清空并显示感谢
      text.value = '';
      contact.value = '';
      status.textContent = '收到你的反馈啦，谢谢你！💖';
      status.className = 'fb-status ok';
      send.textContent = '发送反馈 🚀';
      setTimeout(() => setOpen(false), 2200);
    } catch (e) {
      status.textContent = '发送失败，请检查网络后重试。';
      status.className = 'fb-status err';
      send.textContent = '发送反馈 🚀';
    } finally {
      send.disabled = false;
    }
  }
  send.addEventListener('click', submit);

  return wrap;
}

let inited = false;

/** 页面加载后调用一次即可（重复调用无副作用） */
export function initFeedback() {
  if (inited) return;
  inited = true;
  if (document.body) document.body.appendChild(buildWidget());
}
