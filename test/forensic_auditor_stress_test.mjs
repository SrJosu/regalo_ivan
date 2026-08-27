/**
 * test/forensic_auditor_stress_test.mjs
 * 
 * Forensic Integrity & Adversarial Stress Test for js/assets.js
 * Executed independently by Forensic Auditor.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const GameAssets = require('../js/assets.js');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, details = '') {
  totalChecks++;
  if (!condition) {
    console.error(`❌ FORENSIC FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
    failedChecks++;
  } else {
    console.log(`  ✓ ${message}`);
    passedChecks++;
  }
}

async function runForensicAudit() {
  console.log('====================================================');
  console.log('   FORENSIC INTEGRITY AUDIT: js/assets.js           ');
  console.log('====================================================\n');

  // --- CHECK 1: Static Matrix Geometry & Palette Integrity ---
  console.log('--- 1. Static Matrix Dimensions & Palette Reference Audit ---');
  const RAW = GameAssets.RAW_SPRITES;
  const PAL = GameAssets.PALETTES;

  let totalSpriteCount = 0;
  for (const [catName, catGroup] of Object.entries(RAW)) {
    for (const [sprName, sprDef] of Object.entries(catGroup)) {
      totalSpriteCount++;
      const data = sprDef.data;
      assert(Array.isArray(data), `Sprite [${catName}][${sprDef}] data is array`);
      assert(data.length === 16, `Sprite [${catName}][${sprName}] has exactly 16 rows`, `found ${data.length}`);
      
      const palObj = PAL[sprDef.palette];
      assert(!!palObj, `Sprite [${catName}][${sprName}] references existing palette [${sprDef.palette}]`);

      for (let r = 0; r < 16; r++) {
        const row = data[r];
        assert(typeof row === 'string' && row.length === 16, `Row ${r} of [${catName}][${sprName}] has length 16`, `row="${row}"`);
        for (let c = 0; c < 16; c++) {
          const ch = row[c];
          assert(ch in palObj, `Pixel char '${ch}' at (${c},${r}) in [${catName}][${sprName}] exists in palette`);
        }
      }
    }
  }
  console.log(`Audited ${totalSpriteCount} sprite definitions across all categories.`);

  // --- CHECK 2: Palette Color Hex Authenticity ---
  console.log('\n--- 2. Palette Color Hex Code Format Audit ---');
  for (const [palName, pal] of Object.entries(PAL)) {
    for (const [char, hex] of Object.entries(pal)) {
      if (char === '.') {
        assert(hex === null, `Palette [${palName}] transparent char '.' is null`);
      } else {
        assert(typeof hex === 'string' && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex),
          `Palette [${palName}] char '${char}' has valid hex code: ${hex}`);
      }
    }
  }

  // --- CHECK 3: Init & Caching Execution ---
  console.log('\n--- 3. Asset Pipeline Lifecycle & Offscreen Rasterization ---');
  await GameAssets.init();
  assert(GameAssets.isReady === true, 'GameAssets isReady is true');

  // Verify player has both normal and _flip pre-cached
  const flippable = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag'];
  for (const name of flippable) {
    const norm = GameAssets.sprites.player[name];
    const flip = GameAssets.sprites.player[name + '_flip'];
    assert(!!norm, `Normal sprite player.${name} cached`);
    assert(!!flip, `Flipped sprite player.${name}_flip pre-cached`);
    assert(norm !== flip, `Normal and flipped instances are distinct objects`);
  }

  // Die sprite should NOT be marked flip=true
  assert(RAW.player.die.flip === false, 'player.die flip is explicitly false');
  assert(!GameAssets.sprites.player['die_flip'], 'player.die_flip was not created');

  // --- CHECK 4: Mathematical Mirror Symmetry Verification ---
  console.log('\n--- 4. Mathematical Horizontal Mirror Verification ---');
  for (const name of flippable) {
    const norm = GameAssets.getSprite('player', name);
    const flip = GameAssets.getSprite('player', name + '_flip');
    const normCtx = norm.getContext('2d');
    const flipCtx = flip.getContext('2d');
    const normData = normCtx.getImageData(0, 0, 16, 16).data;
    const flipData = flipCtx.getImageData(0, 0, 16, 16).data;

    let symmetric = true;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const nIdx = (y * 16 + x) * 4;
        const fIdx = (y * 16 + (15 - x)) * 4;
        if (normData[nIdx] !== flipData[fIdx] ||
            normData[nIdx+1] !== flipData[fIdx+1] ||
            normData[nIdx+2] !== flipData[fIdx+2] ||
            normData[nIdx+3] !== flipData[fIdx+3]) {
          symmetric = false;
        }
      }
    }
    assert(symmetric, `Sprite [player][${name}] is perfectly symmetrical with [${name}_flip]`);
  }

  // --- CHECK 5: MemoryContext2D Transform Engine Rigorous Stress Test ---
  console.log('\n--- 5. MemoryContext2D Transform & DrawImage Engine Stress Test ---');
  const testCanvas = GameAssets.createCanvas(32, 32);
  const testCtx = testCanvas.getContext('2d');

  // Test fillRect with identity
  testCtx.fillStyle = '#FF0000';
  testCtx.fillRect(0, 0, 2, 2);
  let p = testCtx.getImageData(0, 0, 1, 1).data;
  assert(p[0] === 255 && p[1] === 0 && p[2] === 0 && p[3] === 255, 'fillRect renders #FF0000 red');

  // Test transform stack (save/restore/translate/scale)
  testCtx.save();
  testCtx.translate(10, 10);
  testCtx.scale(2, 2);
  testCtx.fillStyle = '#00FF00';
  testCtx.fillRect(0, 0, 2, 2); // Should map to (10, 10) to (14, 14)
  testCtx.restore();

  let pTrans = testCtx.getImageData(10, 10, 1, 1).data;
  assert(pTrans[0] === 0 && pTrans[1] === 255 && pTrans[2] === 0 && pTrans[3] === 255, 'Transformed fillRect renders #00FF00 green at (10,10)');
  let pTransOuter = testCtx.getImageData(13, 13, 1, 1).data;
  assert(pTransOuter[0] === 0 && pTransOuter[1] === 255 && pTransOuter[2] === 0 && pTransOuter[3] === 255, 'Transformed fillRect covers scaled footprint at (13,13)');
  let pTransBeyond = testCtx.getImageData(14, 14, 1, 1).data;
  assert(pTransBeyond[3] === 0, 'Pixels outside scaled rect remain transparent');

  // Test drawImage 2-arg, 4-arg, 8-arg variants
  const src = GameAssets.getSprite('player', 'idle');
  const target = GameAssets.createCanvas(64, 64);
  const tCtx = target.getContext('2d');

  // 2-arg: drawImage(src, dx, dy)
  tCtx.clearRect(0, 0, 64, 64);
  tCtx.drawImage(src, 5, 5);
  let sample2 = tCtx.getImageData(5, 5, 16, 16);
  assert(sample2.data.some(b => b > 0), 'drawImage 2-arg places sprite at (5,5)');

  // 4-arg: drawImage(src, dx, dy, dw, dh)
  tCtx.clearRect(0, 0, 64, 64);
  tCtx.drawImage(src, 0, 0, 32, 32);
  let sample4 = tCtx.getImageData(0, 0, 32, 32);
  assert(sample4.data.filter((_, idx) => idx % 4 === 3 && _ > 0).length > 200, 'drawImage 4-arg scales sprite to 32x32');

  // 8-arg: drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh)
  tCtx.clearRect(0, 0, 64, 64);
  tCtx.drawImage(src, 4, 4, 8, 8, 10, 10, 16, 16);
  let sample8 = tCtx.getImageData(10, 10, 16, 16);
  assert(sample8.data.some(b => b > 0), 'drawImage 8-arg sub-rectangle slices and scales');

  // --- CHECK 6: Fallback & Adversarial Inputs ---
  console.log('\n--- 6. Robustness against Adversarial & Malformed Inputs ---');
  
  // Null and undefined lookups
  const f1 = GameAssets.getSprite(null, null);
  assert(f1 === GameAssets.fallbackSprite, 'getSprite(null, null) returns fallbackSprite');

  const f2 = GameAssets.getSprite(undefined, 'invalid_sprite');
  assert(f2 === GameAssets.fallbackSprite, 'getSprite(undefined, invalid) returns fallbackSprite');

  const f3 = GameAssets.getSprite('mario', 'does_not_exist');
  assert(f3 === GameAssets.fallbackSprite, 'getSprite(mario, does_not_exist) returns fallbackSprite');

  // Adversarial drawSprite calls
  try {
    GameAssets.drawSprite(null, null, null, 0, 0);
    assert(true, 'drawSprite with all null arguments does not throw');
  } catch (e) {
    assert(false, 'drawSprite threw on null args: ' + e.message);
  }

  try {
    const badCtx = {};
    GameAssets.drawSprite(badCtx, 'player', 'idle', 0, 0);
    assert(true, 'drawSprite with invalid ctx object (no drawImage) does not throw');
  } catch (e) {
    assert(false, 'drawSprite threw on invalid ctx: ' + e.message);
  }

  try {
    GameAssets.drawSprite(tCtx, 'player', 'idle', -50, -50, 16, 16, true);
    assert(true, 'drawSprite with negative off-screen coordinates and flipX executes safely');
  } catch (e) {
    assert(false, 'drawSprite threw on negative coords: ' + e.message);
  }

  // --- CHECK 7: Visual Diversity & Semantic Character Inspection ---
  console.log('\n--- 7. Semantic Visual Inspection of Sprites ---');
  
  // Coin animation has 4 distinct phases (wide -> medium -> slit -> reverse medium)
  const c1 = GameAssets.getSprite('item', 'coin_1');
  const c2 = GameAssets.getSprite('item', 'coin_2');
  const c3 = GameAssets.getSprite('item', 'coin_3');
  const c4 = GameAssets.getSprite('item', 'coin_4');
  
  const c1Width = getSpriteOpaqueWidth(c1);
  const c2Width = getSpriteOpaqueWidth(c2);
  const c3Width = getSpriteOpaqueWidth(c3);
  const c4Width = getSpriteOpaqueWidth(c4);

  assert(c1Width > c2Width && c2Width > c3Width, `Coin frames exhibit geometric spin narrowing (c1=${c1Width}px, c2=${c2Width}px, c3=${c3Width}px)`);
  assert(c4Width === c2Width, `Coin frame 4 width matches frame 2 for symmetric rotation (c4=${c4Width}px)`);

  // Goomba squash sprite is shorter than walking sprite
  const gWalk = GameAssets.getSprite('enemy', 'walk_1');
  const gSquash = GameAssets.getSprite('enemy', 'squash');
  const gWalkHeight = getSpriteOpaqueHeight(gWalk);
  const gSquashHeight = getSpriteOpaqueHeight(gSquash);

  assert(gSquashHeight < gWalkHeight, `Goomba squash is squashed in height (walk=${gWalkHeight}px, squash=${gSquashHeight}px)`);
  assert(gSquashHeight === 8, `Goomba squash is exactly half height (8px)`);

  // Mario jump sprite has raised fist/arm
  const mIdle = GameAssets.getSprite('player', 'idle');
  const mJump = GameAssets.getSprite('player', 'jump');
  const mIdleTop = getSpriteTopOpaqueY(mIdle);
  const mJumpTop = getSpriteTopOpaqueY(mJump);
  assert(mJumpTop < mIdleTop, `Mario jump pose extends higher than idle pose (jumpTop=${mJumpTop}, idleTop=${mIdleTop})`);

  console.log('\n====================================================');
  console.log(`  FORENSIC AUDIT SUMMARY: ${passedChecks} checks PASSED, ${failedChecks} checks FAILED`);
  console.log('====================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

function getSpriteOpaqueWidth(canvas) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, 16, 16).data;
  let minX = 16, maxX = -1;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 4;
      if (data[idx + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  return maxX >= minX ? (maxX - minX + 1) : 0;
}

function getSpriteOpaqueHeight(canvas) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, 16, 16).data;
  let minY = 16, maxY = -1;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 4;
      if (data[idx + 3] > 0) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxY >= minY ? (maxY - minY + 1) : 0;
}

function getSpriteTopOpaqueY(canvas) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, 16, 16).data;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 4;
      if (data[idx + 3] > 0) return y;
    }
  }
  return 16;
}

runForensicAudit().catch(err => {
  console.error('Forensic test exception:', err);
  process.exit(1);
});
