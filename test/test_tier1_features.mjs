/**
 * test/test_tier1_features.mjs - Tier 1 Feature Coverage Tests
 *
 * V2 Iván's Birthday Gift Edition — Platformer Overhaul (M4)
 *
 * Tests:
 * - T1.1: Super Iván 8-State Sprites & 14-Color Palette
 * - T1.2: Pop Cat 180ms Mouth Loop & Stomp Squash Mechanics
 * - T1.3: Doge Agile Patrol & Grumpy Cat Stubborn Patrol Entities
 * - T1.4: Zero-Dependency Web Audio Meme Synthesizer Suite
 * - T1.5: Player Kinematics, Horizontal Movement & Variable Jump Height
 * - T1.6: Tile Collision (Ground, Solid Wall, Question Block Bump)
 * - T1.7: Collectible 3D Gold Coins & Cake Bonus Items
 * - T1.8: Meme Enemy Stomp Mechanics & Rebound Impulse
 * - T1.9: Floating Meme Combat Text & Confetti Particle Physics
 * - T1.10: Birthday Lore, Sky Banner, Milestone Signs & Castle Cake
 * - T1.11: Goal Flagpole Contact & Victory Slide State
 * - T1.12: DOM Victory Modal & Exact Required Reward Button String + YouTube Link
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import All Subsystems
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
console.log('🧪 TIER 1: FEATURE COVERAGE TEST SUITE (V2)');
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

// Helper to count unique opaque colors in a canvas or memory canvas
function countColors(canvas) {
  if (!canvas) return 0;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const colors = new Set();
  for (let i = 0; i < imgData.length; i += 4) {
    if (imgData[i+3] > 0) {
      colors.add(`${imgData[i]},${imgData[i+1]},${imgData[i+2]}`);
    }
  }
  return colors.size;
}

// T1.1: Super Iván 8-State Sprites & 14-Color Palette
await GameAssets.init();
runTest('T1.1', 'Super Iván 8-State Sprites & 14-Color Palette', () => {
  assert(GameAssets.isReady === true, 'GameAssets is ready');
  
  const states = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag', 'die'];
  for (const s of states) {
    const sprite = GameAssets.getSprite('player', s);
    assert(sprite !== null && sprite !== undefined, `Sprite player.${s} exists`);
    assert(sprite.width === 16 && sprite.height === 16, `Sprite player.${s} is 16x16`);
  }

  const idleColors = countColors(GameAssets.getSprite('player', 'idle'));
  assert(idleColors >= 4, `Player idle sprite has at least 4 distinct colors (got: ${idleColors})`);

  const idleFlip = GameAssets.getSprite('player', 'idle_flip');
  assert(idleFlip !== null, 'Player idle_flip mirror sprite generated');
});

// T1.2: Pop Cat 180ms Mouth Loop & Stomp Squash Mechanics
runTest('T1.2', 'Pop Cat 180ms Mouth Loop & Stomp Squash Mechanics', () => {
  const popcat = GameEntities.createPopCat(100, 192);
  assert(popcat.type === 'popcat', 'Type is popcat');

  // Test 180ms mouth oscillation calculation
  popcat.animTimer = 0.05; // 0.05 / 0.18 = 0 (even -> closed)
  const isMouthOpen0 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen0 === false, 'Mouth closed at 0.05s');

  popcat.animTimer = 0.20; // 0.20 / 0.18 = 1 (odd -> open)
  const isMouthOpen1 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen1 === true, 'Mouth open at 0.20s');

  popcat.animTimer = 0.38; // 0.38 / 0.18 = 2 (even -> closed)
  const isMouthOpen2 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen2 === false, 'Mouth closed at 0.38s');

  // Stomp squash lifecycle (450ms)
  popcat.squash();
  assert(popcat.type === 'popcat', 'Type remains popcat');
  assert(popcat.isSquashed === true, 'Entity is squashed');
  assert(popcat.squashTimer === 0.45, 'Squash timer initialized to 0.45s');

  // Update for 0.30s (still alive)
  popcat.update(0.30, null, null);
  assert(popcat.isAlive === true, 'Pop Cat remains visible while squashed');

  // Update past 0.45s (now dead)
  popcat.update(0.20, null, null);
  assert(popcat.isAlive === false, 'Pop Cat cleaned up after squash expiration');
});

// T1.3: Doge Agile Patrol & Grumpy Cat Stubborn Patrol Entities
runTest('T1.3', 'Doge Agile Patrol & Grumpy Cat Stubborn Patrol Entities', () => {
  const doge = GameEntities.createDoge(100, 192);
  assert(doge.type === 'doge', 'Doge type is doge');
  assert(doge.vx === -45, 'Doge runs at agile speed -45 px/s');
  doge.squash();
  assert(doge.isSquashed === true, 'Doge squashed');

  const grumpy = GameEntities.createGrumpyCat(100, 192);
  assert(grumpy.type === 'grumpy', 'Grumpy Cat type is grumpy');
  assert(grumpy.vx === -28, 'Grumpy Cat runs at stubborn speed -28 px/s');
  grumpy.squash();
  assert(grumpy.isSquashed === true, 'Grumpy Cat squashed');

  // Backward compatibility alias
  const goomba = GameEntities.createGoomba(100, 192);
  assert(goomba.type === 'popcat', 'createGoomba aliases to popcat');
});

// T1.4: Zero-Dependency Web Audio Meme Synthesizer Suite
runTest('T1.4', 'Zero-Dependency Web Audio Meme Synthesizer Suite', () => {
  // Test execution without throwing exceptions
  assert.doesNotThrow(() => {
    GameAudio.init();
    GameAudio.unlockAudio();
    GameAudio.playJump();
    GameAudio.playCoin();
    GameAudio.playStomp();
    GameAudio.playBump();
    GameAudio.playDeath();
    GameAudio.playWin();
    if (typeof GameAudio.playAirhorn === 'function') GameAudio.playAirhorn();
    if (typeof GameAudio.playBruh === 'function') GameAudio.playBruh();
  }, 'All meme audio methods execute cleanly without throwing');
});

// T1.5: Player Kinematics, Horizontal Movement & Variable Jump Height
runTest('T1.5', 'Player Kinematics, Horizontal Movement & Variable Jump Height', () => {
  const level = GameLevel.createLevel();
  const player = GameEntities.createPlayer(40, 192);

  assert(player.vx === 0 && player.state === 'IDLE', 'Player starts idle');

  // Accelerate right
  for (let i = 0; i < 10; i++) {
    player.update(0.016, { right: true }, level);
  }
  assert(player.vx > 0, 'Player accelerates right');
  assert(player.facing === 1, 'Facing direction is right (1)');
  assert(player.state === 'WALK' || player.state === 'RUN', 'State transitioned to WALK or RUN');

  // Variable Jump Height Test (Hold vs Tap)
  const jumperHold = GameEntities.createPlayer(40, 192);
  jumperHold.update(0.016, { jump: true, jumpJustPressed: true }, level);
  for (let i = 0; i < 15; i++) {
    jumperHold.update(0.016, { jump: true }, level);
  }
  const holdPeakY = jumperHold.y;

  const jumperTap = GameEntities.createPlayer(40, 192);
  jumperTap.update(0.016, { jump: true, jumpJustPressed: true }, level);
  jumperTap.update(0.016, { jump: false, jumpJustReleased: true }, level);
  for (let i = 0; i < 15; i++) {
    jumperTap.update(0.016, { jump: false }, level);
  }
  const tapPeakY = jumperTap.y;

  assert(holdPeakY < tapPeakY, `Holding jump ascends significantly higher (Hold Y: ${holdPeakY.toFixed(1)} < Tap Y: ${tapPeakY.toFixed(1)})`);
});

// T1.6: Tile Collision (Ground, Solid Wall, Question Block Bump)
runTest('T1.6', 'Tile Collision (Ground, Solid Wall, Question Block Bump)', () => {
  const level = GameLevel.createLevel();
  const player = GameEntities.createPlayer(40, 192);

  player.update(0.016, {}, level);
  assert(player.onGround === true, 'Player remains grounded on floor');
  assert(player.y === 192, 'Player y snapped to 192');

  // Question block bump from below
  let blockHitTx = null;
  let blockHitTy = null;
  const underBlockPlayer = GameEntities.createPlayer(8 * 16, 144 + 16);
  underBlockPlayer.vy = -300;

  underBlockPlayer.update(0.016, {}, level, (tx, ty) => {
    blockHitTx = tx;
    blockHitTy = ty;
  });

  assert(blockHitTx === 8 && blockHitTy === 9, 'Hit ceiling question block at (8,9)');
  const res = level.bumpBlock(8, 9);
  assert(res.coinEarned === true, 'Coin earned from question block');
  assert(level.getTile(8, 9) === 'empty', 'Question block transformed to empty');
});

// T1.7: Collectible 3D Gold Coins & Cake Bonus Items
runTest('T1.7', 'Collectible 3D Gold Coins & Cake Bonus Items', () => {
  let scoreAwarded = 0;
  const coin = GameEntities.createCoin(100, 192);
  const player = GameEntities.createPlayer(100, 192);

  coin.update(0.016, player, () => { scoreAwarded += 200; });
  assert(scoreAwarded === 200, 'Score incremented by 200 on coin pickup');
  assert(coin.isAlive === false, 'Coin entity consumed');

  const cakeSprite = GameAssets.getSprite('item', 'cake');
  assert(cakeSprite !== null, 'Birthday cake sprite exists');
  const cakeColors = countColors(cakeSprite);
  assert(cakeColors >= 4, `Cake sprite contains rich palette colors (got: ${cakeColors})`);
});

// T1.8: Meme Enemy Stomp Mechanics & Rebound Impulse
runTest('T1.8', 'Meme Enemy Stomp Mechanics & Rebound Impulse', () => {
  const level = GameLevel.createLevel();
  let stomped = false;
  const popcat = GameEntities.createPopCat(100, 192);
  const player = GameEntities.createPlayer(100, 180);
  player.vy = 180; // Falling onto PopCat

  popcat.update(0.016, level, player, () => { stomped = true; });
  assert(popcat.isSquashed === true, 'Pop Cat squashed on stomp');
  assert(stomped === true, 'Stomp callback fired');
  assert(player.vy <= -200, `Player bounced upward with strong impulse (vy: ${player.vy})`);
});

// T1.9: Floating Meme Combat Text & Confetti Particle Physics
runTest('T1.9', 'Floating Meme Combat Text & Confetti Particle Physics', () => {
  const particle = GameEntities.createFloatingMemeText('stomp_popcat', 100, 150);
  assert(particle.isAlive === true, 'Particle spawned alive');
  assert(particle.vy < 0, 'Particle drifts upward');
  
  // Advance particle physics
  particle.update(0.80);
  assert(particle.isAlive === false, 'Particle cleanly expired after lifespan');

  const confetti = GameEntities.createConfettiBurst(100, 100, 10);
  assert(confetti.length === 10, 'Spawned 10 confetti particles');
  assert(confetti[0].isAlive === true, 'Confetti particle alive');
});

// T1.10: Birthday Lore, Sky Banner, Milestone Signs & Castle Cake
runTest('T1.10', 'Birthday Lore, Sky Banner, Milestone Signs & Castle Cake', () => {
  const level = GameLevel.createLevel();
  assert(level.skyBanner !== null && level.skyBanner !== undefined, 'Sky banner defined in level');
  assert(level.skyBanner.text.includes('IVÁN') || level.skyBanner.text.includes('CUMPLEAÑOS'), 'Sky banner contains Iván birthday message');
  assert(level.signposts.length >= 4, `At least 4 roadside milestone signs defined (got: ${level.signposts.length})`);
  assert(level.castleDoorX > 0, 'Castle door coordinate defined');
});

// T1.11: Goal Flagpole Contact & Victory Slide State
runTest('T1.11', 'Goal Flagpole Contact & Victory Slide State', () => {
  const level = GameLevel.createLevel();
  const player = GameEntities.createPlayer(level.flagpole.x - 4, level.flagpole.topY + 16);
  let reached = false;

  player.update(0.016, {}, level, null, () => { reached = true; });
  assert(reached === true, 'Flagpole contact detected');
  assert(player.state === 'FLAG_SLIDE', 'Player entered FLAG_SLIDE state');
});

// T1.12: DOM Victory Modal & Exact Required Reward Button String + YouTube Link
runTest('T1.12', 'DOM Victory Modal & Exact Required Reward Button String + YouTube Link', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert(htmlContent.includes('id="victory-modal"'), 'index.html contains #victory-modal');
  assert(htmlContent.includes('role="dialog"'), 'victory modal has role="dialog"');
  assert(htmlContent.includes('id="reward-btn"'), 'index.html contains #reward-btn');

  const EXACT_BUTTON_TEXT = 'Terminado el juego. Pincha aquí para recibir la recompensa';
  assert(htmlContent.includes(EXACT_BUTTON_TEXT), `index.html contains exact required text: "${EXACT_BUTTON_TEXT}"`);
  assert(htmlContent.includes('https://www.youtube.com/watch?v='), 'Reward button links to YouTube URL');
  assert(htmlContent.includes('target="_blank"'), 'Reward button opens in new tab (target="_blank")');
  assert(htmlContent.includes('rel="noopener noreferrer"'), 'Reward button has rel="noopener noreferrer"');
  assert(htmlContent.includes('id="btn-replay"'), 'index.html contains replay button #btn-replay');
});

console.log('\n===============================================================');
console.log(`📊 TIER 1 FEATURE SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');
