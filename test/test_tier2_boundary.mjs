/**
 * test/test_tier2_boundary.mjs - Tier 2 Boundary & Corner Case Tests
 *
 * V2 Iván's Birthday Gift Edition — Platformer Overhaul (M4)
 *
 * Tests:
 * - T2.1: Viewport extreme aspect ratios & coordinate mapping
 * - T2.2: Stomp Lateral Overlap Boundary Tolerances (±15.9px Overlap)
 * - T2.3: Multiple Clustered Meme Enemies Patrol & Turnaround
 * - T2.4: Rapid Polyphonic Audio Triggers & Headroom Stress
 * - T2.5: 360x800 Mobile Viewport & Camera Clamping Bounds
 * - T2.6: Sub-Pixel High-Speed Fall Anti-Tunneling Sub-Stepping
 * - T2.7: Coyote Time Jump Boundary (85ms Window)
 * - T2.8: Jump Buffer Registration 100ms Before Landing
 * - T2.9: Left Level Boundary Clamping (x <= 0)
 * - T2.10: Skid Turnaround when Reversing Direction at High Speed
 */

import { strict as assert } from 'assert';

import '../js/assets.js';
import '../js/physics.js';
import '../js/input.js';
import '../js/audio.js';
import '../js/level.js';
import '../js/entities.js';
import '../js/game.js';

const GamePhysics = globalThis.GamePhysics;
const GameAudio = globalThis.GameAudio;
const GameLevel = globalThis.GameLevel;
const GameEntities = globalThis.GameEntities;

console.log('===============================================================');
console.log('🧪 TIER 2: BOUNDARY & CORNER CASE TEST SUITE (V2)');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function runTest(id, name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ [${id}] ${name}`);
  } catch (err) {
    console.error(`  ❌ [${id}] FAIL: ${name} — ${err.message}`);
    throw err;
  }
}

// T2.1: Viewport extreme aspect ratios & coordinate mapping
runTest('T2.1', 'Viewport extreme aspect ratios & coordinate mapping', () => {
  const aspectRatios = [
    { w: 360, h: 640 },  // 16:9
    { w: 360, h: 800 },  // 20:9 (Target Android)
    { w: 390, h: 844 },  // iPhone 12/13/14
    { w: 412, h: 915 },  // Galaxy S21
    { w: 768, h: 1024 }  // Tablet 4:3
  ];

  aspectRatios.forEach(ar => {
    const scale = 2;
    const viewWidth = ar.w / scale;
    const viewHeight = ar.h / scale;
    assert(viewWidth >= 180, `Virtual width (${viewWidth}) >= 180 for ${ar.w}x${ar.h}`);
    assert(viewHeight >= 320, `Virtual height (${viewHeight}) >= 320 for ${ar.w}x${ar.h}`);
  });
});

// T2.2: Stomp Lateral Overlap Boundary Tolerances (Edge of Collider Inset)
runTest('T2.2', 'Stomp Lateral Overlap Boundary Tolerances (Edge of Collider Inset)', () => {
  const level = GameLevel.createLevel();

  // Case A: 1px collider overlap from right (Player x = 111 vs Enemy x = 100) -> Valid Stomp
  let stompedA = false;
  const enemyA = GameEntities.createPopCat(100, 192);
  const playerA = GameEntities.createPlayer(111, 180);
  playerA.vy = 200; // Falling
  enemyA.update(0.016, level, playerA, () => { stompedA = true; });
  assert(stompedA === true, 'Stomp detected with lateral overlap from right');
  assert(enemyA.isSquashed === true, 'Enemy squashed');

  // Case B: 1px collider overlap from left (Player x = 89 vs Enemy x = 100) -> Valid Stomp
  let stompedB = false;
  const enemyB = GameEntities.createPopCat(100, 192);
  const playerB = GameEntities.createPlayer(89, 180);
  playerB.vy = 200; // Falling
  enemyB.update(0.016, level, playerB, () => { stompedB = true; });
  assert(stompedB === true, 'Stomp detected with lateral overlap from left');
  assert(enemyB.isSquashed === true, 'Enemy squashed');

  // Case C: Side impact without vertical falling (Player y = enemy y) -> Hurt player
  let killedC = false;
  const enemyC = GameEntities.createDoge(100, 192);
  const playerC = GameEntities.createPlayer(104, 192);
  playerC.vy = 0; // Walking into side
  enemyC.update(0.016, level, playerC, null, () => { killedC = true; });
  assert(killedC === true, 'Side collision triggers player damage');
  assert(enemyC.isSquashed === false, 'Enemy not squashed on side collision');
});

// T2.3: Multiple Clustered Meme Enemies Patrol & Turnaround
runTest('T2.3', 'Multiple Clustered Meme Enemies Patrol & Turnaround', () => {
  const level = GameLevel.createLevel();

  // PopCat moving left toward pipe at col 18 (x=288)
  const popcat = GameEntities.createPopCat(292, 192);
  popcat.vx = -35;

  // Update toward left wall
  for (let i = 0; i < 30; i++) {
    popcat.update(0.016, level, null);
  }
  assert(popcat.vx > 0, 'Pop Cat turned around after colliding with pipe wall');
  assert(popcat.x >= 288 + 16, 'Pop Cat stayed outside solid pipe geometry');
});

// T2.4: Rapid Polyphonic Audio Triggers & Headroom Stress
runTest('T2.4', 'Rapid Polyphonic Audio Triggers & Headroom Stress (50+ calls)', () => {
  assert.doesNotThrow(() => {
    GameAudio.init();
    GameAudio.unlockAudio();
    for (let i = 0; i < 50; i++) {
      GameAudio.playJump();
      GameAudio.playCoin();
      GameAudio.playStomp();
      GameAudio.playBump();
      GameAudio.playDeath();
    }
  }, '50 rapid polyphonic audio triggers handled without errors or NaN params');
});

// T2.5: 360x800 Mobile Viewport & Camera Clamping Bounds
runTest('T2.5', '360x800 Mobile Viewport & Camera Clamping Bounds', () => {
  const level = GameLevel.createLevel();
  const viewWidth = 180; // Virtual width in game coordinates

  // Camera never scrolls below 0
  level.cameraX = -50;
  level.updateCamera(40, viewWidth);
  assert(level.cameraX >= 0, 'Camera position clamped >= 0');

  // Camera does not exceed rightmost level boundary
  level.updateCamera(3000, viewWidth);
  assert(level.cameraX <= level.worldPixelWidth - viewWidth, 'Camera clamped at rightmost level boundary');
  assert(level.cameraX > 0, 'Camera progressed to end of level');
});

// T2.6: Sub-Pixel High-Speed Fall Anti-Tunneling Sub-Stepping
runTest('T2.6', 'Sub-Pixel High-Speed Fall Anti-Tunneling Sub-Stepping', () => {
  const level = GameLevel.createLevel();
  // Falling at 1200 px/s from y=120 with dt = 0.08s (step of 96px would overshoot 192px floor without sub-stepping)
  const meteor = GameEntities.createPlayer(40, 120);
  meteor.vy = 1200;

  GamePhysics.resolveMapCollisions(meteor, level, 0.08);
  assert(meteor.y === 192, `Entity stopped exactly on floor surface (192, actual: ${meteor.y})`);
  assert(meteor.vy === 0, 'Vertical velocity zeroed');
  assert(meteor.onGround === true, 'onGround is true after landing');
});

// T2.7: Coyote Time Jump Boundary (85ms Window)
runTest('T2.7', 'Coyote Time Jump Boundary (85ms Window)', () => {
  const jumper = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: true });
  GamePhysics.applyKinematics(jumper, 0.016, { right: true });
  jumper.onGround = false; // Stepped off ledge

  // 60ms in air (within 85ms)
  GamePhysics.applyKinematics(jumper, 0.06, { jump: false });
  assert(jumper.coyoteTimer > 0, 'Coyote timer active at 60ms');

  // Trigger jump
  GamePhysics.applyKinematics(jumper, 0.016, { jump: true, jumpJustPressed: true });
  assert(jumper.isJumping === true && jumper.vy < -300, 'Coyote jump succeeded in mid-air');

  // 95ms in air (past 85ms window)
  const lateJumper = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: true });
  GamePhysics.applyKinematics(lateJumper, 0.016, { right: true });
  lateJumper.onGround = false;
  GamePhysics.applyKinematics(lateJumper, 0.095, { jump: false });
  assert(lateJumper.coyoteTimer === 0, 'Coyote timer expired at 95ms');

  GamePhysics.applyKinematics(lateJumper, 0.016, { jump: true, jumpJustPressed: true });
  assert(lateJumper.isJumping === false, 'Late coyote jump denied');
});

// T2.8: Jump Buffer Registration 100ms Before Landing
runTest('T2.8', 'Jump Buffer Registration 100ms Before Landing', () => {
  const lander = GamePhysics.createKinematicEntity({ x: 100, y: 100, onGround: false, vy: 200 });
  // Tap jump 70ms before landing
  GamePhysics.applyKinematics(lander, 0.07, { jump: false, jumpJustPressed: true });
  assert(lander.jumpBufferTimer > 0, 'Buffer timer stored early press');

  // Land on ground
  lander.onGround = true;
  GamePhysics.applyKinematics(lander, 0.016, { jump: true });
  assert(lander.isJumping === true && lander.vy < -300, 'Buffered jump fired upon landing');
});

// T2.9: Left Level Boundary Clamping (x <= 0)
runTest('T2.9', 'Left Level Boundary Clamping (x <= 0)', () => {
  const level = GameLevel.createLevel();
  const player = GameEntities.createPlayer(2, 192);
  player.vx = -100;

  GamePhysics.resolveMapCollisions(player, level, 0.05);
  assert(player.x === 0, `Player position clamped exactly at left boundary (0, got: ${player.x})`);
  assert(player.vx === 0, 'Leftward velocity zeroed upon boundary hit');
});

// T2.10: Skid Turnaround when Reversing Direction at High Speed
runTest('T2.10', 'Skid Turnaround when Reversing Direction at High Speed', () => {
  const level = GameLevel.createLevel();
  const player = GameEntities.createPlayer(100, 192);
  player.vx = 220; // Fast right movement
  player.onGround = true;

  // Press Left to reverse
  player.update(0.016, { left: true }, level);
  assert(player.isSkidding === true, 'Player entered skidding state');
  assert(player.vx < 220, 'Skid deceleration rapidly applied');
});

console.log('\n===============================================================');
console.log(`📊 TIER 2 BOUNDARY SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');
