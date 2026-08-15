// 重新生成安卓各分辨率启动图（splash.png），使用与图标一致的新渐变
// 用法：node tools/make-splash.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { splashColor } = require('./logo-art.js');

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
function makePng(w, h, draw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1); raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const i = row + 1 + x * 4;
      const [r, g, b] = draw(x / w, y / h);
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

// 各 drawable 目录对应的启动图尺寸（与 @capacitor/assets 生成的保持一致）
const res = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const targets = [
  ['drawable', 480, 320],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280]
];

targets.forEach(([dir, w, h]) => {
  const p = path.join(res, dir, 'splash.png');
  fs.writeFileSync(p, makePng(w, h, (fx, fy) => splashColor(fx * 2 - 1, 1 - fy * 2)));
  console.log('✅', dir + '/splash.png', w + 'x' + h);
});
console.log('✅ 安卓启动图生成完成');
