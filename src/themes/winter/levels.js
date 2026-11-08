// Winter levels — pure data. Coordinates are in the 320x180 logical screen
// (room area is y 0..131). A slot's x/y is the top-left of its first 16x16 cell;
// cells are 18px apart. `tag` anchors the rule tag: align 'center' | 'left' | 'right'.
import { R } from '../../engine/rules.js';

const { is, oneOf, not, any, countAtMost } = R;

export const LEVELS = [
  {
    id: 'winter-1',
    title: 'Storage Boxes',
    backdrop: 'attic',
    intro:
      'The decorations got all jumbled! Drag each one into a box. A box\'s tag shows what belongs inside. Press DONE when the pile is empty.',
    items: ['orn_red', 'lights_warm', 'ribbon_green', 'orn_blue', 'ribbon_red', 'lights_red'],
    slots: [
      { id: 'box_orn', name: 'Bauble box', x: 50, y: 90, capacity: 2, style: 'box', rules: [is('category', 'ornament')] },
      { id: 'box_lights', name: 'Lights box', x: 143, y: 90, capacity: 2, style: 'box', rules: [is('category', 'lights')] },
      { id: 'box_bows', name: 'Bow box', x: 236, y: 90, capacity: 2, style: 'box', rules: [is('category', 'ribbon')] },
    ],
  },
  {
    id: 'winter-2',
    title: 'Trim the Tree',
    backdrop: 'tree',
    intro:
      'Each row of branches wants certain colors. Tap a tag to read it out loud in the info bar.',
    items: ['orn_blue', 'bell_red', 'orn_gold', 'ribbon_green', 'cane', 'lights_blue', 'orn_red', 'bell_gold', 'orn_green'],
    slots: [
      { id: 'top', name: 'Top branches', x: 143, y: 26, capacity: 2, style: 'branch', rules: [is('color', 'gold')], tag: { x: 200, y: 29, align: 'left' } },
      { id: 'mid', name: 'Middle branches', x: 134, y: 52, capacity: 3, style: 'branch', rules: [is('color', 'red')], tag: { x: 116, y: 55, align: 'right' } },
      { id: 'low', name: 'Low branches', x: 125, y: 78, capacity: 4, style: 'branch', rules: [oneOf('color', ['blue', 'green'])], tag: { x: 222, y: 81, align: 'left' } },
    ],
  },
  {
    id: 'winter-3',
    title: 'The Mantel',
    backdrop: 'mantel',
    intro:
      'Some spots want BIG things, some want SMALL. A NO tag means keep that kind away. Candles stay far from the curtains!',
    items: ['candle_red', 'stocking_green', 'pinecone', 'soldier', 'snowman', 'candle_white', 'ginger', 'stocking_red'],
    slots: [
      { id: 'mantel_l', name: 'Mantel, left', x: 104, y: 34, capacity: 2, style: 'none', rules: [is('size', 'big')] },
      { id: 'mantel_r', name: 'Mantel, right', x: 182, y: 34, capacity: 2, style: 'none', rules: [is('size', 'small'), not(is('color', 'white'))] },
      { id: 'hooks', name: 'Stocking hooks', x: 143, y: 58, capacity: 2, style: 'hooks', rules: [is('category', 'stocking')], tag: { x: 160, y: 80, align: 'center' } },
      { id: 'sill', name: 'Window sill', x: 257, y: 66, capacity: 2, style: 'none', rules: [is('size', 'small'), not(is('category', 'candle'))], tag: { x: 274, y: 92, align: 'center' } },
    ],
  },
  {
    id: 'winter-4',
    title: 'Gift Table',
    backdrop: 'table',
    intro:
      'Tags can hold two rules, and a thing must follow both! Think about which spot each piece truly needs.',
    items: ['gift_red', 'ribbon_gold', 'bell_gold', 'gift_green', 'cane', 'gift_blue', 'ribbon_red', 'bell_red', 'gift_gold'],
    slots: [
      { id: 'gifts', name: 'Gift spot', x: 106, y: 50, capacity: 2, style: 'none', rules: [is('category', 'gift'), is('size', 'big')] },
      { id: 'tray', name: 'Silver tray', x: 180, y: 50, capacity: 2, style: 'tray', rules: [not(is('color', 'red')), is('size', 'small')] },
      { id: 'basket', name: 'Red basket', x: 22, y: 94, capacity: 3, style: 'basket', rules: [is('color', 'red'), is('size', 'small')] },
      { id: 'bows', name: 'Bow box', x: 264, y: 94, capacity: 2, style: 'box', rules: [is('category', 'ribbon')] },
    ],
  },
  {
    id: 'winter-5',
    title: 'The Grand Tree',
    backdrop: 'bigtree',
    intro:
      'The big one! A tag like MAX 1 means at most one of that kind. Stuck? HINT is always there.',
    items: ['orn_red', 'star_white', 'bell_gold', 'lights_warm', 'orn_blue', 'cane', 'star_gold', 'ribbon_green', 'bell_red', 'orn_gold', 'lights_blue', 'orn_green'],
    slots: [
      { id: 'treetop', name: 'Treetop', x: 152, y: 2, capacity: 1, style: 'none', rules: [is('category', 'star')], tag: { x: 176, y: 5, align: 'left' } },
      { id: 't1', name: 'Upper branches', x: 134, y: 28, capacity: 3, style: 'branch', rules: [not(is('size', 'big')), countAtMost('category', 'bell', 1)], tag: { x: 124, y: 31, align: 'right' } },
      { id: 't2', name: 'Middle branches', x: 125, y: 54, capacity: 4, style: 'branch', rules: [any(is('category', 'ornament'), is('category', 'lights')), countAtMost('color', 'red', 1)], tag: { x: 206, y: 57, align: 'left' } },
      { id: 't3', name: 'Low branches', x: 125, y: 80, capacity: 4, style: 'branch', rules: [not(is('color', 'gold'))], tag: { x: 108, y: 83, align: 'right' } },
    ],
  },
];
