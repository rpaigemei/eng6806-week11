import { PAL, UI } from '../render/palette.js';
import { drawText, wrapText, rect } from '../render/draw.js';
import { itemSprite, iconSprite } from '../render/sprites.js';
import { ButtonSet, Button, addHud } from '../ui.js';
import { drawTray, drawInfo } from './common.js';
import { isUnlocked, isThemeUnlocked, persist } from '../save.js';
import { roomNumber, allLevels } from '../themes/index.js';
import { levelStars, themeStars, maxThemeStars, isBonusUnlocked, BONUS_STARS } from '../rewards.js';
import { drawBookIcon } from '../ui.js';

const CARD_W = 46;
const CARD_H = 70;
const GAP = 5;
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
  const cards = allLevels(theme);
  const n = cards.length;
  const x0 = Math.round((320 - (n * CARD_W + (n - 1) * GAP)) / 2);
  let hoverInfo = '';

  if (themeOpen) {
    game.save.lastTheme = theme.id;
    persist(game.save);
  }

  addHud(buttons, game, { back: () => game.go('title') });
  buttons.add({
    x: 17, y: 2, w: 13, h: 12, tip: 'Keepsake album: every decoration you have tidied',
    onClick: () => {
      game.audio.play('click');
      game.go('album', { themeId: theme.id, from: 'levels' });
    },
    draw: (ctx, x, y) => drawBookIcon(ctx, x + 2, y + 2),
  });

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

  cards.forEach((level, i) => {
    const x = x0 + i * (CARD_W + GAP);
    const bonus = level === theme.bonus;
    const unlocked = () => themeOpen && (bonus ? isBonusUnlocked(game.save, theme) : isUnlocked(game.save, theme, i));
    const solved = () => !!game.save.solved[level.id];
    const card = new Button({
      x, y: 28, w: CARD_W, h: CARD_H, style: 'paper', enabled: unlocked,
      tip: bonus && !isBonusUnlocked(game.save, theme) ? `Bonus room - earn ${BONUS_STARS} stars in ${theme.name} to open it` : level.title,
      onClick: () => {
        game.audio.play('click');
        game.go('puzzle', { levelId: level.id });
      },
      draw: (ctx, bx, by, btn, t) => {
        const on = unlocked();
        if (bonus) {
          // gold trim for the bonus room
          rect(ctx, PAL.y, bx + 1, by + 1, CARD_W - 2, 2);
          rect(ctx, PAL.Y, bx + 1, by + CARD_H - 3, CARD_W - 2, 1);
          drawText(ctx, 'Bonus', bx + CARD_W / 2, by + 6, on ? PAL.Y : UI.inkSoft, { align: 'center', size: 9 });
        } else {
          drawText(ctx, String(roomNumber(level.id)), bx + CARD_W / 2, by + 5, on ? PAL.R : UI.inkSoft, { title: 2, align: 'center' });
        }
        const preview = theme.catalog[level.cover || level.items[0]];
        if (on) {
          const bob = btn.hover ? Math.round(Math.sin(t * 6)) : 0;
          ctx.drawImage(itemSprite(preview), bx + CARD_W / 2 - 8, by + 20 + bob);
        } else {
          ctx.drawImage(iconSprite('lock'), bx + CARD_W / 2 - 4, by + 24);
        }
        if (bonus && !on) drawText(ctx, `${BONUS_STARS} stars`, bx + CARD_W / 2, by + 34, UI.inkSoft, { align: 'center', size: 7 });
        wrapText(level.title, CARD_W - 4, { size: 7.5 }).forEach((line, li) =>
          drawText(ctx, line, bx + CARD_W / 2, by + 41 + li * 8, on ? UI.ink : UI.inkSoft, { align: 'center', size: 7.5 })
        );
        // three star pips: earned stars in gold
        const got = levelStars(game.save, level.id);
        for (let k = 0; k < 3; k++) ctx.drawImage(iconSprite(k < got ? 'bigStar' : 'starSlot'), bx + CARD_W / 2 - 12 + k * 9, by + CARD_H - 11);
      },
    });
    buttons.add(card);
    buttons.add({
      x, y: 102, w: CARD_W, h: 13, label: 'Decorate', style: 'wood',
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
      drawText(ctx, `${theme.name}: ${done()} / ${theme.levels.length} rooms tidy  \u00b7  ${themeStars(game.save, theme)} / ${maxThemeStars(theme)} stars`, 122, 151, UI.paper, { align: 'center', size: 9 });
      const allDone = done() === theme.levels.length;
      let line = theme.tagline;
      if (!themeOpen) line = 'Locked for now. Finish the holiday before it!';
      else if (allDone) line = nextLocked ? `All tidy! ${game.themes[themeIndex + 1].name} is open.` : 'Every room is tidy! More holidays are on the way.';
      if (themeOpen && theme.bonus && !isBonusUnlocked(game.save, theme)) line = `Earn ${BONUS_STARS} stars here to open the bonus room.`;
      drawText(ctx, line, 122, 164, UI.paperDark, { align: 'center', size: 8 });
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
