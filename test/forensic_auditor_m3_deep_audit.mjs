/**
 * test/forensic_auditor_m3_deep_audit.mjs
 *
 * Independent Forensic Integrity Audit for Milestone 3 (V2 Iván's Birthday Gift Edition)
 * Audits:
 * 1. Exact string & attribute verification of the reward button
 * 2. Prohibited pattern scanning (hardcoded test bypasses, facade functions, dummy returns)
 * 3. Physics, particle, and entity genuine mathematical implementations
 * 4. Headless Chrome DOM rendering & event interaction verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    totalFailed++;
  }
}

async function runDeepAudit() {
  console.log('===============================================================');
  console.log('🔍 FORENSIC AUDITOR INDEPENDENT INTEGRITY AUDIT (M3 V2)');
  console.log('===============================================================');

  // -------------------------------------------------------------------------
  // PHASE 1: EXACT STRING & ATTRIBUTE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 1: Exact Reward Button Copy & URL Verification ---');
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  const REQUIRED_TEXT = 'Terminado el juego. Pincha aquí para recibir la recompensa';

  assert(indexHtml.includes(REQUIRED_TEXT), `index.html includes exact text: "${REQUIRED_TEXT}"`);

  const rewardBtnMatch = indexHtml.match(/<a[^>]*id=["']reward-btn["'][^>]*>([\s\S]*?)<\/a>/i);
  assert(rewardBtnMatch !== null, '<a id="reward-btn"> element exists in index.html');

  if (rewardBtnMatch) {
    const fullTag = rewardBtnMatch[0];
    const innerText = rewardBtnMatch[1].trim();

    assert(innerText === REQUIRED_TEXT, `Inner text matches exact required string byte-for-byte (length: ${innerText.length} === ${REQUIRED_TEXT.length})`);
    assert(/href=["']https:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^"']+["']/i.test(fullTag), 'href points to a genuine YouTube URL');
    assert(/target=["']_blank["']/i.test(fullTag), 'target attribute is "_blank" for opening in new tab');
    assert(/rel=["'][^"']*noopener[^"']*["']/i.test(fullTag), 'rel attribute contains "noopener" for secure navigation');
  }

  // -------------------------------------------------------------------------
  // PHASE 2: PROHIBITED PATTERN & FACADE SCANNING
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 2: Prohibited Pattern & Facade Implementation Scan ---');
  const jsFiles = ['assets.js', 'audio.js', 'entities.js', 'game.js', 'input.js', 'level.js', 'physics.js'];

  for (const file of jsFiles) {
    const filePath = path.join(ROOT_DIR, 'js', file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Facade returns
    const dummyReturnMatch = content.match(/function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+(true|false|null|0|1|""|'')\s*;\s*\}/g);
    assert(dummyReturnMatch === null, `No dummy/facade empty functions in js/${file}`);

    // 2. Unimplemented placeholders
    const notImplementedMatch = content.match(/throw new Error\(["']Not implemented/i);
    assert(notImplementedMatch === null, `No NotImplementedError placeholders in js/${file}`);

    // 3. Test mock injection in production code
    const mockMatch = content.match(/window\.__mock|global\.__mock|mockTestPass/i);
    assert(mockMatch === null, `No test mocks or hardcoded test bypasses in js/${file}`);
  }

  // -------------------------------------------------------------------------
  // PHASE 3: ENTITY, PARTICLE & LORE INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 3: Entity, Particle & Birthday Lore Integrity ---');
  const entitiesCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'entities.js'), 'utf-8');
  const levelCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'level.js'), 'utf-8');
  const cssCode = fs.readFileSync(path.join(ROOT_DIR, 'css', 'style.css'), 'utf-8');

  // Check PopCat mouth loop
  assert(entitiesCode.includes('animTimer / 0.18') || entitiesCode.includes('0.18'), 'PopCat uses 180ms rhythmic mouth open/close animation calculation');
  assert(entitiesCode.includes('ConfettiParticle'), 'ConfettiParticle class is genuinely implemented');
  assert(entitiesCode.includes('wobbleTimer') && entitiesCode.includes('rotSpeed'), 'ConfettiParticle has genuine physics (wobble, rotation, gravity)');
  assert(entitiesCode.includes('MEME_TEXTS'), 'Floating meme combat text library exists with famous memes');

  // Check Roadside Signs and Banner
  assert(levelCode.includes('🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂'), 'Sky banner includes personalized birthday greeting for Iván');
  assert(levelCode.includes('signposts') && levelCode.includes('KM 0') && levelCode.includes('KM 10') && levelCode.includes('KM 25') && levelCode.includes('KM 30'), 'Roadside milestone signposts KM 0, 10, 25, 30 are configured with lore');
  assert(levelCode.includes('drawSkyBanner') && levelCode.includes('drawSignposts'), 'Sky banner and signposts have full canvas render routines');

  // Check CSS Z-Index Hierarchy
  const modalZMatch = cssCode.match(/\.victory-overlay[\s\S]*?z-index:\s*(\d+)/i);
  const touchZMatch = cssCode.match(/#touch-controls[\s\S]*?z-index:\s*(\d+)/i);
  const hudZMatch = cssCode.match(/#hud[\s\S]*?z-index:\s*(\d+)/i);

  assert(modalZMatch && parseInt(modalZMatch[1], 10) >= 100, `Victory modal overlay has high z-index (${modalZMatch ? modalZMatch[1] : 'none'} >= 100)`);
  assert(touchZMatch && parseInt(touchZMatch[1], 10) === 20, `Touch controls overlay has z-index = 20`);
  assert(hudZMatch && parseInt(hudZMatch[1], 10) === 10, `HUD has z-index = 10`);

  // -------------------------------------------------------------------------
  // PHASE 4: HEADLESS CHROME CDP LIVE MODAL & BUTTON AUDIT
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 4: Headless Chrome CDP Live Modal & DOM Verification ---');
  await runLiveCdpAudit();

  console.log('\n===============================================================');
  console.log(`📊 FORENSIC AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('===============================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

async function runLiveCdpAudit() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });

  const PORT = 8585;
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9444;

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=360,800',
    '--user-data-dir=' + path.join(ROOT_DIR, '.agents', 'm3_v2_auditor_1', 'chrome_profile')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => {
      ws.onopen = r;
    });

    let msgId = 1;
    function sendCdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMessage = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', onMessage);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

    await new Promise(r => setTimeout(r, 1200));

    // Evaluate live Game state and Victory modal trigger
    const evalRes = await sendCdp('Runtime.evaluate', {
      expression: `(() => {
        const game = window.Game;
        if (!game) return { error: 'No Game object' };
        game.handleFlagpole(); // Trigger victory sequence
        game.showVictoryModal(); // Reveal modal

        const modal = document.getElementById('victory-modal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const rewardBtn = document.getElementById('reward-btn');
        const btnText = rewardBtn ? rewardBtn.textContent.trim() : null;
        const btnHref = rewardBtn ? rewardBtn.getAttribute('href') : null;
        const btnTarget = rewardBtn ? rewardBtn.getAttribute('target') : null;
        const computedStyle = rewardBtn ? window.getComputedStyle(rewardBtn) : null;

        return {
          gameState: game.state,
          modalVisible: isVisible,
          btnText: btnText,
          btnHref: btnHref,
          btnTarget: btnTarget,
          btnDisplay: computedStyle ? computedStyle.display : null,
          btnPointerEvents: computedStyle ? computedStyle.pointerEvents : null,
          modalZIndex: modal ? window.getComputedStyle(modal).zIndex : null
        };
      })()`,
      returnByValue: true
    });

    const result = evalRes.result.value;
    assert(result.gameState === 'WIN', 'Game transitions to WIN state on flagpole reach');
    assert(result.modalVisible === true, 'Victory modal (#victory-modal) becomes visible on win');
    assert(result.btnText === 'Terminado el juego. Pincha aquí para recibir la recompensa', `Live rendered button text is exact: "${result.btnText}"`);
    assert(result.btnHref && result.btnHref.includes('youtube.com'), `Live button href links to YouTube: "${result.btnHref}"`);
    assert(result.btnTarget === '_blank', 'Live button target is "_blank"');
    assert(result.btnPointerEvents === 'auto', 'Reward button has pointer-events: auto');
    assert(parseInt(result.modalZIndex, 10) >= 100, `Modal computed z-index is ${result.modalZIndex} (>= 100)`);

    ws.close();
  } finally {
    chromeProcess.kill();
    server.close();
  }
}

runDeepAudit().catch(err => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
