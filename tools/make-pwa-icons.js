// 生成 PWA 网页图标（魔法小精灵：粉紫渐变圆角 + 魔法星光）
// 用法：node tools/make-pwa-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { iconColor } = require('./logo-art.js');

function crc32(b) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(t, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0);
  const tb = Buffer.from(t, 'ascii');
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, d])), 0);
  return Buffer.concat([l, tb, d, cb]);
}
function makePng(size, draw) {
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4);
  ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1); raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      const [r, g, b, a] = draw(x / size, y / size);
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function roundedRect(nx, ny, r) {
  const dx = Math.max(Math.abs(nx) - (1 - r), 0), dy = Math.max(Math.abs(ny) - (1 - r), 0);
  return dx * dx + dy * dy <= r * r;
}

const draw = (fx, fy) => {
  const nx = fx * 2 - 1, ny = 1 - fy * 2;
  if (!roundedRect(nx, ny, 0.22)) return [0, 0, 0, 0];
  return [...iconColor(nx, ny), 255];
};

const dir = path.join(__dirname, '..', 'public');
[[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']].forEach(([s, n]) => {
  fs.writeFileSync(path.join(dir, n), makePng(s, draw));
  console.log('✅', n, s);
});
