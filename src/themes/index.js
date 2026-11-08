// Theme registry. To add a holiday: create themes/<name>/theme.js exporting the
// same shape as winter (id, name, catalog, vocab, iconFor, levels, backdrops,
// selectBackdrop, song, windowScene, box)
// and add it to this list. No engine changes needed.
import { WINTER } from './winter/theme.js';
import { HALLOWEEN } from './halloween/theme.js';

export const THEMES = [WINTER, HALLOWEEN];

/** Rooms are numbered straight through all holidays: Winter 1-5, Halloween 6-10. */
export function roomNumber(levelId) {
  let n = 0;
  for (const theme of THEMES) {
    const i = theme.levels.findIndex((l) => l.id === levelId);
    if (i >= 0) return n + i + 1;
    n += theme.levels.length;
  }
  return 0;
}

export function findLevel(levelId) {
  for (const theme of THEMES) {
    const index = theme.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { theme, level: theme.levels[index], index };
  }
  return null;
}
