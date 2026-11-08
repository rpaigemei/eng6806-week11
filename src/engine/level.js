// Level model: pure data + functions, no DOM. Used by the puzzle scene and tests.
import { passes, brokenRules, validateRule } from './rules.js';

export const CELL = 16;
export const PITCH = 18;

export function slotRect(slot) {
  return { x: slot.x, y: slot.y, w: slot.capacity * PITCH - (PITCH - CELL), h: CELL };
}

export function cellPos(slot, index) {
  return { x: slot.x + index * PITCH, y: slot.y };
}

/** Create a fresh play state: everything starts in the pile. */
export function createState(level, catalog) {
  const home = {};
  level.items.forEach((id, i) => (home[id] = i));
  return {
    level,
    catalog,
    home,
    pile: [...level.items],
    slots: level.slots.map((s) => ({ ...s, items: [] })),
  };
}

export function getSlot(state, slotId) {
  return state.slots.find((s) => s.id === slotId) || null;
}

/** Returns { slotId, index } (slotId null = pile). */
export function locate(state, itemId) {
  for (const s of state.slots) {
    const i = s.items.indexOf(itemId);
    if (i >= 0) return { slotId: s.id, index: i };
  }
  return { slotId: null, index: state.pile.indexOf(itemId) };
}

function removeItem(state, itemId) {
  for (const s of state.slots) {
    const i = s.items.indexOf(itemId);
    if (i >= 0) s.items.splice(i, 1);
  }
  const p = state.pile.indexOf(itemId);
  if (p >= 0) state.pile.splice(p, 1);
}

function returnToPile(state, itemId) {
  state.pile.push(itemId);
  state.pile.sort((a, b) => state.home[a] - state.home[b]);
}

/**
 * Move an item. slotId null sends it home to the pile. If the target slot is full,
 * the item at `index` (or the last one) swaps back to where the moved item came from.
 * Returns { ok, swappedId }.
 */
export function moveItem(state, itemId, slotId, index = Infinity) {
  const from = locate(state, itemId);
  if (slotId === null) {
    removeItem(state, itemId);
    returnToPile(state, itemId);
    return { ok: true, swappedId: null };
  }
  const slot = getSlot(state, slotId);
  if (!slot) return { ok: false, swappedId: null };

  if (from.slotId === slotId) {
    slot.items.splice(from.index, 1);
    slot.items.splice(Math.min(index, slot.items.length), 0, itemId);
    return { ok: true, swappedId: null };
  }

  let swappedId = null;
  if (slot.items.length >= slot.capacity) {
    const si = Math.min(index, slot.items.length - 1);
    swappedId = slot.items[si];
    slot.items.splice(si, 1);
    if (from.slotId === null) {
      returnToPile(state, swappedId);
    } else {
      const fromSlot = getSlot(state, from.slotId);
      fromSlot.items.splice(from.index, 1, swappedId);
      removeItemFromPileOnly(state, itemId);
      slot.items.splice(Math.min(index, slot.items.length), 0, itemId);
      return { ok: true, swappedId };
    }
  }
  removeItem(state, itemId);
  slot.items.splice(Math.min(index, slot.items.length), 0, itemId);
  return { ok: true, swappedId };
}

function removeItemFromPileOnly(state, itemId) {
  const p = state.pile.indexOf(itemId);
  if (p >= 0) state.pile.splice(p, 1);
}

export function resetState(state) {
  for (const s of state.slots) s.items = [];
  state.pile = [...state.level.items];
}

/** All rule violations among placed items. */
export function violations(state) {
  const out = [];
  for (const s of state.slots) {
    const contents = s.items.map((id) => state.catalog[id]);
    for (const item of contents) {
      const broken = brokenRules(s.rules, item, contents);
      if (broken.length) out.push({ itemId: item.id, slotId: s.id, rules: broken });
    }
  }
  return out;
}

export function check(state) {
  const v = violations(state);
  const complete = state.pile.length === 0;
  return { complete, violations: v, solved: complete && v.length === 0 };
}

function slotOk(slot, contents) {
  return contents.every((it) => slot.rules.every((r) => passes(r, it, contents)));
}

/**
 * Backtracking solver. `fixed` pins items to slots; `prefer` is tried first.
 * Returns { itemId: slotId } or null when no full legal arrangement exists.
 */
export function solve(level, catalog, { fixed = {}, prefer = {} } = {}) {
  const contents = Object.fromEntries(level.slots.map((s) => [s.id, []]));
  const slotById = Object.fromEntries(level.slots.map((s) => [s.id, s]));
  const assign = {};
  for (const [id, sid] of Object.entries(fixed)) {
    contents[sid].push(catalog[id]);
    assign[id] = sid;
  }
  for (const s of level.slots) {
    if (contents[s.id].length > s.capacity || !slotOk(s, contents[s.id])) return null;
  }
  const free = level.items.filter((id) => !(id in fixed)).map((id) => catalog[id]);
  const options = new Map(
    free.map((it) => [it.id, level.slots.filter((s) => s.rules.every((r) => passes(r, it, [it])))])
  );
  free.sort((a, b) => options.get(a.id).length - options.get(b.id).length);

  const bt = (k) => {
    if (k === free.length) return true;
    const it = free[k];
    let opts = options.get(it.id);
    if (prefer[it.id]) opts = [...opts].sort((a, b) => (b.id === prefer[it.id]) - (a.id === prefer[it.id]));
    for (const s of opts) {
      const c = contents[s.id];
      if (c.length >= s.capacity) continue;
      c.push(it);
      if (slotOk(slotById[s.id], c)) {
        assign[it.id] = s.id;
        if (bt(k + 1)) return true;
        delete assign[it.id];
      }
      c.pop();
    }
    return false;
  };
  return bt(0) ? assign : null;
}

/** Count solutions (capped) — used by tests to keep levels from being trivially open. */
export function countSolutions(level, catalog, cap = 1000) {
  const contents = Object.fromEntries(level.slots.map((s) => [s.id, []]));
  const items = level.items.map((id) => catalog[id]);
  let n = 0;
  const bt = (k) => {
    if (n >= cap) return;
    if (k === items.length) {
      n++;
      return;
    }
    for (const s of level.slots) {
      const c = contents[s.id];
      if (c.length >= s.capacity) continue;
      c.push(items[k]);
      if (slotOk(s, c)) bt(k + 1);
      c.pop();
    }
  };
  bt(0);
  return n;
}

/**
 * A gentle nudge:
 *  - { type:'wrong', itemId, slotId, rule } an item breaks a rule
 *  - { type:'place', itemId, slotId }       a pile item and a slot it fits in
 *  - { type:'move', itemId, slotId }        a placed item that blocks the solution
 *  - { type:'done' }                        everything is right, press Done
 */
export function hint(state) {
  const v = violations(state);
  if (v.length) return { type: 'wrong', itemId: v[0].itemId, slotId: v[0].slotId, rule: v[0].rules[0] };

  const fixed = {};
  for (const s of state.slots) for (const id of s.items) fixed[id] = s.id;

  const sol = solve(state.level, state.catalog, { fixed });
  if (sol) {
    if (!state.pile.length) return { type: 'done' };
    // Most constrained pile item first: it's the most useful nudge.
    const ranked = [...state.pile].sort((a, b) => optionCount(state, a) - optionCount(state, b));
    return { type: 'place', itemId: ranked[0], slotId: sol[ranked[0]] };
  }
  const fresh = solve(state.level, state.catalog, { prefer: fixed });
  if (fresh) {
    for (const [id, sid] of Object.entries(fixed)) {
      if (fresh[id] !== sid) return { type: 'move', itemId: id, slotId: fresh[id] };
    }
  }
  return { type: 'done' };
}

function optionCount(state, itemId) {
  const it = state.catalog[itemId];
  return state.level.slots.filter((s) => s.rules.every((r) => passes(r, it, [it]))).length;
}

/** Returns a list of problems with a level definition (empty = valid). */
export function validateLevel(level, catalog) {
  const errors = [];
  const seen = new Set();
  for (const id of level.items) {
    if (!catalog[id]) errors.push(`${level.id}: unknown item ${id}`);
    if (seen.has(id)) errors.push(`${level.id}: duplicate item ${id}`);
    seen.add(id);
  }
  const cap = level.slots.reduce((a, s) => a + s.capacity, 0);
  if (cap !== level.items.length) errors.push(`${level.id}: capacity ${cap} != items ${level.items.length}`);
  for (const s of level.slots) {
    try {
      s.rules.forEach((r) => validateRule(r));
    } catch (e) {
      errors.push(`${level.id}/${s.id}: ${e.message}`);
    }
  }
  if (!errors.length && !solve(level, catalog)) errors.push(`${level.id}: no solution`);
  return errors;
}
