// Halloween decorations. Same shape as the winter catalog: `tpl` names a sprite
// template in render/spriteData.js, `colors` recolors its placeholder digits.
import { COLORWAYS as C } from '../../render/spriteData.js';

const item = (id, name, tpl, colors, category, color, size) => ({
  id,
  name,
  tpl,
  colors,
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
