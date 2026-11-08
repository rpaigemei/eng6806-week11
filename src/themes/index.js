// Theme registry. To add a holiday: create themes/<name>/theme.js exporting the
// same shape as winter (id, name, catalog, vocab, iconFor, levels, backdrops)
// and add it to this list. No engine changes needed.
import { WINTER } from './winter/theme.js';

export const THEMES = [WINTER];

export function findLevel(levelId) {
  for (const theme of THEMES) {
    const index = theme.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { theme, level: theme.levels[index], index };
  }
  return null;
}
