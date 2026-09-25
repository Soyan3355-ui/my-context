# 封札モンスターズ: monster pixel-art style guide

Read this first. Each sprite is 64×64. It is drawn in code with `PIXKIT` (`js/pixkit.js`), and the kit's post-process makes all 54 species look like one set.
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
| Canvas | 64×64, transparent background |
| Facing | **LEFT** (the head is on the left side of the canvas) |
| Feet | Resting on y ≈ 57–60 |
| Ground shadow | `k.shadow(cx, 59.5–60.5, rx, 1.6–2.2)`. Every monster needs one; floaters get a smaller one. |
| Margins | Keep 1px free at the canvas edges so the outline fits |

**Height by rarity** (top of the silhouette to the feet; ignore glow and sparkles):

| Rarity | Height | Feel |
|---|---|---|
| C | 36–44px | A compact buddy: head ≈ 45–50% of its height |
| R | 44–52px | Sturdier, with one extra ornament |
| SR | 52–60px | Majestic: a big silhouette, 2–3 accessories, some glow |
| UR | ~62px (fills the canvas) | Legendary: crown, aura or halo, the richest detail |

**3/4 view facing left.** Show both eyes:
- The **near eye** is bigger and sits nearer the centre of the head.
- The **far eye** is narrower (`far: true`) and sits close to the left edge of the face.
- Far-side limbs, ears and wings are drawn **first**, with `shift: -1` to darken them.

**Proportions (chunky and bouncy):**
- Heads are big (C: about as wide as the body).
- Legs are short and thick, with big paws or feet.
- Tails and flames are large enough to be a secondary silhouette.

---

## 4. The kit API (`k`)

Register a monster like this. The key is the monster's numeric `id` from `data.js`.

```js
(function () {
  var P = window.PIXMON = window.PIXMON || {};
  P[23] = function (k) {           // draw back-to-front
    k.shadow(32, 60, 14, 2);
    k.ellipse(34, 48, 11, 9, 'thunder', { part: 'body' });
    k.ellipse(24, 36, 11, 10, 'thunder', { part: 'head' });
    k.eye(20, 32, { w: 5, h: 6, iris: 'water', mood: 'cool', white: true });
    k.mouth(12, 41, 6, 3, { teeth: 'fangs' });
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

**`k.eye(x, y, {w, h, iris, mood, far, white, lower})`** takes (x, y) as the top-left of the eye box.

Size: C monsters use `w 5, h 6` for the near eye and `w 3, h 5, far: true` for the far eye. Big beasts use `5×5` or `6×5`.

| Mood | Look | When to use |
|---|---|---|
| `cool` (default) | Flat heavy upper lid plus a small outer wing, with a sharp 2px vertical glint | Confident, kakko-kawaii |
| `fierce` | Lid lowered at the front: angry brow | Dragons, oni, bosses |
| `cute` | Rounded lids | Only for the gentlest species |
| `happy` / `closed` | `^` or `-` line | Sleepy or smug monsters |
| `glow` | Solid light eye (ghosts, void faces). Put it on a `black` flat part and add a white px glint. | Ghosts and void faces |

- `white: true` adds a sclera column at the back of the eye. Use it when the iris colour is close to the skin colour (for example a gold iris on orange fur).
- Pick an iris colour that **contrasts** with the face: gold on blue or black, violet on white, green on brown, and so on.

**`k.mouth(x, y, w, h, {teeth, tongue})`** draws a dark mouth with a tongue. `teeth` is `'fangs'` (default), `'row'` (a full toothy grin), `'top'` or `'none'`.
DQM-style personality lives here: give most monsters an open grin or a fang. For a tiny mouth, use `k.line` plus one or two white `px` for buck teeth or a fang (see ホシウサ, 22).

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

- **Cel shading.** Each part is treated as a dome and lit from the **upper-left**, giving 3–4 tones. Big parts get soft round forms; thin tubes get crisp 2-tone rods.
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
- Check the 1× view. The silhouette and the eyes must still read at 64px.

**Don't**
- No pure black and no pure-white outlines. The kit handles outlines.
- No random speckle, noise or per-pixel fur texture. Use no more than 2–3 ink detail lines on a surface.
- No tiny dot eyes and no huge eyes that fill the face.
- No real-world logos or text, and nothing resembling existing franchise monsters.
- Don't let shapes that sit behind the body (a cream collar or belly between the legs) poke through. The seams turn them into strange claw shapes; keep markings on large, open areas.
- Don't cover the whole canvas with halo or glow. Use `halo` ≤ 0.35 on at most 2–3 parts.
- Don't use `Math.random` or anything time-based.

**Lessons from the reference set**
- A gold iris on orange fur disappears; add `white:true` or change the iris colour.
- A cone on a head reads as a party hat. Make horns slimmer and add a facet line (`k.line` tone 4) and a sparkle at the tip.
- Heavy magma "bars" look like stickers. Draw cracks as branching 1px `k.path` lines in `magma` tone 3, with one tone-4 hot pixel.
- Black paws that are too big read as wheels. Make socks small ellipses at the bottom of the leg.

---

## 8. Performance

Everything is cached after the first render. The six reference sprites render in about 2ms each, including PNG encoding. Keep yours at a similar cost:
- No per-pixel loops over the whole canvas.
- Use fewer than about 60 shape calls.
- Keep tubes under about 12 points.

The total budget for all 54 species is 300ms.

---

## 9. How to preview

Use Playwright with the preinstalled Chromium. Do **not** run `playwright install`.

1. Make a scratch HTML page that loads `js/pixkit.js` and your `js/pixmon_N.js`.
2. For each id, draw `PIXKIT.canvas(id)` into canvases scaled 1×, 3× and 6× with `imageSmoothingEnabled = false` and `image-rendering: pixelated`.
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
