// Slot tags: each rule becomes a little paper chip of icons, so rules read at a glance.
import { PAL, UI } from './palette.js';
import { rect, drawPanel, drawText, textWidth, TAG_TEXT } from './draw.js';
import { iconSprite } from './sprites.js';
import { slotWidth } from './scenery.js';

const CHIP_H = 12;

/** Which attribute a group rule talks about: a color palette icon, or a word. */
function attrPart(attr) {
  if (attr === 'color') return { kind: 'icon', spec: { icon: 'palette' } };
  return { kind: 'text', s: attr === 'category' ? 'kind' : attr };
}

function rawParts(rule) {
  switch (rule.op) {
    case 'is':
      return [{ kind: 'icon', attr: rule.attr, value: rule.value }];
    case 'oneOf':
      return rule.values.flatMap((v, i) => [
        ...(i ? [{ kind: 'text', s: '/' }] : []),
        { kind: 'icon', attr: rule.attr, value: v },
      ]);
    case 'not':
      return [{ kind: 'text', s: 'No' }, ...rawParts(rule.rule)];
    case 'all':
      return rule.rules.flatMap(rawParts);
    case 'any':
      return rule.rules.flatMap((r, i) => [...(i ? [{ kind: 'text', s: '/' }] : []), ...rawParts(r)]);
    case 'countAtMost':
      return [{ kind: 'text', s: `Max ${rule.n}` }, { kind: 'icon', attr: rule.attr, value: rule.value }];
    case 'countAtLeast':
      return [{ kind: 'text', s: `Min ${rule.n}` }, { kind: 'icon', attr: rule.attr, value: rule.value }];
    case 'allDifferent':
      return [{ kind: 'text', s: 'Mixed' }, attrPart(rule.attr)];
    case 'allSame':
      return [{ kind: 'text', s: 'Same' }, attrPart(rule.attr)];
    case 'noAdjacent':
      return [{ kind: 'text', s: 'Apart' }, attrPart(rule.attr)];
    default:
      return [{ kind: 'text', s: '?' }];
  }
}

/** Resolve icon parts through the theme; some tag values render as words. */
function parts(rule, theme) {
  const resolved = rawParts(rule).map((p) => {
    if (p.kind !== 'icon' || p.spec) return p;
    const spec = theme.iconFor(p.attr, p.value);
    return spec.text ? { kind: 'text', s: spec.text } : { ...p, spec };
  });
  // "SAME" + "KIND" -> "SAME KIND"
  const out = [];
  for (const p of resolved) {
    const prev = out[out.length - 1];
    if (p.kind === 'text' && prev?.kind === 'text') out[out.length - 1] = { kind: 'text', s: `${prev.s} ${p.s}` };
    else out.push(p);
  }
  return out;
}

const partW = (p) => (p.kind === 'icon' ? 7 : Math.ceil(textWidth(p.s, TAG_TEXT)));

function chipWidth(rule, theme) {
  const ps = parts(rule, theme);
  return ps.reduce((a, p) => a + partW(p), 0) + (ps.length - 1) + 4;
}

export function tagWidth(slot, theme) {
  return slot.rules.reduce((a, r) => a + chipWidth(r, theme), 0) + (slot.rules.length - 1) * 2;
}

/** Where the tag sits: returns its rect. */
export function tagRect(slot, theme) {
  const w = tagWidth(slot, theme);
  const sw = slotWidth(slot);
  const t = slot.tag || { x: slot.x + sw / 2, y: slot.y - 15, align: 'center' };
  let x = t.x;
  if (t.align === 'center') x = t.x - w / 2;
  else if (t.align === 'right') x = t.x - w;
  return { x: Math.round(x), y: Math.round(t.y), w, h: CHIP_H };
}

/**
 * Draw a slot's tag. `flash` is a Set of rule indices to blink red,
 * `hot` highlights the whole tag (hover / drop target / hint).
 */
export function drawTag(ctx, slot, theme, t, { flash = null, hot = false } = {}) {
  const r = tagRect(slot, theme);
  let x = r.x;
  slot.rules.forEach((rule, idx) => {
    const w = chipWidth(rule, theme);
    const neg = rule.op === 'not';
    const blinking = flash && flash.has(idx) && Math.floor(t * 6) % 2 === 0;
    drawPanel(ctx, x, r.y, w, CHIP_H, {
      fill: blinking ? PAL.p : UI.paper,
      border: hot ? PAL.y : neg ? PAL.R : PAL.k,
      shade: UI.paperDark,
    });
    let px = x + 2;
    for (const p of parts(rule, theme)) {
      if (p.kind === 'icon') {
        ctx.drawImage(iconSprite(p.spec.icon, p.spec.colors), px, r.y + 2.5 | 0);
      } else {
        drawText(ctx, p.s, px, r.y + 3.5, p.s === 'No' ? PAL.R : UI.ink, TAG_TEXT);
      }
      px += partW(p) + 1;
    }
    x += w + 2;
  });
  return r;
}

// ---------- tag <-> spot association ----------

const gapBetween = (a, b) => ({
  x: Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)),
  y: Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h)),
});
const rectDist = (a, b) => {
  const g = gapBetween(a, b);
  return Math.hypot(Math.max(0, g.x), Math.max(0, g.y));
};
const cellsRect = (slot) => ({ x: slot.x, y: slot.y, w: slotWidth(slot), h: 16 });

/** Nearest pair of points between a tag and its spot, for drawing the string. */
function nearestPoints(a, b) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const bx = clamp(a.x + a.w / 2, b.x, b.x + b.w);
  const by = clamp(a.y + a.h / 2, b.y, b.y + b.h);
  const ax = clamp(bx, a.x, a.x + a.w);
  const ay = clamp(by, a.y, a.y + a.h);
  return { ax, ay, bx: clamp(ax, b.x, b.x + b.w), by: clamp(ay, b.y, b.y + b.h) };
}

/** A short dotted "string" from a tag to its spot, so every label reads as attached. */
export function drawTagString(ctx, slot, theme, hot = false) {
  const p = nearestPoints(tagRect(slot, theme), cellsRect(slot));
  const len = Math.hypot(p.bx - p.ax, p.by - p.ay);
  ctx.globalAlpha = hot ? 1 : 0.7;
  const steps = Math.max(1, Math.round(len / 2));
  for (let i = 0; i <= steps; i++) {
    const x = p.ax + ((p.bx - p.ax) * i) / steps;
    const y = p.ay + ((p.by - p.ay) * i) / steps;
    rect(ctx, hot ? PAL.y : UI.paperDark, Math.floor(x), Math.floor(y), 1, 1);
  }
  rect(ctx, hot ? PAL.y : PAL.Y, Math.floor(p.ax) - 1, Math.floor(p.ay) - 1, 2, 2);
  ctx.globalAlpha = 1;
}

/** Gold dotted frame around a spot's cells (shown when its tag is hovered/tapped). */
export function drawSpotFrame(ctx, slot) {
  const r = cellsRect(slot);
  ctx.fillStyle = PAL.y;
  for (let x = r.x - 2; x < r.x + r.w + 2; x += 2) {
    ctx.fillRect(x, r.y - 2, 1, 1);
    ctx.fillRect(x, r.y + r.h + 1, 1, 1);
  }
  for (let y = r.y - 2; y < r.y + r.h + 2; y += 2) {
    ctx.fillRect(r.x - 2, y, 1, 1);
    ctx.fillRect(r.x + r.w + 1, y, 1, 1);
  }
}

/**
 * Layout problems that would make a tag ambiguous. Needs a canvas (text
 * measuring), so it runs in the browser: see tools/taglayout.cjs.
 */
export function tagLayoutProblems(level, theme) {
  const out = [];
  const tags = level.slots.map((s) => ({ s, r: tagRect(s, theme), c: cellsRect(s) }));
  for (const { s, r, c } of tags) {
    const own = rectDist(r, c);
    if (own > 14) out.push(`${s.id}: tag is ${own.toFixed(1)}px from its spot (max 14)`);
    if (r.x < 1 || r.y < 1 || r.x + r.w > 319 || r.y + r.h > 131) out.push(`${s.id}: tag runs off the room`);
    for (const o of tags) {
      const g = gapBetween(r, o.c);
      if (g.x < 1 && g.y < 1) out.push(`${s.id}: tag covers ${o.s.id}'s cells`);
      if (o.s === s) continue;
      const d = rectDist(r, o.c);
      if (d <= own + 1) out.push(`${s.id}: tag is as close to ${o.s.id} (${d.toFixed(1)}px) as to its own spot (${own.toFixed(1)}px)`);
      const tg = gapBetween(r, o.r);
      if (tg.x < 3 && tg.y < 3) out.push(`${s.id}: tag crowds ${o.s.id}'s tag`);
    }
  }
  return [...new Set(out)];
}
