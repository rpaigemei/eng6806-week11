// Helpers shared by the puzzle and decorate scenes.
import { PAL, UI } from '../render/palette.js';
import { rect, drawText, fitText, hash, drawSparkle } from '../render/draw.js';
import { itemSprite, drawItemOutlined, iconSprite } from '../render/sprites.js';
import { view } from '../view.js';

export const TRAY_Y = 132;
export const PILE_W = 236;

/** Messy-but-stable spot for an item in the pile tray, from its home index. */
export function pilePos(level, itemId) {
  const i = level.items.indexOf(itemId);
  const n = level.items.length;
  const cols = Math.ceil(n / 2);
  const pitch = Math.min(28, (PILE_W - 30) / cols);
  const total = (cols - 1) * pitch + pitch / 2 + 16;
  const x0 = 4 + (PILE_W - total) / 2;
  const row = i % 2;
  const col = Math.floor(i / 2);
  const h = hash(itemId);
  return {
    x: Math.round(x0 + col * pitch + (row ? pitch / 2 : 0) + (h - 0.5) * 4),
    y: Math.round(146 + row * 15 + ((h * 7) % 1 - 0.5) * 3),
  };
}

export function drawTray(ctx) {
  rect(ctx, PAL.k, 0, TRAY_Y, 320, 48);
  rect(ctx, UI.tray, 0, TRAY_Y + 1, 320, 47);
  rect(ctx, UI.trayLight, 0, TRAY_Y + 1, 320, 1);
  for (let y = TRAY_Y + 12; y < 180; y += 9) {
    rect(ctx, UI.trayDark, 0, y, 320, 1);
    for (let x = (y * 7) % 50; x < 320; x += 50) rect(ctx, UI.trayDark, x, y - 8, 1, 8);
  }
  // info strip
  rect(ctx, UI.trayDark, 0, TRAY_Y + 1, 320, 12);
  // pile mat
  rect(ctx, '#3e271d', 3, TRAY_Y + 13, PILE_W, 33);
  rect(ctx, PAL.k, 3, TRAY_Y + 13, PILE_W, 1);
}

export function drawInfo(ctx, text, color = UI.paper) {
  const fit = fitText(text, 310, { size: 8.5 });
  drawText(ctx, fit.text, 5, TRAY_Y + 4, color, { size: fit.size });
}

/** Smoothly glides each item's drawn position toward its logical spot. */
export class Glide {
  constructor() {
    this.pos = new Map();
  }
  get(id, target, dt) {
    let p = this.pos.get(id);
    if (!p) {
      p = { ...target };
      this.pos.set(id, p);
    }
    const k = Math.min(1, dt * 18);
    p.x += (target.x - p.x) * k;
    p.y += (target.y - p.y) * k;
    if (Math.abs(target.x - p.x) < 0.3) p.x = target.x;
    if (Math.abs(target.y - p.y) < 0.3) p.y = target.y;
    return p;
  }
  snap(id, target) {
    this.pos.set(id, { ...target });
  }
}

// Felt plate behind tray items: light enough that charcoal items read clearly (about 3.8:1).
const PLATE = '#a98a74';
const PLATE_EDGE = '#8a6c58';
// Soft light rim so black items stand out on dark rooms.
const DARK_RIM = '#9a90b8';

/**
 * Draw a decoration. `pop` (0..1) plays a squash-and-stretch landing; `plate`
 * puts a felt coaster behind it (tray); black items get a light rim.
 */
export function drawItem(ctx, item, x, y, { outline = null, lifted = false, plate = false, pop = null } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  if (lifted) {
    ctx.globalAlpha = 0.3;
    rect(ctx, PAL.k, x + 3, y + 17, 10, 2);
    ctx.globalAlpha = 1;
    y -= 3;
  }
  if (plate) {
    rect(ctx, PLATE_EDGE, x, y + 1, 16, 15);
    rect(ctx, PLATE_EDGE, x + 1, y, 14, 17);
    rect(ctx, PLATE, x + 1, y + 1, 14, 15);
  }
  if (pop !== null && pop < 1) {
    // squash on landing, then spring back
    const k = Math.sin(pop * Math.PI) * (1 - pop);
    const w = Math.round(16 * (1 + 0.3 * k));
    const h = Math.round(16 * (1 - 0.3 * k));
    ctx.drawImage(itemSprite(item), x + 8 - w / 2, y + 16 - h, w, h);
    if (view.colorAssist) ctx.drawImage(iconSprite(`swatch_${item.tags.color}`), x + 10, y + 10);
    return;
  }
  if (!outline && item.tags.color === 'black') outline = DARK_RIM;
  if (outline) drawItemOutlined(ctx, item, x, y, outline);
  else ctx.drawImage(itemSprite(item), x, y);
  if (view.colorAssist) ctx.drawImage(iconSprite(`swatch_${item.tags.color}`), x + 10, y + 10);
}

export function itemInfo(theme, item) {
  const cat = theme.vocab[item.tags.category]?.[0] || item.tags.category;
  return `${item.name}: ${item.tags.color}, ${item.tags.size}, ${cat}`;
}

/** Simple sparkle/confetti particles. */
export class Particles {
  constructor() {
    this.list = [];
  }
  burst(x, y, n = 8, colors = [PAL.o, PAL.y, PAL.w]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const s = 20 + Math.random() * 30;
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15, life: 0.6 + Math.random() * 0.5, c: colors[i % colors.length], sparkle: i % 3 === 0 });
    }
  }
  /** A little dust puff where something lands (same for every drop: no hints!). */
  puff(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      this.list.push({ x, y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 6 - 4, life: 0.35, c: i % 2 ? UI.paperDark : PAL.W, snow: true });
    }
  }
  snowfall(n = 60, colors = [PAL.w, PAL.c]) {
    for (let i = 0; i < n; i++) {
      this.list.push({ x: Math.random() * 320, y: -Math.random() * 120, vx: (Math.random() - 0.5) * 8, vy: 18 + Math.random() * 20, life: 6, c: colors[Math.floor(Math.random() * colors.length)], snow: true });
    }
  }
  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.snow) {
        p.vy += 60 * dt;
        p.vx *= 0.96;
      }
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0 && p.y < 182);
  }
  draw(ctx, t) {
    for (const p of this.list) {
      if (p.sparkle) drawSparkle(ctx, p.x, p.y, p.life > 0.4 ? 2 : 1, p.c);
      else rect(ctx, p.c, p.x, p.y, p.snow && p.c === PAL.w ? 2 : 1, p.snow && p.c === PAL.w ? 2 : 1);
    }
  }
}

/** Ice block over a pinned (pre-placed, unmovable) item. */
export function drawIce(ctx, x, y, t) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.globalAlpha = 0.3;
  rect(ctx, PAL.c, x - 1, y - 1, 18, 18);
  ctx.globalAlpha = 0.85;
  rect(ctx, PAL.c, x - 1, y - 1, 18, 1);
  rect(ctx, PAL.c, x - 1, y + 16, 18, 1);
  rect(ctx, PAL.c, x - 1, y - 1, 1, 18);
  rect(ctx, PAL.c, x + 16, y - 1, 1, 18);
  ctx.globalAlpha = 1;
  // glints that slowly travel across the ice
  const g = Math.floor((t * 6) % 24);
  if (g < 14) {
    rect(ctx, PAL.w, x + g, y + 1, 2, 1);
    rect(ctx, PAL.w, x + g - 1, y + 2, 1, 1);
  }
  rect(ctx, PAL.w, x + 13, y + 12, 1, 3);
  rect(ctx, PAL.w, x + 12, y + 13, 3, 1);
}

/** A red ribbon between two tied items (centers a, b), with a little bow. */
export function drawRibbon(ctx, a, b, t) {
  const steps = Math.max(6, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 2));
  // arch upward so the ribbon (and its bow) stay visible above the items
  const sag = -(Math.min(9, 3 + Math.hypot(b.x - a.x, b.y - a.y) / 8) + Math.sin(t * 2) * 0.6);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = a.x + (b.x - a.x) * u;
    const y = a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * sag;
    rect(ctx, PAL.r, Math.round(x), Math.round(y), 1, 1);
    if (i % 3 === 0) rect(ctx, PAL.R, Math.round(x), Math.round(y) + 1, 1, 1);
  }
  const mx = Math.round((a.x + b.x) / 2);
  const my = Math.round((a.y + b.y) / 2 + sag);
  rect(ctx, PAL.k, mx - 4, my - 2, 9, 5);
  rect(ctx, PAL.r, mx - 3, my - 1, 3, 3);
  rect(ctx, PAL.r, mx + 1, my - 1, 3, 3);
  rect(ctx, PAL.R, mx, my - 1, 1, 3);
}
