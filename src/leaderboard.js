// 排行榜客户端：调用本地 Node 服务的 /api/scores
// （由服务端持有 DATABASE_URL 并连接 Supabase PostgreSQL，前端不接触任何密钥）

export function isLeaderboardReady() {
  return true; // 始终尝试，连接失败时给出明确提示
}

async function api(method, body) {
  try {
    const res = await fetch('/api/scores', {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || ('HTTP ' + res.status) };
    }
    return await res.json();
  } catch (e) {
    return { error: '无法连接本地服务（请确认已启动 node server.js）' };
  }
}

export async function submitScore(name, score) {
  const r = await api('POST', { name: String(name).slice(0, 20), score: Number(score) || 0 });
  if (r && r.error) return { ok: false, error: r.error };
  return { ok: true };
}

export async function fetchScores(limit = 20) {
  const r = await api('GET');
  if (r && r.error) return null;   // null 表示服务不可达
  return Array.isArray(r) ? r : [];
}
