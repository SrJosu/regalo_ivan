/**
 * test/verify_m1_assets.mjs - Automated Verification Suite for Milestone 1
 *
 * Verifies:
 * 1. Asset pipeline initialization and isReady lifecycle.
 * 2. Complete catalog of 16x16 pixel art sprites (Player, Enemies, Items, Tiles).
 * 3. Pre-flipped horizontal mirror cache generation.
 * 4. Genuine pixel data non-emptiness and multi-color variance.
 * 5. Category and sprite name alias resolution.
 * 6. Fallback sprite safety (no null / undefined returns).
 * 7. drawSprite() execution in normal, flipped, and scaled modes.
 *
 * Zero external npm dependencies. Runs directly with Node.js.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const GameAssets = require('../js/assets.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedTests++;
  }
}

function getPixelAt(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(x, y, 1, 1);
  return [imgData.data[0], imgData.data[1], imgData.data[2], imgData.data[3]];
}

function analyzeCanvasPixels(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colorCounts = new Map();
  let opaqueCount = 0;

  for (let i = 0; i < imgData.data.length; i += 4) {
    const r = imgData.data[i];
    const g = imgData.data[i + 1];
    const b = imgData.data[i + 2];
    const a = imgData.data[i + 3];

    if (a > 0) {
      opaqueCount++;
      const key = `${r},${g},${b},${a}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }
  }

  return {
    width: canvas.width,
    height: canvas.height,
    opaqueCount,
    uniqueColors: colorCounts.size,
    colorDistribution: Object.fromEntries(colorCounts)
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('  MILESTONE 1 VERIFICATION: ASSET PIPELINE & SPRITES ');
  console.log('====================================================\n');

  // --- TEST GROUP 1: INITIALIZATION & LIFECYCLE ---
  console.log('--- Test Group 1: Initialization & Readiness ---');
  assert(GameAssets.isReady === false, 'GameAssets.isReady is false before init()');
  
  const initPromise = GameAssets.init();
  assert(initPromise instanceof Promise, 'GameAssets.init() returns a Promise');
  await initPromise;
  
  assert(GameAssets.isReady === true, 'GameAssets.isReady is true after init() resolves');

  // Test idempotency
  await GameAssets.init();
  assert(GameAssets.isReady === true, 'Subsequent init() calls are safe and idempotent');

  // --- TEST GROUP 2: REQUIRED SPRITES CATALOG ---
  console.log('\n--- Test Group 2: Sprite Catalog & Dimensions (16x16) ---');

  const EXPECTED_SPRITES = {
    player: ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag', 'die'],
    enemy: ['walk_1', 'walk_2', 'squash'],
    item: ['coin_1', 'coin_2', 'coin_3', 'coin_4'],
    tile: [
      'ground', 'ground_filler', 'brick',
      'question_1', 'question_2', 'question_3', 'empty',
      'pipe_tl', 'pipe_tr', 'pipe_bl', 'pipe_br',
      'flag', 'flagpole_top', 'flagpole_shaft',
      'castle_brick', 'castle_door'
    ]
  };

  for (const [category, names] of Object.entries(EXPECTED_SPRITES)) {
    for (const name of names) {
      const sprite = GameAssets.getSprite(category, name);
      assert(sprite !== null && sprite !== undefined, `Sprite [${category}][${name}] exists`);
      assert(sprite.width === 16 && sprite.height === 16, `Sprite [${category}][${name}] is exactly 16x16`);
    }
  }

  // --- TEST GROUP 3: PIXEL INTEGRITY & COLOR VARIANCE ---
  console.log('\n--- Test Group 3: Pixel Data Non-Emptiness & Multi-Color Variance ---');

  for (const [category, names] of Object.entries(EXPECTED_SPRITES)) {
    for (const name of names) {
      const sprite = GameAssets.getSprite(category, name);
      const analysis = analyzeCanvasPixels(sprite);

      assert(analysis.opaqueCount > 10, `Sprite [${category}][${name}] has non-empty pixel data (${analysis.opaqueCount} visible pixels)`);
      assert(analysis.uniqueColors >= 2, `Sprite [${category}][${name}] has multi-color palette variance (${analysis.uniqueColors} unique colors)`);
    }
  }

  // Specifically check Mario has his signature multi-color palette (Red, Skin, Blue, Brown/Yellow)
  const marioIdleAnalysis = analyzeCanvasPixels(GameAssets.getSprite('player', 'idle'));
  assert(marioIdleAnalysis.uniqueColors >= 4, `Mario idle has at least 4 distinct palette colors (found ${marioIdleAnalysis.uniqueColors})`);

  // Specifically check Goomba has multi-color palette (Tan, Dark Brown, White/Black)
  const goombaAnalysis = analyzeCanvasPixels(GameAssets.getSprite('enemy', 'walk_1'));
  assert(goombaAnalysis.uniqueColors >= 3, `Goomba walk_1 has at least 3 distinct palette colors (found ${goombaAnalysis.uniqueColors})`);

  // Specifically check Question block has gold + white + black
  const qBlockAnalysis = analyzeCanvasPixels(GameAssets.getSprite('tile', 'question_1'));
  assert(qBlockAnalysis.uniqueColors >= 3, `Question block has at least 3 distinct palette colors (found ${qBlockAnalysis.uniqueColors})`);

  // --- TEST GROUP 4: PRE-FLIPPED MIRROR CACHE ---
  console.log('\n--- Test Group 4: Pre-Flipped Mirror Caching ---');

  const FLIPPABLE_PLAYER_SPRITES = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag'];
  for (const name of FLIPPABLE_PLAYER_SPRITES) {
    const normalSprite = GameAssets.getSprite('player', name);
    const flippedSprite = GameAssets.getSprite('player', name + '_flip');

    assert(flippedSprite !== null && flippedSprite !== undefined, `Flipped sprite [player][${name}_flip] exists`);
    assert(flippedSprite.width === 16 && flippedSprite.height === 16, `Flipped sprite [player][${name}_flip] is 16x16`);

    // Verify horizontal mirror symmetry: column c in normal matches column 15-c in flipped
    let matchesFound = 0;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pNorm = getPixelAt(normalSprite, x, y);
        const pFlip = getPixelAt(flippedSprite, 15 - x, y);
        if (pNorm[0] === pFlip[0] && pNorm[1] === pFlip[1] && pNorm[2] === pFlip[2] && pNorm[3] === pFlip[3]) {
          matchesFound++;
        }
      }
    }
    assert(matchesFound === 256, `Flipped sprite [player][${name}_flip] is exact mathematical horizontal mirror`);
  }

  // --- TEST GROUP 5: ALIASING & RESILIENCE ---
  console.log('\n--- Test Group 5: Category & Sprite Name Aliasing ---');

  const ALIAS_TESTS = [
    { cat: 'mario', name: 'idle', expectedCat: 'player', expectedName: 'idle' },
    { cat: 'player', name: 'dead', expectedCat: 'player', expectedName: 'die' },
    { cat: 'enemy', name: 'goomba_walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'goomba', name: 'walk_1', expectedCat: 'enemy', expectedName: 'walk_1' },
    { cat: 'goomba', name: 'squashed', expectedCat: 'enemy', expectedName: 'squash' },
    { cat: 'coin', name: 'coin_1', expectedCat: 'item', expectedName: 'coin_1' },
    { cat: 'collectibles', name: 'coin_2', expectedCat: 'item', expectedName: 'coin_2' },
    { cat: 'tile', name: 'question_empty', expectedCat: 'tile', expectedName: 'empty' },
    { cat: 'tile', name: 'pole_top', expectedCat: 'tile', expectedName: 'flagpole_top' },
    { cat: 'tile', name: 'flag_cloth', expectedCat: 'tile', expectedName: 'flag' }
  ];

  for (const t of ALIAS_TESTS) {
    const aliasedSprite = GameAssets.getSprite(t.cat, t.name);
    const expectedSprite = GameAssets.getSprite(t.expectedCat, t.expectedName);
    assert(aliasedSprite === expectedSprite, `Alias lookup [${t.cat}][${t.name}] correctly resolves to [${t.expectedCat}][${t.expectedName}]`);
  }

  // Fallback test
  const fallback = GameAssets.getSprite('unknown_category', 'non_existent_sprite');
  assert(fallback !== null && fallback !== undefined, 'Unknown sprite returns non-null fallback sprite');
  assert(fallback.width === 16 && fallback.height === 16, 'Fallback sprite is 16x16');
  const fallbackAnalysis = analyzeCanvasPixels(fallback);
  assert(fallbackAnalysis.opaqueCount === 256, 'Fallback sprite is fully opaque checkerboard');

  // --- TEST GROUP 6: DRAWSPRITE RENDERING & SCALING ---
  console.log('\n--- Test Group 6: drawSprite Execution (Normal, Flipped, Scaled) ---');

  const destCanvas = GameAssets.createCanvas(64, 64);
  const destCtx = destCanvas.getContext('2d');

  // Draw normal Mario at (0, 0, 16, 16)
  GameAssets.drawSprite(destCtx, 'player', 'idle', 0, 0, 16, 16, false);
  const drawnNormalAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnNormalAnalysis.opaqueCount > 0, 'drawSprite normal mode renders visible pixels to target canvas');

  // Clear and draw flipped Mario at (0, 0, 16, 16)
  destCtx.clearRect(0, 0, 64, 64);
  GameAssets.drawSprite(destCtx, 'player', 'idle', 0, 0, 16, 16, true);
  const drawnFlippedAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnFlippedAnalysis.opaqueCount === drawnNormalAnalysis.opaqueCount, 'drawSprite flipped mode renders identical total pixel density');

  // Draw scaled Mario at (0, 0, 32, 32)
  destCtx.clearRect(0, 0, 64, 64);
  GameAssets.drawSprite(destCtx, 'player', 'idle', 0, 0, 32, 32, false);
  const drawnScaledAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnScaledAnalysis.opaqueCount > drawnNormalAnalysis.opaqueCount * 3, 'drawSprite scaled mode (32x32) renders expanded pixel footprint');

  // Draw tile with dynamic flip fallback (tiles don't have pre-flipped canvases)
  destCtx.clearRect(0, 0, 64, 64);
  GameAssets.drawSprite(destCtx, 'tile', 'pipe_tl', 0, 0, 16, 16, true);
  const drawnFlippedTileAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnFlippedTileAnalysis.opaqueCount > 0, 'drawSprite dynamic transform fallback works for non-pre-flipped sprites (tiles)');

  // Draw with default width/height omitted
  destCtx.clearRect(0, 0, 64, 64);
  GameAssets.drawSprite(destCtx, 'player', 'idle', 0, 0);
  const drawnDefaultDimAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnDefaultDimAnalysis.opaqueCount === drawnNormalAnalysis.opaqueCount, 'drawSprite with omitted width/height defaults to 16x16');

  // Draw with floating point coordinates (sub-pixel coordinate rounding)
  destCtx.clearRect(0, 0, 64, 64);
  GameAssets.drawSprite(destCtx, 'player', 'idle', 10.7, 5.2, 16, 16);
  const drawnFloatAnalysis = analyzeCanvasPixels(destCanvas);
  assert(drawnFloatAnalysis.opaqueCount === drawnNormalAnalysis.opaqueCount, 'drawSprite rounds sub-pixel floats to prevent antialiasing artifacts');

  // Safe error handling for null context
  try {
    GameAssets.drawSprite(null, 'player', 'idle', 0, 0, 16, 16);
    assert(true, 'drawSprite with null context returns safely without throwing');
  } catch (err) {
    assert(false, 'drawSprite with null context threw an exception: ' + err.message);
  }

  console.log('\n====================================================');
  console.log(`  ALL MILESTONE 1 ASSET TESTS PASSED (${passedTests} checks, 0 failures)`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
