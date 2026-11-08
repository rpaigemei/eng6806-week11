import { test } from 'node:test';
import assert from 'node:assert/strict';
import { R } from '../src/engine/rules.js';
import {
  createState, moveItem, resetState, check, violations, solve, countSolutions, deduce, hint, locate,
} from '../src/engine/level.js';

const item = (id, color, category = 'thing', size = 'small') => ({ id, tags: { color, category, size } });
const catalog = Object.fromEntries(
  [item('r1', 'red'), item('r2', 'red'), item('b1', 'blue'), item('b2', 'blue'), item('g1', 'green'), item('g2', 'green')].map((i) => [i.id, i])
);
// Three open spots of 2: without twists, many arrangements work.
const base = {
  id: 'twist-test',
  items: ['r1', 'r2', 'b1', 'b2', 'g1', 'g2'],
  slots: [
    { id: 'a', x: 0, y: 0, capacity: 2, rules: [R.allSame('color')] },
    { id: 'b', x: 40, y: 0, capacity: 2, rules: [R.allSame('color')] },
    { id: 'c', x: 80, y: 0, capacity: 2, rules: [R.allSame('color')] },
  ],
};

test('without twists the toy level is wide open', () => {
  assert.equal(countSolutions(base, catalog), 6);
});

test('pinned items start placed, never move, and survive reset', () => {
  const level = { ...base, pinned: { r1: 'a', b1: 'b' } };
  const state = createState(level, catalog);
  assert.equal(locate(state, 'r1').slotId, 'a');
  assert.ok(!state.pile.includes('r1'));
  assert.equal(moveItem(state, 'r1', 'c').ok, false);
  assert.equal(moveItem(state, 'r1', null).ok, false);
  // dropping onto a full spot never swaps a pinned item out
  moveItem(state, 'r2', 'a');
  assert.equal(moveItem(state, 'g1', 'a', 0).swappedId, 'r2');
  assert.equal(locate(state, 'r1').slotId, 'a');
  resetState(state);
  assert.equal(locate(state, 'r1').slotId, 'a');
  assert.equal(state.pile.length, 4);
  assert.equal(countSolutions(level, catalog), 1);
  assert.equal(solve(level, catalog).g1, 'c');
});

test('tied pairs must share a spot', () => {
  const level = { ...base, slots: base.slots.map((s) => ({ ...s, rules: [] })), pairs: [['r1', 'b1'], ['r2', 'b2']] };
  const state = createState(level, catalog);
  moveItem(state, 'r1', 'a');
  moveItem(state, 'b1', 'b');
  const v = violations(state).filter((x) => x.rules.some((r) => r.op === 'together'));
  assert.deepEqual(v.map((x) => x.itemId).sort(), ['b1', 'r1']);
  assert.equal(hint(state).type, 'wrong');
  // every solution keeps the pairs together
  const sol = solve(level, catalog);
  assert.equal(sol.r1, sol.b1);
  assert.equal(sol.r2, sol.b2);
});

test('deduce treats pins as given and pairs as clues', () => {
  const level = { ...base, pinned: { r1: 'a' }, pairs: [['b1', 'b2']] };
  // r2 must join r1; the blue pair needs a whole empty spot; greens fill the rest
  assert.equal(countSolutions(level, catalog), 2);
  const level2 = { ...level, pinned: { r1: 'a', g1: 'c' } };
  assert.equal(countSolutions(level2, catalog), 1);
  assert.equal(deduce(level2, catalog).share, 1);
});

test('a solved board with pins and pairs checks out', () => {
  const level = { ...base, pinned: { r1: 'a', g1: 'c' }, pairs: [['b1', 'b2']] };
  const state = createState(level, catalog);
  moveItem(state, 'r2', 'a');
  moveItem(state, 'b1', 'b');
  moveItem(state, 'b2', 'b');
  moveItem(state, 'g2', 'c');
  assert.equal(check(state).solved, true);
});
