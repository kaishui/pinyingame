// 在线访客统计：页面打开时把公网 IP 写入 Supabase visitors 表（按 IP 去重），
// 之后每 60 秒心跳刷新 last_seen。
// 在线数 = last_seen 在最近 2 分钟内的行数（SQL 见 supabase/schema.sql）。
// 全程静默：IP 获取失败 / 网络失败都不打扰用户。

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const HEARTBEAT_MS = 60 * 1000;

let ipPromise = null;

// 依次尝试多个公网 IP 服务（部分服务在部分地区不可达），全部失败则返回 null
const IP_PROVIDERS = [
  { url: 'https://api.ipify.org?format=json', parse: (t) => { try { return JSON.parse(t).ip || null; } catch (e) { return null; } } },
  { url: 'https://ifconfig.me/ip', parse: (t) => { const s = String(t).trim(); return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) ? s : null; } },
  { url: 'https://api64.ipify.org?format=json', parse: (t) => { try { return JSON.parse(t).ip || null; } catch (e) { return null; } } }
];

function fetchText(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { signal: ctrl.signal })
    .then((r) => r.text())
    .finally(() => clearTimeout(timer));
}

/** 获取本机公网 IP（带缓存与超时；失败返回 null） */
export function getClientIp() {
  if (!ipPromise) {
    ipPromise = (async () => {
      for (const p of IP_PROVIDERS) {
        try {
          const ip = p.parse(await fetchText(p.url, 5000));
          if (ip) return String(ip);
        } catch (e) { /* 尝试下一个 */ }
      }
      return null;
    })();
  }
  return ipPromise;
}

export function isVisitorReady() {
  return !!(SUPABASE_URL && SUPABASE_ANON);
}

function api(path, options = {}) {
  const headers = Object.assign(
    {
      apikey: SUPABASE_ANON,
      Authorization: 'Bearer ' + SUPABASE_ANON,
      'Content-Type': 'application/json'
    },
    options.headers || {}
  );
  return fetch(SUPABASE_URL + path, Object.assign({}, options, { headers }));
}

function meta() {
  return {
    user_agent: (navigator.userAgent || '').slice(0, 300),
    page: (location.pathname || '/').slice(0, 200)
  };
}

/** 首次上报：同 IP 已存在则忽略（保留原 first_seen） */
function firstSeen(ip) {
  const now = new Date().toISOString();
  return api('/rest/v1/visitors?on_conflict=ip', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(Object.assign(meta(), {
      ip,
      first_seen: now,
      last_seen: now
    }))
  });
}

/** 心跳：刷新 last_seen */
function heartbeat(ip) {
  return api('/rest/v1/visitors?ip=eq.' + encodeURIComponent(ip), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ last_seen: new Date().toISOString() })
  });
}

/** 页面加载后调用一次即可 */
export async function startVisitorTracking() {
  if (!isVisitorReady()) return;
  try {
    const ip = await getClientIp();
    if (!ip) return;
    await firstSeen(ip);
    setInterval(() => heartbeat(ip).catch(() => {}), HEARTBEAT_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') heartbeat(ip).catch(() => {});
    });
  } catch (e) {
    /* 静默失败 */
  }
}
