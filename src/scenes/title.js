// Start page: a holiday-neutral storage room. The window drifts through each
// registered holiday's season, and a row of storage boxes (one per holiday)
// lets you jump in. New holidays appear here automatically from THEMES.
import { PAL, UI } from '../render/palette.js';
import { drawPanel, drawText, rect } from '../render/draw.js';
import { itemSprite, itemOutline, iconSprite } from '../render/sprites.js';
import { makeBackdrop, drawWallpaper, drawFloor, drawRug, drawArmchair, drawCurtains, drawBookshelf } from '../render/scenery.js';
import { ButtonSet, Button, addHud } from '../ui.js';
import { drawTray, drawInfo, Particles } from './common.js';
import { isThemeUnlocked, persist } from '../save.js';
import { defaultThemeId } from './levelSelect.js';
import { TITLE_SONG } from '../songs.js';

const WIN = { x: 24, y: 16, w: 56, h: 46 };
const BOX_W = 48;
const BOX_H = 22;
const BOX_Y = 90;
const SEASON = 7; // seconds per holiday in the window
const FADE = 1.2;

const room = makeBackdrop((ctx) => {
  drawWallpaper(ctx);
  // window frame (the scene inside is drawn live)
  rect(ctx, PAL.k, WIN.x - 4, WIN.y - 4, WIN.w + 8, WIN.h + 8);
  rect(ctx, PAL.n, WIN.x - 3, WIN.y - 3, WIN.w + 6, WIN.h + 6);
  drawBookshelf(ctx, 268, 18, 44, 72);
  drawFloor(ctx);
  drawRug(ctx, 196, 114, 170);
  drawArmchair(ctx, 26, 72);
});

export function titleScene(game) {
  const themes = game.themes;
  const buttons = new ButtonSet();
  const particles = new Particles();
  const open = themes.map((_, i) => isThemeUnlocked(game.save, themes, i));
  game.save.announced ??= {};
  const fresh = themes.find((th, i) => i > 0 && open[i] && !game.save.announced[th.id]);

  const markSeen = () => {
    themes.forEach((th, i) => open[i] && (game.save.announced[th.id] = true));
    persist(game.save);
  };

  addHud(buttons, game);
  buttons.add({
    x: 246, y: 146, w: 70, h: 28, label: 'Play', style: 'gold',
    onClick: () => {
      game.audio.play('click');
      markSeen();
      game.go('levels', { themeId: defaultThemeId(game) });
    },
  });

  // one storage box per holiday
  const totalW = themes.length * BOX_W + (themes.length - 1) * 10;
  const bx0 = Math.round(178 - totalW / 2);
  const boxes = themes.map((th, i) => {
    const x = bx0 + i * (BOX_W + 10);
    const b = new Button({
      x, y: BOX_Y - 14, w: BOX_W, h: BOX_H + 14, style: 'none',
      enabled: () => open[i],
      tip: open[i] ? `Open the ${th.name} box` : `${th.name} - tidy every ${themes[i - 1].name} room to unlock`,
      onClick: () => {
        game.audio.play('click');
        markSeen();
        game.go('levels', { themeId: th.id });
      },
    });
    buttons.add(b);
    return { th, i, x, b };
  });

  let hoverTip = '';
  let sparkleTimer = 0;
  let t = 0;

  function drawBox({ th, i, x, b }, time) {
    const y = BOX_Y;
    const lift = b.hover && open[i] ? -1 : 0;
    const peek = th.catalog[th.box.peek];
    // item peeking out of the box (a dark silhouette if the holiday is still locked)
    if (open[i]) ctx_drawSprite(itemSprite(peek), x + BOX_W / 2 - 8, y - 14 + lift + Math.round(Math.sin(time * 2 + i) * 0.6));
    else ctx_drawSprite(itemOutline(peek, PAL.D), x + BOX_W / 2 - 8, y - 12);
    // box body
    rect(g, PAL.k, x - 1, y - 1, BOX_W + 2, BOX_H + 2);
    rect(g, th.box.tint, x, y, BOX_W, BOX_H);
    rect(g, PAL.k, x, y + 5, BOX_W, 1);
    rect(g, th.box.ribbon, x + BOX_W / 2 - 2, y, 4, BOX_H);
    rect(g, 'rgba(255,255,255,0.18)', x, y, BOX_W, 2);
    // label card
    rect(g, PAL.k, x + 3, y + 9, BOX_W - 6, 10);
    rect(g, open[i] ? UI.paper : UI.paperDark, x + 4, y + 10, BOX_W - 8, 8);
    drawText(g, th.name, x + BOX_W / 2, y + 11, open[i] ? UI.ink : UI.inkSoft, { align: 'center', size: 7 });
    if (!open[i]) {
      // taped shut, with a little padlock
      rect(g, UI.paperDark, x - 2, y + 1, BOX_W + 4, 3);
      g.drawImage(iconSprite('lock'), x + BOX_W - 9, y - 4);
    }
  }
  let g = null;
  const ctx_drawSprite = (img, x, y) => g.drawImage(img, Math.round(x), Math.round(y));

  /** Window: each holiday's season in turn, cross-fading. */
  function drawWindow(ctx, time, dt) {
    const k = Math.floor(time / SEASON) % themes.length;
    const into = time % SEASON;
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.clip();
    themes[k].windowScene(ctx, WIN, time, dt);
    if (into > SEASON - FADE && themes.length > 1) {
      ctx.globalAlpha = (into - (SEASON - FADE)) / FADE;
      themes[(k + 1) % themes.length].windowScene(ctx, WIN, time, dt);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    rect(ctx, PAL.N, WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h);
    rect(ctx, PAL.N, WIN.x, WIN.y + WIN.h / 2 - 1, WIN.w, 2);
    rect(ctx, PAL.k, WIN.x - 6, WIN.y + WIN.h + 3, WIN.w + 12, 5);
    rect(ctx, PAL.n, WIN.x - 5, WIN.y + WIN.h + 3, WIN.w + 10, 3);
    drawCurtains(ctx, WIN.x, WIN.y, WIN.w, WIN.h);
    // a decoration from each open holiday on the sill
    let sx = WIN.x + 4;
    themes.forEach((th, i) => {
      if (!open[i]) return;
      ctx.drawImage(itemSprite(th.catalog[th.box.peek]), sx, WIN.y + WIN.h - 13);
      sx += 18;
    });
  }

  const progress = () =>
    themes
      .map((th, i) => {
        const d = th.levels.filter((l) => game.save.solved[l.id]).length;
        return open[i] ? `${th.name} ${d}/${th.levels.length}` : `${th.name} (locked)`;
      })
      .join('  ·  ');

  return {
    song: TITLE_SONG,
    update(dt) {
      t += dt;
      particles.update(dt);
      sparkleTimer -= dt;
      if (sparkleTimer <= 0) {
        sparkleTimer = 0.7;
        const openBoxes = boxes.filter((b) => open[b.i]);
        const b = openBoxes[Math.floor(Math.random() * openBoxes.length)];
        if (b) particles.burst(b.x + BOX_W / 2, BOX_Y - 4, 3);
      }
    },
    draw(ctx, _t, dt) {
      g = ctx;
      room.draw(ctx, t, dt);
      drawWindow(ctx, t, dt);

      drawPanel(ctx, 96, 14, 160, 62, {});
      rect(ctx, PAL.a, 97, 15, 52, 2);
      rect(ctx, PAL.r, 149, 15, 54, 2);
      rect(ctx, PAL.g, 203, 15, 52, 2);
      drawText(ctx, 'Cozy Holiday', 176, 22, UI.ink, { title: 2, align: 'center' });
      drawText(ctx, 'Tidy-Up', 176, 38, PAL.R, { title: 3, align: 'center', shadow: PAL.p });
      drawText(ctx, 'sort · tidy · decorate', 176, 64, UI.inkSoft, { align: 'center', size: 8 });

      for (const b of boxes) drawBox(b, t);
      particles.draw(ctx, t);

      drawTray(ctx);
      if (hoverTip) drawInfo(ctx, hoverTip, PAL.o);
      else if (fresh) drawInfo(ctx, `${fresh.name} unlocked! Open its box to start.`, PAL.o);
      else drawInfo(ctx, progress());
      drawText(ctx, 'Every holiday needs a tidy-up.', 122, 151, UI.paper, { align: 'center', size: 9 });
      drawText(ctx, 'Sort decorations by their tags. No timers, no fails.', 122, 164, UI.paperDark, { align: 'center', size: 7.5 });
      buttons.draw(ctx, t);
    },
    move(p) {
      const b = buttons.move(p);
      hoverTip = b?.tip || '';
    },
    down: (p) => buttons.down(p),
    up: (p) => buttons.up(p),
  };
}
