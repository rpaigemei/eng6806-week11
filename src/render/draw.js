// Pixel text, panels and small drawing helpers.
import { GLYPHS } from './font.js';
import { UI, PAL } from './palette.js';

const glyphCache = new Map();

function glyphCanvas(ch, color) {
  const key = ch + color;
  let c = glyphCache.get(key);
  if (c) return c;
  const g = GLYPHS[ch] || GLYPHS['?'];
  c = document.createElement('canvas');
  c.width = 3;
  c.height = 5;
  const x = c.getContext('2d');
  x.fillStyle = color;
  g.forEach((row, r) => {
    for (let i = 0; i < 3; i++) if (row[i] === '#') x.fillRect(i, r, 1, 1);
  });
  glyphCache.set(key, c);
  return c;
}

export function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function textWidth(str, scale = 1) {
  return str.length ? (str.length * 4 - 1) * scale : 0;
}

/** Draw pixel text. align: 'left' | 'center' | 'right'. */
export function drawText(ctx, str, x, y, color = UI.ink, { scale = 1, align = 'left', shadow = null } = {}) {
  str = String(str).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toUpperCase();
  let sx = Math.round(x);
  const w = textWidth(str, scale);
  if (align === 'center') sx = Math.round(x - w / 2);
  else if (align === 'right') sx = Math.round(x - w);
  const sy = Math.round(y);
  if (shadow) drawText(ctx, str, sx + 1, sy + 1, shadow, { scale });
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === ' ') continue;
    ctx.drawImage(glyphCanvas(ch, color), sx + i * 4 * scale, sy, 3 * scale, 5 * scale);
  }
  return w;
}

/** Greedy word wrap to a pixel width. */
export function wrapText(str, maxWidth, scale = 1) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (textWidth(test, scale) <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** A pixel panel with clipped corners. */
export function drawPanel(ctx, x, y, w, h, { fill = UI.paper, border = PAL.k, shade = UI.paperDark, shadow = true } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  if (shadow) {
    ctx.globalAlpha = 0.35;
    rect(ctx, PAL.k, x + 1, y + h, w - 1, 1);
    rect(ctx, PAL.k, x + w, y + 1, 1, h - 1);
    ctx.globalAlpha = 1;
  }
  rect(ctx, border, x + 1, y, w - 2, 1);
  rect(ctx, border, x + 1, y + h - 1, w - 2, 1);
  rect(ctx, border, x, y + 1, 1, h - 2);
  rect(ctx, border, x + w - 1, y + 1, 1, h - 2);
  rect(ctx, fill, x + 1, y + 1, w - 2, h - 2);
  if (shade) rect(ctx, shade, x + 1, y + h - 2, w - 2, 1);
}

/** Dotted 16x16 placeholder for an empty slot cell. */
export function drawGhostCell(ctx, x, y, color = UI.paper, alpha = 0.45) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let i = 1; i < 15; i += 2) {
    ctx.fillRect(x + i, y + 1, 1, 1);
    ctx.fillRect(x + i, y + 14, 1, 1);
    ctx.fillRect(x + 1, y + i, 1, 1);
    ctx.fillRect(x + 14, y + i, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Tiny four-point sparkle. */
export function drawSparkle(ctx, x, y, size, color = PAL.o) {
  x = Math.round(x);
  y = Math.round(y);
  rect(ctx, color, x, y - size, 1, size * 2 + 1);
  rect(ctx, color, x - size, y, size * 2 + 1, 1);
  if (size > 1) rect(ctx, PAL.w, x, y, 1, 1);
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
