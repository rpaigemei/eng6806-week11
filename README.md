# Cozy Holiday Tidy-Up

A cozy pixel-art sorting puzzle for the web. The holiday decorations got jumbled. Drag each one from the pile to a spot whose tag it matches, press **DONE**, and enjoy the room once it's tidy. There are no timers and no fail states.

- **5 winter rooms**: Storage Boxes, Trim the Tree, The Mantel, Gift Table, The Grand Tree
- **Rule tags** combine colors, kinds and sizes, plus `NO …` and `MAX n` rules
- **Hints** point at an item that's in the wrong spot, or one that fits somewhere useful
- **Decorate mode** opens once a room is solved, so you can place things anywhere
- **Progress, music and sound settings are saved** in your browser (`localStorage` only, nothing is sent anywhere)
- Works with a **mouse or touch**, with crisp pixel scaling on phones
- All art, the font and the music are drawn or generated in code. There are no external assets or libraries.

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

The tests use Node's built-in test runner (Node 18+, no dependencies). They cover the rule engine and check that every level is valid and solvable, that following the hints solves each level, and that all sprite grids are well formed.

## Deploy to GitHub Pages

1. Merge to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick `main` with the `/ (root)` folder.
3. The game is served from `index.html` at the repo root. No Actions workflow is needed.

## Project layout

```
index.html               canvas + boot
src/main.js              scaling, input, scene switching, game loop
src/engine/              rules.js (rule predicates + text), level.js (state, solver, hints)
src/render/              palette, sprite grids, pixel font, scenery pieces, slot tags
src/scenes/              title, level select, puzzle, decorate
src/themes/winter/       item catalog, levels (pure data), room backdrops
src/audio.js             synthesized sound effects + original music-box waltz
src/save.js              guarded localStorage save
tests/                   node:test suites
```

## Adding a new holiday

Themes are data. Copy `src/themes/winter/` to e.g. `src/themes/spooky/`, then:

1. Define items in `catalog.js`. Each item has a sprite template, colorway, and `tags` (`category`, `color`, `size`, or any new attribute).
2. Write levels in `levels.js` using the rule helpers `R.is`, `R.oneOf`, `R.not`, `R.all`, `R.any`, and `R.countAtMost`.
3. Draw rooms in `backdrops.js` with the helpers in `src/render/scenery.js`.
4. Register the theme in `src/themes/index.js`.

The tests then check automatically that the new levels can be solved.

## License

MIT. See [LICENSE](LICENSE). This is an original game: all code, art and music in this repository were made for it.
