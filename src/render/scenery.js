// Reusable cozy-room pieces drawn with rectangles, plus slot furniture styles.
import { PAL, UI } from './palette.js';
import { rect, drawSparkle } from './draw.js';
import { PITCH, CELL } from '../engine/level.js';

export const ROOM_H = 132;
export const FLOOR_Y = 108;

// ---------- particles ----------

export class Snow {
  /** colors: [bigFlake, smallFlake]; pass leaf colors for autumn. */
  constructor(x, y, w, h, count, seed = 1, { colors = [PAL.w, PAL.c], speed = 1 } = {}) {
    Object.assign(this, { x, y, w, h, colors, speed });
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    this.flakes = Array.from({ length: count }, () => ({
      x: rnd() * w,
      y: rnd() * h,
      v: 4 + rnd() * 8,
      p: rnd() * 6.28,
      big: rnd() < 0.25,
    }));
  }
  update(dt, t) {
    for (const f of this.flakes) {
      f.y += f.v * dt * this.speed;
      f.x += Math.sin(t * 0.8 + f.p) * dt * 3 * (this.speed > 1 ? 4 : 1);
      if (f.y > this.h) {
        f.y -= this.h;
        f.x = (f.x + 37) % this.w;
      }
      if (f.x < 0) f.x += this.w;
      if (f.x > this.w) f.x -= this.w;
    }
  }
  draw(ctx) {
    for (const f of this.flakes) {
      rect(ctx, f.big ? this.colors[0] : this.colors[1], this.x + f.x, this.y + f.y, f.big ? 2 : 1, f.big ? 2 : 1);
    }
  }
}

/** A backdrop = cached static layer + animated layer. */
export function makeBackdrop(drawStatic, drawLive) {
  let cache = null;
  return {
    /** opts.alive (0..1): how awake the room is; live layers scale their lights/fire with it. */
    draw(ctx, t, dt, opts = {}) {
      if (!cache) {
        cache = document.createElement('canvas');
        cache.width = 320;
        cache.height = ROOM_H;
        drawStatic(cache.getContext('2d'));
      }
      ctx.drawImage(cache, 0, 0);
      if (drawLive) drawLive(ctx, t, dt, opts.alive ?? 1);
    },
  };
}

// ---------- walls & floors ----------

export function drawWallpaper(ctx) {
  rect(ctx, UI.wall, 0, 0, 320, FLOOR_Y);
  for (let x = 6; x < 320; x += 16) rect(ctx, UI.wallStripe, x, 0, 2, 84);
  for (let y = 8, row = 0; y < 82; y += 12, row++) {
    for (let x = 13 + (row % 2) * 8; x < 320; x += 16) {
      rect(ctx, UI.wallStripe, x, y, 1, 1);
      rect(ctx, UI.wallStripe, x - 1, y + 1, 3, 1);
      rect(ctx, UI.wallStripe, x, y + 2, 1, 1);
    }
  }
  // wainscot
  rect(ctx, UI.wallDark, 0, 84, 320, 24);
  rect(ctx, PAL.N, 0, 84, 320, 2);
  rect(ctx, PAL.n, 0, 86, 320, 1);
  for (let x = 6; x < 320; x += 36) {
    rect(ctx, UI.wallPanel, x, 90, 28, 1);
    rect(ctx, UI.wallPanel, x, 90, 1, 12);
    rect(ctx, '#6a4454', x + 1, 101, 27, 1);
    rect(ctx, '#6a4454', x + 27, 91, 1, 11);
  }
  rect(ctx, PAL.N, 0, 104, 320, 4);
  rect(ctx, PAL.k, 0, 107, 320, 1);
}

export function drawAtticWall(ctx) {
  rect(ctx, UI.attic, 0, 0, 320, FLOOR_Y);
  for (let x = 0; x < 320; x += 14) {
    rect(ctx, UI.atticLine, x, 0, 1, FLOOR_Y);
    for (let y = 6 + ((x * 7) % 30); y < FLOOR_Y; y += 34) rect(ctx, UI.atticLine, x + 4, y, 1, 1);
  }
  // slanted rafters
  for (let i = 0; i < 40; i++) {
    rect(ctx, PAL.N, i * 2, 40 - i, 3, 4);
    rect(ctx, PAL.N, 318 - i * 2 - 2, 40 - i, 3, 4);
  }
  rect(ctx, PAL.N, 0, 0, 320, 4);
  rect(ctx, PAL.k, 0, 4, 320, 1);
  rect(ctx, PAL.N, 0, 104, 320, 4);
  rect(ctx, PAL.k, 0, 107, 320, 1);
}

export function drawFloor(ctx) {
  rect(ctx, UI.floor, 0, FLOOR_Y, 320, ROOM_H - FLOOR_Y);
  for (let y = FLOOR_Y + 5, row = 0; y < ROOM_H; y += 6, row++) {
    rect(ctx, UI.floorLine, 0, y, 320, 1);
    for (let x = (row % 2) * 23; x < 320; x += 46) rect(ctx, UI.floorLine, x, y - 5, 1, 5);
    for (let x = 9 + (row % 3) * 11; x < 320; x += 33) rect(ctx, UI.floorShine, x, y - 3, 6, 1);
  }
}

export function drawRug(ctx, cx, y, w, h = 14) {
  for (let i = 0; i < h; i++) {
    const t = Math.sin((i / (h - 1)) * Math.PI);
    const hw = Math.round((w / 2) * (0.75 + 0.25 * t));
    rect(ctx, PAL.R, cx - hw, y + i, hw * 2, 1);
    rect(ctx, PAL.w, cx - hw + 3, y + i, 1, 1);
    rect(ctx, PAL.w, cx + hw - 4, y + i, 1, 1);
  }
  rect(ctx, PAL.r, cx - w / 2 + 8, y + 3, w - 16, 1);
  rect(ctx, PAL.r, cx - w / 2 + 8, y + h - 4, w - 16, 1);
  for (let x = cx - w / 2 + 12; x < cx + w / 2 - 12; x += 8) rect(ctx, PAL.y, x, y + h / 2 - 1, 2, 2);
}

// ---------- windows & lights ----------

export function drawWindowFrame(ctx, x, y, w, h) {
  rect(ctx, PAL.k, x - 4, y - 4, w + 8, h + 8);
  rect(ctx, PAL.n, x - 3, y - 3, w + 6, h + 6);
  rect(ctx, PAL.N, x - 1, y - 1, w + 2, h + 2);
  // glass: night gradient bands
  rect(ctx, UI.night, x, y, w, h);
  rect(ctx, UI.night2, x, y + Math.round(h * 0.55), w, Math.round(h * 0.45));
  // moon & stars
  rect(ctx, PAL.o, x + w - 12, y + 5, 5, 5);
  rect(ctx, UI.night, x + w - 10, y + 5, 3, 3);
  for (let i = 0; i < 6; i++) rect(ctx, PAL.c, x + ((i * 37) % (w - 4)) + 2, y + ((i * 13) % (h / 2)) + 3, 1, 1);
  // hills of snow
  for (let i = 0; i < w; i++) {
    const hh = 4 + Math.round(2 * Math.sin(i / 7) + Math.sin(i / 3));
    rect(ctx, PAL.c, x + i, y + h - hh, 1, hh);
    rect(ctx, PAL.w, x + i, y + h - hh, 1, 1);
  }
}

export function drawWindowMullions(ctx, x, y, w, h) {
  rect(ctx, PAL.N, x + Math.floor(w / 2) - 1, y, 2, h);
  rect(ctx, PAL.N, x, y + Math.floor(h / 2) - 1, w, 2);
  // sill
  rect(ctx, PAL.k, x - 6, y + h + 3, w + 12, 5);
  rect(ctx, PAL.n, x - 5, y + h + 3, w + 10, 3);
  rect(ctx, PAL.t, x - 5, y + h + 3, w + 10, 1);
}

export function drawCurtains(ctx, x, y, w, h) {
  for (const side of [0, 1]) {
    const cx = side ? x + w - 6 : x - 8;
    for (let i = 0; i < h + 8; i++) {
      const sway = Math.round(Math.sin(i / 9) * 1);
      rect(ctx, PAL.R, cx + sway, y - 6 + i, 14, 1);
      rect(ctx, PAL.r, cx + sway + 3, y - 6 + i, 2, 1);
      rect(ctx, PAL.r, cx + sway + 9, y - 6 + i, 1, 1);
    }
  }
  rect(ctx, PAL.Y, x - 12, y - 8, w + 24, 2);
}

const BULBS = [PAL.r, PAL.y, PAL.g, PAL.b];

/** A sagging string of lights that slowly twinkles. */
export function drawStringLights(ctx, t, x0 = 0, x1 = 320, y = 3, sag = 4, lit = 1) {
  const span = 40;
  let i = 0;
  for (let x = x0; x < x1; x++) {
    const u = ((x - x0) % span) / span;
    const yy = y + Math.round(Math.sin(u * Math.PI) * sag);
    rect(ctx, PAL.G, x, yy, 1, 1);
    if ((x - x0) % 10 === 5) {
      const color = BULBS[i % 4];
      // bulbs switch on one by one as the room wakes up
      const awake = (i * 7) % 32 < lit * 32;
      const on = awake && Math.sin(t * 2 + i * 1.3) > -0.4;
      ctx.globalAlpha = on ? 0.35 : 0;
      rect(ctx, color, x - 2, yy, 5, 5);
      ctx.globalAlpha = 1;
      rect(ctx, PAL.k, x, yy + 1, 1, 1);
      rect(ctx, on ? color : PAL.S, x - 1, yy + 2, 3, 2);
      if (on) rect(ctx, PAL.w, x - 1, yy + 2, 1, 1);
      i++;
    }
  }
}

// ---------- furniture ----------

/** Layered pixel pine tree. Returns nothing; drawn into static layer. */
export function drawTree(ctx, cx, top, bottom, { a = 0.45, b = 0.5, tier = 24 } = {}) {
  const hwAt = (y) => {
    const d = y - top;
    return Math.round(2 + d * a + (d % tier) * b);
  };
  for (let y = top; y <= bottom; y++) {
    const hw = hwAt(y);
    const d = y - top;
    const edge = d % tier === tier - 1 || y === bottom;
    rect(ctx, PAL.k, cx - hw - 1, y, hw * 2 + 2, 1);
    rect(ctx, edge ? PAL.G : PAL.g, cx - hw, y, hw * 2, 1);
    rect(ctx, PAL.G, cx + Math.floor(hw * 0.35), y, Math.ceil(hw * 0.65), 1);
    for (let x = cx - hw + 1; x < cx + hw - 1; x++) {
      const n = (x * 13 + y * 7) % 37;
      if (n === 0) rect(ctx, PAL.l, x, y, 1, 1);
      else if (n === 5 && !edge) rect(ctx, PAL.G, x, y, 1, 1);
    }
  }
  rect(ctx, PAL.k, cx - 6, bottom + 1, 12, 7);
  rect(ctx, PAL.N, cx - 5, bottom + 1, 10, 6);
  rect(ctx, PAL.n, cx - 4, bottom + 1, 2, 6);
  // pot
  rect(ctx, PAL.k, cx - 14, bottom + 7, 28, 10);
  rect(ctx, PAL.R, cx - 13, bottom + 8, 26, 8);
  rect(ctx, PAL.r, cx - 13, bottom + 8, 26, 2);
  rect(ctx, PAL.y, cx - 13, bottom + 12, 26, 1);
  return hwAt;
}

export function drawBookshelf(ctx, x, y, w, h) {
  rect(ctx, PAL.k, x - 1, y - 1, w + 2, h + 1);
  rect(ctx, PAL.N, x, y, w, h);
  const books = [PAL.r, PAL.g, PAL.b, PAL.y, PAL.R, PAL.B, PAL.G, PAL.t];
  let k = 0;
  for (let sy = y + 3; sy + 14 < y + h; sy += 17) {
    rect(ctx, PAL.n, x + 2, sy + 13, w - 4, 2);
    for (let bx = x + 3; bx < x + w - 5; ) {
      const bw = 3 + (k % 3);
      const bh = 9 + ((k * 5) % 4);
      if ((k * 7) % 11 === 3) {
        // a little plant pot instead of a book
        rect(ctx, PAL.n, bx, sy + 8, 6, 5);
        rect(ctx, PAL.g, bx + 1, sy + 4, 4, 4);
        rect(ctx, PAL.l, bx + 2, sy + 4, 1, 1);
        bx += 8;
      } else {
        rect(ctx, books[k % books.length], bx, sy + 13 - bh, bw, bh);
        rect(ctx, PAL.k, bx + bw, sy + 13 - bh, 1, bh);
        rect(ctx, PAL.o, bx, sy + 15 - bh, bw, 1);
        bx += bw + 1;
      }
      k++;
    }
  }
}

export function drawArmchair(ctx, x, y) {
  rect(ctx, PAL.k, x - 1, y - 1, 46, 37);
  rect(ctx, PAL.B, x, y, 44, 22);
  rect(ctx, PAL.b, x + 3, y + 2, 38, 18);
  rect(ctx, PAL.k, x - 3, y + 13, 50, 16);
  rect(ctx, PAL.B, x - 2, y + 14, 10, 14);
  rect(ctx, PAL.B, x + 36, y + 14, 10, 14);
  rect(ctx, PAL.b, x + 8, y + 18, 28, 10);
  rect(ctx, PAL.c, x + 8, y + 18, 28, 1);
  rect(ctx, PAL.N, x, y + 28, 3, 6);
  rect(ctx, PAL.N, x + 41, y + 28, 3, 6);
  // knitted blanket
  rect(ctx, PAL.r, x + 26, y + 6, 12, 16);
  for (let i = 0; i < 16; i += 3) rect(ctx, PAL.w, x + 26, y + 6 + i, 12, 1);
}

export function drawFireplace(ctx, x, y, w, h) {
  rect(ctx, PAL.k, x - 1, y, w + 2, h);
  rect(ctx, UI.brick, x, y, w, h);
  for (let row = 0; row * 5 < h; row++) {
    rect(ctx, UI.mortar, x, y + row * 5 + 4, w, 1);
    for (let bx = x + (row % 2) * 6; bx < x + w; bx += 12) rect(ctx, UI.mortar, bx, y + row * 5, 1, 4);
  }
  const ox = x + 28;
  const ow = w - 56;
  const oy = y + 20;
  const oh = h - 20;
  rect(ctx, PAL.k, ox - 2, oy - 2, ow + 4, oh + 2);
  rect(ctx, '#1a1018', ox, oy, ow, oh);
  rect(ctx, '#2a1820', ox, oy, ow, 4);
  // logs
  rect(ctx, PAL.k, ox + 8, oy + oh - 8, ow - 16, 7);
  rect(ctx, PAL.N, ox + 9, oy + oh - 7, ow - 18, 5);
  rect(ctx, PAL.n, ox + 9, oy + oh - 7, ow - 18, 1);
  rect(ctx, PAL.t, ox + 10, oy + oh - 6, 2, 2);
  rect(ctx, PAL.t, ox + ow - 13, oy + oh - 6, 2, 2);
}

export function drawFire(ctx, t, x, y, w, h, power = 1) {
  const ox = x + 28;
  const ow = w - 56;
  const base = y + h - 7;
  const flicker = 0.05 * Math.sin(t * 9);
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = (0.12 + flicker) * (1 - i / 4);
    rect(ctx, PAL.y, ox - 6 - i * 8, y + h + 4 + i * 4, ow + 12 + i * 16, 4);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 8; i++) {
    const fx = ox + 12 + i * ((ow - 26) / 7);
    const fh = Math.max(2, Math.round((0.35 + 0.65 * power) * (8 + 5 * Math.abs(Math.sin(t * 5.3 + i * 1.7)) + 3 * Math.sin(t * 11 + i * 2.3))));
    rect(ctx, PAL.R, fx - 2, base - fh, 5, fh);
    rect(ctx, PAL.r, fx - 1, base - fh + 2, 4, fh - 2);
    rect(ctx, PAL.y, fx, base - fh + 5, 2, Math.max(1, fh - 5));
    if (fh > 12) rect(ctx, PAL.o, fx, base - 5, 1, 3);
  }
  // embers
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.7 + i / 3) % 1;
    rect(ctx, PAL.y, ox + 18 + i * 12 + Math.sin(t * 3 + i) * 3, base - 10 - p * 20, 1, 1);
  }
}

export function drawMantel(ctx, x, y, w) {
  rect(ctx, PAL.k, x - 1, y - 1, w + 2, 8);
  rect(ctx, PAL.N, x, y, w, 6);
  rect(ctx, PAL.n, x, y, w, 2);
  rect(ctx, PAL.t, x, y, w, 1);
  // garland along the front
  for (let i = 0; i < w; i++) {
    const yy = y + 6 + Math.round(Math.abs(Math.sin((i / w) * Math.PI * 4)) * 3);
    rect(ctx, PAL.g, x + i, yy, 1, 2);
    if (i % 12 === 6) rect(ctx, PAL.r, x + i, yy + 1, 2, 2);
  }
}

export function drawTable(ctx, x, y, w) {
  rect(ctx, PAL.k, x + 7, y + 12, 5, FLOOR_Y - y - 10);
  rect(ctx, PAL.k, x + w - 12, y + 12, 5, FLOOR_Y - y - 10);
  rect(ctx, PAL.N, x + 8, y + 12, 3, FLOOR_Y - y - 10);
  rect(ctx, PAL.N, x + w - 11, y + 12, 3, FLOOR_Y - y - 10);
  rect(ctx, PAL.k, x - 1, y - 1, w + 2, 18);
  rect(ctx, PAL.w, x, y, w, 16);
  for (let cx = x; cx < x + w; cx += 8) {
    rect(ctx, PAL.p, cx, y + 4, 4, 12);
  }
  for (let cy = y + 4; cy < y + 16; cy += 8) rect(ctx, PAL.p, x, cy, w, 4);
  for (let cx = x; cx < x + w; cx += 8) for (let cy = y + 4; cy < y + 16; cy += 8) rect(ctx, PAL.r, cx, cy, 4, 4);
  rect(ctx, PAL.W, x, y, w, 4);
  rect(ctx, PAL.w, x, y, w, 2);
}

export function drawPresentsPile(ctx, x, y) {
  const boxes = [
    [0, 8, 14, 10, PAL.b, PAL.w],
    [12, 4, 16, 14, PAL.r, PAL.y],
    [26, 10, 10, 8, PAL.g, PAL.r],
  ];
  for (const [bx, by, bw, bh, c, rib] of boxes) {
    rect(ctx, PAL.k, x + bx - 1, y + by - 1, bw + 2, bh + 2);
    rect(ctx, c, x + bx, y + by, bw, bh);
    rect(ctx, rib, x + bx + Math.floor(bw / 2) - 1, y + by, 2, bh);
    rect(ctx, rib, x + bx, y + by + Math.floor(bh / 2) - 1, bw, 2);
  }
}

// ---------- slot furniture ----------

export function slotWidth(slot) {
  return slot.capacity * PITCH - (PITCH - CELL);
}

const BOX = '#c9925e';
const BOX_DARK = '#9a6a40';

export function drawSlotBack(ctx, slot) {
  const { x, y } = slot;
  const w = slotWidth(slot);
  switch (slot.style) {
    case 'box':
      rect(ctx, PAL.k, x - 5, y + 3, w + 10, 12);
      rect(ctx, '#5c3a26', x - 4, y + 4, w + 8, 10);
      // flaps
      for (let i = 0; i < 6; i++) {
        rect(ctx, BOX_DARK, x - 5 - i, y + 4 + i, 2, 1);
        rect(ctx, BOX_DARK, x + w + 3 + i, y + 4 + i, 2, 1);
      }
      break;
    case 'basket': {
      const cx = x + w / 2;
      for (let i = -w / 2 - 2; i <= w / 2 + 2; i++) {
        const yy = y + 10 - Math.round(Math.sqrt(Math.max(0, 1 - (i / (w / 2 + 2)) ** 2)) * 12);
        rect(ctx, PAL.N, cx + i, yy, 1, 2);
      }
      break;
    }
    case 'branch': {
      for (let xx = x - 6; xx < x + w + 6; xx += 2) {
        const u = (xx - (x - 6)) / (w + 12);
        rect(ctx, PAL.y, xx, y + 15 + Math.round(Math.sin(u * Math.PI) * 2), 1, 1);
      }
      break;
    }
    case 'tray':
      rect(ctx, PAL.k, x - 6, y + 12, w + 12, 5);
      rect(ctx, PAL.S, x - 5, y + 13, w + 10, 3);
      rect(ctx, PAL.s, x - 4, y + 13, w + 8, 1);
      break;
    default:
      break;
  }
}

export function drawSlotFront(ctx, slot) {
  const { x, y } = slot;
  const w = slotWidth(slot);
  switch (slot.style) {
    case 'box':
      rect(ctx, PAL.k, x - 5, y + 10, w + 10, 13);
      rect(ctx, BOX, x - 4, y + 11, w + 8, 11);
      rect(ctx, '#ddb07a', x - 4, y + 11, w + 8, 1);
      rect(ctx, BOX_DARK, x - 4, y + 21, w + 8, 1);
      rect(ctx, '#ead6a8', x + w / 2 - 3, y + 11, 6, 11);
      break;
    case 'basket':
      rect(ctx, PAL.k, x - 5, y + 9, w + 10, 13);
      rect(ctx, PAL.n, x - 4, y + 10, w + 8, 11);
      for (let yy = y + 11; yy < y + 21; yy += 2) {
        for (let xx = x - 4 + ((yy / 2) % 2); xx < x + w + 4; xx += 3) rect(ctx, PAL.t, xx, yy, 2, 1);
      }
      rect(ctx, PAL.R, x - 4, y + 13, w + 8, 2);
      break;
    case 'hooks':
      break;
    default:
      break;
  }
}

/** Little decorations drawn above slot items, e.g. hooks. */
export function drawSlotHardware(ctx, slot) {
  if (slot.style !== 'hooks') return;
  for (let i = 0; i < slot.capacity; i++) {
    const cx = slot.x + i * PITCH + 6;
    rect(ctx, PAL.Y, cx, slot.y - 4, 1, 4);
    rect(ctx, PAL.y, cx - 1, slot.y - 1, 3, 1);
  }
}

export { drawSparkle };
