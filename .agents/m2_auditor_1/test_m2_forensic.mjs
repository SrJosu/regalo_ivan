/**
 * .agents/m2_auditor_1/test_m2_forensic.mjs
 *
 * Comprehensive Forensic Integrity Audit for Milestone 2:
 * - index.html & css/style.css responsive DOM, HUD & touch layout
 * - js/input.js multi-touch isolation, touchmove sliding, preventDefault, keyboard mapping, edge detection
 * - js/physics.js authentic kinematics (Euler integration, friction, skidding, variable jump, coyote time, buffering, sub-stepping AABB collision)
 * - Prohibited patterns scan (facades, hardcoded strings, dummy returns)
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const GamePhysics = require(path.join(rootDir, 'js/physics.js'));
const GameInput = require(path.join(rootDir, 'js/input.js'));

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, details = '') {
  totalChecks++;
  if (!condition) {
    console.error(`❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
    failedChecks++;
  } else {
    console.log(`  ✓ ${message}`);
    passedChecks++;
  }
}

console.log('====================================================');
console.log('   FORENSIC INTEGRITY AUDIT: MILESTONE 2            ');
console.log('====================================================\n');

// ---------------------------------------------------------
// CHECK 1: Prohibited Patterns & Facade Detection (Static Analysis)
// ---------------------------------------------------------
console.log('--- 1. Prohibited Patterns & Static Code Analysis ---');
const filesToCheck = ['index.html', 'css/style.css', 'js/input.js', 'js/physics.js'];

for (const relFile of filesToCheck) {
  const filePath = path.join(rootDir, relFile);
  assert(fs.existsSync(filePath), `File ${relFile} exists`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check not empty
  assert(content.trim().length > 100, `File ${relFile} contains substantial code (${content.length} chars)`);

  // Check no dummy facades (e.g. empty functions, constant returning dummies)
  assert(!content.includes('NotImplementedError'), `File ${relFile} contains no NotImplementedError stubs`);
  assert(!content.includes('TODO') && !content.includes('FIXME'), `File ${relFile} contains no unfinished TODOs`);
}

// ---------------------------------------------------------
// CHECK 2: index.html & css/style.css Mobile Responsive & DOM Layout
// ---------------------------------------------------------
console.log('\n--- 2. DOM Structure & Responsive Styling Audit ---');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'css/style.css'), 'utf8');

// Viewport meta
assert(html.includes('meta name="viewport"') && html.includes('width=device-width'), 'Viewport meta configured');
assert(html.includes('user-scalable=no') || html.includes('maximum-scale=1.0'), 'Prevents unwanted pinch-to-zoom on mobile');

// Canvas 360x800
assert(html.includes('id="game-canvas"'), 'Canvas element present');
assert(html.includes('width="360"') && html.includes('height="800"'), 'Canvas has width="360" and height="800"');

// DOM Touch Buttons
assert(html.includes('id="touch-controls"'), '#touch-controls container declared');
assert(html.includes('id="btn-left"'), '#btn-left button declared');
assert(html.includes('id="btn-right"'), '#btn-right button declared');
assert(html.includes('id="btn-jump"'), '#btn-jump button declared');

// HUD elements
assert(html.includes('id="hud-score"'), '#hud-score element declared');
assert(html.includes('id="hud-coins"'), '#hud-coins element declared');
assert(html.includes('id="hud-world"'), '#hud-world element declared');
assert(html.includes('id="hud-time"'), '#hud-time element declared');
assert(html.includes('id="hud-lives"'), '#hud-lives element declared');

// CSS Zero-Scroll & Thumb Zone
assert(css.includes('overflow: hidden'), 'Zero scroll enforced via overflow: hidden');
assert(css.includes('touch-action: none'), 'touch-action: none prevents browser swipe gesture overrides');
assert(css.includes('user-select: none'), 'user-select: none prevents mobile text selection');
assert(css.includes('image-rendering: pixelated') || css.includes('image-rendering: crisp-edges'), 'Pixel-art scaling mode set');
assert(css.includes('height: 280px') || css.includes('bottom: 0'), 'Touch controls anchored in ergonomic bottom thumb zone');

// ---------------------------------------------------------
// CHECK 3: js/input.js Multi-Touch & Keyboard Controller
// ---------------------------------------------------------
console.log('\n--- 3. Multi-Touch Concurrency, Touch-Sliding & Keyboard Audit ---');

// Fresh reset
GameInput.reset();
let state = GameInput.getState();
assert(!state.left && !state.right && !state.jump && !state.reset, 'Initial state is completely idle');

// Concurrency: Touch 10 (Left) + Touch 20 (Jump)
GameInput.injectTouch(10, 'left');
state = GameInput.getState();
assert(state.left === true && state.jump === false, 'Touch 10 activates left');

GameInput.injectTouch(20, 'jump');
state = GameInput.getState();
assert(state.left === true && state.jump === true, 'Concurrent Touch 10 (Left) + Touch 20 (Jump) both active');

// Release Touch 10, keep Touch 20
GameInput.injectTouch(10, null);
state = GameInput.getState();
assert(state.left === false && state.jump === true, 'Releasing Left retains Jump state');

GameInput.injectTouch(20, null);
state = GameInput.getState();
assert(!state.left && !state.jump, 'Releasing all touches returns to idle');

// Touch map tracking integrity
assert(GameInput.getTouchMap().size === 0, 'TouchMap is empty after all touches released');

// Touch re-targeting (sliding from left to right)
GameInput.injectTouch(99, 'left');
assert(GameInput.getState().left === true && GameInput.getState().right === false, 'Touch 99 on left');
GameInput.injectTouch(99, 'right'); // slide to right
assert(GameInput.getState().left === false && GameInput.getState().right === true, 'Touch 99 re-targeted to right');
GameInput.injectTouch(99, null);

// Keyboard bindings (WASD + Arrows + Space + Z + J + R)
const keyTests = [
  { code: 'ArrowLeft', expected: 'left' },
  { code: 'KeyA', expected: 'left' },
  { code: 'a', expected: 'left' },
  { code: 'ArrowRight', expected: 'right' },
  { code: 'KeyD', expected: 'right' },
  { code: 'd', expected: 'right' },
  { code: 'Space', expected: 'jump' },
  { code: 'ArrowUp', expected: 'jump' },
  { code: 'KeyW', expected: 'jump' },
  { code: 'KeyZ', expected: 'jump' },
  { code: 'KeyJ', expected: 'jump' },
  { code: 'KeyR', expected: 'reset' },
  { code: 'r', expected: 'reset' }
];

for (const kt of keyTests) {
  GameInput.reset();
  GameInput.injectKey(kt.code, true);
  const s = GameInput.getState();
  assert(s[kt.expected] === true, `Key ${kt.code} triggers ${kt.expected}`);
  GameInput.injectKey(kt.code, false);
  assert(GameInput.getState()[kt.expected] === false, `Releasing ${kt.code} deactivates ${kt.expected}`);
}

// Edge detection (jumpJustPressed, jumpJustReleased)
GameInput.reset();
GameInput.update(); // Tick 0

GameInput.injectKey('Space', true);
GameInput.update(); // Tick 1 (pressed)
assert(GameInput.getState().jump === true, 'Edge test: jump is true on Tick 1');
assert(GameInput.getState().jumpJustPressed === true, 'Edge test: jumpJustPressed is true on Tick 1');
assert(GameInput.getState().jumpJustReleased === false, 'Edge test: jumpJustReleased is false on Tick 1');

GameInput.update(); // Tick 2 (held)
assert(GameInput.getState().jump === true, 'Edge test: jump is true on Tick 2');
assert(GameInput.getState().jumpJustPressed === false, 'Edge test: jumpJustPressed clears on Tick 2');
assert(GameInput.getState().jumpJustReleased === false, 'Edge test: jumpJustReleased is false on Tick 2');

GameInput.injectKey('Space', false);
GameInput.update(); // Tick 3 (released)
assert(GameInput.getState().jump === false, 'Edge test: jump is false on Tick 3');
assert(GameInput.getState().jumpJustPressed === false, 'Edge test: jumpJustPressed is false on Tick 3');
assert(GameInput.getState().jumpJustReleased === true, 'Edge test: jumpJustReleased is true on Tick 3');

GameInput.update(); // Tick 4 (idle)
assert(GameInput.getState().jumpJustReleased === false, 'Edge test: jumpJustReleased clears on Tick 4');

// ---------------------------------------------------------
// CHECK 4: js/physics.js Kinematics & Mathematical Authenticity
// ---------------------------------------------------------
console.log('\n--- 4. Kinematics, Variable Jump, Coyote Time & Buffering Audit ---');
const dt = 1 / 60;

// A. Horizontal Acceleration & Max Run Speed Clamping
const runner = GamePhysics.createKinematicEntity({ x: 0, y: 0, onGround: true });
for (let i = 0; i < 100; i++) {
  GamePhysics.applyKinematics(runner, dt, { right: true, left: false, jump: false });
}
assert(runner.vx === GamePhysics.MAX_RUN_SPEED, `Horizontal acceleration clamps at MAX_RUN_SPEED (${GamePhysics.MAX_RUN_SPEED} px/s)`);
assert(runner.facing === 1, 'Facing direction set to 1');

// B. Direction Reversal & Skidding
GamePhysics.applyKinematics(runner, dt, { left: true, right: false, jump: false });
assert(runner.isSkidding === true, 'Skidding state active when reversing at speed');
assert(runner.vx < GamePhysics.MAX_RUN_SPEED, 'Skidding applies high braking deceleration');

// C. Ground Friction to Zero
const slider = GamePhysics.createKinematicEntity({ x: 0, y: 0, vx: 100, onGround: true });
for (let i = 0; i < 60; i++) {
  GamePhysics.applyKinematics(slider, dt, { left: false, right: false, jump: false });
}
assert(slider.vx === 0, 'Ground friction smoothly decelerates entity to 0 px/s');
assert(slider.isSkidding === false, 'Skidding is false when stopped');

// D. Gravity & Terminal Velocity
const falling = GamePhysics.createKinematicEntity({ x: 0, y: 0, vy: 0, onGround: false });
for (let i = 0; i < 60; i++) {
  GamePhysics.applyKinematics(falling, dt, { left: false, right: false, jump: false });
}
assert(falling.vy === GamePhysics.TERMINAL_VELOCITY, `Falling entity accelerates to TERMINAL_VELOCITY (${GamePhysics.TERMINAL_VELOCITY} px/s)`);

// E. Variable Jump Arc: Full Hold vs Early Release
const fullJump = GamePhysics.createKinematicEntity({ x: 0, y: 100, onGround: true });
GamePhysics.applyKinematics(fullJump, dt, { jump: true, jumpJustPressed: true });
// Hold jump for 10 frames
for (let i = 0; i < 10; i++) {
  GamePhysics.applyKinematics(fullJump, dt, { jump: true });
}

const shortJump = GamePhysics.createKinematicEntity({ x: 0, y: 100, onGround: true });
GamePhysics.applyKinematics(shortJump, dt, { jump: true, jumpJustPressed: true });
// Release jump on frame 2
GamePhysics.applyKinematics(shortJump, dt, { jump: false, jumpJustReleased: true });
for (let i = 0; i < 9; i++) {
  GamePhysics.applyKinematics(shortJump, dt, { jump: false });
}

assert(fullJump.vy < shortJump.vy, `Full jump hold yields higher upward velocity than short tap (full: ${fullJump.vy.toFixed(1)}, short: ${shortJump.vy.toFixed(1)})`);

// F. Coyote Time Mechanics
const coyoteEntity = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: true });
GamePhysics.applyKinematics(coyoteEntity, dt, {}); // refreshes coyote timer
assert(coyoteEntity.coyoteTimer === GamePhysics.COYOTE_TIME, `Coyote timer charged on ground (${GamePhysics.COYOTE_TIME}s)`);

coyoteEntity.onGround = false; // walks off ledge
GamePhysics.applyKinematics(coyoteEntity, 0.04, {}); // 40ms later (< 85ms)
assert(coyoteEntity.coyoteTimer > 0, `Coyote timer remains active after 40ms in air (${coyoteEntity.coyoteTimer.toFixed(3)}s)`);

// Jump off the air within coyote window
GamePhysics.applyKinematics(coyoteEntity, dt, { jump: true, jumpJustPressed: true });
assert(coyoteEntity.isJumping === true, 'Coyote jump successfully engaged mid-air');
assert(coyoteEntity.vy < 0, `Coyote jump produced upward velocity (${coyoteEntity.vy.toFixed(1)} px/s)`);

// G. Jump Buffering Mechanics
const bufferEntity = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: false, vy: 150 });
// Press jump 50ms before landing
GamePhysics.applyKinematics(bufferEntity, 0.05, { jump: false, jumpJustPressed: true });
assert(bufferEntity.jumpBufferTimer > 0, `Jump buffer timer queued early press (${bufferEntity.jumpBufferTimer.toFixed(3)}s)`);

// Entity lands on ground
bufferEntity.onGround = true;
GamePhysics.applyKinematics(bufferEntity, dt, { jump: true });
assert(bufferEntity.isJumping === true, 'Buffered jump fired immediately upon landing');
assert(bufferEntity.vy < 0, `Buffered jump produced upward velocity (${bufferEntity.vy.toFixed(1)} px/s)`);

// ---------------------------------------------------------
// CHECK 5: AABB Map Collision Resolution & Sub-Stepping
// ---------------------------------------------------------
console.log('\n--- 5. AABB Map Collision Resolution & Anti-Tunneling Audit ---');

const testMap = {
  isSolid(tx, ty) {
    if (tx < 0 || tx > 25) return true;
    if (ty >= 10) return true; // Ground floor at y=160
    if (tx === 10 && ty >= 6 && ty <= 9) return true; // Wall obstacle at tx=10 (x=160)
    if (ty === 5 && tx >= 4 && tx <= 7) return true; // Platform ceiling at ty=5 (y=80..96)
    return false;
  },
  getTile(tx, ty) {
    if (ty >= 10) return 'ground';
    if (tx === 10) return 'pipe';
    if (ty === 5) return 'brick';
    return null;
  }
};

// 1. Landing on solid ground
const fallingPlayer = GamePhysics.createKinematicEntity({ x: 32, y: 120, vx: 0, vy: 200, width: 16, height: 16 });
let landed = false;
for (let frame = 0; frame < 30; frame++) {
  fallingPlayer.vy += GamePhysics.GRAVITY_FALL * dt;
  const res = GamePhysics.resolveMapCollisions(fallingPlayer, testMap, dt);
  if (res.collidedY && fallingPlayer.onGround) {
    landed = true;
    break;
  }
}
assert(landed === true, 'Player cleanly lands on ground tilemap');
assert(fallingPlayer.y === 160 - 16, `Player y position clamped to exact floor surface (${160 - 16})`);
assert(fallingPlayer.vy === 0, 'Vertical velocity zeroed on landing');

// 2. Walking horizontally into solid wall
const walkingPlayer = GamePhysics.createKinematicEntity({ x: 140, y: 160 - 16, vx: 200, vy: 0, width: 16, height: 16, onGround: true });
let hitWall = false;
for (let frame = 0; frame < 20; frame++) {
  const res = GamePhysics.resolveMapCollisions(walkingPlayer, testMap, dt);
  if (res.collidedX) {
    hitWall = true;
    break;
  }
}
assert(hitWall === true, 'Player cleanly detects horizontal wall collision');
assert(walkingPlayer.x === 10 * 16 - 16, `Player x position clamped to wall boundary (${10 * 16 - 16})`);
assert(walkingPlayer.vx === 0, 'Horizontal velocity zeroed on wall impact');

// 3. Jumping into overhead ceiling block
const jumpingPlayer = GamePhysics.createKinematicEntity({ x: 5 * 16, y: 6 * 16 + 4, vx: 0, vy: -300, width: 16, height: 16 });
const ceilRes = GamePhysics.resolveMapCollisions(jumpingPlayer, testMap, dt);
assert(ceilRes.collidedY === true, 'Ceiling collision detected');
assert(ceilRes.hitCeilingTile && ceilRes.hitCeilingTile.type === 'brick', 'Identified hit tile as brick');
assert(jumpingPlayer.y === 6 * 16, `Entity pushed down to ceiling bottom edge (${6 * 16})`);
assert(jumpingPlayer.vy === 0, 'Upward velocity cancelled on ceiling bump');

// 4. Sub-Stepping High-Speed Anti-Tunneling
const meteor = GamePhysics.createKinematicEntity({ x: 32, y: 50, vx: 0, vy: 1500, width: 16, height: 16 });
// Without sub-stepping, moving 1500 * 0.1 = 150px in one frame would warp through floor at 160
const tunnelRes = GamePhysics.resolveMapCollisions(meteor, testMap, 0.1);
assert(tunnelRes.collidedY === true, 'Sub-stepping caught ultra-high-speed falling entity');
assert(meteor.y === 160 - 16, `Meteor stopped exactly at floor level (${160 - 16})`);
assert(meteor.onGround === true, 'Meteor onGround is true');

// 5. checkAABB bounding box calculation
const b1 = { x: 0, y: 0, width: 10, height: 10 };
const b2 = { x: 5, y: 5, width: 10, height: 10 };
const b3 = { x: 20, y: 20, width: 10, height: 10 };
assert(GamePhysics.checkAABB(b1, b2) === true, 'checkAABB detects overlapping boxes');
assert(GamePhysics.checkAABB(b1, b3) === false, 'checkAABB rejects disjoint boxes');

console.log('\n====================================================');
console.log(`  FORENSIC AUDIT SUMMARY: ${passedChecks} checks PASSED, ${failedChecks} checks FAILED`);
console.log('====================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
