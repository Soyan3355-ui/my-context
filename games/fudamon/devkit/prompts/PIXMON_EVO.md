# 封札モンスターズ — Evolved forms (30 new sprites, ids 31–60)

Read FIRST: `/home/user/my-context/games/fudamon/devkit/PIXMON_STYLE.md`, the kit `/home/user/my-context/games/fudamon/js/pixkit.js`, and ALL four approved sprite files `js/pixmon_1.js` … `js/pixmon_4.js` (30 approved base monsters — ホムラドラ(5) and カゲボウ(21) are the quality bar). Client references (Read them): `games/fudamon/devkit/refs/2.png`, `3.png`, `4.png` (SFC Dragon Quest monster sprites — match the TASTE; never copy any existing DQ design).

Each evolved form must clearly look like the SAME creature grown up (keep its signature colours, markings, gag and silhouette DNA) but bigger, more detailed and more impressive. Keep the base's archetype (かっこいい / おどろおどろしい / かわいい / 癒し系) and push it further — healing ones become grander and even more soothing, not scary. Evolved forms should be ~15–25% taller than their base (within the 80px canvas; UR 極 forms can use nearly the full canvas). Front-facing battle pose like the bases. Draw the base sprite next to its evolution in your compare sheets.

Register exactly like the bases: `(function(){ var P = window.PIXMON = window.PIXMON || {}; P[<id>] = function (k) {...}; })();`

| id | evolves from | name | type | archetype | concept |
|---|---|---|---|---|---|
| 31 | 1 ヒノコロ | ホムラギツネ | fire | かっこいい | grown fire fox with three blazing tails, flame ruff, sharp confident grin |
| 32 | 2 ヒダルマ | オオダルマ | fire | 癒し | giant lucky daruma, BOTH eyes now painted, gold good-luck patterns, small daruma kids beside it on a big cushion, warm glow |
| 33 | 3 カエンジシ | シシオウエン | fire | かっこいい | armored lion king / komainu guardian, huge blazing mane, gold armor, fireball under one paw |
| 34 | 4 ヤケガニ | カザンガニ | fire | コミカル | huge volcano crab carrying a steaming hot spring on its back, towel + wooden bucket, delighted face |
| 35 | 5 ホムラドラ | エンリュウオウ | fire | かっこいい | magma dragon king: bigger wings, crown of horns, molten chest core, magma dripping |
| 36 | 6 シズクン | シズクヒメ | water | 癒し | water nymph princess sitting on a lotus, rain parasol, droplet tiara, serene smile |
| 37 | 7 カッパチ | カッパオヤブン | water | コミカル | big kappa boss in a sumo mawashi, cucumber held like a sword, proud grin, head plate brimming |
| 38 | 8 ナミウルフ | ツナミロウ | water | かっこいい | tsunami wolf lord, towering wave crest mane, foam armor, fierce howl |
| 39 | 9 ユキオニ | ユキダイオウ | water | 癒し | gentle snow king giant, little birds nesting on its head, tiny igloo on its back, kind smile |
| 40 | 10 ミズチ | リュウジン | water | かっこいい(神秘) | water dragon god, long majestic coils, pearls orbiting, flowing mane and whiskers |
| 41 | 11 メブキン | ワカバオウジ | grass | かわいい | forest prince imp with a leaf crown, acorn-topped staff, cape of leaves, cheeky grin |
| 42 | 12 キノコボウ | オオキノコ | grass | 癒し | giant cozy mushroom grandpa with a warm lamp hanging from the cap and tiny mushroom kids |
| 43 | 13 コケモチ | コケヤマ | grass | 癒し | tortoise carrying a small mountain forest with a tiny shrine and waterfall on its shell, sleeping |
| 44 | 14 ハナカマキリ | オウカマキリ | grass | かっこいい | sakura mantis samurai, twin katana-scythes, petal armor, falling petals |
| 45 | 15 モリノヌシ | ダイジュノヌシ | grass | かっこいい(神秘) | ancient stag carrying a giant sacred tree as antlers, forest spirits and lanterns in the branches |
| 46 | 16 ビリタマ | ライデンダマ | thunder | かわいい | bigger armored thunder bug-ball with spinning lightning wheels, gleeful face |
| 47 | 17 イナビー | イナズマジョオウ | thunder | かっこいい | storm hornet queen, crown, larger crackling wings, twin stingers |
| 48 | 18 カミナリコゾウ | ゴロゴロオニ | thunder | コミカル | burly thunder oni with the full drum ring, tiger-pelt, big grin, lightning drumsticks |
| 49 | 19 ライジュウマル | ライジュウオウ | thunder | かっこいい | thunder beast king, storm-cloud mane, lightning armor, roaring |
| 50 | 20 ナルカミ | ハタタガミ | thunder | かっこいい | storm god bird, giant lightning wings, thunderhead crown, eyes of lightning |
| 51 | 21 カゲボウ | ヤミボウズ | dark | おどろおどろしい | giant shadow monk ghost covered in many talismans, many glowing grins/eyes in the hood darkness, wisp flames |
| 52 | 22 バケチョウチン | ヒャクメチョウチン | dark | おどろおどろしい | tall stacked lantern yokai with many eyes, long tongue, ghost flames |
| 53 | 23 クロネコマタ | カシャ | dark | かっこいい(妖艶) | kasha: large black cat demon with a burning cart-wheel of blue flames behind it, two flaming tails |
| 54 | 24 ドクロキシ | ガシャドクロ | dark | おどろおどろしい | towering giant skeleton samurai, cracked armor, huge skull, chains and banners |
| 55 | 25 クロガネオロチ | クロガネヤマタ | dark | おどろおどろしい (UR 極) | ultimate iron serpent with many heads (5 visible), molten violet eyes, crown, apocalyptic |
| 56 | 26 ホシウサ | ツキウサギ | light | かわいい(神秘) | moon rabbit with a crescent-moon crest and a mochi mallet, starry cape |
| 57 | 27 ヒカリホタル | ホタルヒメ | light | 癒し | firefly princess with a lantern parasol, glowing gown, gentle smile, fireflies around |
| 58 | 28 ルミナシカ | セイリンジカ | light | 癒し(神秘) | sacred crystal stag, large crystal antlers with a halo, flowers blooming where it stands |
| 59 | 29 シロガネグリフ | テンクウグリフ | light | かっこいい | heavenly griffin, golden armor, four wings, radiant |
| 60 | 30 オーロラクジラ | アマノオーロラ | light | 神秘 (UR 極) | celestial whale made of aurora and galaxy, crown, stars inside its body, serene |

## Quality loop (mandatory, same as before)
- Preview at 1×/3×/6× on dark, light, grass.
- Strict compare sheet: each evolution next to its base AND 2 reference sprites at the SAME integer scale.
- ≥3 rounds with written gap lists; hand-pixel polish where it looks geometric. The evolution must read as the same creature grown up at 1×.
- No console errors, keep per-sprite render cost similar to the bases. Only your own file; no commit.
Reply with: file path, one line per sprite, final contact sheet + compare sheet paths.
