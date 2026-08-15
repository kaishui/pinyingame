// 排行榜客户端：通过 Supabase REST API(PostgREST) 读写 scores 表
// 密钥从环境变量读取（.env，不提交）：VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY(publishable 公钥)
// 走公网接口，网页与安卓 App 均可直接使用（不依赖本地服务）

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isLeaderboardReady() {
  return !!(SUPABASE_URL && SUPABASE_ANON);
}

export async function submitScore(name, score) {
  if (!isLeaderboardReady()) return { ok: false, error: '未配置 Supabase 密钥' };
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/scores', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ name: String(name).slice(0, 20), score: Number(score) || 0 })
    });
    if (!res.ok) return { ok: false, error: 'HTTP ' + res.status };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: '网络错误' };
  }
}

export async function fetchScores(limit = 20) {
  if (!isLeaderboardReady()) return null;
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/scores?select=name,score&order=score.desc&limit=' + limit,
      { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
