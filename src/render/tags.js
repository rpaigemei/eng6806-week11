// Slot tags: each rule becomes a little paper chip of icons, so rules read at a glance.
import { PAL, UI } from './palette.js';
import { drawPanel, drawText, textWidth } from './draw.js';
import { iconSprite } from './sprites.js';
import { slotWidth } from './scenery.js';

const CHIP_H = 11;

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
      return [{ kind: 'text', s: 'NO' }, ...rawParts(rule.rule)];
    case 'all':
      return rule.rules.flatMap(rawParts);
    case 'any':
      return rule.rules.flatMap((r, i) => [...(i ? [{ kind: 'text', s: '/' }] : []), ...rawParts(r)]);
    case 'countAtMost':
      return [{ kind: 'text', s: `MAX ${rule.n}` }, { kind: 'icon', attr: rule.attr, value: rule.value }];
    default:
      return [{ kind: 'text', s: '?' }];
  }
}

/** Resolve icon parts through the theme; some tag values render as words. */
function parts(rule, theme) {
  return rawParts(rule).map((p) => {
    if (p.kind !== 'icon') return p;
    const spec = theme.iconFor(p.attr, p.value);
    return spec.text ? { kind: 'text', s: spec.text } : { ...p, spec };
  });
}

const partW = (p) => (p.kind === 'icon' ? 7 : textWidth(p.s));

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
        ctx.drawImage(iconSprite(p.spec.icon, p.spec.colors), px, r.y + 2);
      } else {
        drawText(ctx, p.s, px, r.y + 3, p.s === 'NO' ? PAL.R : UI.ink);
      }
      px += partW(p) + 1;
    }
    x += w + 2;
  });
  return r;
}
