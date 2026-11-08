import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, roomNumber, allLevels } from '../src/themes/index.js';
import { isThemeUnlocked } from '../src/save.js';
import { TEMPLATES, ICONS, COLORWAYS, COLOR_SYMBOLS } from '../src/render/spriteData.js';
import { PAL } from '../src/render/palette.js';
import {
  createState, moveItem, check, hint, solve, validateLevel, locate, slotRect, levelStats, countSolutions, isPinned,
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
    if (isPinned(state, id)) continue; // frozen items never move
    const open = state.slots.filter((x) => x.items.length < x.capacity);
    moveItem(state, id, open[Math.floor(rnd() * open.length)].id);
  }
}

// Difficulty ramp per holiday: [min ambiguous share, max naive share, min depth] per room.
const RAMP = {
  winter: [
    [0.15, 1, 0],
    [0.5, 1, 0],
    [0.6, 0.75, 0],
    [0.65, 0.6, 0],
    [0.75, 0.4, 0],
  ],
  // Halloween unlocks after Winter, so it keeps climbing: no "obvious" first moves.
  halloween: [
    [0.8, 0.25, 0],
    [0.8, 0.25, 3],
    [0.8, 0.25, 3],
    [0.8, 0.25, 3],
    [0.8, 0.25, 3],
  ],
};

for (const theme of THEMES) {
  for (const level of allLevels(theme)) {
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

    test(`${level.id}: tied items start side by side in the pile`, () => {
      for (const [a, b] of level.pairs || []) {
        const i = level.items.indexOf(a);
        const j = level.items.indexOf(b);
        assert.ok(Math.abs(i - j) === 1 && Math.min(i, j) % 2 === 0, `${a}/${b} should share a pile column`);
      }
    });

    test(`${level.id}: every pin and tied pair matters`, () => {
      for (const id of Object.keys(level.pinned || {})) {
        const { [id]: _, ...rest } = level.pinned;
        assert.ok(countSolutions({ ...level, pinned: rest }, theme.catalog, 3) > 1, `pin ${id} is not needed`);
      }
      (level.pairs || []).forEach((pair, i) => {
        const pairs = level.pairs.filter((_, j) => j !== i);
        assert.ok(countSolutions({ ...level, pairs }, theme.catalog, 3) > 1, `pair ${pair} is not needed`);
      });
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

for (const theme of THEMES) {
  test(`${theme.id} difficulty ramps up`, () => {
    assert.ok(RAMP[theme.id], `add difficulty targets for ${theme.id}`);
    theme.levels.forEach((level, i) => {
      const st = levelStats(level, theme.catalog);
      const [minAmb, maxNaive, minDepth] = RAMP[theme.id][i];
      assert.ok(st.ambiguous >= minAmb, `${level.id} ambiguous ${st.ambiguous}`);
      assert.ok(st.naive <= maxNaive, `${level.id} naive ${st.naive}`);
      assert.ok(st.depth >= minDepth, `${level.id} depth ${st.depth}`);
    });
  });
}

for (const theme of THEMES) {
  test(`${theme.id}: difficulty (depth + 2 x "what if?" steps) never dips`, () => {
    const d = theme.levels.map((l) => levelStats(l, theme.catalog).difficulty);
    for (let i = 1; i < d.length; i++) assert.ok(d[i] >= d[i - 1], `${theme.levels[i].id}: ${d.join(' -> ')}`);
  });
}

test('every decoration has a short album story', () => {
  for (const theme of THEMES) {
    for (const it of Object.values(theme.catalog)) {
      assert.ok(typeof it.story === 'string' && it.story.length > 10, `${it.id} has no story`);
      assert.ok(it.story.length <= 56, `${it.id} story is too long for the info bar`);
    }
  }
});

test('every color used anywhere has a symbol swatch', () => {
  for (const theme of THEMES) {
    for (const it of Object.values(theme.catalog)) {
      assert.ok(ICONS[`swatch_${it.tags.color}`], `no swatch for ${it.tags.color}`);
      assert.ok(COLOR_SYMBOLS[it.tags.color], `no symbol name for ${it.tags.color}`);
    }
  }
});

test("items are drawn in the color they're tagged with", () => {
  for (const theme of THEMES) {
    for (const it of Object.values(theme.catalog)) {
      const cw = Object.entries(COLORWAYS).find(([, c]) => ['1', '2', '3'].every((k) => it.colors[k] === c[k]));
      if (cw) assert.equal(cw[0], it.tags.color, `${it.id} is drawn ${cw[0]} but tagged ${it.tags.color}`);
    }
  }
});

for (const theme of THEMES) {
  test(`${theme.id}: the bonus room is at least as hard as the finale`, () => {
    const finale = levelStats(theme.levels[theme.levels.length - 1], theme.catalog).difficulty;
    const bonus = levelStats(theme.bonus, theme.catalog).difficulty;
    assert.ok(bonus >= finale, `bonus ${bonus} < finale ${finale}`);
    assert.ok(Object.keys(theme.bonus.pinned || {}).length && (theme.bonus.pairs || []).length, 'bonus uses both twists');
    assert.ok(theme.backdrops[theme.bonus.backdrop], 'bonus backdrop exists');
  });
}

test('every holiday has 5 rooms, unique ids, and title-screen pieces', () => {
  const ids = new Set();
  for (const theme of THEMES) {
    assert.equal(theme.levels.length, 5, theme.id);
    for (const l of theme.levels) {
      assert.ok(!ids.has(l.id), `duplicate ${l.id}`);
      ids.add(l.id);
      assert.ok(theme.backdrops[l.backdrop], `${l.id} backdrop ${l.backdrop}`);
    }
    assert.ok(theme.catalog[theme.box.peek], `${theme.id} box peek item`);
    assert.equal(typeof theme.windowScene, 'function');
    assert.ok(theme.song?.bars?.length && theme.backdrops[theme.selectBackdrop]);
  }
});

test('spots are never cramped together (drop targets stay unambiguous)', () => {
  for (const theme of THEMES) {
    for (const level of allLevels(theme)) {
      const rects = level.slots.map((s) => ({ id: s.id, ...slotRect(s) }));
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
          const gapY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
          assert.ok(gapX >= 6 || gapY >= 6, `${level.id}: ${a.id} and ${b.id} are too close`);
        }
      }
    }
  }
});

test('holidays unlock in order', () => {
  const save = { solved: {} };
  assert.equal(isThemeUnlocked(save, THEMES, 0), true);
  assert.equal(isThemeUnlocked(save, THEMES, 1), false);
  for (const l of THEMES[0].levels.slice(0, 4)) save.solved[l.id] = true;
  assert.equal(isThemeUnlocked(save, THEMES, 1), false);
  save.solved[THEMES[0].levels[4].id] = true;
  assert.equal(isThemeUnlocked(save, THEMES, 1), true);
  assert.equal(roomNumber(THEMES[1].levels[0].id), THEMES[0].levels.length + 1);
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
