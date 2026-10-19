# 封札モンスターズ — Monster Illustration Brief (shared by all illustrators)

## Goal
The game's monsters are being redesigned. Current art is chibi/cute and too simple. The client wants monsters in the spirit of **trading-card-game monster art (Yu-Gi-Oh-like)**: more realistic proportions, cool, dramatic, detailed, a bit fierce/majestic — while still readable at small sizes and 100% ORIGINAL (do not imitate any existing TCG/Pokémon creature designs).

## Technical interface (must match exactly)
- Write ONE plain-JS file (path given in your task). It must only do:
  ```js
  window.MONART = window.MONART || {};
  MONART[<id>] = () => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">…</svg>`;
  ```
- **viewBox 0 0 120 120**, TRANSPARENT background (no full-frame background rect/sky). The game draws the backdrop. The creature should fill ~75–90% of the box, centered, with a little ground shadow ellipse at the bottom allowed.
- The creature **faces LEFT** (3/4 view toward the left). The game mirrors it for the player's side.
- All `id`s inside `<defs>` MUST be prefixed `m<id>-` (e.g. `m04-scale`, `m04-glow`) — many SVGs share one page.
- Budget: aim ≤ 10 KB per monster string (hard max 16 KB). No external images, no <image>, no fonts/text, no scripts, no CSS animations.
- Filters: allowed but light (one small feGaussianBlur glow per monster max). NO feTurbulence/feDisplacementMap (too slow when 26 cards render in a grid).
- Must look good both at ~100px wide (card grid thumbnails) and ~450px (battle). Keep the silhouette strong and readable at small size.

## Unified rendering style (all three illustrators must match)
- Painted-cel look: bold dark outlines (#1a1426-ish, stroke-width ~1.2–2.2 varying, round joins), 3-tone cel shading per material (base, shadow, highlight) plus 1–2 linearGradient/radialGradient for volume.
- Light source: upper-left. Rim light on the right/back edges in the type's accent color.
- Materials rendered distinctly: scales, fur tufts (jagged strands), feathers, crystal facets, armor plates, glowing energy (use a soft radial glow + bright core).
- Eyes: sharp, intense, glowing slightly (no big cute round eyes, no blush cheeks, no smiling 'w' mouths). Fangs/claws welcome.
- Dynamic poses: crouching, rearing, wings spread, coiling. Add type energy FX that belong to the creature (embers, water arcs, leaves, sparks, shadow wisps, light motes) — small, not covering the body.
- Rarity scaling: C = compact but still cool; R = more detail; SR = epic, larger wingspan/aura; UR = legendary spectacle.
- Type palettes (use as anchors): fire #ea6436/#ffc15a + dark reds; water #3a88de/#a6dcff + deep navy; grass #3f9f58/#c3ea8e + bark browns; thunder #e0ac14/#fff1a0 + slate/steel; dark #6e4fcf/#cbbaff + near-black violet; light #e57aaa/#fff0f6 + pearl white/gold.

## Monster list (keep id, name, type; redesign look to the concept)
| id | name | type | rarity | concept |
|---|---|---|---|---|
| 1 | ヒノコロ | fire | C | young fire fox-beast, ember-tipped fur, burning tail, lean and alert |
| 2 | ボッポン | fire | C | small phoenix-raptor, hawk beak, smoldering feathers, talons |
| 3 | カエンジシ | fire | R | lion with a roaring blazing mane, armored brow plate, mid-roar |
| 4 | ホムラドラ | fire | SR | volcanic dragon, obsidian scales with glowing magma cracks, wings spread |
| 5 | シズクン | water | C | water elemental spirit: liquid humanoid wisp with glowing core and droplet crest |
| 6 | アワフグ | water | C | armored spiked pufferfish with bioluminescent spots, puffed and bristling |
| 7 | ナミウルフ | water | R | wolf formed of breaking waves, foam mane, fin-like ears, running |
| 8 | ミズチ | water | SR | eastern river dragon, long coiling serpent body, whiskers, holds a glowing pearl |
| 9 | メブキン | grass | C | forest imp/mandrake: bark skin, leaf horns, root legs, glowing green eyes |
| 10 | コケモチ | grass | C | moss-covered stone tortoise, shell like a mossy boulder with tiny flowers |
| 11 | ハナトカゲ | grass | R | frilled lizard whose neck frill is petals, thorny spine, flicking tongue |
| 12 | モリノヌシ | grass | SR | ancient forest stag guardian, antlers are living branches with leaves, glowing runes |
| 13 | ビリタマ | thunder | C | armored thunder pill-beetle curled half-open, arcs crackling between plates |
| 14 | イナビー | thunder | C | storm hornet, metallic carapace, lightning-charged stinger, blurred wings |
| 15 | ライジュウマル | thunder | R | raijū thunder-beast (wolf/wildcat), fur of lightning, zigzag tail |
| 16 | ナルカミ | thunder | SR | thunderbird: huge wings with lightning feathers, crested head, storm aura |
| 17 | カゲボウ | dark | C | shadow wraith in a tattered hood, glowing slit eyes, wispy lower body, claws |
| 18 | ヨルコウモ | dark | C | night bat demon, huge ears, fangs, membrane wings half-open |
| 19 | ユメクイ | dark | R | baku dream-eater: tapir/elephant chimera with starry night hide, trunk curling a dream orb |
| 20 | ヤミノツカイ | dark | SR | dark messenger: horned winged knight-demon, cape of shadow, glowing sigil |
| 21 | ヒカリン | light | C | light wisp-fairy, crystal wings, halo, small but radiant |
| 22 | ホシウサ | light | C | star-rabbit with a crystalline horn and constellation markings, leaping |
| 23 | ルミナシカ | light | R | luminous deer with crystal antlers, halo, trailing motes |
| 24 | ミカガミ | light | SR | mirror queen: armored angelic figure with a mirror shield and radiant wings |
| 25 | オーロラクジラ | light | UR | colossal sky whale with aurora ribbons trailing, celestial markings, crown-like ridge |
| 26 | クロガネオロチ | dark | UR | iron-scaled multi-headed serpent (3 heads visible), molten violet eyes, legendary menace |

## Quality loop (required)
Make a preview page in your own scratch folder that loads your file and shows each of your monsters at 100px and 450px, on a dark (#1d2048) and a light (#e8f6cf) backdrop, plus inside a card-like frame. Screenshot with Playwright/Chromium (preinstalled; `require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')`, do NOT run `playwright install`). Read the screenshots, critique like a TCG art director (silhouette, anatomy, detail, consistency with the shared style, readability small), and iterate at least 3 rounds. Check no console errors and byte sizes.
