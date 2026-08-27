import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const GameAssets = require('../../js/assets.js');

console.log('====================================================');
console.log('  REVIEWER 2 ADVERSARIAL STRESS TEST SUITE           ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  } else {
    console.log(`  ✓ ${message}`);
    passCount++;
  }
}

// --- 1. MATRIX INTEGRITY & PALETTE MAPPING ---
console.log('--- 1. Matrix Structural & Character Integrity ---');
let matrixErrors = [];
for (const [cat, sprites] of Object.entries(GameAssets.RAW_SPRITES)) {
  for (const [name, def] of Object.entries(sprites)) {
    if (!def.data || !Array.isArray(def.data)) {
      matrixErrors.push(`${cat}.${name} data is not an array`);
      continue;
    }
    if (def.data.length !== 16) {
      matrixErrors.push(`${cat}.${name} rows = ${def.data.length} (expected 16)`);
    }
    def.data.forEach((row, rIdx) => {
      if (typeof row !== 'string' || row.length !== 16) {
        matrixErrors.push(`${cat}.${name} [row ${rIdx}] length = ${row ? row.length : 'null'} (expected 16)`);
      }
      const pal = GameAssets.PALETTES[def.palette];
      if (!pal) {
        matrixErrors.push(`${cat}.${name} unknown palette "${def.palette}"`);
      } else {
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (!(ch in pal)) {
            matrixErrors.push(`${cat}.${name} [row ${rIdx}, col ${c}] unknown char "${ch}" in palette "${def.palette}"`);
          }
        }
      }
    });
  }
}
assert(matrixErrors.length === 0, `All sprite matrices are strictly 16x16 with 100% valid palette mapping (errors: ${matrixErrors.length})`);
if (matrixErrors.length > 0) {
  console.error('Matrix errors:', matrixErrors);
}

// --- 2. PALETTE VALIDITY ---
console.log('\n--- 2. Palette Color Parsing & Hex Validity ---');
const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
let paletteErrors = [];
for (const [palName, colorMap] of Object.entries(GameAssets.PALETTES)) {
  for (const [char, colorVal] of Object.entries(colorMap)) {
    if (char === '.') {
      if (colorVal !== null) paletteErrors.push(`Palette "${palName}" char "." should be null, got "${colorVal}"`);
    } else {
      if (typeof colorVal !== 'string' || !hexRegex.test(colorVal)) {
        paletteErrors.push(`Palette "${palName}" char "${char}" invalid hex "${colorVal}"`);
      }
    }
  }
}
assert(paletteErrors.length === 0, `All palette colors are valid hex codes or null (errors: ${paletteErrors.length})`);

// --- 3. MEMORY FOOTPRINT AUDIT ---
console.log('\n--- 3. Memory Footprint & Sprite Instance Count ---');
await GameAssets.init();
let totalCanvases = 0;
let totalPixelBytes = 0;

for (const [cat, sprites] of Object.entries(GameAssets.sprites)) {
  for (const [name, canvas] of Object.entries(sprites)) {
    totalCanvases++;
    assert(canvas.width === 16 && canvas.height === 16, `Sprite ${cat}.${name} has dimensions 16x16`);
    totalPixelBytes += canvas.width * canvas.height * 4;
  }
}
if (GameAssets.fallbackSprite) {
  totalCanvases++;
  totalPixelBytes += GameAssets.fallbackSprite.width * GameAssets.fallbackSprite.height * 4;
}
console.log(`  -> Total sprite canvas instances: ${totalCanvases}`);
console.log(`  -> Total raw pixel memory footprint: ${totalPixelBytes} bytes (${(totalPixelBytes / 1024).toFixed(2)} KB)`);
assert(totalCanvases >= 38, `Total canvas count (${totalCanvases}) covers all states + flipped mirrors`);
assert(totalPixelBytes < 100 * 1024, `Total raw memory footprint is under 100 KB (${(totalPixelBytes / 1024).toFixed(2)} KB)`);

// --- 4. FLIPPED CACHING EFFICIENCY BENCHMARK ---
console.log('\n--- 4. Pre-Flipped Caching Efficiency & Hot-Path Performance ---');
const benchCanvas = GameAssets.createCanvas(320, 240);
const benchCtx = benchCanvas.getContext('2d');

const ITERATIONS = 10000;
const t0 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  GameAssets.drawSprite(benchCtx, 'player', 'run_1', (i % 20) * 16, Math.floor(i / 20) % 15 * 16, 16, 16, true);
}
const t1 = performance.now();
const elapsedMs = t1 - t0;
const opsPerSec = Math.round((ITERATIONS / elapsedMs) * 1000);
console.log(`  -> Executed ${ITERATIONS} drawSprite(flipX=true) calls in ${elapsedMs.toFixed(2)}ms (${opsPerSec.toLocaleString()} ops/sec)`);
assert(elapsedMs < 500, `Pre-flipped drawSprite benchmark completed in under 500ms (took ${elapsedMs.toFixed(2)}ms)`);

// --- 5. ADVERSARIAL EDGE CASE INPUTS ---
console.log('\n--- 5. Adversarial Edge Case Inputs & Fault Tolerance ---');

// 5.1 Undefined / null arguments
try {
  GameAssets.drawSprite(null, 'player', 'idle', 0, 0, 16, 16, false);
  assert(true, 'drawSprite(null ctx) handles gracefully without throw');
} catch (e) {
  assert(false, 'drawSprite(null ctx) threw: ' + e.message);
}

try {
  const spr1 = GameAssets.getSprite(null, null);
  assert(spr1 === GameAssets.fallbackSprite, 'getSprite(null, null) returns fallbackSprite');
} catch (e) {
  assert(false, 'getSprite(null, null) threw: ' + e.message);
}

try {
  const spr2 = GameAssets.getSprite(undefined, undefined);
  assert(spr2 === GameAssets.fallbackSprite, 'getSprite(undefined, undefined) returns fallbackSprite');
} catch (e) {
  assert(false, 'getSprite(undefined, undefined) threw: ' + e.message);
}

try {
  const spr3 = GameAssets.getSprite('invalid_cat_123', 'invalid_name_456');
  assert(spr3 === GameAssets.fallbackSprite, 'getSprite with non-existent strings returns fallbackSprite');
} catch (e) {
  assert(false, 'getSprite(invalid) threw: ' + e.message);
}

// 5.2 Extreme coordinates (NaN, Infinity, negative, very large)
try {
  GameAssets.drawSprite(benchCtx, 'player', 'idle', NaN, NaN, 16, 16, false);
  assert(true, 'drawSprite with NaN coords handled safely');
} catch (e) {
  assert(false, 'drawSprite with NaN coords threw: ' + e.message);
}

try {
  GameAssets.drawSprite(benchCtx, 'player', 'idle', -9999, -9999, 16, 16, false);
  assert(true, 'drawSprite with out-of-bounds negative coords handled safely');
} catch (e) {
  assert(false, 'drawSprite with negative coords threw: ' + e.message);
}

try {
  GameAssets.drawSprite(benchCtx, 'player', 'idle', 9999, 9999, 16, 16, false);
  assert(true, 'drawSprite with out-of-bounds positive coords handled safely');
} catch (e) {
  assert(false, 'drawSprite with large positive coords threw: ' + e.message);
}

try {
  GameAssets.drawSprite(benchCtx, 'player', 'idle', 0, 0, 0, 0, false);
  assert(true, 'drawSprite with 0 width/height handled safely');
} catch (e) {
  assert(false, 'drawSprite with 0 size threw: ' + e.message);
}

// 5.3 Case-insensitivity & whitespace resilience
const sprUpper = GameAssets.getSprite('PLAYER', 'IDLE');
const sprExact = GameAssets.getSprite('player', 'idle');
assert(sprUpper === sprExact, 'getSprite is case-insensitive for category and sprite name');

// --- SUMMARY ---
console.log('\n====================================================');
console.log(`  ADVERSARIAL STRESS SUITE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) process.exit(1);
