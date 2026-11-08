// Theme registry. To add a holiday: create themes/<name>/theme.js exporting the
// same shape as winter (id, name, catalog, vocab, iconFor, levels, backdrops,
// selectBackdrop, song, windowScene, box)
// and add it to this list. No engine changes needed.
import { WINTER } from './winter/theme.js';
import { HALLOWEEN } from './halloween/theme.js';

export const THEMES = [WINTER, HALLOWEEN];

/** A holiday's main rooms plus its bonus room (if it has one). */
export function allLevels(theme) {
  return theme.bonus ? [...theme.levels, theme.bonus] : theme.levels;
}

/** Rooms are numbered straight through all holidays (Winter 1-5, Halloween 6-10). Bonus rooms return null. */
export function roomNumber(levelId) {
  let n = 0;
  for (const theme of THEMES) {
    const i = theme.levels.findIndex((l) => l.id === levelId);
    if (i >= 0) return n + i + 1;
    n += theme.levels.length;
  }
  return null;
}

export function findLevel(levelId) {
  for (const theme of THEMES) {
    const index = theme.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { theme, level: theme.levels[index], index, isBonus: false };
    if (theme.bonus?.id === levelId) return { theme, level: theme.bonus, index: theme.levels.length, isBonus: true };
  }
  return null;
}
