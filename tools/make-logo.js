// 生成「魔法小精灵」Logo 源图（用于 @capacitor/assets 生成安卓/iOS 图标与启动图）
// 用法：node tools/make-logo.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { iconColor, splashColor } = require('./logo-art.js');

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

// 注意：fx,fy ∈ [0,1]，fy 向下；转为 nx,ny ∈ [-1,1]，ny 向上
const iconPixel = (fx, fy) => iconColor(fx * 2 - 1, 1 - fy * 2);
const splashPixel = (fx, fy) => splashColor(fx * 2 - 1, 1 - fy * 2);

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon.png'), makePng(1024, iconPixel));
fs.writeFileSync(path.join(outDir, 'splash.png'), makePng(2732, splashPixel));
console.log('✅ 已生成 assets/icon.png (1024) 与 assets/splash.png (2732)');
