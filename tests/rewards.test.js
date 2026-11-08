import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starsFor, recordSolve, themeStars, isBonusUnlocked, BONUS_STARS, albumItems, totalStars } from '../src/rewards.js';
import { resetProgress } from '../src/save.js';
import { THEMES, allLevels } from '../src/themes/index.js';

test('stars: solved, no hints, first Done right', () => {
  assert.equal(starsFor({ hintsUsed: 0, wrongDones: 0 }), 3);
  assert.equal(starsFor({ hintsUsed: 2, wrongDones: 0 }), 2);
  assert.equal(starsFor({ hintsUsed: 0, wrongDones: 1 }), 2);
  assert.equal(starsFor({ hintsUsed: 1, wrongDones: 3 }), 1);
});

test('recordSolve keeps the best stars and fills the album', () => {
  const save = { solved: {}, stars: {}, album: {} };
  const level = THEMES[0].levels[0];
  recordSolve(save, level, 3);
  recordSolve(save, level, 1);
  assert.equal(save.stars[level.id], 3);
  assert.ok(level.items.every((id) => save.album[id]));
});

test('bonus rooms open at the star threshold, from main rooms only', () => {
  for (const theme of THEMES) {
    assert.ok(theme.bonus, `${theme.id} has a bonus room`);
    const save = { solved: {}, stars: {} };
    theme.levels.forEach((l, i) => (save.stars[l.id] = i < 4 ? 3 : 0)); // 12 stars
    assert.equal(themeStars(save, theme), 12);
    assert.equal(isBonusUnlocked(save, theme), 12 >= BONUS_STARS);
    save.stars[theme.levels[0].id] = 2;
    assert.equal(isBonusUnlocked(save, theme), false);
    save.stars[theme.bonus.id] = 3; // bonus stars don't count toward the unlock
    assert.equal(isBonusUnlocked(save, theme), false);
    assert.equal(totalStars(save, THEMES) >= 3, true);
  }
});

test('the album covers every decoration in a holiday (bonus included)', () => {
  for (const theme of THEMES) {
    const ids = new Set(allLevels(theme).flatMap((l) => l.items));
    assert.deepEqual(new Set(albumItems(theme)), ids);
    assert.ok(albumItems(theme).length <= 40, 'fits on one album page');
  }
});

test('restart progress clears progress but keeps settings', () => {
  const save = {
    solved: { 'winter-1': true }, stars: { 'winter-1': 3 }, album: { orn_red: true }, decor: { 'winter-1': {} },
    announced: { halloween: true }, lastTheme: 'halloween', tutorialDone: true,
    music: false, sfx: false, colorAssist: true,
  };
  resetProgress(save);
  assert.deepEqual(save.solved, {});
  assert.deepEqual(save.stars, {});
  assert.deepEqual(save.album, {});
  assert.deepEqual(save.decor, {});
  assert.equal(save.tutorialDone, undefined);
  assert.equal(save.lastTheme, undefined);
  assert.equal(save.announced, undefined);
  assert.equal(save.music, false);
  assert.equal(save.sfx, false);
  assert.equal(save.colorAssist, true);
});
