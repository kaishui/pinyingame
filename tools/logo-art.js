// 共享 Logo 绘制（魔法小精灵）：
//   深紫→粉 对角渐变背景 + 柔和光晕 + 中心魔法四角星 + 星尘与点缀
// 供 make-logo / make-android-icons / make-pwa-icons 复用，保证三处图标一致。
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 四角星（twinkle）：p<1 时四角沿坐标轴凸出、对角线内凹，形似 ✨
function twinkle(nx, ny, cx, cy, a, b, p) {
  const x = Math.abs(nx - cx) / a;
  const y = Math.abs(ny - cy) / b;
  return Math.pow(x, p) + Math.pow(y, p) <= 1;
}

function dot(nx, ny, cx, cy, r) {
  const dx = nx - cx, dy = ny - cy;
  return dx * dx + dy * dy <= r * r;
}

// 背景对角渐变 + 左上柔和高光（nx,ny ∈ [-1,1]，ny 向上为正）
function bgColor(nx, ny) {
  const t = clamp((1 - ny) / 2, 0, 1); // 0=顶 1=底
  const h = clamp((1 - nx) / 2, 0, 1); // 0=左 1=右
  const m = t * 0.6 + h * 0.4;
  const c1 = [101, 46, 231], c2 = [158, 78, 246], c3 = [244, 114, 182], c4 = [251, 207, 232];
  let r, g, b;
  if (m < 0.4) {
    const k = m / 0.4;
    r = lerp(c1[0], c2[0], k); g = lerp(c1[1], c2[1], k); b = lerp(c1[2], c2[2], k);
  } else if (m < 0.75) {
    const k = (m - 0.4) / 0.35;
    r = lerp(c2[0], c3[0], k); g = lerp(c2[1], c3[1], k); b = lerp(c2[2], c3[2], k);
  } else {
    const k = (m - 0.75) / 0.25;
    r = lerp(c3[0], c4[0], k); g = lerp(c3[1], c4[1], k); b = lerp(c3[2], c4[2], k);
  }
  // 左上高光
  const dx = nx + 0.42, dy = ny - 0.46;
  const d = Math.sqrt(dx * dx + dy * dy);
  const glow = Math.max(0, 1 - d / 1.15);
  r = lerp(r, 255, glow * 0.28); g = lerp(g, 255, glow * 0.28); b = lerp(b, 255, glow * 0.28);
  return [r, g, b];
}

// 完整图标（不透明）：渐变背景 + 光晕 + 主星 + 点缀
function iconColor(nx, ny) {
  let [r, g, b] = bgColor(nx, ny);

  // 中心大星光晕（白色柔光）
  const dcx = nx, dcy = ny - 0.03;
  const d = Math.sqrt(dcx * dcx + dcy * dcy);
  const glow = Math.max(0, 1 - d / 0.56);
  r = lerp(r, 255, glow * 0.55); g = lerp(g, 255, glow * 0.55); b = lerp(b, 255, glow * 0.55);

  // 中心大四角星（白色，略高）
  if (twinkle(nx, ny, 0, 0.03, 0.5, 0.64, 0.52)) return [255, 255, 255];

  // 小星星 + 星尘
  if (twinkle(nx, ny, 0.52, 0.5, 0.13, 0.16, 0.6)) return [255, 255, 255];
  if (twinkle(nx, ny, -0.52, -0.44, 0.1, 0.125, 0.6)) return [255, 255, 255];
  if (twinkle(nx, ny, 0.42, -0.55, 0.08, 0.1, 0.62)) return [255, 235, 205];
  if (dot(nx, ny, -0.36, 0.55, 0.032)) return [255, 255, 255];
  if (dot(nx, ny, 0.62, 0.06, 0.03)) return [255, 255, 255];
  if (dot(nx, ny, -0.64, -0.04, 0.024)) return [255, 255, 255];
  if (dot(nx, ny, 0.05, 0.72, 0.02)) return [255, 235, 205];
  if (dot(nx, ny, -0.08, -0.68, 0.02)) return [255, 255, 255];

  return [Math.round(r), Math.round(g), Math.round(b)];
}

// 前景层（透明背景，用于安卓自适应图标 foreground，缩放到 66% 安全区）
function foregroundColor(nx, ny) {
  // 主体相对坐标放大 1.7 倍（自适应图标会把 108 缩到 66 的安全区）
  const x = nx / 0.62, y = ny / 0.62;
  if (twinkle(x, y, 0, 0.03, 0.5, 0.64, 0.52)) return [255, 255, 255, 255];
  if (twinkle(x, y, 0.52, 0.5, 0.13, 0.16, 0.6)) return [255, 255, 255, 255];
  if (twinkle(x, y, -0.52, -0.44, 0.1, 0.125, 0.6)) return [255, 255, 255, 255];
  if (twinkle(x, y, 0.42, -0.55, 0.08, 0.1, 0.62)) return [255, 235, 205, 255];
  if (dot(x, y, -0.36, 0.55, 0.032)) return [255, 255, 255, 255];
  if (dot(x, y, 0.62, 0.06, 0.03)) return [255, 255, 255, 255];
  if (dot(x, y, -0.64, -0.04, 0.024)) return [255, 255, 255, 255];
  if (dot(x, y, 0.05, 0.72, 0.02)) return [255, 235, 205, 255];
  if (dot(x, y, -0.08, -0.68, 0.02)) return [255, 255, 255, 255];
  return [0, 0, 0, 0];
}

// 启动图：对角渐变（无点缀）
function splashColor(nx, ny) {
  return bgColor(nx, ny).map(Math.round);
}

module.exports = { lerp, twinkle, dot, bgColor, iconColor, foregroundColor, splashColor };
