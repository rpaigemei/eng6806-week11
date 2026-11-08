// Halloween levels — rooms 6-10. Pure data, same conventions as winter/levels.js.
// Every level has exactly one solution and can be solved by reasoning alone.
import { R } from '../../engine/rules.js';

const { is, oneOf, not, countAtMost, countAtLeast, allDifferent, allSame, noAdjacent } = R;

export const LEVELS = [
  {
    // Warm-up chain: only two white things -> sill. The lone hat can't pair up in
    // "Same kind" and the railing says "No hats", so it takes the steps, which
    // makes the steps all big (cat + cauldron). Potions pair; bat + candy remain.
    id: 'halloween-1',
    title: 'Front Porch',
    backdrop: 'porch',
    cover: 'lantern_orange',
    intro:
      'Welcome to Halloween! Same tags, new decorations. Find the spot that only a few things can fill, and follow the chain from there.',
    items: ['potion_orange', 'cat', 'bat_black', 'pumpkin_white', 'hat_green', 'candy_green', 'ghost', 'cauldron', 'potion_purple'],
    slots: [
      { id: 'sill', name: 'Window sill', x: 37, y: 52, capacity: 2, style: 'none', rules: [is('color', 'white')] },
      { id: 'door', name: 'By the door', x: 96, y: 88, capacity: 2, style: 'none', rules: [allSame('category')] },
      { id: 'rail', name: 'Railing', x: 252, y: 64, capacity: 2, style: 'none', rules: [not(is('category', 'hat'))] },
      { id: 'steps', name: 'Steps', x: 140, y: 106, capacity: 3, style: 'none', rules: [allSame('size')], tag: { x: 166, y: 92, align: 'center' } },
    ],
  },
  {
    // Tied pairs debut. Critters fill the hay bale. Big things must use the fence
    // or the vines; Mixed vines take at most one white, so the fence is the three
    // whites. The mini pumpkin can't join the vines, because its tied green
    // partner would have to come too.
    id: 'halloween-2',
    title: 'Pumpkin Patch',
    backdrop: 'patch',
    cover: 'pumpkin_orange',
    intro:
      'New: ribbons! Two tied things must share a spot. If one of them can\'t go somewhere, neither can the other.',
    // tied items sit side by side in the pile so their ribbon is easy to see
    items: ['spider_black', 'ghost', 'pumpkin_mini', 'pumpkin_green', 'hat_green', 'candy_green', 'bat_purple', 'potion_orange', 'pumpkin_white', 'cauldron', 'candle_bone', 'spider_green'],
    pairs: [['pumpkin_mini', 'pumpkin_green']],
    slots: [
      { id: 'vines', name: 'Vine patch', x: 24, y: 96, capacity: 3, style: 'none', rules: [R.allDifferent('color')] },
      { id: 'hay', name: 'Hay bale', x: 100, y: 74, capacity: 3, style: 'none', rules: [R.is('category', 'critter')] },
      { id: 'barrow', name: 'Wheelbarrow', x: 180, y: 88, capacity: 3, style: 'none', rules: [R.is('size', 'small')] },
      { id: 'fence', name: 'Fence', x: 252, y: 50, capacity: 3, style: 'none', rules: [R.allSame('color')] },
    ],
  },
  {
    // The only candy must sit in the crates; only the cat and green hat are big
    // and black/green, so they take the window. The purple hat has nowhere else
    // to go but the crates. Case split: if the shelf weren't the three lights,
    // the purple candle would also need the crates, stranding the purple potion.
    id: 'halloween-3',
    title: 'Dusty Attic',
    backdrop: 'attic',
    cover: 'spider_black',
    intro:
      'Five spots now, and some could take several groups. When you get stuck, try "what if?": if this spot held that group, would everything else still fit?',
    items: ['spider_green', 'hat_purple', 'pumpkin_white', 'candle_bone', 'potion_orange', 'cat', 'candy_green', 'candle_purple', 'spider_black', 'lantern_orange', 'potion_purple', 'hat_green', 'pumpkin_green'],
    slots: [
      { id: 'trunk', name: 'Old trunk', x: 18, y: 90, capacity: 3, style: 'none', rules: [not(is('color', 'white')), not(is('color', 'purple'))] },
      { id: 'window', name: 'Round window', x: 143, y: 29, capacity: 2, style: 'none', rules: [oneOf('color', ['black', 'green']), is('size', 'big')], tag: { x: 160, y: 14, align: 'center' } },
      { id: 'shelf', name: 'High shelf', x: 232, y: 40, capacity: 3, style: 'none', rules: [allSame('category')], tag: { x: 258, y: 59, align: 'center' } },
      { id: 'chair', name: 'Rocking chair', x: 134, y: 88, capacity: 2, style: 'none', rules: [not(is('color', 'purple')), allSame('category')] },
      { id: 'crates', name: 'Crates', x: 236, y: 90, capacity: 3, style: 'none', rules: [countAtLeast('category', 'candy', 1)] },
    ],
  },
  {
    // Only candies fit the high shelf, only critters the low one. The three
    // lights are the only trio for "Same kind". Two hats remain but the hearth
    // takes at most one, so one hat must find a same-color partner on the sill.
    id: 'halloween-4',
    title: "Witch's Kitchen",
    backdrop: 'kitchen',
    cover: 'cauldron',
    intro:
      'Watch the Max tag on the hearth: if two of something are left over, where can the second one go? "What if?" is your friend here too.',
    items: ['hat_black', 'candy_purple', 'lantern_orange', 'pumpkin_green', 'spider_green', 'candle_orange', 'potion_purple', 'hat_green', 'candy_green', 'pumpkin_purple', 'bat_black', 'candle_bone'],
    slots: [
      { id: 'high', name: 'High shelf', x: 24, y: 28, capacity: 2, style: 'none', rules: [oneOf('category', ['candy', 'spooky'])] },
      { id: 'low', name: 'Low shelf', x: 80, y: 54, capacity: 2, style: 'none', rules: [is('category', 'critter')], tag: { x: 97, y: 75, align: 'center' } },
      { id: 'counter', name: 'Counter', x: 18, y: 81, capacity: 3, style: 'none', rules: [allSame('category')] },
      { id: 'sill', name: 'Window sill', x: 247, y: 37, capacity: 2, style: 'none', rules: [allSame('color')], tag: { x: 243, y: 40, align: 'right' } },
      { id: 'hearth', name: 'Hearth', x: 228, y: 91, capacity: 3, style: 'none', rules: [countAtMost('category', 'hat', 1)] },
    ],
  },
  {
    // The finale. The skull is the only spook. The white pumpkin and green
    // spider are the only things of their colors, so neither can join a
    // same-color mantel: they split between the side table and the chaise.
    // Count the trios (three purples, four blacks, four oranges, four lights,
    // three pumpkins, three critters) and test "what if?" on the side table.
    // Finish by spacing the chaise so no neighbors share a color.
    id: 'halloween-5',
    title: 'Haunted Parlor',
    backdrop: 'parlor',
    cover: 'ghost',
    intro:
      'The grand finale! Count how many of each color and kind you have: some only come in threes. Then ask "what if?" Drag within the chaise to space out its colors.',
    items: ['candle_purple', 'cat', 'pumpkin_white', 'lantern_orange', 'bat_purple', 'candy_orange', 'skull', 'hat_black', 'pumpkin_orange', 'spider_green', 'candle_black', 'cauldron', 'pumpkin_purple', 'candle_orange'],
    slots: [
      { id: 'top', name: 'Above the mantel', x: 152, y: 10, capacity: 1, style: 'none', rules: [is('category', 'spooky')], tag: { x: 172, y: 13, align: 'left' } },
      { id: 'left', name: 'Mantel, left', x: 96, y: 40, capacity: 3, style: 'none', rules: [allSame('color')], tag: { x: 92, y: 44, align: 'right' } },
      { id: 'right', name: 'Mantel, right', x: 172, y: 40, capacity: 3, style: 'none', rules: [allSame('color'), not(is('category', 'lantern'))], tag: { x: 228, y: 44, align: 'left' } },
      { id: 'table', name: 'Side table', x: 18, y: 69, capacity: 3, style: 'none', rules: [allSame('category')], tag: { x: 44, y: 94, align: 'center' } },
      { id: 'chaise', name: 'Chaise', x: 238, y: 88, capacity: 4, style: 'none', rules: [noAdjacent('color'), countAtMost('category', 'critter', 1)] },
    ],
  },
];
