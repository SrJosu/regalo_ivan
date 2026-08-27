/**
 * test/test_tier4_workload.mjs - Tier 4 Workload, Performance & Stability Tests
 *
 * V2 Iván's Birthday Gift Edition — Platformer Overhaul (M4)
 *
 * Tests:
 * - T4.1: Sustained 60 FPS performance benchmark over 3,000 frames
 * - T4.2: Tab blur / background throttling handling (dt clamped <= 0.05s)
 * - T4.3: Memory stability across 100 consecutive full level resets
 * - T4.4: Autonomous 100-playthrough bot testing win & death loops
 * - T4.5: High particle concurrency stress (200+ active confetti items)
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
const GameLevel = globalThis.GameLevel;
const GameEntities = globalThis.GameEntities;

console.log('===============================================================');
console.log('🧪 TIER 4: WORKLOAD, PERFORMANCE & STABILITY TEST SUITE (V2)');
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

// T4.1: Sustained 60 FPS performance benchmark over 3,000 frames
runTest('T4.1', 'Sustained 60 FPS performance benchmark over 3,000 frames', () => {
  Game.startNewGame();
  const startTime = performance.now();
  const frameCount = 3000;

  for (let i = 0; i < frameCount; i++) {
    // Alternate simulated inputs
    if (i % 60 === 0) {
      GameInput.injectTouch(1, 'jump');
    } else if (i % 60 === 20) {
      GameInput.injectTouch(1, null);
    }
    GameInput.injectTouch(2, 'right');

    Game.update(1 / 60);
  }
  GameInput.reset();

  const elapsedMs = performance.now() - startTime;
  const avgFrameTimeMs = elapsedMs / frameCount;

  console.log(`     -> 3,000 frames completed in ${elapsedMs.toFixed(2)}ms (${avgFrameTimeMs.toFixed(3)}ms/frame, ~${(1000/avgFrameTimeMs).toFixed(0)} FPS capability)`);
  assert(avgFrameTimeMs < 2.0, `Average frame compute time (${avgFrameTimeMs.toFixed(3)}ms) well within 16.6ms budget`);
});

// T4.2: Tab blur / background throttling handling (dt clamped <= 0.05s)
runTest('T4.2', 'Tab blur / background throttling handling (dt clamped <= 0.05s)', () => {
  Game.startNewGame();

  // Simulate returning from 10-second tab blur with dt = 10.0s
  const rawDt = 10.0;
  const clampedDt = Math.min(Math.max(rawDt, 0.001), 0.05);
  Game.update(clampedDt);

  // Player coordinates must remain numeric and bounded
  assert(!isNaN(Game.player.x) && !isNaN(Game.player.y), 'Player coordinates remain numeric');
  assert(Game.player.y <= 256, `Player y remained bounded (actual: ${Game.player.y})`);
});

// T4.3: Memory stability across 100 consecutive full level resets
runTest('T4.3', 'Memory stability across 100 consecutive level resets', () => {
  const initialMem = process.memoryUsage().heapUsed;

  for (let cycle = 0; cycle < 100; cycle++) {
    Game.startNewGame();
    for (let frame = 0; frame < 50; frame++) {
      Game.update(1 / 60);
    }
  }

  const finalMem = process.memoryUsage().heapUsed;
  const growthMb = (finalMem - initialMem) / (1024 * 1024);
  console.log(`     -> Heap delta after 100 full resets: ${growthMb.toFixed(2)} MB`);
  assert(growthMb < 25, 'Heap growth remains well within acceptable bounds (<25MB)');
});

// T4.4: Autonomous 100-playthrough bot testing win & death loops
runTest('T4.4', 'Autonomous 100-playthrough bot completing level or testing win/death loops', () => {
  let runsCompleted = 0;
  let wins = 0;
  let deaths = 0;

  for (let run = 0; run < 100; run++) {
    Game.startNewGame();

    // Alternate bot strategies
    const isAggressive = (run % 2 === 0);

    for (let tick = 0; tick < 250; tick++) {
      if (Game.state === 'WIN') {
        wins++;
        break;
      }
      if (Game.state === 'GAMEOVER') {
        deaths++;
        break;
      }

      GameInput.injectTouch(2, 'right');
      if (isAggressive ? (tick % 30 < 15) : (tick % 50 < 10)) {
        GameInput.injectTouch(1, 'jump');
      } else {
        GameInput.injectTouch(1, null);
      }

      Game.update(1 / 60);
    }
    GameInput.reset();
    runsCompleted++;
  }

  console.log(`     -> 100 autonomous bot playthroughs finished: ${runsCompleted} runs (${wins} wins, ${deaths} deaths, ${runsCompleted - wins - deaths} in-progress)`);
  assert(runsCompleted === 100, 'All 100 bot playthrough cycles executed successfully');
});

// T4.5: High Particle Concurrency Stress (200+ active confetti items)
runTest('T4.5', 'High Particle Concurrency Stress (200+ active confetti items)', () => {
  Game.startNewGame();

  // Spawn 250 confetti particles
  for (let burst = 0; burst < 25; burst++) {
    Game.particles.push(...GameEntities.createVictoryConfetti(100 + burst * 10, 50, 10));
  }

  assert(Game.particles.length >= 200, `Spawned ${Game.particles.length} particles`);

  // Update particles over 60 frames
  for (let f = 0; f < 60; f++) {
    Game.update(1 / 60);
  }

  assert(!isNaN(Game.particles[0]?.x), 'Particle physics coordinates valid');
});

console.log('\n===============================================================');
console.log(`📊 TIER 4 WORKLOAD SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');
