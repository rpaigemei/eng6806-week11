// Dev helper: prints difficulty numbers for every level.
//   node tools/levelstats.js
// solutions  distinct arrangements (aim for exactly 1)
// ambiguous  share of items whose tags alone allow 2+ spots (higher = more thinking)
// naive      share a player can place just by spotting "only one spot fits" (lower = harder)
// fair       share a careful reasoner can place with no guessing (should be 100%)
// depth      rounds of reasoning the careful player needs (higher = longer chain)
// what-if    "what if?" eliminations needed (case reasoning, the hardest kind)
// difficulty depth + 2 x what-if; should climb within each holiday
import { THEMES } from '../src/themes/index.js';
import { levelStats } from '../src/engine/level.js';

for (const theme of THEMES) {
  console.log(`\n${theme.name}`);
  for (const level of theme.levels) {
    const s = levelStats(level, theme.catalog);
    const pct = (x) => `${Math.round(x * 100)}%`.padStart(5);
    console.log(
      `  ${level.id.padEnd(10)} ${level.title.padEnd(16)} items ${String(level.items.length).padStart(2)}` +
        `  solutions ${String(s.solutions).padStart(3)}  ambiguous ${pct(s.ambiguous)}  naive ${pct(s.naive)}  fair ${pct(s.fair)}  depth ${String(s.depth).padStart(2)}  what-if ${String(s.lookaheads).padStart(2)}  difficulty ${String(s.difficulty).padStart(3)}`
    );
  }
}
