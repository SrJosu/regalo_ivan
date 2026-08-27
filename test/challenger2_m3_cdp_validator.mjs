/**
 * test/challenger2_m3_cdp_validator.mjs - Headless Chrome CDP Live Gameplay & Visual Audit
 * Challenger 2 - Milestone 3
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
  '.png': 'image/png'
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
  throw new Error('Could not find Google Chrome or Microsoft Edge executable on system.');
}

function startHttpServer() {
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

async function runCDPValidation() {
  console.log('===============================================================');
  console.log('🌐 CHALLENGER 2: LIVE HEADLESS CDP BROWSER VERIFICATION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;
  function assertCheck(desc, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc} ${details}`);
      throw new Error(`Assertion failed: ${desc} ${details}`);
    }
  }

  const chromePath = findChrome();
  const server = await startHttpServer();

  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=360,800',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--user-data-dir=' + path.join(__dirname, '.chrome-temp-c2')
  ];

  const chromeProcess = spawn(chromePath, chromeArgs, { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProcess.kill('SIGKILL'); } catch (e) {}
    try { server.close(); } catch (e) {}
    try {
      const tempDir = path.join(__dirname, '.chrome-temp-c2');
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const newRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
      const target = await newRes.json();
      if (target && target.webSocketDebuggerUrl) {
        wsUrl = target.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    cleanup();
    throw new Error('Could not connect to CDP WebSocket endpoint');
  }

  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  const consoleErrors = [];
  cdp.on('Runtime.consoleAPICalled', params => {
    if (params.type === 'error') {
      consoleErrors.push(params.args.map(a => a.value || JSON.stringify(a)).join(' '));
    }
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Check meme enemies initialized in browser
  const memeEnemiesCheck = await cdp.eval(`(() => {
    const enemies = window.Game.goombas;
    const types = enemies.map(e => e.type);
    const hasPopCat = types.includes('popcat');
    const hasDoge = types.includes('doge');
    const hasGrumpy = types.includes('grumpy');

    return { count: enemies.length, hasPopCat, hasDoge, hasGrumpy };
  })()`);

  assertCheck('Live Game spawned at least 10 meme enemies', memeEnemiesCheck.count >= 10, `Found: ${memeEnemiesCheck.count}`);
  assertCheck('Live Game includes PopCat enemy instances', memeEnemiesCheck.hasPopCat === true);
  assertCheck('Live Game includes Doge enemy instances', memeEnemiesCheck.hasDoge === true);
  assertCheck('Live Game includes GrumpyCat enemy instances', memeEnemiesCheck.hasGrumpy === true);

  // 2. Perform live stomp in browser
  const stompSim = await cdp.eval(`(() => {
    const game = window.Game;
    const enemy = game.goombas[0]; // first popcat
    const initialScore = game.score;

    // Position player directly above enemy
    game.player.x = enemy.x;
    game.player.y = enemy.y - 14;
    game.player.vy = 180; // falling down

    // Update 1 frame
    game.update(0.016);

    const isSquashed = enemy.isSquashed;
    const playerReboundVy = game.player.vy;
    const scoreEarned = game.score - initialScore;
    const particleCount = game.particles.length;

    return {
      isSquashed,
      playerReboundVy,
      scoreEarned,
      particleCount
    };
  })()`);

  assertCheck('Live in-browser stomp squashes enemy', stompSim.isSquashed === true);
  assertCheck('Live in-browser stomp causes player rebound jump (-260 px/s)', stompSim.playerReboundVy === -260);
  assertCheck('Live in-browser stomp awards 100 points', stompSim.scoreEarned === 100);
  assertCheck('Live in-browser stomp spawns floating meme combat text & confetti particles', stompSim.particleCount > 0);

  // 3. Check Sky Banner and Roadside Signs in Level
  const bannerAndSigns = await cdp.eval(`(() => {
    const level = window.Game.level;
    const banner = level.skyBanner;
    const signs = level.signposts;

    return {
      bannerText: banner ? banner.text : null,
      signCount: signs ? signs.length : 0,
      sign1Title: signs && signs[0] ? signs[0].title : null,
      sign1Line1: signs && signs[0] ? signs[0].lines[0] : null
    };
  })()`);

  assertCheck('Floating sky banner contains "🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"', bannerAndSigns.bannerText === '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂');
  assertCheck('Roadside milestone signs count is 4', bannerAndSigns.signCount === 4);
  assertCheck('Sign 1 title is "KM 0"', bannerAndSigns.sign1Title === 'KM 0');
  assertCheck('Sign 1 contains Iván birthday text', bannerAndSigns.sign1Line1.includes('IVÁN'));

  // 4. Verify Victory Modal DOM elements & YouTube Link
  const modalCheck = await cdp.eval(`(() => {
    const modal = document.getElementById('victory-modal');
    const rewardBtn = document.getElementById('reward-btn');
    const replayBtn = document.getElementById('btn-replay');

    return {
      modalExists: Boolean(modal),
      rewardBtnExists: Boolean(rewardBtn),
      rewardHref: rewardBtn ? rewardBtn.getAttribute('href') : null,
      rewardTarget: rewardBtn ? rewardBtn.getAttribute('target') : null,
      rewardText: rewardBtn ? rewardBtn.textContent.trim() : null,
      replayBtnExists: Boolean(replayBtn)
    };
  })()`);

  assertCheck('Victory Modal (#victory-modal) exists in DOM', modalCheck.modalExists === true);
  assertCheck('Reward Button (#reward-btn) exists in DOM', modalCheck.rewardBtnExists === true);
  assertCheck('Reward Button links to YouTube video', modalCheck.rewardHref && modalCheck.rewardHref.includes('youtube.com'));
  assertCheck('Reward Button opens in new tab (_blank)', modalCheck.rewardTarget === '_blank');
  assertCheck('Reward Button has exact text "Terminado el juego. Pincha aquí para recibir la recompensa"', modalCheck.rewardText === 'Terminado el juego. Pincha aquí para recibir la recompensa');

  // 5. Check Console Errors
  assertCheck('Zero Console Errors throughout entire CDP test session', consoleErrors.length === 0, `Errors: ${JSON.stringify(consoleErrors)}`);

  console.log('\n===============================================================');
  console.log(`📊 CDP LIVE AUDIT SUMMARY: ${passed} / ${total} PASSED (100%)`);
  console.log('===============================================================\n');

  cdp.close();
  cleanup();

  if (passed === total) {
    console.log('🏆 COMPLETE HEADLESS BROWSER AUDIT: ALL MILESTONE 3 CRITERIA VERIFIED (100%)\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCDPValidation().catch(err => {
  console.error('\n❌ CDP Validation Failure:\n', err);
  process.exit(1);
});
