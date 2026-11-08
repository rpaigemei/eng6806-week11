import { test } from 'node:test';
import assert from 'node:assert/strict';
import { R, passes, describe, validateRule, slotRuleFails } from '../src/engine/rules.js';
import { arrangeSlot } from '../src/engine/level.js';

const item = (id, tags) => ({ id, tags });
const redBell = item('rb', { category: 'bell', color: 'red', size: 'small' });
const goldBell = item('gb', { category: 'bell', color: 'gold', size: 'small' });
const goldStar = item('gs', { category: 'star', color: 'gold', size: 'big' });

test('is / oneOf / not', () => {
  assert.equal(passes(R.is('color', 'red'), redBell, [redBell]), true);
  assert.equal(passes(R.is('color', 'red'), goldBell, [goldBell]), false);
  assert.equal(passes(R.oneOf('color', ['red', 'gold']), goldBell, []), true);
  assert.equal(passes(R.not(R.is('size', 'big')), goldStar, []), false);
});

test('all / any', () => {
  const both = R.all(R.is('color', 'gold'), R.is('size', 'big'));
  assert.equal(passes(both, goldStar, []), true);
  assert.equal(passes(both, goldBell, []), false);
  const either = R.any(R.is('category', 'star'), R.is('color', 'red'));
  assert.equal(passes(either, redBell, []), true);
  assert.equal(passes(either, goldBell, []), false);
});

test('countAtMost only fails matching items once over the limit', () => {
  const rule = R.countAtMost('category', 'bell', 1);
  assert.equal(passes(rule, redBell, [redBell, goldStar]), true);
  assert.equal(passes(rule, redBell, [redBell, goldBell]), false);
  assert.equal(passes(rule, goldStar, [redBell, goldBell, goldStar]), true);
});

test('describe uses vocabulary', () => {
  const vocab = { bell: ['bell', 'bells'], red: ['red thing', 'red things'], star: ['star', 'stars'] };
  assert.equal(describe(R.is('category', 'bell'), vocab), 'only bells');
  assert.equal(describe(R.not(R.is('color', 'red')), vocab), 'no red things');
  assert.equal(describe(R.countAtMost('category', 'bell', 1), vocab), 'at most 1 bell');
  assert.equal(describe(R.any(R.is('category', 'bell'), R.is('category', 'star')), vocab), 'only bells or stars');
});

test('validateRule rejects counts under negation', () => {
  assert.throws(() => validateRule(R.not(R.countAtMost('color', 'red', 1))));
  assert.throws(() => validateRule({ op: 'nope' }));
  assert.doesNotThrow(() => validateRule(R.all(R.is('a', 1), R.countAtMost('a', 1, 2))));
});

const blueBell = item('bb', { category: 'bell', color: 'blue', size: 'small' });

test('allDifferent / allSame', () => {
  assert.equal(passes(R.allDifferent('color'), redBell, [redBell, goldBell]), true);
  assert.equal(passes(R.allDifferent('category'), redBell, [redBell, goldBell]), false);
  assert.equal(passes(R.allSame('category'), redBell, [redBell, goldBell]), true);
  assert.equal(passes(R.allSame('color'), redBell, [redBell, goldBell]), false);
});

test('countAtLeast is judged on the whole spot', () => {
  const rule = R.countAtLeast('category', 'star', 1);
  assert.equal(passes(rule, redBell, [redBell, goldBell]), true);
  assert.deepEqual(slotRuleFails([rule], [redBell, goldBell]), [rule]);
  assert.deepEqual(slotRuleFails([rule], [redBell, goldStar]), []);
});

test('noAdjacent depends on position', () => {
  const rule = R.noAdjacent('color');
  const row = [goldBell, goldStar, redBell];
  assert.equal(passes(rule, goldBell, row, 0), false);
  assert.equal(passes(rule, redBell, row, 2), true);
  const fixed = [goldBell, redBell, goldStar];
  assert.equal(fixed.every((it, i) => passes(rule, it, fixed, i)), true);
});

test('arrangeSlot finds an order, and does not give up on half-filled spots', () => {
  const slot = { capacity: 3, rules: [R.noAdjacent('color')] };
  assert.ok(arrangeSlot(slot, [goldBell, goldStar])); // a 3rd item can split them
  const order = arrangeSlot(slot, [goldBell, goldStar, blueBell]);
  assert.deepEqual(order.map((i) => i.id), ['gb', 'bb', 'gs']);
  assert.equal(arrangeSlot(slot, [goldBell, goldStar, item('g3', { color: 'gold' })]), null);
  const min = { capacity: 2, rules: [R.countAtLeast('category', 'star', 1)] };
  assert.ok(arrangeSlot(min, [redBell]));
  assert.equal(arrangeSlot(min, [redBell, goldBell]), null);
});

test('describe new rules', () => {
  const vocab = { bell: ['bell', 'bells'] };
  assert.equal(describe(R.allDifferent('color')), 'all different colors');
  assert.equal(describe(R.allSame('category')), 'all the same kind');
  assert.equal(describe(R.countAtLeast('category', 'bell', 1), vocab), 'at least 1 bell');
  assert.equal(describe(R.noAdjacent('color')), "neighbors can't share a color");
  assert.throws(() => validateRule(R.not(R.allSame('color'))));
});
