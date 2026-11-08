// Halloween rooms: moonlit, purple-and-orange, a little spooky but still cozy.
// Each backdrop = cached static layer + live layer (falling leaves, flicker, bats).
import { PAL } from '../../render/palette.js';
import { rect } from '../../render/draw.js';
import { Snow, makeBackdrop, drawFloor, drawRug, drawFireplace, drawFire, drawMantel } from '../../render/scenery.js';

const H = {
  sky: '#1d1633',
  sky2: '#2b2150',
  wall: '#4a3a5a',
  wallDark: '#3b2e4a',
  wallLine: '#55436a',
  siding: '#4f4560',
  sidingLine: '#3e3550',
  grass: '#2d4a35',
  grassDark: '#1f3527',
  dirt: '#5a3b2c',
  stone: '#6a6478',
  glow: '#9fd273',
};

export const LEAF_COLORS = [PAL.a, PAL.A];

// ---------- shared pieces ----------

function nightSky(ctx, x, y, w, h) {
  rect(ctx, H.sky, x, y, w, h);
  rect(ctx, H.sky2, x, y + Math.round(h * 0.6), w, Math.round(h * 0.4));
  for (let i = 0; i < Math.round(w / 9); i++) {
    rect(ctx, i % 3 ? PAL.u : PAL.w, x + ((i * 53) % w), y + ((i * 29) % Math.max(1, h - 6)), 1, 1);
  }
}

function moon(ctx, cx, cy, r = 6) {
  ctx.globalAlpha = 0.15;
  for (let dy = -r - 3; dy <= r + 3; dy++) {
    const hw = Math.round(Math.sqrt(Math.max(0, (r + 3) ** 2 - dy * dy)));
    rect(ctx, PAL.e, cx - hw, cy + dy, hw * 2, 1);
  }
  ctx.globalAlpha = 1;
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.round(Math.sqrt(r * r - dy * dy));
    rect(ctx, PAL.e, cx - hw, cy + dy, hw * 2, 1);
  }
  rect(ctx, PAL.a, cx - 2, cy - 2, 2, 2);
  rect(ctx, PAL.a, cx + 2, cy + 1, 2, 1);
}

/** Bare spooky tree silhouette. */
function bareTree(ctx, x, base, h) {
  rect(ctx, PAL.D, x - 1, base - h, 3, h);
  const branch = (bx, by, dir, len) => {
    for (let i = 0; i < len; i++) rect(ctx, PAL.D, bx + dir * i, by - Math.round(i * 0.7), 1, 1);
  };
  branch(x, base - h + 6, -1, 8);
  branch(x + 1, base - h + 3, 1, 9);
  branch(x, base - h + 12, 1, 6);
  branch(x, base - h + 15, -1, 7);
}

function spookyWindow(ctx, x, y, w, h) {
  rect(ctx, PAL.k, x - 4, y - 4, w + 8, h + 8);
  rect(ctx, PAL.N, x - 3, y - 3, w + 6, h + 6);
  nightSky(ctx, x, y, w, h);
  moon(ctx, x + w - 10, y + 9, 5);
  bareTree(ctx, x + 8, y + h, Math.round(h * 0.7));
  rect(ctx, H.grassDark, x, y + h - 3, w, 3);
}

function windowBars(ctx, x, y, w, h) {
  rect(ctx, PAL.N, x + Math.floor(w / 2) - 1, y, 2, h);
  rect(ctx, PAL.N, x, y + Math.floor(h / 2) - 1, w, 2);
  rect(ctx, PAL.k, x - 6, y + h + 3, w + 12, 5);
  rect(ctx, PAL.n, x - 5, y + h + 3, w + 10, 3);
}

function makeWindow(x, y, w, h, seed) {
  const leaves = new Snow(x, y, w, h, Math.round((w * h) / 140), seed, { colors: LEAF_COLORS, speed: 1.4 });
  return {
    static: (ctx) => spookyWindow(ctx, x, y, w, h),
    live(ctx, t, dt) {
      leaves.update(dt, t);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      leaves.draw(ctx);
      // a bat flits past now and then
      const p = (t * 0.12) % 1;
      if (p < 0.5) {
        const bx = x + p * 2 * (w + 10) - 5;
        const by = y + 10 + Math.sin(t * 6) * 2;
        const flap = Math.floor(t * 10) % 2;
        rect(ctx, PAL.D, bx, by, 3, 2);
        rect(ctx, PAL.D, bx - 2, by - flap, 2, 1);
        rect(ctx, PAL.D, bx + 3, by - flap, 2, 1);
      }
      ctx.restore();
      windowBars(ctx, x, y, w, h);
    },
  };
}

function wallpaper(ctx) {
  rect(ctx, H.wall, 0, 0, 320, 108);
  for (let x = 8; x < 320; x += 20) rect(ctx, H.wallLine, x, 0, 1, 84);
  for (let y = 10, r = 0; y < 82; y += 14, r++) {
    for (let x = 18 + (r % 2) * 10; x < 320; x += 20) {
      rect(ctx, H.wallLine, x, y, 1, 3);
      rect(ctx, H.wallLine, x - 1, y + 1, 3, 1);
    }
  }
  rect(ctx, H.wallDark, 0, 84, 320, 24);
  rect(ctx, PAL.D, 0, 84, 320, 2);
  rect(ctx, PAL.N, 0, 104, 320, 4);
  rect(ctx, PAL.k, 0, 107, 320, 1);
}

function cobweb(ctx, x, y, size, flip = 1) {
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < size; i++) {
    rect(ctx, PAL.s, x + flip * i, y, 1, 1);
    rect(ctx, PAL.s, x, y + i, 1, 1);
    rect(ctx, PAL.s, x + flip * i, y + i, 1, 1);
  }
  for (const r of [Math.round(size * 0.4), Math.round(size * 0.75)]) {
    for (let i = 0; i <= r; i++) rect(ctx, PAL.s, x + flip * i, y + r - Math.round(i * 0.9), 1, 1);
  }
  ctx.globalAlpha = 1;
}

function shelf(ctx, x, y, w) {
  rect(ctx, PAL.k, x - 1, y - 1, w + 2, 5);
  rect(ctx, PAL.N, x, y, w, 3);
  rect(ctx, PAL.n, x, y, w, 1);
  rect(ctx, PAL.N, x + 4, y + 3, 2, 4);
  rect(ctx, PAL.N, x + w - 6, y + 3, 2, 4);
}

function garland(ctx, t, x0, x1, y, lit = 1) {
  // paper bats and orange bulbs instead of Christmas lights
  for (let x = x0; x < x1; x++) {
    const u = ((x - x0) % 40) / 40;
    const yy = y + Math.round(Math.sin(u * Math.PI) * 4);
    rect(ctx, PAL.D, x, yy, 1, 1);
    if ((x - x0) % 20 === 10) {
      const on = ((x * 7) % 40) < lit * 40 && Math.sin(t * 1.5 + x) > -0.3;
      ctx.globalAlpha = on ? 0.3 : 0;
      rect(ctx, PAL.a, x - 2, yy, 5, 5);
      ctx.globalAlpha = 1;
      rect(ctx, on ? PAL.a : PAL.A, x - 1, yy + 1, 3, 3);
    } else if ((x - x0) % 20 === 0) {
      rect(ctx, PAL.D, x - 2, yy + 1, 5, 1);
      rect(ctx, PAL.D, x, yy + 2, 1, 1);
    }
  }
}

function flicker(ctx, t, x, y) {
  const f = Math.sin(t * 9 + x) * 0.5 + Math.sin(t * 13 + y) * 0.5;
  ctx.globalAlpha = 0.12 + 0.05 * f;
  rect(ctx, PAL.a, x - 8, y - 6, 17, 14);
  ctx.globalAlpha = 1;
  rect(ctx, PAL.y, x, y - 3 + Math.round(f), 1, 2);
  rect(ctx, PAL.o, x, y - 1, 1, 1);
}

// ---------- room 6: front porch ----------
const porchLeaves = new Snow(0, 0, 320, 132, 26, 21, { colors: LEAF_COLORS, speed: 1.6 });
const porch = makeBackdrop(
  (ctx) => {
    nightSky(ctx, 0, 0, 320, 40);
    moon(ctx, 286, 14, 7);
    // house siding
    rect(ctx, H.siding, 0, 24, 320, 84);
    for (let y = 27; y < 108; y += 5) rect(ctx, H.sidingLine, 0, y, 320, 1);
    // roof edge
    rect(ctx, PAL.k, 0, 22, 320, 4);
    rect(ctx, PAL.D, 0, 23, 320, 2);
    // door
    rect(ctx, PAL.k, 143, 38, 34, 66);
    rect(ctx, PAL.V, 145, 40, 30, 64);
    rect(ctx, PAL.v, 148, 44, 11, 24);
    rect(ctx, PAL.v, 161, 44, 11, 24);
    rect(ctx, PAL.v, 148, 72, 11, 26);
    rect(ctx, PAL.v, 161, 72, 11, 26);
    rect(ctx, PAL.y, 169, 74, 2, 2);
    // wreath of leaves on the door
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      rect(ctx, i % 3 ? PAL.A : PAL.a, 159 + Math.round(Math.cos(a) * 6), 54 + Math.round(Math.sin(a) * 6), 2, 2);
    }
    // left window
    spookyWindow(ctx, 30, 30, 48, 34);
    windowBars(ctx, 30, 30, 48, 34);
    // porch deck
    rect(ctx, PAL.N, 0, 104, 320, 28);
    for (let y = 108; y < 132; y += 6) rect(ctx, PAL.k, 0, y, 320, 1);
    for (let x = 0; x < 320; x += 30) rect(ctx, PAL.n, x + 3, 106, 18, 1);
    // steps in front of the door
    rect(ctx, PAL.k, 124, 120, 72, 12);
    rect(ctx, PAL.n, 125, 121, 70, 4);
    rect(ctx, PAL.N, 125, 125, 70, 7);
    // railing on the right
    rect(ctx, PAL.k, 232, 79, 88, 4);
    rect(ctx, PAL.i, 232, 80, 88, 2);
    for (let x = 236; x < 320; x += 8) {
      rect(ctx, PAL.k, x, 82, 3, 22);
      rect(ctx, PAL.i, x, 82, 2, 22);
    }
  },
  (ctx, t, dt, alive = 1) => {
    garland(ctx, t, 0, 320, 27, alive);
    flicker(ctx, t, 135, 62);
    rect(ctx, PAL.k, 133, 60, 5, 8);
    flicker(ctx, t, 185, 62);
    rect(ctx, PAL.k, 183, 60, 5, 8);
    porchLeaves.update(dt, t);
    porchLeaves.draw(ctx);
  }
);

// ---------- room 7: pumpkin patch ----------
const fireflies = Array.from({ length: 14 }, (_, i) => ({ x: (i * 47) % 320, y: 40 + ((i * 31) % 70), p: i * 1.7 }));
const patch = makeBackdrop(
  (ctx) => {
    nightSky(ctx, 0, 0, 320, 70);
    moon(ctx, 52, 18, 9);
    // distant hills and a barn
    for (let x = 0; x < 320; x++) {
      const hh = 8 + Math.round(4 * Math.sin(x / 23) + 3 * Math.sin(x / 9));
      rect(ctx, '#241c3a', x, 70 - hh, 1, hh);
    }
    rect(ctx, PAL.k, 150, 40, 40, 30);
    rect(ctx, PAL.R, 151, 42, 38, 28);
    for (let i = 0; i < 12; i++) rect(ctx, PAL.R, 150 + i * 2, 41 - i, 40 - i * 4, 1);
    rect(ctx, PAL.e, 166, 52, 8, 7);
    bareTree(ctx, 290, 70, 34);
    // field
    rect(ctx, H.grass, 0, 70, 320, 62);
    for (let y = 76; y < 132; y += 7) {
      for (let x = (y * 3) % 11; x < 320; x += 11) rect(ctx, H.grassDark, x, y, 3, 1);
    }
    // fence along the back
    rect(ctx, PAL.k, 0, 66, 320, 3);
    rect(ctx, PAL.t, 0, 67, 320, 1);
    rect(ctx, PAL.k, 0, 74, 320, 3);
    rect(ctx, PAL.t, 0, 75, 320, 1);
    for (let x = 6; x < 320; x += 22) {
      rect(ctx, PAL.k, x - 1, 60, 5, 24);
      rect(ctx, PAL.n, x, 61, 3, 23);
    }
    // vine patch (left, ground)
    rect(ctx, H.dirt, 14, 112, 72, 8);
    for (let x = 16; x < 84; x += 3) rect(ctx, PAL.g, x, 110 + ((x * 7) % 4), 2, 2);
    // hay bale (center)
    rect(ctx, PAL.k, 92, 89, 68, 20);
    rect(ctx, PAL.y, 93, 90, 66, 18);
    for (let x = 95; x < 158; x += 4) rect(ctx, PAL.Y, x, 91, 1, 16);
    rect(ctx, PAL.Y, 93, 98, 66, 1);
    // wheelbarrow (right)
    rect(ctx, PAL.k, 172, 102, 68, 12);
    rect(ctx, PAL.S, 173, 103, 66, 10);
    rect(ctx, PAL.s, 173, 103, 66, 2);
    rect(ctx, PAL.k, 236, 108, 14, 2);
    rect(ctx, PAL.k, 176, 113, 8, 8);
    rect(ctx, PAL.d, 177, 114, 6, 6);
  },
  (ctx, t, dt, alive = 1) => {
    for (const f of fireflies.slice(0, Math.round(fireflies.length * (0.25 + 0.75 * alive)))) {
      const on = Math.sin(t * 2 + f.p) > 0.2;
      if (!on) continue;
      const x = f.x + Math.sin(t * 0.7 + f.p) * 6;
      const y = f.y + Math.cos(t * 0.9 + f.p) * 4;
      ctx.globalAlpha = 0.35;
      rect(ctx, H.glow, x - 1, y - 1, 3, 3);
      ctx.globalAlpha = 1;
      rect(ctx, PAL.o, x, y, 1, 1);
    }
  }
);

// ---------- room 8: witch's kitchen ----------
const kitchenWin = makeWindow(240, 14, 48, 36, 31);
const kitchen = makeBackdrop(
  (ctx) => {
    wallpaper(ctx);
    kitchenWin.static(ctx);
    drawFloor(ctx);
    // shelves on the left
    shelf(ctx, 14, 44, 100);
    shelf(ctx, 72, 70, 52);
    // jars on the high shelf (decor)
    for (const [x, c] of [[66, PAL.l], [78, PAL.u], [90, PAL.e]]) {
      rect(ctx, PAL.k, x, 34, 8, 10);
      rect(ctx, c, x + 1, 37, 6, 7);
      rect(ctx, PAL.n, x + 1, 33, 6, 2);
    }
    // counter
    rect(ctx, PAL.k, 8, 97, 74, 11);
    rect(ctx, PAL.N, 9, 98, 72, 10);
    rect(ctx, PAL.n, 9, 98, 72, 2);
    // hearth on the right
    rect(ctx, PAL.k, 220, 107, 70, 6);
    rect(ctx, H.stone, 221, 108, 68, 4);
    // big cauldron in the middle
    rect(ctx, PAL.k, 128, 74, 64, 34);
    rect(ctx, PAL.d, 130, 76, 60, 30);
    rect(ctx, PAL.S, 134, 78, 6, 20);
    rect(ctx, PAL.k, 124, 70, 72, 6);
    rect(ctx, PAL.d, 126, 71, 68, 4);
    rect(ctx, PAL.g, 130, 68, 60, 3);
    // hanging herbs
    for (const x of [140, 160, 180]) {
      rect(ctx, PAL.N, x, 0, 1, 18);
      rect(ctx, PAL.g, x - 3, 18, 7, 6);
      rect(ctx, PAL.l, x - 1, 19, 2, 2);
    }
    cobweb(ctx, 0, 0, 14, 1);
  },
  (ctx, t, dt, alive = 1) => {
    kitchenWin.live(ctx, t, dt);
    // bubbling brew + fire under the cauldron
    const pulse = 0.06 * Math.sin(t * 3);
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = (0.16 + pulse) * (1 - i / 4);
      rect(ctx, H.glow, 130 - i * 6, 64 - i * 4, 60 + i * 12, 4);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.8 + i / 5) % 1;
      const bx = 136 + i * 11 + Math.round(Math.sin(t * 2 + i) * 2);
      rect(ctx, PAL.l, bx, 66 - p * 16, p > 0.7 ? 1 : 2, p > 0.7 ? 1 : 2);
    }
    for (let i = 0; i < 6; i++) {
      const fh = 3 + Math.round(3 * Math.abs(Math.sin(t * 6 + i * 1.3)));
      rect(ctx, PAL.r, 136 + i * 9, 108 - fh, 4, fh);
      rect(ctx, PAL.y, 137 + i * 9, 109 - fh + 1, 2, Math.max(1, fh - 2));
    }
  }
);

// ---------- room 9: dusty attic ----------
const atticWin = makeWindow(140, 10, 40, 32, 41);
const attic = makeBackdrop(
  (ctx) => {
    rect(ctx, '#3e3046', 0, 0, 320, 108);
    for (let x = 0; x < 320; x += 14) rect(ctx, '#33283b', x, 0, 1, 108);
    for (let i = 0; i < 40; i++) {
      rect(ctx, PAL.D, i * 2, 40 - i, 3, 4);
      rect(ctx, PAL.D, 318 - i * 2 - 2, 40 - i, 3, 4);
    }
    atticWin.static(ctx);
    drawFloor(ctx);
    // old trunk (left)
    rect(ctx, PAL.k, 10, 106, 70, 18);
    rect(ctx, PAL.N, 11, 107, 68, 16);
    rect(ctx, PAL.Y, 11, 110, 68, 1);
    rect(ctx, PAL.Y, 42, 107, 4, 6);
    // rocking chair (middle)
    rect(ctx, PAL.k, 126, 74, 4, 32);
    rect(ctx, PAL.N, 127, 75, 2, 30);
    rect(ctx, PAL.k, 126, 104, 50, 4);
    rect(ctx, PAL.N, 127, 105, 48, 2);
    for (let i = 0; i < 52; i++) rect(ctx, PAL.N, 124 + i, 122 - Math.round(Math.sin((i / 52) * Math.PI) * 3), 1, 2);
    rect(ctx, PAL.N, 130, 106, 2, 16);
    rect(ctx, PAL.N, 170, 106, 2, 16);
    // shelf (right, high)
    shelf(ctx, 226, 56, 64);
    // crates (right, floor)
    rect(ctx, PAL.k, 232, 106, 62, 20);
    rect(ctx, PAL.n, 233, 107, 60, 18);
    for (let x = 233; x < 293; x += 6) rect(ctx, PAL.N, x, 107, 1, 18);
    // sheet-covered furniture shapes
    rect(ctx, PAL.W, 90, 82, 26, 26);
    rect(ctx, PAL.w, 92, 80, 22, 6);
    rect(ctx, PAL.W, 196, 88, 22, 20);
    cobweb(ctx, 0, 0, 18, 1);
    cobweb(ctx, 319, 0, 14, -1);
  },
  (ctx, t, dt, alive = 1) => {
    atticWin.live(ctx, t, dt);
    // swinging bulb
    const sw = Math.sin(t * 1.2) * 3;
    rect(ctx, PAL.k, 210 + sw / 2, 4, 1, 14);
    ctx.globalAlpha = 0.15;
    rect(ctx, PAL.e, 200 + sw, 14, 22, 16);
    ctx.globalAlpha = 1;
    rect(ctx, PAL.e, 208 + sw, 18, 5, 5);
  }
);

// ---------- room 10: haunted parlor ----------
const FIRE = { x: 100, y: 62, w: 120, h: 46 };
const parlorWin = makeWindow(20, 18, 40, 40, 51);
const parlor = makeBackdrop(
  (ctx) => {
    wallpaper(ctx);
    parlorWin.static(ctx);
    drawFloor(ctx);
    drawRug(ctx, 160, 114, 150);
    drawFireplace(ctx, FIRE.x, FIRE.y, FIRE.w, FIRE.h);
    drawMantel(ctx, 92, 56, 136);
    // portraits
    for (const [x, y] of [[106, 6], [196, 6]]) {
      rect(ctx, PAL.k, x - 1, y - 1, 20, 24);
      rect(ctx, PAL.Y, x, y, 18, 22);
      rect(ctx, PAL.V, x + 2, y + 2, 14, 18);
      rect(ctx, PAL.i, x + 6, y + 6, 6, 6);
      rect(ctx, PAL.d, x + 5, y + 12, 8, 8);
    }
    // side table (left)
    rect(ctx, PAL.k, 14, 85, 64, 5);
    rect(ctx, PAL.N, 15, 86, 62, 3);
    rect(ctx, PAL.N, 20, 89, 3, 19);
    rect(ctx, PAL.N, 69, 89, 3, 19);
    // chaise on the right floor
    rect(ctx, PAL.k, 232, 104, 80, 16);
    rect(ctx, PAL.V, 233, 105, 78, 14);
    rect(ctx, PAL.v, 233, 105, 78, 3);
    cobweb(ctx, 319, 0, 16, -1);
  },
  (ctx, t, dt, alive = 1) => {
    parlorWin.live(ctx, t, dt);
    drawFire(ctx, t, FIRE.x, FIRE.y, FIRE.w, FIRE.h, alive);
    // a shy ghost drifting near the ceiling
    const gx = 250 + Math.sin(t * 0.5) * 30;
    const gy = 22 + Math.sin(t * 1.3) * 3;
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 0.8);
    rect(ctx, PAL.w, gx, gy, 10, 10);
    rect(ctx, PAL.w, gx + 1, gy - 1, 8, 1);
    rect(ctx, PAL.w, gx, gy + 10, 2, 2);
    rect(ctx, PAL.w, gx + 4, gy + 10, 2, 2);
    rect(ctx, PAL.w, gx + 8, gy + 10, 2, 2);
    rect(ctx, PAL.k, gx + 2, gy + 3, 2, 2);
    rect(ctx, PAL.k, gx + 6, gy + 3, 2, 2);
    ctx.globalAlpha = 1;
  }
);



/** Little seasonal scene for the title-screen window. */
export function windowScene() {
  let leaves = null;
  return (ctx, r, t, dt) => {
    leaves ??= new Snow(r.x, r.y, r.w, r.h, Math.round((r.w * r.h) / 110), 61, { colors: LEAF_COLORS, speed: 1.4 });
    nightSky(ctx, r.x, r.y, r.w, r.h);
    moon(ctx, r.x + r.w - 12, r.y + 10, 6);
    bareTree(ctx, r.x + 10, r.y + r.h, Math.round(r.h * 0.65));
    rect(ctx, H.grassDark, r.x, r.y + r.h - 4, r.w, 4);
    for (const x of [r.x + r.w / 2 - 4, r.x + r.w / 2 + 6]) {
      rect(ctx, PAL.a, x, r.y + r.h - 8, 6, 5);
      rect(ctx, PAL.g, x + 2, r.y + r.h - 9, 2, 1);
    }
    leaves.update(dt, t);
    leaves.draw(ctx);
    const p = (t * 0.15) % 1;
    const bx = r.x + p * (r.w + 10) - 5;
    const flap = Math.floor(t * 10) % 2;
    rect(ctx, PAL.D, bx, r.y + 14, 3, 2);
    rect(ctx, PAL.D, bx - 2, r.y + 14 - flap, 2, 1);
    rect(ctx, PAL.D, bx + 3, r.y + 14 - flap, 2, 1);
  };
}

// ---------- bonus room: Moonlit Garden ----------
const gardenLeaves = new Snow(0, 0, 320, 132, 30, 91, { colors: LEAF_COLORS, speed: 1.5 });
const gardenFlies = Array.from({ length: 16 }, (_, i) => ({ x: (i * 41) % 320, y: 30 + ((i * 29) % 80), p: i * 1.3 }));
export const garden = makeBackdrop(
  (ctx) => {
    nightSky(ctx, 0, 0, 320, 80);
    moon(ctx, 160, 26, 16);
    // hedges along the back
    for (let x = 0; x < 320; x++) {
      const h = 34 + Math.round(3 * Math.sin(x / 6) + 2 * Math.sin(x / 2.3));
      rect(ctx, H.grassDark, x, 96 - h, 1, h);
      if ((x * 13) % 7 === 0) rect(ctx, PAL.G, x, 96 - h + 3, 1, 2);
    }
    // lawn and stone path
    rect(ctx, H.grass, 0, 96, 320, 36);
    for (let y = 100; y < 132; y += 6) for (let x = (y * 3) % 13; x < 320; x += 13) rect(ctx, H.grassDark, x, y, 3, 1);
    for (let i = 0; i < 6; i++) {
      const w = 22 + i * 6;
      rect(ctx, H.stone, 160 - w / 2, 108 + i * 4, w, 3);
      rect(ctx, '#7c7690', 160 - w / 2, 108 + i * 4, w, 1);
    }
    // stone wall (left)
    rect(ctx, PAL.k, 10, 86, 70, 24);
    for (let r = 0; r < 4; r++) {
      for (let x = 11 + (r % 2) * 6; x < 79; x += 12) {
        rect(ctx, H.stone, x, 87 + r * 6, 11, 5);
        rect(ctx, '#7c7690', x, 87 + r * 6, 11, 1);
      }
    }
    // garden arch (center) with vines
    rect(ctx, PAL.k, 126, 36, 68, 6);
    rect(ctx, PAL.n, 127, 37, 66, 4);
    for (const x of [128, 186]) {
      rect(ctx, PAL.k, x - 1, 40, 8, 64);
      rect(ctx, PAL.n, x, 40, 6, 64);
      for (let y = 44; y < 100; y += 5) rect(ctx, PAL.g, x + ((y * 3) % 5), y, 2, 2);
    }
    for (let x = 128; x < 194; x += 4) rect(ctx, PAL.g, x, 41 + ((x * 7) % 3), 3, 2);
    // bench under the arch
    rect(ctx, PAL.k, 128, 103, 64, 5);
    rect(ctx, PAL.n, 129, 104, 62, 3);
    rect(ctx, PAL.N, 132, 107, 3, 8);
    rect(ctx, PAL.N, 185, 107, 3, 8);
    // lantern post (right)
    rect(ctx, PAL.k, 263, 62, 6, 50);
    rect(ctx, PAL.D, 264, 62, 4, 50);
    rect(ctx, PAL.k, 246, 61, 42, 4);
    rect(ctx, PAL.D, 247, 62, 40, 2);
    // flower bed (right front)
    rect(ctx, PAL.k, 230, 115, 64, 8);
    rect(ctx, H.dirt, 231, 116, 62, 6);
    for (let x = 233; x < 292; x += 5) rect(ctx, x % 2 ? PAL.v : PAL.a, x, 113, 2, 2);
  },
  (ctx, t, dt, alive = 1) => {
    // the lantern on its post glows brighter as the garden wakes
    const f = 0.15 + 0.25 * alive + 0.04 * Math.sin(t * 7);
    ctx.globalAlpha = f;
    rect(ctx, PAL.a, 254, 30, 24, 24);
    ctx.globalAlpha = 1;
    rect(ctx, PAL.k, 261, 36, 10, 14);
    rect(ctx, alive > 0.2 ? PAL.y : PAL.A, 263, 38, 6, 10);
    rect(ctx, PAL.k, 260, 34, 12, 2);
    for (const fl of gardenFlies.slice(0, Math.round(gardenFlies.length * (0.2 + 0.8 * alive)))) {
      if (Math.sin(t * 2 + fl.p) < 0.2) continue;
      const x = fl.x + Math.sin(t * 0.7 + fl.p) * 6;
      const y = fl.y + Math.cos(t * 0.9 + fl.p) * 4;
      ctx.globalAlpha = 0.35;
      rect(ctx, H.glow, x - 1, y - 1, 3, 3);
      ctx.globalAlpha = 1;
      rect(ctx, PAL.o, x, y, 1, 1);
    }
    gardenLeaves.update(dt, t);
    gardenLeaves.draw(ctx);
  }
);

export const BACKDROPS = { porch, patch, kitchen, attic, parlor, garden };
