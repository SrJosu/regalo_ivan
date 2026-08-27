# Technical Survey Report: Mario-Style Android Browser Platformer

**Author**: Explorer 1 (`explorer_survey_1`)  
**Date**: 2026-08-26  
**Target Project**: Browser-based Classic Mario-style Platformer for Android Mobile & Desktop  
**Target Viewport**: 360x800 (and responsive mobile/desktop screens)

---

## 1. Executive Summary

This report surveys the technical requirements, architecture, rendering paradigms, touch control mechanics, responsive scaling, physics systems, and verification strategies for building a zero-dependency, high-performance, classic Mario-style platformer playable in Android smartphone mobile browsers as well as desktop browsers.

The game must meet four core acceptance criteria defined in `ORIGINAL_REQUEST.md`:
1. **Headless Browser Execution**: Loads and runs cleanly in automated/headless browsers with **0 JavaScript console errors**.
2. **DOM Touch Controls**: Dedicated on-screen touch buttons (`Left`, `Right`, `Jump`) in the DOM capturing `touchstart`, `touchend`, `touchcancel` with `preventDefault()` to eliminate browser zoom/scrolling artifacts.
3. **Image-Based Graphics**: Rich sprite assets for the character, environment tiles, collectibles (coins), and the goal/flagpole (no plain single-color geometric blocks).
4. **Mobile-First Responsive Layout**: Optimized for typical Android smartphone viewports (specifically reference target `360x800` portrait and landscape), maintaining proper aspect ratio, touch target ergonomics, and crisp pixel art scaling.

---

## 2. Workspace & Environment Survey

### 2.1 Workspace Structure
- **Root Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan`
- **Current Files**:
  - `ORIGINAL_REQUEST.md`: Detailed specification document describing mechanics, touch controls, image assets, and agent-as-judge acceptance criteria.
  - `.agents/`: Agent orchestration and metadata directory.
- **Project State**: Greenfield project. No legacy code or pre-existing dependencies exist in the root directory.

### 2.2 Execution & Delivery Strategy
- **Zero Runtime Dependencies**: The platformer should be constructed using pure modern HTML5, CSS3, and standard ES6+ JavaScript.
- **Offline / Local File Compatibility**: Can be loaded either directly via `file://` or via any static HTTP server (e.g. `npx serve`, `python -m http.server`, Playwright/Puppeteer headless test fixtures).
- **Asset Self-Sufficiency**: All image sprites and audio/visual elements should either be locally stored relative images or clean inline SVG/Base64 data URIs to guarantee zero external network latency, zero CDN failures, and zero CORS errors in headless test environments.

---

## 3. Core Technical Architecture Analysis

### 3.1 Canvas 2D vs DOM Rendering

| Feature / Criteria | HTML5 Canvas 2D (`<canvas>`) | DOM Elements (`<div>` + CSS) | Hybrid Model (Recommended) |
|---|---|---|---|
| **Render Performance** | Constant 60 FPS across hundreds of tiles/particles; single GPU draw call pipeline. | Layout thrashing / reflow overhead when moving numerous tiles, coins, and player per frame. | **Canvas 2D** for game world + **DOM** for controls & HUD. |
| **Pixel Art Scaling** | Crisp nearest-neighbor scaling (`imageSmoothingEnabled = false`, `image-rendering: pixelated`). | CSS transforms can cause sub-pixel seams/gaps between adjacent tile divs. | Pixel-perfect canvas game scene. |
| **Camera Scrolling** | Trivial `ctx.translate(-cameraX, 0)` applied to all world coordinates in single pass. | Complex CSS translation on container; DOM subtree bounding updates. | Smooth, seamless horizontal camera panning on canvas. |
| **Touch Hitboxes** | Requires manual coordinate mapping & hit-testing math against viewport transformations. | Native DOM button elements, CSS `:active` states, accessible touch event listeners. | **Native DOM `<button>` elements** provide reliable touch events (`touchstart`/`touchend`). |
| **Acceptance Criteria Fit** | Perfect for R1 (Physics/Platforms) & R3 (Image Graphics). | Fulfills Acceptance Criterion 2 requirement for DOM touch buttons. | **100% compliant with all acceptance criteria**. |

#### Recommended Architecture: Hybrid Canvas-DOM Structure
- **Game Layer**: An HTML5 `<canvas>` element managing the game loop, physics engine, tilemap rendering, sprite animations, coin floating/sparkle effects, camera scrolling, and win flag sequence.
- **Overlay Layer**: A transparent DOM container positioned directly over the canvas containing:
  - **HUD**: Score, Coins Collected, Level Title / Timer.
  - **Touch Controls**: On-screen control zone with Left (`◀`), Right (`▶`), and Jump (`▲ / JUMP`) buttons.
  - **Victory Overlay**: Level Complete modal displayed upon reaching the meta/flagpole.

```html
<div id="game-container">
  <!-- Layer 1: Game Rendering Canvas -->
  <canvas id="game-canvas"></canvas>

  <!-- Layer 2: DOM HUD & Victory Modal -->
  <div id="hud-layer">
    <div class="hud-item"><span class="hud-label">COINS</span> <span id="coin-count">00</span></div>
    <div class="hud-item"><span class="hud-label">SCORE</span> <span id="score-count">0000</span></div>
    <div class="hud-item"><span class="hud-label">WORLD</span> <span>1-1</span></div>
  </div>

  <div id="victory-modal" class="hidden">
    <h2>¡VICTORIA!</h2>
    <p>¡Nivel Completado!</p>
    <button id="btn-restart">Jugar de Nuevo</button>
  </div>

  <!-- Layer 3: On-Screen DOM Touch Controls -->
  <div id="touch-controls">
    <div class="dpad-group">
      <button id="btn-left" class="touch-btn" aria-label="Move Left">◀</button>
      <button id="btn-right" class="touch-btn" aria-label="Move Right">▶</button>
    </div>
    <div class="action-group">
      <button id="btn-jump" class="touch-btn btn-jump" aria-label="Jump">▲ JUMP</button>
    </div>
  </div>
</div>
```

---

### 3.2 Viewport Scaling & Mobile Layout (Target 360x800)

#### A. Logical Game Resolution vs Physical Screen Resolution
- **Internal Virtual Resolution**: `384 × 216` (16:9 widescreen) or `360 × 240` (3:2 classic platformer ratio) or `360 × 480` for portrait-optimized view.
- **Tile Grid Unit**: Standard 16×16 px or 24×24 px tiles.
- **Why a fixed logical resolution is critical**:
  - Deterministic physics: Player jump height (e.g. 3.5 tiles high = 84px) and movement speed (e.g. 150px/sec) remain 100% identical regardless of whether the user is on a 360x800 phone, 1080x2400 tablet, or 4K desktop monitor.
  - Pixel-Art Aesthetic: Graphics scale up cleanly using nearest-neighbor interpolation without blurry anti-aliasing.

#### B. Layout Geometry on 360x800 Mobile Portrait
A 360×800 viewport has a tall 9:20 aspect ratio.
1. **Game Display Section** (Top ~60-65%, ~360×480 px):
   - Displays the platformer canvas scaled with `object-fit: contain` or letterboxed with a retro arcade bezel.
2. **Control Console Section** (Bottom ~35-40%, ~360×320 px):
   - Dedicated tactile touch pad area, avoiding finger occlusion over the game action.
   - Alternatively, on landscape viewports (800×360), touch buttons dynamically shift to semi-transparent bottom-left and bottom-right floating overlays (`bottom: 20px;`).

#### C. Responsive CSS & Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

```css
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #111;
  font-family: 'Courier New', Courier, monospace, sans-serif;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

#game-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 480px;
  max-height: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: #5c94fc; /* Mario Sky Blue */
}

#game-canvas {
  width: 100%;
  flex: 1;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
}
```

---

### 3.3 On-Screen DOM Touch Controls

#### Touch Button Specifications & Sizing
- **Left Button (`#btn-left`)**: Minimum `64px × 64px` (ideal `72px × 72px`), minimum 12px margin from edge.
- **Right Button (`#btn-right`)**: Minimum `64px × 64px` (ideal `72px × 72px`), spaced 16px from Left button.
- **Jump Button (`#btn-jump`)**: Large circular or rounded button `80px × 80px`, placed on right thumb natural resting zone (`bottom: 24px; right: 24px;`).
- **Touch Target Ergonomics**: Matches Google Material Design / WCAG AAA touch target size guidelines (minimum >48px, ideal 64-80px for game controls).

#### Robust Multi-Touch Handling Logic
Mobile platformers require simultaneous multi-touch input:
- The player holds `Right` with their left thumb while tapping `Jump` with their right thumb.
- Browser default gestures (pinch-to-zoom, double-tap zoom, swipe navigation, pull-to-refresh) must be actively suppressed via `e.preventDefault()`.

```javascript
// Universal Input State
export const InputState = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false // Single frame trigger flag for initial impulse
};

export function setupTouchControls() {
  const touchMap = [
    { id: 'btn-left', key: 'left' },
    { id: 'btn-right', key: 'right' },
    { id: 'btn-jump', key: 'jump' }
  ];

  touchMap.forEach(({ id, key }) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const startHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!InputState[key]) {
        if (key === 'jump') InputState.jumpPressed = true;
      }
      InputState[key] = true;
      btn.classList.add('active');
    };

    const endHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      InputState[key] = false;
      btn.classList.remove('active');
    };

    // Attach Touch Events (Android / iOS standard)
    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('touchcancel', endHandler, { passive: false });

    // Pointer fallback (Mouse click testing on desktop or stylus)
    btn.addEventListener('pointerdown', startHandler);
    btn.addEventListener('pointerup', endHandler);
    btn.addEventListener('pointercancel', endHandler);
    btn.addEventListener('pointerleave', endHandler);
  });
}
```

---

### 3.4 Keyboard Fallback Controls & Unified Input Manager

To allow seamless desktop testing, debugging, and cross-platform play:

| Action | Primary Key | Alternate Keys | Touch DOM Button |
|---|---|---|---|
| **Move Left** | `ArrowLeft` | `KeyA` | `#btn-left` |
| **Move Right** | `ArrowRight` | `KeyD` | `#btn-right` |
| **Jump** | `Space` | `ArrowUp`, `KeyW` | `#btn-jump` |
| **Restart Game** | `KeyR` | `Enter` | `#btn-restart` |

```javascript
export function setupKeyboardControls() {
  const activeKeys = new Set();

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
      e.preventDefault(); // Prevent desktop browser page scrolling
    }
    
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') InputState.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') InputState.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (!activeKeys.has(e.code)) {
        InputState.jumpPressed = true;
      }
      InputState.jump = true;
    }
    activeKeys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    activeKeys.delete(e.code);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (!activeKeys.has('ArrowLeft') && !activeKeys.has('KeyA')) InputState.left = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (!activeKeys.has('ArrowRight') && !activeKeys.has('KeyD')) InputState.right = false;
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (!activeKeys.has('Space') && !activeKeys.has('ArrowUp') && !activeKeys.has('KeyW')) {
        InputState.jump = false;
      }
    }
  });
}
```

---

## 4. Game Physics & Mechanics Architecture

### 4.1 Physics Constants & Tuned Platformer Feel
For responsive classic Mario physics:
- **Gravity**: `980 px/s²` (or ~28 px/frame at 60fps).
- **Max Fall Velocity (Terminal Velocity)**: `450 px/s`.
- **Run Acceleration**: `600 px/s²`.
- **Friction / Deceleration**: `700 px/s²`.
- **Max Walk Speed**: `160 px/s`.
- **Max Run Speed**: `220 px/s`.
- **Jump Impulse**: `-380 px/s` (yields a ~3.2 tile jump arc).
- **Variable Jump Height**: If the player releases the jump button while rising (`vy < -100`), cut upward velocity in half (`vy *= 0.5`) to allow short hops vs full jumps.
- **Coyote Time**: 100ms grace window allowing jump just after stepping off a platform edge.
- **Jump Buffer**: 100ms window where pressing jump right before landing queues the jump upon ground contact.

### 4.2 Axis-Separated AABB Collision Resolution
To eliminate corner-snagging, tunnel glitches, and collision jitter:
1. **Apply Horizontal Velocity ($vx \cdot dt$)**:
   - Compute new bounding box.
   - Query intersecting solid tiles from the Tilemap.
   - If collision detected on Right: Clamp `player.x = tile.x - player.width`, set `player.vx = 0`.
   - If collision detected on Left: Clamp `player.x = tile.x + tile.width`, set `player.vx = 0`.
2. **Apply Vertical Velocity ($vy \cdot dt$ + gravity)**:
   - Compute new bounding box.
   - Query intersecting solid tiles from the Tilemap.
   - If collision detected on Floor: Clamp `player.y = tile.y - player.height`, set `player.vy = 0`, set `player.onGround = true`.
   - If collision detected on Ceiling (e.g. hitting a brick/question block from below): Clamp `player.y = tile.y + tile.height`, set `player.vy = 0`, trigger block bounce effect / coin reveal.

```
       [Tilemap Grid]
+-------------------------------+
| . . . . . . . . . . . . . . . |
| . . [?][B][?][B] . . . . . .  |  <-- Ceiling Collision / Block Trigger
| . . . . . . . . . . . . . . . |
| . . . [Player] . . . . . . .  |
| . . . . [-->] . . . . [Coin] .|  <-- Collectible Overlap Check
| [G][G][G][G][G][G][G][G][G] . |  <-- Floor Collision Resolution
+-------------------------------+
```

### 4.3 Collectibles & Goal / Win State
- **Coins**:
  - Placed in floating arcs and inside Question Blocks.
  - Floating coin collision is non-solid trigger: On overlap, plays collection sparkle animation, increments coin counter (`+1`), increases score (`+100`), and removes coin instance.
- **Goal Flagpole & Castle**:
  - Placed at the end of the stage (`x ≈ 2000px`).
  - Touching flagpole triggers:
    1. Freeze user input.
    2. Slide player down the flagpole smoothly.
    3. Walk player toward castle entrance.
    4. Trigger victory banner / DOM victory modal (`#victory-modal`).
    5. Score calculation (bonus points for remaining time / coins).

---

## 5. Image Assets & Zero-Error Headless Verification

### 5.1 Asset Requirements Breakdown (Acceptance Criterion 3)
The game must feature clear image-based graphics rather than plain colored rectangles:
1. **Player Character Sprites**:
   - `mario_idle.png` / sprite sheet (facing right, facing left).
   - `mario_run_1.png`, `mario_run_2.png`, `mario_run_3.png` (walk animation cycles).
   - `mario_jump.png` (airborne pose).
2. **Tile & Environment Assets**:
   - `tile_ground.png` (top grass + soil base).
   - `tile_brick.png` (destructible brick texture).
   - `tile_block_q.png` (question block animation / active / empty).
   - `tile_pipe.png` (classic green warp pipe sections).
   - `bg_cloud.png`, `bg_bush.png`, `bg_mountain.png` (scenery decoration).
3. **Collectibles & Goal**:
   - `coin_1.png` to `coin_4.png` (spinning coin sprite sequence).
   - `flagpole.png`, `flag.png`, `castle.png`.

### 5.2 Asset Loading & Headless Compatibility
To guarantee **0 JavaScript console errors** in headless Playwright/Puppeteer:
- **Preloading Pipeline**: All assets loaded through an `AssetLoader` with `Promise.all()`.
- **Fallback Data URIs / SVGs**: Provide high-quality pixel-art SVG or embedded base64 fallbacks for every sprite. If an external image file fails to load or runs under strict local `file://` protocol restrictions, the loader falls back gracefully without throwing unhandled exceptions or logging 404 console errors.
- **Safe Audio Handling**:
  - Web Audio API `AudioContext` requires user interaction before playing audio in modern browsers (Autoplay policy).
  - Audio manager must initialize `AudioContext` lazily on first touch/keypress or remain completely silent if headless to prevent `The AudioContext was not allowed to start` console warnings.

---

## 6. Proposed Project Structure & Module Plan

```
Proyecto ivan/
├── index.html            # Main entry point with Canvas, HUD, and DOM Touch Controls
├── css/
│   └── style.css         # Responsive mobile 360x800 layout, touch buttons, arcade bezel
├── js/
│   ├── main.js           # Game initialization and main requestAnimationFrame loop
│   ├── input.js          # Unified Input Manager (DOM Touch + Keyboard + Pointer events)
│   ├── physics.js        # AABB collision resolution, velocity integration, gravity
│   ├── camera.js         # Smooth horizontal viewport tracking
│   ├── tilemap.js        # Level 1-1 layout, tile definitions, solid vs trigger blocks
│   ├── player.js         # Player state machine (idle, run, jump, win sequence)
│   ├── collectibles.js   # Animated coins, particle sparkles, score popups
│   ├── renderer.js       # Canvas sprite rendering, background parallax, HUD bridge
│   └── assets.js         # Pixel sprite loader with embedded fallback data
└── assets/
    ├── sprites/          # Character, coin, and enemy/effect images
    └── tiles/            # Ground, brick, question block, pipe, flag textures
```

---

## 7. Acceptance Criteria Verification Matrix

| Acceptance Criterion | Verification Method | Expected Outcome |
|---|---|---|
| **1. Zero Console Errors in Headless** | Run headless browser test (Puppeteer/Playwright) navigating to `index.html`. Monitor `console.error` and `pageerror`. | Clean test run with **0 errors and 0 unhandled promise rejections**. |
| **2. DOM Touch Controls** | Inspect DOM for `#btn-left`, `#btn-right`, `#btn-jump`. Dispatch `touchstart` and `touchend` events. | Input state transitions `true`/`false`, `preventDefault` called, character moves and jumps. |
| **3. Image-Based Assets** | Inspect rendered canvas / DOM sprite image elements; verify pixel art textures are loaded and drawn. | Visual audit confirms rich sprites (mario, tiles, coins, flagpole), not monochrome geometric boxes. |
| **4. Mobile Viewport Layout** | Render in 360×800 viewport emulation. Check touch button bounding client rects. | Controls comfortably positioned in lower thumb zones, canvas scales cleanly without horizontal page scroll. |

---

## 8. Recommendations for Implementation Phase

1. **Keep Architecture Modular**: Keep `input.js`, `physics.js`, and `renderer.js` strictly decoupled so tests can simulate inputs and verify physics without needing a full WebGL/Canvas context.
2. **Include Inline Base64 / SVG Sprite Fallbacks**: Guarantees instant visual rendering even when opening `index.html` directly from a desktop file manager via `file://`.
3. **Implement Full Win Sequence**: Reaching the flagpole must celebrate with visual animations ("¡VICTORIA! - LEVEL COMPLETE") and display a replay/restart button.
4. **Ensure Robust Multi-touch**: Test rapid simultaneous taps (e.g. holding Right while jumping repeatedly) to verify zero dropped inputs.
