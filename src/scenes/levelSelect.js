import { PAL, UI } from '../render/palette.js';
import { drawPanel, drawText, wrapText, rect } from '../render/draw.js';
import { itemSprite, iconSprite } from '../render/sprites.js';
import { ButtonSet, Button, addHud } from '../ui.js';
import { drawTray, drawInfo } from './common.js';
import { isUnlocked } from '../save.js';

const CARD_W = 54;
const CARD_H = 68;
const GAP = 8;

export function levelSelectScene(game, { themeId } = {}) {
  const theme = game.themes.find((th) => th.id === themeId) || game.themes[0];
  const backdrop = theme.backdrops.mantel;
  const buttons = new ButtonSet();
  const n = theme.levels.length;
  const x0 = Math.round((320 - (n * CARD_W + (n - 1) * GAP)) / 2);
  let hoverInfo = '';

  addHud(buttons, game, { back: () => game.go('title') });

  theme.levels.forEach((level, i) => {
    const x = x0 + i * (CARD_W + GAP);
    const unlocked = () => isUnlocked(game.save, theme, i);
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
        drawText(ctx, String(i + 1), bx + CARD_W / 2, by + 5, on ? PAL.R : UI.inkSoft, { scale: 2, align: 'center' });
        const preview = theme.catalog[level.items[0]];
        if (on) {
          const bob = btn.hover ? Math.round(Math.sin(t * 6)) : 0;
          ctx.drawImage(itemSprite(preview), bx + CARD_W / 2 - 8, by + 20 + bob);
        } else {
          ctx.drawImage(iconSprite('lock'), bx + CARD_W / 2 - 4, by + 24);
        }
        wrapText(level.title, CARD_W - 6).forEach((line, li) =>
          drawText(ctx, line, bx + CARD_W / 2, by + 42 + li * 7, on ? UI.ink : UI.inkSoft, { align: 'center' })
        );
        if (solved()) ctx.drawImage(iconSprite('bigStar'), bx + CARD_W - 10, by + 3);
      },
    });
    buttons.add(card);
    buttons.add({
      x, y: 100, w: CARD_W, h: 13, label: 'DECORATE', style: 'wood',
      visible: solved, tip: `Decorate ${level.title} freely`,
      onClick: () => {
        game.audio.play('click');
        game.go('decorate', { levelId: level.id });
      },
    });
  });

  const done = () => theme.levels.filter((l) => game.save.solved[l.id]).length;

  return {
    update() {},
    draw(ctx, t, dt) {
      backdrop.draw(ctx, t, dt);
      ctx.globalAlpha = 0.55;
      rect(ctx, PAL.k, 0, 0, 320, 132);
      ctx.globalAlpha = 1;
      drawText(ctx, theme.name, 160, 8, UI.paper, { scale: 2, align: 'center', shadow: PAL.k });
      buttons.draw(ctx, t);

      drawTray(ctx);
      drawInfo(ctx, hoverInfo || 'Pick a room to tidy.');
      drawText(ctx, `${done()} / ${theme.levels.length} rooms tidy`, 160, 152, UI.paper, { align: 'center' });
      const allDone = done() === theme.levels.length;
      drawText(
        ctx,
        allDone ? 'Every room is tidy! Decorate them, or wait for more holidays.' : 'More holidays are on the way.',
        160, 163, UI.paperDark, { align: 'center' }
      );
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
