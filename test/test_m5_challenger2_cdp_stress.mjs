/**
 * test/test_m5_challenger2_cdp_stress.mjs
 *
 * EMPIRICAL CHALLENGER 2 - Milestone 5 Live Browser CDP & Victory Modal Stress Suite
 *
 * Probes and asserts:
 * 1. 0 Console errors, 0 console warnings, 0 uncaught exceptions, 0 network 404s.
 * 2. Victory state reveals #victory-modal in DOM.
 * 3. #reward-btn exact text: "Terminado el juego. Pincha aquí para recibir la recompensa".
 * 4. #reward-btn href starts with "https://www.youtube.com/watch?v=", target="_blank", rel="noopener noreferrer".
 * 5. #btn-replay resets game cleanly, re-hides modal, and withstands 25x rapid victory-replay loops.
 * 6. Adversarial event abuse (ghost clicks, multi-touch collisions, double flagpole triggers).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 8585;
const CDP_PORT = 9444;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome or Edge browser found.');
}

function startHttpServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      if (reqPath === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }
      const filePath = path.join(rootDir, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(`CDP Error (${msg.id}): ${JSON.stringify(msg.error)}`));
          } else {
            resolve(msg.result);
          }
        } else if (msg.method) {
          const handlers = this.eventListeners.get(msg.method) || [];
          handlers.forEach(h => h(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Evaluation Exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runChallenger2CDPStressSuite() {
  console.log('======================================================================');
  console.log('⚔️  CHALLENGER 2: ADVERSARIAL LIVE CDP & VICTORY MODAL STRESS SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assertTest(desc, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc} | Details: ${details}`);
      throw new Error(`Assertion failed: ${desc} -> ${details}`);
    }
  }

  const chromePath = findChrome();
  console.log(`[Browser Path] ${chromePath}`);

  const server = await startHttpServer();
  console.log(`[HTTP Server] Running at http://127.0.0.1:${PORT}`);

  const tempProfile = path.join(__dirname, '.chrome-challenger2-profile');
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=360,800',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--disable-background-networking',
    `--user-data-dir=${tempProfile}`
  ];

  const chromeProcess = spawn(chromePath, chromeArgs, { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProcess.kill('SIGKILL'); } catch (e) {}
    try { server.close(); } catch (e) {}
    try {
      if (fs.existsSync(tempProfile)) fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  // Connect to CDP
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
      const data = await res.json();
      if (data && data.webSocketDebuggerUrl) {
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const list = await res.json();
        const page = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (e2) {}
    }
  }

  if (!wsUrl) {
    cleanup();
    throw new Error('Could not establish CDP debugger WebSocket.');
  }

  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  const consoleErrors = [];
  const consoleWarnings = [];
  const uncaughtExceptions = [];
  const network404s = [];
  const networkErrors = [];

  cdp.on('Runtime.consoleAPICalled', params => {
    const text = params.args.map(a => a.value || JSON.stringify(a)).join(' ');
    if (params.type === 'error') {
      consoleErrors.push(text);
    } else if (params.type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  cdp.on('Runtime.exceptionThrown', params => {
    const text = params.exceptionDetails.text + (params.exceptionDetails.exception?.description || '');
    uncaughtExceptions.push(text);
  });

  cdp.on('Network.responseReceived', params => {
    const { response } = params;
    if (response.status >= 400) {
      const err = `${response.status} ${response.statusText}: ${response.url}`;
      if (response.status === 404) network404s.push(err);
      networkErrors.push(err);
    }
  });

  cdp.on('Network.loadingFailed', params => {
    if (!params.canceled) {
      networkErrors.push(`${params.errorText}: ${params.requestId}`);
    }
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Network.enable');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5
  });

  // Navigate
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n--- SECTION 1: Baseline Network & Console Hygiene ---');
  assertTest('Initial load produces 0 console errors', consoleErrors.length === 0, JSON.stringify(consoleErrors));
  assertTest('Initial load produces 0 console warnings', consoleWarnings.length === 0, JSON.stringify(consoleWarnings));
  assertTest('Initial load produces 0 uncaught runtime exceptions', uncaughtExceptions.length === 0, JSON.stringify(uncaughtExceptions));
  assertTest('Initial load produces 0 network 404s', network404s.length === 0, JSON.stringify(network404s));
  assertTest('Initial load produces 0 network loading failures', networkErrors.length === 0, JSON.stringify(networkErrors));

  console.log('\n--- SECTION 2: Initial DOM & Victory Modal Elements Audit ---');
  const domAudit = await cdp.eval(`(() => {
    const modal = document.getElementById('victory-modal');
    const rewardBtn = document.getElementById('reward-btn');
    const replayBtn = document.getElementById('btn-replay');
    const winScore = document.getElementById('win-score');
    const winCoins = document.getElementById('win-coins');
    const winTime = document.getElementById('win-time');

    return {
      modalExists: Boolean(modal),
      modalIsHidden: modal ? modal.classList.contains('hidden') : false,
      modalRole: modal ? modal.getAttribute('role') : null,
      modalAriaModal: modal ? modal.getAttribute('aria-modal') : null,
      rewardBtnExists: Boolean(rewardBtn),
      rewardBtnTag: rewardBtn ? rewardBtn.tagName.toLowerCase() : null,
      rewardBtnHref: rewardBtn ? rewardBtn.getAttribute('href') : null,
      rewardBtnTarget: rewardBtn ? rewardBtn.getAttribute('target') : null,
      rewardBtnRel: rewardBtn ? rewardBtn.getAttribute('rel') : null,
      rewardBtnText: rewardBtn ? rewardBtn.textContent.trim() : null,
      rewardBtnInnerText: rewardBtn ? rewardBtn.innerText.trim() : null,
      replayBtnExists: Boolean(replayBtn),
      winScoreExists: Boolean(winScore),
      winCoinsExists: Boolean(winCoins),
      winTimeExists: Boolean(winTime)
    };
  })()`);

  assertTest('#victory-modal element exists in DOM', domAudit.modalExists === true);
  assertTest('#victory-modal has initial class "hidden"', domAudit.modalIsHidden === true);
  assertTest('#victory-modal has role="dialog"', domAudit.modalRole === 'dialog');
  assertTest('#victory-modal has aria-modal="true"', domAudit.modalAriaModal === 'true');
  assertTest('#reward-btn element exists in DOM', domAudit.rewardBtnExists === true);
  assertTest('#reward-btn is an anchor <a> element', domAudit.rewardBtnTag === 'a');
  assertTest('#reward-btn href starts with "https://www.youtube.com/watch?v="', 
    domAudit.rewardBtnHref && domAudit.rewardBtnHref.startsWith('https://www.youtube.com/watch?v='));
  assertTest('#reward-btn target is "_blank"', domAudit.rewardBtnTarget === '_blank');
  assertTest('#reward-btn rel contains "noopener" and "noreferrer"', 
    domAudit.rewardBtnRel && domAudit.rewardBtnRel.includes('noopener') && domAudit.rewardBtnRel.includes('noreferrer'));

  const REQUIRED_REWARD_TEXT = 'Terminado el juego. Pincha aquí para recibir la recompensa';
  assertTest(`Reward button textContent matches EXACT required string: "${REQUIRED_REWARD_TEXT}"`, 
    domAudit.rewardBtnText === REQUIRED_REWARD_TEXT, `Actual textContent: "${domAudit.rewardBtnText}"`);
  assertTest(`Reward button innerText matches EXACT required string: "${REQUIRED_REWARD_TEXT}"`, 
    domAudit.rewardBtnInnerText === REQUIRED_REWARD_TEXT, `Actual innerText: "${domAudit.rewardBtnInnerText}"`);

  assertTest('#btn-replay element exists in DOM', domAudit.replayBtnExists === true);
  assertTest('Victory stats elements (#win-score, #win-coins, #win-time) exist', 
    domAudit.winScoreExists && domAudit.winCoinsExists && domAudit.winTimeExists);

  console.log('\n--- SECTION 3: Live Gameplay Progression to Natural Victory State ---');
  // Teleport player right to flagpole contact zone and simulate active movement
  const victoryProgression = await cdp.eval(`(() => {
    return new Promise(resolve => {
      // Set test stats
      window.Game.score = 3500;
      window.Game.coins = 7;
      
      // Position player right at flagpole trigger
      const flagX = window.Game.level.flagpole.x;
      window.Game.player.x = flagX - 4;
      window.Game.player.y = 100; // mid-air near pole
      
      // Dispatch right arrow press
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight' }));

      // Advance loop ticks to trigger flagpole collision and modal reveal
      let ticks = 0;
      const interval = setInterval(() => {
        ticks++;
        window.Game.update(0.04);

        if (window.Game.state === 'WIN' && window.Game.modalRevealed) {
          clearInterval(interval);
          window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', key: 'ArrowRight' }));

          const modal = document.getElementById('victory-modal');
          const winScore = document.getElementById('win-score')?.textContent;
          const winCoins = document.getElementById('win-coins')?.textContent;
          const winTime = document.getElementById('win-time')?.textContent;

          resolve({
            success: true,
            ticks,
            state: window.Game.state,
            modalRevealed: window.Game.modalRevealed,
            modalIsHidden: modal.classList.contains('hidden'),
            winScore,
            winCoins,
            winTime,
            score: window.Game.score
          });
        }

        if (ticks > 120) {
          clearInterval(interval);
          window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', key: 'ArrowRight' }));
          resolve({ success: false, ticks, state: window.Game.state, modalRevealed: window.Game.modalRevealed });
        }
      }, 15);
    });
  })()`);

  assertTest('Natural movement into flagpole triggers WIN state', victoryProgression.success === true && victoryProgression.state === 'WIN');
  assertTest('#victory-modal is revealed (.hidden removed) upon victory sequence', 
    victoryProgression.modalRevealed === true && victoryProgression.modalIsHidden === false);
  assertTest('Score updated with flagpole bonus (+1000)', victoryProgression.score === 4500);
  assertTest('Modal stats #win-score displays formatted score "004500"', victoryProgression.winScore === '004500');
  assertTest('Modal stats #win-coins displays formatted cake count "07"', victoryProgression.winCoins === '07');

  console.log('\n--- SECTION 4: Replay Button DOM Interaction & Game Reset ---');
  const replayReset = await cdp.eval(`(() => {
    const replayBtn = document.getElementById('btn-replay');
    const modal = document.getElementById('victory-modal');

    // Trigger click on replay button
    replayBtn.click();

    return {
      stateAfter: window.Game.state,
      modalIsHiddenAfter: modal.classList.contains('hidden'),
      modalRevealedAfter: window.Game.modalRevealed,
      scoreAfter: window.Game.score,
      coinsAfter: window.Game.coins,
      livesAfter: window.Game.lives,
      playerX: window.Game.player ? window.Game.player.x : null,
      playerY: window.Game.player ? window.Game.player.y : null,
      playerState: window.Game.player ? window.Game.player.state : null,
      goombasCount: window.Game.goombas ? window.Game.goombas.length : 0,
      coinsCount: window.Game.coinsList ? window.Game.coinsList.length : 0
    };
  })()`);

  assertTest('Clicking #btn-replay transitions Game.state back to "PLAYING"', replayReset.stateAfter === 'PLAYING');
  assertTest('Clicking #btn-replay immediately adds "hidden" class to #victory-modal', replayReset.modalIsHiddenAfter === true);
  assertTest('Clicking #btn-replay resets modalRevealed flag to false', replayReset.modalRevealedAfter === false);
  assertTest('Clicking #btn-replay resets score to 0', replayReset.scoreAfter === 0);
  assertTest('Clicking #btn-replay resets coins to 0', replayReset.coinsAfter === 0);
  assertTest('Clicking #btn-replay resets lives to 3', replayReset.livesAfter === 3);
  assertTest('Player position reset to starting spawn X=40', replayReset.playerX === 40);
  assertTest('Player state reset to IDLE', replayReset.playerState === 'IDLE');
  assertTest('Enemies and Coins respawned across level layout', replayReset.goombasCount > 0 && replayReset.coinsCount > 0);

  console.log('\n--- SECTION 5: Adversarial Stress (25x Rapid Win-Replay Cycles & Event Flooding) ---');
  const stressResults = await cdp.eval(`(() => {
    const replayBtn = document.getElementById('btn-replay');
    const modal = document.getElementById('victory-modal');
    const rewardBtn = document.getElementById('reward-btn');

    let errors = [];

    for (let cycle = 1; cycle <= 25; cycle++) {
      // 1. Simulate win
      window.Game.handleFlagpole();
      for (let f = 0; f < 45; f++) {
        window.Game.update(0.05);
      }

      if (!window.Game.modalRevealed || modal.classList.contains('hidden')) {
        errors.push(\`Cycle \${cycle}: Modal failed to reveal during win\`);
      }

      // 2. Adversarial: flood touch and click events on replay button
      const touch = new Touch({ identifier: 500 + cycle, target: replayBtn, clientX: 180, clientY: 450 });
      const touchEv = new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [touch] });
      replayBtn.dispatchEvent(touchEv);
      replayBtn.click(); // synthetic click follow-up

      if (window.Game.state !== 'PLAYING' || !modal.classList.contains('hidden')) {
        errors.push(\`Cycle \${cycle}: Modal failed to hide after replay\`);
      }
      if (window.Game.score !== 0 || window.Game.coins !== 0) {
        errors.push(\`Cycle \${cycle}: Score or coins failed to reset (score=\${window.Game.score}, coins=\${window.Game.coins})\`);
      }
    }

    // Adversarial: Test double flagpole trigger in single frame
    window.Game.handleFlagpole();
    window.Game.handleFlagpole(); // repeated call
    const stateAfterDoubleFlag = window.Game.state;

    // Reset clean
    replayBtn.click();

    return {
      errors,
      finalState: window.Game.state,
      stateAfterDoubleFlag,
      modalIsHiddenFinal: modal.classList.contains('hidden'),
      rewardHrefFinal: rewardBtn.getAttribute('href'),
      rewardTextFinal: rewardBtn.textContent.trim()
    };
  })()`);

  assertTest('25x Rapid Win-Replay cycles completed with zero state corruption errors', 
    stressResults.errors.length === 0, JSON.stringify(stressResults.errors));
  assertTest('Double flagpole trigger handled gracefully without state desync', stressResults.stateAfterDoubleFlag === 'WIN');
  assertTest('Final state after stress cycle is cleanly "PLAYING"', stressResults.finalState === 'PLAYING');
  assertTest('Victory modal remains hidden after final replay', stressResults.modalIsHiddenFinal === true);
  assertTest('Reward button href remains intact after stress testing', stressResults.rewardHrefFinal.startsWith('https://www.youtube.com/watch?v='));
  assertTest(`Reward button text remains EXACT: "${REQUIRED_REWARD_TEXT}"`, stressResults.rewardTextFinal === REQUIRED_REWARD_TEXT);

  console.log('\n--- SECTION 6: Post-Stress Console & Exception Verification ---');
  assertTest('Cumulative console errors across all live tests is ZERO (0)', consoleErrors.length === 0, `Errors: ${JSON.stringify(consoleErrors)}`);
  assertTest('Cumulative uncaught exceptions across all live tests is ZERO (0)', uncaughtExceptions.length === 0, `Exceptions: ${JSON.stringify(uncaughtExceptions)}`);
  assertTest('Cumulative network 404s across all live tests is ZERO (0)', network404s.length === 0, `404s: ${JSON.stringify(network404s)}`);
  assertTest('Cumulative network errors across all live tests is ZERO (0)', networkErrors.length === 0, `Network errors: ${JSON.stringify(networkErrors)}`);

  console.log('\n======================================================================');
  console.log(`📊 CHALLENGER 2 STRESS SUITE SUMMARY:`);
  console.log(`   Passed: ${passed} / ${total}`);
  console.log(`   Failed: ${total - passed}`);
  console.log('======================================================================\n');

  cdp.close();
  cleanup();

  if (passed === total) {
    console.log('🏆 CHALLENGER 2 VERDICT: APPROVE (100% Empirically Verified in Live CDP)');
    process.exit(0);
  } else {
    console.error('❌ CHALLENGER 2 VERDICT: REQUEST_CHANGES');
    process.exit(1);
  }
}

runChallenger2CDPStressSuite().catch(err => {
  console.error('\n❌ Unhandled Challenger 2 Error:\n', err);
  process.exit(1);
});
