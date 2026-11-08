// The main sorting puzzle: drag decorations from the pile into slots, press DONE.
import { PAL, UI } from '../render/palette.js';
import { drawPanel, drawText, wrapText, drawGhostCell, rect } from '../render/draw.js';
import { drawSlotBack, drawSlotFront, drawSlotHardware, slotWidth } from '../render/scenery.js';
import { drawTag, tagRect } from '../render/tags.js';
import { ButtonSet, addHud } from '../ui.js';
import { describe } from '../engine/rules.js';
import { createState, moveItem, locate, getSlot, check, hint, resetState, cellPos, PITCH } from '../engine/level.js';
import { findLevel, roomNumber, THEMES } from '../themes/index.js';
import { persist } from '../save.js';
import { TRAY_Y, pilePos, drawTray, drawInfo, Glide, drawItem, itemInfo, Particles } from './common.js';

const inRect = (p, r, pad = 0) => p.x >= r.x - pad && p.x < r.x + r.w + pad && p.y >= r.y - pad && p.y < r.y + r.h + pad;

export function puzzleScene(game, { levelId }) {
  const { theme, level, index } = findLevel(levelId);
  // next room: the following one in this holiday, or the first room of the next holiday
  const nextTheme = THEMES[THEMES.indexOf(theme) + 1] || null;
  const next = theme.levels[index + 1] || nextTheme?.levels[0] || null;
  const nextIsNewHoliday = !theme.levels[index + 1] && !!next;
  const state = createState(level, theme.catalog);
  const backdrop = theme.backdrops[level.backdrop];
  const glide = new Glide();
  const particles = new Particles();
  const buttons = new ButtonSet();
  const overlayButtons = new ButtonSet();

  let t = 0;
  let overlay = 'intro';
  let press = null; // { itemId, start, off }
  let drag = null; // { itemId, x, y, off }
  let pointer = { x: -1, y: -1 };
  let hoverItem = null;
  let hoverSlot = null;
  let selected = null; // tapped item or slot for info on touch
  let message = null; // { text, at, color }
  let highlight = null; // { itemId, slotId, until }
  let solvedAt = null;
  const wiggle = {};
  const flash = {}; // slotId -> { rules:Set, until }

  const vocab = theme.vocab;
  const rulesText = (slot) => slot.rules.map((r) => describe(r, vocab)).join(', ');
  const say = (text, color = UI.paper) => (message = { text, at: t, color });

  // ---------- buttons ----------
  addHud(buttons, game, { back: () => game.go('levels', { themeId: theme.id }) });
  buttons.add({ x: 246, y: 145, w: 70, h: 16, label: 'Done', style: 'gold', onClick: onDone, enabled: () => !solvedAt });
  buttons.add({ x: 246, y: 163, w: 34, h: 13, label: 'Hint', onClick: onHint, enabled: () => !solvedAt });
  buttons.add({ x: 282, y: 163, w: 34, h: 13, label: 'Reset', onClick: onReset, enabled: () => !solvedAt });

  function overlayIntro() {
    overlay = 'intro';
    overlayButtons.list = [];
    overlayButtons.add({ x: 120, y: 108, w: 80, h: 16, label: "Let's tidy!", style: 'gold', onClick: closeOverlay });
  }
  function overlayComplete() {
    overlay = 'complete';
    overlayButtons.list = [];
    const bw = 62;
    const list = [];
    if (next && nextIsNewHoliday && THEMES.slice(0, THEMES.indexOf(nextTheme)).every((th) => th.levels.every((l) => game.save.solved[l.id]))) {
      list.push({ label: `${nextTheme.name}!`, style: 'gold', onClick: () => game.go('levels', { themeId: nextTheme.id }) });
    } else if (next && !nextIsNewHoliday) {
      list.push({ label: 'Next room', style: 'gold', onClick: () => game.go('puzzle', { levelId: next.id }) });
    }
    list.push({ label: 'Decorate', style: 'paper', onClick: () => game.go('decorate', { levelId: level.id }) });
    list.push({ label: 'Rooms', style: 'paper', onClick: () => game.go('levels', { themeId: theme.id }) });
    const total = list.length * bw + (list.length - 1) * 6;
    list.forEach((b, i) =>
      overlayButtons.add({ ...b, x: 160 - total / 2 + i * (bw + 6), y: 104, w: bw, h: 15, onClick: () => { game.audio.play('click'); b.onClick(); } })
    );
  }
  function closeOverlay() {
    game.audio.play('click');
    overlay = null;
  }
  overlayIntro();

  // ---------- geometry ----------
  function targetPos(id) {
    const loc = locate(state, id);
    if (loc.slotId) return cellPos(getSlot(state, loc.slotId), loc.index);
    return pilePos(level, id);
  }

  function drawOrder() {
    const ids = [];
    for (const s of state.slots) ids.push(...s.items);
    ids.push(...state.pile);
    return ids;
  }

  function itemAt(p) {
    const ids = drawOrder();
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i];
      if (drag && drag.itemId === id) continue;
      const pos = glide.pos.get(id) || targetPos(id);
      if (p.x >= pos.x && p.x < pos.x + 16 && p.y >= pos.y && p.y < pos.y + 16) return id;
    }
    return null;
  }

  function slotAt(p) {
    for (const s of state.slots) {
      if (inRect(p, tagRect(s, theme), 1)) return s;
      if (inRect(p, { x: s.x, y: s.y, w: slotWidth(s), h: 16 }, 2)) return s;
    }
    return null;
  }

  /** Where the dragged item would land, judged by its center. */
  function dropTarget() {
    if (!drag) return null;
    const c = { x: drag.x + 8, y: drag.y + 8 };
    if (c.y >= TRAY_Y + 4) return { pile: true };
    let best = null;
    let bestD = Infinity;
    for (const s of state.slots) {
      const r = { x: s.x - 8, y: s.y - 10, w: slotWidth(s) + 16, h: 36 };
      if (!inRect(c, r)) continue;
      const d = Math.hypot(c.x - (s.x + slotWidth(s) / 2), c.y - (s.y + 8));
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best ? { slot: best } : null;
  }

  // ---------- actions ----------
  function onDone() {
    if (state.pile.length) {
      game.audio.play('click');
      say("Put everything away first - the pile isn't empty yet.");
      for (const id of state.pile) wiggle[id] = 0.5;
      return;
    }
    const res = check(state);
    if (res.solved) return celebrate();
    game.audio.play('wrong');
    for (const v of res.violations) {
      const slot = getSlot(state, v.slotId);
      // slot-level problems (e.g. "Min 1 bell") make the whole spot wiggle
      for (const id of v.itemId ? [v.itemId] : slot.items) wiggle[id] = 1;
      const f = flash[v.slotId] || { rules: new Set(), until: 0 };
      v.rules.forEach((r) => f.rules.add(slot.rules.indexOf(r)));
      f.until = t + 2.5;
      flash[v.slotId] = f;
    }
    const n = res.violations.filter((v) => v.itemId).length;
    const spots = res.violations.filter((v) => !v.itemId).length;
    const parts = [];
    if (n) parts.push(`${n} thing${n > 1 ? 's' : ''} break${n > 1 ? '' : 's'} a rule`);
    if (spots) parts.push(`${spots} spot${spots > 1 ? 's are' : ' is'} missing something`);
    say(`Hmm, ${parts.join(' and ')}.`, PAL.p);
  }

  function onHint() {
    const h = hint(state);
    game.audio.play('hint');
    const item = h.itemId ? theme.catalog[h.itemId] : null;
    const slot = h.slotId ? getSlot(state, h.slotId) : null;
    if (h.type === 'wrong') {
      say(`The ${item.name.toLowerCase()} breaks "${describe(h.rule, vocab)}".`, PAL.o);
      flash[slot.id] = { rules: new Set([slot.rules.indexOf(h.rule)]), until: t + 3 };
    } else if (h.type === 'place') {
      say(`Try the ${item.name.toLowerCase()} in the ${slot.name.toLowerCase()}.`, PAL.o);
    } else if (h.type === 'move') {
      const from = getSlot(state, h.from);
      say(
        slot
          ? `The ${item.name.toLowerCase()} is needed in the ${slot.name.toLowerCase()}.`
          : `The ${item.name.toLowerCase()} doesn't belong in the ${from.name.toLowerCase()}.`,
        PAL.o
      );
    } else if (h.type === 'needs') {
      const from = getSlot(state, h.from);
      say(`The ${from.name.toLowerCase()} needs ${describe(h.rule, vocab)}.`, PAL.o);
      flash[from.id] = { rules: new Set([from.rules.indexOf(h.rule)]), until: t + 3 };
      highlight = { itemId: h.itemId, slotId: from.id, until: t + 4 };
      return;
    } else if (h.type === 'reorder') {
      say(`Right things, wrong order: rearrange the ${slot.name.toLowerCase()}.`, PAL.o);
      const ri = slot.rules.findIndex((r) => r.op === 'noAdjacent');
      flash[slot.id] = { rules: new Set([ri]), until: t + 3 };
    } else {
      say('Everything looks right. Press Done!', PAL.o);
    }
    highlight = { itemId: h.itemId || null, slotId: h.slotId || null, until: t + 4 };
  }

  function onReset() {
    game.audio.play('swap');
    resetState(state);
    say('Back to the pile they go.');
  }

  function celebrate() {
    solvedAt = t;
    game.save.solved[level.id] = true;
    persist(game.save);
    game.audio.play('solve');
    say(nextIsNewHoliday ? `All tidy! ${theme.name} is complete.` : next ? 'All tidy! The next room is unlocked.' : 'All tidy! Every room is done.', UI.good);
    for (const s of state.slots) {
      s.items.forEach((id, i) => {
        const p = cellPos(s, i);
        particles.burst(p.x + 8, p.y + 8, 10);
      });
    }
    particles.snowfall(80);
  }

  function drop() {
    const target = dropTarget();
    const id = drag.itemId;
    if (target?.pile) {
      if (locate(state, id).slotId) {
        moveItem(state, id, null);
        game.audio.play('place');
      }
    } else if (target?.slot) {
      const s = target.slot;
      const idx = Math.max(0, Math.round((drag.x - s.x) / PITCH));
      const res = moveItem(state, id, s.id, idx);
      game.audio.play(res.swappedId ? 'swap' : 'place');
      if (res.swappedId) delete wiggle[res.swappedId];
    } else {
      game.audio.play('click');
    }
    delete wiggle[id];
    glide.snap(id, { x: drag.x, y: drag.y });
    drag = null;
  }

  // ---------- info bar ----------
  function infoText() {
    if (drag) {
      const target = dropTarget();
      if (target?.slot) return { text: `${target.slot.name}: ${rulesText(target.slot)}`, color: PAL.o };
      if (target?.pile) return { text: 'Back to the pile', color: UI.paper };
      return { text: itemInfo(theme, theme.catalog[drag.itemId]), color: UI.paper };
    }
    if (message && t - message.at < 4) return message;
    const focus = hoverItem || selected?.itemId;
    if (focus) return { text: itemInfo(theme, theme.catalog[focus]), color: UI.paper };
    const slot = hoverSlot || (selected?.slotId && getSlot(state, selected.slotId));
    if (slot) return { text: `${slot.name}: ${rulesText(slot)}`, color: PAL.o };
    return { text: 'Drag decorations from the pile to spots that match their tags.', color: UI.paperDark };
  }

  // ---------- scene interface ----------
  return {
    song: theme.song,
    update(dt) {
      t += dt;
      for (const k of Object.keys(wiggle)) if ((wiggle[k] -= dt) <= 0) delete wiggle[k];
      particles.update(dt);
      if (solvedAt !== null && overlay === null && t - solvedAt > 1.6) overlayComplete();
    },

    draw(ctx, _t, dt) {
      backdrop.draw(ctx, t, dt);
      const target = dropTarget();
      const hl = highlight && t < highlight.until ? highlight : null;
      const pulse = Math.floor(t * 4) % 2 === 0;

      for (const s of state.slots) drawSlotBack(ctx, s);
      for (const s of state.slots) {
        const isTarget = target?.slot === s;
        for (let i = s.items.length; i < s.capacity; i++) {
          const p = cellPos(s, i);
          drawGhostCell(ctx, p.x, p.y, isTarget ? PAL.y : UI.paper, isTarget ? 0.9 : 0.45);
        }
        if (isTarget && s.items.length >= s.capacity) {
          const p = cellPos(s, Math.min(s.capacity - 1, Math.max(0, Math.round((drag.x - s.x) / PITCH))));
          drawGhostCell(ctx, p.x, p.y, PAL.y, 0.9);
        }
      }

      const drawPlaced = (id) => {
        const item = theme.catalog[id];
        const pos = glide.get(id, targetPos(id), dt);
        let x = pos.x;
        if (wiggle[id]) x += Math.round(Math.sin(t * 40) * 2 * Math.min(1, wiggle[id] / 0.3));
        let outline = null;
        if (hl && hl.itemId === id && pulse) outline = PAL.y;
        else if (wiggle[id] && flashFor(id)) outline = PAL.r;
        else if (hoverItem === id || selected?.itemId === id) outline = PAL.o;
        drawItem(ctx, item, x, pos.y, { outline });
      };
      const flashFor = (id) => locate(state, id).slotId;

      for (const s of state.slots) {
        for (const id of s.items) if (!drag || drag.itemId !== id) drawPlaced(id);
        drawSlotFront(ctx, s);
        drawSlotHardware(ctx, s);
      }
      for (const s of state.slots) {
        const f = flash[s.id] && t < flash[s.id].until ? flash[s.id].rules : null;
        const hot = target?.slot === s || hoverSlot === s || selected?.slotId === s.id || (hl && hl.slotId === s.id && pulse);
        drawTag(ctx, s, theme, t, { flash: f, hot });
      }

      // celebration glow
      if (solvedAt !== null) {
        const k = Math.max(0, 1 - (t - solvedAt) / 2);
        ctx.globalAlpha = 0.25 * k;
        rect(ctx, UI.glow, 0, 0, 320, TRAY_Y);
        ctx.globalAlpha = 1;
      }

      drawTray(ctx);
      const info = infoText();
      drawInfo(ctx, info.text, info.color);
      for (const id of state.pile) if (!drag || drag.itemId !== id) drawPlaced(id);
      buttons.draw(ctx, t);

      if (drag) drawItem(ctx, theme.catalog[drag.itemId], drag.x, drag.y, { lifted: true });
      particles.draw(ctx, t);

      if (overlay) drawOverlay(ctx);
    },

    move(p) {
      pointer = p;
      if (overlay) return overlayButtons.move(p);
      buttons.move(p);
      if (press && !drag && Math.hypot(p.x - press.start.x, p.y - press.start.y) > 2) {
        drag = { itemId: press.itemId, off: press.off, x: p.x - press.off.x, y: p.y - press.off.y };
        selected = null;
        game.audio.play('pick');
      }
      if (drag) {
        drag.x = Math.round(p.x - drag.off.x);
        drag.y = Math.round(p.y - drag.off.y);
        return;
      }
      hoverItem = itemAt(p);
      hoverSlot = hoverItem ? null : slotAt(p);
    },

    down(p) {
      pointer = p;
      if (overlay) return overlayButtons.down(p);
      if (buttons.down(p)) return;
      if (solvedAt !== null) return;
      const id = itemAt(p);
      if (id) {
        const pos = glide.pos.get(id) || targetPos(id);
        press = { itemId: id, start: p, off: { x: p.x - pos.x, y: p.y - pos.y } };
        return;
      }
      const s = slotAt(p);
      selected = s ? { slotId: s.id } : null;
      message = null;
    },

    up(p) {
      if (overlay) {
        if (!overlayButtons.up(p) && overlay === 'intro') closeOverlay();
        return;
      }
      if (buttons.up(p)) return;
      if (drag) drop();
      else if (press) {
        selected = { itemId: press.itemId };
        message = null;
      }
      press = null;
    },

    cancel() {
      if (drag) glide.snap(drag.itemId, { x: drag.x, y: drag.y });
      drag = null;
      press = null;
    },

    back: () => game.go('levels', { themeId: theme.id }),

    // exposed for automated tests
    _state: state,
  };

  function drawOverlay(ctx) {
    ctx.globalAlpha = 0.5;
    rect(ctx, PAL.k, 0, 0, 320, 180);
    ctx.globalAlpha = 1;
    if (overlay === 'intro') {
      const lines = wrapText(level.intro, 204, { size: 8.5 });
      const h = 60 + lines.length * 10;
      const top = Math.round((180 - h) / 2) - 4;
      drawPanel(ctx, 50, top, 220, h);
      rect(ctx, PAL.g, 51, top + 1, 218, 2);
      overlayButtons.list[0].y = top + h - 21;
      drawText(ctx, `Room ${roomNumber(level.id)}`, 160, top + 7, UI.inkSoft, { align: 'center', size: 8, bold: true });
      drawText(ctx, level.title, 160, top + 17, PAL.R, { title: 2, align: 'center' });
      lines.forEach((line, i) => drawText(ctx, line, 160, top + 34 + i * 10, UI.ink, { align: 'center', size: 8.5 }));
    } else if (overlay === 'complete') {
      drawPanel(ctx, 56, 40, 208, 86);
      rect(ctx, PAL.y, 57, 41, 206, 2);
      drawText(ctx, 'All tidy!', 160, 52, PAL.R, { title: 3, align: 'center', shadow: PAL.p });
      drawText(ctx, `${level.title} looks lovely.`, 160, 74, UI.ink, { align: 'center', size: 9 });
      drawText(ctx, nextIsNewHoliday ? `${theme.name} is all tidy! ${nextTheme.name} is open.` : next ? `Next up: ${next.title}` : 'You tidied every room. Thank you!', 160, 86, UI.inkSoft, { align: 'center', size: 8 });
    }
    overlayButtons.draw(ctx, t);
  }
}
