// Progress lives only in this browser's localStorage. Every access is guarded,
// so private windows or blocked storage just mean progress isn't remembered.
const KEY = 'cozy-holiday-tidy-up/v1';

const defaults = () => ({ version: 1, solved: {}, decor: {}, music: true, sfx: true });

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    const d = defaults();
    return {
      ...d,
      ...data,
      solved: { ...(data.solved || {}) },
      decor: { ...(data.decor || {}) },
    };
  } catch {
    return defaults();
  }
}

export function persist(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable: play on without saving */
  }
}

export function isUnlocked(save, theme, index) {
  return index === 0 || !!save.solved[theme.levels[index - 1].id];
}

/** Theme 0 is always open; each later holiday opens once the one before is fully tidy. */
export function isThemeUnlocked(save, themes, index) {
  return index === 0 || themes[index - 1].levels.every((l) => !!save.solved[l.id]);
}
