/**
 * test/verify_m3_gameplay.mjs - Comprehensive Milestone 3 Verification Suite
 *
 * Verifies:
 * 1. Web Audio API sound synthesis engine (js/audio.js)
 * 2. Level map, tile collisions, camera tracking, interactive blocks (js/level.js)
 * 3. Player state machine, Goomba AI patrol & stomp squash, Collectibles (js/entities.js)
 * 4. Main game loop, state manager, HUD synchronization, restart mechanism (js/game.js)
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==================================================');
console.log('🎮 MILESTONE 3: LEVEL, ENTITIES & GAME LOOP TEST');
console.log('==================================================\n');

let totalTests = 0;
let passedTests = 0;

function runSection(title, fn) {
  console.log(`==================================================`);
  console.log(`🔷 ${title}`);
  console.log(`==================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`\n❌ Section Error: ${err.message}\n`, err.stack);
    process.exit(1);
  }
  console.log('');
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} — ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Load modules in Node environment
// -----------------------------------------------------------------------------
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

// =============================================================================
// SECTION 1: Audio Engine Verification (js/audio.js)
// =============================================================================
runSection('1. Web Audio Engine (js/audio.js)', () => {
  test('GameAudio exports all required sound methods', () => {
    assert(typeof GameAudio.init === 'function', 'init must be a function');
    assert(typeof GameAudio.playJump === 'function', 'playJump must be a function');
    assert(typeof GameAudio.playCoin === 'function', 'playCoin must be a function');
    assert(typeof GameAudio.playStomp === 'function', 'playStomp must be a function');
    assert(typeof GameAudio.playBump === 'function', 'playBump must be a function');
    assert(typeof GameAudio.playDeath === 'function', 'playDeath must be a function');
    assert(typeof GameAudio.playWin === 'function', 'playWin must be a function');
  });

  test('Calling sound methods in headless environment does not throw or crash', () => {
    assert.doesNotThrow(() => {
      GameAudio.init();
      GameAudio.unlockAudio();
      GameAudio.playJump();
      GameAudio.playCoin();
      GameAudio.playStomp();
      GameAudio.playBump();
      GameAudio.playDeath();
      GameAudio.playWin();
    }, 'All audio calls must be safe under headless environments');
  });
});

// =============================================================================
// SECTION 2: Level Map & Camera System Verification (js/level.js)
// =============================================================================
runSection('2. Level Map & Camera System (js/level.js)', () => {
  const level = GameLevel.createLevel();

  test('Level instance initializes with authentic World 1-1 layout', () => {
    assert(level.WIDTH >= 120, 'Level width must be at least 120 tiles');
    assert(level.HEIGHT === 16, 'Level height must be 16 tiles');
    assert(level.GROUND_ROW === 13, 'Ground floor row must be row 13');
    assert(level.flagpole !== null, 'Flagpole coordinates must be defined');
    assert(level.castleDoorX > level.flagpole.x, 'Castle must be positioned past flagpole');
  });

  test('Solid tiles report solid for physics resolution', () => {
    assert(level.isSolid(5, level.GROUND_ROW) === true, 'Ground tile at x=5 must be solid');
    assert(level.isSolid(5, level.GROUND_ROW + 1) === true, 'Underground filler must be solid');
    assert(level.isSolid(18, level.GROUND_ROW - 2) === true, 'Pipe top-left must be solid');
    assert(level.isSolid(19, level.GROUND_ROW - 2) === true, 'Pipe top-right must be solid');
    assert(level.isSolid(8, 9) === true, 'Question block at (8, 9) must be solid');
    assert(level.isSolid(10, 9) === true, 'Brick block at (10, 9) must be solid');
  });

  test('Pit hazard areas are non-solid empty air down to abyss', () => {
    // Pit at col 34, 35
    assert(level.isSolid(34, level.GROUND_ROW) === false, 'Pit column 34 must not have solid floor');
    assert(level.isSolid(35, level.GROUND_ROW) === false, 'Pit column 35 must not have solid floor');
    assert(level.isSolid(34, 15) === false, 'Pit bottom must be empty air');
  });

  test('Hitting a question block transforms it to empty block and awards coin', () => {
    assert(level.getTile(8, 9) === 'question', 'Tile (8,9) starts as question block');
    const result = level.bumpBlock(8, 9);
    assert(result !== null, 'bumpBlock returns result object');
    assert(result.type === 'question', 'Block type was question');
    assert(result.transformed === true, 'Block transformed');
    assert(result.coinEarned === true, 'Coin earned from question block');
    assert(level.getTile(8, 9) === 'empty', 'Tile transformed into empty block');
    assert(level.isSolid(8, 9) === true, 'Empty block remains solid');
  });

  test('Hitting a brick block plays bump without transforming', () => {
    assert(level.getTile(10, 9) === 'brick', 'Tile (10,9) starts as brick');
    const result = level.bumpBlock(10, 9);
    assert(result.type === 'brick', 'Block type is brick');
    assert(result.transformed === false, 'Brick is not transformed');
    assert(level.getTile(10, 9) === 'brick', 'Tile remains brick');
  });

  test('Camera tracking adheres to Mario left-lock rule', () => {
    level.cameraX = 0;
    // Player moves right
    level.updateCamera(300, 180);
    const scrolledCam = level.cameraX;
    assert(scrolledCam > 0, 'Camera scrolls right when player moves right');

    // Player moves left
    level.updateCamera(100, 180);
    assert(level.cameraX === scrolledCam, 'Camera does NOT scroll backwards left');
  });
});

// =============================================================================
// SECTION 3: Entities & State Machine Verification (js/entities.js)
// =============================================================================
runSection('3. Player, Goomba & Collectibles (js/entities.js)', () => {
  const level = GameLevel.createLevel();

  test('Player state transitions correctly (IDLE -> WALK -> RUN -> JUMP -> SKID)', () => {
    const player = GameEntities.createPlayer(40, (level.GROUND_ROW * 16) - 16);
    assert(player.state === 'IDLE', 'Initial state is IDLE');

    // Walking right
    player.update(0.016, { right: true }, level);
    assert(player.state === 'WALK' || player.state === 'RUN', 'State becomes WALK/RUN when moving');
    assert(player.facing === 1, 'Facing right');

    // Jumping
    player.update(0.016, { right: true, jump: true, jumpJustPressed: true }, level);
    assert(player.state === 'JUMP', 'State becomes JUMP when rising in air');

    // Skidding: Moving fast right on ground and pressing Left
    player.y = (level.GROUND_ROW * 16) - 16;
    player.vy = 0;
    player.vx = 200;
    player.onGround = true;
    player.isJumping = false;
    player.update(0.016, { left: true }, level);
    assert(player.isSkidding === true, 'Player is skidding');
    assert(player.state === 'SKID', 'State becomes SKID');
  });

  test('Goomba patrols and reverses direction on obstacle impact', () => {
    // Spawn Goomba next to pipe at tx=18 (x=288) with 1px gap
    const goomba = GameEntities.createGoomba(18 * 16 - 17, (level.GROUND_ROW * 16) - 16);
    goomba.vx = 40; // Moving into pipe
    goomba.onGround = true;

    // Tick forward to hit pipe
    goomba.update(0.05, level, null);
    assert(goomba.vx < 0, 'Goomba reversed horizontal velocity upon hitting pipe');
  });

  test('Goomba squash mechanic on top stomp', () => {
    let stomped = false;
    const goomba = GameEntities.createGoomba(100, 192);
    const player = GameEntities.createPlayer(100, 180);
    player.vy = 150; // Falling down onto goomba

    goomba.update(0.016, level, player, () => { stomped = true; });

    assert(goomba.isSquashed === true, 'Goomba is squashed upon top stomp');
    assert(stomped === true, 'onStomp callback executed');
    assert(player.vy < 0, 'Player rebounded upward from stomp');
  });

  test('Goomba hazard kills player on side collision', () => {
    let killedPlayer = false;
    const goomba = GameEntities.createGoomba(100, 192);
    const player = GameEntities.createPlayer(96, 192);
    player.vy = 0; // Walking into goomba horizontally

    goomba.update(0.016, level, player, null, () => { killedPlayer = true; });
    assert(killedPlayer === true, 'Player killed when colliding with Goomba side');
  });

  test('Collectible Coin triggers collection callback and disappears', () => {
    let collected = false;
    const coin = GameEntities.createCoin(100, 192);
    const player = GameEntities.createPlayer(100, 192);

    coin.update(0.016, player, () => { collected = true; });
    assert(collected === true, 'Coin collected on player overlap');
    assert(coin.isAlive === false, 'Coin marked dead after collection');
  });

  test('Flagpole contact initiates FLAG_SLIDE and transition to VICTORY_WALK', () => {
    const player = GameEntities.createPlayer(level.flagpole.x - 4, level.flagpole.topY + 32);
    let flagpoleReached = false;

    player.update(0.016, {}, level, null, () => { flagpoleReached = true; });
    assert(flagpoleReached === true, 'Flagpole reached event triggered');
    assert(player.state === 'FLAG_SLIDE', 'Player entered FLAG_SLIDE state');

    // Slide down to bottom
    for (let i = 0; i < 60; i++) {
      player.update(0.05, {}, level);
    }
    assert(player.state === 'VICTORY_WALK' || player.state === 'IDLE', 'Player transitioned to VICTORY_WALK/IDLE');
  });
});

// =============================================================================
// SECTION 4: Game Manager & State Machine Verification (js/game.js)
// =============================================================================
runSection('4. Game Loop & State Manager (js/game.js)', () => {
  test('Game initializes subsystems and starts in PLAYING state', async () => {
    await Game.init();
    assert(Game.state === 'PLAYING', 'Game enters PLAYING state after init');
    assert(Game.level !== null, 'Level is initialized');
    assert(Game.player !== null, 'Player is initialized');
    assert(Game.goombas.length > 0, 'Goombas spawned in world');
    assert(Game.coinsList.length > 0, 'Collectible coins spawned in world');
  });

  test('Scoring and coin pickups update statistics properly', () => {
    const initScore = Game.score;
    const initCoins = Game.coins;

    Game.addCoin(100, 100);
    assert(Game.coins === initCoins + 1, 'Coins count increased by 1');
    assert(Game.score === initScore + 200, 'Score increased by 200');
  });

  test('Game updates without throwing errors over multiple frames', () => {
    assert.doesNotThrow(() => {
      for (let i = 0; i < 60; i++) {
        Game.update(1 / 60);
      }
    }, '60 frames of Game.update execute without error');
  });

  test('Restarting game resets stats and re-populates level', () => {
    Game.startNewGame();
    assert(Game.time === 400, 'Time reset to 400');
    assert(Game.player.x === 40, 'Player reset to starting position');
    assert(Game.player.state === 'IDLE', 'Player reset to IDLE');
    assert(Game.state === 'PLAYING', 'Game in PLAYING state');
  });
});

console.log('==================================================');
console.log(`📊 M3 Gameplay Verification Summary:`);
console.log(`   Passed: ${passedTests}`);
console.log(`   Failed: ${totalTests - passedTests}`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL MILESTONE 3 GAMEPLAY TESTS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}
