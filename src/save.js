// Progress lives only in this browser's localStorage. Every access is guarded,
// so private windows or blocked storage just mean progress isn't remembered.
const KEY = 'cozy-holiday-tidy-up/v1';

const defaults = () => ({ version: 1, solved: {}, stars: {}, album: {}, decor: {}, music: true, sfx: true, colorAssist: false });

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    const d = defaults();
    // saves from before stars existed: a solved room counts as 1 star
    for (const id of Object.keys(data.solved || {})) {
      data.stars ??= {};
      data.stars[id] ||= 1;
    }
    return {
      ...d,
      ...data,
      solved: { ...(data.solved || {}) },
      stars: { ...(data.stars || {}) },
      album: { ...(data.album || {}) },
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

/** Progress fields cleared by "Restart" (settings like music and Color assist are kept). */
const PROGRESS_KEYS = ['solved', 'stars', 'album', 'decor', 'announced', 'lastTheme', 'tutorialDone'];

/** Start over: wipe progress but keep the player's settings. */
export function resetProgress(save) {
  for (const k of PROGRESS_KEYS) delete save[k];
  save.solved = {};
  save.stars = {};
  save.album = {};
  save.decor = {};
  persist(save);
  return save;
}
