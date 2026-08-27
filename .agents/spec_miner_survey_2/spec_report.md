# Complete Functional Specifications: Classic Mario-Style Web Platformer

**Document Version**: 1.0  
**Author**: Spec Miner 2  
**Date**: 2026-08-26  
**Status**: Authoritative Functional Specification  
**Target Platform**: Browser (Mobile Touch on Android Chrome/Safari + Desktop Keyboard Fallback)

---

## 1. System Architecture & Overview

### 1.1 High-Level Architecture
The application is a self-contained, zero-external-dependency HTML5 2D platformer. It consists of seven core decoupled modular subsystems:
1. **Engine Core & Game Loop**: Fixed-timestep accumulator loop (`requestAnimationFrame`), delta-time normalization, state manager (TITLE, PLAYING, LEVEL_CLEAR, GAME_OVER).
2. **Physics Engine**: 2D kinematics with Euler integration, sub-pixel positioning, variable gravity, friction, skidding deceleration, terminal velocity.
3. **Tilemap & Collision System**: Grid-based spatial hashing, AABB (Axis-Aligned Bounding Box) continuous-discrete resolution, directional collision normals (floor, ceiling, left, right), dynamic block bounce reaction.
4. **Entity Component System**: Base `Entity` class with specialized subclasses: `Player`, `Goomba`, `Coin`, `Particle`, `FloatingScore`.
5. **Procedural Visual Asset Pipeline**: In-memory HTML5 Canvas pixel-art rasterization generating crisp, authentic sprites and tiles (Player, Blocks, Enemies, Items, Castle, Clouds, Hills).
6. **Procedural Web Audio Engine**: Zero-asset procedural synthesis via Web Audio API oscillators and gain envelopes for all SFX (Jump, Coin, Stomp, Block Bump, Death, Victory Fanfare).
7. **Mobile Touch & Responsive Viewport System**: Multi-touch event processor (`touchstart`, `touchmove`, `touchend`, `touchcancel`), virtual D-pad + Jump button overlay, responsive CSS canvas scaling preserving pixel aspect ratio.

---

## 2. Game Physics & Kinematics Specification

### 2.1 Coordinate System & Units
- **Origin $(0,0)$**: Top-left corner of the level.
- **Axes**: $+X$ extends rightward, $+Y$ extends downward.
- **Base Tile Size ($T$)**: $16 \times 16\text{ px}$ (Internal Virtual Resolution: $320 \times 240\text{ px}$ or $360 \times 240\text{ px}$).
- **Time Unit**: Seconds ($s$). Fixed update step $\Delta t = 1/60 \approx 0.01667\text{s}$ (clamped to max $0.05\text{s}$ to avoid tunneling after tab backgrounding).

### 2.2 Horizontal Movement Physics
| Parameter | Symbol | Specification Value | Description |
|---|---|---|---|
| Walking Acceleration | $a_{\text{walk}}$ | $500\text{ px/s}^2$ | Rate of speed increase while holding direction on ground |
| Running Acceleration | $a_{\text{run}}$ | $750\text{ px/s}^2$ | Accelerated rate when dash/run is active |
| Max Walk Velocity | $v_{x,\max\text{-walk}}$ | $140\text{ px/s}$ | Maximum horizontal walking speed (~8.75 tiles/s) |
| Max Run Velocity | $v_{x,\max\text{-run}}$ | $220\text{ px/s}$ | Maximum horizontal sprint speed (~13.75 tiles/s) |
| Ground Friction (Deceleration) | $d_{\text{ground}}$ | $600\text{ px/s}^2$ | Natural slowing when no input is pressed on ground |
| Skid Friction | $d_{\text{skid}}$ | $1200\text{ px/s}^2$ | Rapid braking when input opposes current motion sign |
| Air Acceleration | $a_{\text{air}}$ | $350\text{ px/s}^2$ | Horizontal steering authority while airborne |
| Air Drag (Deceleration) | $d_{\text{air}}$ | $150\text{ px/s}^2$ | Minimal air resistance when airborne with neutral input |
| Velocity Zero Cutoff | $\epsilon_v$ | $2.0\text{ px/s}$ | If $\|v_x\| < \epsilon_v$ and no input, snap $v_x = 0$ |

#### Horizontal Motion Integration Logic
1. **Input Direction Determination**: $dir \in \{-1, 0, 1\}$.
2. **Acceleration vs. Skidding**:
   - If $dir \neq 0$:
     - If $\text{sign}(v_x) == dir$ or $v_x == 0$: $v_x \leftarrow v_x + dir \cdot a_{\text{walk}} \cdot \Delta t$, clamped to $[-v_{x,\max}, v_{x,\max}]$.
     - If $\text{sign}(v_x) \neq dir$: Trigger `SKID` state; $v_x \leftarrow v_x + dir \cdot d_{\text{skid}} \cdot \Delta t$.
   - If $dir == 0$:
     - If $v_x > 0$: $v_x \leftarrow \max(0, v_x - d_{\text{ground}} \cdot \Delta t)$.
     - If $v_x < 0$: $v_x \leftarrow \min(0, v_x + d_{\text{ground}} \cdot \Delta t)$.

---

### 2.3 Vertical Movement & Variable Jump Physics
| Parameter | Symbol | Specification Value | Description |
|---|---|---|---|
| Base Jump Impulse | $v_{y0}$ | $-360\text{ px/s}$ | Instantaneous upward velocity applied on jump start |
| Hold Gravity | $g_{\text{hold}}$ | $650\text{ px/s}^2$ | Reduced gravity while holding Jump button and ascending ($v_y < 0$) |
| Fall / Normal Gravity | $g_{\text{fall}}$ | $1200\text{ px/s}^2$ | Higher gravity when falling ($v_y \ge 0$) or after releasing jump |
| Stomp Rebound Impulse | $v_{y,\text{stomp}}$ | $-240\text{ px/s}$ | Bounce impulse applied when stomping on an enemy |
| High Stomp Rebound | $v_{y,\text{stomp-high}}$ | $-340\text{ px/s}$ | Bounce impulse if jump button is held during enemy stomp |
| Terminal Velocity | $v_{y,\max}$ | $+450\text{ px/s}$ | Maximum downward falling speed |
| Jump Input Buffer Window | $t_{\text{buffer}}$ | $100\text{ ms}$ | Buffers jump press before touching ground |
| Coyote Time Window | $t_{\text{coyote}}$ | $85\text{ ms}$ | Permits jump within 85ms after running off ledge |

#### Variable Jump Mechanics (Super Mario Feel)
1. **Jump Initiation**:
   - Condition: `(grounded || coyoteTimer > 0) && (jumpPressed || jumpBufferTimer > 0)`.
   - Action: $v_y \leftarrow v_{y0}$, `grounded = false`, `coyoteTimer = 0`, `jumpBufferTimer = 0`, `isJumping = true`, play Jump sound.
2. **Ascent Phase ($v_y < 0$)**:
   - If `jumpButtonHeld == true` and `isJumping == true`:
     - Apply lower gravity: $v_y \leftarrow v_y + g_{\text{hold}} \cdot \Delta t$. (Allows reaching full height of ~4.5 tiles).
   - If `jumpButtonHeld == false` or released mid-jump:
     - `isJumping = false`; switch immediately to fall gravity: $v_y \leftarrow v_y + g_{\text{fall}} \cdot \Delta t$. (Allows short hop of ~1.5 tiles).
3. **Descent Phase ($v_y \ge 0$)**:
   - Apply fall gravity: $v_y \leftarrow \min(v_{y,\max}, v_y + g_{\text{fall}} \cdot \Delta t)$.

---

## 3. Collision Detection & Resolution Engine

### 3.1 Map Representation & Tile Solidities
Map is a grid array of dimensions $W_{\text{map}} \times H_{\text{map}}$ (e.g. $120 \times 15$ tiles).
Each tile index represents:
- `0`: Air (Non-solid, no interaction)
- `1`: Ground / Dirt Block (Solid, indestructible)
- `2`: Brick Block (Solid, bumpable from below, particle break if super)
- `3`: Question / Item Block (Solid, bumpable from below, contains Coin/Powerup)
- `4`: Used / Empty Block (Solid, inert)
- `5`: Pipe Top-Left (Solid)
- `6`: Pipe Top-Right (Solid)
- `7`: Pipe Body-Left (Solid)
- `8`: Pipe Body-Right (Solid)
- `9`: Flagpole Top/Shaft (Non-solid sensor, triggers victory)
- `10`: Flagpole Base (Solid ground)
- `11`: Castle Brick (Solid)
- `12`: Castle Door (Non-solid trigger, level clear finish)

### 3.2 Axis-Separated AABB Resolution Algorithm
Collision resolution is computed independently along X, then Y to avoid diagonal corner snagging.

```
Bounding Box: { x, y, width: 14, height: 24, vx, vy }
```

#### Step 1: Horizontal Movement & Resolution
1. $x_{\text{new}} \leftarrow x + v_x \cdot \Delta t$
2. Compute overlapping tile indices:
   - $col_{\text{left}} = \lfloor x_{\text{new}} / T \rfloor$
   - $col_{\text{right}} = \lfloor (x_{\text{new}} + w - 0.001) / T \rfloor$
   - $row_{\text{top}} = \lfloor y / T \rfloor$
   - $row_{\text{bottom}} = \lfloor (y + h - 0.001) / T \rfloor$
3. Check tiles in range $[row_{\text{top}} \dots row_{\text{bottom}}]$:
   - If $v_x > 0$ and any tile in column $col_{\text{right}}$ is solid:
     - $x \leftarrow col_{\text{right}} \cdot T - w$
     - $v_x \leftarrow 0$
     - Emit horizontal wall collision event.
   - If $v_x < 0$ and any tile in column $col_{\text{left}}$ is solid:
     - $x \leftarrow (col_{\text{left}} + 1) \cdot T$
     - $v_x \leftarrow 0$
     - Emit horizontal wall collision event.
   - Else: $x \leftarrow x_{\text{new}}$.

#### Step 2: Vertical Movement & Resolution
1. $y_{\text{new}} \leftarrow y + v_y \cdot \Delta t$
2. Compute overlapping tile indices:
   - $col_{\text{left}} = \lfloor x / T \rfloor$
   - $col_{\text{right}} = \lfloor (x + w - 0.001) / T \rfloor$
   - $row_{\text{top}} = \lfloor y_{\text{new}} / T \rfloor$
   - $row_{\text{bottom}} = \lfloor (y_{\text{new}} + h - 0.001) / T \rfloor$
3. Check tiles in range $[col_{\text{left}} \dots col_{\text{right}}]$:
   - If $v_y > 0$ (Falling down):
     - If any tile in $row_{\text{bottom}}$ is solid:
       - $y \leftarrow row_{\text{bottom}} \cdot T - h$
       - $v_y \leftarrow 0$
       - `grounded = true`, `coyoteTimer = coyoteMax`
   - If $v_y < 0$ (Jumping up):
     - If any tile in $row_{\text{top}}$ is solid:
       - $y \leftarrow (row_{\text{top}} + 1) \cdot T$
       - $v_y \leftarrow 0$
       - For each solid tile hit at $(c, row_{\text{top}})$: Trigger `onTileHitFromBelow(c, row_top)`.
   - Else: $y \leftarrow y_{\text{new}}$, `grounded = false`.

### 3.3 Dynamic Block Bump Interaction
When a player's head collides with the underside of a block at $(col, row)$:
1. **Question Block (`ID: 3`)**:
   - Tile replaces immediately with Used Block (`ID: 4`).
   - Spawns a Block Bump animation at $(col, row)$: tile renders offset vertically by $-6\text{ px}$ and returns smoothly to $0\text{ px}$ over $150\text{ ms}$.
   - Spawns popping Coin entity: launches upward from block with $v_y = -280\text{ px/s}$, rotates rapidly, plays Coin chime, increments Coin count ($+1$) and Score ($+200$), then vanishes.
   - Any enemy walking directly on top of this tile $(col, row - 1)$ receives an instant flip defeat.
2. **Brick Block (`ID: 2`)**:
   - Triggers vertical bump animation ($-4\text{ px}$ over $120\text{ ms}$).
   - Plays Block Bump SFX.
   - Any enemy walking directly on top of this block is defeated.

---

## 4. Entities, State Machines & Mechanics

### 4.1 Player Entity Specification
- **Bounding Box**: Width $14\text{ px}$, Height $24\text{ px}$ (rendered centered in $16 \times 24$ sprite).
- **State Machine**:
  - `IDLE`: Grounded, $\|v_x\| == 0$. Sprite: Stand frame.
  - `WALK`: Grounded, $0 < \|v_x\| \le v_{x,\max\text{-walk}}$. Animated 3-frame walking cycle (speed proportional to $|v_x|$).
  - `RUN`: Grounded, $\|v_x\| > v_{x,\max\text{-walk}}$. Fast 3-frame walking cycle.
  - `SKID`: Grounded, input direction opposes velocity vector. Sprite: Skid/turnaround frame.
  - `JUMP`: Airborne, $v_y < 0$. Sprite: Jump frame (arms extended).
  - `FALL`: Airborne, $v_y \ge 0$. Sprite: Falling/Jump frame.
  - `FLAG_SLIDE`: Touching flagpole, sliding down at constant speed ($+100\text{ px/s}$).
  - `VICTORY_WALK`: Walking autonomously toward castle door at $+60\text{ px/s}$.
  - `DEAD`: Triggered by enemy hit or pit fall. Freezes frame for $200\text{ ms}$, jumps upward ($v_y = -340\text{ px/s}$), disables collisions, falls off screen, triggers respawn/game over.

---

### 4.2 Enemy Specification (Goomba-Style Walker)
- **Bounding Box**: Width $14\text{ px}$, Height $14\text{ px}$ (in $16 \times 16$ tile).
- **Movement**:
  - Patrol velocity: $v_x = -40\text{ px/s}$ (initial leftward march).
  - Gravity: $g = 1200\text{ px/s}^2$.
  - Wall collision: If colliding with wall or level boundary or another enemy, inverts velocity $v_x \leftarrow -v_x$.
  - Edge/Cliff behavior: Walks off ledges and falls naturally with gravity.
- **Player vs Enemy Interaction**:
  - **Stomp Condition**:
    $$\text{player}.y + \text{player}.h - (\text{player}.v_y \cdot \Delta t) \le \text{enemy}.y + 6\text{ px} \quad \text{AND} \quad \text{player}.v_y > 0$$
  - **Stomp Resolution**:
    - Enemy enters `SQUASHED` state: collision disabled, renders flat squashed sprite for $500\text{ ms}$, then despawns.
    - Player receives rebound impulse ($v_y = -240\text{ px/s}$, or $-340\text{ px/s}$ if holding jump).
    - Plays Stomp sound, awards $+100\text{ points}$, spawns floating `100` score text popup.
  - **Side/Bottom Collision (Player Hurt)**:
    - If Stomp condition is FALSE:
      - Player triggers `DEAD` state sequence.
      - Play Death SFX.
      - Level resets or game over triggered.

---

### 4.3 Collectibles & HUD Systems
- **Spinning Coins**:
  - Placed throughout level. Bounding box $10 \times 14\text{ px}$.
  - Animation: 4-frame continuous 3D rotation ($120\text{ ms}$ per frame).
  - Pickup trigger: Player AABB overlaps Coin AABB.
  - Effect: Coin despawns, plays Coin chime, $+200\text{ points}$, $+1\text{ coin}$, spawns sparkle particle.
- **HUD Display**:
  - Retro pixel font rendered at top of screen:
    - `MARIO`: Score (e.g. `002400`)
    - `COINS`: `x 08` with mini coin icon
    - `WORLD`: `1-1`
    - `TIME`: Countdown timer (e.g. `300` ticks down every second)

---

### 4.4 Goal Flagpole, Castle & Win Sequence
1. **Trigger**: Player bounding box overlaps Flagpole vertical sensor line ($X_{\text{flag}} \pm 6\text{ px}$).
2. **Phase 1 (Flag Grab & Slide)**:
   - Player control disabled.
   - Player snaps to left side of flagpole ($X = X_{\text{flag}} - 8\text{ px}$).
   - Flag Grab Score awarded: Top ($5000\text{ pts}$), Upper ($2000\text{ pts}$), Middle ($800\text{ pts}$), Lower ($400\text{ pts}$), Base ($100\text{ pts}$).
   - Player slides down pole ($v_y = +100\text{ px/s}$).
   - Flag sprite slides synchronously from top of pole down to flagpole base.
3. **Phase 2 (Dismount & Castle March)**:
   - When Player reaches base ($Y \ge Y_{\text{base}} - h$):
   - Player hops to right side of flagpole ($X = X_{\text{flag}} + 8\text{ px}$).
   - Delay $200\text{ ms}$.
   - Player initiates autonomous `VICTORY_WALK` ($v_x = +60\text{ px/s}$) moving rightward.
   - Play Stage Clear Fanfare SFX.
4. **Phase 3 (Castle Entrance & Victory Overlay)**:
   - When Player reaches Castle Door center ($X \ge X_{\text{door}}$):
     - Player sprite is hidden.
     - Castle raises victory banner / fireworks particle.
     - Display "STAGE CLEAR! YOU WIN!" overlay with final score breakdown.
     - Show "REPLAY / RESTART" touch button and key prompt.

---

## 5. Web Audio API Procedural Synthesis Engine

To guarantee 100% reliability with zero broken audio asset links or loading latency, all audio is synthesized procedurally in real-time via standard Web Audio API (`AudioContext`).

### 5.1 Autoplay & AudioContext Initialization
- Create `AudioContext` lazily on first user gesture (`touchstart`, `mousedown`, `keydown`).
- Resume suspended audio context if state is `'suspended'`.

### 5.2 Sound Effect Synthesis Parameters
```
+------------------+---------------+-------------------------+----------------------+--------------------+
| Sound Name       | Waveform      | Frequency Envelope      | Gain / ADSR Envelope | Duration           |
+------------------+---------------+-------------------------+----------------------+--------------------+
| Jump             | Square / Tri  | 140Hz -> 620Hz (exp)    | Peak 0.3 -> 0 (lin)  | 0.16s              |
| Coin             | Square        | 988Hz(80ms)->1319Hz(300)| Peak 0.25 -> 0 (exp) | 0.38s              |
| Stomp            | Square+Noise  | 180Hz -> 30Hz (exp)     | Peak 0.4 -> 0 (lin)  | 0.12s              |
| Block Bump       | Square        | 160Hz -> 60Hz (exp)     | Peak 0.35 -> 0 (lin) | 0.10s              |
| Player Death     | Square        | 500Hz -> 100Hz (stepped)| Peak 0.3 -> 0 (lin)  | 0.65s (arpeggio)   |
| Stage Clear      | Square+Tri    | C5,E5,G5,C6,E6,G6       | Multi-note sequence  | 2.80s (fanfare)    |
+------------------+---------------+-------------------------+----------------------+--------------------+
```

#### Exact Synthesis Code Specifications:
1. **Jump Sound**:
   - `osc.type = 'square'`; `osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);`
   - `gain.gain.setValueAtTime(0.3, t); gain.gain.linearRampToValueAtTime(0.01, t + 0.15);`
2. **Coin Chime**:
   - Tone 1: $B_5$ ($987.77\text{ Hz}$) for $0.07\text{s}$, followed immediately by Tone 2: $E_6$ ($1318.51\text{ Hz}$) decaying over $0.3\text{s}$.
3. **Stomp Sound**:
   - Low-frequency square thump with rapid downward exponential sweep ($200\text{ Hz} \to 40\text{ Hz}$).
4. **Block Bump**:
   - Low square pulse ($120\text{ Hz} \to 60\text{ Hz}$) over $0.08\text{s}$.
5. **Stage Clear Fanfare**:
   - Sequence of notes: $G_4, C_5, E_5, G_5, C_6, E_6, G_6$ followed by sustained chord.

---

## 6. Procedural Pixel-Art & Visual Asset Pipeline

The game generates all sprite sheets, textures, and UI elements directly via an internal Pixel Art Generator (Offscreen Canvas / Canvas 2D rasterizer), guaranteeing authentic retro aesthetics, sharp pixel scaling, and zero network asset dependencies.

### 6.1 Color Palette (NES / Classic 8-Bit Authentic)
- **Sky Blue**: `#5C94FC`
- **Ground Brown / Earth**: `#C84C0C`, Grass Green Top: `#00A800`, `#80D010`
- **Brick Red / Mortar**: `#D82800`, `#FC9838`, `#000000`
- **Question Gold**: `#FCBCB0`, `#FC7460`, `#805000`
- **Mario Palette**: Red `#E52521`, Blue `#0026FF`, Skin `#FDB813`, Brown `#6B3800`, White `#FFFFFF`
- **Goomba Palette**: Cap Brown `#A81000`, Belly Tan `#FCB470`, Feet Black `#000000`
- **Coin Gold**: `#FFD700`, Highlight `#FFFF80`, Outline `#A07000`
- **Flag / Pole**: Pole Green `#00A800`, Flag Bright Green `#58D854`, Ball Gold `#FFD700`
- **Castle Gray / Stone**: `#E4E4E4`, `#A8A8A8`, `#505050`, Door Black `#000000`

### 6.2 Sprite Rasterization Specs
- **Player Sprites ($16 \times 24\text{ px}$)**:
  - `mario_idle`: Standing facing camera/direction.
  - `mario_walk_1`, `mario_walk_2`, `mario_walk_3`: 3-frame running gait cycle.
  - `mario_skid`: Turning frame with skid mark.
  - `mario_jump`: Reaching upward with arms raised.
  - `mario_slide`: Holding flagpole.
  - `mario_die`: Facing forward with arms up.
- **Environment Tiles ($16 \times 16\text{ px}$)**:
  - `tile_ground`: Brown textured stone/dirt with top green grass tufts.
  - `tile_brick`: 4 brick rows with shaded highlights and mortar grooves.
  - `tile_question_1`, `tile_question_2`, `tile_question_3`: Blinking question block with distinct center `'?'`.
  - `tile_used`: Metallic brown empty block with 4 corner rivets.
  - `tile_pipe_tl`, `tile_pipe_tr`, `tile_pipe_bl`, `tile_pipe_br`: Pipe rim with metallic gradient highlight.
  - `tile_castle_brick`, `tile_castle_door`: Fortress battlements and arched gate.
- **Enemy Sprites ($16 \times 16\text{ px}$)**:
  - `goomba_walk_1`, `goomba_walk_2`: Wobbly walking gait with shifting feet.
  - `goomba_squash`: Flattened body (8px tall) with squished eyes.
- **Collectibles & Effects**:
  - `coin_1` ($16\text{px}$), `coin_2` ($12\text{px}$), `coin_3` ($4\text{px}$), `coin_4` ($12\text{px}$): 3D spinning coin.
  - `particle_sparkle`: 4-point golden star.
  - `particle_brick_chunk`: 4 rotating debris pieces when bricks smash.

---

## 7. Mobile Touch Controls & Responsive Viewport System

### 7.1 Viewport & Responsive Canvas Layout
- **Internal Virtual Resolution**: $320 \times 240\text{ px}$ (4:3 classic aspect ratio) or $360 \times 240\text{ px}$ (16:10 wide mobile ratio).
- **Display Resolution Scaling**: Canvas automatically scales via CSS to fill the mobile browser window (`width: 100vw`, `height: 100vh`, `object-fit: contain`) with background `#000000`.
- **Pixel Art Sharpness**: CSS `image-rendering: pixelated; image-rendering: crisp-edges;` ensures razor-sharp pixel rendering without bilinear blur.

### 7.2 On-Screen Touch Controls Specification
To fulfill requirement R2 and mobile acceptance criteria, on-screen touch buttons are rendered on a responsive HUD/DOM overlay designed specifically for mobile ergonomics (360x800, 390x844, etc.).

```
+----------------------------------------------------------------+
|  HUD: MARIO 002400   COINS x08   WORLD 1-1   TIME 285          |
|                                                                |
|                                                                |
|                        GAME WORLD CANVAS                       |
|                                                                |
|                                                                |
|                                                                |
|   +----+  +----+                             +------------+    |
|   | ◀  |  | ▶  |                             |   JUMP ⮝   |    |
|   |LEFT|  |RGHT|                             |   BUTTON   |    |
|   +----+  +----+                             +------------+    |
| (Bottom-Left: 64x64px each)               (Bottom-Right: 74x74px)|
+----------------------------------------------------------------+
```

#### Touch Button Specifications:
- **Left Button (`#btn-left`)**:
  - Position: Bottom-left, `left: 16px; bottom: 20px;`
  - Dimensions: $64 \times 64\text{ px}$, circular or rounded rectangle (border-radius 16px).
  - Icon: Bold white arrow `◀`.
- **Right Button (`#btn-right`)**:
  - Position: Bottom-left, `left: 88px; bottom: 20px;`
  - Dimensions: $64 \times 64\text{ px}$, rounded rectangle.
  - Icon: Bold white arrow `▶`.
- **Jump Button (`#btn-jump`)**:
  - Position: Bottom-right, `right: 20px; bottom: 20px;`
  - Dimensions: $74 \times 74\text{ px}$, large circular button.
  - Label/Icon: `JUMP` with upward arrow `▲`.
- **Touch Event Handling**:
  - Attached to DOM touch overlay with `passive: false`.
  - Captures `touchstart`, `touchmove`, `touchend`, `touchcancel`.
  - Implements `event.preventDefault()` to eliminate mobile scroll, pinch-zoom, and double-tap delay.
  - Tracks multiple active touches via `touch.identifier` so players can hold **Right** with left thumb while tapping/holding **Jump** with right thumb.
- **Visual Feedback**:
  - Semi-transparent dark glass background (`rgba(255, 255, 255, 0.25)`).
  - Active pressed state: Glowing highlight (`rgba(255, 255, 255, 0.6)`), scale transform $0.92$.
- **Keyboard Mapping (Desktop Fallback)**:
  - Left: `ArrowLeft` / `KeyA`
  - Right: `ArrowRight` / `KeyD`
  - Jump: `Space` / `ArrowUp` / `KeyW` / `KeyZ` / `KeyX`

---

## 8. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Physics | Horizontal Kinematics | Walking/Running acceleration, max speed cap, friction deceleration, and skidding braking | Left/Right input state, `dt` | Updated `x`, `vx`, player facing orientation | Clamp at $v_{x,\max}$; snap to 0 if under threshold | Spec Analysis (Classic Mario mechanics) |
| 2 | Physics | Variable Jump Impulse | Holding jump button applies low gravity ($g_{\text{hold}}$), releasing applies high fall gravity ($g_{\text{fall}}$) | Jump button state (held/released), `vy`, `dt` | Dynamic parabolic jump arc (1.5 to 4.5 tiles height) | Enforce terminal velocity cap ($+450\text{ px/s}$) | Spec Analysis (Super Mario Bros physics) |
| 3 | Physics | Coyote Time & Jump Buffer | Allows jumping 85ms after leaving ledge; buffers jump presses 100ms before landing | Collision state transition, jump input timestamp | Responsive, forgiving platformer controls | Discard expired jump buffer after timeout | Modern Platformer Ergonomics Standards |
| 4 | Collision | Tile-Grid AABB Resolution | Axis-separated horizontal and vertical continuous-discrete bounding box collision check against map | Bounding box $\{x, y, w, h, vx, vy\}$, tilemap | Adjusted position, zeroed normal velocity, `grounded` flag | Resolves entity out of solid geometry without snagging | Classic Tilemap Collision Specification |
| 5 | Collision | Head Bump Block Trigger | Hitting underside of Question or Brick block bounces block and triggers item/particle spawn | Player ascending ($vy < 0$) colliding with tile bottom | Changes tile ID, spawns Coin entity or bump animation | Prevents duplicate bump triggers during same jump | Original Mario Spec R1 & R3 |
| 6 | Entities | Player State Machine | Controls animation frames and physics state transitions (`IDLE`, `WALK`, `RUN`, `SKID`, `JUMP`, `FALL`, `FLAG_SLIDE`, `DEAD`) | Velocity, grounded status, inputs, goal triggers | Current sprite frame index, physics mode | Fallback to `IDLE` on ambiguous state | Entity Architecture Spec |
| 7 | Entities | Walking Goomba Enemy | Patrols ground, falls with gravity, reverses direction upon hitting solid obstacles or enemies | Level geometry collisions, `dt` | Updated enemy $\{x, y, vx\}$, walk animation frames | Clamps within level bounds | Mario Enemy Specification |
| 8 | Entities | Enemy Stomp Mechanic | Player stomps enemy from above, squashing enemy, bouncing player upward, and awarding score | Player falling ($vy > 0$) overlapping enemy upper bounds | Enemy squashed, player $vy = -240\text{ px/s}$, $+100\text{ pts}$ | If hit from side/bottom, triggers player death | Original Mario Spec R1 & R3 |
| 9 | Entities | Player Damage & Death | Side/bottom contact with enemy or falling into pit triggers death animation, SFX, and level reset | Entity collision or $y > \text{levelHeight}$ | Disables control, plays Death SFX, restarts level | Reset player position to start after 2.0s delay | Original Request Acceptance Criteria |
| 10 | Collectibles | Spinning Coins & Score | Level coins and block-spawned coins award score ($+200$) and increment coin counter | Player overlap with coin | Coin pickup SFX, score increment, particle sparkle | Despawn collected coin entity permanently | Original Request R1 |
| 11 | Goal | Flagpole Slide & Win State | Overlapping flagpole triggers sliding sequence, castle entry, victory fanfare, and clear screen | Player overlap with flagpole sensor | Automated slide, walk to castle, fanfare SFX, win UI | Input disabled during victory sequence | Original Request R1 |
| 12 | Audio | Procedural SFX Synthesis | Zero-dependency Web Audio API oscillator synthesis for Jump, Coin, Stomp, Bump, Death, and Fanfare | Sound trigger event name | Real-time audio waveform output through AudioContext | Safely resumes suspended AudioContext on user touch | Original Request R3 (Zero external assets) |
| 13 | Graphics | Procedural Pixel-Art Pipeline | Programmatic rasterization of authentic 8-bit sprites, tiles, background clouds/hills via Canvas | Color palettes, pixel grid arrays | HTML5 Image/Canvas sprite sheets in memory | Fallback to solid color pattern if raster fails | Original Request R3 |
| 14 | Controls | Multi-Touch Mobile UI | On-screen Left, Right, Jump touch targets with multi-touch tracking and visual feedback | `touchstart`, `touchmove`, `touchend`, `touchcancel` | Continuous directional & jump input flags | `preventDefault()` suppresses browser zoom/scroll | Original Request R2 & Mobile Criteria |
| 15 | Display | Responsive Pixelated Viewport | Scales virtual resolution ($320 \times 240$) to any screen aspect ratio preserving sharp pixel art | Viewport resize events, device orientation | Scaled, centered canvas with crisp pixel rendering | Letterboxing/pillarboxing with black background | Mobile Acceptance Criteria (360x800) |

---

## 9. Edge Cases & Boundary Conditions

| # | Feature | Input / Edge Condition | Observed / Specified Behavior |
|---|---|---|---|
| 1 | Physics | Running off a cliff ledge | Player does not instantly plunge; Coyote timer allows jump for 85ms after losing ground contact. |
| 2 | Physics | Releasing Jump button at peak vs start | Releasing jump at start produces a micro-hop (1.5 tiles); holding to peak produces full jump (4.5 tiles). |
| 3 | Physics | High horizontal speed wall impact | Horizontal velocity is immediately clamped to 0, player bounding box snaps precisely flush against tile edge without clipping. |
| 4 | Collision | Player hits corner between 2 blocks from below | Collision checks bottom edge center-point; resolves against the primary dominant tile hit, bumping the nearest valid Question/Brick block. |
| 5 | Collision | Stomping enemy while falling at terminal velocity | Stomp condition detects overlap from top; overrides downward terminal velocity with upward bounce impulse ($vy = -240\text{ px/s}$). |
| 6 | Collision | Enemy walks off a ledge / platform | Enemy does not reverse direction at cliff edges (classic Mario behavior); falls downward with gravity and continues walking upon landing. |
| 7 | Collision | Two enemies collide with each other | Both enemies detect horizontal bounding box overlap and simultaneously invert their $vx$ velocities (patrol bounce). |
| 8 | Audio | Browser Autoplay Policy restriction | Web Audio `AudioContext` initializes in suspended state; resumes immediately upon first touch/tap on canvas or touch button without errors. |
| 9 | Mobile Controls | Dual-thumb simultaneous touch (Running Right + Tapping Jump) | Multi-touch system tracks touch IDs independently; holding Right button while repeatedly tapping Jump registers seamlessly without touch loss. |
| 10 | Mobile Controls | Thumb slides off touch button boundary (`touchmove`) | Bounding client rect checking determines if current touch coordinate remains inside button radius; releases input if finger moves outside. |
| 11 | Viewport | Mobile device rotation / Window resize (Portrait $\leftrightarrow$ Landscape) | Canvas resize listener recalculates CSS scaling factor and letterbox offsets instantly without reloading state or dropping frames. |
| 12 | Game Flow | Reaching Flagpole at the very top ($Y \approx 0$) vs base | Scores dynamically scale: 5000 pts for top apex grab down to 100 pts for base grab; slide animation smoothly covers the distance. |
| 13 | Level Bounds | Player moves left at start of stage ($X \le 0$) | Left movement is clamped to $X = 0$ (level origin / camera left border); player cannot walk off the left side of the map. |
| 14 | Performance | Tab backgrounded or low framerate (large `dt`) | Accumulated delta time is clamped to maximum $\Delta t_{\max} = 50\text{ ms}$ (max 3 physics iterations) to prevent physics explosion/tunneling. |

---

## 10. Implementation Blueprint & Verification Criteria

1. **Self-Contained File Architecture**:
   - `index.html`: Mobile-optimized viewport HTML, responsive canvas container, on-screen touch control markup, clean CSS.
   - `src/engine/`: Game loop, input manager, physics integrator, collision solver.
   - `src/graphics/`: Pixel art procedural generator, sprite sheets, tile renderer, camera, particle system.
   - `src/audio/`: Web Audio procedural sound synthesizer.
   - `src/entities/`: Player, Goomba, Coin, Block animations.
   - `src/level/`: Tilemap definition, level layout (World 1-1 style level), spawn coordinates.
2. **Quality Verification Checklist**:
   - Zero console errors in automated headless browser test (`console.error` count: 0).
   - Touch buttons present in DOM and actively capturing `touchstart` / `touchend` events.
   - Pixel art sprites visually distinguishable (Player, Goomba, Question Block, Ground, Castle, Flag).
   - Mobile screen viewports (e.g. 360x800, 390x844) render with accessible, responsive on-screen buttons.
