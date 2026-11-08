// Text, panels and small drawing helpers.
import { UI, PAL } from './palette.js';

export function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ---------- text ----------
// All text uses VT323 (bundled, SIL OFL 1.1): a pixel-terminal face that matches
// the art but stays easy to read. Sizes are nominal logical pixels; VT323 runs
// small for its size, so it's drawn a bit larger. The canvas renders at full
// device resolution, so text is sharp at every scale.

const FAMILY = '"VT323", ui-monospace, Menlo, Consolas, monospace';
const SIZE_BOOST = 1.4;
export const TAG_TEXT = { size: 7.5 };

// VT323 has one weight; `bold` is accepted for call-site intent but never faked.
const fontOf = (size) => `400 ${size * SIZE_BOOST}px ${FAMILY}`;
let measureCtx = null;
const clean = (str) => String(str).replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');

/** Big headline text: `title: n` is roughly n times body size. */
const resolve = ({ size = 8, title = 0 }) => (title ? 7 * title : size);

/** Width of a string in logical pixels. */
export function textWidth(str, opts = {}) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = fontOf(resolve(opts));
  return measureCtx.measureText(clean(str)).width;
}

/**
 * Draw text, vertically centered on y + 2.5 (or y + 2.5*title for headlines),
 * which is where the game's layouts expect a line. align: 'left' | 'center' | 'right'.
 * Returns the width.
 */
export function drawText(ctx, str, x, y, color = UI.ink, opts = {}) {
  const { align = 'left', shadow = null, title = 0 } = opts;
  str = clean(str);
  const size = resolve(opts);
  const w = textWidth(str, opts);
  let sx = x;
  if (align === 'center') sx = x - w / 2;
  else if (align === 'right') sx = x - w;
  ctx.font = fontOf(size);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const cy = y + 2.5 * (title || 1);
  if (shadow) {
    const d = title ? 1 : 0.5;
    ctx.fillStyle = shadow;
    ctx.fillText(str, sx + d, cy + d);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, sx, cy);
  return w;
}

/** Greedy word wrap to a pixel width. */
export function wrapText(str, maxWidth, opts = {}) {
  const words = clean(str).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (textWidth(test, opts) <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** One line that fits: shrink a little, then trim with an ellipsis. Returns { text, size }. */
export function fitText(str, maxWidth, { size = 8, minSize = 7 } = {}) {
  str = clean(str);
  for (let s = size; s >= minSize; s -= 0.5) {
    if (textWidth(str, { size: s }) <= maxWidth) return { text: str, size: s };
  }
  let t = str;
  while (t.length > 1 && textWidth(`${t}\u2026`, { size: minSize }) > maxWidth) t = t.slice(0, -1);
  return { text: `${t.trimEnd()}\u2026`, size: minSize };
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
