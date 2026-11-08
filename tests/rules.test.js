import { test } from 'node:test';
import assert from 'node:assert/strict';
import { R, passes, describe, validateRule } from '../src/engine/rules.js';

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
