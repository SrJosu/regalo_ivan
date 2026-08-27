/**
 * .agents/m1_challenger_2/test_adversarial_assets.mjs
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS FOR MILESTONE 1 (js/assets.js)
 * Challenger 2 - Adversarial Edge-Case Suite
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to assets.js
const assetsPath = path.resolve(__dirname, '../../js/assets.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    const errMsg = `FAIL: ${testName} ${detail ? `(${detail})` : ''}`;
    console.error(`  [FAIL] ${errMsg}`);
    failures.push(errMsg);
  }
}

function expectNoThrow(fn, testName) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    const errMsg = `FAIL (Threw Exception): ${testName} -> ${err.message}`;
    console.error(`  [FAIL] ${errMsg}`);
    failures.push(errMsg);
  }
}

async function expectNoThrowAsync(fn, testName) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    const errMsg = `FAIL (Threw Exception): ${testName} -> ${err.message}`;
    console.error(`  [FAIL] ${errMsg}`);
    failures.push(errMsg);
  }
}

// Helper to load fresh instance of GameAssets
function loadFreshAssetsModule() {
  delete require.cache[require.resolve(assetsPath)];
  return require(assetsPath);
}

// Mock standard browser-like 2D context tracking all calls
function createMockCanvasContext() {
  const calls = [];
  return {
    calls,
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    translate(x, y) { calls.push(['translate', x, y]); },
    scale(sx, sy) { calls.push(['scale', sx, sy]); },
    drawImage(img, ...args) { calls.push(['drawImage', img, ...args]); },
    fillRect(x, y, w, h) { calls.push(['fillRect', x, y, w, h]); },
    clearRect(x, y, w, h) { calls.push(['clearRect', x, y, w, h]); },
    getImageData(x, y, w, h) {
      calls.push(['getImageData', x, y, w, h]);
      return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    }
  };
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL EDGE-CASE TEST SUITE (js/assets.js)');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: PRE-INIT STATE RESILIENCE
  // -------------------------------------------------------------
  console.log('>>> 1. PRE-INITIALIZATION STATE RESILIENCE <<<');
  const freshAssets = loadFreshAssetsModule();
  assert(freshAssets.isReady === false, 'Fresh module has isReady === false');

  // Calling getSprite before init()
  const preInitSprite = freshAssets.getSprite('player', 'idle');
  assert(preInitSprite !== null && preInitSprite !== undefined, 'getSprite before init() returns non-null fallback');
  assert(preInitSprite.width === 16 && preInitSprite.height === 16, 'getSprite before init() returns 16x16 canvas');

  // Drawing sprite before init()
  const preInitCanvas = freshAssets.createCanvas(32, 32);
  const preInitCtx = preInitCanvas.getContext('2d');
  expectNoThrow(() => {
    freshAssets.drawSprite(preInitCtx, 'player', 'idle', 0, 0, 16, 16);
    freshAssets.drawSprite(preInitCtx, 'player', 'idle', 0, 0, 16, 16, true);
  }, 'drawSprite before init() executes without throwing exception');

  // -------------------------------------------------------------
  // SUITE 2: INIT IDEMPOTENCE & CONCURRENCY
  // -------------------------------------------------------------
  console.log('\n>>> 2. INIT IDEMPOTENCE & CONCURRENCY STRESS <<<');
  
  // Parallel init race
  const Assets = loadFreshAssetsModule();
  const initPromises = Array.from({ length: 50 }, () => Assets.init());
  await expectNoThrowAsync(async () => {
    await Promise.all(initPromises);
  }, '50 concurrent init() calls resolve cleanly without race conditions');
  assert(Assets.isReady === true, 'isReady is true after concurrent inits');

  // Sequential repeat inits
  await expectNoThrowAsync(async () => {
    for (let i = 0; i < 50; i++) {
      await Assets.init();
    }
  }, '50 sequential repeat init() calls execute safely');
  assert(Assets.isReady === true, 'isReady remains true after repeated sequential inits');

  // Verify sprites still intact after repeated inits
  const marioIdle = Assets.getSprite('player', 'idle');
  assert(marioIdle !== null && marioIdle.width === 16, 'Player idle sprite remains valid after 100 init invocations');

  // -------------------------------------------------------------
  // SUITE 3: ADVERSARIAL CATEGORY & NAME QUERIES (FALLBACK BEHAVIOR)
  // -------------------------------------------------------------
  console.log('\n>>> 3. ADVERSARIAL CATEGORY & SPRITE NAME QUERIES <<<');

  const adversarialQueries = [
    // Non-existent strings
    { cat: 'nonexistent', name: 'nonexistent', desc: 'unknown category & name' },
    { cat: 'player', name: 'flying_cape_super_mario', desc: 'valid cat, unknown sprite' },
    { cat: 'invalid_cat', name: 'idle', desc: 'unknown cat, known sprite name' },
    { cat: '', name: '', desc: 'empty strings' },
    { cat: '   ', name: '   ', desc: 'whitespace strings' },

    // Security & Prototype pollution candidates
    { cat: '__proto__', name: '__proto__', desc: '__proto__ query' },
    { cat: 'constructor', name: 'prototype', desc: 'constructor/prototype query' },
    { cat: 'toString', name: 'valueOf', desc: 'built-in Object methods query' },
    { cat: '<script>alert(1)</script>', name: '"><img src=x onerror=alert(1)>', desc: 'XSS injection strings' },
    { cat: "' OR '1'='1", name: "DROP TABLE sprites;--", desc: 'SQL injection strings' },
    { cat: '🍄', name: '👾', desc: 'Unicode emoji strings' },
    { cat: 'a'.repeat(5000), name: 'b'.repeat(5000), desc: '5000-char extreme length strings' },

    // Non-string types
    { cat: null, name: null, desc: 'null inputs' },
    { cat: undefined, name: undefined, desc: 'undefined inputs' },
    { cat: 0, name: 0, desc: 'numeric 0 inputs' },
    { cat: 12345, name: 67890, desc: 'numeric inputs' },
    { cat: NaN, name: NaN, desc: 'NaN inputs' },
    { cat: Infinity, name: -Infinity, desc: 'Infinity inputs' },
    { cat: true, name: false, desc: 'boolean inputs' },
    { cat: {}, name: {}, desc: 'object inputs' },
    { cat: [], name: [], desc: 'array inputs' },
    { cat: () => {}, name: () => {}, desc: 'function inputs' },
    { cat: Symbol('test'), name: Symbol('sprite'), desc: 'Symbol inputs' }
  ];

  for (const q of adversarialQueries) {
    let sprite;
    expectNoThrow(() => {
      sprite = Assets.getSprite(q.cat, q.name);
    }, `getSprite gracefully handles [${q.desc}]`);

    assert(sprite !== null && sprite !== undefined, `Fallback sprite for [${q.desc}] is non-null`);
    assert(sprite.width === 16 && sprite.height === 16, `Fallback sprite for [${q.desc}] is 16x16 canvas`);

    // Verify drawing this fallback sprite causes no errors
    const testCanvas = Assets.createCanvas(32, 32);
    const testCtx = testCanvas.getContext('2d');
    expectNoThrow(() => {
      Assets.drawSprite(testCtx, q.cat, q.name, 0, 0, 16, 16, false);
      Assets.drawSprite(testCtx, q.cat, q.name, 0, 0, 16, 16, true);
    }, `drawSprite gracefully renders fallback for [${q.desc}] (normal & flip)`);
  }

  // -------------------------------------------------------------
  // SUITE 4: EXTREME COORDINATES & BOUNDARY TESTING
  // -------------------------------------------------------------
  console.log('\n>>> 4. EXTREME COORDINATES & BOUNDARY STRESS <<<');

  const boundaryCases = [
    { x: 0, y: 0, w: 16, h: 16, desc: 'exact origin (0, 0)' },
    { x: -16, y: -16, w: 16, h: 16, desc: 'fully negative off-screen left/top (-16, -16)' },
    { x: -8, y: -8, w: 16, h: 16, desc: 'partially off-screen top-left (-8, -8)' },
    { x: -10000, y: -10000, w: 16, h: 16, desc: 'deep negative coords (-10000, -10000)' },
    { x: 100, y: 100, w: 16, h: 16, desc: 'fully beyond canvas bounds on 32x32 canvas' },
    { x: 50000, y: 50000, w: 16, h: 16, desc: 'extreme positive coords (50000, 50000)' },
    
    // Sub-pixel floating point
    { x: 0.1, y: 0.9, w: 16, h: 16, desc: 'sub-pixel floating coords (0.1, 0.9)' },
    { x: 10.4999, y: 15.5001, w: 16, h: 16, desc: 'boundary float coords (10.4999, 15.5001)' },
    { x: -0.0001, y: -0.9999, w: 16, h: 16, desc: 'negative float coords (-0.0001, -0.9999)' },
    { x: 1e-7, y: 1e-7, w: 16, h: 16, desc: 'microscopic float coords (1e-7, 1e-7)' },

    // Extreme scale & dimensions
    { x: 0, y: 0, w: 0, h: 0, desc: 'zero dimensions (0x0)' },
    { x: 0, y: 0, w: 0.5, h: 0.5, desc: 'sub-pixel dimension (0.5x0.5)' },
    { x: 0, y: 0, w: 1, h: 1, desc: 'single pixel dimension (1x1)' },
    { x: 0, y: 0, w: 1024, h: 1024, desc: 'large scale dimension (1024x1024)' },
    { x: 0, y: 0, w: 5000, h: 5000, desc: 'extreme scale dimension (5000x5000)' },
    { x: 0, y: 0, w: 1000, h: 1, desc: 'extreme non-square aspect ratio (1000x1)' },
    { x: 0, y: 0, w: 1, h: 1000, desc: 'extreme non-square aspect ratio (1x1000)' },
    { x: 0, y: 0, w: -16, h: -16, desc: 'negative dimensions (-16x-16)' },
    { x: 0, y: 0, w: -32, h: 16, desc: 'mixed negative dimensions (-32x16)' },

    // Weird values
    { x: NaN, y: NaN, w: 16, h: 16, desc: 'NaN coordinates' },
    { x: 0, y: 0, w: NaN, h: NaN, desc: 'NaN dimensions' },
    { x: Infinity, y: -Infinity, w: 16, h: 16, desc: 'Infinity coordinates' },
    { x: 0, y: 0, w: Infinity, h: Infinity, desc: 'Infinity dimensions' },
    { x: null, y: null, w: null, h: null, desc: 'null coordinates and dimensions' },
    { x: undefined, y: undefined, w: undefined, h: undefined, desc: 'undefined coordinates and dimensions' }
  ];

  const stressCanvas = Assets.createCanvas(64, 64);
  const stressCtx = stressCanvas.getContext('2d');

  for (const b of boundaryCases) {
    expectNoThrow(() => {
      Assets.drawSprite(stressCtx, 'player', 'idle', b.x, b.y, b.w, b.h, false);
      Assets.drawSprite(stressCtx, 'player', 'idle', b.x, b.y, b.w, b.h, true);
    }, `drawSprite handles [${b.desc}] without throwing in MemoryCanvas`);
  }

  // Also test with standard mock CanvasRenderingContext2D
  const mockCtx = createMockCanvasContext();
  for (const b of boundaryCases) {
    expectNoThrow(() => {
      Assets.drawSprite(mockCtx, 'player', 'idle', b.x, b.y, b.w, b.h, false);
      Assets.drawSprite(mockCtx, 'player', 'idle', b.x, b.y, b.w, b.h, true);
    }, `drawSprite handles [${b.desc}] with standard Mock CanvasRenderingContext2D`);
  }

  // -------------------------------------------------------------
  // SUITE 5: CONTEXT DEFENSIVENESS & CORRUPTION TESTS
  // -------------------------------------------------------------
  console.log('\n>>> 5. CONTEXT DEFENSIVENESS & CORRUPTION RESISTANCE <<<');

  const invalidContexts = [
    { ctx: null, desc: 'null context' },
    { ctx: undefined, desc: 'undefined context' },
    { ctx: {}, desc: 'empty object context' },
    { ctx: { drawImage: 'not a function' }, desc: 'invalid drawImage property' },
    { ctx: { drawImage: () => { throw new Error('Simulated GPU context lost'); } }, desc: 'context throwing internal error' }
  ];

  for (const c of invalidContexts) {
    if (c.desc.includes('throwing')) {
      // In JS, if ctx.drawImage throws, caller will get the error unless caught, let's observe
      let threw = false;
      try {
        Assets.drawSprite(c.ctx, 'player', 'idle', 0, 0, 16, 16);
      } catch (_) {
        threw = true;
      }
      assert(threw === true, `Simulated context throwing error is propagated as expected`);
    } else {
      expectNoThrow(() => {
        Assets.drawSprite(c.ctx, 'player', 'idle', 0, 0, 16, 16);
      }, `drawSprite handles [${c.desc}] safely without throwing`);
    }
  }

  // -------------------------------------------------------------
  // SUITE 6: MATRIX PARSING & COLOR TABLE FORENSIC AUDIT
  // -------------------------------------------------------------
  console.log('\n>>> 6. SPRITE MATRICES & PALETTE INTEGRITY AUDIT <<<');

  for (const [catName, catDef] of Object.entries(Assets.RAW_SPRITES)) {
    for (const [sprName, sprDef] of Object.entries(catDef)) {
      assert(Array.isArray(sprDef.data), `Sprite [${catName}][${sprName}] data is an Array`);
      assert(sprDef.data.length === 16, `Sprite [${catName}][${sprName}] has exactly 16 rows (found ${sprDef.data.length})`);
      
      const palette = Assets.PALETTES[sprDef.palette];
      assert(palette !== undefined, `Sprite [${catName}][${sprName}] references defined palette "${sprDef.palette}"`);

      let rowLengthErrors = 0;
      let unmappedCharErrors = 0;

      for (let r = 0; r < sprDef.data.length; r++) {
        const row = sprDef.data[r];
        if (typeof row !== 'string' || row.length !== 16) {
          rowLengthErrors++;
        }
        for (let c = 0; c < (row ? row.length : 0); c++) {
          const char = row[c];
          if (!(char in palette)) {
            unmappedCharErrors++;
            console.error(`Unmapped character '${char}' in [${catName}][${sprName}] at row ${r}, col ${c}`);
          }
        }
      }

      assert(rowLengthErrors === 0, `Sprite [${catName}][${sprName}] all 16 rows are exactly 16 chars`);
      assert(unmappedCharErrors === 0, `Sprite [${catName}][${sprName}] has 0 unmapped palette characters`);
    }
  }

  // -------------------------------------------------------------
  // SUITE 7: STRESS WORKLOAD (10,000 RAPID DRAWS)
  // -------------------------------------------------------------
  console.log('\n>>> 7. STRESS WORKLOAD (10,000 RAPID DRAWS) <<<');

  const benchCanvas = Assets.createCanvas(360, 800);
  const benchCtx = benchCanvas.getContext('2d');
  const spriteKeys = [
    ['player', 'idle'], ['player', 'run_1'], ['player', 'jump'],
    ['enemy', 'walk_1'], ['enemy', 'squash'],
    ['item', 'coin_1'], ['tile', 'ground'], ['tile', 'brick'],
    ['tile', 'question_1'], ['tile', 'pipe_tl']
  ];

  const startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    const [cat, name] = spriteKeys[i % spriteKeys.length];
    const x = (i * 17) % 360;
    const y = (i * 23) % 800;
    const flip = (i % 2 === 0);
    Assets.drawSprite(benchCtx, cat, name, x, y, 16, 16, flip);
  }
  const duration = Date.now() - startTime;
  console.log(`  10,000 draws executed in ${duration}ms (${(10000 / (duration || 1) * 1000).toFixed(0)} draws/sec)`);
  assert(duration < 2000, `10,000 draws complete within performance budget (< 2000ms, took ${duration}ms)`);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  ADVERSARIAL SUITE SUMMARY: ${passedTests}/${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`  ❌ ${failedTests} TESTS FAILED!`);
    for (const f of failures) {
      console.error(`    - ${f}`);
    }
  } else {
    console.log('  🎉 ZERO FAILURES! ALL ADVERSARIAL EDGE CASES CONFIRMED RESILIENT.');
  }
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch(err => {
  console.error('Fatal error during adversarial suite execution:', err);
  process.exit(1);
});
