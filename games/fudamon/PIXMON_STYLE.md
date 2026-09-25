# 封札モンスターズ: monster pixel-art style guide (definitive)

Every monster is a **96×96 front-facing battle sprite**, drawn in code with `PIXKIT` (`js/pixkit.js`).
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

## 1. The look in one paragraph

A chunky, top-heavy creature **faces the player head-on** in a battle pose. It has **big bulging eyes with tiny pupils** or **menacing slit eyes**, and a **huge mouth**: a grin, a snarl, a lolling tongue, snaggle teeth, tusks.
Everything is wrapped in a **crisp near-black 1px outline** and painted in **few, saturated, hue-shifted colours**: purple or blue shadows, warm yellow highlights. Shading is simple and confident.
**Each monster is one clear idea plus one gag.** Examples: a fox whose tail is a bonfire and who can't keep its tongue in; a ghost with a jiangshi talisman slapped on its hood; an old stag lord chewing a sprig with a chick nesting in his antlers.

## 2. Pose and composition

| Rule | Value |
|---|---|
| Canvas | 96×96, transparent (`PIXKIT.W`/`PIXKIT.H`) |
| Facing | **Front-facing** (straight on, or a slight 3/4), confronting the player. The battle screen mirrors the player's side, so keep designs roughly symmetric or fine when mirrored. Use `k.sym(48, fn)`. |
| Centre line | x = 48 |
| Feet | Resting on y ≈ 86–89 |
| Ground shadow | `k.shadow(48, 88.5–89.5, rx, 2–3)` on every monster; floaters get a small one |
| Margins | Keep at least 1px free at the canvas edges (the outline must fit) |

**Height by rarity** (top of the silhouette to the feet; ignore glow and sparkles):

| Rarity | Height | Feel |
|---|---|---|
| C | 44–58px | A compact goofball: head ≥ 45% of its height |
| R | 54–66px | Sturdier, with one prop or ornament |
| SR | 72–88px | Imposing: spread wings, antlers, a big maw, 2–3 features |
| UR | up to ~92px | Legendary: fills the canvas, crown or aura, the richest detail, still charming |

**Proportions:**
- Chunky, stocky and **top-heavy**: big head, big hands or claws, stubby legs with fat feet.
- Arms are often raised in a threat or "boo!" pose.
- Props are welcome when they fit the concept: club, drum, lantern, staff, shield, talisman, bell.

## 3. Faces: personality and gag

- **Eyes.** Choose one:
  - `k.eye(x, y, {style:'bulge', w:9–10, h:10–11, pupil:2, look:[dx,dy], brow:[dyL,dyR]})`: a round white eyeball with a black ring and a *tiny* pupil. This is the default comedic look.
  - `{style:'slit', iris:'thunder'|'red'|…}`: a coloured eye with a black slit pupil, for menace (dragons, demons).
  - `{style:'bulge', lid:0.3–0.5, lidMat:'fur', lidTilt:±1}`: half-lidded, for grumpy, smug or sleepy characters.
  - Glowing void eyes (ghosts): draw them as shapes with `shade:'glow', halo` (see カゲボウ).
- **Brows.** `brow:[dyLeft, dyRight]` draws a thick brow.
  - Angry: the inner end is lower. On the left eye that means the right end is lower, e.g. `[-1, 2]`.
  - Cocky: one brow raised high.
  - `browMat`/`browTone` can make them bushy white (`'cream', 3`), and `browThick` sets the thickness.
- **Pupils** usually look slightly inward or at the player (`look`).
- **Mouths are big.**
  - Use `k.mouth([[x,y],…], {tongue})` with a polygon, usually wide and lopsided.
  - Add **individual teeth** with `k.tooth(x0, y0, x1, y1, w)`: upper teeth point down, lower fangs or tusks point up.
  - Snaggle teeth, buck teeth, a lolling tongue (a `skin` or `sakura` ellipse or tube over the lip) and fat lips are all encouraged.
- **Noses and snouts.** A distinct dark nose blob, nostrils as ink pixels, and a muzzle as its own part.
- **One gag per monster.** It should be visible at 1×: a lolling tongue, a floppy ear, an object on the head, something being chewed, a stuck-on talisman, and so on.

## 4. Colour, outline and shading

- **Outline.** A crisp near-black 1px outline goes round the whole silhouette automatically. Where one part overlaps a part of a *different material*, the kit draws a **black seam** between them. Same-material overlaps get a softer one-tone step.
- **Ramps.** 5 tones each: 0 deepest, 1 shadow, 2 base, 3 light, 4 highlight. They are **hue-shifted**: shadows lean purple or blue, highlights lean warm yellow.
  - Type ramps: `fire`, `flame` (glowing), `magma`, `water`, `aqua`, `ice`, `grass`, `leaf`, `thunder`, `dark`, `shadow` (void cloth), `violet` (magic), `light`, `crystal`, `sakura`.
  - Neutrals: `fur`, `tan`, `cream`, `bone`, `steel`, `stone`, `obsidian`, `skin` (tongues, noses, inner ears), `gold`, `white`, `black`, `red`, `wood`, `mouth`.
- **Colour budget.** One dominant ramp, one secondary and one accent (glow, gold or type colour) per monster. It must read as its type at a glance.
- **Automatic cel shading** (`shade:'cel'`, the default): a shadow crescent on the lower right (about 40% of each form), a light band on the upper left, and one highlight cluster on big forms. Tune with `shadow:0.5–1.0` and `lit:0.2–0.5`. Other options:
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
    k.shadow(48, 88.5, 18, 2.4);
    k.ellipse(48, 75, 15, 12, 'thunder', { part: 'body' });
    k.sym(48, function (m, s) {                // symmetric pairs: m(x) mirrors x about 48, s = 1 / -1
      k.ellipse(m(40), 86, 6.5, 3.4, 'thunder', { part: 'foot' + s });
    });
    k.ellipse(48, 57, 18, 14, 'thunder', { part: 'head' });
    k.mouth([[37, 63], [59, 63], [55, 70], [48, 72], [41, 70]], {});
    k.tooth(43, 63, 43.3, 66.5, 2.8);
    k.eye(37, 48, { style: 'bulge', w: 10, h: 11, pupil: 2, look: [1, 1], brow: [-2, 1] });
    k.eye(50, 48, { style: 'bulge', w: 10, h: 11, pupil: 2, look: [-1, 1], brow: [1, -2] });
  };
})();
```

The game calls `PIXKIT.render(id)`, which returns a cached PNG dataURL. Other calls: `PIXKIT.canvas(id)` (cached canvas), `PIXKIT.draw(fn)` (uncached test render), `PIXKIT.ids()`, `PIXKIT.clear(id?)`, `PIXKIT.addRamp(name, [5 hex])`.

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
| `shade:'cel'` (default) / `'glow'` / `'flat'` (+`flatTone`) / `'dome'` | Shading mode (see section 4) |
| `shadow`, `lit` | Cel shading depths |
| `hi:false` | No highlight cluster |
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
| `eye(x, y, o)` | SFC styles `'bulge'` / `'slit'` (see section 3). The older anime eye (`mood:'cool'` and so on) still exists but **is not the house style any more**. |
| `mouth(polygon, {tongue})` or `mouth(x, y, w, h, o)` | Presets `teeth:'fangs'|'row'|'top'` |
| `tooth(x0, y0, x1, y1, w, mat)` | One crisp tooth, fang or tusk (use `'bone'` for yellowed tusks) |

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
- A wide flat body on thin legs reads as a sofa or a chair. Front-facing quadrupeds need a barrel chest with short, thick legs directly under it (see モリノヌシ, 12).
- Small props placed over the eyes (smoke puffs and the like) destroy the face. Keep the eye area clear.

## 7. Performance

Everything is cached after the first render. Each reference sprite takes about 4ms, including PNG encoding, and the budget for all 54 is about 300ms. Keep each monster under about 80 shape calls and don't write per-pixel loops over the whole canvas.

## 8. How to preview and self-critique (required)

Use Playwright with the preinstalled Chromium. Do **not** run `playwright install`.
```js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
```

Ready-made pages are in `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/scratchpad/mon/`. Add your `pixmon_N.js` script tag to them.
- `mon.html`: `?sheet=1` gives a contact sheet; `?id=1,4` gives detail rows at 6×, 3× and 1× on dark and light. Use `node shot.js 'id=1' out.png`.
- `cmp.html`: our sprites side by side with the SFC reference sheets on matching mint and blue backdrops. Use `node cmp.js 2 out.png`.

Critique at least 3 rounds: silhouette at 1×, face and gag at 6×, seams and clusters at 3×, and cohesion next to the reference sheet. Check the console: an unknown ramp name throws `PIXKIT: unknown ramp "…"`.
