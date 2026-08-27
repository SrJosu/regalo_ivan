/**
 * test/challenger2_m3_stress.mjs - Empirical Stress & Adversarial Verification Suite
 * Milestone 3: Meme Entities & Stomp Mechanics Verification
 * Challenger 2
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load Engine Subsystems
import '../js/assets.js';
import '../js/physics.js';
import '../js/input.js';
import '../js/audio.js';
import '../js/level.js';
import '../js/entities.js';
import '../js/game.js';

const GameAssets = globalThis.GameAssets;
const GamePhysics = globalThis.GamePhysics;
const GameInput = globalThis.GameInput;
const GameAudio = globalThis.GameAudio;
const GameLevel = globalThis.GameLevel;
const GameEntities = globalThis.GameEntities;
const Game = globalThis.Game;

console.log('===============================================================');
console.log('🔥 CHALLENGER 2: M3 MEME ENTITIES & STOMP MECHANICS STRESS SUITE');
console.log('===============================================================\n');

await GameAssets.init();

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

// -----------------------------------------------------------------------------
// Mock Canvas 2D Context to track draw operations and detect glitches / NaNs
// -----------------------------------------------------------------------------
function createMockContext() {
  const calls = [];
  const stateStack = [];

  const ctx = {
    canvas: { width: 360, height: 800 },
    globalAlpha: 1.0,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1.0,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    imageSmoothingEnabled: false,

    save() {
      calls.push({ op: 'save' });
      stateStack.push({
        alpha: this.globalAlpha,
        fill: this.fillStyle,
        stroke: this.strokeStyle,
        lw: this.lineWidth,
        font: this.font,
        align: this.textAlign,
        base: this.textBaseline
      });
    },

    restore() {
      calls.push({ op: 'restore' });
      const state = stateStack.pop();
      if (state) {
        this.globalAlpha = state.alpha;
        this.fillStyle = state.fill;
        this.strokeStyle = state.stroke;
        this.lineWidth = state.lw;
        this.font = state.font;
        this.textAlign = state.align;
        this.textBaseline = state.base;
      }
    },

    translate(x, y) {
      assert(!isNaN(x) && !isNaN(y), `translate received NaN: (${x}, ${y})`);
      assert(isFinite(x) && isFinite(y), `translate received non-finite: (${x}, ${y})`);
      calls.push({ op: 'translate', x, y });
    },

    scale(sx, sy) {
      assert(!isNaN(sx) && !isNaN(sy), `scale received NaN: (${sx}, ${sy})`);
      calls.push({ op: 'scale', sx, sy });
    },

    rotate(angle) {
      assert(!isNaN(angle), `rotate received NaN: ${angle}`);
      calls.push({ op: 'rotate', angle });
    },

    beginPath() {
      calls.push({ op: 'beginPath' });
    },

    moveTo(x, y) {
      assert(!isNaN(x) && !isNaN(y), `moveTo received NaN: (${x}, ${y})`);
      calls.push({ op: 'moveTo', x, y });
    },

    lineTo(x, y) {
      assert(!isNaN(x) && !isNaN(y), `lineTo received NaN: (${x}, ${y})`);
      calls.push({ op: 'lineTo', x, y });
    },

    stroke() {
      calls.push({ op: 'stroke', strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
    },

    fill() {
      calls.push({ op: 'fill', fillStyle: this.fillStyle });
    },

    fillRect(x, y, w, h) {
      assert(!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h), `fillRect received NaN: (${x}, ${y}, ${w}, ${h})`);
      calls.push({ op: 'fillRect', x, y, w, h, fillStyle: this.fillStyle });
    },

    strokeRect(x, y, w, h) {
      assert(!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h), `strokeRect received NaN: (${x}, ${y}, ${w}, ${h})`);
      calls.push({ op: 'strokeRect', x, y, w, h, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
    },

    ellipse(x, y, rx, ry, rot, start, end) {
      assert(!isNaN(x) && !isNaN(y) && !isNaN(rx) && !isNaN(ry), `ellipse received NaN`);
      calls.push({ op: 'ellipse', x, y, rx, ry });
    },

    arc(x, y, r, s, e) {
      assert(!isNaN(x) && !isNaN(y) && !isNaN(r), `arc received NaN`);
      calls.push({ op: 'arc', x, y, r });
    },

    fillText(text, x, y) {
      assert(typeof text === 'string', `fillText text must be string: ${text}`);
      assert(!isNaN(x) && !isNaN(y), `fillText received NaN: (${x}, ${y})`);
      calls.push({ op: 'fillText', text, x, y, fillStyle: this.fillStyle, font: this.font });
    },

    strokeText(text, x, y) {
      assert(typeof text === 'string', `strokeText text must be string: ${text}`);
      assert(!isNaN(x) && !isNaN(y), `strokeText received NaN: (${x}, ${y})`);
      calls.push({ op: 'strokeText', text, x, y, strokeStyle: this.strokeStyle });
    },

    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ op: 'drawImage' });
    },

    _getCalls() {
      return calls;
    },

    _getStackDepth() {
      return stateStack.length;
    }
  };

  return ctx;
}

// =============================================================================
// TEST 1: Enemy Subclass Inheritance, Speeds & Roster
// =============================================================================
runTest('C2.1', 'Meme enemy subclasses (PopCat, Doge, GrumpyCat, Goomba) have correct types, speeds & prototypes', () => {
  const popcat = GameEntities.createPopCat(100, 192);
  const doge = GameEntities.createDoge(100, 192);
  const grumpy = GameEntities.createGrumpyCat(100, 192);
  const goomba = GameEntities.createGoomba(100, 192);

  assert(popcat instanceof GameEntities.MemeEnemy, 'PopCat is instance of MemeEnemy');
  assert(doge instanceof GameEntities.MemeEnemy, 'Doge is instance of MemeEnemy');
  assert(grumpy instanceof GameEntities.MemeEnemy, 'GrumpyCat is instance of MemeEnemy');
  assert(goomba instanceof GameEntities.PopCat, 'Goomba is instance of PopCat (legacy alias)');

  assert.strictEqual(popcat.type, 'popcat');
  assert.strictEqual(doge.type, 'doge');
  assert.strictEqual(grumpy.type, 'grumpy');
  assert.strictEqual(goomba.type, 'popcat');

  // Verify initial speeds
  assert.strictEqual(popcat.vx, -35, 'PopCat speed is -35 px/s');
  assert.strictEqual(doge.vx, -45, 'Doge speed is -45 px/s');
  assert.strictEqual(grumpy.vx, -28, 'GrumpyCat speed is -28 px/s');

  // Factory polymorphism
  const e1 = GameEntities.createMemeEnemy('POPCAT', 10, 10);
  const e2 = GameEntities.createMemeEnemy('doge', 10, 10);
  const e3 = GameEntities.createMemeEnemy('GrumpyCat', 10, 10);
  const e4 = GameEntities.createMemeEnemy('unknown_type', 10, 10);

  assert(e1 instanceof GameEntities.PopCat, 'createMemeEnemy POPCAT -> PopCat');
  assert(e2 instanceof GameEntities.Doge, 'createMemeEnemy doge -> Doge');
  assert(e3 instanceof GameEntities.GrumpyCat, 'createMemeEnemy GrumpyCat -> GrumpyCat');
  assert(e4 instanceof GameEntities.PopCat, 'createMemeEnemy fallback -> PopCat');
});

// =============================================================================
// TEST 2: Patrol Physics & Obstacle Collision Turnaround
// =============================================================================
runTest('C2.2', 'Enemy patrol AI resolves collisions, reverses velocity on solid walls, and handles gravity', () => {
  const level = GameLevel.createLevel();

  // Test wall bounce with pipe at tx=18 (x=288)
  const enemy = GameEntities.createDoge(18 * 16 - 17, 192);
  enemy.vx = 45; // Moving right into pipe
  enemy.facing = 1;

  // Update enemy to collide with pipe
  enemy.update(0.05, level, null);
  assert(enemy.vx < 0, `Enemy reversed velocity from +45 to negative: ${enemy.vx}`);
  assert.strictEqual(enemy.facing, -1, 'Facing direction updated to -1');

  // Test second bounce off left wall
  // Place wall at tx=12
  level.setTile(12, 12, 'pipe_tl');
  const enemy2 = GameEntities.createPopCat(12 * 16 + 17, 192);
  enemy2.vx = -35; // Moving left into block
  enemy2.facing = -1;
  enemy2.update(0.05, level, null);
  assert(enemy2.vx > 0, `Enemy reversed velocity from -35 to positive: ${enemy2.vx}`);
  assert.strictEqual(enemy2.facing, 1, 'Facing direction updated to 1');

  // Test gravity when falling off ledge / in air
  const airEnemy = GameEntities.createGrumpyCat(100, 100);
  airEnemy.onGround = false;
  airEnemy.update(0.05, level, null);
  assert(airEnemy.vy > 0, `Enemy accelerates downward under gravity: ${airEnemy.vy}`);
});

// =============================================================================
// TEST 3: PopCat 180ms Rhythmic Mouth Toggle Loop
// =============================================================================
runTest('C2.3', 'PopCat mouth open/close toggle timing matches exactly ~180ms cycles across extended timeline', () => {
  const popcat = GameEntities.createPopCat(100, 192);

  // Test exact boundary intervals for first 10 cycles (1.8s)
  const dtStep = 0.01; // 10ms increments
  let currentOpen = false;
  let toggleCount = 0;
  let lastToggleTime = 0;

  for (let t = 0; t <= 1.801; t = Number((t + dtStep).toFixed(4))) {
    popcat.animTimer = t;
    const expectedOpen = (Math.floor(t / 0.18) % 2) === 1;

    // Verify mathematical formula
    const actualOpen = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
    assert.strictEqual(actualOpen, expectedOpen, `Mouth state mismatch at t=${t}s`);

    if (actualOpen !== currentOpen) {
      const duration = t - lastToggleTime;
      // Duration should be approximately 0.18s
      assert(Math.abs(duration - 0.18) <= 0.02, `Toggle interval was ${duration.toFixed(3)}s, expected ~0.180s`);
      currentOpen = actualOpen;
      lastToggleTime = t;
      toggleCount++;
    }
  }

  assert(toggleCount >= 9, `Expected at least 9 mouth state toggles in 1.8s, got ${toggleCount}`);

  // Test Sprite name resolution in draw calls
  let drawnSprite = null;
  const originalDrawSprite = GameAssets.drawSprite;
  GameAssets.drawSprite = (ctx, cat, name) => {
    if (cat === 'enemy') drawnSprite = name;
  };

  const mockCtx = createMockContext();

  // Test at 50ms (closed: popcat_walk_1)
  popcat.animTimer = 0.05;
  popcat.isSquashed = false;
  popcat.draw(mockCtx, 0);
  assert.strictEqual(drawnSprite, 'popcat_walk_1', 'PopCat closed mouth uses popcat_walk_1');

  // Test at 200ms (open: popcat_walk_2)
  popcat.animTimer = 0.20;
  popcat.draw(mockCtx, 0);
  assert.strictEqual(drawnSprite, 'popcat_walk_2', 'PopCat open mouth uses popcat_walk_2');

  // Test when squashed (popcat_squash overrides mouth timer)
  popcat.isSquashed = true;
  popcat.draw(mockCtx, 0);
  assert.strictEqual(drawnSprite, 'popcat_squash', 'Squashed PopCat overrides mouth toggle with popcat_squash');

  // Restore GameAssets.drawSprite
  GameAssets.drawSprite = originalDrawSprite;
});

// =============================================================================
// TEST 4: Stomp Mechanics: 450ms Squash Duration, Rebound (-260 px/s), Sound & Callbacks
// =============================================================================
runTest('C2.4', 'Stomp collision squash exhibits 450ms lifetime, player vy rebound -260 px/s, and audio trigger', () => {
  const level = GameLevel.createLevel();
  const popcat = GameEntities.createPopCat(100, 192);
  const player = GameEntities.createPlayer(100, 180);
  player.vy = 200; // Falling down onto PopCat

  let stompCount = 0;
  let stompedCoords = null;
  let stompedType = null;

  popcat.update(0.016, level, player, (x, y, type) => {
    stompCount++;
    stompedCoords = { x, y };
    stompedType = type;
  });

  // 1. Check stomp event triggered
  assert.strictEqual(stompCount, 1, 'Stomp callback fired once');
  assert.strictEqual(stompedType, 'popcat', 'Stomp callback passed popcat type');
  assert(Math.abs(stompedCoords.x - 100) < 1, 'Stomp coords X near 100');
  assert.strictEqual(stompedCoords.y, 192, 'Stomp coords Y is 192');

  // 2. Check player rebound impulse
  assert.strictEqual(player.vy, -260, 'Player rebound velocity is exactly -260 px/s');
  assert.strictEqual(player.isJumping, true, 'Player isJumping marked true');
  assert.strictEqual(player.onGround, false, 'Player onGround marked false');

  // 3. Check enemy squashed state
  assert.strictEqual(popcat.isSquashed, true, 'Enemy isSquashed is true');
  assert.strictEqual(popcat.squashTimer, 0.45, 'Squash timer initialized to 0.45s (450ms)');
  assert.strictEqual(popcat.vx, 0, 'Horizontal speed halted on squash');
  assert.strictEqual(popcat.vy, 0, 'Vertical speed halted on squash');
  assert.strictEqual(popcat.isAlive, true, 'Enemy remains alive during squash animation');

  // 4. Update squash duration in steps:
  // Step A: 200ms elapsed (total 200ms / 450ms)
  popcat.update(0.20, level, player);
  assert.strictEqual(popcat.isAlive, true, 'Enemy still alive at 200ms squash elapsed');
  assert(Math.abs(popcat.squashTimer - 0.25) < 0.001, 'Squash timer decremented to 0.25s');

  // Step B: 240ms elapsed (total 440ms / 450ms)
  popcat.update(0.24, level, player);
  assert.strictEqual(popcat.isAlive, true, 'Enemy still alive at 440ms squash elapsed');
  assert(Math.abs(popcat.squashTimer - 0.01) < 0.001, 'Squash timer decremented to 0.01s');

  // Step C: 20ms elapsed (total 460ms > 450ms) -> Enemy is dead
  popcat.update(0.02, level, player);
  assert.strictEqual(popcat.isAlive, false, 'Enemy isAlive marked false after 450ms squash duration');
});

// =============================================================================
// TEST 5: Floating Meme Combat Text Particle Pools & Colors
// =============================================================================
runTest('C2.5', 'Floating meme combat text particles generate correct strings, colors, upward drift & elastic scaling', () => {
  const popcatText = GameEntities.createFloatingMemeText(50, 80, 'stomp', 'popcat');
  const dogeText = GameEntities.createFloatingMemeText(50, 80, 'stomp', 'doge');
  const grumpyText = GameEntities.createFloatingMemeText(50, 80, 'stomp', 'grumpy');
  const coinText = GameEntities.createFloatingMemeText(50, 80, 'coin');
  const blockText = GameEntities.createFloatingMemeText(50, 80, 'block');

  // Verify colors
  assert.strictEqual(popcatText.color, '#76FF03', 'PopCat combat text color is #76FF03 (Lime)');
  assert.strictEqual(dogeText.color, '#FFD700', 'Doge combat text color is #FFD700 (Gold)');
  assert.strictEqual(grumpyText.color, '#FF1744', 'Grumpy combat text color is #FF1744 (Ruby Red)');
  assert.strictEqual(coinText.color, '#00E5FF', 'Coin text color is #00E5FF (Cyan)');
  assert.strictEqual(blockText.color, '#FF1493', 'Block text color is #FF1493 (Pink)');

  // Verify particle physics & decay
  const p = popcatText;
  assert.strictEqual(p.vy, -55, 'Text particle drifts upward with vy = -55 px/s');
  assert.strictEqual(p.life, 0.70, 'Lifespan is 700ms (0.70s)');

  // Test elastic pop-in scale curve
  p.update(0.06); // elapsed = 0.06s < 0.12s
  assert(p.scale > 0.5 && p.scale <= 1.2, `Scale pop-in at 60ms: ${p.scale}`);

  p.update(0.06); // elapsed = 0.12s -> peak scale ~1.2
  assert(p.scale >= 1.15, `Scale peak at 120ms: ${p.scale}`);

  p.update(0.30); // elapsed = 0.42s > 0.12s -> settles towards 1.0
  assert(p.scale >= 1.0 && p.scale <= 1.2, `Scale settling: ${p.scale}`);

  // Test death after 700ms
  p.update(0.35); // total elapsed > 0.70s
  assert.strictEqual(p.isAlive, false, 'Text particle dies after maxLife expires');

  // Verify Doge text choices match pool
  const dogePool = GameEntities.MEME_TEXTS.stomp_doge;
  for (let i = 0; i < 20; i++) {
    const dt = GameEntities.createFloatingMemeText(0, 0, 'stomp', 'doge');
    assert(dogePool.includes(dt.text), `Doge text "${dt.text}" must be in doge pool: ${dogePool.join(', ')}`);
  }

  // Verify Grumpy text choices match pool
  const grumpyPool = GameEntities.MEME_TEXTS.stomp_grumpy;
  for (let i = 0; i < 20; i++) {
    const gt = GameEntities.createFloatingMemeText(0, 0, 'stomp', 'grumpy');
    assert(grumpyPool.includes(gt.text), `Grumpy text "${gt.text}" must be in grumpy pool: ${grumpyPool.join(', ')}`);
  }
});

// =============================================================================
// TEST 6: Confetti Emitters Physics, Wobble & Colors
// =============================================================================
runTest('C2.6', 'Celebratory confetti particles oscillate with sinusoidal wobble, gravity, and flutter rotation', () => {
  const burst = GameEntities.createConfettiBurst(100, 100, 12, { speed: 100 });
  assert.strictEqual(burst.length, 12, 'Confetti burst spawned 12 particles');

  burst.forEach(c => {
    assert(c instanceof GameEntities.ConfettiParticle, 'Instance of ConfettiParticle');
    assert(GameEntities.CONFETTI_COLORS.includes(c.color), `Color ${c.color} is valid confetti color`);

    const initX = c.x;
    const initY = c.y;
    const initRot = c.rotation;

    c.update(0.05);

    assert(c.x !== initX, 'Confetti moved horizontally');
    assert(c.y !== initY, 'Confetti moved vertically');
    assert(c.rotation !== initRot, 'Confetti rotated');
    assert(c.isAlive === true, 'Confetti alive');
  });

  // Test victory shower
  const shower = GameEntities.createVictoryConfetti(200, 20, 25);
  assert.strictEqual(shower.length, 25, 'Victory shower spawned 25 particles');
});

// =============================================================================
// TEST 7: Floating Sky Banner Canvas Draw & Coordinate Integrity
// =============================================================================
runTest('C2.7', 'Floating sky banner renders balloon anchors, ribbon notches, drop shadow & birthday greeting without canvas errors', () => {
  const level = GameLevel.createLevel();
  assert(level.skyBanner !== null, 'Sky banner exists');
  assert.strictEqual(level.skyBanner.text, '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂');
  assert.strictEqual(level.skyBanner.startCol, 4);
  assert.strictEqual(level.skyBanner.endCol, 16);

  const mockCtx = createMockContext();

  // Test sky banner drawing at cameraX = 0 (visible)
  level.cameraX = 0;
  level.animTimer = 0.5;
  level.drawSkyBanner(mockCtx);

  const calls = mockCtx._getCalls();
  const fillTexts = calls.filter(c => c.op === 'fillText');
  assert(fillTexts.length >= 2, 'Sky banner drew drop shadow + main text');
  assert.strictEqual(fillTexts[0].text, '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂');
  assert.strictEqual(fillTexts[1].text, '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂');

  // Verify balanced save / restore stack
  assert.strictEqual(mockCtx._getStackDepth(), 0, 'Canvas context save/restore stack is perfectly balanced');

  // Test culling when camera is far right (e.g. cameraX = 1000)
  const farMockCtx = createMockContext();
  level.cameraX = 1000;
  level.drawSkyBanner(farMockCtx);
  const farCalls = farMockCtx._getCalls();
  assert.strictEqual(farCalls.length, 0, 'Sky banner is culled when offscreen (cameraX = 1000)');
});

// =============================================================================
// TEST 8: Roadside Milestone Signposts & Interactive Speech Bubble
// =============================================================================
runTest('C2.8', 'Roadside milestone signs render board/pole and display proximity dialogue bubble when player is within 36px', () => {
  const level = GameLevel.createLevel();
  assert.strictEqual(level.signposts.length, 4, 'Level contains 4 signposts');

  const sign1 = level.signposts[0]; // col 12 -> x = 192px
  assert.strictEqual(sign1.title, 'KM 0');
  assert.strictEqual(sign1.lines[0], '🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!');

  // Case A: Player far away (playerX = 40, distance = 160px > 36px) -> Sign rendered, but NO speech bubble
  const mockCtxFar = createMockContext();
  level.cameraX = 0;
  level.drawSignposts(mockCtxFar, 40);

  const farCalls = mockCtxFar._getCalls();
  const farTexts = farCalls.filter(c => c.op === 'fillText').map(c => c.text);
  assert(farTexts.includes('KM 0'), 'Sign title "KM 0" rendered');
  assert(!farTexts.includes('🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!'), 'Dialogue bubble NOT rendered when player is far away');
  assert.strictEqual(mockCtxFar._getStackDepth(), 0, 'Canvas stack balanced');

  // Case B: Player near Sign 1 (playerX = 195, sign center ~ 200, dist = 5px < 36px) -> Speech bubble popup visible
  const mockCtxNear = createMockContext();
  level.drawSignposts(mockCtxNear, 195);

  const nearCalls = mockCtxNear._getCalls();
  const nearTexts = nearCalls.filter(c => c.op === 'fillText').map(c => c.text);
  assert(nearTexts.includes('KM 0'), 'Sign title rendered');
  assert(nearTexts.includes('🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!'), 'Dialogue Line 1 rendered');
  assert(nearTexts.includes('¡A por la gran recompensa!'), 'Dialogue Line 2 rendered');
  assert.strictEqual(mockCtxNear._getStackDepth(), 0, 'Canvas stack balanced');
});

// =============================================================================
// TEST 9: Full Level Camera Sweep & Render Stress Test
// =============================================================================
runTest('C2.9', 'Full stage camera sweep across 2080px world does not throw errors, leak stack, or generate NaNs', () => {
  const level = GameLevel.createLevel();
  const mockCtx = createMockContext();

  // Sweep cameraX from 0 to 1900 in 20px increments
  for (let camX = 0; camX <= 1900; camX += 20) {
    level.cameraX = camX;
    level.animTimer = camX * 0.01;
    level.draw(mockCtx, 180, 400, camX + 50);
  }

  assert.strictEqual(mockCtx._getStackDepth(), 0, 'Canvas stack depth is 0 after sweeping entire level');
  assert(mockCtx._getCalls().length > 1000, 'Rendered thousands of drawing commands across level sweep');
});

console.log('\n===============================================================');
console.log(`📊 CHALLENGER 2 STRESS SUITE: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');

if (passed === total) {
  console.log('🏆 EMPIRICAL CHALLENGER 2 VERIFICATION: ALL ADVERSARIAL STRESS TESTS PASSED!\n');
  process.exit(0);
} else {
  process.exit(1);
}
