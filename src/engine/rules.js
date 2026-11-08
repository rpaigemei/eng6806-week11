// Rule engine: rules are plain JSON objects so themes/levels can be pure data.
// Every rule is evaluated for one item in the context of the slot's contents
// (in order) and the item's position in that slot.

export const R = {
  is: (attr, value) => ({ op: 'is', attr, value }),
  oneOf: (attr, values) => ({ op: 'oneOf', attr, values }),
  not: (rule) => ({ op: 'not', rule }),
  all: (...rules) => ({ op: 'all', rules }),
  any: (...rules) => ({ op: 'any', rules }),
  /** At most n items with attr === value. */
  countAtMost: (attr, value, n) => ({ op: 'countAtMost', attr, value, n }),
  /** At least n items with attr === value (judged once the spot is full). */
  countAtLeast: (attr, value, n) => ({ op: 'countAtLeast', attr, value, n }),
  /** No two items share attr. */
  allDifferent: (attr) => ({ op: 'allDifferent', attr }),
  /** Every item shares attr. */
  allSame: (attr) => ({ op: 'allSame', attr }),
  /** Side-by-side items can't share attr (order matters). */
  noAdjacent: (attr) => ({ op: 'noAdjacent', attr }),
};

const OPS = new Set(['is', 'oneOf', 'not', 'all', 'any', 'countAtMost', 'countAtLeast', 'allDifferent', 'allSame', 'noAdjacent']);
/** Rules that look at the whole spot; they may not sit inside not()/any(). */
const GROUP_OPS = new Set(['countAtMost', 'countAtLeast', 'allDifferent', 'allSame', 'noAdjacent']);

/**
 * Does `item` satisfy `rule`, given everything in the slot (in order, including item)?
 * `index` is the item's position; it defaults to its place in `slotItems`.
 * Slot-level rules (countAtLeast) always pass here — see slotRuleFails().
 */
export function passes(rule, item, slotItems, index = slotItems.indexOf(item)) {
  const tags = item.tags;
  switch (rule.op) {
    case 'is':
      return tags[rule.attr] === rule.value;
    case 'oneOf':
      return rule.values.includes(tags[rule.attr]);
    case 'not':
      return !passes(rule.rule, item, slotItems, index);
    case 'all':
      return rule.rules.every((r) => passes(r, item, slotItems, index));
    case 'any':
      return rule.rules.some((r) => passes(r, item, slotItems, index));
    case 'countAtMost': {
      if (tags[rule.attr] !== rule.value) return true;
      const count = slotItems.filter((i) => i.tags[rule.attr] === rule.value).length;
      return count <= rule.n;
    }
    case 'countAtLeast':
      return true;
    case 'allDifferent':
      return slotItems.filter((i) => i.tags[rule.attr] === tags[rule.attr]).length <= 1;
    case 'allSame':
      return slotItems.every((i) => i.tags[rule.attr] === tags[rule.attr]);
    case 'noAdjacent': {
      if (index < 0) return true;
      const prev = slotItems[index - 1];
      const next = slotItems[index + 1];
      return !(prev && prev.tags[rule.attr] === tags[rule.attr]) && !(next && next.tags[rule.attr] === tags[rule.attr]);
    }
    default:
      throw new Error(`Unknown rule op: ${rule.op}`);
  }
}

/** Rules of a slot that the item at `index` breaks. */
export function brokenRules(rules, item, slotItems, index = slotItems.indexOf(item)) {
  return rules.filter((r) => !passes(r, item, slotItems, index));
}

/** Top-level slot rules that fail for a *full* slot as a whole (e.g. "at least 1 bell"). */
export function slotRuleFails(rules, slotItems) {
  return rules.filter(
    (r) => r.op === 'countAtLeast' && slotItems.filter((i) => i.tags[r.attr] === r.value).length < r.n
  );
}

/** True if any rule depends on item order within the slot. */
export function isOrderRule(rule) {
  if (rule.op === 'noAdjacent') return true;
  if (rule.op === 'all') return rule.rules.some(isOrderRule);
  return false;
}

/** Throws if a rule is malformed. Group rules may only appear at the top level or inside `all`. */
export function validateRule(rule, insideNegation = false) {
  if (!rule || !OPS.has(rule.op)) throw new Error(`Bad rule: ${JSON.stringify(rule)}`);
  if (GROUP_OPS.has(rule.op) && insideNegation) throw new Error(`${rule.op} cannot be inside not()/any()`);
  switch (rule.op) {
    case 'is':
      if (typeof rule.attr !== 'string' || rule.value === undefined) throw new Error('is() needs attr and value');
      break;
    case 'oneOf':
      if (!Array.isArray(rule.values) || rule.values.length < 2) throw new Error('oneOf() needs 2+ values');
      break;
    case 'not':
      validateRule(rule.rule, true);
      break;
    case 'all':
      rule.rules.forEach((r) => validateRule(r, insideNegation));
      break;
    case 'any':
      rule.rules.forEach((r) => validateRule(r, true));
      break;
    case 'countAtMost':
    case 'countAtLeast':
      if (!Number.isInteger(rule.n) || rule.n < 0) throw new Error(`${rule.op} needs n >= 0`);
      break;
    case 'allDifferent':
    case 'allSame':
    case 'noAdjacent':
      if (typeof rule.attr !== 'string') throw new Error(`${rule.op} needs attr`);
      break;
  }
}

function word(vocab, value, plural) {
  const v = vocab[value];
  if (v) return plural ? v[1] : v[0];
  return plural ? `${value}s` : String(value);
}

const ATTR_WORDS = { color: ['color', 'colors'], category: ['kind', 'kinds'], size: ['size', 'sizes'] };
const attrWord = (attr, plural) => (ATTR_WORDS[attr] || [attr, `${attr}s`])[plural ? 1 : 0];

/** Human-readable rule text, e.g. "only red things", "no stars", "at most 1 bell". */
export function describe(rule, vocab = {}) {
  switch (rule.op) {
    case 'is':
      return `only ${word(vocab, rule.value, true)}`;
    case 'oneOf':
      return `only ${rule.values.map((v) => word(vocab, v, true)).join(' or ')}`;
    case 'not': {
      const inner = rule.rule;
      if (inner.op === 'is') return `no ${word(vocab, inner.value, true)}`;
      if (inner.op === 'oneOf') return `no ${inner.values.map((v) => word(vocab, v, true)).join(' or ')}`;
      return `not (${describe(inner, vocab)})`;
    }
    case 'all':
      return rule.rules.map((r) => describe(r, vocab)).join(' and ');
    case 'any': {
      if (rule.rules.every((r) => r.op === 'is')) {
        return `only ${rule.rules.map((r) => word(vocab, r.value, true)).join(' or ')}`;
      }
      return rule.rules.map((r) => describe(r, vocab)).join(' or ');
    }
    case 'countAtMost':
      return `at most ${rule.n} ${word(vocab, rule.value, rule.n !== 1)}`;
    case 'countAtLeast':
      return `at least ${rule.n} ${word(vocab, rule.value, rule.n !== 1)}`;
    case 'allDifferent':
      return `all different ${attrWord(rule.attr, true)}`;
    case 'allSame':
      return `all the same ${attrWord(rule.attr, false)}`;
    case 'noAdjacent':
      return `neighbors can't share a ${attrWord(rule.attr, false)}`;
    default:
      return '?';
  }
}
