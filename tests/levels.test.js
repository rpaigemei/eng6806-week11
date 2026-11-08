import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/themes/index.js';
import { TEMPLATES, ICONS, COLORWAYS } from '../src/render/spriteData.js';
import { PAL } from '../src/render/palette.js';
import { GLYPHS } from '../src/render/font.js';
import {
  createState, moveItem, check, hint, solve, validateLevel, locate, slotRect, levelStats,
} from '../src/engine/level.js';

/** Apply one hint the way a player would. */
function followHint(state, h) {
  if (h.type === 'wrong') moveItem(state, h.itemId, null);
  else if (h.type === 'reorder') h.order.forEach((id, i) => moveItem(state, id, h.slotId, i));
  else moveItem(state, h.itemId, h.slotId, h.index ?? Infinity);
}

/** Deterministic scramble: drop every item into some slot with room. */
function scramble(state, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (const id of [...state.level.items].sort(() => rnd() - 0.5)) {
    const open = state.slots.filter((x) => x.items.length < x.capacity);
    moveItem(state, id, open[Math.floor(rnd() * open.length)].id);
  }
}

// Difficulty ramp: [min ambiguous share, max naive share] per room.
const RAMP = [
  [0.15, 1],
  [0.5, 1],
  [0.6, 0.75],
  [0.65, 0.6],
  [0.75, 0.4],
];

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

    test(`${level.id}: following hints solves it from any mess`, () => {
      for (const seed of [0, 1, 7, 42, 99]) {
        const state = createState(level, theme.catalog);
        if (seed) scramble(state, seed);
        for (let step = 0; step < 100; step++) {
          const h = hint(state);
          if (h.type === 'done') break;
          followHint(state, h);
        }
        assert.equal(check(state).solved, true, `seed ${seed}`);
      }
    });

    test(`${level.id}: exactly one solution, solvable by reasoning alone`, () => {
      const st = levelStats(level, theme.catalog);
      assert.equal(st.solutions, 1);
      assert.equal(st.fair, 1, 'needs guessing');
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

test('winter difficulty ramps up', () => {
  const theme = THEMES[0];
  theme.levels.forEach((level, i) => {
    const st = levelStats(level, theme.catalog);
    const [minAmb, maxNaive] = RAMP[i];
    assert.ok(st.ambiguous >= minAmb, `${level.id} ambiguous ${st.ambiguous}`);
    assert.ok(st.naive <= maxNaive, `${level.id} naive ${st.naive}`);
  });
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
