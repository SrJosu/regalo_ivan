import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('  HEADLESS CHROME BROWSER VALIDATION FOR M1 ASSETS  ');
console.log('====================================================\n');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9333;

const testHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>M1 Asset Browser Test</title>
</head>
<body>
  <h1>M1 Asset Browser Test</h1>
  <canvas id="test-canvas" width="320" height="240"></canvas>
  <script src="/js/assets.js"></script>
  <script>
    window.testResults = {
      started: true,
      logs: [],
      errors: [],
      passed: false
    };

    window.onerror = function(msg, url, line, col, error) {
      window.testResults.errors.push({ msg: String(msg), url: String(url), line, col, stack: error ? error.stack : null });
      console.error('Window Error:', msg, 'at line', line);
    };

    window.addEventListener('unhandledrejection', function(event) {
      window.testResults.errors.push({ msg: 'Unhandled Rejection: ' + String(event.reason), stack: event.reason?.stack });
      console.error('Unhandled Rejection:', event.reason);
    });

    async function runBrowserAssetTest() {
      try {
        console.log('1. Checking GameAssets existence...');
        if (!window.GameAssets) throw new Error('window.GameAssets is not defined');
        if (window.GameAssets.isReady !== false) throw new Error('GameAssets.isReady should be false before init()');

        console.log('2. Initializing GameAssets in native browser context...');
        await window.GameAssets.init();
        if (window.GameAssets.isReady !== true) throw new Error('GameAssets.isReady should be true after init()');

        console.log('3. Validating sprite rasterization on native HTML5 Canvas...');
        const categories = ['player', 'enemy', 'item', 'tile'];
        let spriteCount = 0;
        for (const cat of categories) {
          const sprites = window.GameAssets.sprites[cat];
          if (!sprites) throw new Error('Category ' + cat + ' missing from GameAssets.sprites');
          for (const [name, canvas] of Object.entries(sprites)) {
            spriteCount++;
            if (!(canvas instanceof HTMLCanvasElement) && !(canvas instanceof OffscreenCanvas)) {
              throw new Error('Sprite ' + cat + '.' + name + ' is not an HTMLCanvasElement/OffscreenCanvas');
            }
            if (canvas.width !== 16 || canvas.height !== 16) {
              throw new Error('Sprite ' + cat + '.' + name + ' dimensions are not 16x16: ' + canvas.width + 'x' + canvas.height);
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Sprite ' + cat + '.' + name + ' 2D context unavailable');
          }
        }
        console.log('   -> Successfully verified ' + spriteCount + ' native canvas sprites.');

        console.log('4. Testing drawSprite on active DOM canvas...');
        const domCanvas = document.getElementById('test-canvas');
        const domCtx = domCanvas.getContext('2d');
        domCtx.imageSmoothingEnabled = false;

        const playerStates = ['idle', 'run_1', 'run_2', 'run_3', 'jump', 'skid', 'flag', 'die'];
        playerStates.forEach((state, idx) => {
          window.GameAssets.drawSprite(domCtx, 'player', state, idx * 20, 10, 16, 16, false);
          window.GameAssets.drawSprite(domCtx, 'player', state, idx * 20, 30, 16, 16, true);
        });

        window.GameAssets.drawSprite(domCtx, 'enemy', 'walk_1', 10, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'enemy', 'walk_2', 30, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'enemy', 'squash', 50, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'item', 'coin_1', 80, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'item', 'coin_2', 100, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'item', 'coin_3', 120, 60, 16, 16, false);
        window.GameAssets.drawSprite(domCtx, 'item', 'coin_4', 140, 60, 16, 16, false);

        const tiles = ['ground', 'ground_filler', 'brick', 'question_1', 'question_2', 'question_3', 'empty', 'pipe_tl', 'pipe_tr', 'pipe_bl', 'pipe_br'];
        tiles.forEach((t, idx) => {
          window.GameAssets.drawSprite(domCtx, 'tile', t, (idx % 8) * 20, 90 + Math.floor(idx / 8) * 20, 16, 16);
        });

        console.log('5. Checking rendered pixel data from DOM canvas...');
        const pixelData = domCtx.getImageData(0, 0, 320, 240);
        let opaquePixels = 0;
        for (let i = 3; i < pixelData.data.length; i += 4) {
          if (pixelData.data[i] > 0) opaquePixels++;
        }
        if (opaquePixels < 1000) throw new Error('Expected at least 1000 opaque rendered pixels, got ' + opaquePixels);
        console.log('   -> Verified ' + opaquePixels + ' opaque pixels drawn without errors.');

        window.testResults.passed = true;
        console.log('>>> ALL BROWSER ASSET TESTS COMPLETED SUCCESSFULLY <<<');
      } catch (e) {
        window.testResults.errors.push({ msg: e.message, stack: e.stack });
        console.error('Browser Test Failed:', e);
      }
    }

    window.addEventListener('DOMContentLoaded', runBrowserAssetTest);
  </script>
</body>
</html>`;

const testHtmlPath = path.resolve('.agents/m1_reviewer_2/test_browser_assets.html');
fs.writeFileSync(testHtmlPath, testHtmlContent, 'utf8');

const server = http.createServer((req, res) => {
  const reqUrl = req.url.split('?')[0];
  let filePath = '';
  if (reqUrl === '/' || reqUrl === '/test_browser_assets.html') {
    filePath = testHtmlPath;
  } else if (reqUrl === '/js/assets.js' || reqUrl === '/Proyecto ivan/js/assets.js') {
    filePath = path.resolve('js/assets.js');
  } else {
    filePath = path.resolve('.' + reqUrl);
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = ext === '.html' ? 'text/html' : (ext === '.js' ? 'application/javascript' : 'text/plain');
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found: ' + reqUrl);
  }
});

server.listen(8089, async () => {
  console.log('Local test HTTP server running on http://127.0.0.1:8089/');

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=' + port,
    'http://127.0.0.1:8089/test_browser_assets.html'
  ]);

  console.log('Launched Headless Chrome on port', port);
  await new Promise(r => setTimeout(r, 2000));

  http.get(`http://127.0.0.1:${port}/json`, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const pages = JSON.parse(raw);
        console.log('Found CDP targets:', pages.length);
        const targetPage = pages.find(p => p.url.includes('test_browser_assets.html')) || pages[0];
        
        if (!targetPage || !targetPage.webSocketDebuggerUrl) {
          console.error('No target page found with webSocketDebuggerUrl');
          cleanup(1);
          return;
        }

        const ws = new globalThis.WebSocket(targetPage.webSocketDebuggerUrl);

        ws.onopen = () => {
          console.log('Connected to Chrome DevTools WebSocket.');

          let msgId = 1;
          const pendingCallbacks = new Map();

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && pendingCallbacks.has(data.id)) {
              const cb = pendingCallbacks.get(data.id);
              pendingCallbacks.delete(data.id);
              cb(data.result);
            }
          };

          function sendCommand(method, params = {}) {
            const id = msgId++;
            return new Promise((resolve) => {
              pendingCallbacks.set(id, resolve);
              ws.send(JSON.stringify({ id, method, params }));
            });
          }

          (async () => {
            await sendCommand('Runtime.enable');
            await sendCommand('Console.enable');

            await new Promise(r => setTimeout(r, 2000));

            const evalRes = await sendCommand('Runtime.evaluate', {
              expression: 'JSON.stringify(window.testResults)',
              returnByValue: true
            });

            console.log('Browser Evaluation Result:', evalRes?.result?.value);
            const results = JSON.parse(evalRes?.result?.value || '{}');

            if (results.passed && (!results.errors || results.errors.length === 0)) {
              console.log('\n====================================================');
              console.log('  HEADLESS BROWSER VERIFICATION PASSED (0 ERRORS)');
              console.log('====================================================\n');
              ws.close();
              cleanup(0);
            } else {
              console.error('\n❌ HEADLESS BROWSER VERIFICATION FAILED:', results.errors);
              ws.close();
              cleanup(1);
            }
          })();
        };

        ws.onerror = (err) => {
          console.error('WebSocket Error:', err);
          cleanup(1);
        };

      } catch (err) {
        console.error('Error querying CDP:', err);
        cleanup(1);
      }
    });
  }).on('error', (err) => {
    console.error('HTTP get CDP error:', err);
    cleanup(1);
  });

  function cleanup(code) {
    try { chromeProc.kill(); } catch (_) {}
    try { server.close(); } catch (_) {}
    process.exit(code);
  }
});
