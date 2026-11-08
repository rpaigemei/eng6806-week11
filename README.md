# Cozy Holiday Tidy-Up

A cozy pixel-art sorting puzzle for the web. The holiday decorations got jumbled. Drag each one from the pile to a spot whose tag it matches, press **Done**, and enjoy the room once it's tidy. There are no timers and no fail states.

- **Two holidays, 10 rooms:**
  - **Winter** (rooms 1–5): Storage Boxes, Trim the Tree, The Mantel, Gift Table, The Grand Tree
  - **Halloween** (rooms 6–10): Front Porch, Pumpkin Patch, Witch's Kitchen, Dusty Attic, Haunted Parlor. Halloween unlocks once every Winter room is tidy, and it keeps climbing in difficulty.
- **A holiday-neutral start page:** a cozy storage room whose window drifts through each holiday's season, with one storage box per holiday. Click a box to jump into that holiday.
- **Each holiday has its own original music-box tune**, and the start page has a lighter neutral one.
- **Rule tags** that build on each other room by room:
  - color, kind and size icons, plus `NO …`
  - `MIXED` (no two alike)
  - `MIN 1` (needs at least one)
  - `SAME` (all alike)
  - `MAX 1`
  - `APART` (neighbors can't match, so order matters)
- **Every room has exactly one solution** and can be solved by reasoning alone, with no guessing. A test checks this.
- **Twists:**
  - **frozen items** start already placed and can't move, like Sudoku's given numbers (introduced in the Gift Table)
  - **tied pairs** are two items joined by a ribbon that must share a spot (introduced in the Pumpkin Patch)
- **Rooms come alive:** items squash-and-pop into place with their own little sounds (bells jingle, critters squeak, pumpkins thunk). Each filled spot wakes the room up a bit more: lights switch on and the fire grows. This happens whether the placement is right or wrong, so it never gives answers away. Solving plays a spot-by-spot finale.
- **Stars:** 3 per room, for solving, solving without hints, and getting it right on your first Done.
- **Keepsake album:** every decoration you tidy goes into an album with its own short story.
- **Bonus rooms:** each holiday has an extra-hard bonus room that unlocks with 12 of its 15 stars.
- **Restart progress:** a button on the start page (after a confirmation) erases stars, album and unlocks but keeps your settings.
- **Tiered hints:** press once to see where to look, again for which rule matters, and a third time for the exact move.
- **A guided first room** walks new players through their first drag, reading a tag, and pressing Done.
- **Color-blind friendly:**
  - every color has its own symbol on the tags (heart = red, tree = green, drop = blue, star = gold, circle = orange, diamond = purple, ring = white, cross = black, square = brown)
  - the **Color assist** toggle (palette button, top right) shows that symbol on every item too
- **Clear labels:** every tag hangs from its spot on a little string, and hovering a tag outlines its spot.
- **Decorate mode** opens once a room is solved, so you can place things anywhere
- **Progress, music and sound settings are saved** in your browser (`localStorage` only, nothing is sent anywhere)
- Works with a **mouse or touch**, with crisp pixel scaling on phones
- Pixel art with **easy-to-read pixel text**: all text uses [VT323](https://fonts.google.com/specimen/VT323), a retro terminal-style font that matches the art and stays readable.
- All art and the music are drawn or generated in code. There are no external libraries, CDNs or trackers.

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

### Tag layout

```bash
npm run test:layout
```

This loads every room in headless Chromium (it needs Playwright) and checks that each tag is closer to its own spot than to any other, doesn't overlap other spots or tags, and stays on screen.

### Level difficulty

```bash
node tools/levelstats.js
```

This prints each level's number of solutions (aim for 1), plus three difficulty measures:

- **ambiguous:** how many items fit more than one tag
- **naive:** how much a player who only looks for "this has one spot" can place
- **fair:** how much a careful reasoner can place without guessing (must be 100%)
- **difficulty:** depth + 2 × "what if?" steps. A test checks that it never dips within a holiday.

## Deploy to GitHub Pages

1. Merge to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick `main` with the `/ (root)` folder.
3. The game is served from `index.html` at the repo root. No Actions workflow is needed.

## Project layout

```
index.html               canvas + boot
assets/fonts/            bundled VT323 font (OFL)
src/main.js              scaling, input, scene switching, game loop
src/engine/              rules.js (rule predicates + text), level.js (state, solver, hints)
src/render/              palette, sprite grids, text, scenery pieces, slot tags
src/scenes/              title, level select, puzzle, decorate
src/themes/winter/       item catalog, levels (pure data), room backdrops
src/audio.js             synthesized sound effects + original music-box waltz
src/save.js              guarded localStorage save
tests/                   node:test suites
tools/levelstats.js      difficulty report for level design
```

## Adding a new holiday

Themes are data: Winter and Halloween use exactly the same engine. Copy `src/themes/halloween/` to e.g. `src/themes/spring/`, then:

1. Define items in `catalog.js`. Each item has a sprite template, colorway, and `tags` (`category`, `color`, `size`, or any new attribute).
2. Write levels in `levels.js` using the rule helpers in `src/engine/rules.js`. A level can also have:
   - `pinned: { itemId: spotId }` for frozen items
   - `pairs: [[itemA, itemB]]` for tied items (put tied items next to each other in `items` so they start side by side)
   - a bonus room exported as `BONUS` and set as `theme.bonus`
   - a `story` line for every catalog item, for the album

   The rule helpers are:
   - simple tags: `R.is`, `R.oneOf`, `R.not`, `R.all`, `R.any`
   - group tags: `R.countAtMost`, `R.countAtLeast`, `R.allDifferent`, `R.allSame`, `R.noAdjacent`
3. Draw rooms in `backdrops.js` with the helpers in `src/render/scenery.js`. Also export a `windowScene()` for the start page's window.
4. In `theme.js`, set:
   - a `song` (add an original waltz to `src/songs.js`)
   - a `selectBackdrop`
   - a `box` (label, peeking item and colors) for the start page's shelf
5. Register the theme in `src/themes/index.js`. It unlocks after the holiday before it, and its rooms are numbered after that holiday's.

The tests then check automatically that the new levels have exactly one solution, can be solved fairly and ramp up in difficulty (add targets for the new holiday to `RAMP` in `tests/levels.test.js`), and that the theme has all its start-page pieces. `tools/levelstats.js` helps you tune difficulty.

## License

- **Code, art and music:** MIT. See [LICENSE](LICENSE). This is an original game: all code, art and music in this repository were made for it.
- **Font:** VT323, © 2011 The VT323 Project Authors, used under the SIL Open Font License 1.1. The font files and their license are bundled in [`assets/fonts/`](assets/fonts/) (see [`OFL.txt`](assets/fonts/OFL.txt)).
