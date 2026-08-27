/**
 * test/verify_m2_engine.mjs - Automated Verification Suite for Milestone 2
 *
 * Classic Mario Browser & Mobile Platformer (M2)
 *
 * Verifies:
 * 1. Semantic DOM structure in index.html (Viewport meta, HUD, 360x800 Canvas, Touch controls).
 * 2. Responsive CSS rules in css/style.css (Zero-scroll, ergonomic thumb zone, high-contrast touch styling).
 * 3. Input System in js/input.js (Multi-touch identifier isolation, keyboard fallback, edge detection).
 * 4. Physics Engine in js/physics.js (Kinematics, skidding, variable jump, coyote time, jump buffering).
 * 5. AABB Tilemap Collision Resolution & Anti-tunneling Sub-stepping.
 *
 * Zero external npm dependencies. Runs directly in Node.js.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const GamePhysics = require('../js/physics.js');
const GameInput = require('../js/input.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedTests++;
  }
}

function runSection(title, fn) {
  console.log(`\n==================================================`);
  console.log(`🔷 ${title}`);
  console.log(`==================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`Section error: ${err.message}`);
  }
}

// =========================================================================
// SECTION 1: DOM Hierarchy & index.html Verification
// =========================================================================
runSection('1. index.html Structural Verification', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  assert(fs.existsSync(htmlPath), 'index.html exists in project root');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check mobile viewport meta tag
  assert(
    html.includes('name="viewport"') &&
    html.includes('width=device-width') &&
    html.includes('user-scalable=no'),
    'Viewport meta tag enforces mobile-first non-scalable rendering'
  );

  // Check theme color meta tag
  assert(html.includes('name="theme-color"'), 'Theme color meta tag is declared');

  // Check HUD container and items
  assert(html.includes('id="hud"'), 'HUD header element (#hud) is present');
  assert(html.includes('id="hud-score"'), 'HUD score element (#hud-score) is present');
  assert(html.includes('id="hud-coins"'), 'HUD coins element (#hud-coins) is present');
  assert(html.includes('id="hud-world"'), 'HUD world element (#hud-world) is present');
  assert(html.includes('id="hud-time"'), 'HUD time element (#hud-time) is present');
  assert(html.includes('id="hud-lives"'), 'HUD lives element (#hud-lives) is present');

  // Check Game Canvas
  assert(html.includes('id="game-canvas"'), 'Game canvas (#game-canvas) is present');
  assert(html.includes('width="360"') && html.includes('height="800"'), 'Canvas logical resolution is set to 360x800');

  // Check Touch Controls
  assert(html.includes('id="touch-controls"'), 'Touch controls container (#touch-controls) is present');
  assert(html.includes('id="btn-left"'), 'D-Pad Left button (#btn-left) is present');
  assert(html.includes('id="btn-right"'), 'D-Pad Right button (#btn-right) is present');
  assert(html.includes('id="btn-jump"'), 'Jump Action button (#btn-jump) is present');

  // Check Script Dependencies
  assert(html.includes('src="js/assets.js"'), 'Script tag for js/assets.js is declared');
  assert(html.includes('src="js/physics.js"'), 'Script tag for js/physics.js is declared');
  assert(html.includes('src="js/input.js"'), 'Script tag for js/input.js is declared');
});

// =========================================================================
// SECTION 2: CSS Layout & Zero-Scroll Verification
// =========================================================================
runSection('2. css/style.css Responsive & Touch Styling Verification', () => {
  const cssPath = path.join(rootDir, 'css', 'style.css');
  assert(fs.existsSync(cssPath), 'css/style.css exists in project');

  const css = fs.readFileSync(cssPath, 'utf8');

  // Zero-scroll & touch constraints
  assert(css.includes('overflow: hidden'), 'CSS enforces zero-scroll with overflow: hidden');
  assert(css.includes('touch-action: none'), 'CSS disables browser touch defaults with touch-action: none');
  assert(css.includes('user-select: none'), 'CSS prevents accidental text selection with user-select: none');

  // Viewport & canvas container
  assert(css.includes('#game-container'), 'CSS defines #game-container layout');
  assert(css.includes('image-rendering: pixelated') || css.includes('image-rendering: crisp-edges'), 'Canvas pixel-art rendering mode configured');

  // Touch controls styling & thumb zone
  assert(css.includes('#touch-controls'), 'CSS defines #touch-controls overlay');
  assert(css.includes('#btn-left') && css.includes('#btn-right'), 'CSS targets D-pad buttons');
  assert(css.includes('#btn-jump'), 'CSS targets Jump button');
  assert(css.includes(':active') || css.includes('.active'), 'CSS includes active-state visual feedback');
});

// =========================================================================
// SECTION 3: Input Controller & Multi-Touch Concurrency
// =========================================================================
runSection('3. js/input.js Input System & Multi-Touch Concurrency', () => {
  assert(typeof GameInput.init === 'function', 'GameInput.init() is exported');
  assert(typeof GameInput.getState === 'function', 'GameInput.getState() is exported');
  assert(typeof GameInput.update === 'function', 'GameInput.update() is exported');
  assert(typeof GameInput.reset === 'function', 'GameInput.reset() is exported');

  // Reset initial state
  GameInput.reset();
  let state = GameInput.getState();
  assert(!state.left && !state.right && !state.jump && !state.reset, 'Initial state is completely idle');

  // 1. Multi-Touch Concurrency: Hold Right (Touch 1) + Tap Jump (Touch 2)
  GameInput.injectTouch(1, 'right');
  state = GameInput.getState();
  assert(state.right === true && state.jump === false, 'Touch 1 on Right activates right state');

  GameInput.injectTouch(2, 'jump');
  state = GameInput.getState();
  assert(state.right === true && state.jump === true, 'Simultaneous multi-touch allows concurrent Right + Jump');

  // Release Touch 2 (Jump lifted) while Touch 1 (Right) is still held
  GameInput.injectTouch(2, null);
  state = GameInput.getState();
  assert(state.right === true && state.jump === false, 'Releasing Jump does NOT cancel Right movement');

  // Release Touch 1
  GameInput.injectTouch(1, null);
  state = GameInput.getState();
  assert(state.right === false && state.jump === false, 'All touches released cleanly');

  // 2. Keyboard Key Mappings
  GameInput.injectKey('ArrowLeft', true);
  state = GameInput.getState();
  assert(state.left === true, 'ArrowLeft triggers left action');
  GameInput.injectKey('ArrowLeft', false);

  GameInput.injectKey('KeyD', true);
  state = GameInput.getState();
  assert(state.right === true, 'KeyD triggers right action');
  GameInput.injectKey('KeyD', false);

  GameInput.injectKey('Space', true);
  state = GameInput.getState();
  assert(state.jump === true, 'Space triggers jump action');
  GameInput.injectKey('Space', false);

  GameInput.injectKey('KeyR', true);
  state = GameInput.getState();
  assert(state.reset === true, 'KeyR triggers reset action');
  GameInput.injectKey('KeyR', false);

  // 3. Edge Detection & Frame-by-Frame Pulse Verification
  GameInput.reset();
  GameInput.update(); // Baseline tick

  // Frame 1: Jump pressed
  GameInput.injectKey('Space', true);
  GameInput.update();
  state = GameInput.getState();
  assert(state.jump === true && state.jumpJustPressed === true && state.jumpJustReleased === false, 'Frame 1: jumpJustPressed is true on initial press');

  // Frame 2: Jump held
  GameInput.update();
  state = GameInput.getState();
  assert(state.jump === true && state.jumpJustPressed === false && state.jumpJustReleased === false, 'Frame 2: jumpJustPressed clears to false while held');

  // Frame 3: Jump released
  GameInput.injectKey('Space', false);
  GameInput.update();
  state = GameInput.getState();
  assert(state.jump === false && state.jumpJustPressed === false && state.jumpJustReleased === true, 'Frame 3: jumpJustReleased is true upon release');

  // Frame 4: Idle
  GameInput.update();
  state = GameInput.getState();
  assert(state.jump === false && state.jumpJustPressed === false && state.jumpJustReleased === false, 'Frame 4: jumpJustReleased clears to false');

  GameInput.reset();
});

// =========================================================================
// SECTION 4: Physics Engine & Kinematics
// =========================================================================
runSection('4. js/physics.js Kinematics & Jump Mechanics', () => {
  assert(typeof GamePhysics.applyKinematics === 'function', 'GamePhysics.applyKinematics() is exported');
  assert(typeof GamePhysics.resolveMapCollisions === 'function', 'GamePhysics.resolveMapCollisions() is exported');
  assert(typeof GamePhysics.checkAABB === 'function', 'GamePhysics.checkAABB() is exported');

  // Physical Constants check
  assert(GamePhysics.TILE_SIZE === 16, 'TILE_SIZE is 16');
  assert(GamePhysics.GRAVITY_FALL === 1200, 'GRAVITY_FALL is 1200 px/s²');
  assert(GamePhysics.GRAVITY_HOLD === 650, 'GRAVITY_HOLD is 650 px/s²');
  assert(GamePhysics.JUMP_VELOCITY === -360, 'JUMP_VELOCITY is -360 px/s');

  const dt = 1 / 60; // 0.016667s

  // 1. Horizontal Acceleration & Max Speed Clamp
  const mario = GamePhysics.createKinematicEntity({ x: 0, y: 0, onGround: true });
  for (let i = 0; i < 60; i++) {
    GamePhysics.applyKinematics(mario, dt, { right: true, left: false, jump: false });
  }
  assert(mario.vx === GamePhysics.MAX_RUN_SPEED, `Mario accelerates right and clamps to MAX_RUN_SPEED (${GamePhysics.MAX_RUN_SPEED})`);
  assert(mario.facing === 1, 'Mario facing direction updated to 1 (Right)');

  // 2. Ground Friction Deceleration
  for (let i = 0; i < 60; i++) {
    GamePhysics.applyKinematics(mario, dt, { right: false, left: false, jump: false });
  }
  assert(mario.vx === 0, 'Mario coasts to a full stop (vx = 0) under ground friction');

  // 3. Skidding Mechanics
  mario.vx = 200; // Moving fast right
  mario.onGround = true;
  GamePhysics.applyKinematics(mario, dt, { left: true, right: false, jump: false });
  assert(mario.isSkidding === true, 'Mario enters skidding state when pressing Left while moving fast Right');
  assert(mario.vx < 200, 'Skid deceleration rapidly slows down velocity');

  // 4. Coyote Time Verification
  // Player walks off a ledge (onGround becomes false)
  const jumper = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: true });
  GamePhysics.applyKinematics(jumper, dt, { right: true }); // Sets coyote timer
  jumper.onGround = false; // Stepped off ledge

  // Advance time by 0.05s (50ms, within 85ms coyote window)
  GamePhysics.applyKinematics(jumper, 0.05, { jump: false });
  assert(jumper.coyoteTimer > 0, 'Coyote timer is still active after 50ms in air');

  // Trigger jump inside coyote window
  GamePhysics.applyKinematics(jumper, dt, { jump: true, jumpJustPressed: true });
  assert(jumper.isJumping === true && jumper.vy < -300, `Coyote jump succeeded with initial impulse (${jumper.vy.toFixed(1)} px/s)`);

  // 5. Jump Buffering Verification
  const lander = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: false, vy: 200 });
  // Player taps jump 60ms before touching ground
  GamePhysics.applyKinematics(lander, 0.06, { jump: false, jumpJustPressed: true });
  assert(lander.jumpBufferTimer > 0, 'Jump buffer timer queued early press');

  // Player lands on ground
  lander.onGround = true;
  GamePhysics.applyKinematics(lander, dt, { jump: true });
  assert(lander.isJumping === true && lander.vy < -300, `Buffered jump triggered immediately upon landing (${lander.vy.toFixed(1)} px/s)`);

  // 6. Variable Jump Height & Early Cutoff
  const highJumper = GamePhysics.createKinematicEntity({ x: 0, y: 0, onGround: true });
  GamePhysics.applyKinematics(highJumper, dt, { jump: true, jumpJustPressed: true }); // vy = -360
  // Next tick: release jump button early
  GamePhysics.applyKinematics(highJumper, dt, { jump: false, jumpJustReleased: true });
  assert(highJumper.vy >= GamePhysics.JUMP_RELEASE_CUTOFF, `Releasing jump cuts upward velocity to cutoff cap (${GamePhysics.JUMP_RELEASE_CUTOFF} px/s)`);
});

// =========================================================================
// SECTION 5: AABB Tilemap Collision Resolution & Anti-Tunneling
// =========================================================================
runSection('5. AABB Tilemap Collision Resolution', () => {
  // Create a synthetic tilemap with solid floor at row 10 (y = 160) and walls at col 0 and 20
  const mockMap = {
    isSolid(tx, ty) {
      if (tx < 0 || tx > 20) return true;
      if (ty >= 10) return true; // Ground floor at ty=10
      if (tx === 15 && ty >= 6 && ty <= 9) return true; // Pipe/Obstacle at tx=15
      if (ty === 4 && tx >= 6 && tx <= 8) return true; // Question/Brick platform at ty=4
      return false;
    },
    getTile(tx, ty) {
      if (ty >= 10) return 'ground';
      if (tx === 15) return 'pipe';
      if (ty === 4) return 'brick';
      return null;
    }
  };

  const dt = 1 / 60;

  // 1. Landing on Ground Floor
  const player = GamePhysics.createKinematicEntity({ x: 32, y: 100, vx: 0, vy: 300, width: 16, height: 16 });
  const landResult = GamePhysics.resolveMapCollisions(player, mockMap, dt);
  // Simulating gravity and resolution until landing
  while (player.y < 160 - 16 && !player.onGround) {
    player.vy += GamePhysics.GRAVITY_FALL * dt;
    GamePhysics.resolveMapCollisions(player, mockMap, dt);
  }
  assert(player.onGround === true, 'Player successfully lands on ground');
  assert(player.y === 160 - 16, `Player y snapped exactly to ground surface (${160 - 16})`);
  assert(player.vy === 0, 'Vertical velocity reset to 0 upon landing');

  // 2. Walking into Solid Wall / Obstacle (X-Axis Resolution)
  player.x = 15 * 16 - 18; // 2px away from pipe at tx=15 (x=240), so 3.33px step penetrates pipe
  player.y = 160 - 16;
  player.vx = 200; // Moving into pipe
  player.onGround = true;

  const colResultX = GamePhysics.resolveMapCollisions(player, mockMap, dt);
  assert(colResultX.collidedX === true, 'Collision detected against solid obstacle on X axis');
  assert(player.x === 15 * 16 - 16, `Player position clamped exactly to obstacle boundary (${15 * 16 - 16})`);
  assert(player.vx === 0, 'Horizontal velocity reset to 0 upon wall impact');

  // 3. Hitting Overhead Ceiling Block (Y-Axis Resolution)
  const jumper = GamePhysics.createKinematicEntity({ x: 7 * 16, y: 5 * 16, vx: 0, vy: -360, width: 16, height: 16 });
  const ceilingResult = GamePhysics.resolveMapCollisions(jumper, mockMap, dt);
  assert(ceilingResult.collidedY === true, 'Ceiling collision detected on Y axis');
  assert(ceilingResult.hitCeilingTile !== null, 'Hit ceiling tile metadata recorded');
  assert(jumper.y === 5 * 16, `Entity bounced off ceiling bottom edge (${5 * 16})`);
  assert(jumper.vy === 0, 'Upward velocity zeroed upon ceiling hit');

  // 4. High-Speed Fall Anti-Tunneling Sub-stepping Test
  // Entity at y=80 with enormous fall velocity (800 px/s) approaching floor at y=160
  const speedDemon = GamePhysics.createKinematicEntity({ x: 32, y: 80, vx: 0, vy: 800, width: 16, height: 16 });
  // Over a large dt = 0.1s (deltaY = 80px, would tunnel through a 16px tile without sub-stepping)
  const tunnelRes = GamePhysics.resolveMapCollisions(speedDemon, mockMap, 0.1);
  assert(tunnelRes.collidedY === true, 'Anti-tunneling sub-stepping intercepted fast-falling entity');
  assert(speedDemon.y === 160 - 16, `Entity safely stopped on floor surface (${160 - 16}) without tunneling`);
  assert(speedDemon.onGround === true, 'Entity onGround state set to true');

  // 5. checkAABB Entity-to-Entity Collision Box Test
  const rectA = { x: 10, y: 10, width: 16, height: 16 };
  const rectB = { x: 20, y: 20, width: 16, height: 16 }; // Overlapping [10..26] x [10..26] with [20..36] x [20..36]
  const rectC = { x: 50, y: 50, width: 16, height: 16 }; // Disjoint
  assert(GamePhysics.checkAABB(rectA, rectB) === true, 'checkAABB correctly detects overlapping rectangles');
  assert(GamePhysics.checkAABB(rectA, rectC) === false, 'checkAABB correctly reports disjoint rectangles');
});

// =========================================================================
// TEST SUMMARY & EXIT
// =========================================================================
console.log(`\n==================================================`);
console.log(`📊 M2 Engine Verification Summary:`);
console.log(`   Passed: ${passedTests}`);
console.log(`   Failed: ${failedTests}`);
console.log(`==================================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(`🎉 ALL MILESTONE 2 ENGINE TESTS PASSED PERFECTLY!\n`);
  process.exit(0);
}
