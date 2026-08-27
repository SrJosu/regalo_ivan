# M1 Asset Pipeline & Test Compatibility Analysis Report
**V2 Iván's Birthday Gift Edition — Platformer Overhaul**

**Author**: M1 Asset Pipeline & Test Compatibility Explorer  
**Date**: 2026-08-27  
**Working Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m1_v2_explorer_3`  
**Target Module**: `js/assets.js`  

---

## 1. Executive Summary

This report provides a comprehensive, forensic investigation into the asset pipeline (`js/assets.js`), its interactions with all automated test suites, its cross-platform execution model (Node.js test runners vs. Headless Chrome CDP vs. Mobile/Desktop Browsers), and the exact refactoring strategy needed for **V2 Iván's Birthday Gift Edition**.

### Key Findings
1. **Test Suite Interaction**: The existing test suite (`test/verify_m1_assets.mjs`, `test/test_m1_adversarial.mjs`, `test/forensic_auditor_stress_test.mjs`, `test/test_tier1_features.mjs`, `test/headless_validator.mjs`, etc.) imposes strict, granular constraints on `GameAssets`:
   - Direct inspection of `GameAssets.isReady`, `GameAssets.PALETTES`, and `GameAssets.RAW_SPRITES`.
   - Exact 16x16 sprite dimensions and minimum color count thresholds (`uniqueColors >= 2` for all sprites, `uniqueColors >= 4` for player idle, `uniqueColors >= 3` for enemy and question blocks).
   - Pixel data non-emptiness (`opaqueCount > 10`).
   - Exact mathematical horizontal mirror symmetry for pre-flipped directional sprites (`_flip`).
   - High-throughput rendering (`>= 100,000` calls/sec) via pre-rendered mirror caching.
   - Non-throwing error resilience on malformed arguments, null contexts, and adversarial inputs.
2. **Zero-Network Synchronous Readiness**: Tests run in pure Node.js environments without DOM or canvas npm packages. The self-contained in-memory rasterization pipeline using `MemoryCanvas` guarantees 100% synchronous readiness (`GameAssets.isReady = true` immediately upon `init()`) with 0 external network dependencies and 0 failure vectors.
3. **Forensic Discrepancies Discovered**:
   - `MemoryContext2D.fillRect`: A sub-pixel offset calculation bug in `MemoryContext2D.fillRect` caused transformed coordinates to shift by +1px, failing forensic transform assertions.
   - `Mario jump vs. idle height`: Both `idle` and `jump` sprites currently have non-transparent pixels on row `y = 0`, causing a minor failure in forensic vertical reach assertions.
4. **V2 Overhaul Compatibility**: The upgraded visual assets (Super Iván with sunglasses & party hat, Pop Cat open/closed/squash meme enemies, Doge, Grumpy Cat, shaded gold coins, birthday cakes, and 3D environment tiles) can be seamlessly integrated into `RAW_SPRITES` and `PALETTES` without breaking any legacy aliases or API contracts.

---

## 2. Test Suite Interaction & Contract Analysis

Every test file in `test/` interacts with `GameAssets` across different lifecycle phases and validation dimensions:

| Test File | Target Lifecycle / Methods | Validation Constraints | Critical Assertions |
|---|---|---|---|
| `test/verify_m1_assets.mjs` | `init()`, `isReady`, `getSprite()`, `drawSprite()`, `createCanvas()` | - `isReady === false` before `init()`, `true` after.<br>- Returns resolved Promise.<br>- 16x16 dimensions for all required sprites.<br>- `uniqueColors >= 2`, player `uniqueColors >= 4`.<br>- Mathematical mirror symmetry for `_flip`.<br>- All category and sprite aliases resolve to identical canvas instances.<br>- Fallback checkerboard returned for unknown sprites. | - `aliasedSprite === expectedSprite`<br>- `matchesFound === 256`<br>- `analysis.opaqueCount > 10` |
| `test/test_m1_adversarial.mjs` | `RAW_SPRITES`, `PALETTES`, `getSprite()`, `drawSprite()`, `createCanvas()` | - Bounding box non-empty on all catalog sprites.<br>- Vertical row-by-row profile invariance on flipped sprites.<br>- Center of mass $Y_{\text{orig}} == Y_{\text{flip}}$ and $X_{\text{orig}} + X_{\text{flip}} == 15$.<br>- Throughput: $\ge 100,000$ draws/sec.<br>- Resilience against extreme coordinates, corrupted contexts, prototype fuzzing. | - `opsPerSec >= 100000`<br>- `x_orig + x_flip === 15.0000`<br>- `summary.failed === 0` |
| `test/forensic_auditor_stress_test.mjs` | `RAW_SPRITES`, `PALETTES`, `MemoryContext2D`, `getSprite()`, `drawSprite()` | - Every pixel char in `RAW_SPRITES` exists in referenced palette.<br>- Hex codes match `^#([0-9A-Fa-f]{6}\|[0-9A-Fa-f]{3})$`.<br>- `MemoryContext2D` transform stack (`save`, `restore`, `translate`, `scale`, `fillRect`, `drawImage`).<br>- Coin spin geometric narrowing.<br>- Goomba squash height exactly half height (8px). | - `data.length === 16`<br>- `gSquashHeight === 8`<br>- `c1Width > c2Width > c3Width` |
| `test/test_tier1_features.mjs` | `init()`, `isReady`, `getSprite()` | - Boots asset system before player / physics tests.<br>- Verifies `getSprite('player', 'idle')` and `getSprite('enemy', 'walk_1')`. | - `assert(GameAssets.isReady === true)` |
| `test/headless_validator.mjs` | `window.GameAssets`, `getSprite()` in Chrome CDP | - Real browser Canvas 2D rasterization.<br>- Zero console errors or unhandled exceptions.<br>- Palette color diversity (`colors.size >= 3`) on player, enemy, coin, tile. | - `0 Console Errors`<br>- `colors.size >= 3` |

### Required Sprites Catalog & Specifications

```
GameAssets.sprites / RAW_SPRITES:
├── player (mario)
│   ├── idle           (16x16, flippable, uniqueColors >= 4, party cap & sunglasses)
│   ├── run_1          (16x16, flippable, uniqueColors >= 4)
│   ├── run_2          (16x16, flippable, uniqueColors >= 4)
│   ├── run_3          (16x16, flippable, uniqueColors >= 4)
│   ├── jump           (16x16, flippable, uniqueColors >= 4, raised fist reaching y=0)
│   ├── skid           (16x16, flippable, uniqueColors >= 4)
│   ├── flag           (16x16, flippable, uniqueColors >= 4)
│   └── die            (16x16, non-flippable, uniqueColors >= 4)
├── enemy (goomba, popcat, doge, grumpy)
│   ├── walk_1         (16x16, non-flippable, uniqueColors >= 3, Pop Cat mouth closed)
│   ├── walk_2         (16x16, non-flippable, uniqueColors >= 3, Pop Cat mouth open)
│   ├── squash         (16x16, non-flippable, height = 8px, Pop Cat squashed)
│   ├── popcat_close   (16x16, alias / dedicated sprite)
│   ├── popcat_open    (16x16, alias / dedicated sprite)
│   ├── popcat_squash  (16x16, alias / dedicated sprite)
│   ├── doge_walk_1    (16x16, meme enemy)
│   ├── doge_walk_2    (16x16, meme enemy)
│   ├── doge_squash    (16x16, meme enemy squashed)
│   ├── grumpy_walk_1  (16x16, meme enemy)
│   ├── grumpy_walk_2  (16x16, meme enemy)
│   └── grumpy_squash  (16x16, meme enemy squashed)
├── item (coin, cake)
│   ├── coin_1         (16x16, non-flippable, uniqueColors >= 3, 3D wide face)
│   ├── coin_2         (16x16, non-flippable, uniqueColors >= 3, 3D medium angle)
│   ├── coin_3         (16x16, non-flippable, uniqueColors >= 3, 3D edge slit)
│   ├── coin_4         (16x16, non-flippable, uniqueColors >= 3, 3D reverse angle)
│   └── cake           (16x16, non-flippable, birthday cake bonus item)
└── tile
    ├── ground         (16x16, grass top + shaded earth)
    ├── ground_filler  (16x16, underground sediment)
    ├── brick          (16x16, 3D beveled mortar brick)
    ├── question_1     (16x16, glowing gold question block frame 1)
    ├── question_2     (16x16, glowing gold question block frame 2)
    ├── question_3     (16x16, glowing gold question block frame 3)
    ├── empty          (16x16, depleted metallic block with corner rivets)
    ├── pipe_tl        (16x16, pipe top-left rim with gloss highlight)
    ├── pipe_tr        (16x16, pipe top-right rim with shadow bevel)
    ├── pipe_bl        (16x16, pipe body-left with emerald shading)
    ├── pipe_br        (16x16, pipe body-right with dark green shadow)
    ├── flag           (16x16, celebratory goal flag cloth)
    ├── flagpole_top   (16x16, gold finial ball & top shaft)
    ├── flagpole_shaft (16x16, metallic emerald pole section)
    ├── castle_brick   (16x16, fortress gray stone with birthday ribbon accents)
    └── castle_door    (16x16, arched entrance doorway)
```

---

## 3. 100% Synchronous Readiness Architecture

### The Problem with External Asynchronous Loaders
Standard web games often load external PNG or SVG files using asynchronous `Image()` constructors (`img.onload = ...; img.src = 'assets/mario.png'`). In headless test environments (Node.js test runners without browser context), this architecture immediately breaks because:
1. Node.js has no native `Image` or `window.document` object without third-party npm packages.
2. Network or disk I/O introduces non-deterministic delays, causing race conditions where tests run before assets finish loading.
3. Network failures or missing files cause unhandled rejections and fail CI/CD integrity gates.

### The In-Memory Procedural Canvas Solution
`js/assets.js` solves this with zero external npm dependencies:

```
                  ┌──────────────────────────────────────────────┐
                  │              GameAssets.init()               │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  Browser Environment  │                       │  Node.js Environment  │
     │ typeof document!=='undefined'                 │ typeof document==='undefined'
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  HTMLCanvasElement    │                       │     MemoryCanvas      │
     │ document.createElement│                       │  Uint8ClampedArray    │
     │ ('canvas')            │                       │  MemoryContext2D      │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ Synchronous Matrix Rasterization Loop │
                     │   - Rasterize 16x16 RAW_SPRITES       │
                     │   - Pre-generate _flip mirror caches  │
                     │   - Store in this.sprites[cat][name]  │
                     │   - Set this.isReady = true           │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ Returns Promise.resolve() Immediately │
                     │   (0ms latency, 100% Deterministic)   │
                     └───────────────────────────────────────┘
```

1. **Dual Canvas Backing**:
   - In Browser / Headless CDP: Uses `document.createElement('canvas')` with native 2D context.
   - In Node.js: Uses `MemoryCanvas` with `Uint8ClampedArray(w * h * 4)` and `MemoryContext2D`.
2. **Deterministic Lifecycle**: `this.isReady = true` is assigned synchronously during the loop before returning `Promise.resolve()`. Any synchronous check `if (GameAssets.isReady)` or asynchronous `await GameAssets.init()` succeeds immediately.
3. **Zero Network Calls**: 100% of graphics are defined directly in code matrices with NES 8-bit / 16-bit color palettes.

---

## 4. Category & Sprite Alias Taxonomy & Normalization

The alias system allows backward-compatible querying across various naming conventions.

### Category Normalizer Table

| Input Category Alias | Normalized Category | Purpose / Compatibility |
|---|---|---|
| `'mario'` | `'player'` | Legacy NES Mario reference |
| `'player'` | `'player'` | Standard engine canonical category |
| `'ivan'` | `'player'` | V2 Iván Birthday Hero reference |
| `'hero'` | `'player'` | Generic entity alias |
| `'enemy'` | `'enemy'` | Standard enemy canonical category |
| `'enemies'` | `'enemy'` | Plural form alias |
| `'goomba'` | `'enemy'` | Legacy enemy reference |
| `'popcat'` | `'enemy'` | V2 Meme enemy reference |
| `'doge'` | `'enemy'` | V2 Meme enemy reference |
| `'grumpy'` | `'enemy'` | V2 Meme enemy reference |
| `'item'` | `'item'` | Standard collectible canonical category |
| `'items'` | `'item'` | Plural form alias |
| `'coin'` | `'item'` | Legacy coin reference |
| `'coins'` | `'item'` | Plural form alias |
| `'collectible'` | `'item'` | Generic collectible alias |
| `'collectibles'` | `'item'` | Plural form alias |
| `'cake'` | `'item'` | V2 Birthday cake bonus item reference |
| `'tile'` | `'tile'` | Standard tile canonical category |
| `'tiles'` | `'tile'` | Plural form alias |
| `'environment'` | `'tile'` | Environment tile alias |

### Sprite Name Alias Table

| Category | Input Sprite Name | Resolved Sprite Name |
|---|---|---|
| `player` | `'dead'` | `'die'` |
| `player` | `'mario'` | `'idle'` |
| `player` | `'ivan'` | `'idle'` |
| `player` | `'walk_1'` | `'run_1'` |
| `player` | `'walk_2'` | `'run_2'` |
| `player` | `'walk_3'` | `'run_3'` |
| `enemy` | `'goomba_walk_1'` | `'walk_1'` |
| `enemy` | `'goomba_walk_2'` | `'walk_2'` |
| `enemy` | `'goomba_squash'` | `'squash'` |
| `enemy` | `'squashed'` | `'squash'` |
| `enemy` | `'walk1'` | `'walk_1'` |
| `enemy` | `'walk2'` | `'walk_2'` |
| `enemy` | `'popcat_1'` | `'walk_1'` |
| `enemy` | `'popcat_2'` | `'walk_2'` |
| `item` | `'coin1'` | `'coin_1'` |
| `item` | `'coin2'` | `'coin_2'` |
| `item` | `'coin3'` | `'coin_3'` |
| `item` | `'coin4'` | `'coin_4'` |
| `item` | `'gold_coin'` | `'coin_1'` |
| `item` | `'birthday_cake'` | `'cake'` |
| `tile` | `'question_empty'` | `'empty'` |
| `tile` | `'empty_block'` | `'empty'` |
| `tile` | `'pole_top'` | `'flagpole_top'` |
| `tile` | `'pole_shaft'` | `'flagpole_shaft'` |
| `tile` | `'flag_cloth'` | `'flag'` |
| `tile` | `'groundfiller'` | `'ground_filler'` |
| `tile` | `'dirt'` | `'ground_filler'` |
| `tile` | `'castle'` | `'castle_brick'` |
| `tile` | `'door'` | `'castle_door'` |

### Directional `_flip` Suffix Processing Rule
For flippable directional sprites (such as player animations), sprite requests often append `_flip` (e.g. `'idle_flip'`, `'run_1_flip'`, `'dead_flip'`).
The lookup pipeline must:
1. Strip the `_flip` suffix: `base = name.slice(0, -5)`.
2. Apply alias translation on the base name: `resolvedBase = SPRITE_ALIASES[cat][base] || base` (e.g. `'dead'` $\rightarrow$ `'die'`).
3. Re-append the `_flip` suffix: `resolvedBase + '_flip'` (e.g. `'die_flip'`).
4. Return the pre-cached flipped canvas directly from `this.sprites[cat][flipName]`.

---

## 5. Discovered Bugs & Forensic Corrections

### 1. `MemoryContext2D.fillRect` Transform Calculation Bug
**Issue**: In `js/assets.js` lines 836–842, non-identity transformed `fillRect` evaluated sample points as:
```javascript
const centerX = x + px + 0.5;
const centerY = y + py + 0.5;
const tx = this._matrix[0] * centerX + this._matrix[2] * centerY + this._matrix[4];
const ty = this._matrix[1] * centerX + this._matrix[3] * centerY + this._matrix[5];
targetX = Math.floor(tx);
targetY = Math.floor(ty);
```
When `translate(10, 10)` and `scale(2, 2)` are applied to `fillRect(0, 0, 2, 2)`:
- `centerX = 0 + 0 + 0.5 = 0.5`
- `tx = 2 * 0.5 + 10 = 11` $\rightarrow$ `targetX = 11`.
- The top-left corner was drawn at `(11, 11)` instead of `(10, 10)`, causing `forensic_auditor_stress_test.mjs` check 5 to fail.

**Correction**:
Compute the destination rectangle bounding box directly by transforming the vertices:
```javascript
fillRect(x, y, w, h) {
  const [r, g, b, a] = parseColorHex(this.fillStyle);
  const isIdentity = (
    this._matrix[0] === 1 && this._matrix[1] === 0 &&
    this._matrix[2] === 0 && this._matrix[3] === 1 &&
    this._matrix[4] === 0 && this._matrix[5] === 0
  );

  if (isIdentity) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const targetX = x + px;
        const targetY = y + py;
        if (targetX >= 0 && targetX < this.canvas.width && targetY >= 0 && targetY < this.canvas.height) {
          const idx = (targetY * this.canvas.width + targetX) * 4;
          this.canvas.data[idx] = r;
          this.canvas.data[idx + 1] = g;
          this.canvas.data[idx + 2] = b;
          this.canvas.data[idx + 3] = a;
        }
      }
    }
  } else {
    // Transform bounding box corners
    const x0 = this._matrix[0] * x + this._matrix[2] * y + this._matrix[4];
    const y0 = this._matrix[1] * x + this._matrix[3] * y + this._matrix[5];
    const x1 = this._matrix[0] * (x + w) + this._matrix[2] * (y + h) + this._matrix[4];
    const y1 = this._matrix[1] * (x + w) + this._matrix[3] * (y + h) + this._matrix[5];
    const minX = Math.max(0, Math.floor(Math.min(x0, x1)));
    const maxX = Math.min(this.canvas.width - 1, Math.ceil(Math.max(x0, x1)) - 1);
    const minY = Math.max(0, Math.floor(Math.min(y0, y1)));
    const maxY = Math.min(this.canvas.height - 1, Math.ceil(Math.max(y0, y1)) - 1);

    for (let targetY = minY; targetY <= maxY; targetY++) {
      for (let targetX = minX; targetX <= maxX; targetX++) {
        const idx = (targetY * this.canvas.width + targetX) * 4;
        this.canvas.data[idx] = r;
        this.canvas.data[idx + 1] = g;
        this.canvas.data[idx + 2] = b;
        this.canvas.data[idx + 3] = a;
      }
    }
  }
}
```

### 2. Mario / Iván Jump vs. Idle Vertical Reach
**Issue**: In `forensic_auditor_stress_test.mjs` line 235:
`assert(mJumpTop < mIdleTop, 'Mario jump pose extends higher than idle pose')`
Currently, both `idle` and `jump` matrices define cap pixels starting at row `y = 0`. As a result, `mJumpTop === 0` and `mIdleTop === 0`, causing the `<` check to fail.

**Correction**:
- Set `idle` cap to start at row `y = 1` (row 0 is `"................"`).
- Set `jump` raised fist / cap to start at row `y = 0` (`"........SS......"`).
- This ensures `mJumpTop = 0 < mIdleTop = 1`, fully satisfying the forensic assertion.

---

## 6. Exact Refactoring Strategy for `js/assets.js`

### Strategy Overview
1. **Preserve Exact Public API**:
   - `GameAssets.isReady: boolean`
   - `GameAssets.init(): Promise<void>`
   - `GameAssets.getSprite(category: string, name: string): HTMLCanvasElement | MemoryCanvas`
   - `GameAssets.drawSprite(ctx, category, name, x, y, width, height, flipX): void`
   - `GameAssets.createCanvas(w, h): HTMLCanvasElement | MemoryCanvas`
   - `GameAssets.PALETTES` (dictionary of color palettes)
   - `GameAssets.RAW_SPRITES` (dictionary of 16x16 matrix arrays)
2. **Upgrade Palettes for V2 Birthday & Meme Theme**:
   - `mario` / `ivan`: Cap red `#E52521`, skin peach `#FDB813`, hair/mustache brown `#6B3800`, sunglasses dark `#111111`, sunglasses glare `#00F0FF`, party hat gold `#FFD700`, party hat pompom `#FF007F`, overalls blue `#0026FF`.
   - `goomba` / `popcat`: Pop cat peach tan `#F5D6B4`, mouth interior ruby `#C8283C`, teeth/eyes white `#FFFFFF`, pupil black `#000000`, ear shadow `#D49B74`.
   - `doge`: Tan gold `#E5A83B`, cream muzzle `#FFF3D1`, nose/eyes `#1B120C`, ear shadow `#A86E1C`.
   - `grumpy`: Snow white `#FFFFFF`, dark taupe face mask `#54433A`, icy blue eyes `#29B6F6`, pink nose `#FF8DA1`.
   - `coin`: Pure gold `#FFD700`, orange bevel `#E69500`, dark shadow `#8A5200`, specular glare `#FFFFFF`.
   - `cake`: Cream frosting `#FFF8DC`, strawberry base `#E53935`, chocolate layer `#4E342E`, candle blue `#29B6F6`, flame gold `#FFD700`.
   - `tile`: Grass green `#00A800`, grass neon highlight `#80D010`, soil brown `#8A3300`, soil light `#C84C0C`, mortar black `#000000`, brick highlight `#FC9838`, question gold `#FCBC00`, pipe emerald `#00D800`, pipe base `#00A800`, pipe shadow `#005000`, castle light `#D8D8D8`, castle shadow `#606060`, banner pink `#FF4081`, banner gold `#FFD700`.
3. **Upgrade Sprite Matrices in `RAW_SPRITES`**:
   - Super Iván: Sunglasses + birthday cap on `idle`, `run_1..3`, `jump`, `skid`, `flag`, `die`.
   - Meme Enemies:
     - `walk_1`: Pop Cat (mouth closed).
     - `walk_2`: Pop Cat (mouth wide open in famous "O" shape).
     - `squash`: Pop Cat (squashed 8px pancake with tongue/expression).
     - Additional dedicated meme sprites for Doge and Grumpy Cat.
   - 3D Shaded Environment Tiles & Sparkling 4-frame coins + birthday cake.
4. **Fix MemoryContext2D Transform Engine**:
   - Replace flawed `fillRect` center point calculation with exact bounding box vertex projection.
5. **Ensure 100% Test Pass Rate**:
   - Run `verify_m1_assets.mjs`, `test_m1_adversarial.mjs`, `forensic_auditor_stress_test.mjs`, and Tier 1–4 suites to confirm 0 failures.

---

## 7. Verification Method

To independently verify the asset pipeline refactoring:

1. **Verify Unit & Life-Cycle Tests**:
   ```bash
   node test/verify_m1_assets.mjs
   ```
   *Expected Output*: `ALL MILESTONE 1 ASSET TESTS PASSED (0 failures)`.

2. **Verify Adversarial Stress Harness**:
   ```bash
   node test/test_m1_adversarial.mjs
   ```
   *Expected Output*: `ADVERSARIAL HARNESS COMPLETED: 0 Failures`.

3. **Verify Forensic Integrity Stress Test**:
   ```bash
   node test/forensic_auditor_stress_test.mjs
   ```
   *Expected Output*: `FORENSIC AUDIT SUMMARY: 0 checks FAILED`.

4. **Verify Engine & Feature Test Tiers**:
   ```bash
   node test/test_tier1_features.mjs
   node test/test_tier2_boundary.mjs
   node test/test_tier3_combos.mjs
   node test/test_tier4_workload.mjs
   ```
   *Expected Output*: 100% Passed across all test tiers.

5. **Verify Headless Chrome CDP Live Game Validation**:
   ```bash
   node test/headless_validator.mjs
   ```
   *Expected Output*: `0 Console Errors, 0 Runtime Exceptions, 100% criteria passed`.
