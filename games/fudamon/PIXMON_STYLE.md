# 封札モンスターズ: monster pixel-art style guide

Read this first. Each sprite is **96×96**. It is drawn in code with `PIXKIT` (`js/pixkit.js`), and the kit's post-process makes all 54 species look like one set.
The reference sprites are in `js/pixmon_1.js` (IDs 1, 4, 8, 12, 17 and 22). Open that file next to this one.

---

## 1. Headline direction: "ドラクエモンスターズみたいな感じ！"

Take the *sensibility* of the Dragon Quest Monsters series. **Never take a design**: everything must be original. Nothing may resemble a specific DQ monster (no slime-like teardrop blobs with a smile, and so on).

- **Build from one clear idea.** Examples: "a lantern ghost", "a daruma of fire", "a snow ogre", "a fox pup whose tail is a bonfire". Add one or two memorable features and stop there.
- **Iconic, chunky, rounded silhouettes.** You should be able to name the monster from its shadow alone. Test this by squinting at the 1× view.
- **Charming, slightly humorous personality.** Big expressive faces, toothy grins or open mouths, and mischievous or determined eyes. A monster can occasionally be goofy, but never babyish.
- **Sturdy, bouncy proportions.** Heavy feet, big heads or big hands. They should look capable and strong: charming but tough, like a rugby-player mascot.
- **Bright, clean, saturated colour.** Use bold dark outlines and simple, confident shading. **Avoid noisy texture**: no per-pixel speckle, no busy fur strokes.
- **Stronger ranks get grander.** SR and UR monsters become majestic and imposing (bigger, more ornament, more glow) but keep the friendly, illustrated charm.

## 2. Secondary reference: mobile pixel RPG ad

Client image: `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/images/1.webp`. View it with your image viewer or the Read tool. It shows 50+ characters. **Do not copy any character from it.** Take only these qualities:

- High-detail sprites roughly 48–64px tall, with clean dark outlines and soft 3–4 tone cel shading.
- Big expressive eyes with bright highlights.
- Chibi proportions. Humanoid-ish yokai are about 2–3 heads tall; beasts have compact bodies and big heads.
- Lots of accessory detail: armour trim, scarves, feathers, ribbons, horns, fur tufts. Our world adds shrine motifs: 御札 talismans, shimenawa rope with 紙垂 paper streamers, 鈴 bells, and 鳥居 vermilion.
- Saturated but harmonious colour and strong, readable silhouettes.
- The big white yeti in the ad is the benchmark for "charming but strong".

---

## 3. Canvas and composition rules

| Rule | Value |
|---|---|
| Canvas | 96×96, transparent background (`PIXKIT.W`/`PIXKIT.H`) |
| Facing | **LEFT**, in 3/4 view (the head is on the left side of the canvas) |
| Feet | Resting on y ≈ 86–90 |
| Ground shadow | `k.shadow(cx, 89.5–90.5, rx, 2–3)`. Every monster needs one; floaters get a smaller one. |
| Margins | Keep 1px free at the canvas edges so the outline fits |

**Height by rarity** (top of the silhouette to the feet; ignore glow and sparkles):

| Rarity | Height | Feel |
|---|---|---|
| C | 54–64px | A compact buddy: head ≈ 45–50% of its height |
| R | 64–76px | Sturdier, with one extra ornament |
| SR | 76–88px | Majestic: a big silhouette, 2–3 accessories, some glow |
| UR | up to ~94px | Legendary: crown, aura or halo, the richest detail |

**3/4 view facing left.** Show both eyes:
- The **near eye** is bigger and sits nearer the centre of the head.
- The **far eye** is narrower (`far: true`) and sits close to the left edge of the face.
- Far-side limbs, ears and wings are drawn **first**, with `shift: -1` to darken them.

**Proportions (chunky and bouncy):**
- Heads are big (C: about as wide as the body).
- Legs are short and thick, with big paws or feet.
- Tails and flames are large enough to be a secondary silhouette.

---

## 3b. Face rules (the top priority, because DQM characters read through the face)

Client feedback on the first pass was that the faces looked squashed. These rules fix that.

- **The head is big**, roughly 35–50% of the silhouette's height on C and R monsters. It is drawn in **3/4 view**, not strict profile, so **both eyes show**:
  - The near eye is big, about 9–10 × 10–11 px on a C monster, and sits toward the centre of the head.
  - The far eye is narrow (`w 5–6`, `far:true`) and sits near the front edge of the face.
- **Eyes** use `k.eye`, which draws a heavy 2px top lid, white sclera, a coloured iris tucked under the lid (never floating in white), a dark pupil, a crisp 2×2 glint and a small secondary glint.
  - Add `brow:true` (in a dark tone of the head's ramp) for expression.
  - Don't put ink all the way round the eye, or it reads as glasses.
  - Keep brows short and separate; never join them across the nose.
- **Snouts and muzzles need structure:**
  - A separate `part` for the snout (a tube or poly) so a seam defines where it meets the head.
  - A distinct **nose tip**: a small black or dark ellipse with a 1px glint, or a nose bulb on dragons.
  - A clear **mouth line** or open mouth made with `k.mouth(polygon)`.
  - Upper and lower jaws are separate parts on big-jawed beasts, with the mouth drawn between them.
- **Teeth are individual shapes.** Draw each one with `k.tooth()` (a white triangle, lit left, shaded right) and leave gaps between them. No white bars.
- **Whiskers, tendrils and the like grow from an anatomical anchor** (the lip, the nose, the brow), never from mid-air.
- **Expression.** Give most monsters a grin, fang or smirk. Use a lopsided mouth for cheekiness and `mood:'fierce'` with a brow ridge for dragons and oni.
- **Check at 6×** that the face reads as eye, brow, nose and mouth, not as blobs.

---

## 4. The kit API (`k`)

Register a monster like this. The key is the monster's numeric `id` from `data.js`.

```js
(function () {
  var P = window.PIXMON = window.PIXMON || {};
  P[23] = function (k) {           // draw back to front
    k.shadow(50, 89.5, 22, 2.6);
    k.ellipse(56, 74, 16, 12, 'thunder', { part: 'body' });
    k.ellipse(38, 58, 17, 15, 'thunder', { part: 'head' });
    k.tube([[32, 62, 5], [21, 64, 3]], 'thunder', { part: 'snout' });
    k.ellipse(18.5, 63, 2.6, 2.2, 'black', { part: 'nose', hi: false });
    k.mouth([[21, 67], [35, 65], [33, 71], [25, 71]], {});
    k.tooth(25, 67, 25.3, 69.5, 2.6);
    k.eye(35, 46, { w: 10, h: 11, iris: 'water', mood: 'cool', brow: true, browMat: 'thunder' });
    k.eye(23, 48, { w: 6, h: 10, iris: 'water', far: true });
  };
})();
```

`PIXKIT.render(id)` returns a cached PNG dataURL. `PIXKIT.canvas(id)` returns a cached canvas. `PIXKIT.draw(fn)` renders an uncached test function. `PIXKIT.ids()`, `PIXKIT.clear(id?)` and `PIXKIT.addRamp(name, [5 hex])` are also available.

### Shapes

Every shape takes a material name and an optional options object `o`.

| Call | Use |
|---|---|
| `k.ellipse(cx, cy, rx, ry, mat, o)` / `k.circle(cx, cy, r, mat, o)` | Heads, bodies, haunches, paws |
| `k.rect(x, y, w, h, mat, o)` | Hooves, boxes, talismans |
| `k.poly([[x,y],…], mat, o)` | Wings, cloaks, manes, anything freeform |
| `k.tube([[x,y,r],…], mat, o)` | **The workhorse.** Tapered capsule chain for necks, legs, tails, coils, horns and antlers |
| `k.spike(x0, y0, x1, y1, w, mat, o)` | Triangle from base centre to tip: ears, horns, claws, flame tongues, fur tufts |
| `k.leaf(x0, y0, x1, y1, w, mat, o)` | Lens shape: leaves, fins, feathers, long ears, petals |
| `k.star(cx, cy, r, mat, o, rot)` | 5-point star |

### Options (`o`)

| Option | Meaning |
|---|---|
| `part: 'name'` | Shapes with the same part name share one **volume**, so they are shaded as a single form with no seam between them. Give each body mass (body, head, each near limb) its own part. |
| `clip: 'name'` | Paint only on top of an existing part, sharing its volume. Use it for markings, bellies, inner ears and stripes. |
| `behind: true` | Paint only where the canvas is still empty (tuck something behind what is already drawn). |
| `erase: true` | Cut the shape out. |
| `shift: -1 / +1` | Darken or lighten the whole part by one tone (far limbs use `-1`). |
| `light: 0.1…0.3` | Brighten the shading bias (shiny materials, faces). |
| `tone: n` | Fixed tone 0–4 with no shading (flat inner ears, printed marks). |
| `shade: 'glow'` | Bright core with darker edges. Use for flames, magic, wisps and lightning. |
| `shade: 'flat'` (+ `flatTone`) | Uniform tone (voids, holes). |
| `halo: 0.2–0.35` | Soft coloured glow ring outside the silhouette (flames, gems, eyes of light). |
| `outline: 'soft' / 'none'` | Soft outline in tone 1 (use with glow parts), or no outline. |
| `noseam: true` | This part doesn't cut a dark seam into parts behind it. |
| `round: R` | Override the dome radius; a smaller value gives flatter, crisper shading. |
| `flat: true` | Gentler normals (flat planes such as wings and cloth). |
| `dither: true` | Allow a light checker dither on band edges. Use it rarely, on big smooth masses only. |
| `hi: false` | No specular tone-4 pixels. |

### Ink (fixed pixels, not shaded)

| Call | Use |
|---|---|
| `k.px(x, y, mat, tone)` | Single pixel: noses, fangs, sparkles, glints |
| `k.line(x0, y0, x1, y1, mat, tone)` / `k.path([[x,y],…], mat, tone)` | 1px lines: cracks, whiskers, brows, stitches, mouth lines |
| `k.sparkle(x, y, size, mat)` | 4-point twinkle |

### Faces

**`k.eye(x, y, {w, h, iris, mood, far, brow, browMat, browTone, look, icy, lash})`** takes (x, y) as the top-left of the eye box.

Size: C near eye `w 9–10, h 10–11`; far eye `w 5–6, h 9–10, far:true`. Big dragons use `10×8–9`.

| Mood | Look | When to use |
|---|---|---|
| `cool` (default) | Slightly lowered, heavy lid | Confident, kakko-kawaii |
| `fierce` | Lid slanted down at the front | Dragons, oni, bosses |
| `open` | Round and wide | Surprised or friendly |
| `sad` | Lid slanted down at the back | Worried or pitiful |
| `happy` / `closed` | `^` / `-` arc | Smug or sleepy |
| `glow` | Solid light eye | Ghosts and voids. Better still, draw glowing eyes as shapes with `shade:'glow', halo`, as カゲボウ does. |

- `look` shifts the iris horizontally (negative = further left).
- `icy` shifts it vertically.
- Pick an iris colour that **contrasts** with the face.

**`k.mouth([[x,y],…], {tongue})`** draws a polygon mouth (or `k.mouth(x, y, w, h, o)` for a box). It has a darker top edge and a tongue at the bottom, with teeth `'fangs'`, `'row'` or `'top'` as quick presets. For quality, place teeth yourself with **`k.tooth(x0, y0, x1, y1, w)`**: base centre, then tip, then width. Examples: upper teeth point down, lower fangs point up.

### Manual shading passes (DQM-style hand-placed clusters)

Any shape with `adj` or `set` doesn't paint colour. It adjusts the tone of pixels that are already painted, optionally only inside `clip` or only for a given material:

```js
k.tube([[58,64,1],[60,76,1],[58,86,1]], null, { adj: -1, clip: 'cloak' });   // fold groove
k.tube([[56,64,.6],[58,76,.6]],        null, { adj: +1, clip: 'cloak' });   // lit edge of the fold
k.rect(30, y, 30, 1, 'fire', { adj: -2, clip: 'body' });                    // belly plate lines (fire pixels only)
k.poly([...], null, { set: 4, clip: 'horn' });                               // a crisp crystal facet
```

Use these on key forms (face, chest, limbs, cloth folds, facets) so the shapes read as clear planes.

### Helpers

- `k.sym(cx, fn)` calls `fn(mx, side)` twice: once as-is and once mirrored about `cx`. Use it for front-facing symmetric bits.
- `k.rand(seed)` is a deterministic RNG. Sprites must render identically every time, so **never** use `Math.random`.

---

## 5. Ramps (materials)

Every ramp has 5 tones:

| Tone | Role | Who uses it |
|---|---|---|
| 0 | Outline and seams | The kit |
| 1 | Shadow | The kit's shading |
| 2 | Base | The kit's shading |
| 3 | Light | The kit's shading |
| 4 | Highlight | Rare specular pixels and ink sparkles |

Use them by name:

| Group | Ramps |
|---|---|
| Fire | `fire` (fur/scales), `flame` (glowing fire bodies, use `shade:'glow'`), `magma` |
| Water | `water`, `aqua` (fins, manes, tropical), `ice` |
| Grass | `grass`, `leaf` (yellow-green, moss, sprouts) |
| Thunder | `thunder` |
| Dark | `dark` (indigo-violet), `shadow` (near-black cloth and hoods), `violet` (magic accents and wisps) |
| Light | `light` (pale gold-cream), `crystal`, `sakura` |
| Neutrals | `fur`, `tan`, `cream`, `bone`, `steel`, `stone`, `obsidian`, `skin` (pink noses and inner ears), `gold`, `white`, `black` (black-violet), `red`, `wood`, `mouth` |

These match the overworld palette: warm, indigo-tinted darks and no pure black. If you really need a new colour family, call `PIXKIT.addRamp('name', [darkest, shadow, base, light, highlight])` at the top of your module and tell the lead. Keep its tone 0 a deep, tinted dark.

**Colour rules**
- Each monster has **one dominant ramp, one secondary and one accent**. The accent is usually glow, gold or a type colour.
- Its type should read instantly: fire looks warm, water blue, grass green, thunder yellow, dark violet/black and light cream/pink/gold.
- Glowing things (flames, crystals, eyes of light) are the brightest pixels on the sprite. Everything else stays at tones 1–3.

---

## 6. What the kit does automatically (don't fight it)

- **Cel shading (default `shade:'cel'`).** Each part gets a clean **shadow crescent** on its lower right, a **light band** on its upper left and a base tone in between. Parts thick enough (`maxd ≥ 5`) also get one highlight cluster near the upper left, which `hi:false` turns off. There is no pillow shading. Tune the depths with `shadow: 0.3–0.8` and `lit: 0.2–0.6`. `shade:'dome'` keeps the older smooth dome shading.
- **Orphan cleanup.** A lone shaded pixel surrounded by a single other tone is merged into it, so there are no stray pixels.
- **Seams.** When a part is drawn over an earlier part, the earlier part gets a dark line (different material) or a one-tone-darker line (same material) along the join. This is what makes near legs, heads and wings separate cleanly.
  - To avoid a seam, use the same `part` name, or `clip`.
- **Selective outline.**
  - A 1px external outline uses the ramp's darkest tone.
  - On the lit top and left side it is slightly lighter.
  - Parts with `outline:'soft'` get a tone-1 outline.
  - Ink parts get none.
- **Halo** glow rings for parts with `halo`.
- **Ground shadow** from `k.shadow`.

Draw flat shapes and let the kit shade them. Add ink only for **facial features and a few meaningful details** (cracks, marks, sparkles).

---

## 7. Dos and don'ts

**Do**
- Draw back to front: far limbs, far wing and tail first; then the body; then near legs, the neck, horns behind the head, the head, the face, and finally front accessories.
- Keep near limbs as separate parts so a seam defines them.
- Give every monster a face with attitude: grin, fang, a smug or determined look.
- Use 1–3 accessories that tell a story: talisman, shimenawa and shide, bell, scarf, armour trim, leaves, flowers.
- Check the 1× view. The silhouette and the eyes must still read at 96px.

**Don't**
- No pure black and no pure-white outlines. The kit handles outlines.
- No random speckle, noise or per-pixel fur texture. Use no more than 2–3 ink detail lines on a surface.
- No tiny dot eyes and no huge eyes that fill the face.
- No real-world logos or text, and nothing resembling existing franchise monsters.
- Don't let shapes that sit behind the body (a cream collar or belly between the legs) poke through. The seams turn them into strange claw shapes; keep markings on large, open areas.
- Don't cover the whole canvas with halo or glow. Use `halo` ≤ 0.35 on at most 2–3 parts.
- Don't use `Math.random` or anything time-based.

**Lessons from the reference set**
- Eyes with white between the lid and the iris read as bored. The kit tucks the iris under the lid; don't push it down with `icy` unless you want that look.
- Ink all the way round the eyes, plus joined brows, reads as glasses. Keep brows short and separate.
- A cream "bib" or fluff spike on a coloured chest turns into a muddy tan blob or a claw shape after shading. Leave it out, or make it a large, clearly shaped area.
- A plain cone horn reads as a party hat. Draw a faceted shard cluster (`shade:'flat'` plus `set` facets, see ホシウサ, 22).
- A cone on a head reads as a party hat. Make horns slimmer and add a facet line (`k.line` tone 4) and a sparkle at the tip.
- Heavy magma "bars" look like stickers. Draw cracks as branching 1px `k.path` lines in `magma` tone 3, with one tone-4 hot pixel.
- Black paws that are too big read as wheels. Make socks small ellipses at the bottom of the leg.

---

## 8. Performance

Everything is cached after the first render. At 96×96 the six reference sprites render in about 3.5–4ms each, including PNG encoding (54 renders ≈ 200ms). Keep yours at a similar cost:
- No per-pixel loops over the whole canvas.
- Use fewer than about 80 shape calls.
- Keep tubes under about 12 points.

The total budget for all 54 species is about 300ms.

---

## 9. How to preview

Use Playwright with the preinstalled Chromium. Do **not** run `playwright install`.

1. Make a scratch HTML page that loads `js/pixkit.js` and your `js/pixmon_N.js`.
2. For each id, draw `PIXKIT.canvas(id)` (96×96) into canvases scaled 1×, 3× and 6× with `imageSmoothingEnabled = false` and `image-rendering: pixelated`.
3. Put them on a **dark** backdrop (`#1d1a2c`), a **light** one (`#e9efe0`) and overworld grass (`#7fba56`).
4. Screenshot the page:
   ```js
   const { chromium } = require('/opt/node22/lib/node_modules/playwright');
   const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
   ```
5. Look at the result and critique it: silhouette at 1×, face at 6×, seams and outline at 3×. Iterate at least 3 rounds.
6. Check the console for errors. An unknown ramp name throws `PIXKIT: unknown ramp "…"`.

A ready-made preview page is at `/tmp/claude-0/-home-user-my-context/33c84ab2-8ee2-5519-9749-42b6d5bb39cf/scratchpad/mon/mon.html`. Add your script tag to it.
- `?sheet=1` shows a contact sheet.
- `?id=1,4` shows detail rows.
- `node shot.js 'id=1' out.png` saves a screenshot.
