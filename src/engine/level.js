// Level model: pure data + functions, no DOM. Used by the puzzle scene and tests.
import { passes, brokenRules, slotRuleFails, isOrderRule, validateRule } from './rules.js';

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
      // swap: the displaced item takes the moved item's old place
      getSlot(state, from.slotId).items.splice(from.index, 1, swappedId);
      slot.items.splice(Math.min(index, slot.items.length), 0, itemId);
      return { ok: true, swappedId };
    }
  }
  removeItem(state, itemId);
  slot.items.splice(Math.min(index, slot.items.length), 0, itemId);
  return { ok: true, swappedId };
}

export function resetState(state) {
  for (const s of state.slots) s.items = [];
  state.pile = [...state.level.items];
}

/**
 * All rule problems among placed items. Item-level entries name the item;
 * slot-level entries ({ itemId: null }) are rules like "at least 1 bell" on a full spot.
 */
export function violations(state) {
  const out = [];
  for (const s of state.slots) {
    const contents = s.items.map((id) => state.catalog[id]);
    contents.forEach((item, i) => {
      const broken = brokenRules(s.rules, item, contents, i);
      if (broken.length) out.push({ itemId: item.id, slotId: s.id, rules: broken });
    });
    if (contents.length === s.capacity) {
      const failed = slotRuleFails(s.rules, contents);
      if (failed.length) out.push({ itemId: null, slotId: s.id, rules: failed });
    }
  }
  return out;
}

export function check(state) {
  const v = violations(state);
  const complete = state.pile.length === 0;
  return { complete, violations: v, solved: complete && v.length === 0 };
}

function* permutations(arr) {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) yield [arr[i], ...p];
  }
}

const allPass = (slot, order) => order.every((it, i) => slot.rules.every((r) => passes(r, it, order, i)));

/**
 * Can these contents sit in this slot? Returns a working order (array of items) or null.
 * Order only matters for rules like "neighbors can't share a color"; slot-level
 * minimums are only judged once the slot is full.
 */
export function arrangeSlot(slot, contents) {
  const full = contents.length === slot.capacity;
  if (full && slotRuleFails(slot.rules, contents).length) return null;
  const orderRules = slot.rules.filter(isOrderRule);
  if (!orderRules.length) return allPass(slot, contents) ? contents : null;
  if (!full) {
    // Still filling: later items can split up neighbors, so only check what can't
    // be fixed — order-free rules, and that no value needs more than every other cell.
    const plain = { rules: slot.rules.filter((r) => !isOrderRule(r)) };
    if (!allPass(plain, contents)) return null;
    for (const r of orderRules.filter((x) => x.op === 'noAdjacent')) {
      const counts = {};
      for (const it of contents) counts[it.tags[r.attr]] = (counts[it.tags[r.attr]] || 0) + 1;
      if (Math.max(0, ...Object.values(counts)) > Math.ceil(slot.capacity / 2)) return null;
    }
    return contents;
  }
  for (const order of permutations(contents)) if (allPass(slot, order)) return order;
  return null;
}

/**
 * Backtracking solver. `fixed` pins items to slots; `prefer` is tried first.
 * Returns { assign: { itemId: slotId }, orders: { slotId: [itemId...] } } or null.
 */
export function solveWithOrder(level, catalog, { fixed = {}, prefer = {} } = {}) {
  const contents = Object.fromEntries(level.slots.map((s) => [s.id, []]));
  const slotById = Object.fromEntries(level.slots.map((s) => [s.id, s]));
  const assign = {};
  for (const [id, sid] of Object.entries(fixed)) {
    contents[sid].push(catalog[id]);
    assign[id] = sid;
  }
  for (const s of level.slots) {
    if (contents[s.id].length > s.capacity || !arrangeSlot(s, contents[s.id])) return null;
  }
  const free = level.items.filter((id) => !(id in fixed)).map((id) => catalog[id]);
  const options = new Map(free.map((it) => [it.id, staticOptions(level, it)]));
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
      if (arrangeSlot(slotById[s.id], c)) {
        assign[it.id] = s.id;
        if (bt(k + 1)) return true;
        delete assign[it.id];
      }
      c.pop();
    }
    return false;
  };
  if (!bt(0)) return null;
  const orders = {};
  for (const s of level.slots) orders[s.id] = arrangeSlot(s, contents[s.id]).map((it) => it.id);
  return { assign, orders };
}

/** Item -> slot assignment of a full solution, or null. */
export function solve(level, catalog, opts) {
  return solveWithOrder(level, catalog, opts)?.assign || null;
}

/** Slots whose rules allow this item on its own. */
export function staticOptions(level, item) {
  return level.slots.filter((s) => s.rules.every((r) => passes(r, item, [item], 0)));
}

/** Count distinct item->slot assignments that can be arranged legally (capped). */
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
      if (arrangeSlot(s, c)) bt(k + 1);
      c.pop();
    }
  };
  bt(0);
  return n;
}

/**
 * Simulates a player who only places items that have exactly one possible spot
 * left, in rounds. Returns { share, rounds }: the share of items placed that way
 * (low = needs counting / case reasoning) and how many rounds the chain took
 * (high = a long chain of deductions).
 */
export function naiveProgress(level, catalog) {
  const contents = Object.fromEntries(level.slots.map((s) => [s.id, []]));
  const left = new Set(level.items);
  let rounds = 0;
  for (;;) {
    const moves = [];
    for (const id of left) {
      const it = catalog[id];
      const fits = level.slots.filter((s) => contents[s.id].length < s.capacity && arrangeSlot(s, [...contents[s.id], it]));
      if (fits.length === 1) moves.push([id, fits[0].id]);
    }
    // apply this round's moves (skip any that conflict with an earlier one this round)
    let applied = 0;
    for (const [id, sid] of moves) {
      const slot = level.slots.find((s) => s.id === sid);
      if (contents[sid].length < slot.capacity && arrangeSlot(slot, [...contents[sid], catalog[id]])) {
        contents[sid].push(catalog[id]);
        left.delete(id);
        applied++;
      }
    }
    if (!applied) break;
    rounds++;
  }
  return { share: 1 - left.size / level.items.length, rounds };
}

/**
 * Simulates a thoughtful player using human-style techniques, in rounds:
 *  1. an item with only one possible spot goes there
 *  2. a spot with exactly as many candidates as free cells takes them all
 *  3. a "MIN" rule with exactly as many matching candidates as it still needs takes them
 *  4. "if this went here, something else would have nowhere to go" rules a spot out
 * Returns { share, rounds }. share === 1 means the level is fair: it can be solved
 * by reasoning alone, with no guessing.
 */
export function deduce(level, catalog) {
  const contents = Object.fromEntries(level.slots.map((s) => [s.id, []]));
  const left = new Set(level.items);
  const banned = new Map(level.items.map((id) => [id, new Set()]));

  const fits = (s, it, c = contents) => c[s.id].length < s.capacity && !!arrangeSlot(s, [...c[s.id], it]);
  const options = (id, c = contents) => level.slots.filter((s) => !banned.get(id).has(s.id) && fits(s, catalog[id], c));
  const place = (id, s) => {
    if (!left.has(id) || !fits(s, catalog[id])) return false;
    contents[s.id].push(catalog[id]);
    left.delete(id);
    return true;
  };
  const missing = (s, r, c = contents) => r.n - c[s.id].filter((i) => i.tags[r.attr] === r.value).length;
  const minRules = (s) => s.rules.filter((r) => r.op === 'countAtLeast');

  /** Is this (hypothetical) board still possible by simple counting? */
  const consistent = (c, rest) => {
    for (const id of rest) if (!options(id, c).length) return false;
    for (const s of level.slots) {
      const need = s.capacity - c[s.id].length;
      const cands = rest.filter((id) => options(id, c).includes(s));
      if (cands.length < need) return false;
      for (const r of minRules(s)) {
        if (cands.filter((id) => catalog[id].tags[r.attr] === r.value).length < missing(s, r, c)) return false;
      }
    }
    return true;
  };

  let rounds = 0;
  let lookaheads = 0;
  for (;;) {
    let progressed = false;
    for (const id of [...left]) {
      const o = options(id);
      if (o.length === 1) progressed = place(id, o[0]) || progressed;
    }
    for (const s of level.slots) {
      const need = s.capacity - contents[s.id].length;
      if (!need) continue;
      const cands = [...left].filter((id) => options(id).includes(s));
      if (cands.length === need) for (const id of cands) progressed = place(id, s) || progressed;
      for (const r of minRules(s)) {
        const m = missing(s, r);
        const withValue = cands.filter((id) => catalog[id].tags[r.attr] === r.value);
        if (m > 0 && withValue.length === m) for (const id of withValue) progressed = place(id, s) || progressed;
      }
    }
    if (!progressed) {
      for (const id of left) {
        for (const s of options(id)) {
          const c = { ...contents, [s.id]: [...contents[s.id], catalog[id]] };
          if (!consistent(c, [...left].filter((x) => x !== id))) {
            banned.get(id).add(s.id);
            lookaheads++;
            progressed = true;
          }
        }
      }
    }
    if (!progressed) break;
    rounds++;
  }
  return { share: 1 - left.size / level.items.length, rounds, lookaheads };
}

/** Difficulty numbers used by tests and tools/levelstats.js. */
export function levelStats(level, catalog) {
  const ambiguousItems = level.items.filter((id) => staticOptions(level, catalog[id]).length >= 2);
  const naive = naiveProgress(level, catalog);
  const smart = deduce(level, catalog);
  return {
    solutions: countSolutions(level, catalog, 100),
    ambiguous: ambiguousItems.length / level.items.length,
    naive: naive.share,
    fair: smart.share,
    depth: smart.rounds,
    lookaheads: smart.lookaheads,
    // "what if?" eliminations are the hardest steps for people, so they count double
    difficulty: smart.rounds + 2 * smart.lookaheads,
  };
}

/**
 * A gentle nudge:
 *  - { type:'wrong', itemId, slotId, rule }       an item breaks a rule
 *  - { type:'reorder', slotId, order }            a full row with the right things in the wrong order
 *  - { type:'place', itemId, slotId, index }      a pile item and where it belongs
 *  - { type:'move', itemId, slotId, from }        a placed item belongs elsewhere (slotId null = take it out)
 *  - { type:'needs', itemId, slotId, from, rule } a full spot misses a "MIN" rule; move itemId out
 *  - { type:'done' }                              everything is right, press Done
 */
export function hint(state) {
  const v = violations(state);
  const itemLevel = v.filter((x) => x.itemId);
  const plainWrong = itemLevel.find((x) => x.rules.some((r) => !isOrderRule(r)));
  if (plainWrong) {
    const rule = plainWrong.rules.find((r) => !isOrderRule(r));
    return { type: 'wrong', itemId: plainWrong.itemId, slotId: plainWrong.slotId, rule };
  }
  // Order problems only count once a row is full; until then something can go between.
  for (const x of itemLevel) {
    const slot = getSlot(state, x.slotId);
    if (slot.items.length < slot.capacity) continue;
    const order = arrangeSlot(slot, slot.items.map((id) => state.catalog[id]));
    if (order) return { type: 'reorder', slotId: slot.id, order: order.map((it) => it.id) };
  }

  const fixed = {};
  for (const s of state.slots) for (const id of s.items) fixed[id] = s.id;
  const slotLevel = v.find((x) => !x.itemId);

  if (!slotLevel) {
    const sol = solveWithOrder(state.level, state.catalog, { fixed });
    if (sol) {
      if (!state.pile.length) return { type: 'done' };
      const ranked = [...state.pile].sort(
        (a, b) => staticOptions(state.level, state.catalog[a]).length - staticOptions(state.level, state.catalog[b]).length
      );
      const id = ranked[0];
      const target = sol.assign[id];
      // insert where the final order puts it, relative to what's already there
      const present = new Set([...getSlot(state, target).items, id]);
      const index = sol.orders[target].filter((x) => present.has(x)).indexOf(id);
      return { type: 'place', itemId: id, slotId: target, index };
    }
  }

  const fresh = solve(state.level, state.catalog, { prefer: fixed });
  if (!fresh) return { type: 'done' };
  const misplaced = Object.keys(fixed).filter((id) => fresh[id] !== fixed[id]);
  const hasRoom = (sid) => getSlot(state, sid).items.length < getSlot(state, sid).capacity;
  // Prefer an item from the unhappy spot, then one whose real home has room.
  misplaced.sort(
    (a, b) =>
      (fixed[b] === slotLevel?.slotId) - (fixed[a] === slotLevel?.slotId) || hasRoom(fresh[b]) - hasRoom(fresh[a])
  );
  const id = misplaced[0];
  if (!id) return { type: 'done' };
  const to = hasRoom(fresh[id]) ? fresh[id] : null;
  if (slotLevel && fixed[id] === slotLevel.slotId) {
    return { type: 'needs', itemId: id, slotId: to, from: slotLevel.slotId, rule: slotLevel.rules[0] };
  }
  return { type: 'move', itemId: id, slotId: to, from: fixed[id] };
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
