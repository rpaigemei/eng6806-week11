import { PAL } from '../../render/palette.js';
import { CATALOG, VOCAB, iconFor } from './catalog.js';
import { LEVELS, BONUS } from './levels.js';
import { BACKDROPS, windowScene } from './backdrops.js';
import { WINTER_SONG } from '../../songs.js';

export const WINTER = {
  id: 'winter',
  name: 'Winter',
  tagline: 'Snow outside, cocoa inside.',
  catalog: CATALOG,
  vocab: VOCAB,
  iconFor,
  levels: LEVELS,
  // extra-hard room, unlocked with stars (not needed to open the next holiday)
  bonus: BONUS,
  backdrops: BACKDROPS,
  selectBackdrop: 'mantel',
  // finale confetti
  confetti: [PAL.w, PAL.c, PAL.y],
  song: WINTER_SONG,
  windowScene: windowScene(),
  // storage box on the title-screen shelf
  box: { label: 'Winter', peek: 'orn_red', tint: '#c9925e', ribbon: '#d64550' },
};
