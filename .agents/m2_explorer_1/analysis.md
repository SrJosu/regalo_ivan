# Technical Architectural Analysis: Milestone 2 (Core Engine, Physics & Touch DOM)

**Working Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_explorer_1`  
**Target Milestone**: Milestone 2  
**Related Specs**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `TEST_INFRA.md`, `js/assets.js`  
**Date**: 2026-08-26  

---

## 1. Executive Summary

Milestone 2 establishes the core presentation and simulation foundation for the Classic Mario Browser & Mobile Platformer. It encompasses four interconnected components:
1. **`index.html`**: The semantic DOM hierarchy hosting the `#game-canvas` (360x800 native logical resolution), the fixed retro `#hud` header, and the high-contrast `#touch-controls` overlay containing `#btn-left`, `#btn-right`, and `#btn-jump`.
2. **`css/style.css`**: Strict zero-scroll viewport styling enforcing `touch-action: none`, `user-select: none`, exact $360\times 800$ bounds with zero unwanted scrollbars, and high-contrast touch target styling ($> 48\times 48\text{px}$) with active-state visual feedback.
3. **`js/input.js` (`window.GameInput`)**: Robust multi-touch identifier tracking mapping individual touch pointers independently to prevent cross-cancellation (allowing simultaneous running and jumping), strict `e.preventDefault()`, keyboard fallbacks (Arrow keys, WASD, Space), and one-frame edge detection.
4. **`js/physics.js` (`window.GamePhysics`)**: Axis-separated AABB collision resolution against tilemaps, variable jump height kinematics ($v_{y0} = -360\text{px/s}$, hold gravity $650\text{px/s}^2$, fall gravity $1200\text{px/s}^2$), coyote time ($85\text{ms}$), jump buffering ($100\text{ms}$), horizontal acceleration, friction, and skidding mechanics.

All modules are designed for zero external dependencies, 100% compatibility across Desktop browsers, Android mobile viewports, Headless Chrome CDP, and Node.js test environments.

---

## 2. Component 1: `index.html` Specification

### 2.1 DOM Hierarchy & Element Tree
```
<!DOCTYPE html>
└── html (lang="es")
    ├── head
    │   ├── meta (charset="UTF-8")
    │   ├── meta (viewport="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover")
    │   ├── meta (theme-color="#5c94fc")
    │   ├── title ("Super Mario - Android HTML5")
    │   └── link (rel="stylesheet", href="css/style.css")
    └── body
        └── div#game-container
            ├── header#hud
            │   ├── div.hud-item.hud-mario
            │   │   ├── span.hud-label ("MARIO")
            │   │   └── span#hud-score.hud-value ("000000")
            │   ├── div.hud-item.hud-coins
            │   │   ├── span.hud-label ("COINS")
            │   │   └── span#hud-coins.hud-value ("×00")
            │   ├── div.hud-item.hud-world
            │   │   ├── span.hud-label ("WORLD")
            │   │   └── span#hud-world.hud-value ("1-1")
            │   ├── div.hud-item.hud-time
            │   │   ├── span.hud-label ("TIME")
            │   │   └── span#hud-time.hud-value ("400")
            │   └── div.hud-item.hud-lives
            │       ├── span.hud-label ("LIVES")
            │       └── span#hud-lives.hud-value ("×3")
            │
            ├── canvas#game-canvas (width="360", height="800")
            │
            └── div#touch-controls.touch-overlay
                ├── div.dpad-container
                │   ├── button#btn-left.touch-btn.dpad-btn (aria-label="Izquierda")
                │   │   └── svg (Left Arrow Path)
                │   └── button#btn-right.touch-btn.dpad-btn (aria-label="Derecha")
                │       └── svg (Right Arrow Path)
                └── div.action-container
                    └── button#btn-jump.touch-btn.action-btn (aria-label="Salto")
                        └── span.btn-text ("A")
```

### 2.2 Script Loading Order
Scripts are declared in dependency order at the closing `</body>` tag:
```html
<script src="js/assets.js"></script>
<script src="js/physics.js"></script>
<script src="js/input.js"></script>
```

### 2.3 Headless & Acceptance Criteria Verification Matrix
- **AC1**: No broken links, script tags execute synchronously or load without console errors.
- **AC2**: `#touch-controls`, `#btn-left`, `#btn-right`, `#btn-jump` exist with correct IDs and attributes.
- **AC4**: Layout cleanly fits $360\times 800$, buttons positioned in lower thumb zone ($Y \ge 480\text{px}$), dimensions $\ge 48\times 48\text{px}$.

---

## 3. Component 2: `css/style.css` Specification

### 3.1 Viewport Constraints & Zero-Scroll Engineering
To satisfy AC4 (`scrollWidth === 360`, `scrollHeight <= 800`, zero scrollbars):
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background-color: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  max-width: 480px;
  max-height: 100vh;
  overflow: hidden;
  background-color: #5c94fc;
  touch-action: none;
}
```

### 3.2 Canvas Crisp Pixel Rendering
```css
#game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  object-fit: contain;
  background-color: #5c94fc;
}
```

### 3.3 HUD Header Overlay
```css
#hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 14px;
  pointer-events: none;
  color: #ffffff;
  text-shadow: 2px 2px 0px #000000;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.hud-label {
  font-size: 9px;
  opacity: 0.9;
}

.hud-value {
  font-size: 11px;
}
```

### 3.4 Mobile Touch Controls & Active State Feedback
```css
#touch-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 280px;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px 18px 28px 18px;
  pointer-events: none;
  touch-action: none;
}

.dpad-container {
  display: flex;
  gap: 14px;
  pointer-events: none;
}

.action-container {
  display: flex;
  pointer-events: none;
}

.touch-btn {
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: transform 0.04s ease, background-color 0.04s ease, border-color 0.04s ease;
}

#btn-left, #btn-right {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  border: 3px solid rgba(255, 255, 255, 0.75);
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.25);
}

#btn-left.active, #btn-left:active,
#btn-right.active, #btn-right:active {
  background: rgba(229, 37, 33, 0.85);
  border-color: #ffffff;
  transform: scale(0.92);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.7), inset 0 0 8px rgba(255, 255, 255, 0.6);
}

#btn-jump {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(229, 37, 33, 0.65);
  border: 3px solid rgba(255, 255, 255, 0.85);
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 2px 6px rgba(255, 255, 255, 0.35);
  margin-right: 6px;
  margin-bottom: 6px;
}

#btn-jump.active, #btn-jump:active {
  background: rgba(255, 50, 40, 0.95);
  border-color: #ffd700;
  transform: scale(0.90);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 215, 0, 0.7);
}
```

---

## 4. Component 3: `js/input.js` Specification

### 4.1 Interface Contract
```javascript
window.GameInput = {
  init(domContainer?: HTMLElement): void,
  getState(): {
    left: boolean,
    right: boolean,
    jump: boolean,
    jumpJustPressed: boolean,
    jumpJustReleased: boolean,
    reset: boolean,
    resetJustPressed: boolean
  },
  update(): void,
  reset(): void
};
```

### 4.2 Multi-Touch Identifier Tracking Architecture
To guarantee concurrent multi-touch (holding `Right` with left thumb while tapping `Jump` with right thumb):
1. **Identifier Map**: `touchMap = new Map<identifier: number, action: 'left' | 'right' | 'jump'>()`
2. **Touch Start Handling**:
   - On `#btn-left`: for each `t` in `e.changedTouches`, `touchMap.set(t.identifier, 'left')`.
   - On `#btn-right`: `touchMap.set(t.identifier, 'right')`.
   - On `#btn-jump`: `touchMap.set(t.identifier, 'jump')`.
   - Always invoke `e.preventDefault()`.
3. **Touch Move Handling**:
   - Inspects `document.elementFromPoint(t.clientX, t.clientY)` or bounding rects to smoothly reassign actions if thumbs slide between `#btn-left` and `#btn-right`.
4. **Touch End / Touch Cancel Handling**:
   - Attached to specific buttons and `window` to catch touches lifted outside button boundaries.
   - For each `t` in `e.changedTouches`, `touchMap.delete(t.identifier)`.
5. **State Aggregation**:
   - `touchState.left = Array.from(touchMap.values()).includes('left')`
   - `touchState.right = Array.from(touchMap.values()).includes('right')`
   - `touchState.jump = Array.from(touchMap.values()).includes('jump')`
   - Dynamically toggle `.active` class on corresponding DOM elements.

### 4.3 Keyboard Mapping
```javascript
const KEY_MAP = {
  left: ['ArrowLeft', 'KeyA', 'a', 'A'],
  right: ['ArrowRight', 'KeyD', 'd', 'D'],
  jump: ['Space', 'ArrowUp', 'KeyW', 'w', 'W', 'KeyZ', 'z', 'Z', 'KeyJ', 'j', 'J', ' '],
  reset: ['KeyR', 'r', 'R']
};
```
- `keydown` / `keyup` handlers prevent default browser behaviors (scrolling on Space or Arrow keys).
- Keyboard presses activate `.active` class on touch buttons for visual feedback consistency.

### 4.4 Pulse & Edge Detection Lifecycle
In `update()` (called once per simulation tick):
```javascript
jumpJustPressed = (currentJump && !prevJump);
jumpJustReleased = (!currentJump && prevJump);
resetJustPressed = (currentReset && !prevReset);

prevJump = currentJump;
prevReset = currentReset;
```

---

## 5. Component 4: `js/physics.js` Specification

### 5.1 Interface Contract & Constants
```javascript
window.GamePhysics = {
  TILE_SIZE: 16,
  GRAVITY_FALL: 1200,          // Heavy downward acceleration (px/s²)
  GRAVITY_HOLD: 650,           // Lighter gravity when holding Jump button (px/s²)
  JUMP_VELOCITY: -360,         // Initial jump impulse (px/s)
  JUMP_RELEASE_CUTOFF: -120,   // Velocity floor when jump is released early (px/s)
  ACCELERATION: 480,           // Ground acceleration (px/s²)
  AIR_ACCELERATION: 360,       // Air acceleration (px/s²)
  MAX_RUN_SPEED: 160,          // Maximum horizontal velocity (px/s)
  FRICTION: 600,               // Ground deceleration when coasting (px/s²)
  SKID_DECELERATION: 900,      // Ground braking when reversing direction (px/s²)
  TERMINAL_VELOCITY: 450,      // Maximum fall speed (px/s)
  COYOTE_TIME: 0.085,          // 85ms coyote time off platform edges (s)
  JUMP_BUFFER_TIME: 0.100,     // 100ms jump buffer before landing (s)

  applyKinematics(entity, dt, inputState): void,
  resolveMapCollisions(entity, map, dt): {
    collidedX: boolean,
    collidedY: boolean,
    hitCeilingTile: object | null,
    landedOnTile: object | null
  },
  checkAABB(rectA, rectB): boolean
};
```

### 5.2 Kinematics & Mechanics Logic

#### 1. Horizontal Motion & Skidding
- Direction input $D \in \{-1, 0, 1\}$ (Left = -1, Right = 1, None/Both = 0).
- If $D \neq 0$:
  - **Skid Check**: If $entity.vx \cdot D < -20$ (moving opposite to input):
    - `entity.isSkidding = true`
    - `entity.vx += D * SKID_DECELERATION * dt`
  - **Normal Acceleration**:
    - `entity.isSkidding = false`
    - `const accel = entity.onGround ? ACCELERATION : AIR_ACCELERATION`
    - `entity.vx += D * accel * dt`
    - Clamp: `entity.vx = Math.max(-MAX_RUN_SPEED, Math.min(MAX_RUN_SPEED, entity.vx))`
  - Update facing: `entity.facing = D > 0 ? 1 : -1`
- If $D == 0$:
  - `entity.isSkidding = false`
  - Decelerate by `FRICTION * dt` towards 0 (set to 0 if $|vx| < FRICTION * dt$).

#### 2. Jump Kinematics, Variable Jump, Coyote Time & Buffering
- **Coyote Timer**:
  - If `entity.onGround`: `entity.coyoteTimer = COYOTE_TIME` ($85\text{ms}$).
  - Else: `entity.coyoteTimer = Math.max(0, entity.coyoteTimer - dt)`.
- **Jump Buffer Timer**:
  - If `inputState.jumpJustPressed`: `entity.jumpBufferTimer = JUMP_BUFFER_TIME` ($100\text{ms}$).
  - Else: `entity.jumpBufferTimer = Math.max(0, entity.jumpBufferTimer - dt)`.
- **Jump Trigger**:
  - Condition: `(entity.jumpBufferTimer > 0) && (entity.onGround || entity.coyoteTimer > 0)`.
  - Action: `entity.vy = JUMP_VELOCITY`, `entity.onGround = false`, `entity.coyoteTimer = 0`, `entity.jumpBufferTimer = 0`, `entity.isJumping = true`.
- **Variable Jump Release**:
  - If `inputState.jumpJustReleased` or (!`inputState.jump` && `entity.vy < JUMP_RELEASE_CUTOFF`):
    - `entity.vy = Math.max(entity.vy, JUMP_RELEASE_CUTOFF)` (shortens arc instantly when button released).
- **Gravity & Terminal Velocity**:
  - If `entity.isJumping && inputState.jump && entity.vy < 0`: $g = \text{GRAVITY\_HOLD}$ ($650$).
  - Else: $g = \text{GRAVITY\_FALL}$ ($1200$).
  - `entity.vy = Math.min(TERMINAL_VELOCITY, entity.vy + g * dt)`.

### 5.3 Axis-Separated AABB Tilemap Collision Resolution
Separating axes prevents corner snagging, diagonal tunneling, and disambiguates ceiling hits vs wall hits.

#### Step 1: Sub-stepping Anti-Tunneling Guard
If $|vy \cdot dt| > \text{TILE\_SIZE} / 2$ ($8\text{px}$), divide the integration step into $N = \lceil |vy \cdot dt| / 8 \rceil$ sub-steps of size $dt / N$.

#### Step 2: X-Axis Movement & Resolution
1. Calculate candidate $x = entity.x + entity.vx \cdot dt$.
2. Bounding box: $[x, entity.y, entity.width, entity.height]$.
3. Overlapping tile ranges:
   - $tx_{start} = \lfloor x / \text{TILE\_SIZE} \rfloor$
   - $tx_{end} = \lfloor (x + width - 0.001) / \text{TILE\_SIZE} \rfloor$
   - $ty_{start} = \lfloor entity.y / \text{TILE\_SIZE} \rfloor$
   - $ty_{end} = \lfloor (entity.y + height - 0.001) / \text{TILE\_SIZE} \rfloor$
4. Check solid tiles in range:
   - If $entity.vx > 0$ (moving right) and tile is solid:
     - $entity.x = tx \cdot \text{TILE\_SIZE} - entity.width$
     - $entity.vx = 0$
     - `collidedX = true`
   - If $entity.vx < 0$ (moving left) and tile is solid:
     - $entity.x = (tx + 1) \cdot \text{TILE\_SIZE}$
     - $entity.vx = 0$
     - `collidedX = true`
   - If no collision: $entity.x = x$.
5. Clamp to level left boundary: $entity.x = \max(0, entity.x)$.

#### Step 3: Y-Axis Movement & Resolution
1. Calculate candidate $y = entity.y + entity.vy \cdot dt$.
2. Bounding box: $[entity.x, y, entity.width, entity.height]$.
3. Overlapping tile ranges:
   - $tx_{start} = \lfloor entity.x / \text{TILE\_SIZE} \rfloor$
   - $tx_{end} = \lfloor (entity.x + entity.width - 0.001) / \text{TILE\_SIZE} \rfloor$
   - $ty_{start} = \lfloor y / \text{TILE\_SIZE} \rfloor$
   - $ty_{end} = \lfloor (y + entity.height - 0.001) / \text{TILE\_SIZE} \rfloor$
4. Check solid tiles in range:
   - If $entity.vy \ge 0$ (falling / landing) and tile is solid:
     - $entity.y = ty \cdot \text{TILE\_SIZE} - entity.height$
     - $entity.vy = 0$
     - $entity.onGround = true$
     - $entity.isJumping = false$
     - `collidedY = true`
     - `landedOnTile = { tx, ty, type: map.getTile(tx, ty) }`
   - If $entity.vy < 0$ (jumping up) and tile is solid:
     - $entity.y = (ty + 1) \cdot \text{TILE\_SIZE}$
     - $entity.vy = 0$
     - `collidedY = true`
     - `hitCeilingTile = { tx, ty, type: map.getTile(tx, ty) }`
   - If no ground collision: $entity.y = y$, $entity.onGround = false$.

---

## 6. Verification & Implementation Strategy

### 6.1 Unit & Integration Test Vectors
1. **Multi-Touch Test**:
   - Dispatch simultaneous `touchstart` with `identifier: 1` on `#btn-right` and `identifier: 2` on `#btn-jump`.
   - Assert `GameInput.getState()` returns `{ right: true, jump: true }`.
   - Dispatch `touchend` with `identifier: 2` on `#btn-jump`.
   - Assert `GameInput.getState()` returns `{ right: true, jump: false }`.
2. **Coyote Time Test**:
   - Player walks off ledge at $t=0$.
   - At $t=0.05\text{s}$ ($50\text{ms} < 85\text{ms}$), dispatch jump.
   - Assert player enters jump state ($vy = -360\text{px/s}$).
3. **Jump Buffer Test**:
   - Player falling in air at $t=0$, presses jump ($100\text{ms}$ buffer set).
   - Player lands on ground at $t=0.06\text{s}$ ($60\text{ms} < 100\text{ms}$).
   - Assert player immediately re-launches with jump impulse.
4. **Tilemap Collision & Anti-Tunneling Test**:
   - Position entity at $y=0$ above solid tile floor at $y=64$. Set $vy = 800\text{px/s}$, $dt = 0.1\text{s}$ ($\Delta y = 80\text{px}$).
   - Assert entity lands cleanly at $y = 64 - \text{height}$ without penetrating or tunneling through the floor.
5. **Zero Console Error Gate**:
   - Load `index.html` via Chrome CDP, assert zero exceptions or unhandled errors.

---
