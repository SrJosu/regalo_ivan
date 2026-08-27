# V2 Specification Report: Iván's Birthday Gift Edition Overhaul

> **Version**: 2.0.0-PROPOSED  
> **Status**: Specification Finalized & Mined  
> **Target Audience**: Iván (Birthday Honoree & Player)  
> **Target Environment**: Modern Desktop & Mobile Browsers (Android 360x800 viewport, Touch + Keyboard)  
> **Authoritative Sources**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, Existing Codebase (`js/*.js`, `css/*.css`, `index.html`, `test/*.mjs`)

---

## 1. Executive Summary & Objective

The goal of V2 is to transform the classic Mario platformer prototype into a hilarious, visually rich, and memorable **Birthday Gift Edition for "Iván"**. 

The user has granted **full creative freedom** to innovate on humor, memes, and publicity style, while strictly adhering to critical engineering constraints:
1. **Zero Console Errors / 100% Robustness** in headless Chrome CDP and mobile browsers.
2. **Preservation of Core Mechanics**: DOM multi-touch concurrency (`#btn-left`, `#btn-right`, `#btn-jump`), 60 FPS physics, AABB collision, coin collection, stomp mechanics, and flagpole victory sequence.
3. **Graceful Asset & Audio Fallbacks**: The game must remain playable and never crash, even in headless/offline/Node.js testing environments.

---

## 2. System Architecture & Compatibility Contracts

All V2 modules must maintain API contract compatibility with the existing architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              index.html                                │
│   [HUD: MARIO/IVÁN, SCORE, COINS, WORLD, TIME, LIVES]                  │
│   [Canvas 360x800]  [DOM Touch Controls Overlay]  [Victory DOM Modal]   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌──────────────┬─────────────┼──────────────┬──────────────┐
       ▼              ▼             ▼              ▼              ▼
┌──────────────┐┌────────────┐┌────────────┐┌────────────┐┌─────────────┐
│ js/assets.js ││js/input.js ││js/physics.js││js/audio.js││js/level.js  │
│ Rich Sprites ││Multi-Touch ││Kinematics   ││Meme Web-  ││Birthday Map │
│ & Fallbacks  ││& Keyboard  ││& Collision  ││Audio Synth││Easter Eggs  │
└──────────────┘└────────────┘└────────────┘└────────────┘└─────────────┘
       │              │             │              │              │
       └──────────────┴──────┬──────┴──────────────┴──────────────┘
                             ▼
                    ┌─────────────────┐
                    │ js/entities.js  │
                    │ Meme Goombas    │
                    │ Confetti/Text   │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   js/game.js    │
                    │ Loop & States   │
                    │ WIN / Reward UI │
                    └─────────────────┘
```

### Interface Contracts
1. **`window.GameAssets`**:
   - `isReady`: `boolean`
   - `init(): Promise<void>`
   - `getSprite(category: string, name: string): HTMLCanvasElement | Image`
   - `drawSprite(ctx, category, name, x, y, width, height, flipX?)`
2. **`window.GameAudio`**:
   - `init(): void`, `unlockAudio(): void`
   - `playJump(): void`, `playCoin(): void`, `playStomp(): void`, `playBump(): void`, `playDeath(): void`, `playWin(): void`, `playAirhorn?(): void`, `playBruh?(): void`
3. **`window.GameInput`**:
   - `init(domContainer): void`, `getState(): InputState`, `update(): void`
4. **`window.GamePhysics`**:
   - `applyKinematics(entity, dt, input)`, `resolveMapCollisions(entity, map, dt)`, `checkAABB(a, b)`
5. **`window.GameLevel`**:
   - `createLevel(): Level`, `Level.prototype.draw()`, `Level.prototype.update()`
6. **`window.GameEntities`**:
   - `createPlayer()`, `createGoomba()`, `createCoin()`, `createParticle()`, `GoalFlag`, `BlockCoin`

---

## 3. Requirement Specifications

### R1. Gráficos Mejorados y Realistas (Rich Stylized External / Procedural Assets)
* **Objective**: Upgrade basic 16x16 color-letter matrices to high-quality, rich stylized assets with shading, specular highlights, textures, and details while keeping authentic Mario platformer readability.
* **Sprite Categories & Details**:
  1. **Player (Iván / Super Mario)**:
     - Detailed facial features, party hat / Mario cap, shaded clothing with folds, expressive jump & death faces.
     - Animations: `idle`, `run_1`, `run_2`, `run_3`, `jump`, `skid`, `flag`, `die`.
  2. **Enemies (Meme Cats / Pop Cat / Goombas)**:
     - Internet meme cat aesthetic (Pop Cat open/close mouth, Smudge the cat confusion, Grumpy Cat).
     - Animations: `walk_1`, `walk_2`, `squash` (flattened pancake meme face with "X" eyes or shocked expression).
  3. **Tiles & Blocks**:
     - `ground` & `ground_filler`: Rich grass gradient top, detailed soil strata with pebbles and root fibers.
     - `brick`: Textured 3D-beveled bricks with mortar depth and subtle cracks.
     - `question_1..3`: Shiny gold metallic mystery boxes with pulsing glow and animated question mark.
     - `empty`: Metallic steel block with 4 corner rivets and indentation shadow.
     - `pipe_tl, pipe_tr, pipe_bl, pipe_br`: 3D cylindrical gloss green pipes with metallic lighting.
     - `castle_brick, castle_door`: Birthday celebration fortress with colorful brickwork and party banners.
     - `flag, flagpole_top, flagpole_shaft`: Gold finial, chrome flagpole, waving birthday party flag / Mario flag.
  4. **Collectibles & FX**:
     - `coin_1..4`: 3D spinning gold coins with dynamic light glints and coin ridges.
     - Multi-colored confetti particles, glowing floating floating meme tags (`"+100 AURA"`, `"+1000 IVÁN"`).
* **Asset Pipeline Resilience (Zero-Failure Guarantee)**:
  - Assets are generated with high-definition procedural vector/canvas rasterization and optional inline data URIs / SVG sprites.
  - Guarantees 100% synchronous or Promise-based instant readiness without external CDN downtime risks.
  - Headless/Node.js `MemoryContext2D` fallback compatibility for automated CLI test runners.

---

### R2. Integración de Memes y Sonidos Graciosos (Internet Meme Culture & FX)
* **Objective**: Infuse the game with viral internet meme culture, comedic sound effects, and surprising easter eggs.
* **Audio Synthesis & FX Mapping**:
  | Action | Retro Base Sound | Meme V2 Overhaul Sound | Implementation (Web Audio Synth) |
  |--------|------------------|------------------------|-----------------------------------|
  | **Jump** | Square sweep | Comedic "Boing" / Cartoon Spring / "Wahoo" | Dual sine/triangle frequency modulation with pitch glide (150Hz -> 650Hz + vibrato) |
  | **Coin** | 2-tone chime | Crispy Cash Register / Meme "Ka-Ching!" Bling | Multi-harmonic metallic coin chime (988Hz -> 1319Hz + high chime 2637Hz ringout) |
  | **Stomp** | Low crunch | "Bonk!" / Squeak Toy / "Oof" impact | Pitch drop sawtooth + resonant high squeak pop (350Hz -> 40Hz with noise pop) |
  | **Block Bump** | Triangle bump | Comedic Cartoon "Doh" / Woodblock Bonk | Dampened wooden acoustic tap with pitch flutter |
  | **Death** | Sad 4-note | Comedic "Bruh" / "Wasted" / Sad Trombone | Multi-tone descending chromatic slide (Wah-wah-wah-waaaah) with brass envelope |
  | **Stage Win** | Flag fanfare | Epic Birthday Airhorn Triplet & Party Fanfare | Synthesized MLG Airhorn triplet blasts + triumphant celebratory melody |
* **In-Game Meme Easter Eggs**:
  - **Meme Floating Combat Text**: Floating text particles on stomp and coin collection:
    - On Coin: `"+200 COIN"`, `"+100 AURA"`, `"MUCH RICH"`, `"STONKS ↗"`
    - On Stomp: `"BONK!"`, `"GET SQUASHED"`, `"EZ PZ"`, `"POW!"`, `"BYE GATO"`
    - On Win: `"IVÁN IS LEGEND"`, `"GG WP"`, `"FELIZ CUMPLE"`
  - **Birthday Scenery Easter Eggs**:
    - Clouds wearing 8-bit meme sunglasses (Deal With It sunglasses).
    - Humorous billboard signs along the level: *"FELIZ CUMPLEAÑOS IVÁN"*, *"PROHIBIDO ENVEJECER"*, *"NIVEL 1: LA FIESTA"*.

---

### R3. Pantalla de Recompensa Final (Para Iván)
* **Objective**: A dedicated, unmissable reward screen triggered upon touching the flagpole and reaching the castle, designed specifically for Iván.
* **Exact Required Button Text**:
  ```text
  «Terminado el juego. Pincha aquí para recibir la recompensa»
  ```
  *(Must match verbatim in text content, casing, and punctuation).*
* **Link Target**:
  - Must be an interactive HTML `<a>` element or button redirecting to a YouTube video.
  - Placeholder URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (or custom celebration video URL), clearly designated for the user to swap.
  - Attributes: `href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer"`.
* **Visual Presentation & DOM Modal**:
  - Golden celebration container with confetti animation.
  - Custom headline: `"¡FELICIDADES IVÁN!"` and subtitle `"Has superado el desafío de cumpleaños"`.
  - Final stats summary: Score, Coins, Time Remaining, Lives bonus.
  - Prominently styled CTA button with pulsing golden glow, hover/active states, and guaranteed touch responsiveness on mobile (`z-index: 100`, `pointer-events: auto`).

---

### R4. Expansión Creativa y Humor Publicitario (Birthday Campaign Theme)
* **Objective**: Deliver a cohesive creative advertising campaign tone celebrating Iván's birthday with humor, warmth, and gaming culture.
* **Humor & Messaging Details**:
  - **HUD Title**: Personalized HUD showing `"IVÁN"` instead of standard `"MARIO"`.
  - **World Name**: `"IVÁN-1"` or `"BDAY-1"`.
  - **Game Over Screen**: Comedic encouragement message:
    - `"¡Iván, un año más viejo no significa perder los reflejos! Dale otra vez."`
    - Quick tap-to-restart mechanism.
  - **Level Design Flair**:
    - Castle adorned with celebratory party battlements.
    - Surprise Question block containing a super coin jackpot or birthday surprise.

---

## 4. Features Discovered & Specification Matrix

## Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Visuals (R1) | Rich Player Sprites | High-definition Iván/Mario sprites with 8 animation states (`idle`, `run_1..3`, `jump`, `skid`, `flag`, `die`) | State enum, animation timer, facing direction | Rendered canvas frame | Fallbacks to default procedural Mario | `ORIGINAL_REQUEST.md`, `js/assets.js` |
| 2 | Visuals (R1) | Meme Cat Goomba Sprites | Famous internet meme cat faces (Pop Cat / Smudge / Grumpy) for walking and squashed states | Frame index, squash timer | Rendered canvas enemy sprite | Fallbacks to standard brown Goomba | `ORIGINAL_REQUEST.md`, `js/entities.js` |
| 3 | Visuals (R1) | 3D Shiny Gold Coins | 4-frame rotating gold coin with specular glints | `animTimer` | Rendered rotating coin sprite | Fallbacks to 2D gold circle | `ORIGINAL_REQUEST.md`, `js/assets.js` |
| 4 | Visuals (R1) | Textured Environment Tiles | Realistic grass, soil strata, beveled bricks, gloss pipes, and festive castle | Tile type, coordinate (tx, ty) | Canvas rendered tile grid | Unrecognized tiles render blank | `ORIGINAL_REQUEST.md`, `js/level.js` |
| 5 | Audio (R2) | Meme Jump Spring SFX | Comedic cartoon spring "Boing" / "Wahoo" frequency sweep | `GameAudio.playJump()` | Web Audio square/sine modulation | Graceful silence if AudioContext suspended | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 6 | Audio (R2) | Cash Register Coin SFX | Crispy "Ka-Ching!" coin collection sound with high harmonics | `GameAudio.playCoin()` | Web Audio multi-harmonic chime | Graceful silence | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 7 | Audio (R2) | Comedic Bonk Stomp SFX | Pitch-drop "Bonk!" / Squeak Toy enemy stomp sound | `GameAudio.playStomp()` | Web Audio sawtooth + pop | Graceful silence | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 8 | Audio (R2) | Comedic Woodblock Bump SFX | Comedic "Doh" / hollow woodblock obstacle bump | `GameAudio.playBump()` | Web Audio triangle thump | Graceful silence | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 9 | Audio (R2) | Meme "Bruh/Wasted" Death SFX | Comedic chromatic slide / sad trombone death sound | `GameAudio.playDeath()` | Web Audio 4-note brass slide | Graceful silence | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 10 | Audio (R2) | Birthday Airhorn & Fanfare SFX | Celebration MLG airhorn triplet + triumphant birthday fanfare | `GameAudio.playWin()` | Web Audio multi-tone fanfare | Graceful silence | `ORIGINAL_REQUEST.md`, `js/audio.js` |
| 11 | Easter Eggs (R2) | Floating Meme Combat Text | Floating labels (`"+100 AURA"`, `"BONK!"`, `"STONKS"`) on coin/stomp | Entity world coordinate (x, y), text string | Drifting text particle on canvas | Particle self-destructs after 0.6s | `ORIGINAL_REQUEST.md`, `js/entities.js` |
| 12 | Easter Eggs (R2) | Deal-With-It Meme Clouds | Background clouds wearing pixelated sunglasses | Parallax camera offset | Rendered background cloud graphics | Draws standard cloud if coords out of view | `ORIGINAL_REQUEST.md`, `js/game.js` |
| 13 | Victory Screen (R3) | Exact Verbatim Reward Button | DOM modal button with exact text `«Terminado el juego. Pincha aquí para recibir la recompensa»` | Victory state trigger (`handleFlagpole`) | Visible DOM link button with YouTube target | Fallback canvas button if DOM is missing | `ORIGINAL_REQUEST.md` § R3 |
| 14 | Victory Screen (R3) | YouTube Video Link Redirection | Opens YouTube gift video in new tab (`target="_blank"`, `rel="noopener noreferrer"`) | User tap / click event | Browser tab navigation to YouTube | Validates href is a valid YouTube URL | `ORIGINAL_REQUEST.md` § R3 |
| 15 | Humor & Branding (R4) | Iván Personalized HUD | HUD header customized with `"IVÁN"` header and `"IVÁN-1"` world label | DOM elements `#hud-mario`, `#hud-world` | Customized text display | Defaults to MARIO if DOM element missing | `ORIGINAL_REQUEST.md` § R4 |
| 16 | Humor & Branding (R4) | Birthday Game Over Roasting | Comedic death message encouraging Iván to replay | Player death state transition | Canvas/DOM roast message overlay | Standard Game Over if timer not reached | `ORIGINAL_REQUEST.md` § R4 |
| 17 | Core Engine (AC) | Mobile Multi-Touch Overlay | D-Pad Left/Right and Jump buttons with independent multi-touch tracking | Touch events (`touchstart`, `touchend`, `touchcancel`) | Input state updates with `preventDefault()` | Keyboard fallback for desktop | `PROJECT.md`, `js/input.js` |
| 18 | Core Engine (AC) | 360x800 Viewport Conformance | Zero horizontal or vertical scrollbars, thumb-zone button placement | Viewport resize / orientation change | Scaled canvas + fixed DOM UI | Clamps to mobile aspect ratio | `PROJECT.md`, `css/style.css` |

---

## 5. Edge Cases & Boundary Specifications

## Edge Cases
| # | Feature | Input | Observed Behavior / Required Handling |
|---|---------|-------|---------------------------------------|
| 1 | Asset Pipeline | Image load error or network failure | Fallback to built-in procedural Canvas rasterizers; game boots with 0 console errors and `isReady === true`. |
| 2 | Audio Synthesis | Browser blocks autoplay before user gesture | Web Audio initialized in suspended state; unlocks automatically on first `touchstart`/`mousedown`/`keydown` without throwing errors. |
| 3 | Victory Reward Screen | User clicks reward button on Android touch screen | Touch event propagates cleanly to the link without being swallowed by `#touch-controls` overlay (`pointer-events: auto` on modal, high z-index). |
| 4 | Exact Button Text | String comparison check | Text content must match exact string `Terminado el juego. Pincha aquí para recibir la recompensa` (or enclosed in `« »`). |
| 5 | Mobile Viewport | Device orientation change or keyboard popup | Container locked to `100vw`/`100vh` with `max-width: 480px`, `touch-action: none`, preventing viewport scrolling. |
| 6 | Fast Click Spamming | User spams jump button during victory sequence | Victory reward modal remains displayed; does not prematurely reset until player interacts with modal. |
| 7 | Node.js Headless Tests | `window`, `document`, or `AudioContext` undefined | Safe guards throughout all JS modules (`typeof window !== 'undefined'`, memory canvas) ensuring `node test/*.mjs` passes cleanly. |
| 8 | Multiple Goombas Stomped Simultaneously | Player lands on two adjacent Goombas in same tick | Both Goombas squashed, score awarded for each (+100 x 2), double floating particle, single rebound jump impulse. |

---

## 6. Acceptance Criteria & Automated CDP Validation Plan

To guarantee 100% compliance with user requirements and zero regression:

1. **Automated Headless CDP Suite (`test/headless_validator.mjs`)**:
   - **AC1: 0 Console Errors & 0 Uncaught Exceptions**: CDP console and exception listeners monitor entire page lifecycle.
   - **AC2: Touch Overlay & Concurrency**: Multi-touch simulation verifies simultaneous Right + Jump with `defaultPrevented === true`.
   - **AC3: Rich Asset Verification**: Inspects rendered sprite pixels to confirm multi-color shading and high detail.
   - **AC4: Mobile 360x800 Layout**: Confirms exact 360px scrollWidth, <= 800px scrollHeight, and ergonomic thumb placement.
2. **Victory Reward Screen Verification (`test/test_tier1_features.mjs` & CDP)**:
   - Evaluates DOM to assert presence of `<a id="reward-btn" ...>` with exact text `Terminado el juego. Pincha aquí para recibir la recompensa` (or `«Terminado el juego. Pincha aquí para recibir la recompensa»`).
   - Asserts `href` starts with `https://www.youtube.com/watch?v=` and target is `_blank`.
3. **Meme Culture & Audio Synthesis Verification**:
   - Asserts meme sound synthesizer functions exist and execute without errors (`playJump`, `playCoin`, `playStomp`, `playBump`, `playDeath`, `playWin`).
   - Asserts meme particles and birthday easter eggs render properly during gameplay simulation.
4. **Adversarial & Workload Testing**:
   - 3,000-frame sustained 60 FPS benchmark.
   - 10-reset memory leak test (Heap delta < 1.0 MB).
   - 100-playthrough bot simulation.

---

## 7. Recommendations for Implementation & Creative Directives

1. **DOM Reward Modal (`index.html`)**:
   - Place a dedicated `#victory-modal` in `index.html` styled in `css/style.css` that transitions in smoothly with celebratory confetti when `Game.state === 'WIN'`.
   - Ensure the modal contains the exact required button text and YouTube link.
2. **Rich Procedural & Vector Sprites (`js/assets.js`)**:
   - Use high-fidelity Canvas 2D drawing routines (gradients, multi-path vector shapes, shading, highlights) to generate 32x32 / 16x16 crisp sprites for Iván, Meme Cat Goombas, 3D Gold Coins, and Festive Castle tiles.
3. **Meme Audio Synthesizer (`js/audio.js`)**:
   - Design expressive Web Audio nodes (frequency ramps, dual oscillators, distortion/filter curves) to produce punchy, comedic cartoon sounds with zero audio sample loading latency or network failure risk.
4. **Birthday Easter Eggs (`js/level.js` & `js/entities.js`)**:
   - Add birthday message billboards, floating meme text particles, and sunglasses on clouds.
