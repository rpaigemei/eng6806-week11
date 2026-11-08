// Keepsake album: every decoration you've tidied, one page per holiday, each
// with a short story. Not-yet-found decorations show as dark silhouettes.
import { PAL, UI } from '../render/palette.js';
import { drawPanel, drawText, rect } from '../render/draw.js';
import { itemSprite, itemOutline } from '../render/sprites.js';
import { ButtonSet, addHud } from '../ui.js';
import { drawTray, drawInfo } from './common.js';
import { isThemeUnlocked } from '../save.js';
import { albumItems } from '../rewards.js';

const COLS = 10;
const CELL = 24;

export function albumScene(game, { themeId, from = 'title' } = {}) {
  const themes = game.themes;
  const theme = themes.find((th) => th.id === themeId) || themes[0];
  const items = albumItems(theme);
  const found = (id) => !!game.save.album?.[id];
  const buttons = new ButtonSet();
  const back = () => (from === 'levels' ? game.go('levels', { themeId: theme.id }) : game.go('title'));
  let hover = null;
  let selected = null;
  let t = 0;

  addHud(buttons, game, { back });
  const TAB_W = 72;
  const tabsX = Math.round((320 - themes.length * TAB_W - (themes.length - 1) * 4) / 2);
  themes.forEach((th, i) => {
    const open = isThemeUnlocked(game.save, themes, i);
    buttons.add({
      x: tabsX + i * (TAB_W + 4), y: 4, w: TAB_W, h: 15, style: th === theme ? 'gold' : 'wood',
      enabled: () => open, tip: open ? `${th.name} page` : `${th.name} - not unlocked yet`,
      onClick: () => {
        if (th === theme) return;
        game.audio.play('click');
        game.go('album', { themeId: th.id, from });
      },
      draw: (ctx, bx, by) => drawText(ctx, th.name, bx + TAB_W / 2, by + 5, th === theme ? UI.ink : open ? UI.paper : UI.inkSoft, { align: 'center', size: 9 }),
    });
  });

  const rows = Math.ceil(items.length / COLS);
  const gx = Math.round((320 - COLS * CELL) / 2);
  const gy = 30;
  const cellAt = (p) => {
    const c = Math.floor((p.x - gx) / CELL);
    const r = Math.floor((p.y - gy) / CELL);
    if (c < 0 || c >= COLS || r < 0 || r >= rows) return null;
    return items[r * COLS + c] || null;
  };
  const count = () => items.filter(found).length;

  return {
    song: theme.song,
    update(dt) {
      t += dt;
    },
    draw(ctx, _t, dt) {
      theme.backdrops[theme.selectBackdrop].draw(ctx, t, dt);
      ctx.globalAlpha = 0.6;
      rect(ctx, PAL.k, 0, 0, 320, 132);
      ctx.globalAlpha = 1;
      // the album page
      drawPanel(ctx, gx - 6, gy - 6, COLS * CELL + 12, rows * CELL + 12, { fill: '#f3e6cc', shade: UI.paperDark });
      rect(ctx, PAL.R, gx - 6, gy - 6, 4, rows * CELL + 12);
      items.forEach((id, i) => {
        const it = theme.catalog[id];
        const x = gx + (i % COLS) * CELL + 4;
        const y = gy + Math.floor(i / COLS) * CELL + 4;
        // little photo corners
        rect(ctx, UI.paperDark, x - 3, y - 3, 22, 22);
        rect(ctx, '#fbf3e2', x - 2, y - 2, 20, 20);
        rect(ctx, PAL.N, x - 3, y - 3, 3, 1);
        rect(ctx, PAL.N, x + 16, y + 18, 3, 1);
        const lift = (hover === id || selected === id) && found(id) ? -1 : 0;
        if (found(id)) ctx.drawImage(itemSprite(it), x, y + lift);
        else {
          ctx.globalAlpha = 0.35;
          ctx.drawImage(itemOutline(it, PAL.k), x, y);
          ctx.globalAlpha = 1;
        }
      });
      buttons.draw(ctx, t);

      drawTray(ctx);
      const focus = hover || selected;
      if (focus) {
        const it = theme.catalog[focus];
        drawInfo(ctx, found(focus) ? it.story : 'Not found yet. Tidy it in a room to add it.', found(focus) ? PAL.o : UI.paperDark);
      } else drawInfo(ctx, 'Tap a decoration to read its story.', UI.paperDark);
      const focusIt = focus && found(focus) ? theme.catalog[focus] : null;
      drawText(ctx, focusIt ? focusIt.name : `${theme.name} keepsakes`, 160, 151, UI.paper, { align: 'center', size: 9 });
      drawText(ctx, `${count()} / ${items.length} found`, 160, 164, UI.paperDark, { align: 'center', size: 8 });
    },
    move(p) {
      buttons.move(p);
      hover = cellAt(p);
    },
    down(p) {
      if (buttons.down(p)) return;
      selected = cellAt(p);
      if (selected && found(selected)) game.audio.play('pickItem', { category: theme.catalog[selected].tags.category });
    },
    up: (p) => buttons.up(p),
    back,
  };
}
