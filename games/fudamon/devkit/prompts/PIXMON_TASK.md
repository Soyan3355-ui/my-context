# 封札モンスターズ — Pixel monster production brief (3 artists in parallel)

Read FIRST, fully:
1. `/home/user/my-context/games/fudamon/devkit/PIXMON_STYLE.md` — the definitive style guide + kit API (quality bar, compare workflow, lessons).
2. `/home/user/my-context/games/fudamon/js/pixkit.js` (the kit) and `/home/user/my-context/games/fudamon/js/pixmon_1.js` — the 6 APPROVED house-style samples (ids 1 ヒノコロ, 5 ホムラドラ, 10 ミズチ, 15 モリノヌシ, 21 カゲボウ, 26 ホシウサ). Match their rendering quality exactly; ホムラドラ and カゲボウ are the quality bar.
3. Client references (view with Read): `games/fudamon/devkit/refs/2.png`, `3.png`, `4.png`, `5.webp` — Super Famicom Dragon Quest monster sprites + official art. Match the TASTE (front-facing battle pose, bold near-black outlines, saturated hue-shifted 7-tone shading, dense hand-feeling texture, strong personality). HARD RULE: never draw anything recognisable as an existing Dragon Quest monster (no slimes/blob-with-face, no drakee, etc.). All designs original.

## Client direction (new, important)
Each monster must have a CLEAR archetype, not a halfway mix:
- **かっこいい (cool)** — heroic/fierce, dynamic, sharp.
- **おどろおどろしい (eerie/creepy)** — unsettling, grotesque-fun yokai horror.
- **かわいい (cute/cheeky)** — charming, mischievous, big personality.
- **癒し系 (soothing/healing)** — gentle, calm, soft expressions (closed/smiling or droopy kind eyes), rounded shapes, warm palette, tiny comforting details. The roster lacked these; make them genuinely lovable.
Push each design fully into its archetype.

## Interface
Your file registers: `(function(){ var P = window.PIXMON = window.PIXMON || {}; P[<id>] = function (k) { ... }; })();` exactly like pixmon_1.js. Ids below are final. Use rarity sizes from the style guide (C 40–50px tall, R 46–58, SR 58–72, UR up to ~76 on the 80 canvas). Keep render time small (whole set of 30 must render < ~250ms).

## Roster to draw
| id | name | type | rarity | archetype | concept |
|---|---|---|---|---|---|
| 2 | ヒダルマ | fire | C | 癒し | chubby fire daruma spirit: round red body with gold trim, calm smiling painted face (one eye painted in, one blank — a gentle gag), tiny flame on head, warm glow |
| 3 | カエンジシ | fire | R | かっこいい | shishi lion beast, blazing mane, armored brow plate, mid-roar, muscular forelegs |
| 4 | ヤケガニ | fire | R | かわいい(コミカル) | hot-spring volcano crab: red-hot armored shell steaming, one huge claw one small, stalk eyes, a folded towel on its head |
| 6 | シズクン | water | C | 癒し | tiny water nymph (NOT a blob): translucent droplet-child wearing a lotus-leaf hat, sleepy smile, sitting on a bubble, little ripples |
| 7 | カッパチ | water | C | かわいい | kappa kid: head plate with water, turtle-shell backpack, webbed hands holding a cucumber, cheeky grin |
| 8 | ナミウルフ | water | R | かっこいい | wolf of breaking waves, foam mane, fin ears, snarl, front-facing crouch |
| 9 | ユキオニ | water | R | 癒し (gentle giant) | big white furry snow ogre, tiny horns, droopy kind eyes, rosy cheeks, cradling a little bird or snowball |
| 11 | メブキン | grass | C | かわいい | sprout imp: bark-skin body, big leaf on head, root feet, mischievous grin |
| 12 | キノコボウ | grass | C | 癒し | plump mushroom kid, spotted cap, dozy half-closed eyes, glowing spore sparkles |
| 13 | コケモチ | grass | C | 癒し | sleepy mossy tortoise, tiny flowers on its boulder shell, content smile |
| 14 | ハナカマキリ | grass | R | かっこいい | orchid mantis: petal armor, scythe arms raised, sharp stare |
| 16 | ビリタマ | thunder | C | かわいい | armored pill-bug rolled half-open, antenna sparks, delighted expression |
| 17 | イナビー | thunder | C | かっこいい | storm hornet: metallic carapace, crackling stinger, fierce eyes |
| 18 | カミナリコゾウ | thunder | C | かわいい | little thunder imp: tiger-pelt shorts, drum ring on back, small horns, tongue out |
| 19 | ライジュウマル | thunder | R | かっこいい | raijū beast (wolf/wildcat), lightning fur, zigzag tail, snarl |
| 20 | ナルカミ | thunder | SR | かっこいい | thunderbird, wings spread with lightning primaries, crest, storm aura |
| 22 | バケチョウチン | dark | C | おどろおどろしい(コミカル) | paper-lantern yokai: torn paper, one giant eye, long lolling tongue, ghost flame inside |
| 23 | クロネコマタ | dark | R | かっこいい(妖艶) | black two-tailed cat, blue ghost flames at tail tips, sly grin, glowing eyes |
| 24 | ドクロキシ | dark | R | おどろおどろしい | skeleton samurai in broken armor, chipped katana, glowing eye sockets, tattered banner |
| 25 | クロガネオロチ | dark | UR | おどろおどろしい | three-headed iron-scaled serpent, molten violet eyes, coils, legendary menace |
| 27 | ヒカリホタル | light | C | 癒し | firefly fairy with a softly glowing lantern belly, gentle smile, little leaf wings |
| 28 | ルミナシカ | light | R | 癒し(神秘) | luminous fawn with crystal antlers, gentle eyes, drifting light motes |
| 29 | シロガネグリフ | light | SR | かっこいい | silver griffin: eagle head, armored plumage, wings spread, lion forelegs |
| 30 | オーロラクジラ | light | UR | 癒し(神秘) | colossal sky whale with aurora ribbons and a crown ridge, serene expression (also used flying across the sky in the ending) |

## Quality loop (mandatory)
- Preview each sprite at 1×, 3×, 6× on dark and light and grass backdrops.
- Strict compare sheet: your sprites next to the approved pixmon_1 samples AND 2–3 reference sprites of similar kind at the SAME integer scale (use the style guide's strict compare workflow; do not show ours larger than the refs).
- After each round write a short gap list; iterate ≥3 rounds until each sprite matches the house quality bar (ホムラドラ/カゲボウ level) and reads its archetype at a glance at 1×.
- Hand-pixel polish passes (k.px / pixel maps) where the procedural base looks geometric.
- No console errors. Do not edit other files; do not commit.
Reply with: file path, one line per monster (archetype + design), render time, and your final contact sheet + strict compare sheet paths.
