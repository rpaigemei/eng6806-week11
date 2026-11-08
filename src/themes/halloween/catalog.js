// Halloween decorations. Same shape as the winter catalog: `tpl` names a sprite
// template in render/spriteData.js, `colors` recolors its placeholder digits.
import { COLORWAYS as C } from '../../render/spriteData.js';

/** Keepsake-album stories, one short line per decoration. */
export const STORIES = {
  pumpkin_orange: 'Grown in the garden. Won second prize at the fair.',
  pumpkin_white: 'A ghost pumpkin, pale as the moon it grew under.',
  pumpkin_green: 'A bumpy little gourd that refuses to turn orange.',
  pumpkin_mini: 'Small enough to fit in a pocket. Often does.',
  pumpkin_purple: 'A plum-colored gourd. The neighbors keep asking.',
  lantern_orange: 'Its old iron door creaks a cheerful hello.',
  candle_orange: 'Smells like pumpkin pie, which is the whole point.',
  candle_purple: 'Melts into tiny purple puddles shaped like bats.',
  candle_black: 'Looks spooky, smells like vanilla. A softie.',
  candle_bone: 'Tall and pale. Lit for the first trick-or-treater.',
  bat_black: 'A felt bat that hangs upside down by choice.',
  bat_purple: 'Flaps when the door opens. Startles everyone, still.',
  spider_black: 'Eight legs, two googly eyes, zero bad intentions.',
  spider_green: 'Lives in the fake web all year. Very loyal.',
  cat: 'Sat on the porch one October and never left.',
  ghost: 'Made from an old pillowcase. Says boo very politely.',
  skull: 'A sugar skull, painted with tiny flowers.',
  potion_green: "Labeled 'Frog Fizz'. It's lime soda.",
  potion_purple: 'Grape juice in a fancy bottle. Shh.',
  potion_orange: 'Smells of orange peel and a little mischief.',
  cauldron: 'Holds candy, soup, or a fog machine. Never all three.',
  candy_orange: 'The last orange candy always ends up here.',
  candy_purple: 'Grape flavor. Fought over every single year.',
  candy_green: 'Sour apple. Brave trick-or-treaters only.',
  hat_purple: 'Belonged to a great-aunt with a great laugh.',
  hat_black: 'A proper witch hat. The brim has seen things.',
  hat_green: 'Homemade, slightly lopsided, totally perfect.',
};

const item = (id, name, tpl, colors, category, color, size) => ({
  id,
  name,
  tpl,
  colors,
  story: STORIES[id],
  tags: { category, color, size },
});

export const CATALOG = Object.fromEntries(
  [
    item('pumpkin_orange', 'Big pumpkin', 'pumpkin', C.orange, 'pumpkin', 'orange', 'big'),
    item('pumpkin_white', 'Ghost pumpkin', 'pumpkin', C.white, 'pumpkin', 'white', 'big'),
    item('pumpkin_green', 'Green gourd', 'pumpkinSmall', C.green, 'pumpkin', 'green', 'small'),
    item('pumpkin_mini', 'Mini pumpkin', 'pumpkinSmall', C.orange, 'pumpkin', 'orange', 'small'),
    item('pumpkin_purple', 'Plum gourd', 'pumpkinSmall', C.purple, 'pumpkin', 'purple', 'small'),
    item('lantern_orange', 'Orange lantern', 'lantern', {}, 'lantern', 'orange', 'big'),
    item('candle_orange', 'Orange candle', 'candleTall', C.orange, 'lantern', 'orange', 'big'),
    item('candle_purple', 'Purple candle', 'candleShort', C.purple, 'lantern', 'purple', 'small'),
    item('candle_black', 'Black candle', 'candleShort', C.black, 'lantern', 'black', 'small'),
    item('candle_bone', 'Bone candle', 'candleTall', C.white, 'lantern', 'white', 'big'),
    item('bat_black', 'Bat', 'bat', C.black, 'critter', 'black', 'small'),
    item('bat_purple', 'Purple bat', 'bat', C.purple, 'critter', 'purple', 'small'),
    item('spider_black', 'Spider', 'spider', C.black, 'critter', 'black', 'small'),
    item('spider_green', 'Green spider', 'spider', C.green, 'critter', 'green', 'small'),
    item('cat', 'Black cat', 'cat', {}, 'critter', 'black', 'big'),
    item('ghost', 'Ghost', 'ghost', {}, 'spooky', 'white', 'big'),
    item('skull', 'Skull', 'skull', {}, 'spooky', 'white', 'small'),
    item('potion_green', 'Green potion', 'potion', C.green, 'potion', 'green', 'small'),
    item('potion_purple', 'Purple potion', 'potion', C.purple, 'potion', 'purple', 'small'),
    item('potion_orange', 'Orange potion', 'potion', C.orange, 'potion', 'orange', 'small'),
    item('cauldron', 'Cauldron', 'cauldron', C.black, 'potion', 'black', 'big'),
    item('candy_orange', 'Orange candy', 'candy', C.orange, 'candy', 'orange', 'small'),
    item('candy_purple', 'Grape candy', 'candy', C.purple, 'candy', 'purple', 'small'),
    item('candy_green', 'Apple candy', 'candy', C.green, 'candy', 'green', 'small'),
    item('hat_purple', 'Purple hat', 'witchhat', C.purple, 'hat', 'purple', 'big'),
    item('hat_black', 'Witch hat', 'witchhat', C.black, 'hat', 'black', 'big'),
    item('hat_green', 'Green hat', 'witchhat', C.green, 'hat', 'green', 'big'),
  ].map((it) => [it.id, it])
);

export const VOCAB = {
  pumpkin: ['pumpkin', 'pumpkins'],
  lantern: ['light', 'lights'],
  critter: ['critter', 'critters'],
  spooky: ['spook', 'spooks'],
  potion: ['brew', 'brews'],
  candy: ['candy', 'candies'],
  hat: ['hat', 'hats'],
  orange: ['orange thing', 'orange things'],
  purple: ['purple thing', 'purple things'],
  black: ['black thing', 'black things'],
  green: ['green thing', 'green things'],
  white: ['white thing', 'white things'],
  small: ['small thing', 'small things'],
  big: ['big thing', 'big things'],
};

export function iconFor(attr, value) {
  if (attr === 'color') return { icon: `swatch_${value}` };
  if (attr === 'size') return { text: value === 'big' ? 'Big' : 'Small' };
  return { icon: `cat_${value}`, colors: C.white };
}
