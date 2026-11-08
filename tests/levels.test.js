import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/themes/index.js';
import { TEMPLATES, ICONS, COLORWAYS } from '../src/render/spriteData.js';
import { PAL } from '../src/render/palette.js';
import { GLYPHS } from '../src/render/font.js';
import {
  createState, moveItem, check, hint, solve, validateLevel, locate, countSolutions, slotRect,
} from '../src/engine/level.js';

for (const theme of THEMES) {
  for (const level of theme.levels) {
    test(`${level.id} is valid and solvable`, () => {
      assert.deepEqual(validateLevel(level, theme.catalog), []);
    });

    test(`${level.id} slots stay on screen`, () => {
      for (const s of level.slots) {
        const r = slotRect(s);
        assert.ok(r.x >= 0 && r.x + r.w <= 320 && r.y >= 0 && r.y + r.h <= 132, `${s.id} off screen`);
      }
    });

    test(`${level.id}: playing the hints to the end solves it`, () => {
      const state = createState(level, theme.catalog);
      // Put everything in the wrong-ish first slot to make the hint work hard.
      for (const id of level.items) {
        const s = state.slots.find((x) => x.items.length < x.capacity);
        moveItem(state, id, s.id);
      }
      for (let step = 0; step < 100; step++) {
        const h = hint(state);
        if (h.type === 'done') break;
        if (h.type === 'wrong') moveItem(state, h.itemId, null);
        else moveItem(state, h.itemId, h.slotId);
      }
      assert.equal(check(state).solved, true);
    });
  }

  test(`${theme.id}: every catalog item has a sprite and icons exist for its tags`, () => {
    for (const it of Object.values(theme.catalog)) {
      assert.ok(TEMPLATES[it.tpl], `${it.id} template ${it.tpl}`);
      for (const [attr, value] of Object.entries(it.tags)) {
        const { icon, text } = theme.iconFor(attr, value);
        assert.ok(text || ICONS[icon], `icon ${icon} for ${attr}=${value}`);
      }
    }
  });
}

test('levels are not wide open (some deduction needed)', () => {
  const lvl = THEMES[0].levels[3];
  assert.ok(countSolutions(lvl, THEMES[0].catalog) <= 50);
});

test('sprite grids are well formed', () => {
  const ok = new Set(['.', '1', '2', '3', '4', '5', ...Object.keys(PAL)]);
  for (const [name, grid] of Object.entries(TEMPLATES)) {
    assert.equal(grid.length, 16, `${name} rows`);
    grid.forEach((row, i) => {
      assert.equal(row.length, 16, `${name} row ${i}`);
      for (const ch of row) assert.ok(ok.has(ch), `${name} bad char ${ch}`);
    });
  }
  for (const [name, grid] of Object.entries(ICONS)) {
    assert.equal(grid.length, 7, `${name} rows`);
    grid.forEach((row, i) => assert.equal(row.length, 7, `${name} row ${i}`));
  }
  for (const cw of Object.values(COLORWAYS)) for (const v of Object.values(cw)) assert.ok(PAL[v]);
  for (const [ch, g] of Object.entries(GLYPHS)) {
    assert.equal(g.length, 5, `glyph ${ch}`);
    g.forEach((row) => assert.equal(row.length, 3, `glyph ${ch}`));
  }
});

test('moving into a full slot swaps', () => {
  const theme = THEMES[0];
  const level = theme.levels[0];
  const state = createState(level, theme.catalog);
  moveItem(state, 'orn_red', 'box_orn');
  moveItem(state, 'orn_blue', 'box_orn');
  moveItem(state, 'lights_warm', 'box_lights');
  moveItem(state, 'lights_warm', 'box_orn', 0);
  assert.deepEqual(locate(state, 'lights_warm').slotId, 'box_orn');
  assert.deepEqual(locate(state, 'orn_red').slotId, 'box_lights');
  assert.equal(state.pile.length, 3);
  assert.ok(solve(level, theme.catalog));
});
