// Tiny button widgets for canvas UIs.
import { PAL, UI } from './render/palette.js';
import { rect, drawPanel, drawText } from './render/draw.js';

export class Button {
  constructor({ x, y, w, h, label = '', onClick, style = 'wood', draw = null, enabled = () => true, visible = () => true, tip = '' }) {
    Object.assign(this, { x, y, w, h, label, onClick, style, customDraw: draw, enabled, visible, tip });
    this.hover = false;
    this.pressed = false;
  }
  contains(p) {
    return this.visible() && p.x >= this.x && p.x < this.x + this.w && p.y >= this.y && p.y < this.y + this.h;
  }
  draw(ctx, t) {
    if (!this.visible()) return;
    const on = this.enabled();
    const down = this.pressed && this.hover;
    const y = this.y + (down ? 1 : 0);
    if (this.style === 'wood') {
      drawPanel(ctx, this.x, y, this.w, this.h, {
        fill: !on ? UI.trayDark : this.hover ? '#8a5a3b' : UI.trayLight,
        border: PAL.k,
        shade: !on ? UI.trayDark : PAL.N,
        shadow: !down,
      });
      if (this.hover && on) rect(ctx, PAL.t, this.x + 2, y + 1, this.w - 4, 1);
    } else if (this.style === 'paper') {
      drawPanel(ctx, this.x, y, this.w, this.h, {
        fill: !on ? UI.paperDark : this.hover ? '#fffbe9' : UI.paper,
        border: this.hover && on ? PAL.Y : PAL.k,
        shadow: !down,
      });
    } else if (this.style === 'gold') {
      const pulse = Math.sin(t * 4) > 0;
      drawPanel(ctx, this.x, y, this.w, this.h, {
        fill: this.hover ? PAL.o : PAL.y,
        border: PAL.k,
        shade: PAL.Y,
        shadow: !down,
      });
      if (pulse && !this.hover) rect(ctx, PAL.o, this.x + 2, y + 1, this.w - 4, 1);
    }
    if (this.customDraw) this.customDraw(ctx, this.x, y, this, t);
    if (this.label) {
      const color = this.style === 'wood' ? (on ? UI.paper : UI.inkSoft) : on ? UI.ink : UI.inkSoft;
      drawText(ctx, this.label, this.x + this.w / 2, y + this.h / 2 - 3, color, { align: 'center', bold: true, size: this.h >= 15 ? 8.5 : 8 });
    }
  }
}

export class ButtonSet {
  constructor() {
    this.list = [];
    this.pressed = null;
  }
  add(opts) {
    const b = opts instanceof Button ? opts : new Button(opts);
    this.list.push(b);
    return b;
  }
  at(p) {
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].contains(p)) return this.list[i];
    return null;
  }
  move(p) {
    const hit = this.at(p);
    for (const b of this.list) b.hover = b === hit;
    return hit;
  }
  /** Returns true when the pointer landed on a button (so the scene should ignore it). */
  down(p) {
    const b = this.at(p);
    if (!b) return false;
    if (b.enabled()) {
      this.pressed = b;
      b.pressed = true;
      b.hover = true;
    }
    return true;
  }
  up(p) {
    const b = this.pressed;
    this.pressed = null;
    if (!b) return false;
    b.pressed = false;
    if (b.contains(p) && b.enabled()) b.onClick();
    return true;
  }
  draw(ctx, t) {
    for (const b of this.list) b.draw(ctx, t);
  }
}

// ---------- shared icons for HUD buttons ----------

export function drawNoteIcon(ctx, x, y, on) {
  const c = on ? UI.paper : UI.inkSoft;
  rect(ctx, c, x + 3, y + 1, 1, 6);
  rect(ctx, c, x + 4, y + 1, 3, 1);
  rect(ctx, c, x + 7, y + 1, 1, 5);
  rect(ctx, c, x + 1, y + 6, 3, 2);
  rect(ctx, c, x + 5, y + 5, 3, 2);
  if (!on) for (let i = 0; i < 8; i++) rect(ctx, PAL.r, x + i, y + 7 - i, 1, 1);
}

export function drawSpeakerIcon(ctx, x, y, on) {
  const c = on ? UI.paper : UI.inkSoft;
  rect(ctx, c, x + 1, y + 3, 2, 3);
  rect(ctx, c, x + 3, y + 2, 1, 5);
  rect(ctx, c, x + 4, y + 1, 1, 7);
  if (on) {
    rect(ctx, c, x + 6, y + 3, 1, 3);
    rect(ctx, c, x + 8, y + 2, 1, 5);
  } else for (let i = 0; i < 4; i++) {
    rect(ctx, PAL.r, x + 6 + i, y + 3 + i, 1, 1);
    rect(ctx, PAL.r, x + 9 - i, y + 3 + i, 1, 1);
  }
}

export function drawBackIcon(ctx, x, y) {
  for (let i = 0; i < 4; i++) {
    rect(ctx, UI.paper, x + 2 + i, y + 4 - i, 1, 1);
    rect(ctx, UI.paper, x + 2 + i, y + 4 + i, 1, 1);
  }
  rect(ctx, UI.paper, x + 3, y + 4, 5, 1);
}

/** Adds the back / music / sfx buttons every scene shares. */
export function addHud(buttons, game, { back = null } = {}) {
  if (back) {
    buttons.add({ x: 2, y: 2, w: 13, h: 12, onClick: back, draw: (ctx, x, y) => drawBackIcon(ctx, x + 2, y + 2), tip: 'Back' });
  }
  buttons.add({
    x: 290, y: 2, w: 13, h: 12, tip: 'Music',
    onClick: () => game.audio.setMusic(!game.save.music),
    draw: (ctx, x, y) => drawNoteIcon(ctx, x + 2, y + 2, game.save.music),
  });
  buttons.add({
    x: 305, y: 2, w: 13, h: 12, tip: 'Sounds',
    onClick: () => game.audio.setSfx(!game.save.sfx),
    draw: (ctx, x, y) => drawSpeakerIcon(ctx, x + 1, y + 2, game.save.sfx),
  });
}
