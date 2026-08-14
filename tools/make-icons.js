// 生成 PWA 图标（粉色底 + 白色爱心），零依赖，仅用 Node 内置模块。
// 用法：node tools/make-icons.js
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
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const bg = [255, 143, 192];
  const heart = [255, 255, 255];
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      const px = (x / size) * 2.6 - 1.3;
      const py = 1.35 - (y / size) * 2.6; // 向上为正
      const x2 = px * px, y2 = py * py;
      const v = Math.pow(x2 + y2 - 1, 3) - x2 * py * py * py;
      const inHeart = v <= 0;
      raw[i]     = inHeart ? heart[0] : bg[0];
      raw[i + 1] = inHeart ? heart[1] : bg[1];
      raw[i + 2] = inHeart ? heart[2] : bg[2];
      raw[i + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const root = path.join(__dirname, '..');
[[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']].forEach(([s, name]) => {
  const file = path.join(root, name);
  fs.writeFileSync(file, makePng(s));
  console.log('生成', name, s + 'x' + s);
});
