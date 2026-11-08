// Decorate mode: no rules, place a solved room's decorations anywhere you like.
import { PAL, UI } from '../render/palette.js';
import { drawSlotBack, drawSlotFront, drawSlotHardware } from '../render/scenery.js';
import { ButtonSet, addHud } from '../ui.js';
import { solve, cellPos } from '../engine/level.js';
import { findLevel } from '../themes/index.js';
import { persist } from '../save.js';
import { TRAY_Y, pilePos, drawTray, drawInfo, Glide, drawItem, itemInfo, Particles } from './common.js';

const SNAP = 4;

export function decorateScene(game, { levelId }) {
  const { theme, level } = findLevel(levelId);
  const backdrop = theme.backdrops[level.backdrop];
  const glide = new Glide();
  const particles = new Particles();
  const buttons = new ButtonSet();

  // positions: id -> {x,y} in the room, or null when in the tray
  const solvedLayout = () => {
    const sol = solve(level, theme.catalog) || {};
    const counts = {};
    const out = {};
    for (const id of level.items) {
      const slot = level.slots.find((s) => s.id === sol[id]);
      if (!slot) {
        out[id] = null;
        continue;
      }
      const i = (counts[slot.id] = (counts[slot.id] ?? -1) + 1);
      out[id] = cellPos(slot, i);
    }
    return out;
  };
  const saved = game.save.decor[level.id];
  const pos = {};
  for (const id of level.items) pos[id] = saved && id in saved ? saved[id] : null;
  if (!saved) Object.assign(pos, solvedLayout());
  const order = [...level.items]; // draw order; last = on top

  let t = 0;
  let press = null;
  let drag = null;
  let hoverItem = null;
  let message = null;

  const save = () => {
    game.save.decor[level.id] = { ...pos };
    persist(game.save);
  };
  const say = (text) => (message = { text, at: t });

  addHud(buttons, game, { back: () => game.go('levels', { themeId: theme.id }) });
  buttons.add({
    x: 246, y: 145, w: 70, h: 16, label: 'Arrange', style: 'gold', tip: 'Put things back in their tidy spots',
    onClick: () => {
      game.audio.play('swap');
      Object.assign(pos, solvedLayout());
      save();
      say('Back to the tidy layout.');
    },
  });
  buttons.add({
    x: 246, y: 163, w: 70, h: 13, label: 'Clear all',
    onClick: () => {
      game.audio.play('swap');
      for (const id of level.items) pos[id] = null;
      save();
      say('Everything is back in the tray.');
    },
  });

  const targetPos = (id) => pos[id] || pilePos(level, id);

  function itemAt(p) {
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      if (drag && drag.itemId === id) continue;
      const q = glide.pos.get(id) || targetPos(id);
      if (p.x >= q.x && p.x < q.x + 16 && p.y >= q.y && p.y < q.y + 16) return id;
    }
    return null;
  }

  return {
    song: theme.song,
    update(dt) {
      t += dt;
      particles.update(dt);
    },
    draw(ctx, _t, dt) {
      backdrop.draw(ctx, t, dt);
      for (const s of level.slots) {
        drawSlotBack(ctx, s);
        drawSlotFront(ctx, s);
        drawSlotHardware(ctx, s);
      }
      const inRoom = order.filter((id) => pos[id] && (!drag || drag.itemId !== id));
      for (const id of inRoom) {
        const q = glide.get(id, targetPos(id), dt);
        drawItem(ctx, theme.catalog[id], q.x, q.y, { outline: hoverItem === id ? PAL.o : null });
      }
      particles.draw(ctx, t);

      drawTray(ctx);
      let info = 'Decorate mode: no rules! Place things anywhere you like.';
      if (message && t - message.at < 3) info = message.text;
      else if (hoverItem) info = itemInfo(theme, theme.catalog[hoverItem]);
      drawInfo(ctx, info, message && t - message.at < 3 ? PAL.o : UI.paper);
      for (const id of order) {
        if (pos[id] || (drag && drag.itemId === id)) continue;
        const q = glide.get(id, targetPos(id), dt);
        drawItem(ctx, theme.catalog[id], q.x, q.y, { outline: hoverItem === id ? PAL.o : null });
      }
      buttons.draw(ctx, t);
      if (drag) drawItem(ctx, theme.catalog[drag.itemId], drag.x, drag.y, { lifted: true });
    },
    move(p) {
      buttons.move(p);
      if (press && !drag && Math.hypot(p.x - press.start.x, p.y - press.start.y) > 2) {
        drag = { itemId: press.itemId, off: press.off, x: 0, y: 0 };
        game.audio.play('pick');
      }
      if (drag) {
        drag.x = Math.round(p.x - drag.off.x);
        drag.y = Math.round(p.y - drag.off.y);
        return;
      }
      hoverItem = itemAt(p);
    },
    down(p) {
      if (buttons.down(p)) return;
      const id = itemAt(p);
      if (!id) return;
      const q = glide.pos.get(id) || targetPos(id);
      press = { itemId: id, start: p, off: { x: p.x - q.x, y: p.y - q.y } };
    },
    up(p) {
      if (buttons.up(p)) return;
      if (drag) {
        const id = drag.itemId;
        if (drag.y + 8 >= TRAY_Y + 4) {
          pos[id] = null;
        } else {
          pos[id] = {
            x: Math.max(0, Math.min(304, Math.round(drag.x / SNAP) * SNAP)),
            y: Math.max(0, Math.min(TRAY_Y - 16, Math.round(drag.y / SNAP) * SNAP)),
          };
          particles.burst(pos[id].x + 8, pos[id].y + 8, 5);
        }
        order.splice(order.indexOf(id), 1);
        order.push(id);
        glide.snap(id, { x: drag.x, y: drag.y });
        game.audio.play('place');
        save();
        drag = null;
      }
      press = null;
    },
    cancel() {
      drag = null;
      press = null;
    },
    back: () => game.go('levels', { themeId: theme.id }),
  };
}
