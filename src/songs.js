// Original music-box waltzes (3/4), as data. Each bar is [chord, [beat1, beat2, beat3]]
// melody notes in MIDI (null = rest). `bass: false` gives a lighter arrangement.

const MAJOR = {
  C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50], Em: [40, 43, 47], Dm: [38, 41, 45],
  Bb: [46, 50, 53], Gm: [43, 46, 50],
};

/** Winter: the original gentle waltz in C. */
export const WINTER_SONG = {
  bpm: 92,
  chords: MAJOR,
  bars: [
    ['C', [76, 79, 84]], ['Am', [83, 81, 76]], ['F', [77, 81, 84]], ['G', [83, null, 79]],
    ['C', [76, 79, 84]], ['Em', [83, 79, 76]], ['F', [77, 76, 74]], ['G', [74, null, 71]],
    ['Am', [72, 76, 81]], ['F', [81, 79, 77]], ['Dm', [77, 74, 77]], ['G', [79, null, 74]],
    ['C', [76, 74, 72]], ['F', [77, 76, 74]], ['G', [71, 74, 79]], ['C', [72, null, null]],
  ],
};

/** Halloween: a tiptoeing waltz in A minor with a sly raised seventh. */
export const HALLOWEEN_SONG = {
  bpm: 100,
  chords: {
    Am: [45, 48, 52], Dm: [38, 41, 45], E: [40, 44, 47], F: [41, 45, 48], C: [48, 52, 55], G: [43, 47, 50],
  },
  bars: [
    ['Am', [76, 72, 69]], ['E', [68, null, 71]], ['Am', [72, 76, 81]], ['E', [80, null, 76]],
    ['Dm', [77, 74, 69]], ['Am', [72, 69, 76]], ['E', [71, 68, 64]], ['E', [68, null, null]],
    ['F', [72, 77, 81]], ['C', [79, 76, 72]], ['Dm', [74, 77, 81]], ['E', [80, null, 83]],
    ['Am', [81, 76, 72]], ['Dm', [74, 77, 74]], ['E', [71, 68, 71]], ['Am', [69, null, null]],
  ],
};

/** Title screen: a light, holiday-neutral tune in F, no heavy bass. */
export const TITLE_SONG = {
  bpm: 96,
  bass: false,
  chords: MAJOR,
  bars: [
    ['F', [72, 77, 81]], ['C', [79, 76, 72]], ['Dm', [74, 77, 81]], ['Bb', [82, null, 77]],
    ['F', [81, 79, 77]], ['Gm', [79, 82, 79]], ['C', [76, 79, 72]], ['C', [76, null, null]],
    ['Bb', [74, 77, 82]], ['F', [81, 77, 72]], ['Gm', [74, 79, 82]], ['C', [84, null, 79]],
    ['F', [77, 81, 84]], ['Bb', [82, 77, 74]], ['C', [72, 76, 79]], ['F', [77, null, null]],
  ],
};
