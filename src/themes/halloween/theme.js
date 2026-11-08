import { PAL } from '../../render/palette.js';
import { CATALOG, VOCAB, iconFor } from './catalog.js';
import { LEVELS, BONUS } from './levels.js';
import { BACKDROPS, windowScene } from './backdrops.js';
import { HALLOWEEN_SONG } from '../../songs.js';

export const HALLOWEEN = {
  id: 'halloween',
  name: 'Halloween',
  tagline: 'Leaves falling, candles flickering.',
  catalog: CATALOG,
  vocab: VOCAB,
  iconFor,
  levels: LEVELS,
  // extra-hard room, unlocked with stars (not needed to open the next holiday)
  bonus: BONUS,
  backdrops: BACKDROPS,
  selectBackdrop: 'parlor',
  // finale confetti
  confetti: [PAL.a, PAL.A, PAL.y, PAL.v],
  song: HALLOWEEN_SONG,
  windowScene: windowScene(),
  box: { label: 'Halloween', peek: 'pumpkin_mini', tint: '#7b4fa0', ribbon: '#e8823a' },
};
