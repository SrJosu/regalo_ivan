/**
 * test/test_tier3_combos.mjs - Tier 3 Cross-Feature Combination Tests
 *
 * V2 Iván's Birthday Gift Edition — Platformer Overhaul (M4)
 *
 * Tests:
 * - T3.1: Multi-touch simultaneous Run (Right) + Jump button press
 * - T3.2: Touch button drag & multi-touch sliding with dynamic re-mapping
 * - T3.3: Consecutive 3-Enemy Chain Stomps (PopCat -> Doge -> GrumpyCat)
 * - T3.4: Simultaneous Ceiling Block Bump + Aerial Coin Collection Cascade
 * - T3.5: Audio Auto-Unlock on Gesture without exceptions
 * - T3.6: 10x Consecutive Victory Replay Reset Loops
 * - T3.7: Complete Death -> Pit Fall -> Restart -> Stomp Recovery Lifecycle
 */

import { strict as assert } from 'assert';

import '../js/assets.js';
import '../js/physics.js';
import '../js/input.js';
import '../js/audio.js';
import '../js/level.js';
import '../js/entities.js';
import '../js/game.js';

const Game = globalThis.Game;
const GameInput = globalThis.GameInput;
const GameAudio = globalThis.GameAudio;
const GameLevel = globalThis.GameLevel;
const GameEntities = globalThis.GameEntities;

console.log('===============================================================');
console.log('🧪 TIER 3: COMBINATION & INTERACTION TEST SUITE (V2)');
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

// T3.1: Multi-touch simultaneous Run (Right) + Jump button press
runTest('T3.1', 'Multi-touch simultaneous Run (Right) + Jump button press', () => {
  GameInput.reset();

  // Touch 1 on Right, Touch 2 on Jump
  GameInput.injectTouch(101, 'right');
  GameInput.injectTouch(102, 'jump');

  const stateBoth = GameInput.getState();
  assert(stateBoth.right === true && stateBoth.jump === true, 'Both Right and Jump active concurrently');

  // Release Jump
  GameInput.injectTouch(102, null);

  const stateRightOnly = GameInput.getState();
  assert(stateRightOnly.right === true && stateRightOnly.jump === false, 'Right remains active after Jump release');

  // Clean up
  GameInput.reset();
});

// T3.2: Touch button drag & multi-touch sliding
runTest('T3.2', 'Touch sliding between buttons with dynamic re-mapping', () => {
  GameInput.reset();

  // Touch starts on Left
  GameInput.injectTouch(201, 'left');
  assert(GameInput.getState().left === true, 'Touch on Left activates left');

  // Sliding to Right without lifting finger (same touch identifier 201)
  GameInput.injectTouch(201, 'right');
  assert(GameInput.getState().left === false && GameInput.getState().right === true, 'Re-targeted touch activates right');

  // Lift touch
  GameInput.injectTouch(201, null);
  assert(GameInput.getState().left === false && GameInput.getState().right === false, 'Releasing touch returns to idle');

  GameInput.reset();
});

// T3.3: Consecutive 3-Enemy Chain Stomps (PopCat -> Doge -> GrumpyCat)
runTest('T3.3', 'Consecutive 3-Enemy Chain Stomps (PopCat -> Doge -> GrumpyCat)', () => {
  const level = GameLevel.createLevel();
  let totalScore = 0;
  const spawnedTexts = [];

  const popcat = GameEntities.createPopCat(100, 192);
  const doge = GameEntities.createDoge(140, 192);
  const grumpy = GameEntities.createGrumpyCat(180, 192);

  const player = GameEntities.createPlayer(100, 180);
  player.vx = 150; // Moving right at speed
  player.vy = 200; // Falling onto popcat

  // Stomp 1: Pop Cat
  popcat.update(0.016, level, player, (x, y, type) => {
    totalScore += 100;
    spawnedTexts.push(type);
  });
  assert(popcat.isSquashed === true, 'PopCat squashed');
  assert(player.vy === -260, 'Rebound bounce on PopCat (-260 px/s)');
  assert(player.vx === 150, 'Horizontal momentum preserved through bounce 1');

  // Simulate mid-air flight to Doge
  player.x = 140;
  player.y = 180;
  player.vy = 200; // Falling again

  // Stomp 2: Doge
  doge.update(0.016, level, player, (x, y, type) => {
    totalScore += 100;
    spawnedTexts.push(type);
  });
  assert(doge.isSquashed === true, 'Doge squashed');
  assert(player.vy === -260, 'Rebound bounce on Doge (-260 px/s)');
  assert(player.vx === 150, 'Horizontal momentum preserved through bounce 2');

  // Simulate mid-air flight to Grumpy Cat
  player.x = 180;
  player.y = 180;
  player.vy = 200; // Falling again

  // Stomp 3: Grumpy Cat
  grumpy.update(0.016, level, player, (x, y, type) => {
    totalScore += 100;
    spawnedTexts.push(type);
  });
  assert(grumpy.isSquashed === true, 'Grumpy Cat squashed');
  assert(player.vy === -260, 'Rebound bounce on Grumpy Cat (-260 px/s)');

  assert(totalScore === 300, 'Total score increased by 300 points for 3 stomps');
  assert(spawnedTexts.length === 3, '3 stomp callbacks fired across all 3 meme enemy types');
});

// T3.4: Simultaneous Ceiling Block Bump + Aerial Coin Collection Cascade
runTest('T3.4', 'Simultaneous Ceiling Block Bump + Aerial Coin Collection Cascade', () => {
  const level = GameLevel.createLevel();
  let coinCollected = false;
  let blockHit = false;

  const player = GameEntities.createPlayer(8 * 16, 144 + 16);
  player.vy = -300; // Jumping up

  const coin = GameEntities.createCoin(8 * 16, 144 + 16);

  // Tick update: player hits ceiling block AND overlaps coin
  player.update(0.016, {}, level, (tx, ty) => {
    blockHit = true;
    level.bumpBlock(tx, ty);
  });
  coin.update(0.016, player, () => { coinCollected = true; });

  assert(blockHit === true, 'Ceiling block collision registered');
  assert(coinCollected === true, 'Coin collected simultaneously during ceiling collision');
  assert(player.vy === 0, 'Upward velocity cancelled by ceiling impact');
});

// T3.5: Audio Auto-Unlock on Gesture without exceptions
runTest('T3.5', 'Audio Auto-Unlock on Gesture without exceptions', () => {
  assert.doesNotThrow(() => {
    GameAudio.init();
    GameAudio.unlockAudio();
    GameAudio.playJump();
    GameAudio.playCoin();
    GameAudio.playStomp();
    GameAudio.playWin();
  }, 'Audio unlocks and plays without exceptions');
});

// T3.6: 10x Consecutive Victory Replay Reset Loops
runTest('T3.6', '10x Consecutive Victory Replay Reset Loops', () => {
  for (let cycle = 0; cycle < 10; cycle++) {
    Game.startNewGame();
    assert(Game.state === 'PLAYING', `Cycle ${cycle}: State is PLAYING initially`);

    // Simulate winning
    Game.score = 3000;
    Game.coins = 5;
    Game.handleFlagpole();

    // Advance 45 ticks for flag slide & victory
    for (let t = 0; t < 45; t++) {
      Game.update(0.05);
    }

    assert(Game.state === 'WIN', `Cycle ${cycle}: State transitioned to WIN`);
    assert(Game.modalRevealed === true, `Cycle ${cycle}: Victory modal revealed`);

    // Restart game
    Game.restart();

    assert(Game.state === 'PLAYING', `Cycle ${cycle}: Reset state to PLAYING`);
    assert(Game.score === 0, `Cycle ${cycle}: Score reset to 0`);
    assert(Game.coins === 0, `Cycle ${cycle}: Coins reset to 0`);
    assert(Game.lives === 3, `Cycle ${cycle}: Lives reset to 3`);
    assert(Game.modalRevealed === false, `Cycle ${cycle}: modalRevealed reset to false`);
    assert(Game.player.x === 40, `Cycle ${cycle}: Player reset to starting X (40)`);
    assert(Game.goombas.length > 0, `Cycle ${cycle}: Enemies respawned`);
    assert(Game.coinsList.length > 0, `Cycle ${cycle}: Coins respawned`);
  }
});

// T3.7: Complete Death -> Pit Fall -> Restart -> Stomp Recovery Lifecycle
runTest('T3.7', 'Complete Death -> Pit Fall -> Restart -> Stomp Recovery Lifecycle', () => {
  Game.startNewGame();

  // Position player over pit at col 34.5
  Game.player.x = 34.5 * 16;
  Game.player.y = 192;

  // Fall through pit
  for (let i = 0; i < 40; i++) {
    Game.update(0.016);
  }

  assert(Game.player.state === 'DEAD', 'Player died from pit fall');

  // Advance past death animation (2.0s) into GAMEOVER
  for (let i = 0; i < 150; i++) {
    Game.update(0.016);
  }
  assert(Game.state === 'GAMEOVER', 'Game entered GAMEOVER state');

  // Advance 1.2s in GAMEOVER and send touch input to restart
  Game.update(1.2);
  GameInput.injectTouch(1, 'jump');
  Game.update(0.016);
  GameInput.injectTouch(1, null);
  GameInput.reset();

  assert(Game.state === 'PLAYING', 'Game restarted into PLAYING state');
  assert(Game.player.isAlive === true, 'Player revived');
  assert(Game.player.x === 40, 'Player reset to starting line');

  // Stomp an enemy in the fresh run
  const targetEnemy = Game.goombas[0];
  if (targetEnemy) {
    Game.player.x = targetEnemy.x;
    Game.player.y = targetEnemy.y - 12;
    Game.player.vy = 200;

    Game.update(0.016);
    assert(targetEnemy.isSquashed === true, 'Enemy squashed after game recovery');
  }
});

console.log('\n===============================================================');
console.log(`📊 TIER 3 COMBOS SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');
