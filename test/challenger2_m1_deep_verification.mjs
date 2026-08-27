/**
 * test/challenger2_m1_deep_verification.mjs
 *
 * Challenger 2 Deep Empirical Verification Harness for Milestone 1:
 * - Color diversity & richness across all Iván sprites, meme families (Pop Cat, Doge, Grumpy Cat), and 3D tiles.
 * - Exact 16x16 matrix dimension integrity, palette reference validity.
 * - Mirror symmetry invariants (X_orig + X_flip === 15, Y_orig === Y_flip).
 * - Mathematical Center of Mass Y preservation & X reflection.
 * - Bounding box invariance under flipping.
 * - API contract conformance and fallback guarantees.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const GameAssets = require('../js/assets.js');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message, details = '') {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
    failedAssertions++;
  } else {
    console.log(`  ✓ ${message}${details ? ` -> ${details}` : ''}`);
    passedAssertions++;
  }
}

function analyzeCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colorMap = new Map();
  let opaqueCount = 0;
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  let sumX = 0, sumY = 0;
  const rowCounts = new Array(canvas.height).fill(0);
  const colCounts = new Array(canvas.width).fill(0);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = imgData.data[idx];
      const g = imgData.data[idx + 1];
      const b = imgData.data[idx + 2];
      const a = imgData.data[idx + 3];

      if (a > 0) {
        opaqueCount++;
        rowCounts[y]++;
        colCounts[x]++;
        sumX += x;
        sumY += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }
  }

  const isEmpty = (opaqueCount === 0);
  return {
    width: canvas.width,
    height: canvas.height,
    opaqueCount,
    transparentCount: (canvas.width * canvas.height) - opaqueCount,
    uniqueColors: colorMap.size,
    colorDistribution: Object.fromEntries(colorMap),
    boundingBox: isEmpty ? null : { minX, minY, maxX, maxY, width: (maxX - minX + 1), height: (maxY - minY + 1) },
    centerOfMass: isEmpty ? null : { x: sumX / opaqueCount, y: sumY / opaqueCount },
    rowCounts,
    colCounts
  };
}

async function runChallengerVerification() {
  console.log('================================================================');
  console.log('  CHALLENGER 2: DEEP EMPIRICAL VERIFICATION (MILESTONE 1)       ');
  console.log('================================================================\n');

  // --- 1. INITIALIZATION & CONTRACTS ---
  console.log('--- 1. API Initialization & Contract Checks ---');
  assert(GameAssets.isReady === false, 'GameAssets starts with isReady=false');
  const initPromise = GameAssets.init();
  assert(initPromise instanceof Promise, 'GameAssets.init() returns a Promise');
  await initPromise;
  assert(GameAssets.isReady === true, 'GameAssets.isReady is true after init()');

  // --- 2. EXACT 16x16 MATRIX INTEGRITY & PALETTE REFERENCES ---
  console.log('\n--- 2. Exact 16x16 Matrix Dimension & Palette Reference Integrity ---');
  const RAW = GameAssets.RAW_SPRITES;
  const PAL = GameAssets.PALETTES;

  let totalRawCount = 0;
  for (const [catName, catGroup] of Object.entries(RAW)) {
    for (const [sprName, sprDef] of Object.entries(catGroup)) {
      totalRawCount++;
      const data = sprDef.data;
      assert(Array.isArray(data), `[${catName}][${sprName}] data is array`);
      assert(data.length === 16, `[${catName}][${sprName}] has exactly 16 rows`, `found ${data.length}`);
      
      const palName = sprDef.palette;
      assert(!!PAL[palName], `[${catName}][${sprName}] references defined palette [${palName}]`);
      const palMap = PAL[palName];

      for (let r = 0; r < 16; r++) {
        const row = data[r];
        assert(typeof row === 'string' && row.length === 16, `[${catName}][${sprName}] row ${r} has length 16`, `length=${row?.length}`);
        for (let c = 0; c < 16; c++) {
          const ch = row[c];
          assert(ch in palMap, `Char '${ch}' at row ${r}, col ${c} in [${catName}][${sprName}] in palette [${palName}]`);
        }
      }
    }
  }
  console.log(`Total audited raw sprite definitions: ${totalRawCount}`);

  // --- 3. SPRITE COLOR DIVERSITY & RICHNESS AUDIT ---
  console.log('\n--- 3. Sprite Color Diversity & Richness Audit ---');
  
  // 3A: Iván Sprites (8 states)
  console.log('\n  [3A] Iván Sprites (8 states):');
  const ivanSprites = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag', 'die'];
  for (const name of ivanSprites) {
    const sprite = GameAssets.getSprite('player', name);
    assert(sprite !== null && sprite.width === 16 && sprite.height === 16, `Iván sprite [${name}] exists and is 16x16`);
    const analysis = analyzeCanvas(sprite);
    assert(analysis.uniqueColors >= 10, `Iván [${name}] has high color richness (>= 10 colors)`, `${analysis.uniqueColors} distinct colors, ${analysis.opaqueCount} opaque pixels`);
  }

  // 3B: Meme Enemy Families (Pop Cat, Doge, Grumpy Cat)
  console.log('\n  [3B] Meme Enemy Families:');
  const memeEnemies = [
    { cat: 'enemy', name: 'walk_1', desc: 'Pop Cat Walk 1 (Closed mouth)' },
    { cat: 'enemy', name: 'walk_2', desc: 'Pop Cat Walk 2 (Open mouth)' },
    { cat: 'enemy', name: 'squash', desc: 'Pop Cat Squash' },
    { cat: 'doge', name: 'walk_1', desc: 'Doge Walk 1' },
    { cat: 'doge', name: 'walk_2', desc: 'Doge Walk 2' },
    { cat: 'doge', name: 'squash', desc: 'Doge Squash' },
    { cat: 'grumpy', name: 'walk_1', desc: 'Grumpy Cat Walk 1' },
    { cat: 'grumpy', name: 'walk_2', desc: 'Grumpy Cat Walk 2' },
    { cat: 'grumpy', name: 'squash', desc: 'Grumpy Cat Squash' }
  ];

  for (const meme of memeEnemies) {
    const sprite = GameAssets.getSprite(meme.cat, meme.name);
    assert(sprite !== null && sprite.width === 16 && sprite.height === 16, `${meme.desc} exists and is 16x16`);
    const analysis = analyzeCanvas(sprite);
    assert(analysis.uniqueColors >= 4, `${meme.desc} has rich palette (>= 4 colors)`, `${analysis.uniqueColors} colors, ${analysis.opaqueCount} pixels`);
  }

  // 3C: 3D Tiles & Props
  console.log('\n  [3C] 3D Environment Tiles & Birthday Props:');
  const tileList = [
    'ground', 'ground_filler', 'brick', 'question_1', 'question_2', 'question_3', 'empty',
    'pipe_tl', 'pipe_tr', 'pipe_bl', 'pipe_br', 'flag', 'flagpole_top', 'flagpole_shaft',
    'castle_brick', 'castle_door', 'castle_battlement', 'castle_cake'
  ];

  for (const tName of tileList) {
    const sprite = GameAssets.getSprite('tile', tName);
    assert(sprite !== null && sprite.width === 16 && sprite.height === 16, `Tile [${tName}] exists and is 16x16`);
    const analysis = analyzeCanvas(sprite);
    assert(analysis.uniqueColors >= 3, `Tile [${tName}] has 3D shading/richness (>= 3 colors)`, `${analysis.uniqueColors} colors, ${analysis.opaqueCount} pixels`);
  }

  // 3D: Items (3D Gold Coins & Cake)
  console.log('\n  [3D] Collectibles (Rotating 3D Coins & Cake):');
  const itemList = ['coin_1', 'coin_2', 'coin_3', 'coin_4', 'cake', 'cake_slice'];
  for (const iName of itemList) {
    const sprite = GameAssets.getSprite('item', iName);
    assert(sprite !== null && sprite.width === 16 && sprite.height === 16, `Item [${iName}] exists and is 16x16`);
    const analysis = analyzeCanvas(sprite);
    assert(analysis.uniqueColors >= 4, `Item [${iName}] has rich palette (>= 4 colors)`, `${analysis.uniqueColors} colors, ${analysis.opaqueCount} pixels`);
  }

  // --- 4. MIRROR SYMMETRY & INVARIANTS AUDIT ---
  console.log('\n--- 4. Mirror Symmetry Invariants Audit (X_orig + X_flip === 15) ---');
  const flippable = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag'];
  for (const name of flippable) {
    const orig = GameAssets.getSprite('player', name);
    const flip = GameAssets.getSprite('player', name + '_flip');
    const oCtx = orig.getContext('2d');
    const fCtx = flip.getContext('2d');
    const oData = oCtx.getImageData(0, 0, 16, 16).data;
    const fData = fCtx.getImageData(0, 0, 16, 16).data;

    let symmetryViolations = 0;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const oIdx = (y * 16 + x) * 4;
        const fIdx = (y * 16 + (15 - x)) * 4;
        for (let c = 0; c < 4; c++) {
          if (oData[oIdx + c] !== fData[fIdx + c]) {
            symmetryViolations++;
          }
        }
      }
    }
    assert(symmetryViolations === 0, `Player [${name}] mirror symmetry invariant (X_orig + X_flip === 15)`, `0 byte mismatches`);
  }

  // --- 5. CENTER OF MASS Y PRESERVATION & BOUNDING BOX INVARIANCE ---
  console.log('\n--- 5. Center of Mass Y Preservation & Bounding Box Invariance ---');
  for (const name of flippable) {
    const orig = GameAssets.getSprite('player', name);
    const flip = GameAssets.getSprite('player', name + '_flip');
    const oAnalysis = analyzeCanvas(orig);
    const fAnalysis = analyzeCanvas(flip);

    // Center of Mass Y preservation
    const yDelta = Math.abs(oAnalysis.centerOfMass.y - fAnalysis.centerOfMass.y);
    assert(yDelta < 1e-9, `Center of mass Y preserved for [${name}]`, `Y_orig=${oAnalysis.centerOfMass.y.toFixed(6)}, Y_flip=${fAnalysis.centerOfMass.y.toFixed(6)}, delta=${yDelta.toExponential(2)}`);

    // Center of Mass X reflection: X_orig + X_flip === 15
    const xSum = oAnalysis.centerOfMass.x + fAnalysis.centerOfMass.x;
    assert(Math.abs(xSum - 15) < 1e-9, `Center of mass X reflection for [${name}]`, `X_orig=${oAnalysis.centerOfMass.x.toFixed(6)} + X_flip=${fAnalysis.centerOfMass.x.toFixed(6)} === ${xSum.toFixed(6)}`);

    // Bounding Box Height & Y positions match identically
    assert(oAnalysis.boundingBox.height === fAnalysis.boundingBox.height, `Bounding box height match for [${name}]`, `${oAnalysis.boundingBox.height}px`);
    assert(oAnalysis.boundingBox.minY === fAnalysis.boundingBox.minY, `Bounding box minY match for [${name}]`, `minY=${oAnalysis.boundingBox.minY}`);
    assert(oAnalysis.boundingBox.maxY === fAnalysis.boundingBox.maxY, `Bounding box maxY match for [${name}]`, `maxY=${oAnalysis.boundingBox.maxY}`);

    // Bounding Box Width matches and X boundaries reflect: minX_flip = 15 - maxX_orig
    assert(oAnalysis.boundingBox.width === fAnalysis.boundingBox.width, `Bounding box width match for [${name}]`, `${oAnalysis.boundingBox.width}px`);
    assert(fAnalysis.boundingBox.minX === 15 - oAnalysis.boundingBox.maxX, `Bounding box minX_flip matches 15 - maxX_orig for [${name}]`, `minX_flip=${fAnalysis.boundingBox.minX}, 15-maxX_orig=${15 - oAnalysis.boundingBox.maxX}`);
    assert(fAnalysis.boundingBox.maxX === 15 - oAnalysis.boundingBox.minX, `Bounding box maxX_flip matches 15 - minX_orig for [${name}]`, `maxX_flip=${fAnalysis.boundingBox.maxX}, 15-minX_orig=${15 - oAnalysis.boundingBox.minX}`);
  }

  // --- 6. SUMMARY ---
  console.log('\n================================================================');
  console.log(`  CHALLENGER 2 VERIFICATION SUMMARY:`);
  console.log(`  - Total Checks: ${totalAssertions}`);
  console.log(`  - Passed: ${passedAssertions}`);
  console.log(`  - Failed: ${failedAssertions}`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runChallengerVerification().catch(err => {
  console.error('Fatal error in challenger verification:', err);
  process.exit(1);
});
