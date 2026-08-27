/**
 * test_adversarial_m2.mjs
 * Adversarial Empirical Stress Test Suite for Milestone 2 (Core Engine, Physics & Touch DOM)
 *
 * Authored by: Challenger Agent (m2_challenger_1)
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const GamePhysics = require(path.join(rootDir, 'js', 'physics.js'));
const GameInput = require(path.join(rootDir, 'js', 'input.js'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  totalTests++;
  if (!condition) {
    failedTests++;
    const errMsg = `FAILED: ${message}${detail ? ' -> ' + detail : ''}`;
    console.error(`  ❌ [FAIL] ${message}`);
    if (detail) console.error(`     Detail: ${detail}`);
    failureDetails.push(errMsg);
  } else {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  }
}

function assertApprox(actual, expected, epsilon = 0.01, message = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= epsilon, `${message} (Expected ~${expected}, got ${actual}, diff ${diff.toFixed(4)})`);
}

function suite(name, fn) {
  console.log(`\n===============================================================`);
  console.log(`🔥 ADVERSARIAL SUITE: ${name}`);
  console.log(`===============================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`  💥 EXCEPTION in suite "${name}":`, err.stack || err);
    failedTests++;
    failureDetails.push(`Exception in suite "${name}": ${err.message}`);
  }
}

// =========================================================================
// SUITE 1: High-Concurrency Multi-Touch & Input Chaos
// =========================================================================
suite('1. Multi-Touch Concurrency & Chaos Ingestion', () => {
  GameInput.reset();

  // Test 1.1: 5 simultaneous touches with random IDs
  const touchIds = [101, 202, 303, 404, 505];
  GameInput.injectTouch(touchIds[0], 'left');
  GameInput.injectTouch(touchIds[1], 'right');
  GameInput.injectTouch(touchIds[2], 'jump');
  GameInput.injectTouch(touchIds[3], 'jump');
  GameInput.injectTouch(touchIds[4], 'left');

  let state = GameInput.getState();
  assert(state.left === true, 'Multiple left touches activate left state');
  assert(state.right === true, 'Right touch activates right state');
  assert(state.jump === true, 'Jump touches activate jump state');

  // Interleaved touch releases
  GameInput.injectTouch(touchIds[0], null);
  state = GameInput.getState();
  assert(state.left === true, 'Releasing 1 of 2 left touches keeps left state active (due to second left touch)');
  assert(state.jump === true, 'Jump remains active');

  GameInput.injectTouch(touchIds[4], null);
  state = GameInput.getState();
  assert(state.left === false, 'Releasing all left touches turns off left state');
  assert(state.right === true, 'Right remains active without interruption');
  assert(state.jump === true, 'Jump remains active without interruption');

  // Release jump touches one by one
  GameInput.injectTouch(touchIds[2], null);
  state = GameInput.getState();
  assert(state.jump === true, 'Releasing 1 of 2 jump touches keeps jump state active');

  GameInput.injectTouch(touchIds[3], null);
  state = GameInput.getState();
  assert(state.jump === false, 'Releasing both jump touches deactivates jump state');
  assert(state.right === true, 'Right still held by touch 202');

  GameInput.injectTouch(touchIds[1], null);
  state = GameInput.getState();
  assert(state.right === false && state.left === false && state.jump === false, 'All touches released, state completely clear');

  // Test 1.2: Rapid alternating tap spam (500 cycles)
  let chaosPassed = true;
  for (let i = 0; i < 500; i++) {
    const id = 1000 + (i % 10);
    const action = (i % 3 === 0) ? 'left' : ((i % 3 === 1) ? 'right' : 'jump');
    GameInput.injectTouch(id, action);
    const midState = GameInput.getState();
    if (!midState[action]) {
      chaosPassed = false;
      break;
    }
    GameInput.injectTouch(id, null);
  }
  assert(chaosPassed, 'Survived 500 rapid interleaved multi-touch events without state corruption');
  const finalState = GameInput.getState();
  assert(!finalState.left && !finalState.right && !finalState.jump, 'State is cleanly idle after 500 chaos cycles');

  // Test 1.3: Reset clears everything
  GameInput.injectTouch(999, 'jump');
  GameInput.injectKey('ArrowRight', true);
  assert(GameInput.getState().jump && GameInput.getState().right, 'Pre-reset state has active inputs');
  GameInput.reset();
  const postReset = GameInput.getState();
  assert(!postReset.jump && !postReset.right && !postReset.left && !postReset.reset, 'GameInput.reset() cleanly wipes all inputs');
});

// =========================================================================
// SUITE 2: Edge Detection & Frame Pulses
// =========================================================================
suite('2. Frame-by-Frame Edge Detection Pulses', () => {
  GameInput.reset();
  GameInput.update();

  // Initial steady state
  let s = GameInput.getState();
  assert(!s.jumpJustPressed && !s.jumpJustReleased, 'Steady idle: no edge pulses');

  // Frame 1: Tap jump
  GameInput.injectKey('Space', true);
  GameInput.update();
  s = GameInput.getState();
  assert(s.jump === true && s.jumpJustPressed === true && s.jumpJustReleased === false, 'Frame 1: jumpJustPressed is TRUE on rising edge');

  // Frame 2: Hold jump
  GameInput.update();
  s = GameInput.getState();
  assert(s.jump === true && s.jumpJustPressed === false && s.jumpJustReleased === false, 'Frame 2: jumpJustPressed is FALSE on sustained hold');

  // Frame 3: Hold jump (continue)
  GameInput.update();
  s = GameInput.getState();
  assert(s.jump === true && s.jumpJustPressed === false && s.jumpJustReleased === false, 'Frame 3: jumpJustPressed remains FALSE');

  // Frame 4: Release jump
  GameInput.injectKey('Space', false);
  GameInput.update();
  s = GameInput.getState();
  assert(s.jump === false && s.jumpJustPressed === false && s.jumpJustReleased === true, 'Frame 4: jumpJustReleased is TRUE on falling edge');

  // Frame 5: Sustained released
  GameInput.update();
  s = GameInput.getState();
  assert(s.jump === false && s.jumpJustPressed === false && s.jumpJustReleased === false, 'Frame 5: jumpJustReleased returns to FALSE');

  GameInput.reset();
});

// =========================================================================
// SUITE 3: High-Velocity Kinematics & Anti-Tunneling Stress
// =========================================================================
suite('3. High-Velocity Kinematics & Anti-Tunneling Across Timesteps', () => {
  // Tilemap with a 1-tile thick floor at row 10 (y = 160 to 176) and empty air below (row 11)
  const singleTileFloorMap = {
    isSolid(tx, ty) {
      if (ty === 10) return true;
      return false;
    },
    getTile(tx, ty) {
      return (ty === 10) ? 'ground' : null;
    }
  };

  // Test 3.1: Fall at Terminal Velocity (400 px/s) across dt = 1/120s, 1/60s, 1/30s, 1/15s, 1/10s
  const dtValues = [1 / 120, 1 / 60, 1 / 30, 1 / 15, 1 / 10];

  for (const dt of dtValues) {
    const entity = GamePhysics.createKinematicEntity({
      x: 32,
      y: 100,
      vx: 0,
      vy: 400,
      width: 16,
      height: 16
    });

    let landed = false;
    let ticks = 0;
    const maxTicks = 100;

    while (ticks < maxTicks) {
      ticks++;
      const res = GamePhysics.resolveMapCollisions(entity, singleTileFloorMap, dt);
      if (res.collidedY) {
        landed = true;
        break;
      }
      if (entity.y > 176) {
        break;
      }
    }

    assert(landed === true, `dt = ${(dt * 1000).toFixed(1)}ms: Entity intercepted by floor without tunneling through 16px tile`);
    assert(entity.y === 160 - 16, `dt = ${(dt * 1000).toFixed(1)}ms: Entity y snapped to floor top (${160 - 16}px, actual: ${entity.y}px)`);
    assert(entity.vy === 0, `dt = ${(dt * 1000).toFixed(1)}ms: Vertical velocity zeroed on landing`);
    assert(entity.onGround === true, `dt = ${(dt * 1000).toFixed(1)}ms: Entity onGround state is TRUE after landing`);
  }

  // Test 3.2: Extreme Super-Velocity (1600 px/s) at dt = 0.05s (deltaY = 80px per frame)
  const superFastEntity = GamePhysics.createKinematicEntity({
    x: 32,
    y: 85,
    vx: 0,
    vy: 1600,
    width: 16,
    height: 16
  });

  const superRes = GamePhysics.resolveMapCollisions(superFastEntity, singleTileFloorMap, 0.05);
  assert(superRes.collidedY === true, 'Super-velocity 1600px/s collision detected');
  assert(superFastEntity.y === 144, `Super-velocity entity clamped at y = 144 (actual: ${superFastEntity.y})`);
  assert(superFastEntity.onGround === true, 'Super-velocity entity onGround is TRUE');

  // Test 3.3: High-speed diagonal into 1-tile corner notch
  const cornerMap = {
    isSolid(tx, ty) {
      if (ty >= 11) return true;
      if (tx >= 5 && ty >= 10) return true;
      return false;
    },
    getTile(tx, ty) {
      return this.isSolid(tx, ty) ? 'ground' : null;
    }
  };

  const diagonalEntity = GamePhysics.createKinematicEntity({
    x: 4 * 16 - 2,
    y: 10 * 16 - 2,
    vx: 240,
    vy: 400,
    width: 16,
    height: 16
  });

  const diagRes = GamePhysics.resolveMapCollisions(diagonalEntity, cornerMap, 1 / 60);
  assert(diagRes.collidedX || diagRes.collidedY, 'Diagonal collision handled');
  assert(diagonalEntity.x <= 5 * 16 - 16, 'Entity prevented from penetrating solid wall on X');
  assert(diagonalEntity.y <= 11 * 16 - 16, 'Entity prevented from penetrating solid floor on Y');

  // Test 3.4: World Left Boundary clamping at x <= 0
  const leftBoundaryEntity = GamePhysics.createKinematicEntity({
    x: 4,
    y: 100,
    vx: -240,
    vy: 0,
    width: 16,
    height: 16
  });

  const leftRes = GamePhysics.resolveMapCollisions(leftBoundaryEntity, singleTileFloorMap, 1 / 60);
  assert(leftRes.collidedX === true, 'Left boundary collision flagged');
  assert(leftBoundaryEntity.x === 0, `Left position clamped exactly to 0 (actual: ${leftBoundaryEntity.x})`);
  assert(leftBoundaryEntity.vx === 0, 'Velocity zeroed on left boundary impact');

  // Test 3.5: Upward Ceiling Collision (Head Bonk)
  const ceilingMap = {
    isSolid(tx, ty) {
      if (ty === 4 && tx >= 2 && tx <= 6) return true;
      return false;
    },
    getTile(tx, ty) {
      return (ty === 4 && tx >= 2 && tx <= 6) ? 'brick' : null;
    }
  };

  const bonker = GamePhysics.createKinematicEntity({
    x: 3 * 16,
    y: 85,
    vx: 0,
    vy: -360,
    width: 16,
    height: 16
  });

  const bonkRes = GamePhysics.resolveMapCollisions(bonker, ceilingMap, 1 / 60);
  assert(bonkRes.collidedY === true, 'Ceiling collision detected');
  assert(bonkRes.hitCeilingTile !== null && bonkRes.hitCeilingTile.type === 'brick', 'hitCeilingTile metadata is brick');
  assert(bonker.y === 5 * 16, `Bonker y clamped to ceiling bottom edge (${5 * 16}, actual: ${bonker.y})`);
  assert(bonker.vy === 0, 'Bonker upward velocity zeroed on ceiling contact');
});

// =========================================================================
// SUITE 4: Jump Buffering Timing Thresholds (100ms Window)
// =========================================================================
suite('4. Jump Buffering Timing Thresholds (100ms Window)', () => {
  const dt = 1 / 60; // ~16.67ms
  const expectedJumpVy = GamePhysics.JUMP_VELOCITY + GamePhysics.GRAVITY_HOLD * dt; // -360 + 650/60 = -349.167

  // Test 4.1: Jump pressed 50ms before landing (valid buffer)
  const b1 = GamePhysics.createKinematicEntity({ onGround: false, isJumping: true, vy: 200 });
  GamePhysics.applyKinematics(b1, 0.050, { jumpJustPressed: true });
  assert(b1.jumpBufferTimer > 0, '50ms buffer: jumpBufferTimer is positive');
  assert(b1.vy > 0, '50ms buffer: still falling, jump not triggered yet');

  b1.onGround = true;
  b1.isJumping = false;
  GamePhysics.applyKinematics(b1, dt, { jump: true });
  assertApprox(b1.vy, expectedJumpVy, 0.01, `50ms buffer: triggered jump on landing (vy = ${b1.vy.toFixed(2)})`);
  assert(b1.jumpBufferTimer === 0, '50ms buffer: buffer timer consumed and reset to 0');
  assert(b1.isJumping === true, '50ms buffer: isJumping set to true');

  // Test 4.2: Jump pressed 80ms before landing (boundary valid buffer)
  const b2 = GamePhysics.createKinematicEntity({ onGround: false, isJumping: true, vy: 200 });
  GamePhysics.applyKinematics(b2, 0.080, { jumpJustPressed: true });
  assert(b2.jumpBufferTimer > 0, '80ms buffer: jumpBufferTimer is still positive (> 0)');
  b2.onGround = true;
  b2.isJumping = false;
  GamePhysics.applyKinematics(b2, dt, { jump: true });
  assertApprox(b2.vy, expectedJumpVy, 0.01, `80ms buffer: triggered jump on landing (vy = ${b2.vy.toFixed(2)})`);

  // Test 4.3: Jump pressed 110ms before landing (expired buffer > 100ms)
  const b3 = GamePhysics.createKinematicEntity({ onGround: false, isJumping: true, vy: 200 });
  GamePhysics.applyKinematics(b3, 0.010, { jumpJustPressed: true });
  GamePhysics.applyKinematics(b3, 0.100, { jumpJustPressed: false });
  assert(b3.jumpBufferTimer === 0, '110ms elapsed: jumpBufferTimer expired to 0');
  b3.onGround = true;
  b3.isJumping = false;
  b3.vy = 0;
  GamePhysics.applyKinematics(b3, dt, { jump: false });
  assert(b3.isJumping === false, `110ms expired: no jump triggered on landing (isJumping = ${b3.isJumping})`);

  // Test 4.4: Jump buffer is NOT persistent across subsequent landings
  const b4 = GamePhysics.createKinematicEntity({ onGround: false, isJumping: false, vy: 200 });
  b4.onGround = true;
  b4.vy = 0;
  GamePhysics.applyKinematics(b4, dt, { jump: false });
  assert(b4.isJumping === false, 'No ghost jump triggered on subsequent landing');
});

// =========================================================================
// SUITE 5: Coyote Time Timing Thresholds (85ms Window)
// =========================================================================
suite('5. Coyote Time Timing Thresholds (85ms Window)', () => {
  const dt = 1 / 60;
  const expectedJumpVy = GamePhysics.JUMP_VELOCITY + GamePhysics.GRAVITY_HOLD * dt;

  // Test 5.1: Jump at 40ms after walking off ledge (valid coyote)
  const c1 = GamePhysics.createKinematicEntity({ onGround: true });
  GamePhysics.applyKinematics(c1, dt, { right: true });
  c1.onGround = false;

  GamePhysics.applyKinematics(c1, 0.040, { right: true });
  assert(c1.coyoteTimer > 0, '40ms air: coyoteTimer is still active');

  GamePhysics.applyKinematics(c1, dt, { right: true, jump: true, jumpJustPressed: true });
  assertApprox(c1.vy, expectedJumpVy, 0.01, `40ms air: coyote jump triggered with velocity ${c1.vy.toFixed(2)}`);
  assert(c1.isJumping === true, '40ms air: isJumping set to true');
  assert(c1.coyoteTimer === 0, '40ms air: coyoteTimer consumed to 0');

  // Test 5.2: Jump at 60ms after walking off ledge (total time within 85ms)
  const c2 = GamePhysics.createKinematicEntity({ onGround: true });
  GamePhysics.applyKinematics(c2, dt, { right: true });
  c2.onGround = false;

  GamePhysics.applyKinematics(c2, 0.060, { right: true });
  assert(c2.coyoteTimer > 0, `60ms air: coyoteTimer is still active (${c2.coyoteTimer.toFixed(4)})`);

  GamePhysics.applyKinematics(c2, dt, { right: true, jump: true, jumpJustPressed: true });
  assertApprox(c2.vy, expectedJumpVy, 0.01, `60ms air: coyote jump triggered with velocity ${c2.vy.toFixed(2)}`);

  // Test 5.3: Jump at 95ms after walking off ledge (expired coyote > 85ms)
  const c3 = GamePhysics.createKinematicEntity({ onGround: true });
  GamePhysics.applyKinematics(c3, dt, { right: true });
  c3.onGround = false;

  GamePhysics.applyKinematics(c3, 0.095, { right: true });
  assert(c3.coyoteTimer === 0, '95ms air: coyoteTimer expired to 0');

  const preVy = c3.vy;
  GamePhysics.applyKinematics(c3, dt, { right: true, jump: true, jumpJustPressed: true });
  assert(c3.vy > 0 && c3.vy > preVy, `95ms air: jump denied, entity continues falling (vy = ${c3.vy.toFixed(2)})`);
  assert(c3.isJumping === false, '95ms air: isJumping remains false');

  // Test 5.4: Cannot double jump using coyote timer in mid-air
  GamePhysics.applyKinematics(c1, 0.05, { jump: true, jumpJustPressed: true });
  assert(c1.coyoteTimer === 0, 'No mid-air coyote double jump permitted');
});

// =========================================================================
// SUITE 6: Kinematic Dynamics (Skidding, Variable Jump, Air Control)
// =========================================================================
suite('6. Kinematic Dynamics (Skidding, Variable Jump, Air Control)', () => {
  const dt = 1 / 60;

  // Test 6.1: Simultaneous Left + Right Inputs
  const neutral = GamePhysics.createKinematicEntity({ onGround: true, vx: 100 });
  GamePhysics.applyKinematics(neutral, dt, { left: true, right: true });
  assert(neutral.vx < 100, 'Simultaneous Left + Right cancels directional force and applies friction deceleration');

  // Test 6.2: Full Skidding Reversal
  const skidder = GamePhysics.createKinematicEntity({ onGround: true, vx: 240, facing: 1 });
  GamePhysics.applyKinematics(skidder, dt, { left: true, right: false });
  assert(skidder.isSkidding === true, 'isSkidding flag active during high-speed reversal');
  const expectedVx = 240 - 1200 * dt;
  assertApprox(skidder.vx, expectedVx, 0.5, 'Skid deceleration matches SKID_DECELERATION (1200 px/s²)');

  while (skidder.vx > 0) {
    GamePhysics.applyKinematics(skidder, dt, { left: true, right: false });
  }
  assert(skidder.vx <= 0, 'Velocity successfully reversed past 0');
  assert(skidder.isSkidding === false, 'isSkidding deactivates once moving in input direction');
  assert(skidder.facing === -1, 'Facing direction flipped to -1 (Left)');

  // Test 6.3: Variable Jump Heights (Hold vs Early Release)
  const fullHoldMario = GamePhysics.createKinematicEntity({ onGround: true });
  GamePhysics.applyKinematics(fullHoldMario, dt, { jump: true, jumpJustPressed: true });
  let fullHoldPeakY = 0;
  let fullHoldEntityY = 0;
  for (let i = 0; i < 60; i++) {
    GamePhysics.applyKinematics(fullHoldMario, dt, { jump: true });
    fullHoldEntityY += fullHoldMario.vy * dt;
    if (fullHoldMario.vy < 0) {
      fullHoldPeakY = Math.min(fullHoldPeakY, fullHoldEntityY);
    }
  }

  const shortTapMario = GamePhysics.createKinematicEntity({ onGround: true });
  GamePhysics.applyKinematics(shortTapMario, dt, { jump: true, jumpJustPressed: true });
  GamePhysics.applyKinematics(shortTapMario, dt, { jump: false, jumpJustReleased: true });
  let shortTapPeakY = 0;
  let shortTapEntityY = 0;
  for (let i = 0; i < 60; i++) {
    GamePhysics.applyKinematics(shortTapMario, dt, { jump: false });
    shortTapEntityY += shortTapMario.vy * dt;
    if (shortTapMario.vy < 0) {
      shortTapPeakY = Math.min(shortTapPeakY, shortTapEntityY);
    }
  }

  assert(Math.abs(fullHoldPeakY) > Math.abs(shortTapPeakY) * 1.5,
    `Full hold jump height (|${fullHoldPeakY.toFixed(1)}px|) is significantly greater than short tap jump height (|${shortTapPeakY.toFixed(1)}px|)`);

  // Test 6.4: Air Acceleration vs Ground Acceleration
  const groundMario = GamePhysics.createKinematicEntity({ onGround: true, vx: 0 });
  const airMario = GamePhysics.createKinematicEntity({ onGround: false, vx: 0 });

  GamePhysics.applyKinematics(groundMario, dt, { right: true });
  GamePhysics.applyKinematics(airMario, dt, { right: true });

  assert(groundMario.vx > airMario.vx,
    `Ground acceleration (vx=${groundMario.vx.toFixed(2)}) is higher than air acceleration (vx=${airMario.vx.toFixed(2)})`);
  assertApprox(groundMario.vx, GamePhysics.ACCELERATION * dt, 0.01, 'Ground acceleration rate is 500 px/s²');
  assertApprox(airMario.vx, GamePhysics.AIR_ACCELERATION * dt, 0.01, 'Air acceleration rate is 360 px/s²');
});

// =========================================================================
// SUITE 7: DOM & CSS Layout Contract Conformance
// =========================================================================
suite('7. DOM & CSS Layout Conformance', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const cssPath = path.join(rootDir, 'css', 'style.css');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Viewport & meta checks
  assert(html.includes('viewport-fit=cover'), 'Viewport includes viewport-fit=cover');
  assert(html.includes('maximum-scale=1.0'), 'Viewport prevents pinch-zoom with maximum-scale=1.0');

  // HUD elements
  assert(html.includes('id="hud-score"') && html.includes('id="hud-coins"') &&
         html.includes('id="hud-world"') && html.includes('id="hud-time"') &&
         html.includes('id="hud-lives"'), 'All 5 HUD counter elements are present');

  // Canvas 360x800 resolution
  const canvasMatch = html.match(/<canvas[^>]*id="game-canvas"[^>]*width="(\d+)"[^>]*height="(\d+)"/i);
  assert(canvasMatch && canvasMatch[1] === '360' && canvasMatch[2] === '800',
    'Canvas element specifies exact width=360 height=800');

  // CSS touch action & zero-scroll
  assert(css.includes('touch-action: none'), 'CSS specifies touch-action: none');
  assert(css.includes('overflow: hidden'), 'CSS specifies overflow: hidden');
  assert(css.includes('overscroll-behavior: none'), 'CSS specifies overscroll-behavior: none');

  // Button sizes check in CSS (D-Pad >= 56px, Jump >= 56px)
  const dpadBtnSizeMatch = css.match(/#btn-left\s*,\s*#btn-right[^{]*\{[^}]*width:\s*(\d+)px;\s*height:\s*(\d+)px/);
  if (dpadBtnSizeMatch) {
    const w = parseInt(dpadBtnSizeMatch[1], 10);
    const h = parseInt(dpadBtnSizeMatch[2], 10);
    assert(w >= 56 && h >= 56, `D-pad button size (${w}x${h}px) meets ergonomic requirement >= 56px`);
  } else {
    assert(css.includes('#btn-left') && css.includes('width: 64px'), 'D-pad button size declared as 64px');
  }

  const jumpBtnSizeMatch = css.match(/#btn-jump[^{]*\{[^}]*width:\s*(\d+)px;\s*height:\s*(\d+)px/);
  if (jumpBtnSizeMatch) {
    const w = parseInt(jumpBtnSizeMatch[1], 10);
    const h = parseInt(jumpBtnSizeMatch[2], 10);
    assert(w >= 56 && h >= 56, `Jump button size (${w}x${h}px) meets ergonomic requirement >= 56px`);
  } else {
    assert(css.includes('#btn-jump') && css.includes('width: 76px'), 'Jump button size declared as 76px');
  }
});

// =========================================================================
// FINAL REPORT & SUMMARY
// =========================================================================
console.log(`\n===============================================================`);
console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY`);
console.log(`   Total Tests Run: ${totalTests}`);
console.log(`   Passed:          ${passedTests}`);
console.log(`   Failed:          ${failedTests}`);
console.log(`===============================================================`);

if (failedTests > 0) {
  console.log(`\n❌ FAILURES RECORDED:`);
  failureDetails.forEach(f => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log(`\n🏆 EMPIRICAL ADVERSARIAL VERIFICATION: ALL TESTS PASSED (100%)`);
  process.exit(0);
}
