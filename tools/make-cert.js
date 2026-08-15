// 生成自签名 HTTPS 证书，用于「局域网 IP 访问」时启用麦克风。
// 背景：浏览器只允许在“安全上下文”（HTTPS 或 localhost）里使用麦克风 getUserMedia，
//       所以 http://192.168.x.x 下语音识别会被禁用；本脚本生成证书后由 server.js 提供 HTTPS 服务。
// 用法：node tools/make-cert.js
const { execFileSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const ips = ['127.0.0.1'];
const ifs = os.networkInterfaces();
for (const k in ifs) {
  for (const a of ifs[k] || []) {
    if (a.family === 'IPv4' && !a.internal) ips.push(a.address);
  }
}
const sans = ['DNS:localhost'].concat(ips.map((ip) => 'IP:' + ip));

const outDir = path.join(__dirname, '..', 'certs');
fs.mkdirSync(outDir, { recursive: true });
const key = path.join(outDir, 'key.pem');
const cert = path.join(outDir, 'cert.pem');

execFileSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
  '-keyout', key, '-out', cert,
  '-days', 3650,
  '-subj', '/CN=mofaxiaojingling-local/O=pinyingame',
  '-addext', 'subjectAltName=' + sans.join(','),
  '-addext', 'extendedKeyUsage=serverAuth'
], { stdio: 'inherit' });

console.log('✅ 已生成自签名证书：certs/cert.pem + certs/key.pem');
console.log('   SAN: ' + sans.join(', '));
console.log('   说明：自签名证书首次访问时浏览器会提示“不安全”，点“高级 → 继续访问”即可；');
console.log('        之后该页面即属于安全上下文，麦克风可正常使用。');
