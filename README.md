# Cozy Holiday Tidy-Up

A cozy pixel-art sorting puzzle for the web. The holiday decorations got jumbled. Drag each one from the pile to a spot whose tag it matches, press **DONE**, and enjoy the room once it's tidy. There are no timers and no fail states.

- **5 winter rooms**: Storage Boxes, Trim the Tree, The Mantel, Gift Table, The Grand Tree
- **Rule tags** that build on each other room by room:
  - color, kind and size icons, plus `NO …`
  - `MIXED` (no two alike)
  - `MIN 1` (needs at least one)
  - `SAME` (all alike)
  - `MAX 1`
  - `APART` (neighbors can't match, so order matters)
- **Every room has exactly one solution** and can be solved by reasoning alone, with no guessing. A test checks this.
- **Hints** point at an item that's in the wrong spot, or one that fits somewhere useful
- **Decorate mode** opens once a room is solved, so you can place things anywhere
- **Progress, music and sound settings are saved** in your browser (`localStorage` only, nothing is sent anywhere)
- Works with a **mouse or touch**, with crisp pixel scaling on phones
- Pixel art with **easy-to-read text**: clues, tags and descriptions use [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), a font designed for legibility. Big titles keep the pixel font.
- All art, the pixel title font and the music are drawn or generated in code. There are no external libraries, CDNs or trackers.

## Play locally

The game is plain HTML and ES modules, with no build step.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. ES modules don't load from `file://`, so serve the folder over HTTP.

## Tests

```bash
npm test
```

The tests use Node's built-in test runner (Node 18+, no dependencies). They check that:

- the rule engine works
- every level has exactly one solution and can be solved by deduction alone
- difficulty ramps up across the rooms
- following the hints solves each level from scrambled starting states
- all sprite grids are well formed

### Level difficulty

```bash
node tools/levelstats.js
```

This prints each level's number of solutions (aim for 1), plus three difficulty measures:

- **ambiguous:** how many items fit more than one tag
- **naive:** how much a player who only looks for "this has one spot" can place
- **fair:** how much a careful reasoner can place without guessing (must be 100%)

## Deploy to GitHub Pages

1. Merge to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick `main` with the `/ (root)` folder.
3. The game is served from `index.html` at the repo root. No Actions workflow is needed.

## Project layout

```
index.html               canvas + boot
assets/fonts/            bundled reading font (OFL)
src/main.js              scaling, input, scene switching, game loop
src/engine/              rules.js (rule predicates + text), level.js (state, solver, hints)
src/render/              palette, sprite grids, pixel font, scenery pieces, slot tags
src/scenes/              title, level select, puzzle, decorate
src/themes/winter/       item catalog, levels (pure data), room backdrops
src/audio.js             synthesized sound effects + original music-box waltz
src/save.js              guarded localStorage save
tests/                   node:test suites
tools/levelstats.js      difficulty report for level design
```

## Adding a new holiday

Themes are data. Copy `src/themes/winter/` to e.g. `src/themes/spooky/`, then:

1. Define items in `catalog.js`. Each item has a sprite template, colorway, and `tags` (`category`, `color`, `size`, or any new attribute).
2. Write levels in `levels.js` using the rule helpers in `src/engine/rules.js`:
   - simple tags: `R.is`, `R.oneOf`, `R.not`, `R.all`, `R.any`
   - group tags: `R.countAtMost`, `R.countAtLeast`, `R.allDifferent`, `R.allSame`, `R.noAdjacent`
3. Draw rooms in `backdrops.js` with the helpers in `src/render/scenery.js`.
4. Register the theme in `src/themes/index.js`.

The tests then check automatically that the new levels have exactly one solution and can be solved fairly. `tools/levelstats.js` helps you tune difficulty.

## License

- **Code, art and music:** MIT. See [LICENSE](LICENSE). This is an original game: all code, art and music in this repository were made for it.
- **Reading font:** Atkinson Hyperlegible, © 2020 Braille Institute of America, Inc., used under the SIL Open Font License 1.1. The font files and their license are bundled in [`assets/fonts/`](assets/fonts/) (see [`OFL.txt`](assets/fonts/OFL.txt)).
