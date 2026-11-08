// Helpers shared by the puzzle and decorate scenes.
import { PAL, UI } from '../render/palette.js';
import { rect, drawText, fitText, hash, drawSparkle } from '../render/draw.js';
import { itemSprite, drawItemOutlined } from '../render/sprites.js';

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

export function drawItem(ctx, item, x, y, { outline = null, lifted = false } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  if (lifted) {
    ctx.globalAlpha = 0.3;
    rect(ctx, PAL.k, x + 3, y + 17, 10, 2);
    ctx.globalAlpha = 1;
    y -= 3;
  }
  if (outline) drawItemOutlined(ctx, item, x, y, outline);
  else ctx.drawImage(itemSprite(item), x, y);
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
  snowfall(n = 60) {
    for (let i = 0; i < n; i++) {
      this.list.push({ x: Math.random() * 320, y: -Math.random() * 120, vx: (Math.random() - 0.5) * 8, vy: 18 + Math.random() * 20, life: 6, c: Math.random() < 0.5 ? PAL.w : PAL.c, snow: true });
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
