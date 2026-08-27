# Milestone 1 Technical Analysis: Pixel Art Matrices & Procedural Asset Pipeline

**Document Version**: 1.0  
**Author**: Explorer 1 (`m1_explorer_1`)  
**Milestone**: M1 (Asset Pipeline & Sprite Sheets)  
**Date**: 2026-08-26  
**Target Module**: `js/assets.js`

---

## 1. Executive Summary & Design Goals

This document specifies the complete programmatic pixel-art sprite asset pipeline for the Classic Mario Browser & Mobile Platformer. To fulfill **Acceptance Criterion 1 (0 console errors, 0 external network requests)** and **Acceptance Criterion 3 (Rich image-based graphics for player, environment, enemies, and collectibles)**:

1. **Zero External File Dependencies**: All visual assets are procedurally generated in memory using HTML5 Canvas 2D rasterization. There are no `.png`, `.jpg`, or remote CDN files to fetch, eliminating 404 network errors, CORS restrictions when running via `file://`, and asynchronous image decode timing bugs.
2. **Authentic 8-Bit Pixel Art Aesthetics**: Every sprite is designed on an authentic $16 \times 16$ pixel matrix utilizing classic NES-era color palettes (Mario red/blue/peach, Goomba earthy tones, shining golden question blocks and spinning coins, lush grass-topped ground, green warp pipes, and stone castles).
3. **Compact Indexed String Encoding**: Sprites are represented as arrays of 16 strings of 16 characters each. Each character maps to a defined palette key (e.g., `.` = transparent, `R` = Red, `B` = Brown, `S` = Skin, `L` = Blue, `Y` = Yellow, `W` = White, `K` = Black).
4. **Pre-rendered Off-screen Canvas Caching**: At boot (`window.GameAssets.init()`), the pipeline rasterizes all sprite matrices to individual $16 \times 16$ offscreen `<canvas>` elements (and pre-flipped horizontal mirrors), storing them in a synchronous lookup dictionary for $O(1)$ fast rendering during the 60 FPS game loop.

---

## 2. Color Palettes Specification

To provide crisp, vibrant retro aesthetics, the asset generator utilizes modular palette tables:

### 2.1 Mario & Entity Palettes

| Token | Name | Hex Code | Usage |
|---|---|---|---|
| `.` | Transparent | `rgba(0,0,0,0)` | Alpha 0 background |
| `R` | Mario Red | `#E52521` | Cap, shirt, sleeves |
| `S` | Skin / Peach | `#FDB813` | Face, ears, hands |
| `B` | Dark Brown / Hair | `#6B3800` | Hair, mustache, shoes, pupil |
| `L` | Overalls Blue | `#0026FF` | Overalls, straps |
| `Y` | Buckle Yellow | `#FFD700` | Overall buttons |
| `W` | Highlight White | `#FFFFFF` | Eye glimmer, glove highlights |
| `K` | Pure Black | `#000000` | Deep outlines, soles |

### 2.2 Goomba Palette

| Token | Name | Hex Code | Usage |
|---|---|---|---|
| `.` | Transparent | `rgba(0,0,0,0)` | Alpha 0 background |
| `D` | Cap Dark Brown | `#8B2500` | Cap top, shadow outline |
| `C` | Cap Red-Brown | `#B84418` | Main mushroom cap |
| `T` | Stem / Tan | `#FCE0A8` | Face / belly stem |
| `K` | Eye / Pupil Black| `#000000` | Eyes, brows, feet |
| `W` | Eye White | `#FFFFFF` | Sclera / eye whites |

### 2.3 Coin & Item Palettes

| Token | Name | Hex Code | Usage |
|---|---|---|---|
| `.` | Transparent | `rgba(0,0,0,0)` | Alpha 0 background |
| `Y` | Gold Bright | `#FFD700` | Main coin body, bright shine |
| `O` | Gold Orange | `#E69500` | Coin bevel & shaded rim |
| `D` | Gold Dark | `#8A5200` | Inner vertical slot & outline |
| `W` | White Glint | `#FFFFFF` | Specular glint highlight |

### 2.4 Tile & Environment Palettes

| Token | Name | Hex Code | Usage |
|---|---|---|---|
| `.` | Transparent | `rgba(0,0,0,0)` | Alpha 0 background |
| `G` | Grass Bright Green | `#00A800` | Top grass tufts |
| `H` | Grass Highlight | `#80D010` | Grass blade sun highlights |
| `E` | Earth Dark Brown | `#8A3300` | Soil core texture |
| `F` | Earth Light Brown| `#C84C0C` | Soil surface & brick body |
| `K` | Mortar Black | `#000000` | Brick mortar, outline |
| `W` | Mortar Highlight | `#FC9838` | Brick bevel highlight |
| `Q` | Question Gold | `#FCBC00` | Question block face |
| `U` | Used Block Gray | `#8C8C8C` | Used empty block body |
| `V` | Used Block Dark | `#505050` | Empty block shadow / screws |
| `P` | Pipe Light Green | `#00D800` | Pipe highlight vertical strip |
| `M` | Pipe Medium Green| `#00A800` | Pipe body base color |
| `N` | Pipe Dark Green | `#005000` | Pipe shadow & rim edge |
| `S` | Stone Gray Light | `#C8C8C8` | Castle brick light face |
| `T` | Stone Gray Dark | `#707070` | Castle brick dark shadow |

---

## 3. Comprehensive Pixel Art Matrix Catalog

All sprites are strictly $16 \times 16$ characters ($16$ rows of $16$ columns).

### 3.1 Player Character (Mario)

#### 1. `mario_idle` (Standing upright facing right)
```javascript
const MARIO_IDLE = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRR....",
  "...RRRRRLRRRR...",
  "..RRRRRLLLLRRR..",
  "..SS.RLYYLR.SS..",
  "..SSSLLLLLLSSS..",
  "..SSLLLLLLLLSS..",
  "....LLLL..LLLL..",
  "...BBBB....BBBB.",
  "..BBBBB....BBBBB"
];
```

#### 2. `mario_run_1` (Stride leg rear, forward foot stepping)
```javascript
const MARIO_RUN_1 = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRR....",
  "...RRRRRLRRRR...",
  "..RRRRRLLLLRRR..",
  "..SS.RLYYLR.SS..",
  "..SSSLLLLLLSSS..",
  "..SSLLLLLLLLSS..",
  "....LLLLLL......",
  "....BBBB........",
  "...BBBBB..BBBBB."
];
```

#### 3. `mario_run_2` (Passing stance, legs crossing)
```javascript
const MARIO_RUN_2 = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRR....",
  "...RRRRRLRRRR...",
  "..RRRRRLLLLRRR..",
  "..SS.RLYYLR.SS..",
  "..SSSLLLLLLSSS..",
  "..SSLLLLLLLLSS..",
  ".....LLLLLL.....",
  "....BBBBBB......",
  "...BBBBBB......."
];
```

#### 4. `mario_run_3` (Full extended stride, back leg kicked high)
```javascript
const MARIO_RUN_3 = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRR....",
  "...RRRRRLRRRR...",
  "..RRRRRLLLLRRR..",
  "..SS.RLYYLR.SS..",
  "..SSSLLLLLLSSS..",
  "..SSLLLLLLLLSS..",
  "......LLLLLL....",
  "........BBBB....",
  ".BBBBB..BBBBB..."
];
```

#### 5. `mario_jump` (Airborne jump, arm reaching up, legs splayed)
```javascript
const MARIO_JUMP = [
  "........SS......",
  ".....RRRRRSS....",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRRRR..",
  "...RRRRRLLLLLLR.",
  "...SS.RLYYLLSS..",
  "..SSSSLLLLLL....",
  "..SS.LLLLLLLL...",
  "....LLLL..LLLL..",
  "...BBBB....BBBB.",
  "..BBBBB.....BBBB"
];
```

#### 6. `mario_skid` (Turning around, facing viewer/brake)
```javascript
const MARIO_SKID = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRRRRR....",
  "...RRRLLLLRRR...",
  "..RRRRLLLLRRRR..",
  "..SS.LYYYYL.SS..",
  "..SSSLLLLLLSSS..",
  "..SSLLLLLLLLSS..",
  "...LLLL..LLLL...",
  "...BBBB..BBBB...",
  "..BBBBB..BBBBB.."
];
```

#### 7. `mario_flag` (Grabbing flagpole, arms wrapped around pole)
```javascript
const MARIO_FLAG = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBBSSBS.....",
  "...BSBSSSBSBS...",
  "...BSBBSSSBSBS..",
  "...BBBSSSSBBBB..",
  ".....SSSSSSSS...",
  "....RRRRLRRR....",
  "...RRRRRLRRRR...",
  "..RRRRRLLLLRRR..",
  "..SSSRLYYLR.....",
  "..SSSSLLLLL.SS..",
  "...SSLLLLLLSSS..",
  "....LLLLLLLLSS..",
  "....BBBBBB......",
  "...BBBBBBB......"
];
```

#### 8. `mario_die` (Shocked front-facing defeat pose)
```javascript
const MARIO_DIE = [
  ".....RRRRR......",
  "....RRRRRRRRR...",
  "....BBSSSBSB....",
  "...BSBSSSBSBS...",
  "...BSBSSSBSBS...",
  "...BBBSSSSBBB...",
  "....SSSSSSSS....",
  "...SSRRRRRRSS...",
  "..SSSSRRRRSSSS..",
  "..SS.RRLLRR.SS..",
  ".....RRYYRR.....",
  "....LLLLLLLL....",
  "...LLLLLLLLLL...",
  "...LLLL..LLLL...",
  "...BBBB..BBBB...",
  "..BBBBB..BBBBB.."
];
```

---

### 3.2 Enemies (Goomba)

#### 1. `goomba_walk_1` (Left foot extended forward)
```javascript
const GOOMBA_WALK_1 = [
  "......DDDD......",
  "....DDCCCCDD....",
  "...DCCCCCCCCD...",
  "..DCCCCCCCCCCD..",
  ".DCCCCCCCCCCCCD.",
  ".DCCKWWCCWWKCCD.",
  "DCCCKWWCCWWKCCCD",
  "DCCCKWWCCWWKCCCD",
  "DCCCCKKCCKKCCCCD",
  "DCCCTTTTTTTTCCCD",
  ".DTTTTTTTTTTTTD.",
  "..DTTTTTTTTTTD..",
  "...KKKKD.DKKKK..",
  "..KKKKKK.KKKKK..",
  "..KKKKKK.KKKK...",
  "...KKKK........."
];
```

#### 2. `goomba_walk_2` (Right foot extended forward)
```javascript
const GOOMBA_WALK_2 = [
  "......DDDD......",
  "....DDCCCCDD....",
  "...DCCCCCCCCD...",
  "..DCCCCCCCCCCD..",
  ".DCCCCCCCCCCCCD.",
  ".DCCKWWCCWWKCCD.",
  "DCCCKWWCCWWKCCCD",
  "DCCCKWWCCWWKCCCD",
  "DCCCCKKCCKKCCCCD",
  "DCCCTTTTTTTTCCCD",
  ".DTTTTTTTTTTTTD.",
  "..DTTTTTTTTTTD..",
  "..KKKKD.DKKKK...",
  "..KKKKK.KKKKKK..",
  "...KKKK.KKKKKK..",
  ".........KKKK..."
];
```

#### 3. `goomba_squash` (Flattened stomped pancake)
```javascript
const GOOMBA_SQUASH = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....DDDDDDDD....",
  "..DDCCCCCCCCDD..",
  ".DCCKWWCCWWKCCD.",
  "DCCCCKKCCKKCCCCD",
  "DCCCTTTTTTTTCCCD",
  "DTTTTTTTTTTTTTTD",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK"
];
```

---

### 3.3 Collectibles (Coin)

#### 1. `coin_1` (Front face - Full round coin with center slot)
```javascript
const COIN_1 = [
  ".....OOOOOO.....",
  "...OOYYYYYYOO...",
  "..OYYYYWWYYYYO..",
  ".OYYYWWOODDYYYO.",
  ".OYYWWO...DDYYO.",
  "OYYWW.....DDYYO",
  "OYYWW.....DDYYO",
  "OYYWW.....DDYYO",
  "OYYWW.....DDYYO",
  "OYYWW.....DDYYO",
  ".OYYWWO...DDYYO.",
  ".OYYYWWOODDYYYO.",
  "..OYYYYWWYYYYO..",
  "...OOYYYYYYOO...",
  ".....OOOOOO.....",
  "................"
];
```

#### 2. `coin_2` (3/4 turn - 12px wide oval)
```javascript
const COIN_2 = [
  "......OOOO......",
  "....OOYYYYOO....",
  "...OYYWWYYDYO...",
  "..OYWW..ODDYYO..",
  "..OYWW..ODDYYO..",
  ".OYWW...ODDYYO..",
  ".OYWW...ODDYYO..",
  ".OYWW...ODDYYO..",
  ".OYWW...ODDYYO..",
  ".OYWW...ODDYYO..",
  "..OYWW..ODDYYO..",
  "..OYWW..ODDYYO..",
  "...OYYWWYYDYO...",
  "....OOYYYYOO....",
  "......OOOO......",
  "................"
];
```

#### 3. `coin_3` (Side edge - 6px thin profile)
```javascript
const COIN_3 = [
  ".......OO.......",
  "......OYYO......",
  ".....OYYDYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYWWYO.....",
  ".....OYYDYO.....",
  "......OYYO......",
  ".......OO.......",
  "................"
];
```

#### 4. `coin_4` (3/4 back turn)
```javascript
const COIN_4 = [
  "......OOOO......",
  "....OOYYYYOO....",
  "...OYDYYWWYYO...",
  "..OYYDDO..WWYO..",
  "..OYYDDO..WWYO..",
  "..OYYDDO...WWYO.",
  "..OYYDDO...WWYO.",
  "..OYYDDO...WWYO.",
  "..OYYDDO...WWYO.",
  "..OYYDDO...WWYO.",
  "..OYYDDO..WWYO..",
  "..OYYDDO..WWYO..",
  "...OYDYYWWYYO...",
  "....OOYYYYOO....",
  "......OOOO......",
  "................"
];
```

---

### 3.4 Environment & Tiles

#### 1. `tile_ground` (Top ground with grass layer)
```javascript
const TILE_GROUND = [
  "HHHHGGGGHHHHGGGG",
  "GGGGHHHHGGGGHHHH",
  "GGGGGGGGGGGGGGGG",
  "GG.GG..GG..GG.GG",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEFFFFEEEFFFFEEE",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEFFFFEEEFFFFEEE",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEEEEEEEEEEEEEEE"
];
```

#### 2. `tile_ground_filler` (Underground / deep dirt block)
```javascript
const TILE_GROUND_FILLER = [
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEFFFFEEEFFFFEEE",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEFFFFEEEFFFFEEE",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEFFFFEEEFFFFEEE",
  "FFFFEFFFFFEFFFFE",
  "FFEEFFEEFFEEFFEE",
  "FFEFFFFEFFFEFFFF",
  "EEEEEEEEEEEEEEEE"
];
```

#### 3. `tile_brick` (Classic Mario destructible brick block)
```javascript
const TILE_BRICK = [
  "WWWWWWWWWWWWWWWW",
  "WFFFFFFFFFFFFFWK",
  "WFFFFFFFFFFFFFWK",
  "KKKKKKKKKKKKKKKK",
  "WFFFFFFWKWFFFFFF",
  "WFFFFFFWKWFFFFFF",
  "WFFFFFFWKWFFFFFF",
  "KKKKKKKKKKKKKKKK",
  "WFFFFFFFFFFFFFWK",
  "WFFFFFFFFFFFFFWK",
  "WFFFFFFFFFFFFFWK",
  "KKKKKKKKKKKKKKKK",
  "WFFFFFFWKWFFFFFF",
  "WFFFFFFWKWFFFFFF",
  "WFFFFFFWKWFFFFFF",
  "KKKKKKKKKKKKKKKK"
];
```

#### 4. `tile_question_1` (Active Question Block - Frame 1)
```javascript
const TILE_QUESTION_1 = [
  "WWWWWWWWWWWWWWWW",
  "WQQQQQQQQQQQQQQK",
  "WQQKKKKKKKKKKQQK",
  "WQKQQQQQQQQQQKQK",
  "WQKQQKKKKKKQQKQK",
  "WQKQKKQQQQKKQKQK",
  "WQKQQQQQQQKKQKQK",
  "WQKQQQQQQKKQQKQK",
  "WQKQQQQKKKQQQKQK",
  "WQKQQQQKKKQQQKQK",
  "WQKQQQQQQQQQQKQK",
  "WQKQQQQKKKQQQKQK",
  "WQKQQQQKKKQQQKQK",
  "WQKQQQQQQQQQQKQK",
  "WQQKKKKKKKKKKQQK",
  "KKKKKKKKKKKKKKKK"
];
```

#### 5. `tile_question_2` (Active Question Block - Frame 2)
```javascript
const TILE_QUESTION_2 = [
  "WWWWWWWWWWWWWWWW",
  "WQQQQQQQQQQQQQQK",
  "WQQUUUUUUUUUUQQK",
  "WQUQQQQQQQQQQUQK",
  "WQUQQUUUUUUQUUQK",
  "WQUQUUQQQQUUQUQK",
  "WQUQQQQQQQUUQUQK",
  "WQUQQQQQQUUQUUQK",
  "WQUQQQQUUUQQQUQK",
  "WQUQQQQUUUQQQUQK",
  "WQUQQQQQQQQQQUQK",
  "WQUQQQQUUUQQQUQK",
  "WQUQQQQUUUQQQUQK",
  "WQUQQQQQQQQQQUQK",
  "WQQUUUUUUUUUUQQK",
  "KKKKKKKKKKKKKKKK"
];
```

#### 6. `tile_question_3` (Active Question Block - Frame 3)
```javascript
const TILE_QUESTION_3 = [
  "WWWWWWWWWWWWWWWW",
  "WQQQQQQQQQQQQQQK",
  "WQQWWWWWWWWWWQQK",
  "WQWQQQQQQQQQQWQK",
  "WQWQQWWWWWWQQWQK",
  "WQWQWWQQQQWWQWQK",
  "WQWQQQQQQQWWQWQK",
  "WQWQQQQQQWWQQWQK",
  "WQWQQQQWWWQQQWQK",
  "WQWQQQQWWWQQQWQK",
  "WQWQQQQQQQQQQWQK",
  "WQWQQQQWWWQQQWQK",
  "WQWQQQQWWWQQQWQK",
  "WQWQQQQQQQQQQWQK",
  "WQQWWWWWWWWWWQQK",
  "KKKKKKKKKKKKKKKK"
];
```

#### 7. `tile_empty` (Spent / Used Block with 4 corner rivets)
```javascript
const TILE_EMPTY = [
  "WWWWWWWWWWWWWWWW",
  "WUUUUUUUUUUUUUUK",
  "WUVVUUUUUUUUVVUK",
  "WUVVUUUUUUUUVVUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUUUUUUUUUUUUUUK",
  "WUVVUUUUUUUUVVUK",
  "WUVVUUUUUUUUVVUK",
  "WUUUUUUUUUUUUUUK",
  "KKKKKKKKKKKKKKKK"
];
```

#### 8. Warp Pipe Tiles (`pipe_tl`, `pipe_tr`, `pipe_bl`, `pipe_br`)
```javascript
const TILE_PIPE_TL = [
  "NNNNNNNNNNNNNNNN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NPPPPMMMMMMMMMMN",
  "NNNNNNNNNNNNNNNN"
];

const TILE_PIPE_TR = [
  "NNNNNNNNNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "MMMMMMMMNNNNNNNN",
  "NNNNNNNNNNNNNNNN"
];

const TILE_PIPE_BL = [
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM.",
  ".NPPPPMMMMMMMMM."
];

const TILE_PIPE_BR = [
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN.",
  ".MMMMMMMMNNNNNN."
];
```

#### 9. Goal Flagpole & Castle Tiles
```javascript
const TILE_FLAGPOLE_TOP = [
  "......YYYY......",
  ".....YYYYYY.....",
  "....YYYYYYYY....",
  "....YYYYYYYY....",
  ".....YYYYYY.....",
  "......YYYY......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM......."
];

const TILE_FLAGPOLE_SHAFT = [
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM.......",
  ".......MM......."
];

const TILE_FLAG = [
  "GGGGGGGG........",
  "GGGGGGGGGG......",
  "GGGGGGGGGGGG....",
  "GGGGGGGGGGGGGG..",
  "GGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGG..",
  "GGGGGGGGGGGG....",
  "GGGGGGGGGG......",
  "GGGGGGGG........",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................"
];

const TILE_CASTLE_BRICK = [
  "SSSSSSSSSSSSSSSS",
  "STTTTTTTTTTTTTTS",
  "SSSSSSSSSSSSSSSS",
  "STTTTTSSTTTTTTTS",
  "STTTTTSSTTTTTTTS",
  "SSSSSSSSSSSSSSSS",
  "STTTTTTTTTTTTTTS",
  "STTTTTTTTTTTTTTS",
  "SSSSSSSSSSSSSSSS",
  "STTTTTSSTTTTTTTS",
  "STTTTTSSTTTTTTTS",
  "SSSSSSSSSSSSSSSS",
  "STTTTTTTTTTTTTTS",
  "STTTTTTTTTTTTTTS",
  "SSSSSSSSSSSSSSSS",
  "TTTTTTTTTTTTTTTT"
];

const TILE_CASTLE_DOOR = [
  "....KKKKKKKK....",
  "..KKKKKKKKKKKK..",
  ".KKKKKKKKKKKKKK.",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKK"
];
```

---

## 4. Programmatic Asset Generator Pipeline Design (`js/assets.js`)

### 4.1 Interface Contract
Following `PROJECT.md` specification:

```javascript
window.GameAssets = {
  isReady: false,
  sprites: {}, // category -> name -> HTMLCanvasElement

  // Asynchronous init method returning a Promise
  async init() { ... },

  // Synchronous sprite fetcher
  getSprite(category, name) { ... },

  // Canvas drawing helper with automatic horizontal flip support
  drawSprite(ctx, category, name, x, y, width, height, flipX = false) { ... }
};
```

### 4.2 Rasterization Algorithm
1. Create an off-screen `<canvas width="16" height="16">`.
2. Extract 2D rendering context `ctx = canvas.getContext('2d')`.
3. Set `ctx.imageSmoothingEnabled = false`.
4. Iterate row $r \in [0..15]$, col $c \in [0..15]$.
5. Look up token character in category palette:
   - If token is `.` or null/undefined, skip (transparent pixel).
   - If token has color hex string, execute `ctx.fillStyle = color; ctx.fillRect(c, r, 1, 1);`.
6. Store canvas in `sprites[category][name]`.
7. Also generate and cache a pre-flipped mirror version in `sprites[category][name + '_flip']` by drawing to a canvas with horizontal scaling `ctx.scale(-1, 1)`.

### 4.3 Zero-Error, Headless & Network-Independent Guarantees
- **No `new Image()` or `src="data:image/..."` decode delays**: By using canvas directly as the sprite source, the sprites are instantly available synchronously after `init()` completes without waiting for asynchronous image decoding or triggering DOM security exceptions.
- **`isReady` flag**: Guaranteed set to `true` upon completion of `init()`.
- **Safe Fallback**: If an invalid sprite name is requested, `getSprite()` returns a colored fallback tile (e.g. magenta checkerboard) rather than throwing an unhandled exception or returning `null` causing canvas draw crashes.

---

## 5. Synthesis & Verification Plan

### 5.1 Verification Checklist
1. **Grid Completeness**: All 28+ sprites have exactly 16 rows and 16 columns per row.
2. **Palette Integrity**: All characters in all sprite matrices map to valid color strings in their palette dictionaries.
3. **Execution Safety**: Code executes seamlessly in Node.js (via mock canvas or pure data structure test) and browser contexts.
4. **Drawing API Robustness**: `drawSprite` handles integer and floating point positions, scales properly to any destination width/height, and handles `flipX === true`.

---
