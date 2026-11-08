// Stars, album and bonus-room rules. Pure functions over the save object.
import { allLevels } from './themes/index.js';

/** Stars needed in a holiday's 5 main rooms to open its bonus room. */
export const BONUS_STARS = 12;

/** ★ for solving, ★ for no hints, ★ for getting it right on the first Done. */
export function starsFor({ hintsUsed, wrongDones }) {
  return 1 + (hintsUsed === 0 ? 1 : 0) + (wrongDones === 0 ? 1 : 0);
}

export const levelStars = (save, levelId) => save.stars?.[levelId] || 0;

/** Stars earned in a holiday's main rooms (what unlocks its bonus room). */
export function themeStars(save, theme) {
  return theme.levels.reduce((a, l) => a + levelStars(save, l.id), 0);
}

export const maxThemeStars = (theme) => theme.levels.length * 3;

export function isBonusUnlocked(save, theme) {
  return !!theme.bonus && themeStars(save, theme) >= BONUS_STARS;
}

export function totalStars(save, themes) {
  return themes.reduce((a, th) => a + allLevels(th).reduce((b, l) => b + levelStars(save, l.id), 0), 0);
}

/** Every decoration that appears in a holiday's rooms, in first-seen order. */
export function albumItems(theme) {
  return [...new Set(allLevels(theme).flatMap((l) => l.items))];
}

/** Record a solve: progress, best stars, and every decoration into the album. */
export function recordSolve(save, level, stars) {
  save.solved[level.id] = true;
  save.stars ??= {};
  save.stars[level.id] = Math.max(save.stars[level.id] || 0, stars);
  save.album ??= {};
  for (const id of level.items) save.album[id] = true;
}
