// 生成安卓 launcher 图标（魔法小精灵：粉紫渐变 + 白色星光）
// 用法：node tools/make-android-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, cb]);
}
function makePng(size, draw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1); raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      const [r, g, b, a] = draw(x / size, y / size);
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
const lerp = (a, b, t) => a + (b - a) * t;
function sparkle(nx, ny) {
  const ax = 0.24, bx = 0.62;
  return (Math.abs(nx) / ax + Math.abs(ny) / bx <= 1) || (Math.abs(nx) / bx + Math.abs(ny) / ax <= 1);
}
function grad(t) { return [Math.round(lerp(255, 167, t)), Math.round(lerp(158, 139, t)), Math.round(lerp(203, 250, t))]; }
function roundedRect(nx, ny, hw, hh, r) {
  const dx = Math.max(Math.abs(nx) - (hw - r), 0), dy = Math.max(Math.abs(ny) - (hh - r), 0);
  return dx * dx + dy * dy <= r * r;
}
const legacy = (nx, ny) => {
  if (!roundedRect(nx, ny, 1, 1, 0.22)) return [0, 0, 0, 0];
  if (sparkle(nx, ny)) return [255, 255, 255, 255];
  const [r, g, b] = grad((1 - ny) / 2);
  return [r, g, b, 255];
};
const round = (nx, ny) => {
  if (nx * nx + ny * ny > 1) return [0, 0, 0, 0];
  if (sparkle(nx, ny)) return [255, 255, 255, 255];
  const [r, g, b] = grad((1 - ny) / 2);
  return [r, g, b, 255];
};
const foreground = (nx, ny) => {
  const s = 0.5;
  if (sparkle(nx / s, ny / s)) return [255, 255, 255, 255];
  return [0, 0, 0, 0];
};

const root = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const dens = [['mipmap-mdpi', 48, 108], ['mipmap-hdpi', 72, 162], ['mipmap-xhdpi', 96, 216], ['mipmap-xxhdpi', 144, 324], ['mipmap-xxxhdpi', 192, 432]];
dens.forEach(([dir, sz, fg]) => {
  const p = path.join(root, dir);
  fs.writeFileSync(path.join(p, 'ic_launcher.png'), makePng(sz, legacy));
  fs.writeFileSync(path.join(p, 'ic_launcher_round.png'), makePng(sz, round));
  fs.writeFileSync(path.join(p, 'ic_launcher_foreground.png'), makePng(fg, foreground));
  console.log('✅', dir, sz + 'x' + sz, '/ fg', fg + 'x' + fg);
});
console.log('✅ 安卓图标生成完成');
