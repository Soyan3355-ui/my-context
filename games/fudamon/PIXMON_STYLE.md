# 封札モンスターズ: monster pixel-art style guide (definitive)

Every monster is an **80×80 front-facing battle sprite, rendered at SFC-official density**, drawn in code with `PIXKIT` (`js/pixkit.js`).
The six reference monsters are in `js/pixmon_1.js` (IDs 1, 4, 8, 12, 17 and 22). **Read that file alongside this one**; it is the living example of every rule below.

---

## 0. The hard rule: match the style, never the designs

The client's taste is the **Super Famicom-era Dragon Quest monster sprites** and the official DQ monster illustrations. We take their *sensibility* only.

- **Never** draw anything recognisable as an existing Dragon Quest monster. That means no slimes or droplet blobs with a smile, no crowned slime king, no bat-dragons in the style of the classic small purple one, and so on.
- The same goes for any other franchise.
- All 54 creatures and their concepts are ours (see `js/data.js`: names, types and flavour text).
- If a design starts to look like a famous monster, change the silhouette, not just the colour.

**References.** Open them with an image viewer or the Read tool:

| File | What it is |
|---|---|
| `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/2.png` | SFC DQ monster sprite sheet (bosses and demons) |
| `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/3.png` | SFC DQ monster sprite sheet (mixed) |
| `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/4.png` | SFC DQ monster sprite sheet (plants and beasts) |
| `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/5.webp` | Official illustration encyclopedia cover (charm and personality) |
| `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/1.webp` | Older mobile-RPG ad reference (secondary; only its accessory detail still applies) |

---

## 0b. Quality bar (art-director rules, mandatory)

1. **Detail density.** Almost every pixel carries information. Fill forms with texture and plane changes instead of flat fills:
   - Use `k.texture(part, 'scales'|'fur'|'bark'|'stone'|'feather'|'cloth')` on every large part.
   - Add hand passes for muscles, knuckles, tooth rows, claw tips and cloth folds.
2. **Shading.** Use 7-tone hue-shifted ramps. Let the kit's form shading do the base (5 body tones, checker-dithered transitions, reflected light on shadow rims, specular dots). Then **hand-shade along the anatomy** with `adj`/`set` passes.
3. **Eyes are small and intense.** The default is `k.eye(x, y, {w:5, h:4, iris, side, angry})` (glare): a heavy lid, a coloured iris, a dark pupil and a 1px glint, with brows. Carry the comedy in mouths, tongues and poses.
   - Big bulging eyes are for **one or two gag monsters in the whole game** (ミズチ, 8, has one of those slots).
4. **Irregular silhouettes.** Roughen outlines with `k.tufts()` (fur fringes, ragged hems, manes, mossy drips), spikes, claws and props. No smooth blobs; no body that is just a rounded rectangle.
5. **Palette.** Saturated accents (red, gold, cyan, magenta) next to earthy midtones. No washed-out pastel monsters. Give white or pale creatures a saturated accessory; ホシウサ (22), for example, wears a red bandana.
6. **Size.** Creatures are 40–60px tall. SR/UR go up to about 72. Canvas 80×80.
7. **Compare honestly.** Always compare against the references at the **same integer scale** (both at 2×, then both at 4×, with the reference crops upscaled nearest-neighbour). See section 8.

## 1. The look in one paragraph

A chunky, top-heavy creature **faces the player head-on** in a battle pose. It has **big bulging eyes with tiny pupils** or **menacing slit eyes**, and a **huge mouth**: a grin, a snarl, a lolling tongue, snaggle teeth, tusks.
Everything is wrapped in a **crisp near-black 1px outline** and painted in **few, saturated, hue-shifted colours**: purple or blue shadows, warm yellow highlights. Shading is simple and confident.
**Each monster is one clear idea plus one gag.** Examples: a fox whose tail is a bonfire and who can't keep its tongue in; a ghost with a jiangshi talisman slapped on its hood; an old stag lord chewing a sprig with a chick nesting in his antlers.

## 2. Pose and composition

| Rule | Value |
|---|---|
| Canvas | 80×80, transparent (`PIXKIT.W`/`PIXKIT.H`) |
| Facing | **Front-facing** (straight on, or a slight 3/4), confronting the player. The battle screen mirrors the player's side, so keep designs roughly symmetric or fine when mirrored. Use `k.sym(48, fn)`. |
| Centre line | x = 40 |
| Feet | Resting on y ≈ 74–76 |
| Ground shadow | `k.shadow(40, 76.5, rx, 1.8–2.4)` on every monster; floaters get a small one |
| Margins | Keep at least 1px free at the canvas edges (the outline must fit) |

**Height by rarity** (top of the silhouette to the feet; ignore glow and sparkles):

| Rarity | Height | Feel |
|---|---|---|
| C | 40–50px | A compact scrapper: head ≥ 40% of its height |
| R | 46–58px | Sturdier, with one prop or ornament |
| SR | 58–72px | Imposing: spread wings, antler crown, a big maw, 2–3 features |
| UR | up to ~76px | Legendary: nearly fills the canvas, crown or aura, the richest detail, still charming |

**Proportions:**
- Chunky, stocky and **top-heavy**: big head, big hands or claws, stubby legs with fat feet.
- Arms are often raised in a threat or "boo!" pose.
- Props are welcome when they fit the concept: club, drum, lantern, staff, shield, talisman, bell.

## 3. Faces: personality and gag

- **Eyes.** Small and intense by default:
  - `k.eye(x, y, {w:5–7, h:4–5, iris:'thunder'|'red'|'leaf'|'violet', side:'L'|'R', angry:0..2, lid:0.3..0.6, brow, browMat, browTone})` draws a glare.
    - `angry` lowers the lid on the inner side.
    - `lid:0.55` gives a grumpy half-lid.
    - `brow:false` removes the brow when the head already has a brow ridge.
  - `{style:'slit', iris}` gives a slit-pupil eye.
  - `{style:'bulge', pupil:1}` is for gag monsters only (see the quality bar).
  - Glowing void eyes (ghosts) are drawn as shapes with `shade:'glow', halo`.
- Glare pupils sit centred (`look:[dx,dy]` shifts them); the glint is placed automatically.
- **Mouths are big.**
  - Use `k.mouth([[x,y],…], {tongue})` with a polygon, usually wide and lopsided.
  - Add **individual teeth** with `k.tooth(x0, y0, x1, y1, w)`: upper teeth point down, lower fangs or tusks point up.
  - Snaggle teeth, buck teeth, a lolling tongue (a `skin` or `sakura` ellipse or tube over the lip) and fat lips are all encouraged.
- **Noses and snouts.** A distinct dark nose blob, nostrils as ink pixels, and a muzzle as its own part.
- **One gag per monster.** It should be visible at 1×: a lolling tongue, a floppy ear, an object on the head, something being chewed, a stuck-on talisman, and so on.

## 4. Colour, outline and shading

- **Outline.** A 1px outline goes round the whole silhouette automatically. It is near-black on the shadow side, and a dark tint of the local colour on lit top and left edges (`outline:'black'` forces black). Where one part overlaps a part of a *different material*, the kit draws a **black seam** between them. Same-material overlaps get a softer one-tone step.
- **Ramps.** **7 tones** each: 0 deepest, 1–2 shadows, 3 base, 4–5 lights, 6 highlight or specular. Fixed-tone arguments (`tone`, `flatTone`, `px` tones, `set`) use 0–6. They are **hue-shifted**: shadows lean purple or blue, highlights lean warm yellow.
  - Type ramps: `fire`, `flame` (glowing), `magma`, `water`, `aqua`, `ice`, `grass`, `leaf`, `thunder`, `dark`, `shadow` (void cloth), `violet` (magic), `light`, `crystal`, `sakura`.
  - Neutrals: `fur`, `tan`, `cream`, `bone`, `steel`, `stone`, `obsidian`, `skin` (tongues, noses, inner ears), `gold`, `white`, `black`, `red`, `wood`, `mouth`.
- **Colour budget.** One dominant ramp, one secondary and one accent (glow, gold or type colour) per monster. It must read as its type at a glance.
- **Automatic form shading** (`shade:'form'`, the default):
  - Dome normals from each part's shape, lit from the upper left, quantised to tones 1–5.
  - Checker dither where two tones meet (`dither:false` to disable).
  - Reflected light on the shadowed lower-right rim (`reflect:false`).
  - A specular tone-6 dot on the hot spot of larger parts (`spec:false`).
  - `light:±0.2` biases a part lighter or darker; `shift:±1` offsets its tones.

  Other options:
  - `shade:'glow'` for flames, wisps and glowing eyes.
  - `shade:'flat'` + `flatTone` for crisp graphic shapes (teeth, crystals, paper).
- **Hand-shading passes.** SFC sprites have deliberate clusters. Add them by calling any shape with `adj` or `set`. These modify the tones of pixels already painted instead of painting colour:
  ```js
  k.tube([[40,68,1],[39,78,1],[38,84,1]], null, { adj: -1, clip: 'cloak' });   // cloth fold groove
  k.tube([[38,68,.6],[37,78,.6]],       null, { adj: +1, clip: 'cloak' });   // lit edge of the fold
  k.rect(36, y, 24, 1, 'fire', { adj: -2, clip: 'body' });                   // belly plate lines (fire pixels only)
  k.poly([...], null, { set: 4, clip: 'horn' });                              // a crisp facet
  k.ellipse(48, 70, 10, 8, null, { adj: -1, clip: 'body', pattern: 'checker' }); // small dither texture
  ```
  `pattern:'checker'` or `'sparse'` gives a light dither. **Use dithering only for texture** (fur, stone, moss), never as a gradient.
- **No stray pixels.** The kit merges lone shaded pixels automatically. Your ink `px` should be deliberate.

## 5. Kit API reference (`k`)

Register a monster under its numeric `id` from `data.js`:
```js
(function () {
  var P = window.PIXMON = window.PIXMON || {};
  P[23] = function (k) {                       // draw back to front
    k.shadow(40, 76.5, 15, 2);
    k.ellipse(40, 63, 11, 10, 'thunder', { part: 'body' });
    k.texture('body', 'fur');
    k.sym(40, function (m, s) {                // symmetric pairs: m(x) mirrors x about 40, s = 1 / -1
      k.ellipse(m(33), 74, 6, 2.8, 'thunder', { part: 'foot' + s });
    });
    k.ellipse(40, 49, 13.5, 11, 'thunder', { part: 'head' });
    k.tufts([[29, 47], [27, 53], [30, 59]], 'thunder', { part: 'head', len: 4, w: 3 });   // ragged cheek
    k.mouth([[33, 55], [47, 55], [45, 60], [40, 62], [35, 60]], {});
    k.tooth(36, 55, 36.3, 58, 2.2);
    k.eye(31, 45, { w: 5, h: 4, iris: 'red', side: 'L', angry: 1.2 });
    k.eye(44, 45, { w: 5, h: 4, iris: 'red', side: 'R', angry: 1.2 });
  };
})();
```

The game calls `PIXKIT.render(id)`, which returns a cached PNG dataURL. Other calls: `PIXKIT.canvas(id)` (cached canvas), `PIXKIT.draw(fn)` (uncached test render), `PIXKIT.ids()`, `PIXKIT.clear(id?)`, `PIXKIT.addRamp(name, [5 hex])`.

**Detail helpers:**

| Call | Use |
|---|---|
| `k.texture(partName, kind, {size, seed, strength})` | Procedural tone texture inside a part. `kind` is `'scales'`, `'fur'`, `'bark'`, `'stone'`, `'feather'`, `'cloth'` or `'dots'`. Call it after the part is drawn. |
| `k.tufts(points, mat, {part, len, w, every, seed, jitter})` | Spikes along a polyline, pointing to its **left** (reverse the points for the other side). Use for fur fringes, ragged hems, manes, moss drips, spines. |

**Shapes.** Each takes a material name and an options object `o`.

| Call | Use |
|---|---|
| `ellipse(cx, cy, rx, ry, mat, o)` / `circle(cx, cy, r, mat, o)` | Heads, bodies, feet |
| `rect(x, y, w, h, mat, o)` | Talismans, hooves, teeth blocks |
| `poly([[x,y],…], mat, o)` | Wings, cloaks, mouths, manes |
| `tube([[x,y,r],…], mat, o)` | Tapered capsule chain: arms, legs, tails, coils, horns, antlers, whiskers |
| `spike(x0, y0, x1, y1, w, mat, o)` | Triangle from base centre to tip: ears, horns, claws, flame tongues, tufts |
| `leaf(x0, y0, x1, y1, w, mat, o)` | Lens shape: leaves, fins, long ears, petals |
| `star(cx, cy, r, mat, o, rot)` | 5-point star |

**Options:**

| Option | Meaning |
|---|---|
| `part:'name'` | Shapes with the same name share one shaded volume, with no seam between them. Give every body mass and every limb its own part. |
| `clip:'name'` | Paint only on top of that part (markings, bellies, inner ears). Shares its volume. |
| `behind:true` | Only fill empty pixels. |
| `erase:true` | Cut the shape out. |
| `shift:±1` | Darken or lighten a whole part (far limbs, back coils). |
| `light:0.2 / -0.2` | Nudge a part one tone lighter or darker. |
| `tone:n` | Fixed tone, no shading. |
| `shade:'form'` (default) / `'glow'` / `'flat'` (+`flatTone`) | Shading mode (see section 4) |
| `dither:false`, `reflect:false`, `spec:false` | Turn off parts of the form shading |
| `halo:0.2–0.35` | Soft glow ring outside the silhouette (use it on 3 parts at most) |
| `outline:'soft'` / `'none'` | Soft outline in tone 1, or no outline |
| `noseam:true` | This part doesn't cut seams into parts behind it (wing bones, fine struts) |
| `noline:true` | This part doesn't receive seams |
| `adj:±n` / `set:t` (+ `clip`, `mat` filter, `pattern`) | Hand-shading pass (see section 4) |

**Ink** (fixed pixels, not shaded):

| Call | Use |
|---|---|
| `px(x, y, mat, tone)` | Single pixel |
| `line(x0, y0, x1, y1, mat, tone)` / `path([[x,y],…], mat, tone)` | 1px lines |
| `sparkle(x, y, size, mat)` | 4-point twinkle |

**Faces:**

| Call | Notes |
|---|---|
| `eye(x, y, o)` | Styles `'glare'` (default house style), `'slit'`, and `'bulge'` (gag monsters only). See section 3. |
| `mouth(polygon, {tongue})` or `mouth(x, y, w, h, o)` | Presets `teeth:'fangs'|'row'|'top'` |
| `tooth(x0, y0, x1, y1, w, mat)` | One crisp tooth, fang or tusk. Defaults to `'bone'`, which also works for claws. |

**Helpers:**
- `shadow(cx, cy, rx, ry)`: ground shadow.
- `sym(cx, fn)`: symmetric drawing.
- `rand(seed)`: deterministic RNG. **Never** use `Math.random` or anything time-based.

## 6. Dos and don'ts

**Do**
- Start from the silhouette. It must be recognisable as a flat black shape at 1×.
- Put far or back parts first with `shift:-1`, then the body, near limbs, head and face, and finally the props in front.
- Give each limb its own `part` so the black seam defines it.
- Make faces loud: a huge mouth, bulging or slit eyes, brows.
- Keep clusters big and clean. Paint 1–3 hand-shading passes on key forms.

**Don't**
- Don't copy or approximate any existing monster (see section 0).
- Don't use left-facing profile poses. That was the previous style.
- Avoid noisy texture, gradients made from dither, and pillow shading done by hand.
- Don't use more than about 3 halos, and don't cover the whole sprite in glow.
- Don't put thin dark sticks (wing bones, whiskers) where they cross the face. Route them away from the eyes and use `noseam` on struts.

**Lessons from the reference set**
- Wing bones that converge next to the face read as black sticks through the eyes. Put the wing's wrist at the top outer corner and fan the fingers down to a scalloped edge (see ホムラドラ, 4).
- A long straight front coil reads as a boat. Pile coils compactly, with humps (see ミズチ, 8).
- A wide flat body reads as a sofa, and four identical straight legs read as table legs. For a front-facing quadruped:
  - Put a deep chest in front.
  - Give the front legs a slight taper, a knee bump and split hooves.
  - Set the hind legs wider and further back, with a bent hock and `shift:-1`.
  - See モリノヌシ (12).
- Giant tongues in the middle of the face swallow the mouth. Keep a tongue small and to one side.
- Two or three spikes on a forehead read as a crown. A flame tuft should be one curling tube.
- At the same scale, big flat areas give away "vector shapes": texture every large part and add at least one hand-shading pass per major form.
- Small props placed over the eyes (smoke puffs and the like) destroy the face. Keep the eye area clear.

## 7. Performance

Everything is cached after the first render. Each reference sprite takes about 3.8ms, including PNG encoding (54 renders ≈ 205ms), and the budget for all 54 is about 300ms. Keep each monster under about 80 shape calls and don't write per-pixel loops over the whole canvas.

## 8. How to preview and self-critique (required)

Use Playwright with the preinstalled Chromium. Do **not** run `playwright install`.
```js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
```

Ready-made pages are in `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/scratchpad/mon/`. Add your `pixmon_N.js` script tag to them.
- `mon.html`: `?sheet=1` gives a contact sheet; `?id=1,4` gives detail rows at 6×, 3× and 1× on dark and light. Use `node shot.js 'id=1' out.png`.
- **`strict.html` (use this for quality sign-off):** each of our sprites next to 3 reference sprites of a similar type, all at the **same integer scale**. Use `node strict.js 2 out.png` and `node strict.js 4 out.png`, adding a third argument such as `1,17` to limit the ids. Add reference crops for new ids to the `REF` table: file, x, y, w, h in the reference sheet's own pixels. Use `grid.html?f=3.png` (`node grid.js 3.png out.png`) to read crop coordinates.
- `cmp.html` shows the whole-sheet side by side, but **it is not at matching scale**. Don't use it for quality judgements.

Critique at least 3 rounds. After each round write a short **gap list** against the references (density, shading, eyes, silhouette, palette) and close it before the next round. Check the console: an unknown ramp name throws `PIXKIT: unknown ramp "…"`.
