// Winter decorations. `tpl` names a sprite template in render/spriteData.js;
// `colors` maps the template's placeholder digits to palette keys.
import { COLORWAYS as C } from '../../render/spriteData.js';

/** Keepsake-album stories, one short line per decoration. */
export const STORIES = {
  orn_red: "Grandma's favorite. Always hung first, always up front.",
  orn_gold: 'Slightly dented from the year the cat discovered it.',
  orn_blue: 'Bought on a snowy trip to the coast, years ago.',
  orn_green: 'Painted by little hands. The glitter never fell off.',
  orn_white: 'Pale as fresh snow. Glows when the fire is low.',
  bell_gold: 'Rung every Christmas Eve to call everyone to cocoa.',
  bell_red: 'Its jingle sounds a little like a laugh.',
  bell_blue: 'Found at a flea market, still in its tiny box.',
  star_gold: 'The treetop star. Someone always argues for the angel.',
  star_red: 'A paper star folded on a quiet winter afternoon.',
  star_white: 'Made of salt dough. It smells faintly of cinnamon.',
  lights_warm: 'Warm white. Takes an hour to untangle every year.',
  lights_blue: 'Icy blue lights for the window, like frost at night.',
  lights_red: 'One bulb blinks out of rhythm. Nobody will fix it.',
  ribbon_red: 'Tied on the front door wreath since forever.',
  ribbon_green: 'Saved from a gift so lovely nobody wanted to toss it.',
  ribbon_gold: 'Curled with scissors, the way Dad taught everyone.',
  ribbon_blue: 'A velvet bow from a wedding, now a holiday regular.',
  stocking_red: 'Name stitched on in wobbly letters. Still the best.',
  stocking_green: 'Always seems to end up with the most oranges.',
  stocking_blue: 'Knitted over three winters. Worth the wait.',
  candle_white: 'Lit on the longest night for good luck.',
  candle_red: 'Smells like cranberries. Sort of.',
  candle_green: 'A pine-scented stub nobody has the heart to replace.',
  snowman: 'Carved from wood, with a scarf knitted to match.',
  soldier: 'Guards the mantel. Has never once blinked.',
  cane: 'Too pretty to eat. Probably. Maybe tomorrow.',
  ginger: 'Missing a button. The first bite is still a mystery.',
  pinecone: 'Picked up on a walk and painted with a dab of snow.',
  gift_red: 'Shaken gently by everyone. Nobody has guessed it.',
  gift_blue: "Wrapped in last year's paper. Nobody noticed.",
  gift_green: 'Suspiciously sock-shaped.',
  gift_gold: 'The fanciest bow in the house. Hands off till morning.',
};

const item = (id, name, tpl, colors, category, color, size) => ({
  id,
  name,
  tpl,
  colors,
  story: STORIES[id],
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
    item('star_red', 'Berry star', 'star', C.red, 'star', 'red', 'big'),
    item('bell_blue', 'Blue bell', 'bell', C.blue, 'bell', 'blue', 'small'),
    item('orn_white', 'Snow bauble', 'bauble', C.white, 'ornament', 'white', 'small'),
    item('ribbon_blue', 'Blue bow', 'bow', C.blue, 'ribbon', 'blue', 'small'),
    item('stocking_blue', 'Blue stocking', 'stocking', C.blue, 'stocking', 'blue', 'big'),
    item('candle_green', 'Pine candle', 'candleShort', C.green, 'candle', 'green', 'small'),
    item('star_white', 'Snow star', 'star', C.white, 'star', 'white', 'big'),
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
  if (attr === 'color') return { icon: `swatch_${value}` };
  if (attr === 'size') return { text: value === 'big' ? 'Big' : 'Small' };
  return { icon: `cat_${value}`, colors: C.white };
}
