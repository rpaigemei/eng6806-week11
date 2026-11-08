// Winter decorations. `tpl` names a sprite template in render/spriteData.js;
// `colors` maps the template's placeholder digits to palette keys.
import { COLORWAYS as C } from '../../render/spriteData.js';

const item = (id, name, tpl, colors, category, color, size) => ({
  id,
  name,
  tpl,
  colors,
  tags: { category, color, size },
});

const withRibbon = (base, ribbon) => ({ ...base, 4: ribbon[1], 5: ribbon[2] });

export const CATALOG = Object.fromEntries(
  [
    item('orn_red', 'Red bauble', 'bauble', C.red, 'ornament', 'red', 'small'),
    item('orn_gold', 'Gold bauble', 'bauble', C.gold, 'ornament', 'gold', 'small'),
    item('orn_blue', 'Blue bauble', 'bauble', C.blue, 'ornament', 'blue', 'small'),
    item('orn_green', 'Green bauble', 'bauble', C.green, 'ornament', 'green', 'small'),
    item('bell_gold', 'Gold bell', 'bell', C.gold, 'bell', 'gold', 'small'),
    item('bell_red', 'Red bell', 'bell', C.red, 'bell', 'red', 'small'),
    item('star_gold', 'Gold star', 'star', C.gold, 'star', 'gold', 'big'),
    item('star_white', 'Snow star', 'star', C.silver, 'star', 'white', 'big'),
    item('lights_warm', 'Warm lights', 'lights', C.gold, 'lights', 'gold', 'big'),
    item('lights_blue', 'Icy lights', 'lights', C.blue, 'lights', 'blue', 'big'),
    item('lights_red', 'Berry lights', 'lights', C.red, 'lights', 'red', 'big'),
    item('ribbon_red', 'Red bow', 'bow', C.red, 'ribbon', 'red', 'small'),
    item('ribbon_green', 'Green bow', 'bow', C.green, 'ribbon', 'green', 'small'),
    item('ribbon_gold', 'Gold bow', 'bow', C.gold, 'ribbon', 'gold', 'small'),
    item('stocking_red', 'Red stocking', 'stocking', C.red, 'stocking', 'red', 'big'),
    item('stocking_green', 'Green stocking', 'stocking', C.green, 'stocking', 'green', 'big'),
    item('candle_white', 'Tall candle', 'candleTall', C.white, 'candle', 'white', 'big'),
    item('candle_red', 'Little candle', 'candleShort', C.red, 'candle', 'red', 'small'),
    item('snowman', 'Snowman', 'snowman', {}, 'figure', 'white', 'small'),
    item('soldier', 'Toy soldier', 'soldier', {}, 'figure', 'red', 'big'),
    item('cane', 'Candy cane', 'cane', {}, 'treat', 'red', 'small'),
    item('ginger', 'Gingerbread', 'ginger', {}, 'treat', 'brown', 'small'),
    item('pinecone', 'Pinecone', 'pinecone', {}, 'nature', 'brown', 'small'),
    item('gift_red', 'Red gift', 'giftSmall', withRibbon(C.red, C.gold), 'gift', 'red', 'small'),
    item('gift_blue', 'Blue gift', 'giftSmall', withRibbon(C.blue, C.white), 'gift', 'blue', 'small'),
    item('gift_green', 'Green gift', 'giftBig', withRibbon(C.green, C.red), 'gift', 'green', 'big'),
    item('gift_gold', 'Gold gift', 'giftBig', withRibbon(C.gold, C.red), 'gift', 'gold', 'big'),
  ].map((it) => [it.id, it])
);

/** Singular / plural words used in rule text. */
export const VOCAB = {
  ornament: ['bauble', 'baubles'],
  bell: ['bell', 'bells'],
  star: ['star', 'stars'],
  lights: ['light string', 'lights'],
  ribbon: ['bow', 'bows'],
  stocking: ['stocking', 'stockings'],
  candle: ['candle', 'candles'],
  figure: ['figure', 'figures'],
  treat: ['treat', 'treats'],
  nature: ['nature find', 'nature finds'],
  gift: ['gift', 'gifts'],
  red: ['red thing', 'red things'],
  gold: ['gold thing', 'gold things'],
  blue: ['blue thing', 'blue things'],
  green: ['green thing', 'green things'],
  white: ['white thing', 'white things'],
  brown: ['brown thing', 'brown things'],
  small: ['small thing', 'small things'],
  big: ['big thing', 'big things'],
};

/** Which mini-icon represents each tag value on slot tags. */
export function iconFor(attr, value) {
  if (attr === 'color') return { icon: 'swatch', colors: C[value === 'white' ? 'white' : value] };
  if (attr === 'size') return { text: value === 'big' ? 'BIG' : 'SMALL' };
  return { icon: `cat_${value}`, colors: C.white };
}
