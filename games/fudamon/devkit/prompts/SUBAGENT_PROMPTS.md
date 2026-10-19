# サブエージェントへの指示文（原文）
封札モンスターズ開発で各担当に渡した指示文をそのまま保存しています。パス中の `/tmp/.../scratchpad/` は `devkit/prompts/`、`.../scratchpad/mon/` は `devkit/preview/` に読み替えてください。

## pixel-artist (1)

````text
You are a pixel artist on a game team. Read the production brief first and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_TASK.md`. Two other artists are drawing the other monsters in parallel from the same brief and kit, so match the house style precisely.

Your monsters: ids 11, 12, 14, 16, 17, 18, 19, 20.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_3.js`. Use your own scratch folder, e.g. `/tmp/claude-0/pix3/`.
Do not edit pixkit.js or any other shared file. If the kit lacks something, implement a local helper inside your own file.
````

## pixel-artist (2)

````text
You are the pixel artist extending the overworld art of a browser RPG 「封札モンスターズ」. The overworld art lives in `/home/user/my-context/games/fudamon/js/pixel.js` (global `PIX`: `drawTile(ctx,code,px,py,t,nb,tx,ty)`, `drawOverlay(...)`, `drawChar(ctx,id,dir,frame,px,py)`, `drawItem`, `drawAlert`). Read it fully first, and match its existing palette, outline and shading style exactly. Characters are 16 wide × 21 tall and placed at py-5 with a soft shadow; left-facing sprites are mirrors of right-facing ones. Tiles are 16×16, and everything is cached in offscreen canvases.

Add the following to pixel.js. Edit only this file, keep all existing codes and ids working unchanged, and don't commit.

**New character ids for drawChar** (4 directions × frames 0/1/2, walk animation like the existing ones, cute ~3-head proportions):
- `ama`: ミナモ, the valley shrine keeper. A strong young woman diver with a white headband, a white diving outfit, a blue sash and a wooden bucket at the hip.
- `yamabushi`: ゴウエン, the mountain monk. A burly man with a small black tokin cap on his forehead, a checked yuigesa (pom-pom sash) over a white robe, a shakujō staff and a big beard.
- `miko`: ヨイ, the moon shrine maiden. White haori over red hakama, long black hair tied low, a crescent-moon hair ornament, and a kagura bell.
- `hiker`: a mountain hiker trainer with a big backpack, a hat and a walking stick.
- `girl`: a girl trainer with twin tails, a sun-yellow dress and a butterfly net.
- `monk`: a young bald monk trainer in dark robes with prayer beads.

**New tile codes for drawTile** (autotile by neighbours where sensible):
- `G`: ash and volcanic ground, walkable. Warm grey-brown gravel with small dark pebbles and a faint reddish tint. Vary it by (tx,ty) so large areas don't tile visibly.
- `L`: lava, solid. Animated with at least 4 frames of slow bubbling, glowing orange cracks and a dark crust. Where it borders `G` or `.`, draw a dark cooled-rock rim.
- `Y`: hot spring water, solid. Steamy turquoise water with animated steam wisps, and a rim of smooth stones where it borders land.
- `D`: dark forest floor, walkable. Deep blue-green moss with fallen leaves and tiny glowing mushrooms here and there. It's for a night forest.
- `M`: a big mossy stone with a small glowing moon-rune carving, solid.

Quality loop: render a preview page with an example valley scene (existing tiles plus `ama`/`hiker`/`girl`), a volcano scene (G, L, Y, R, P, `"`, `yamabushi`, `monk`) and a night forest scene (D, T, `"`, M, l, `:`, `miko`). Also render a full character sheet at 3×, including the existing characters for comparison. Screenshot with Playwright (`require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')`; Chromium is preinstalled, so do not run `playwright install`). Critique the result as an art director, iterate at least twice, and check for console errors.

Reply with a summary and your final preview paths.
````

## pixel-artist (3)

````text
You are a pixel artist on a game team. Read the production brief first and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_TASK.md`. Two other artists are drawing the other monsters in parallel from the same brief and kit, so match the house style precisely.

Your monsters: ids 2, 3, 4, 6, 7, 8, 9, 13.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_2.js`. Use your own scratch folder, e.g. `/tmp/claude-0/pix2/`.
Do not edit pixkit.js or any other shared file. If the kit lacks something, implement a local helper inside your own file.
````

## pixel-artist (4)

````text
You are a pixel artist on a game team. Read the production brief first and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_TASK.md`. Two other artists are drawing the other monsters in parallel from the same brief and kit, so match the house style precisely.

Your monsters: ids 22, 23, 24, 25, 27, 28, 29, 30.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_4.js`. Use your own scratch folder, e.g. `/tmp/claude-0/pix4/`.
Do not edit pixkit.js or any other shared file. If the kit lacks something, implement a local helper inside your own file.
````

## pixel-artist (5)

````text
You are a pixel artist on a game team. Read the brief and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_EVO.md`. Two other artists are drawing the other evolved forms in parallel, so match the house style precisely.

Your sprites: ids 51–60.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_7.js`. Use your own scratch folder, `/tmp/claude-0/evo7/`.
Do not edit any other file. Put any helpers local to your own file.
````

## pixel-artist (6)

````text
You are a pixel artist on a game team. Read the brief and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_EVO.md`. Two other artists are drawing the other evolved forms in parallel, so match the house style precisely.

Your sprites: ids 41–50.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_6.js`. Use your own scratch folder, `/tmp/claude-0/evo6/`.
Do not edit any other file. Put any helpers local to your own file.
````

## pixel-artist (7)

````text
You are a pixel artist on a game team. Read the brief and follow it exactly: `games/fudamon/devkit/prompts/PIXMON_EVO.md`. Two other artists are drawing the other evolved forms in parallel, so match the house style precisely.

Your sprites: ids 31–40.
Write them to `/home/user/my-context/games/fudamon/js/pixmon_5.js`. Use your own scratch folder, `/tmp/claude-0/evo5/`.
Do not edit any other file. Put any helpers local to your own file.
````

## monster-illustrator (1)

````text
You are a monster illustrator on a game team. Read the shared brief first: `games/fudamon/devkit/prompts/ART_BRIEF.md` and follow it exactly. Two other illustrators are drawing the other monsters in parallel with the same brief, so stick closely to the shared rendering style.

Your monsters: ids 1, 2, 3, 4 (fire) and 13, 14, 15, 16 (thunder).
Write your file to `/home/user/my-context/games/fudamon/js/monart_a.js`. Do not edit any other game file and do not commit. Use your own scratch folder for previews, e.g. `/tmp/claude-0/art-a/`.
Finish by replying with the file path, one line per monster describing the design, the byte size of each, and the path of your final contact-sheet screenshot.
````

## monster-illustrator (2)

````text
You are a monster illustrator on a game team. Read the shared brief first: `games/fudamon/devkit/prompts/ART_BRIEF.md` and follow it exactly. Two other illustrators are drawing the other monsters in parallel with the same brief, so stick closely to the shared rendering style.

Your monsters: ids 17, 18, 19, 20 (dark), 21, 22, 23, 24 (light), and the two legendaries 25 (オーロラクジラ, light UR — it also flies across the sky in the ending cutscene, drawn about 30% of screen width, so it must read well as a glowing silhouette too) and 26 (クロガネオロチ, dark UR).
Write your file to `/home/user/my-context/games/fudamon/js/monart_c.js`. Do not edit any other game file and do not commit. Use your own scratch folder for previews, e.g. `/tmp/claude-0/art-c/`.
Finish by replying with the file path, one line per monster describing the design, the byte size of each, and the path of your final contact-sheet screenshot.
````

## monster-illustrator (3)

````text
You are a monster illustrator on a game team. Read the shared brief first: `games/fudamon/devkit/prompts/ART_BRIEF.md` and follow it exactly. Two other illustrators are drawing the other monsters in parallel with the same brief, so stick closely to the shared rendering style.

Your monsters: ids 5, 6, 7, 8 (water) and 9, 10, 11, 12 (grass).
Write your file to `/home/user/my-context/games/fudamon/js/monart_b.js`. Do not edit any other game file and do not commit. Use your own scratch folder for previews, e.g. `/tmp/claude-0/art-b/`.
Finish by replying with the file path, one line per monster describing the design, the byte size of each, and the path of your final contact-sheet screenshot.
````

## qa-lead (1)

````text
You are the QA lead for a browser RPG vertical slice 「封札モンスターズ」 at `/home/user/my-context/games/fudamon/index.html` (plain HTML + scripts in `js/`: data.js maps/monsters, pixel.js overworld art, audio.js synth, cards.js monster SVG/cards, engine.js world/input/render, ui.js dialogue/menus, battle.js battles, story.js NPCs/events/title/ending). It is a monster-collecting RPG where monsters are sealed into paper cards. DO NOT edit any game files — your job is to find problems and report them precisely so the lead developer can fix them. Do not commit.

Play it with Playwright + Chromium (preinstalled; `require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')`, Chromium at the default path or `/opt/pw-browsers/chromium`; do NOT run `playwright install`). Load via file:// URL. Google Fonts fail in this sandbox (cert error) — ignore that and font fallback. Use a 1100x820 viewport and also a phone viewport (390x844, isMobile/hasTouch) for layout checks.

Controls: arrows move (hold keys with keyboard.down/up for ~260ms per tile; short presses turn/step), Z confirm/talk, X menu/back, Shift run. Title → はじめから → intro text (press Z) → you start in your house. Globals you may inspect/poke for efficiency: `S` (save state: flags, cards, items, dex), `G` (runtime: scene, mapId, p {x,y,dir}, lock, npcs), `UI.stack`, `B` (battle state), functions `warp({map,x,y,dir})`, `runBattle(...)`, `startWorld()`. Prefer real inputs for the main path; teleport only to save time between distant points, and say when you did.

Intended 5–10 minute flow: talk to mom in house → exit door (bottom mats) → village; blue-roof shop at top-right of village (door at tile 20,49) → cutscene with コハル先生 and rival レン → examine the glass case (row 2) → choose a starter card → rival battle → receive 5 白の封札 + 2 回復の香 → gate north of village (kid + cat block until you have a starter) → route with tall grass (wild encounters, sealing), farmer trainer ヨシオ at (16,36) who spots you when you walk the path, merchant マツ at (21,24) with shop/card packs and a quest (seal 3 species → 2 silver cards), fisherman at (8,28), hidden item sparkles, a bridge, then shrine meadow and shrine; heal at the shrine well (7,6); guardian イワオ at (13,4) trial battle (2 monsters); win → cutscene (sky whale) → ending screen with stats → 探索をつづける.

Check thoroughly and report:
1. Blockers/crashes: page errors, soft-locks (input stops responding — watch `UI.stack` and `G.lock`), unreachable areas, NPCs standing in the only path, dialogue that never closes, battle that never ends, state not saved/loaded (reload page → つづきから).
2. Gameplay: collision mistakes (walking through houses/trees/water or blocked on paths), door/warp positions, encounter rate feel, balance (is the rival fight and guardian fight winnable with reasonable play? how many levels/battles needed?), seal rates, rewards, can the player reach the ending in ~5–10 minutes.
3. Visual QA with screenshots (look at them with the Read tool): overlapping/clipped UI, text overflow, unreadable contrast, sprite layering errors (player drawn over tree canopies / under things wrongly), things misaligned between the pixel map and the HTML overlays, battle HUD layout, menus (なかま/ずかん/どうぐ/レポート/せってい), card detail, card pack reveal, ending screen, and the phone layout with the on-screen D-pad/A/B/メニュー buttons.
4. Game feel: anything that feels unresponsive, too slow (message pacing, animations), or jarring.
5. Copy: Japanese text errors, awkward lines, inconsistent names.

Write your report to `/tmp/claude-0/qa/REPORT.md` (put screenshots in `/tmp/claude-0/qa/shots/`), ordered by severity, each item with: what happened, exact reproduction (map, tile coords, inputs), expected behaviour, and the relevant file/function if you can tell. Then reply with a concise summary of the top issues and the report path.
````

## sound-designer-composer (1)

````text
You are the sound designer/composer on a small team building an original browser RPG vertical slice called 「封札モンスターズ」 (a monster-collecting game in the spirit of classic handheld monster RPGs, 100% original; monsters are sealed into paper talisman cards). Setting: warm early-summer Japanese countryside village, a grassy route with rice paddies, and a small mystical shrine on a hill. Tone: warm, nostalgic, gently humorous, with an exciting battle feel.

Your job: write ONE self-contained plain-JavaScript file at `/home/user/my-context/games/fudamon/js/audio.js` defining a global `AUDIO`, synthesizing ALL music and sound effects in real time with the Web Audio API (no audio files, no external libraries, no copyrighted melodies — compose original tunes). Another developer is coding against the exact interface below in parallel, so match it exactly. Do NOT commit to git; don't touch other files.

## Interface
```js
window.AUDIO = {
  unlock(),            // call from a user gesture; creates/resumes the AudioContext. Safe to call many times.
  music(name),         // start looping track `name`, crossfading (~0.6s) from the current one. Calling with the currently playing name does nothing. Unknown name => stop.
  stopMusic(fade=0.5),
  sfx(name),           // one-shot sound effect
  setMuted(bool), muted, // mute everything (persisting is the engine's job)
  setVolume(musicVol, sfxVol) // 0..1, defaults ~0.5 / 0.7
};
```
Everything must no-op safely (no throws) if AudioContext is unavailable or not yet unlocked; music() called before unlock should remember the requested track and start it on unlock.

### Music tracks (all original, loopable, chiptune-inspired but rich: pulse/triangle/noise channels plus some modern touches like soft chorus/echo via delay, gentle filters; well-balanced, not harsh; tempo-accurate scheduling with a lookahead scheduler, not setInterval-per-note drift):
- `title` — hopeful, adventurous main theme (~16-bar loop)
- `village` — cozy, warm, pentatonic-flavored hometown tune, relaxed tempo
- `route` — bright walking tune, bouncy bass, a sense of setting out
- `shrine` — mysterious, calm, slightly eerie (koto-like plucks, sparse)
- `battle` — driving wild-encounter battle theme, fast, urgent bass arpeggios
- `boss` — tougher trainer/guardian battle theme, more dramatic
- `victory` — short fanfare then a loopable happy tail
- `ending` — emotional, gentle "to be continued" theme
Each should be at least ~20–40 seconds before looping so it doesn't grate.

### SFX names (all must exist):
`cursor` (menu move tick), `confirm`, `cancel`, `blip` (very short soft dialog text blip, called for every ~2 characters so it must be subtle), `step` (very quiet footstep), `grass` (rustle in tall grass), `bump` (walking into a wall), `door`, `encounter` (dramatic wild-encounter sting), `hit`, `hitSuper` (super-effective, bigger), `hitWeak`, `crit`, `faint`, `throw` (card thrown whoosh), `wobble` (tense card wobble tick), `sealOk` (triumphant sealing success jingle + paper stamp), `sealFail` (card bursts open), `levelup`, `heal`, `item` (item obtained jingle), `coin`, `flip` (card flip), `rare` (sparkly reveal for holo/gold rare cards), `stamp` (a firm seal stamp thud), `run` (escape), `save`, `menuOpen`, `whoosh` (screen transition), `swirl` (monster being sucked into card), `charge` (power-up/aura), `exclaim` (NPC spots you "!").

## Quality loop (required)
Create a test page in your scratchpad (e.g. `/tmp/claude-0/audio-test/test.html`) and use Playwright with Chromium (preinstalled; use `executablePath: '/opt/pw-browsers/chromium'` if needed; do NOT run `playwright install`) to at least: load the file, call unlock(), play every track and every sfx, and check there are no console errors or exceptions. Since you cannot listen, also render each track with an OfflineAudioContext if feasible (you may structure the synth so it can target either context) and analyse the output: check peak levels don't clip (keep peaks below ~0.9 with a master compressor/limiter), no silence where there should be music, and that loops are the intended length. Review your note data for musical sense (key, chord progressions, melody contour) like a composer would, and iterate.

Finish by replying with: file path, a one-line description of each track (key/tempo/mood), and the verification you did.
````

## pixel-art-specialist (1)

````text
You are the pixel-art specialist on a small team building an original browser RPG vertical slice called 「封札モンスターズ」 (monster-collecting game in the spirit of classic handheld monster RPGs, but 100% original; monsters are sealed into paper talisman cards). Setting: warm early-summer Japanese countryside (think rural Kagoshima: rice paddies, vegetable fields, wooden houses, a small Shinto shrine on a hill). Tone: warm, nostalgic, gently humorous.

Your job: write ONE self-contained plain-JavaScript file at `/home/user/my-context/games/fudamon/js/pixel.js` that procedurally draws ALL overworld pixel art in code (no image files, no external assets, no emoji). It defines a single global `PIX`. Another developer is writing the engine against the exact interface below in parallel, so follow the interface exactly. Do NOT commit to git. Do not touch other files.

## Interface (must match exactly)
```js
window.PIX = {
  TILE: 16,
  // Draw the ground/base of the tile whose map char is `code` with its top-left at (px,py) on ctx.
  // t = time in seconds (for animation). nb(dx,dy) returns the map char of the neighbour tile at offset (dx,dy) ('' if outside map) — use it for autotiling (shorelines, path edges, fence joins, roof edges, hedge joins, etc.).
  drawTile(ctx, code, px, py, t, nb) {},
  // Draw the part of the tile that must appear IN FRONT of characters (called after characters are drawn). Must be a no-op for tiles that have none.
  // Needed at least for '"' tall grass (front blades cover the lower ~6px of a character standing in it) and 'T' trees (canopy may overhang upward into the tile above by up to 8px; draw that overhang here so characters walking behind/above a tree row are covered).
  drawOverlay(ctx, code, px, py, t, nb) {},
  // Draw a character. (px,py) = top-left of the 16x16 tile the character stands on. Sprite is 16 wide x 20 tall: it extends 4px ABOVE the tile (feet on tile bottom). Include a soft shadow ellipse under the feet.
  // id: 'hero','sensei','rival','kid','granny','fisher','trader','guardian','mom','villager','cat'
  // dir: 'down'|'up'|'left'|'right'; frame: 0 = standing, 1 = left-foot step, 2 = right-foot step.
  drawChar(ctx, id, dir, frame, px, py) {},
  // Small sparkling item pickup (e.g. a glinting talisman on the ground), animated by t. 16x16 at (px,py).
  drawItem(ctx, px, py, t) {},
  // Speech/exclamation bubble shown above an NPC who has spotted the player: a white bubble with a red "!" drawn above (px,py) tile (occupy roughly y-18..y-4).
  drawAlert(ctx, px, py) {},
};
```
The engine renders at an internal resolution of 256x176 pixels, with `imageSmoothingEnabled = false`, then integer/CSS-scales it up with `image-rendering: pixelated`. It calls drawTile for every visible tile every frame (~16x12 tiles), then characters sorted by y, then drawOverlay for every visible tile. So performance matters: pre-render static tiles (and each animation frame of animated tiles, e.g. 4 frames) into cached offscreen canvases keyed by code + autotile variant, and blit with drawImage. Characters too: cache each (id,dir,frame) sprite.

## Tile codes (map chars) — every one must be drawn well
Outdoor ground/nature:
- `.` short grass (vary subtly by position so large areas don't look tiled — you may hash px,py to pick among 3-4 variants with little tufts/pebbles)
- `,` grass with small flowers (gentle 2–4 frame sway animation)
- `"` tall grass — encounter grass; lush, darker, with front blades in drawOverlay, subtle sway animation
- `P` dirt path (autotile soft edges where it meets grass)
- `T` tree (solid). Rich round canopy with highlights and shadow; when many T are adjacent they should read as a dense forest edge, not a grid of lollipops (autotile or overlap via overlay).
- `~` water (animated ripples/sparkles; shoreline autotile where it meets land)
- `b` wooden plank bridge over water (walkable)
- `F` wooden fence (autojoin horizontally/vertically)
- `R` boulder/rock
- `h` hedge/bush (autojoin)
- `S` wooden signpost
- `v` vegetable field rows (tilled soil with green sprouts/leafy crops) 
- `p` rice paddy (flooded field with rows of young green rice, slight water shimmer)
- `f` flower planter box
- `c` stack of wooden crates / straw bales
- `W` stone well
Buildings (multi-tile; autotile by neighbours):
- `r` red/orange tiled roof, `g` blue-grey tiled roof (roof tiles form rectangles several tiles wide/tall; draw eaves on the bottom edge, ridge on the top edge, shading on the sides using nb)
- `w` house wall (plaster/wood), `n` wall with window (warm lit window), `d` door (wooden sliding door or noren curtain), all solid except `d` which is a warp the engine handles
Shrine (on a hill at the top of the map):
- `:` stone pavement
- `I` torii gate pillar (vermilion), `J` torii top beam (vermilion with black kasagi top; spans tiles horizontally, sits above pillars — `J` tiles are in the row directly above `I` tiles and between them)
- `l` stone lantern (tōrō)
- `a` shrine roof (dark wood / copper-green), `A` shrine front (wooden hall with offering box and rope/bell)
- `O` giant sacred tree trunk with shimenawa rope (solid)
- `s` stone steps (walkable)
Interior (a talisman-master's workshop):
- `o` wooden floor, `q` interior wall (upper wall with wooden panelling), `k` bookshelf/scroll shelf, `t` low table with papers and brush, `u` rug/tatami (walkable), `y` potted plant, `z` exit doormat (walkable), `m` glass display case holding glowing cards, `x` black/void (outside the room)

## Art direction
- Modern high-quality pixel art in the lineage of GBA-era monster RPGs but more refined: cohesive limited palette (~32 colors), soft warm light from the top-left, selective dark outlines (not pure black; use deep indigo/brown), dithering sparingly, no noisy random pixels. It must look like a commercial indie game, not programmer art. No plain single-color squares.
- Characters: cute ~3-head proportions, readable silhouettes, distinct colors per character: hero (red cap + white tee + blue shorts, backpack), sensei (talisman master woman: white haori over vermilion hakama, hair bun with a paper talisman hairpin), rival (spiky dark-teal hair, orange scarf, confident), kid (straw hat, bug net... or simply straw hat + yellow tee), granny (hunched, purple kimono, grey bun), fisher (old man, wide sedge hat), trader (merchant with large backpack of scrolls, green), guardian (shrine keeper: large man in white/pale-blue priest robes with tall black hat), mom (apron, ponytail), villager (farmer with towel on head), cat (small calico cat, 4 directions).
- Walk frames must actually animate legs/arms and a 1px body bob.

## Quality loop (required)
Build a preview page in your scratchpad (e.g. `/tmp/claude-0/pix-preview/preview.html`) that loads pixel.js and draws: a sample village scene (houses with roofs/walls/windows/door, paths, fences, fields, paddies, water with bridge, trees forest edge, tall grass), a shrine scene, an interior scene, and a sheet of every character in every dir/frame, scaled 3x. Screenshot it with Playwright (Chromium is preinstalled; use `executablePath: '/opt/pw-browsers/chromium'` or the preconfigured PLAYWRIGHT_BROWSERS_PATH; do NOT run `playwright install`). Look at the screenshots with the Read tool, critique them like an art director, and iterate until it genuinely looks polished and cohesive (at least 2-3 iterations). Also check there are no console errors.

Finish by replying with: the file path, a short summary of the look, any tile codes where you made interpretation choices, and the path of your final preview screenshot.
````
