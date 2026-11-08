import { PAL, UI } from '../render/palette.js';
import { drawText, wrapText, rect } from '../render/draw.js';
import { itemSprite, iconSprite } from '../render/sprites.js';
import { ButtonSet, Button, addHud } from '../ui.js';
import { drawTray, drawInfo } from './common.js';
import { isUnlocked, isThemeUnlocked, persist } from '../save.js';
import { roomNumber } from '../themes/index.js';

const CARD_W = 54;
const CARD_H = 68;
const GAP = 8;
const TAB_W = 72;

/** The holiday to open on: last played if still sensible, else the first unfinished open one. */
export function defaultThemeId(game) {
  const open = game.themes.filter((_, i) => isThemeUnlocked(game.save, game.themes, i));
  if (game.save.lastTheme && open.some((th) => th.id === game.save.lastTheme)) return game.save.lastTheme;
  const unfinished = open.find((th) => th.levels.some((l) => !game.save.solved[l.id]));
  return (unfinished || open[open.length - 1]).id;
}

export function levelSelectScene(game, { themeId } = {}) {
  const themeIndex = Math.max(0, game.themes.findIndex((th) => th.id === (themeId || defaultThemeId(game))));
  const theme = game.themes[themeIndex];
  const themeOpen = isThemeUnlocked(game.save, game.themes, themeIndex);
  const prevTheme = game.themes[themeIndex - 1];
  const backdrop = theme.backdrops[theme.selectBackdrop];
  const buttons = new ButtonSet();
  const n = theme.levels.length;
  const x0 = Math.round((320 - (n * CARD_W + (n - 1) * GAP)) / 2);
  let hoverInfo = '';

  if (themeOpen) {
    game.save.lastTheme = theme.id;
    persist(game.save);
  }

  addHud(buttons, game, { back: () => game.go('title') });

  // holiday tabs
  const tabsX = Math.round((320 - game.themes.length * TAB_W - (game.themes.length - 1) * 4) / 2);
  game.themes.forEach((th, i) => {
    const open = isThemeUnlocked(game.save, game.themes, i);
    const active = th === theme;
    buttons.add({
      x: tabsX + i * (TAB_W + 4), y: 4, w: TAB_W, h: 15, style: active ? 'gold' : 'wood',
      tip: open ? `${th.name}: ${th.tagline}` : `${th.name} - tidy every ${game.themes[i - 1].name} room to unlock`,
      onClick: () => {
        if (active) return;
        game.audio.play('click');
        game.go('levels', { themeId: th.id });
      },
      draw: (ctx, bx, by) => {
        const label = th.name;
        if (!open) ctx.drawImage(iconSprite('lock'), bx + 5, by + 4);
        drawText(ctx, label, bx + TAB_W / 2 + (open ? 0 : 4), by + 5, active ? UI.ink : open ? UI.paper : UI.inkSoft, { align: 'center', size: 9 });
      },
    });
  });

  theme.levels.forEach((level, i) => {
    const x = x0 + i * (CARD_W + GAP);
    const unlocked = () => themeOpen && isUnlocked(game.save, theme, i);
    const solved = () => !!game.save.solved[level.id];
    const card = new Button({
      x, y: 28, w: CARD_W, h: CARD_H, style: 'paper', enabled: unlocked,
      tip: level.title,
      onClick: () => {
        game.audio.play('click');
        game.go('puzzle', { levelId: level.id });
      },
      draw: (ctx, bx, by, btn, t) => {
        const on = unlocked();
        drawText(ctx, String(roomNumber(level.id)), bx + CARD_W / 2, by + 5, on ? PAL.R : UI.inkSoft, { title: 2, align: 'center' });
        const preview = theme.catalog[level.cover || level.items[0]];
        if (on) {
          const bob = btn.hover ? Math.round(Math.sin(t * 6)) : 0;
          ctx.drawImage(itemSprite(preview), bx + CARD_W / 2 - 8, by + 20 + bob);
        } else {
          ctx.drawImage(iconSprite('lock'), bx + CARD_W / 2 - 4, by + 24);
        }
        wrapText(level.title, CARD_W - 6, { size: 8 }).forEach((line, li) =>
          drawText(ctx, line, bx + CARD_W / 2, by + 42 + li * 9, on ? UI.ink : UI.inkSoft, { align: 'center', size: 8 })
        );
        if (solved()) ctx.drawImage(iconSprite('bigStar'), bx + CARD_W - 10, by + 3);
      },
    });
    buttons.add(card);
    buttons.add({
      x, y: 100, w: CARD_W, h: 13, label: 'Decorate', style: 'wood',
      visible: solved, tip: `Decorate ${level.title} freely`,
      onClick: () => {
        game.audio.play('click');
        game.go('decorate', { levelId: level.id });
      },
    });
  });

  const done = () => theme.levels.filter((l) => game.save.solved[l.id]).length;
  const nextLocked = game.themes.slice(themeIndex + 1).length > 0;

  return {
    song: theme.song,
    update() {},
    draw(ctx, t, dt) {
      backdrop.draw(ctx, t, dt);
      ctx.globalAlpha = 0.55;
      rect(ctx, PAL.k, 0, 0, 320, 132);
      ctx.globalAlpha = 1;
      buttons.draw(ctx, t);

      drawTray(ctx);
      drawInfo(ctx, hoverInfo || (themeOpen ? 'Pick a room to tidy.' : `Tidy every ${prevTheme.name} room to open ${theme.name}.`));
      drawText(ctx, `${theme.name}: ${done()} / ${theme.levels.length} rooms tidy`, 160, 151, UI.paper, { align: 'center', size: 9 });
      const allDone = done() === theme.levels.length;
      let line = theme.tagline;
      if (!themeOpen) line = 'Locked for now. Finish the holiday before it!';
      else if (allDone) line = nextLocked ? `All tidy! ${game.themes[themeIndex + 1].name} is open.` : 'Every room is tidy! More holidays are on the way.';
      drawText(ctx, line, 160, 164, UI.paperDark, { align: 'center', size: 8 });
    },
    move(p) {
      const b = buttons.move(p);
      hoverInfo = b && b.tip ? (b.enabled() ? b.tip : `${b.tip} - finish the room before it first`) : '';
    },
    down: (p) => buttons.down(p),
    up: (p) => buttons.up(p),
    back: () => game.go('title'),
  };
}
