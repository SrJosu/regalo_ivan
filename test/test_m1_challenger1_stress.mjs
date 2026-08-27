/**
 * test/test_m1_challenger1_stress.mjs
 *
 * Empirical Challenger 1 Deep Stress Harness
 * Pushing GameAssets API to extreme edge conditions.
 */

import { createRequire } from 'module';
import { performance } from 'perf_hooks';

const require = createRequire(import.meta.url);
const GameAssets = require('../js/assets.js');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [PASS] ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failedChecks++;
    failures.push({ testName, details });
    console.error(`  ❌ [FAIL] ${testName}: ${details}`);
  }
}

async function runChallengerStressSuite() {
  console.log('================================================================');
  console.log('   CHALLENGER 1 EMPIRICAL DEEP STRESS HARNESS: MILESTONE 1     ');
  console.log('================================================================\n');

  // 1. CONCURRENT INIT STRESS
  console.log('--- 1. Concurrent & Idempotent Init Stress ---');
  const initPromises = Array.from({ length: 50 }, () => GameAssets.init());
  await Promise.all(initPromises);
  assert(GameAssets.isReady === true, 'Concurrent 50x GameAssets.init() succeeds and sets isReady=true');

  // 2. PALETTE & MATRIX COMPLETENESS VERIFICATION
  console.log('\n--- 2. Palette Character Integrity ---');
  let missingChars = 0;
  for (const [catName, sprites] of Object.entries(GameAssets.RAW_SPRITES)) {
    for (const [sprName, sprDef] of Object.entries(sprites)) {
      const palette = GameAssets.PALETTES[sprDef.palette];
      assert(!!palette, `Palette exists for [${catName}][${sprName}]`, `palette '${sprDef.palette}'`);
      for (let r = 0; r < sprDef.data.length; r++) {
        const row = sprDef.data[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch !== '.' && !palette[ch]) {
            missingChars++;
            assert(false, `Missing character definition in palette`, `char '${ch}' at row ${r}, col ${c} in [${catName}][${sprName}]`);
          }
        }
      }
    }
  }
  assert(missingChars === 0, 'Zero undefined character codes in any sprite matrix');

  // 3. CATEGORY ALIASES & CONTEXTUAL MEME RESOLUTION MATRIX
  console.log('\n--- 3. Full Category & Meme Alias Resolution Matrix ---');
  const aliasMatrix = [
    // Mario / Ivan aliases
    { cat: 'mario', name: 'idle', expectedCat: 'player', expectedName: 'idle' },
    { cat: 'ivan', name: 'idle', expectedCat: 'player', expectedName: 'idle' },
    { cat: 'super_ivan', name: 'jump', expectedCat: 'player', expectedName: 'jump' },
    { cat: 'hero', name: 'run_1', expectedCat: 'player', expectedName: 'run_1' },
    { cat: 'player', name: 'walk_1', expectedCat: 'player', expectedName: 'run_1' },
    { cat: 'player', name: 'walk_2', expectedCat: 'player', expectedName: 'run_2' },
    { cat: 'player', name: 'walk_3', expectedCat: 'player', expectedName: 'run_3' },
    { cat: 'player', name: 'dead', expectedCat: 'player', expectedName: 'die' },

    // Goomba / Pop Cat aliases
    { cat: 'enemy', name: 'walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'goomba', name: 'walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'goomba', name: 'goomba_walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'goomba', name: 'goomba_walk_2', expectedCat: 'enemy', expectedName: 'walk_2' },
    { cat: 'goomba', name: 'squashed', expectedCat: 'enemy', expectedName: 'squash' },
    { cat: 'popcat', name: 'walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'popcat', name: 'walk_2', expectedCat: 'enemy', expectedName: 'walk_2' },
    { cat: 'popcat', name: 'squash', expectedCat: 'enemy', expectedName: 'squash' },

    // Doge contextual aliases
    { cat: 'doge', name: 'walk_1', expectedCat: 'enemy', expectedName: 'doge_walk_1' },
    { cat: 'doge', name: 'walk_2', expectedCat: 'enemy', expectedName: 'doge_walk_2' },
    { cat: 'doge', name: 'squashed', expectedCat: 'enemy', expectedName: 'doge_squash' },

    // Grumpy Cat contextual aliases
    { cat: 'grumpy', name: 'walk_1', expectedCat: 'enemy', expectedName: 'grumpy_walk_1' },
    { cat: 'grumpy', name: 'walk_2', expectedCat: 'enemy', expectedName: 'grumpy_walk_2' },
    { cat: 'grumpy', name: 'squash', expectedCat: 'enemy', expectedName: 'grumpy_squash' },
    { cat: 'grumpycat', name: 'walk1', expectedCat: 'enemy', expectedName: 'grumpy_walk_1' },

    // Items & Cake aliases
    { cat: 'coin', name: 'coin_1', expectedCat: 'item', expectedName: 'coin_1' },
    { cat: 'coins', name: 'coin_2', expectedCat: 'item', expectedName: 'coin_2' },
    { cat: 'item', name: 'gold_coin', expectedCat: 'item', expectedName: 'coin_1' },
    { cat: 'cake', name: 'cake', expectedCat: 'item', expectedName: 'cake' },
    { cat: 'cake', name: 'birthday_cake', expectedCat: 'item', expectedName: 'cake' },
    { cat: 'item', name: 'cake_slice', expectedCat: 'item', expectedName: 'cake' },
    { cat: 'collectibles', name: 'coin3', expectedCat: 'item', expectedName: 'coin_3' },

    // Environment & Tile aliases
    { cat: 'tiles', name: 'ground', expectedCat: 'tile', expectedName: 'ground' },
    { cat: 'environment', name: 'brick', expectedCat: 'tile', expectedName: 'brick' },
    { cat: 'tile', name: 'dirt', expectedCat: 'tile', expectedName: 'ground_filler' },
    { cat: 'tile', name: 'question_empty', expectedCat: 'tile', expectedName: 'empty' },
    { cat: 'tile', name: 'empty_block', expectedCat: 'tile', expectedName: 'empty' },
    { cat: 'tile', name: 'pole_top', expectedCat: 'tile', expectedName: 'flagpole_top' },
    { cat: 'tile', name: 'pole_shaft', expectedCat: 'tile', expectedName: 'flagpole_shaft' },
    { cat: 'tile', name: 'flag_cloth', expectedCat: 'tile', expectedName: 'flag' },
    { cat: 'tile', name: 'castle', expectedCat: 'tile', expectedName: 'castle_brick' },
    { cat: 'tile', name: 'door', expectedCat: 'tile', expectedName: 'castle_door' }
  ];

  for (const t of aliasMatrix) {
    const aliased = GameAssets.getSprite(t.cat, t.name);
    const target = GameAssets.getSprite(t.expectedCat, t.expectedName);
    assert(aliased !== null && aliased !== undefined, `Alias [${t.cat}][${t.name}] returns valid sprite`);
    assert(aliased === target, `Alias [${t.cat}][${t.name}] matches canonical [${t.expectedCat}][${t.expectedName}]`);
  }

  // 4. ADVERSARIAL FALLBACKS & NULL/UNDEFINED SAFETY
  console.log('\n--- 4. Adversarial Fallbacks & Invalid Inputs ---');
  const badInputs = [
    [null, null],
    [undefined, undefined],
    [null, 'idle'],
    ['player', null],
    ['', ''],
    ['non_existent_category_999', 'non_existent_sprite_999'],
    [{}, {}],
    [123, 456],
    ['player', 'non_existent_sprite'],
    ['unknown_category', 'idle']
  ];

  for (const [cat, name] of badInputs) {
    const spr = GameAssets.getSprite(cat, name);
    assert(spr !== null && spr !== undefined, `getSprite(${JSON.stringify(cat)}, ${JSON.stringify(name)}) returns fallback without crash`);
    assert(spr.width === 16 && spr.height === 16, `getSprite(${JSON.stringify(cat)}, ${JSON.stringify(name)}) has 16x16 dimensions`);
  }

  // 5. DRAWSPRITE EXTREME VALUES STRESS TEST (NaN, Infinity, Negatives, Null context)
  console.log('\n--- 5. drawSprite Adversarial Parameter Stress ---');
  const testCanvas = GameAssets.createCanvas(100, 100);
  const testCtx = testCanvas.getContext('2d');

  const adversarialDrawCalls = [
    { label: 'Negative coordinates (-100, -200)', x: -100, y: -200, w: 16, h: 16, flip: false },
    { label: 'Extreme large coords (1e7, 1e7)', x: 1e7, y: 1e7, w: 16, h: 16, flip: false },
    { label: 'Zero dimensions (0x0)', x: 10, y: 10, w: 0, h: 0, flip: false },
    { label: 'Negative dimensions (-16x-16)', x: 10, y: 10, w: -16, h: -16, flip: false },
    { label: 'Sub-pixel float coords (10.333, 20.777)', x: 10.333, y: 20.777, w: 16, h: 16, flip: false },
    { label: 'Fractional dimensions (0.5x0.5)', x: 10, y: 10, w: 0.5, h: 0.5, flip: false },
    { label: 'Huge dimensions (2000x2000)', x: 0, y: 0, w: 2000, h: 2000, flip: false },
    { label: 'Flipped with negative coords (-50, -50)', x: -50, y: -50, w: 16, h: 16, flip: true },
    { label: 'Flipped non-cached tile with out-of-bounds', x: 200, y: 200, w: 32, h: 32, flip: true },
    { label: 'Null context', ctx: null, x: 0, y: 0, w: 16, h: 16, flip: false },
    { label: 'Undefined context', ctx: undefined, x: 0, y: 0, w: 16, h: 16, flip: false },
    { label: 'Corrupt context without drawImage', ctx: {}, x: 0, y: 0, w: 16, h: 16, flip: false },
    { label: 'String context', ctx: 'not a context', x: 0, y: 0, w: 16, h: 16, flip: false }
  ];

  for (const call of adversarialDrawCalls) {
    const ctx = (call.ctx !== undefined) ? call.ctx : testCtx;
    try {
      GameAssets.drawSprite(ctx, 'player', 'idle', call.x, call.y, call.w, call.h, call.flip);
      assert(true, `drawSprite handles ${call.label}`);
    } catch (err) {
      assert(false, `drawSprite handles ${call.label}`, `Threw error: ${err.message}`);
    }
  }

  // Extreme Floats & NaN Handling check
  const specialNumbers = [
    { x: NaN, y: 0, w: 16, h: 16 },
    { x: 0, y: NaN, w: 16, h: 16 },
    { x: 1e6, y: 1e6, w: 16, h: 16 },
    { x: -1e6, y: -1e6, w: 16, h: 16 },
    { x: 0, y: 0, w: 0.001, h: 0.001 }
  ];
  for (const sn of specialNumbers) {
    try {
      GameAssets.drawSprite(testCtx, 'player', 'idle', sn.x, sn.y, sn.w, sn.h, false);
      assert(true, `drawSprite handles special floats (${sn.x}, ${sn.y}, ${sn.w}, ${sn.h}) without crash`);
    } catch (err) {
      assert(false, `drawSprite handles special floats (${sn.x}, ${sn.y}, ${sn.w}, ${sn.h})`, err.message);
    }
  }

  // 6. EXTREME HIGH-LOAD THROUGHPUT STRESS (200,000+ DRAWS)
  console.log('\n--- 6. Extreme High-Load Stress: 200,000 Draws ---');
  const stressCanvas = GameAssets.createCanvas(360, 800);
  const stressCtx = stressCanvas.getContext('2d');
  const TOTAL_STRESS_DRAWS = 200000;

  const startStress = performance.now();
  for (let i = 0; i < TOTAL_STRESS_DRAWS; i++) {
    const isFlipped = (i % 2 === 0);
    const cat = (i % 4 === 0) ? 'player' : (i % 4 === 1) ? 'enemy' : (i % 4 === 2) ? 'item' : 'tile';
    const name = (i % 4 === 0) ? 'idle' : (i % 4 === 1) ? 'walk_1' : (i % 4 === 2) ? 'coin_1' : 'ground';
    const x = (i * 7) % 360;
    const y = (i * 13) % 800;
    GameAssets.drawSprite(stressCtx, cat, name, x, y, 16, 16, isFlipped);
  }
  const elapsedStressMs = performance.now() - startStress;
  const stressOpsPerSec = TOTAL_STRESS_DRAWS / (elapsedStressMs / 1000);

  console.log(`  [STRESS RESULT] 200,000 mixed drawSprite calls in ${elapsedStressMs.toFixed(2)} ms -> ${stressOpsPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })} draws/sec`);
  assert(stressOpsPerSec >= 100000, `High-load throughput (200k draws) exceeds 100k/sec benchmark`, `${stressOpsPerSec.toFixed(0)} draws/sec`);

  // 7. MEMORY CANVAS / BUFFER CLIPPING INTEGRITY
  console.log('\n--- 7. MemoryCanvas Boundary Clipping Integrity ---');
  const clipCanvas = GameAssets.createCanvas(32, 32);
  const clipCtx = clipCanvas.getContext('2d');
  // Draw player partially offscreen at (-8, -8)
  clipCtx.clearRect(0, 0, 32, 32);
  GameAssets.drawSprite(clipCtx, 'player', 'idle', -8, -8, 16, 16, false);
  const imgData = clipCtx.getImageData(0, 0, 32, 32);
  let visiblePixels = 0;
  for (let i = 3; i < imgData.data.length; i += 4) {
    if (imgData.data[i] > 0) visiblePixels++;
  }
  assert(visiblePixels > 0 && visiblePixels < 111, `Offscreen sub-rectangle clipping works properly (rendered ${visiblePixels}/111 pixels in bounds)`);

  // 8. SUMMARY
  console.log('\n================================================================');
  console.log(`   CHALLENGER 1 STRESS TEST RESULTS:`);
  console.log(`   - Total Checks: ${totalChecks}`);
  console.log(`   - Passed Checks: ${passedChecks}`);
  console.log(`   - Failed Checks: ${failedChecks}`);
  console.log('================================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runChallengerStressSuite().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
