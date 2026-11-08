// Winter levels — pure data. Coordinates are in the 320x180 logical screen
// (room area is y 0..131). A slot's x/y is the top-left of its first 16x16 cell;
// cells are 18px apart. `tag` anchors the rule tag: align 'center' | 'left' | 'right'.
//
// Every level has exactly one solution and can be solved by reasoning alone
// (see tests/levels.test.js and `node tools/levelstats.js`).
import { R } from '../../engine/rules.js';

const { is, oneOf, not, countAtMost, countAtLeast, allDifferent, allSame, noAdjacent } = R;

export const LEVELS = [
  {
    // Tutorial. Two items fit two boxes; the red box can only be filled one way.
    id: 'winter-1',
    title: 'Storage Boxes',
    backdrop: 'attic',
    intro:
      'Drag each decoration into a box whose tag it matches. Some things fit two boxes, but only one way fits everything. Press DONE when the pile is empty.',
    items: ['orn_red', 'lights_warm', 'ribbon_red', 'orn_blue', 'bell_red', 'lights_red'],
    slots: [
      { id: 'box_orn', name: 'Bauble box', x: 50, y: 90, capacity: 2, style: 'box', rules: [is('category', 'ornament')] },
      { id: 'box_red', name: 'Red box', x: 143, y: 90, capacity: 2, style: 'box', rules: [is('color', 'red')] },
      { id: 'box_lights', name: 'Lights box', x: 236, y: 90, capacity: 2, style: 'box', rules: [is('category', 'lights')] },
    ],
  },
  {
    // MIXED: blue pair up top -> big star must go low -> gold bow can't share
    // gold with it, so it goes mid -> other bows can't share a kind there -> low ...
    id: 'winter-2',
    title: 'Trim the Tree',
    backdrop: 'tree',
    intro:
      'New tag: MIXED. No two things in that row may share a color (or a kind). Each placement tells you something about the next one.',
    items: ['ribbon_green', 'star_gold', 'bell_red', 'orn_white', 'lights_blue', 'ribbon_red', 'orn_green', 'bell_blue', 'ribbon_gold'],
    slots: [
      { id: 'top', name: 'Top branches', x: 143, y: 26, capacity: 2, style: 'branch', rules: [is('color', 'blue')], tag: { x: 200, y: 29, align: 'left' } },
      { id: 'mid', name: 'Middle branches', x: 134, y: 52, capacity: 3, style: 'branch', rules: [not(is('size', 'big')), allDifferent('category')], tag: { x: 116, y: 55, align: 'right' } },
      { id: 'low', name: 'Low branches', x: 125, y: 78, capacity: 4, style: 'branch', rules: [allDifferent('color')], tag: { x: 222, y: 81, align: 'left' } },
    ],
  },
  {
    // MIN: only one red thing exists -> it must be on the sill. Hooks then have
    // exactly two candidates. The mantel needs a green AND a star...
    id: 'winter-3',
    title: 'The Mantel',
    backdrop: 'mantel',
    intro:
      'New tags: MIN 1 means the spot needs at least one of that. NO means none allowed. Look for the thing that only one spot can use.',
    items: ['snowman', 'stocking_red', 'bell_gold', 'orn_white', 'candle_green', 'pinecone', 'star_gold', 'stocking_green'],
    slots: [
      { id: 'mantel_l', name: 'Mantel, left', x: 104, y: 34, capacity: 2, style: 'none', rules: [countAtLeast('color', 'green', 1), countAtLeast('category', 'star', 1)] },
      { id: 'mantel_r', name: 'Mantel, right', x: 182, y: 34, capacity: 2, style: 'none', rules: [not(is('category', 'ornament'))] },
      { id: 'hooks', name: 'Hooks', x: 143, y: 58, capacity: 2, style: 'hooks', rules: [oneOf('category', ['stocking', 'bell'])], tag: { x: 160, y: 80, align: 'center' } },
      { id: 'sill', name: 'Window sill', x: 257, y: 66, capacity: 2, style: 'none', rules: [countAtLeast('color', 'red', 1)], tag: { x: 274, y: 92, align: 'center' } },
    ],
  },
  {
    // SAME: big things can only use the tray or basket; the green gift can't
    // join a same-color basket (it's the only green) so it takes the tray...
    id: 'winter-4',
    title: 'Gift Table',
    backdrop: 'table',
    intro:
      'New tag: SAME means everything in the spot shares a color (or a kind). Count your colors and kinds: some groups are the only ones big enough.',
    items: ['gift_red', 'bell_blue', 'star_red', 'ribbon_blue', 'candle_red', 'gift_green', 'bell_gold', 'ribbon_red', 'gift_blue'],
    slots: [
      { id: 'table', name: 'Table', x: 106, y: 50, capacity: 2, style: 'none', rules: [is('size', 'small')] },
      { id: 'tray', name: 'Candle tray', x: 180, y: 50, capacity: 2, style: 'tray', rules: [countAtLeast('category', 'candle', 1)] },
      { id: 'basket', name: 'Basket', x: 22, y: 94, capacity: 3, style: 'basket', rules: [allSame('color')] },
      { id: 'box', name: 'Little box', x: 264, y: 94, capacity: 2, style: 'box', rules: [is('size', 'small'), allSame('category')] },
    ],
  },
  {
    // APART + case reasoning: only baubles come in a set of four. If the gold
    // group took the upper branches, the middle would need two light strings;
    // if the white star topped the tree, three golds couldn't sit apart in four cells.
    id: 'winter-5',
    title: 'The Grand Tree',
    backdrop: 'bigtree',
    intro:
      'New tags: APART means side-by-side things can\'t share a color, so drag within a row to rearrange. MAX 1 means at most one. Stuck? Ask "what if?" and see what breaks.',
    items: ['orn_red', 'star_white', 'bell_gold', 'lights_red', 'orn_blue', 'ribbon_gold', 'star_gold', 'orn_white', 'bell_red', 'orn_gold', 'lights_blue', 'star_red'],
    slots: [
      { id: 'treetop', name: 'Treetop', x: 152, y: 2, capacity: 1, style: 'none', rules: [is('category', 'star')], tag: { x: 176, y: 5, align: 'left' } },
      { id: 't1', name: 'Upper branches', x: 134, y: 28, capacity: 3, style: 'branch', rules: [allSame('color')], tag: { x: 124, y: 31, align: 'right' } },
      { id: 't2', name: 'Middle branches', x: 125, y: 54, capacity: 4, style: 'branch', rules: [countAtMost('category', 'lights', 1), noAdjacent('color')], tag: { x: 206, y: 57, align: 'left' } },
      { id: 't3', name: 'Low branches', x: 125, y: 80, capacity: 4, style: 'branch', rules: [allSame('category')], tag: { x: 108, y: 83, align: 'right' } },
    ],
  },
];
