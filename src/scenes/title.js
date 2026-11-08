import { PAL, UI } from '../render/palette.js';
import { drawPanel, drawText, rect } from '../render/draw.js';
import { itemSprite } from '../render/sprites.js';
import { ButtonSet, addHud } from '../ui.js';
import { drawTray, drawInfo, Particles } from './common.js';

export function titleScene(game) {
  const theme = game.themes[0];
  const backdrop = theme.backdrops[theme.titleBackdrop];
  const buttons = new ButtonSet();
  const particles = new Particles();
  addHud(buttons, game);
  buttons.add({
    x: 128, y: 104, w: 64, h: 17, label: 'Play', style: 'gold',
    onClick: () => {
      game.audio.play('click');
      game.go('levels', { themeId: theme.id });
    },
  });

  // A few decorations sprinkled on the title tree.
  const deco = [
    ['star_gold', 152, 0], ['orn_red', 140, 22], ['bell_gold', 164, 24], ['lights_warm', 126, 48],
    ['orn_blue', 176, 50], ['cane', 150, 52], ['gift_green', 196, 94], ['ribbon_red', 112, 78],
    ['orn_gold', 190, 76], ['orn_green', 136, 80],
  ];
  let sparkleTimer = 0;

  return {
    update(dt) {
      particles.update(dt);
      sparkleTimer -= dt;
      if (sparkleTimer <= 0) {
        sparkleTimer = 0.5;
        const [, x, y] = deco[Math.floor(Math.random() * deco.length)];
        particles.burst(x + 8, y + 8, 3);
      }
    },
    draw(ctx, t, dt) {
      backdrop.draw(ctx, t, dt);
      for (const [id, x, y] of deco) ctx.drawImage(itemSprite(theme.catalog[id]), x, y);
      particles.draw(ctx, t);

      drawPanel(ctx, 86, 26, 148, 66, {});
      rect(ctx, PAL.r, 87, 27, 146, 2);
      rect(ctx, PAL.g, 87, 89, 146, 1);
      drawText(ctx, 'Cozy Holiday', 160, 36, UI.ink, { title: 2, align: 'center' });
      drawText(ctx, 'Tidy-Up', 160, 52, PAL.R, { title: 3, align: 'center', shadow: PAL.p });
      drawText(ctx, 'sort · tidy · decorate', 160, 79, UI.inkSoft, { align: 'center', size: 8 });

      drawTray(ctx);
      drawInfo(ctx, `${theme.name}: ${theme.tagline}`);
      drawText(ctx, 'Drag decorations to the spots whose tags they match.', 160, 151, UI.paper, { align: 'center', size: 9 });
      drawText(ctx, 'No timers, no fails. Just tidying.', 160, 164, UI.paperDark, { align: 'center', size: 8 });
      buttons.draw(ctx, t);
    },
    move: (p) => buttons.move(p),
    down: (p) => buttons.down(p),
    up: (p) => buttons.up(p),
  };
}
