// 生成「魔法小精灵」Logo 源图（用于 @capacitor/assets 生成安卓/iOS 图标与启动图）
// 用法：node tools/make-logo.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
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
      const [r, g, b] = draw(x / size, y / size);
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// 图标绘制：粉紫渐变 + 白色四角星光（魔法小精灵）
function iconPixel(fx, fy) {
  const nx = fx * 2 - 1;            // -1..1
  const ny = 1 - fy * 2;            // 上正下负
  const t = (1 - ny) / 2;           // 0=顶部 1=底部
  let r = lerp(255, 167, t), g = lerp(158, 139, t), b = lerp(203, 250, t);

  const ax = 0.24, bx = 0.62;       // 星光窄/长半径
  const inStar = (Math.abs(nx) / ax + Math.abs(ny) / bx <= 1) ||
                 (Math.abs(nx) / bx + Math.abs(ny) / ax <= 1);
  const d = Math.sqrt(nx * nx + ny * ny);
  const inGlow = d < 0.52;

  if (inStar) { r = 255; g = 255; b = 255; }
  else if (inGlow) { const k = 0.22 * (1 - d / 0.52); r = lerp(r, 255, k); g = lerp(g, 255, k); b = lerp(b, 255, k); }
  return [Math.round(r), Math.round(g), Math.round(b)];
}
// 启动图：纯渐变
function splashPixel(fx, fy) {
  const t = fy;
  return [Math.round(lerp(255, 167, t)), Math.round(lerp(158, 139, t)), Math.round(lerp(203, 250, t))];
}

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon.png'), makePng(1024, iconPixel));
fs.writeFileSync(path.join(outDir, 'splash.png'), makePng(2732, splashPixel));
console.log('✅ 已生成 assets/icon.png (1024) 与 assets/splash.png (2732)');
