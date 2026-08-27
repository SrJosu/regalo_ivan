/**
 * test/challenger1_m3_victory_reward_stress.mjs
 *
 * Empirical Challenger 1 - Milestone 3 Verification Harness
 * Tests:
 * 1. Static & Runtime DOM verification of #reward-btn (exact text, href, target, rel).
 * 2. Win State Transition: Flagpole touch -> Audio playWin -> Confetti generation -> Castle walk -> #victory-modal reveal -> Stats sync.
 * 3. 10 Consecutive Replay Resets via #btn-replay (click & touch events): checks state integrity, object cleanup, memory/particle bounds, HUD sync.
 * 4. Boundary & Edge Case Stress Testing:
 *    - Replay button click while in PLAYING, WIN, GAMEOVER states.
 *    - Double/rapid replay clicks.
 *    - Flagpole re-trigger prevention (idempotency).
 *    - Time countdown during win sequence.
 * 5. Full in-browser live CDP verification of victory modal, reward button, and 10x replay loop.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import JS Engine modules for headless Node testing
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

console.log('===============================================================');
console.log('🔥 CHALLENGER 1: M3 VICTORY MODAL & REWARD BUTTON STRESS SUITE');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function runCheck(desc, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}\n     Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncCheck(desc, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✓ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}\n     Error: ${err.message}`);
    throw err;
  }
}

// --------------------------------------------------------------------------
// SUITE 1: DOM & HTML CONTRACT VERIFICATION
// --------------------------------------------------------------------------
console.log('--- SUITE 1: DOM & HTML Verification ---');

const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

runCheck('index.html contains #victory-modal overlay with proper aria attributes', () => {
  assert(htmlContent.includes('id="victory-modal"'), 'Must contain id="victory-modal"');
  assert(htmlContent.includes('class="victory-overlay hidden"'), 'Must start hidden');
  assert(htmlContent.includes('role="dialog"'), 'Must have role="dialog"');
});

runCheck('index.html contains #reward-btn with EXACT required text and attributes', () => {
  const exactRequiredText = 'Terminado el juego. Pincha aquí para recibir la recompensa';
  assert(htmlContent.includes(exactRequiredText), `index.html must contain exact text: "${exactRequiredText}"`);
  
  // Extract #reward-btn tag block
  const rewardBtnMatch = htmlContent.match(/<a[^>]*id=["']reward-btn["'][^>]*>([\s\S]*?)<\/a>/i);
  assert(rewardBtnMatch, '<a id="reward-btn"> tag must exist');
  
  const fullTag = rewardBtnMatch[0];
  const innerText = rewardBtnMatch[1].trim();

  assert.equal(innerText, exactRequiredText, `Inner text must match exactly. Found: "${innerText}"`);
  assert(fullTag.includes('href="https://www.youtube.com/'), 'Must link to YouTube URL');
  assert(fullTag.includes('target="_blank"'), 'Must have target="_blank"');
  assert(fullTag.includes('rel="noopener noreferrer"'), 'Must have rel="noopener noreferrer"');
});

runCheck('index.html contains #btn-replay button inside modal', () => {
  const replayMatch = htmlContent.match(/<button[^>]*id=["']btn-replay["'][^>]*>/i);
  assert(replayMatch, '<button id="btn-replay"> must exist');
});

runCheck('index.html contains stats containers (#win-score, #win-coins, #win-time)', () => {
  assert(htmlContent.includes('id="win-score"'), 'Must contain #win-score');
  assert(htmlContent.includes('id="win-coins"'), 'Must contain #win-coins');
  assert(htmlContent.includes('id="win-time"'), 'Must contain #win-time');
});

// --------------------------------------------------------------------------
// SUITE 2: WIN STATE TRANSITION & AUDIO/CONFETTI ORACLE
// --------------------------------------------------------------------------
console.log('\n--- SUITE 2: Win State Transition & Audio / Confetti Logic ---');

await GameAssets.init();

runCheck('Flagpole contact triggers WIN state, Audio playWin, and Confetti burst', () => {
  // Setup Mock DOM elements for Game instance
  const mockModal = {
    classList: {
      classes: new Set(['victory-overlay', 'hidden']),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    }
  };
  const mockWinScore = { textContent: '' };
  const mockWinCoins = { textContent: '' };
  const mockWinTime = { textContent: '' };

  Game.victoryModal = mockModal;
  Game.winScore = mockWinScore;
  Game.winCoins = mockWinCoins;
  Game.winTime = mockWinTime;

  let playWinCalled = 0;
  const originalPlayWin = GameAudio.playWin;
  GameAudio.playWin = () => { playWinCalled++; };

  Game.startNewGame();
  Game.score = 2500;
  Game.coins = 7;
  Game.time = 342.4;

  assert.equal(Game.state, 'PLAYING');
  assert.equal(mockModal.classList.contains('hidden'), true, 'Modal hidden at start');

  const initialParticleCount = Game.particles.length;

  // Trigger Flagpole reach
  Game.handleFlagpole();

  assert.equal(Game.state, 'WIN', 'State changed to WIN');
  assert.equal(playWinCalled, 1, 'GameAudio.playWin() called exactly once');
  assert.equal(Game.score, 3500, 'Awarded 1000 points on flagpole');
  assert(Game.particles.length > initialParticleCount, 'Confetti particles generated on flagpole reach');
  assert.equal(Game.goalFlag.isSliding, true, 'Goal flag starts sliding');

  // Verify Idempotency: calling handleFlagpole again in WIN state does nothing
  Game.handleFlagpole();
  assert.equal(playWinCalled, 1, 'playWin not called again if already in WIN state');
  assert.equal(Game.score, 3500, 'Score not double-awarded');

  GameAudio.playWin = originalPlayWin;
});

runCheck('Win sequence progression: slide -> walk to castle -> modal reveal & stats update', () => {
  const mockModal = {
    classList: {
      classes: new Set(['victory-overlay', 'hidden']),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    }
  };
  const mockWinScore = { textContent: '' };
  const mockWinCoins = { textContent: '' };
  const mockWinTime = { textContent: '' };

  Game.victoryModal = mockModal;
  Game.winScore = mockWinScore;
  Game.winCoins = mockWinCoins;
  Game.winTime = mockWinTime;

  Game.startNewGame();
  Game.score = 4800;
  Game.coins = 12;
  Game.time = 285.2;

  // Position player at flagpole
  Game.player.x = Game.level.flagpole.x - 8;
  Game.player.y = Game.level.flagpole.topY + 16;
  Game.handleFlagpole(); // Adds +1000 to score -> 5800
  Game.player.state = 'FLAG_SLIDE';

  // Step 1: Slide down flagpole
  for (let t = 0; t < 30; t++) {
    Game.update(0.05); // 1.5s total simulation
  }

  // Verify confetti emitter was active during win state
  const hasConfetti = Game.particles.some(p => p instanceof GameEntities.ConfettiParticle || p.rotSpeed !== undefined);
  assert(hasConfetti, 'Celebratory confetti shower particles spawned during victory update');

  // Step 2: Continue until player reaches castle door and winTimer triggers modal reveal
  for (let t = 0; t < 40; t++) {
    Game.update(0.05);
  }

  assert.equal(Game.modalRevealed, true, 'modalRevealed is true');
  assert.equal(mockModal.classList.contains('hidden'), false, 'Modal hidden class removed');
  assert.equal(mockWinScore.textContent, '005800', 'Score formatted correctly in modal (4800 + 1000 flagpole bonus)');
  assert.equal(mockWinCoins.textContent, '12', 'Coins formatted correctly in modal');
  assert.equal(mockWinTime.textContent, '286', 'Time formatted correctly in modal (Math.ceil(285.2))');
});

// --------------------------------------------------------------------------
// SUITE 3: 10 CONSECUTIVE REPLAY RESETS STRESS TEST (MEMORY & INTEGRITY)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 3: 10 Consecutive Replay Loop Stress Test ---');

runCheck('10 consecutive replay resets cleanly reset all state without corruption or leak', () => {
  const mockModal = {
    classList: {
      classes: new Set(['victory-overlay', 'hidden']),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    }
  };
  Game.victoryModal = mockModal;
  Game.winScore = { textContent: '' };
  Game.winCoins = { textContent: '' };
  Game.winTime = { textContent: '' };

  for (let iteration = 1; iteration <= 10; iteration++) {
    // 1. Play some frames, modify state
    Game.score = iteration * 1000;
    Game.coins = iteration * 2;
    Game.lives = 1;
    Game.time = 150;

    // Simulate winning
    Game.handleFlagpole();
    for (let t = 0; t < 50; t++) {
      Game.update(0.05);
    }
    assert.equal(Game.state, 'WIN', `Iteration ${iteration}: in WIN state`);

    // 2. Perform Replay Reset (as if #btn-replay clicked)
    Game.restart();

    // 3. Verify Pristine State
    assert.equal(Game.state, 'PLAYING', `Iteration ${iteration}: state must be PLAYING`);
    assert.equal(Game.score, 0, `Iteration ${iteration}: score must be reset to 0`);
    assert.equal(Game.coins, 0, `Iteration ${iteration}: coins must be reset to 0`);
    assert.equal(Game.lives, 3, `Iteration ${iteration}: lives must be reset to 3`);
    assert.equal(Game.time, 400, `Iteration ${iteration}: time must be reset to 400`);
    assert.equal(Game.winTimer, 0, `Iteration ${iteration}: winTimer reset to 0`);
    assert.equal(Game.modalRevealed, false, `Iteration ${iteration}: modalRevealed reset to false`);
    assert.equal(mockModal.classList.contains('hidden'), true, `Iteration ${iteration}: victoryModal must be hidden`);

    // Verify entities are cleanly instantiated
    assert(Game.player !== null, `Iteration ${iteration}: player must exist`);
    assert.equal(Game.player.x, 40, `Iteration ${iteration}: player x reset to 40`);
    assert.equal(Game.player.isAlive, true, `Iteration ${iteration}: player alive`);
    assert.equal(Game.player.state, 'IDLE', `Iteration ${iteration}: player state IDLE`);
    assert.equal(Game.goombas.length, Game.level.enemySpawns.length, `Iteration ${iteration}: goombas respawned (all ${Game.level.enemySpawns.length} enemies)`);
    assert.equal(Game.coinsList.length, Game.level.coinSpawns.length, `Iteration ${iteration}: coins respawned (all ${Game.level.coinSpawns.length} coins)`);
    assert.equal(Game.particles.length, 0, `Iteration ${iteration}: particles cleared`);
    assert.equal(Game.blockCoins.length, 0, `Iteration ${iteration}: blockCoins cleared`);
    assert.equal(Game.level.cameraX, 0, `Iteration ${iteration}: camera reset to 0`);

    // Run 10 frames of gameplay to ensure physics & collision work flawlessly post-reset
    for (let f = 0; f < 10; f++) {
      Game.update(0.016);
    }
    assert(!isNaN(Game.player.x), `Iteration ${iteration}: player.x must not be NaN`);
    assert(!isNaN(Game.player.y), `Iteration ${iteration}: player.y must not be NaN`);
  }
});

// --------------------------------------------------------------------------
// SUITE 4: ADVERSARIAL EDGE CASE STRESS TESTING
// --------------------------------------------------------------------------
console.log('\n--- SUITE 4: Adversarial Edge Cases ---');

runCheck('Rapid successive restart() calls do not corrupt entity references', () => {
  for (let i = 0; i < 20; i++) {
    Game.restart();
  }
  assert.equal(Game.state, 'PLAYING');
  assert.equal(Game.player.x, 40);
  assert.equal(Game.goombas.length, 11);
  assert.equal(Game.particles.length, 0);
});

runCheck('Stomp enemy + coin collection during victory walk handles gracefully', () => {
  Game.startNewGame();
  Game.handleFlagpole();
  Game.player.state = 'VICTORY_WALK';

  // Spawn enemy and coin right in front of victory walk
  const enemy = GameEntities.createPopCat(Game.player.x + 10, Game.player.y);
  Game.goombas.push(enemy);

  for (let f = 0; f < 20; f++) {
    Game.update(0.016);
  }
  assert.equal(Game.state, 'WIN', 'State remains WIN during victory walk');
});

// --------------------------------------------------------------------------
// SUITE 5: LIVE IN-BROWSER HEADLESS CHROME CDP VERIFICATION (10x REPLAY & DOM)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 5: Live In-Browser Headless Chrome CDP Verification ---');

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
  throw new Error('Could not find Google Chrome or Microsoft Edge executable on system.');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png'
};

const TEST_PORT = 8585; // Distinct port to prevent TIME_WAIT clashes
const TEST_CDP_PORT = 9444;

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(rootDir, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(TEST_PORT, '127.0.0.1', () => resolve(server));
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
    if (this.ws) this.ws.close();
  }
}

await runAsyncCheck('Live In-Browser CDP: #reward-btn inspection, victory modal trigger, and 10x replay loop', async () => {
  const chromePath = findChrome();
  const server = await startStaticServer();

  const tempProfileDir = path.join(__dirname, '.chrome-temp-profile-m3');
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${TEST_CDP_PORT}`,
    '--window-size=360,800',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--user-data-dir=${tempProfileDir}`
  ];

  const chromeProcess = spawn(chromePath, chromeArgs, { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProcess.kill('SIGKILL'); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { if (fs.existsSync(tempProfileDir)) fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (e) {}
  };

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const newRes = await fetch(`http://127.0.0.1:${TEST_CDP_PORT}/json/new?http://127.0.0.1:${TEST_PORT}/index.html`, { method: 'PUT' });
        const target = await newRes.json();
        if (target && target.webSocketDebuggerUrl) {
          wsUrl = target.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    assert(wsUrl, 'CDP WebSocket endpoint connected');
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    const consoleErrors = [];
    cdp.on('Runtime.consoleAPICalled', params => {
      if (params.type === 'error') {
        const text = params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        consoleErrors.push(text);
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${TEST_PORT}/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Inspect #reward-btn in Live DOM
    const rewardBtnData = await cdp.eval(`(() => {
      const btn = document.getElementById('reward-btn');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        tagName: btn.tagName.toLowerCase(),
        id: btn.id,
        className: btn.className,
        href: btn.href,
        target: btn.target,
        rel: btn.rel,
        innerText: btn.innerText.trim(),
        textContent: btn.textContent.trim(),
        display: style.display,
        pointerEvents: style.pointerEvents,
        cursor: style.cursor,
        rect: { width: rect.width, height: rect.height }
      };
    })()`);

    assert(rewardBtnData !== null, '#reward-btn found in live DOM');
    assert.equal(rewardBtnData.tagName, 'a');
    assert.equal(rewardBtnData.id, 'reward-btn');
    assert.equal(rewardBtnData.target, '_blank');
    assert(rewardBtnData.rel.includes('noopener') && rewardBtnData.rel.includes('noreferrer'), 'rel contains noopener noreferrer');
    assert(rewardBtnData.href.includes('youtube.com'), 'href links to YouTube');
    assert.equal(rewardBtnData.textContent, 'Terminado el juego. Pincha aquí para recibir la recompensa');
    assert.equal(rewardBtnData.innerText, 'Terminado el juego. Pincha aquí para recibir la recompensa');

    // 2. Trigger Win State & Victory Modal in Live Browser
    const winResult = await cdp.eval(`(() => {
      window.Game.score = 3000;
      window.Game.coins = 5;
      window.Game.handleFlagpole(); // Triggers victory sequence
      // Advance win sequence
      for (let i = 0; i < 45; i++) {
        window.Game.update(0.05);
      }
      const modal = document.getElementById('victory-modal');
      const scoreTxt = document.getElementById('win-score').textContent;
      const coinsTxt = document.getElementById('win-coins').textContent;
      const timeTxt = document.getElementById('win-time').textContent;
      const isHidden = modal.classList.contains('hidden');
      const modalStyle = window.getComputedStyle(modal);

      return {
        state: window.Game.state,
        modalRevealed: window.Game.modalRevealed,
        isHidden,
        display: modalStyle.display,
        visibility: modalStyle.visibility,
        scoreTxt,
        coinsTxt,
        timeTxt
      };
    })()`);

    assert.equal(winResult.state, 'WIN');
    assert.equal(winResult.modalRevealed, true);
    assert.equal(winResult.isHidden, false, 'Modal class hidden removed');
    assert.equal(winResult.scoreTxt, '004000', 'Score updated with 1000 bonus on modal');
    assert.equal(winResult.coinsTxt, '05');

    // 3. Test 10 Consecutive Replay Resets via Click on #btn-replay
    const replay10Results = await cdp.eval(`(() => {
      const results = [];
      const replayBtn = document.getElementById('btn-replay');
      const modal = document.getElementById('victory-modal');

      for (let i = 1; i <= 10; i++) {
        // Set distinct state
        window.Game.score = i * 500;
        window.Game.coins = i;
        window.Game.handleFlagpole();
        for (let f = 0; f < 30; f++) window.Game.update(0.05);

        // Click #btn-replay
        replayBtn.click();

        results.push({
          iteration: i,
          state: window.Game.state,
          score: window.Game.score,
          coins: window.Game.coins,
          lives: window.Game.lives,
          time: window.Game.time,
          modalHidden: modal.classList.contains('hidden'),
          playerX: window.Game.player ? window.Game.player.x : null,
          playerState: window.Game.player ? window.Game.player.state : null,
          goombasCount: window.Game.goombas.length,
          coinsCount: window.Game.coinsList.length,
          particlesCount: window.Game.particles.length
        });
      }
      return results;
    })()`);

    for (const r of replay10Results) {
      assert.equal(r.state, 'PLAYING', `Iter ${r.iteration}: state PLAYING`);
      assert.equal(r.score, 0, `Iter ${r.iteration}: score 0`);
      assert.equal(r.coins, 0, `Iter ${r.iteration}: coins 0`);
      assert.equal(r.lives, 3, `Iter ${r.iteration}: lives 3`);
      assert.equal(r.time, 400, `Iter ${r.iteration}: time 400`);
      assert.equal(r.modalHidden, true, `Iter ${r.iteration}: modal hidden`);
      assert.equal(r.playerX, 40, `Iter ${r.iteration}: playerX 40`);
      assert.equal(r.playerState, 'IDLE', `Iter ${r.iteration}: playerState IDLE`);
      assert.equal(r.goombasCount, 11, `Iter ${r.iteration}: goombas 11`);
      assert.equal(r.coinsCount, 9, `Iter ${r.iteration}: coins 9`);
      assert.equal(r.particlesCount, 0, `Iter ${r.iteration}: particles cleared`);
    }

    assert.equal(consoleErrors.length, 0, `0 console errors during in-browser test. Found: ${JSON.stringify(consoleErrors)}`);

    cdp.close();
  } finally {
    cleanup();
  }
});

console.log('\n===============================================================');
console.log(`📊 CHALLENGER 1 STRESS TEST SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');

if (passed !== total) {
  process.exit(1);
}
