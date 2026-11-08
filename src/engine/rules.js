// Rule engine: rules are plain JSON objects so themes/levels can be pure data.
// Every rule is evaluated for one item in the context of the slot's contents.

export const R = {
  is: (attr, value) => ({ op: 'is', attr, value }),
  oneOf: (attr, values) => ({ op: 'oneOf', attr, values }),
  not: (rule) => ({ op: 'not', rule }),
  all: (...rules) => ({ op: 'all', rules }),
  any: (...rules) => ({ op: 'any', rules }),
  countAtMost: (attr, value, n) => ({ op: 'countAtMost', attr, value, n }),
};

const OPS = new Set(['is', 'oneOf', 'not', 'all', 'any', 'countAtMost']);

/** Does `item` satisfy `rule`, given everything in the slot (including item)? */
export function passes(rule, item, slotItems) {
  const tags = item.tags;
  switch (rule.op) {
    case 'is':
      return tags[rule.attr] === rule.value;
    case 'oneOf':
      return rule.values.includes(tags[rule.attr]);
    case 'not':
      return !passes(rule.rule, item, slotItems);
    case 'all':
      return rule.rules.every((r) => passes(r, item, slotItems));
    case 'any':
      return rule.rules.some((r) => passes(r, item, slotItems));
    case 'countAtMost': {
      if (tags[rule.attr] !== rule.value) return true;
      const count = slotItems.filter((i) => i.tags[rule.attr] === rule.value).length;
      return count <= rule.n;
    }
    default:
      throw new Error(`Unknown rule op: ${rule.op}`);
  }
}

/** Rules of a slot that `item` breaks. */
export function brokenRules(rules, item, slotItems) {
  return rules.filter((r) => !passes(r, item, slotItems));
}

/** Throws if a rule is malformed. `countAtMost` may only appear at the top level or inside `all`. */
export function validateRule(rule, insideNegation = false) {
  if (!rule || !OPS.has(rule.op)) throw new Error(`Bad rule: ${JSON.stringify(rule)}`);
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
      if (insideNegation) throw new Error('countAtMost cannot be inside not()/any()');
      if (!Number.isInteger(rule.n) || rule.n < 0) throw new Error('countAtMost needs n >= 0');
      break;
  }
}

function word(vocab, value, plural) {
  const v = vocab[value];
  if (v) return plural ? v[1] : v[0];
  return plural ? `${value}s` : String(value);
}

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
    default:
      return '?';
  }
}
