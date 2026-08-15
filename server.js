/**
 * 魔法小精灵 —— 静态服务器 + 排行榜 API（HTTP + HTTPS）
 * - 静态服务 dist/（或源码目录）
 * - 排行榜 API：/api/scores（连接 Supabase PostgreSQL，读写 scores 表）
 * - HTTP  端口 PORT（默认 8080）
 * - HTTPS 端口 HTTPS_PORT（默认 8443，使用 certs/ 下自签名证书）
 *   为什么需要 HTTPS：浏览器只允许在“安全上下文”（HTTPS 或 localhost）使用麦克风，
 *   用局域网 IP http 访问时语音识别会被禁用；走 HTTPS 即可正常使用麦克风。
 * 依赖：pg、dotenv（DATABASE_URL 放在 .env，不提交）
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { Pool } = require('pg');

const PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const ROOT = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
  : null;

async function ensureTable() {
  if (!pool) { console.log('⚠️ 未配置 DATABASE_URL，排行榜 API 不可用'); return; }
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.scores (
        id bigserial primary key,
        name text not null,
        score integer not null default 0,
        created_at timestamptz not null default now()
      )`
    );
    console.log('✅ scores 表已就绪（Supabase）');
  } catch (e) {
    console.error('⚠️ 建表失败:', e.message);
  }
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(body);
}

async function handleScores(req, res) {
  if (!pool) return sendJSON(res, 503, { error: '服务器未配置数据库(DATABASE_URL)' });
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }); res.end(); return; }
  if (req.method === 'GET') {
    try {
      const limit = Math.min(parseInt((req.url || '').split('limit=')[1]) || 20, 100);
      const r = await pool.query('SELECT name, score FROM scores ORDER BY score DESC, id ASC LIMIT $1', [limit]);
      return sendJSON(res, 200, r.rows);
    } catch (e) { return sendJSON(res, 500, { error: e.message }); }
  }
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 10000) req.destroy(); });
    req.on('end', async () => {
      try {
        const { name, score } = JSON.parse(body || '{}');
        if (!name || String(name).trim().length === 0) return sendJSON(res, 400, { error: '名字不能为空' });
        const nm = String(name).trim().slice(0, 20);
        const sc = Math.max(0, Math.min(999999, Number(score) || 0));
        const r = await pool.query('INSERT INTO scores (name, score) VALUES ($1, $2) RETURNING id', [nm, sc]);
        return sendJSON(res, 200, { ok: true, id: r.rows[0].id });
      } catch (e) { return sendJSON(res, 500, { error: e.message }); }
    });
    return;
  }
  return sendJSON(res, 405, { error: 'Method not allowed' });
}

function requestHandler(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/api/scores') { handleScores(req, res); return; }

  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

http.createServer(requestHandler).listen(PORT, async () => {
  console.log('🧚‍♀️ 魔法小精灵 已启动：');
  console.log('   ➜  本机访问： http://localhost:' + PORT);
  console.log('   ➜  请使用 Chrome / Edge 浏览器打开，并允许麦克风权限。');
  await ensureTable();
  startHttps();
  console.log('   ➜  按 Ctrl+C 停止服务器。');
});

function ensureCerts() {
  const certDir = path.join(__dirname, 'certs');
  const keyPath = path.join(certDir, 'key.pem');
  const certPath = path.join(certDir, 'cert.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) return true;

  // 自动生成自签名证书（含本机局域网 IP，便于手机通过 https 访问时启用麦克风）
  try {
    const ips = ['127.0.0.1'];
    const ifs = os.networkInterfaces();
    for (const k in ifs) {
      for (const a of ifs[k] || []) {
        if (a.family === 'IPv4' && !a.internal) ips.push(a.address);
      }
    }
    const sans = ['DNS:localhost'].concat(ips.map((ip) => 'IP:' + ip));
    fs.mkdirSync(certDir, { recursive: true });
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', keyPath, '-out', certPath,
      '-days', 3650,
      '-subj', '/CN=mofaxiaojingling-local/O=pinyingame',
      '-addext', 'subjectAltName=' + sans.join(','),
      '-addext', 'extendedKeyUsage=serverAuth'
    ], { stdio: 'ignore' });
    console.log('✅ 已自动生成自签名 HTTPS 证书（certs/）。');
    return true;
  } catch (e) {
    console.log('⚠️ 自动生成证书失败（请确认已安装 openssl），可手动运行 node tools/make-cert.js。');
    return false;
  }
}

function startHttps() {
  if (!ensureCerts()) {
    console.log('   ➜  局域网手机访问需 HTTPS 才能用麦克风；生成证书后重启本服务即可。');
    return;
  }
  const keyPath = path.join(__dirname, 'certs', 'key.pem');
  const certPath = path.join(__dirname, 'certs', 'cert.pem');
  const httpsServer = https.createServer(
    { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    requestHandler
  );
  httpsServer.listen(HTTPS_PORT, () => {
    console.log('   🔒 局域网 HTTPS： https://<本机IP>:' + HTTPS_PORT + ' （自签名证书，首次访问点“高级 → 继续访问”，之后即可用麦克风）');
  });
}
