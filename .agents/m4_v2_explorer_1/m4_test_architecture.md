# M4 Test Suite Architecture Specification: V2 Iván's Birthday Gift Edition

> **Document ID**: `M4-ARCH-V2-TEST-SUITE`  
> **Target Version**: V2 Iván's Birthday Gift Edition  
> **Author**: M4 Test Suite Architecture Explorer  
> **Status**: APPROVED ARCHITECTURE  
> **Scope**: 4-Tier Automated Test Suites (`test/test_tier1_features.mjs` – `test/test_tier4_workload.mjs`) & Automated Headless Chrome CDP Validator (`test/headless_validator.mjs`)

---

## 1. Executive Summary & Architecture Principles

The V2 update transforms the classic Mario prototype into **"Iván's Birthday Gift Edition"** — an enhanced HTML5 Canvas 2D platformer running at 60 FPS in a mobile-first 360x800 layout. The update introduces high-definition procedural sprites (Super Iván, Pop Cat, Doge, Grumpy Cat), zero-dependency real-time Web Audio API meme sound synthesis, birthday lore (sky banners, roadside milestone signs, birthday castle), floating meme combat text particles, confetti particle physics, and a dedicated celebratory DOM Victory Modal featuring the exact required reward button linking to YouTube.

To guarantee zero regressions, 100% specification compliance, and rock-solid mobile performance, the M4 Test Suite is architected across **4 hierarchical testing tiers** plus an **Automated Headless Chrome CDP Validator**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       M4 AUTOMATED TEST ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Headless Chrome CDP Validator (headless_validator.mjs)                │  │
│  │ • 0 Console Errors & 0 Uncaught Exceptions                            │  │
│  │ • Live Multi-Touch Input & preventDefault() Verification              │  │
│  │ • 360x800 Viewport Conformance & Zero-Scroll Layout                  │  │
│  │ • Live DOM Victory Modal & Exact Reward Button Copy + YouTube Check  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │ Tier 4: Workload & Performance Benchmarks (test_tier4_workload.mjs)   │  │
│  │ • 3,000 Frames Sustained 60 FPS (<2.0ms/frame compute)                │  │
│  │ • 100-Playthrough Autonomous Bot (Win/Death Loops)                    │  │
│  │ • Memory Stability & Heap Leak Detection (<25MB growth over 100 runs) │  │
│  │ • Tab Blur / Background Delta-Time Clamping (dt <= 0.05s)             │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │ Tier 3: Combinations & Multi-Touch Concurrency (test_tier3_combos.mjs)│  │
│  │ • Multi-Touch Concurrent Running + Jumping                            │  │
│  │ • Consecutive Chain Stomps (PopCat -> Doge -> GrumpyCat)              │  │
│  │ • Coin Cascades & Simultaneous Ceiling Collisions                     │  │
│  │ • 10x-50x Consecutive Victory Reset & Replay Loops                    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │ Tier 2: Boundary & Corner Cases (test_tier2_boundary.mjs)             │  │
│  │ • Stomp on Boundary Edges (Lateral Overlap ±15.9px Tolerance)         │  │
│  │ • Multiple Clustered Meme Enemies Patrol & Turnaround                 │  │
│  │ • Rapid Polyphonic Audio Triggers (50+ events/10ms)                   │  │
│  │ • 360x800 Mobile Viewport & Camera Clamping (x=0 to end of world)     │  │
│  │ • Coyote Time (85ms) & Jump Buffering (100ms) Thresholds              │  │
│  │ • High-Speed Anti-Tunneling Physics Sub-Stepping                      │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │ Tier 1: Feature Coverage (test_tier1_features.mjs)                     │  │
│  │ • Super Iván 8-State Sprites & 14-Color Palette                       │  │
│  │ • Pop Cat 180ms Mouth Loop & Stomp Squash                             │  │
│  │ • Doge & Grumpy Cat Attributes, AI Patrol & Squashes                  │  │
│  │ • 6 Meme Sound Synthesizers (Boing, Ka-Ching, Pop, Pipe, Wah, Win)   │  │
│  │ • DOM Victory Modal & Exact Reward Button String + YouTube Link       │  │
│  │ • Personalized HUD ("IVÁN", "🎂 × 00", "WORLD 2026")                  │  │
│  │ • Birthday Lore, Milestone Signposts & Castle Cake                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Testing Constraints & Invariants
1. **Zero External Dependencies**: All tests run on native Node.js (ESM/CJS) and native Chrome DevTools Protocol over WebSockets without requiring npm installs (`puppeteer`, `playwright`, `jest`, etc.).
2. **Headless & CI Resilience**: Full headless execution capability without audio device or GPU requirements; mock AudioContext handles synth graph verification while real headless Chrome validates in-browser rendering.
3. **Deterministic Assertions**: Strict numeric and byte-exact assertions for strings, URLs, physics coordinates, frame timings, and memory footprints.

---

## 2. Subsystem Mapping & V2 Feature Delta Matrix

| Subsystem | Source File | V1 Baseline | V2 Upgraded Features to Test |
|---|---|---|---|
| **Asset Engine** | `js/assets.js` | 16x16 3-color basic Mario | Super Iván 8 states (`idle`, `run_1..3`, `jump`, `skid`, `flag`, `die`), 14-color palette (sunglasses, party hat, ruby shirt), Pop Cat (open/closed mouth), Doge, Grumpy Cat, 3D shaded coins, birthday cake. |
| **Audio Synthesizer** | `js/audio.js` | Placeholder oscillator tones | Zero-dependency Web Audio meme synthesizer: Boing jump, Ka-Ching coin chime, Pop Cat stomp pop, Metal pipe thud, Sad Trombone death slide, 8-bit Happy Birthday victory fanfare, Airhorn & Bruh easter eggs, master dynamics compressor limiter. |
| **Entities & AI** | `js/entities.js` | Simple Goomba | Pop Cat with 180ms mouth loop, Doge (agile -45 px/s), Grumpy Cat (stubborn -28 px/s), 450ms stomp squash duration, floating meme combat text (`"+100 AURA"`, `"BONK!"`, `"much jump, wow"`, `"NO."`), multi-colored confetti particles. |
| **Level & Lore** | `js/level.js` | Generic 1-1 tiles | Birthday Sky Banner (`"🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"`), 4 milestone signposts (KM 0, 10, 25, 30), 3-tier birthday cake on castle battlement, deal-with-it clouds. |
| **Input System** | `js/input.js` | Single-touch buttons | Multi-touch DOM controller with concurrent touch tracking (`touchstart`, `touchend`, `touchcancel`), sliding re-targeting, strict `preventDefault()`. |
| **Physics Engine** | `js/physics.js` | Basic AABB | Axis-separated AABB, sub-pixel fall anti-tunneling, 85ms coyote time, 100ms jump buffering, skid turnaround mechanics. |
| **Game & UI** | `js/game.js`, `index.html` | "Victoria" canvas text | Personalized HUD (`"IVÁN"`, `"🎂 × 00"`, `"WORLD 2026"`), celebratory DOM Victory Modal (`#victory-modal`), exact required button: `«Terminado el juego. Pincha aquí para recibir la recompensa»` linking to YouTube, replay button `#btn-replay`. |

---

## 3. Tier 1: Feature Coverage Test Suite Architecture

**Target File**: `test/test_tier1_features.mjs`  
**Execution Environment**: Node.js ESM (`node test/test_tier1_features.mjs`)  
**Purpose**: Exhaustively verify every individual game feature, asset state, meme enemy attribute, audio synthesizer method, and DOM contract in isolation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 1 TEST MATRIX & SPECIFICATIONS                     │
├───────┬──────────────────────────────────────┬──────────────────────────────┤
│ ID    │ Test Case Name                       │ Verification Scope & Method  │
├───────┼──────────────────────────────────────┼──────────────────────────────┤
│ T1.1  │ Asset Engine & Super Iván Sprites    │ 8 states, 14-color palette   │
│ T1.2  │ Pop Cat Mouth Animation & Squash     │ 180ms loop, 450ms squash     │
│ T1.3  │ Doge Agile Patrol & Meme Attributes  │ -45 px/s, meme text library  │
│ T1.4  │ Grumpy Cat Stubborn Patrol & Scowl   │ -28 px/s, meme text library  │
│ T1.5  │ Web Audio Meme Synthesizer Suite     │ 6 sound methods + 2 easter   │
│ T1.6  │ Player Kinematics & States           │ Idle, Run, Jump, Skid, Dead  │
│ T1.7  │ Tile Collision & Question Blocks     │ Solid blocks, coin popups    │
│ T1.8  │ Collectible 3D Gold Coins            │ Score +200, coin increment   │
│ T1.9  │ Stomp Mechanics & Rebound Impulse    │ vy = -260, stomp callback    │
│ T1.10 │ Floating Meme Text & Confetti FX     │ Particle physics & lifespan  │
│ T1.11 │ Birthday Lore, Banner & Castle       │ Sky banner, 4 signs, cake    │
│ T1.12 │ DOM Victory Modal & Exact Button     │ Exact string, YouTube href   │
└───────┴──────────────────────────────────────┴──────────────────────────────┘
```

### Detailed Test Specifications

#### Test T1.1: Super Iván Hero Sprites & 14-Color Palette
- **Inputs**: `await GameAssets.init()`.
- **Target Sprites**: `player.idle`, `player.run_1`, `player.run_2`, `player.run_3`, `player.jump`, `player.skid`, `player.flag`, `player.die`.
- **Assertions**:
  - All 8 sprite canvases are non-null and exactly 16x16 pixels.
  - Pixel analysis of `player.idle` confirms at least 4 distinct colors from the Iván palette (e.g. Sunglasses `#000000`/`#263238`, Party Hat `#FFD700`/`#00D8FF`, Ruby Shirt `#E52521`, Skin `#FFCCA6`).
  - Pre-flipped mirror cache exists for flippable sprites (`idle_flip`, `run_1_flip`, etc.) and exhibits exact mathematical horizontal symmetry ($C_{x,y} == C'_{15-x,y}$).

#### Test T1.2: Pop Cat 180ms Mouth Loop & Stomp Squash Mechanics
- **Inputs**: Instantiate `popcat = GameEntities.createPopCat(100, 192)`.
- **Assertions**:
  - `popcat.type === 'popcat'`.
  - At `animTimer = 0.05s` ($0.05 / 0.18 = 0$, even), mouth is closed (`isMouthOpen === false`).
  - At `animTimer = 0.20s` ($0.20 / 0.18 = 1$, odd), mouth is open (`isMouthOpen === true`).
  - At `animTimer = 0.38s` ($0.38 / 0.18 = 2$, even), mouth returns to closed.
  - Stomp trigger sets `isSquashed = true`, `squashTimer = 0.45`, returns type `'popcat'`.
  - Updating for 0.30s leaves entity alive (`isAlive === true`); updating past 0.45s marks entity dead (`isAlive === false`).

#### Test T1.3 & T1.4: Doge & Grumpy Cat Entities
- **Inputs**: Instantiate `doge = GameEntities.createDoge(100, 192)` and `grumpy = GameEntities.createGrumpyCat(100, 192)`.
- **Assertions**:
  - Doge: `type === 'doge'`, `vx === -45` (agile run), Doge stomp returns `'doge'`.
  - Grumpy Cat: `type === 'grumpy'`, `vx === -28` (slow stubborn run), Grumpy stomp returns `'grumpy'`.
  - Backward compatibility: `GameEntities.createGoomba(x, y)` resolves to `type === 'popcat'`.

#### Test T1.5: Zero-Dependency Meme Audio Synthesizer Suite
- **Mock Setup**: Synthetic `MockAudioContext` tracking node creation, oscillator types, frequency parameters, gain envelopes, and biquad filters.
- **Assertions**:
  - `GameAudio.playJump()`: Sine wave pitch sweep 160Hz -> 680Hz with 22Hz LFO vibrato.
  - `GameAudio.playCoin()`: 4-layer harmonic chime (B5 988Hz -> E6 1319Hz + G#6 1661Hz + B6 1976Hz).
  - `GameAudio.playStomp()`: Pop Cat 420Hz resonant bandpass ($Q=8.0$) + 180Hz->50Hz sub-bass pitch drop.
  - `GameAudio.playBump()`: Metal Pipe 580Hz->320Hz + 750Hz bandpass ($Q=4.0$) + 220Hz->65Hz triangle body.
  - `GameAudio.playDeath()`: Sad Trombone 4-note descending slide (311.13Hz -> 293.66Hz -> 277.18Hz -> 261.63Hz->195Hz) + wah-wah & 6.5Hz tremolo.
  - `GameAudio.playWin()`: 8-bit Happy Birthday melody + triangle bass + arpeggio cascade + victory fanfare triad.
  - `GameAudio.playAirhorn()` & `GameAudio.playBruh()` execute cleanly without errors.
  - **W3C Non-Zero Exponential Ramp Rule**: Zero calls to `exponentialRampToValueAtTime` with values $\le 0$ (all floors $\ge 0.0001$).

#### Test T1.12: DOM Victory Modal & Exact Reward Button String and YouTube Link
- **Inputs**: Parse `index.html`.
- **Assertions**:
  - `#victory-modal` element exists with `role="dialog"` and class `victory-overlay hidden`.
  - `#reward-btn` tag matches `<a id="reward-btn" ...>`.
  - Byte-for-byte exact text match:
    $$\text{textContent} \equiv \text{"Terminado el juego. Pincha aquí para recibir la recompensa"}$$
  - `href` attribute links to a genuine YouTube URL (`https://www.youtube.com/...`).
  - `target === "_blank"` and `rel === "noopener noreferrer"`.
  - Replay button `#btn-replay` exists inside modal.

---

## 4. Tier 2: Boundary & Corner Case Test Suite Architecture

**Target File**: `test/test_tier2_boundary.mjs`  
**Execution Environment**: Node.js ESM (`node test/test_tier2_boundary.mjs`)  
**Purpose**: Stress-test extreme mathematical edge cases, boundary collisions, high velocity sub-stepping, viewport bounds, audio polyphony spam, and timing window limits.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 2 TEST MATRIX & SPECIFICATIONS                     │
├───────┬──────────────────────────────────────┬──────────────────────────────┤
│ ID    │ Boundary Test Case                   │ Extreme Condition & Method   │
├───────┼──────────────────────────────────────┼──────────────────────────────┤
│ T2.1  │ Edge-of-Collider Stomp Tolerances    │ Overlap at x ± 15.9px        │
│ T2.2  │ Multiple Clustered Meme Enemies      │ Multi-enemy turnaround       │
│ T2.3  │ Rapid Polyphonic Audio Triggers      │ 50+ audio calls in 10ms      │
│ T2.4  │ 360x800 Viewport & Camera Clamping   │ Camera bounds 0 <= x <= max  │
│ T2.5  │ Sub-Pixel High-Speed Anti-Tunneling  │ vy = 1200 px/s with dt=0.08s │
│ T2.6  │ Coyote Time Jump Boundary (85ms)     │ Jump at 60ms vs deny at 95ms │
│ T2.7  │ Jump Buffer Registration (100ms)     │ Tap 70ms before landing      │
│ T2.8  │ Left Level Boundary Clamping         │ x clamped to 0 on vx < 0     │
└───────┴──────────────────────────────────────┴──────────────────────────────┘
```

### Detailed Test Specifications

#### Test T2.1: Stomp on Boundary Edges (Lateral Overlap ±15.9px Tolerance)
- **Scenario**: Player lands on enemy with only 0.1px of horizontal overlap ($x_{\text{player}} = x_{\text{enemy}} + 15.9$).
- **Logic**:
  $$\text{Overlap}_x = \min(A.x + A.w, B.x + B.w) - \max(A.x, B.x) = 0.1\text{px} > 0$$
- **Assertions**:
  - Stomp detection evaluates true as long as $\text{Overlap}_x > 0$ and player is falling ($v_y > 0$) onto top half ($y_{\text{player}} + h \le y_{\text{enemy}} + 10$).
  - When overlap is zero or negative ($x_{\text{player}} = x_{\text{enemy}} + 16.1$), stomp does not trigger and player does not take damage.
  - Side collision ($y_{\text{player}} + h > y_{\text{enemy}} + 10$) triggers player damage instead of stomp.

#### Test T2.2: Multiple Clustered Meme Enemies Patrol & Turnaround
- **Scenario**: Two meme enemies (e.g. Doge moving left at -45 px/s and PopCat moving right at +35 px/s) placed in the same 32px corridor.
- **Assertions**:
  - Enemies collide with solid wall tiles (pipes/blocks) and reverse velocity without sinking into geometry.
  - Clustered enemies update without race conditions or memory allocation corruption.

#### Test T2.3: Rapid Audio Triggers & Polyphony Stress (50+ Calls in 10ms)
- **Scenario**: Simulate rapid coin collection, jump spam, and stomp bursts by firing 50+ consecutive sound triggers in 10ms.
- **Assertions**:
  - Master `DynamicsCompressorNode` limiter prevents audio signal clipping.
  - Zero unhandled exceptions or NaN audio param values.
  - Node graph correctly connects oscillators $\to$ gain $\to$ master bus without memory leaks.

#### Test T2.4: 360x800 Viewport Bounds & Virtual Coordinate Scaling
- **Scenario**: Test virtual coordinates ($180 \times 400$) at $2\times$ scaling ($360 \times 800$) across mobile screen configurations.
- **Assertions**:
  - Camera tracking formula:
    $$\text{cameraX} = \text{clamp}\left(\text{player.x} - 0.35 \times 180, 0, \text{levelWidth} - 180\right)$$
  - Camera never scrolls negative ($\text{cameraX} \ge 0$) and never exceeds level bounds.

#### Test T2.5: Sub-Pixel High-Speed Anti-Tunneling Sub-Stepping
- **Scenario**: Player falling at terminal velocity $v_y = 1200\text{ px/s}$ with frame hiccup $dt = 0.08\text{s}$ (step distance $= 96\text{px}$, which would tunnel through a 16px ground floor at $y=192$).
- **Assertions**:
  - Multi-substep collision resolution prevents floor penetration.
  - Final position snaps exactly to ground surface ($y = 192.0$).
  - $v_y$ is zeroed and `onGround` is set to `true`.

---

## 5. Tier 3: Combinations & Multi-Touch Concurrency Test Suite Architecture

**Target File**: `test/test_tier3_combos.mjs`  
**Execution Environment**: Node.js ESM (`node test/test_tier3_combos.mjs`)  
**Purpose**: Validate complex cross-feature interactions, multi-touch concurrency, combo chain stomps, coin cascades, and victory reset idempotency.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 3 TEST MATRIX & SPECIFICATIONS                     │
├───────┬──────────────────────────────────────┬──────────────────────────────┤
│ ID    │ Combination Test Case                │ Multi-System Interaction     │
├───────┼──────────────────────────────────────┼──────────────────────────────┤
│ T3.1  │ Multi-Touch Concurrency (Run + Jump) │ Touch 1 (Right) + Touch 2 (J)│
│ T3.2  │ Touch Sliding & Dynamic Re-targeting │ Move touch ID between buttons│
│ T3.3  │ Consecutive Chain Stomps             │ PopCat -> Doge -> GrumpyCat  │
│ T3.4  │ Coin Cascade & Ceiling Block Bump    │ Block bump + aerial coin     │
│ T3.5  │ Audio Auto-Unlock on Gesture         │ Touch event unlocks audio    │
│ T3.6  │ 10x-50x Victory Replay Reset Loop    │ Repeated Win -> Modal -> Rst │
│ T3.7  │ Death -> Restart -> Stomp Lifecycle  │ Complete game recovery cycle │
└───────┴──────────────────────────────────────┴──────────────────────────────┘
```

### Detailed Test Specifications

#### Test T3.1 & T3.2: Multi-Touch Concurrency & Sliding Re-Targeting
- **Mock Setup**: Simulated DOM touch event dispatcher managing active touch identifiers.
- **Scenario 1**: Touch ID 101 on `#btn-right`, Touch ID 102 on `#btn-jump`.
  - Assert `getState().right === true` AND `getState().jump === true`.
  - Release Touch ID 102 $\to$ `getState().right === true` AND `getState().jump === false`.
- **Scenario 2**: Touch ID 201 starts on `#btn-left`, slides across screen to `#btn-right` without `touchend`.
  - Assert `getState().left` transitions to `false` and `getState().right` transitions to `true`.
  - Releasing Touch ID 201 returns input to clean idle state.

#### Test T3.3: Consecutive Chain Stomps (PopCat $\to$ Doge $\to$ GrumpyCat)
- **Scenario**: Player performs a mid-air chain stomp sequence across all 3 meme enemy types without touching the ground:
  1. Falls onto PopCat $\to$ squashes PopCat, plays `playStomp()`, spawns `"+100 AURA"`, bounces with $v_y = -260\text{ px/s}$.
  2. Glides horizontally and lands on Doge $\to$ squashes Doge, plays `playStomp()`, spawns `"much jump, wow"`, bounces with $v_y = -260\text{ px/s}$.
  3. Glides horizontally and lands on GrumpyCat $\to$ squashes GrumpyCat, plays `playStomp()`, spawns `"NO."`, bounces with $v_y = -260\text{ px/s}$.
- **Assertions**:
  - All 3 enemies transition to `isSquashed === true`.
  - Total score increments by $+300$ points.
  - Player horizontal velocity ($v_x$) is preserved through each bounce.
  - 3 floating meme text particles are spawned with distinct strings.

#### Test T3.4: Coin Cascade & Simultaneous Ceiling Block Bump
- **Scenario**: Player jumps into a question block containing a coin while simultaneously intersecting a floating coin entity in the adjacent tile.
- **Assertions**:
  - Question block bumps, turns into empty block tile, and spawns rising `BlockCoin`.
  - Floating coin entity is consumed and removed from `coinsList`.
  - Total coins increment by $+2$, score increments by $+400$.
  - Both `playBump()` / `playCoin()` audio triggers fire cleanly without race conditions.

#### Test T3.6: 10x-50x Consecutive Victory Replay Reset Loop
- **Scenario**: Loop 10 to 50 times through: Play $\to$ Flagpole touch $\to$ Win state $\to$ Confetti shower $\to$ Modal reveal $\to$ `#btn-replay` click $\to$ `Game.restart()`.
- **Assertions on Every Iteration**:
  - `Game.state === 'PLAYING'`.
  - `Game.score === 0`, `Game.coins === 0`, `Game.lives === 3`, `Game.time === 400`.
  - `Game.modalRevealed === false`, modal class contains `hidden`.
  - Player reset to starting line ($x=40, y=192$) in `IDLE` state.
  - All 11 meme enemies respawned in fresh patrol states.
  - All 9 coins respawned.
  - `particles` and `blockCoins` arrays emptied ($0$ leftover items).

---

## 6. Tier 4: Workload, Performance & Stability Test Suite Architecture

**Target File**: `test/test_tier4_workload.mjs`  
**Execution Environment**: Node.js ESM (`node test/test_tier4_workload.mjs`)  
**Purpose**: Benchmark sustained 60 FPS performance, autonomous playthrough bot stability, memory leak resistance, and background tab throttling resilience.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 4 TEST MATRIX & SPECIFICATIONS                     │
├───────┬──────────────────────────────────────┬──────────────────────────────┤
│ ID    │ Benchmark & Workload Test Case       │ Target Threshold & Metric    │
├───────┼──────────────────────────────────────┼──────────────────────────────┤
│ T4.1  │ 3,000 Frames Sustained 60 FPS Compute│ Avg frame compute < 2.0ms    │
│ T4.2  │ 100-Playthrough Autonomous Bot       │ 100% completion, 0 errors    │
│ T4.3  │ Memory Leak & Heap Stability Stress  │ Heap delta < 25MB (100 runs) │
│ T4.4  │ Tab Blur / Delta-Time Clamping       │ dt clamped to <= 0.05s       │
│ T4.5  │ High Particle Concurrency Stress     │ 200+ active confetti items   │
└───────┴──────────────────────────────────────┴──────────────────────────────┘
```

### Detailed Test Specifications

#### Test T4.1: 3,000 Frames Sustained 60 FPS Benchmark
- **Execution**: Simulate 3,000 game frames ($50.0\text{s}$ of gameplay) with alternating inputs (running, jumping, block collisions, enemy stomps, confetti physics).
- **Measurement**:
  $$\bar{t}_{\text{frame}} = \frac{t_{\text{total}}}{3000}$$
- **Threshold**:
  $$\bar{t}_{\text{frame}} < 2.0\text{ ms} \quad (\text{Capability} > 500\text{ FPS, leaves } >85\% \text{ budget for Canvas 2D render})$$

#### Test T4.2: Autonomous 100-Playthrough Bot
- **Execution**: Bot runs 100 consecutive full level playthroughs with randomized heuristic strategies (aggressive jump patterns vs speed sprints).
- **Assertions**:
  - All 100 runs execute to conclusion (either reaching Flagpole WIN or GAMEOVER restart).
  - Zero NaN coordinate anomalies, zero unhandled errors, zero state deadlocks.

#### Test T4.3: Memory Stability Across 100 Level Playthroughs
- **Execution**: Sample V8 heap used (`process.memoryUsage().heapUsed`) at iteration 0 vs iteration 100.
- **Threshold**:
  $$\Delta \text{Heap} = \text{Heap}_{100} - \text{Heap}_{0} < 25\text{ MB}$$
- **Verification**: Dead confetti particles, consumed coins, and squashed enemies are promptly spliced from arrays and garbage collected.

#### Test T4.4: Tab Backgrounding & Delta Time Clamping
- **Scenario**: Simulate browser returning from 10-second tab backgrounding ($dt = 10.0\text{s}$).
- **Assertions**:
  - Engine clamps delta time:
    $$dt_{\text{clamped}} = \min(\max(dt, 0.001), 0.05)$$
  - Player coordinates remain bounded and numeric ($x, y \ne \text{NaN}$, $y \le 256$).

---

## 7. Automated Headless Chrome CDP Validator Architecture

**Target File**: `test/headless_validator.mjs`  
**Execution Environment**: Headless Chrome / Microsoft Edge via Chrome DevTools Protocol (`node test/headless_validator.mjs`)  
**Purpose**: End-to-end automated in-browser verification of Acceptance Criteria AC1 – AC4, live DOM layout, live multi-touch interaction, and live celebratory victory modal rendering.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 HEADLESS CHROME CDP VALIDATION PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Spawn Local HTTP Server (port 8484) serving static assets & index.html   │
│ 2. Launch Headless Chrome (--headless=new, --remote-debugging-port=9333,   │
│    --window-size=360,800, --user-data-dir)                                  │
│ 3. Connect via Native WebSocket CDP Client                                  │
│ 4. Configure Mobile Emulation (360x800, scale=2, mobile=true, touch=5 pts) │
│ 5. Enable Runtime, Page, DOM domains & listen for consoleAPICalled          │
│ 6. Execute 5 Automated Audit Suites:                                        │
│    ├─ SUITE 1: 0 Console Errors, 0 Exceptions, Subsystems & Sprites         │
│    ├─ SUITE 2: Mobile 360x800 Layout, Zero-Scroll, Button Ergonomics (>=48px│
│    ├─ SUITE 3: Multi-Touch Event Dispatch & preventDefault() Verification   │
│    ├─ SUITE 4: Live Gameplay Simulation, HUD Sync & 60 FPS Camera Tracking │
│    └─ SUITE 5: Flagpole Win Trigger, Victory Modal & Exact Reward Button    │
│ 7. Teardown Chrome process & HTTP server cleanly                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Headless CDP Assertion Suite Matrix

| Suite | Assertion Description | Target Metric / Exact Criterion |
|---|---|---|
| **AC1** | 0 Console Errors & 0 Uncaught Exceptions | `consoleErrors.length === 0 && runtimeExceptions.length === 0` |
| **AC1** | Subsystems Exported & Ready | `GameAssets.isReady && GameInput && GamePhysics && GameAudio && Game` |
| **AC2** | Multi-Touch Concurrency & `preventDefault` | `touchEvent.defaultPrevented === true`, concurrent `right + jump` |
| **AC3** | Authentic Multi-Color Sprite Pixels | Mario, PopCat, Doge, Coin, Ground $\ge 3$ distinct palette colors |
| **AC4** | Mobile 360x800 Layout Conformance | `scrollWidth === 360`, `scrollHeight <= 800`, zero scrollbars |
| **AC4** | Ergonomic Touch Target Sizing | `#btn-left`, `#btn-right`, `#btn-jump` $\ge 48\text{px} \times 48\text{px}$, bottom thumb zone |
| **AC5** | Live Gameplay & Camera Tracking | Player moves right ($>50\text{px}$), camera follows, HUD syncs |
| **AC6** | Live DOM Victory Modal Visibility | `#victory-modal` removes `hidden` class upon flagpole reach |
| **AC6** | **Exact Reward Button Copy** | **`textContent === "Terminado el juego. Pincha aquí para recibir la recompensa"`** |
| **AC6** | **Exact YouTube Reward URL** | **`href.includes("youtube.com") && target === "_blank" && rel.includes("noopener")`** |
| **AC6** | In-Browser 10x Replay Loop | 10 clicks on `#btn-replay` cleanly reset game in live DOM |

---

## 8. Milestone 4 Upgrade & Implementation Strategy

To upgrade the test suite from V1 to full V2 coverage, the following modifications will be implemented across the test files:

### Step 1: Upgrade `test/test_tier1_features.mjs`
- Expand from 9 to 12 tests.
- Add Super Iván 8-state sprite and 14-color palette assertions.
- Add Pop Cat 180ms mouth loop tests and stomp squash timing (450ms).
- Add Doge agile patrol (-45 px/s) and Grumpy Cat slow patrol (-28 px/s) tests.
- Add full Web Audio mock suite verifying all 6 meme sounds (Boing, Ka-Ching, Pop, Pipe, Sad Trombone, Birthday Fanfare) and W3C ramp compliance.
- Add static HTML verification of `#victory-modal` and exact reward button string and YouTube link.
- Add birthday sky banner, 4 milestone signposts, and birthday castle checks.

### Step 2: Upgrade `test/test_tier2_boundary.mjs`
- Add lateral overlap stomp boundary tests ($\pm 15.9\text{px}$).
- Add multiple clustered meme enemies patrol turnaround test.
- Add 50+ rapid audio trigger polyphony stress test with master limiter headroom.
- Update camera coordinate clamping to reflect full V2 120-column level width.

### Step 3: Upgrade `test/test_tier3_combos.mjs`
- Add 3-enemy consecutive chain stomp sequence (PopCat $\to$ Doge $\to$ GrumpyCat) with rebound impulse and floating meme text.
- Add simultaneous ceiling block bump + aerial coin collection cascade.
- Add 10x consecutive victory replay reset loop with entity integrity checks.

### Step 4: Upgrade `test/test_tier4_workload.mjs`
- Update 3,000-frame 60 FPS benchmark with full V2 confetti particle emitter and meme enemy AI.
- Update autonomous bot to navigate the full 120-column V2 level with milestone signs and flagpole castle sequence.
- Add memory stability test measuring heap growth across 100 consecutive full level playthroughs ($< 25\text{MB}$).

### Step 5: Upgrade `test/headless_validator.mjs`
- Add Suite 5: In-browser live flagpole win trigger, `#victory-modal` DOM reveal, exact reward button copy check (`«Terminado el juego. Pincha aquí para recibir la recompensa»`), YouTube link check, and live 10x `#btn-replay` reset test.
- Verify 0 console errors and 0 runtime exceptions across all live suites.

---

## 9. Verification & Quality Gates

The M4 test suite architecture is considered complete when all of the following commands execute with a **100% pass rate (0 failures, 0 console errors)**:

```bash
# 1. Tier 1 Feature Coverage
node test/test_tier1_features.mjs

# 2. Tier 2 Boundary Cases
node test/test_tier2_boundary.mjs

# 3. Tier 3 Multi-Touch & Combinations
node test/test_tier3_combos.mjs

# 4. Tier 4 Workload & 60 FPS Benchmarks
node test/test_tier4_workload.mjs

# 5. Headless Chrome CDP Live In-Browser Validation
node test/headless_validator.mjs
```

---

## 10. Conclusion

This architecture establishes an exhaustive, rigorous, and automated testing framework for V2 Iván's Birthday Gift Edition. By spanning isolated unit feature coverage (Tier 1), extreme mathematical boundaries (Tier 2), complex concurrency and reset loops (Tier 3), long-running performance and memory stability benchmarks (Tier 4), and live browser CDP validation, the suite guarantees complete compliance with all user acceptance criteria.
