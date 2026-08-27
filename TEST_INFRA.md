# E2E Test Infra: Classic Mario Browser & Mobile Platformer

## Test Philosophy
- Opaque-box, requirement-driven testing directly exercising DOM, Canvas, and Chrome CDP.
- Automated headless browser execution using Chrome DevTools Protocol (CDP) over native WebSockets in Node.js 25 (`test/headless_validator.mjs`).
- Zero external npm dependencies for instant, deterministic, cross-platform execution.

## Acceptance Criteria Mapping
- **AC1 (0 Console Errors)**: Real-time CDP event listener on `Runtime.consoleAPICalled` and `Runtime.exceptionThrown`. Any unhandled promise rejection, JavaScript syntax error, asset loading failure, or console error fails the test immediately.
- **AC2 (DOM Touch Controls)**: Inspects `#touch-controls`, `#btn-left`, `#btn-right`, `#btn-jump` elements; dispatches synthetic `TouchEvent` (`touchstart`, `touchend`, `touchcancel`); verifies `defaultPrevented === true` and input state updates.
- **AC3 (Image-Based Graphics)**: Verifies `window.GameAssets` initializes image sprites; tests canvas rendering of Mario, Goomba, Coin, Tile, and Flag; asserts non-empty pixel data with multi-color palette variance.
- **AC4 (360x800 Mobile Layout)**: Sets Chrome emulation to `360x800` viewport with `devicePixelRatio: 2` (Android high-DPI); checks document body `scrollWidth === 360` and `scrollHeight <= 800` (zero unwanted scrollbars); verifies touch buttons have bounding boxes $\ge 48\times 48\text{px}$ positioned in the lower thumb zone ($Y \ge 480\text{px}$).

## 4-Tier Test Suite Architecture
1. **Tier 1 - Feature Coverage (`test/test_tier1_features.mjs`)**:
   - T1.1: Boot & asset initialization without errors
   - T1.2: Player idle, left/right horizontal movement & acceleration
   - T1.3: Jump impulse, variable jump height on hold vs tap
   - T1.4: Tile collision: standing on ground, hitting solid walls
   - T1.5: Question block collision from below: coin pop & sprite change
   - T1.6: Collectible coin pickup and score increment
   - T1.7: Goomba enemy patrol and stomp kill logic
   - T1.8: Goal flagpole contact and victory state transition
   - T1.9: Game over on pit fall or enemy hazard & restart mechanism
2. **Tier 2 - Boundary & Corner Cases (`test/test_tier2_boundary.mjs`)**:
   - T2.1: Viewport extreme aspect ratios (360x640, 360x800, 390x844, 412x915, 768x1024)
   - T2.2: Sub-pixel high-speed fall without floor tunneling
   - T2.3: Coyote time jump off edge within 85ms
   - T2.4: Jump buffer registration 100ms before landing
   - T2.5: Left level boundary clamping (cannot walk off left screen)
   - T2.6: Skid turnaround when reversing direction at high speed
3. **Tier 3 - Cross-Feature Combinations (`test/test_tier3_combos.mjs`)**:
   - T3.1: Multi-touch simultaneous Run (Right) + Jump button press
   - T3.2: Touch button drag outside element boundary triggering `touchend`
   - T3.3: Mid-air coin collection while colliding with ceiling block
   - T3.4: Stomping enemy while moving horizontally with bounce continuation
   - T3.5: Audio context unlocking on first touch gesture without audible pop or console warning
4. **Tier 4 - Real-World Application & Stability (`test/test_tier4_workload.mjs`)**:
   - T4.1: Sustained 60 FPS performance benchmark over 3,000 frames (frame time jitter < 5ms)
   - T4.2: Tab blur / background throttling handling ($\Delta t$ clamped to $\le 0.05\text{s}$)
   - T4.3: Memory leak stress test (10 consecutive full level playthroughs without heap growth)
   - T4.4: Autonomous 100-playthrough bot completing level or testing win/death loops

## Test Execution Commands
- Full headless suite: `node test/headless_validator.mjs`
- Tier 1 Features: `node test/test_tier1_features.mjs`
- Tier 2 Boundary: `node test/test_tier2_boundary.mjs`
- Tier 3 Combos: `node test/test_tier3_combos.mjs`
- Tier 4 Workload: `node test/test_tier4_workload.mjs`
