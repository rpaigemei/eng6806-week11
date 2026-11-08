// Winter rooms. Each backdrop has a cached static layer and a live layer
// (falling snow in windows, twinkling lights, a crackling fire).
import { PAL, UI } from '../../render/palette.js';
import { rect } from '../../render/draw.js';
import {
  Snow, makeBackdrop, drawWallpaper, drawAtticWall, drawFloor, drawRug, drawWindowFrame, drawWindowMullions,
  drawCurtains, drawStringLights, drawTree, drawBookshelf, drawArmchair, drawFireplace, drawFire, drawMantel,
  drawTable, drawPresentsPile,
} from '../../render/scenery.js';

function makeWindow(x, y, w, h, { curtains = true, seed = 3 } = {}) {
  const snow = new Snow(x, y, w, h, Math.round((w * h) / 70), seed);
  return {
    static(ctx) {
      drawWindowFrame(ctx, x, y, w, h);
    },
    live(ctx, t, dt) {
      snow.update(dt, t);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      snow.draw(ctx);
      ctx.restore();
      drawWindowMullions(ctx, x, y, w, h);
      if (curtains) drawCurtains(ctx, x, y, w, h);
    },
  };
}

function closedBox(ctx, x, y, w, h, tint = '#c9925e') {
  rect(ctx, PAL.k, x - 1, y - 1, w + 2, h + 2);
  rect(ctx, tint, x, y, w, h);
  rect(ctx, '#ddb07a', x, y, w, 1);
  rect(ctx, '#9a6a40', x, y + h - 1, w, 1);
  rect(ctx, '#ead6a8', x + w / 2 - 2, y, 4, h);
}

const atticWin = makeWindow(140, 12, 40, 30, { curtains: false, seed: 5 });
const attic = makeBackdrop(
  (ctx) => {
    drawAtticWall(ctx);
    atticWin.static(ctx);
    drawFloor(ctx);
    closedBox(ctx, 8, 84, 30, 22);
    closedBox(ctx, 12, 66, 24, 17, '#b98450');
    closedBox(ctx, 282, 80, 30, 26);
    closedBox(ctx, 288, 64, 20, 15, '#b98450');
    // a rolled-up rug and a lantern
    rect(ctx, PAL.k, 104, 96, 26, 11);
    rect(ctx, PAL.R, 105, 97, 24, 9);
    rect(ctx, PAL.r, 105, 99, 24, 1);
    rect(ctx, PAL.w, 105, 102, 24, 1);
    rect(ctx, PAL.k, 126, 96, 4, 11);
    rect(ctx, PAL.k, 212, 94, 10, 13);
    rect(ctx, PAL.S, 213, 95, 8, 11);
    rect(ctx, PAL.o, 215, 98, 4, 6);
  },
  (ctx, t, dt) => {
    atticWin.live(ctx, t, dt);
    // a lone bulb hanging from the rafters
    rect(ctx, PAL.k, 200, 5, 1, 16);
    ctx.globalAlpha = 0.18 + 0.03 * Math.sin(t * 2);
    rect(ctx, PAL.o, 190, 18, 21, 14);
    ctx.globalAlpha = 1;
    rect(ctx, PAL.o, 198, 21, 5, 5);
    rect(ctx, PAL.w, 199, 22, 2, 2);
  }
);

const treeWin = makeWindow(30, 18, 44, 40, { seed: 7 });
const tree = makeBackdrop(
  (ctx) => {
    drawWallpaper(ctx);
    treeWin.static(ctx);
    drawBookshelf(ctx, 250, 30, 52, 78);
    drawFloor(ctx);
    drawRug(ctx, 160, 113, 150);
    drawTree(ctx, 160, 8, 100);
    drawPresentsPile(ctx, 196, 100);
  },
  (ctx, t, dt) => {
    treeWin.live(ctx, t, dt);
    drawStringLights(ctx, t);
  }
);

const FIRE = { x: 96, y: 56, w: 128, h: 52 };
const mantelWin = makeWindow(248, 30, 52, 48, { seed: 11 });
const mantel = makeBackdrop(
  (ctx) => {
    drawWallpaper(ctx);
    mantelWin.static(ctx);
    drawFloor(ctx);
    drawRug(ctx, 160, 114, 120);
    drawFireplace(ctx, FIRE.x, FIRE.y, FIRE.w, FIRE.h);
    rect(ctx, PAL.S, FIRE.x - 6, 108, FIRE.w + 12, 4);
    rect(ctx, PAL.s, FIRE.x - 6, 108, FIRE.w + 12, 1);
    drawMantel(ctx, 88, 50, 144);
    drawArmchair(ctx, 22, 72);
  },
  (ctx, t, dt) => {
    mantelWin.live(ctx, t, dt);
    drawFire(ctx, t, FIRE.x, FIRE.y, FIRE.w, FIRE.h);
    drawStringLights(ctx, t, 84, 236, 14, 5);
  }
);

const tableWin = makeWindow(135, 10, 50, 30, { seed: 13 });
const table = makeBackdrop(
  (ctx) => {
    drawWallpaper(ctx);
    tableWin.static(ctx);
    drawFloor(ctx);
    drawRug(ctx, 160, 112, 190);
    drawTable(ctx, 92, 66, 136);
    // a potted poinsettia on the floor
    rect(ctx, PAL.k, 229, 92, 14, 14);
    rect(ctx, PAL.n, 230, 96, 12, 10);
    for (const [dx, dy] of [[0, 0], [6, -2], [-5, -3], [3, -7], [9, -5], [-2, -9]]) {
      rect(ctx, PAL.r, 233 + dx, 88 + dy, 5, 4);
      rect(ctx, PAL.y, 235 + dx, 89 + dy, 1, 1);
    }
  },
  (ctx, t, dt) => {
    tableWin.live(ctx, t, dt);
    drawStringLights(ctx, t);
  }
);

const bigWin = makeWindow(250, 20, 46, 44, { seed: 17 });
const bigtree = makeBackdrop(
  (ctx) => {
    drawWallpaper(ctx);
    bigWin.static(ctx);
    drawBookshelf(ctx, 16, 28, 54, 80);
    drawFloor(ctx);
    drawRug(ctx, 160, 113, 170);
    drawTree(ctx, 160, 14, 100, { a: 0.5, b: 0.55, tier: 22 });
    drawPresentsPile(ctx, 198, 100);
    drawPresentsPile(ctx, 92, 102);
  },
  (ctx, t, dt) => {
    bigWin.live(ctx, t, dt);
    drawStringLights(ctx, t);
  }
);

export const BACKDROPS = { attic, tree, mantel, table, bigtree };

/** Little seasonal scene for the title-screen window: snowy night. */
export function windowScene() {
  let snow = null;
  return (ctx, r, t, dt) => {
    snow ??= new Snow(r.x, r.y, r.w, r.h, Math.round((r.w * r.h) / 70), 71);
    rect(ctx, UI.night, r.x, r.y, r.w, r.h);
    rect(ctx, UI.night2, r.x, r.y + Math.round(r.h * 0.55), r.w, Math.round(r.h * 0.45));
    rect(ctx, PAL.o, r.x + r.w - 12, r.y + 5, 5, 5);
    rect(ctx, UI.night, r.x + r.w - 10, r.y + 5, 3, 3);
    for (let i = 0; i < r.w; i++) {
      const hh = 5 + Math.round(2 * Math.sin(i / 7) + Math.sin(i / 3));
      rect(ctx, PAL.c, r.x + i, r.y + r.h - hh, 1, hh);
      rect(ctx, PAL.w, r.x + i, r.y + r.h - hh, 1, 1);
    }
    // a tiny snowy pine
    for (let i = 0; i < 12; i++) rect(ctx, PAL.G, r.x + 10 - Math.floor(i / 2), r.y + r.h - 18 + i, i + 1, 1);
    rect(ctx, PAL.w, r.x + 9, r.y + r.h - 18, 2, 1);
    snow.update(dt, t);
    snow.draw(ctx);
  };
}
