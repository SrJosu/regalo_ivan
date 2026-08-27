/**
 * test/test_m2_reviewer2_adversarial.mjs
 *
 * Adversarial Stress & Integrity Test Suite for Milestone 2 (Meme Audio Synthesis Engine)
 * Author: Reviewer 2 / Critic
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('===============================================================');
console.log('🛡️ M2 REVIEWER 2 ADVERSARIAL STRESS & INTEGRITY SUITE');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function runTest(id, name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ [${id}] ${name}`);
  } catch (err) {
    console.error(`  ❌ [${id}] FAIL: ${name} — ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Zero External Asset & Zero Network Request Verification
// -----------------------------------------------------------------------------
runTest('ADV-1', 'Source code integrity: Zero external audio files or network fetch calls', () => {
  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');

  // Verify no external audio file extensions referenced
  const forbiddenExts = /\.(mp3|wav|ogg|aac|flac|m4a|weba)/i;
  assert(!forbiddenExts.test(audioCode), 'js/audio.js must not reference any external audio files');

  // Verify no network request APIs used
  const networkApis = /(fetch\(|XMLHttpRequest|axios|\.open\(|\.src\s*=|new\s+Audio\(|WebSocket)/;
  assert(!networkApis.test(audioCode), 'js/audio.js must not make any network requests');

  // Verify no fake dummy implementation / bypasses
  assert(audioCode.includes('createOscillator'), 'Must contain genuine oscillator nodes');
  assert(audioCode.includes('createBiquadFilter'), 'Must contain genuine filter nodes');
  assert(audioCode.includes('createDynamicsCompressor'), 'Must contain master dynamics compressor');
});

// -----------------------------------------------------------------------------
// SECTION 2: Headless Node.js Environment (AudioContext is completely undefined)
// -----------------------------------------------------------------------------
runTest('ADV-2', 'Headless safety: Calling all methods when AudioContext is undefined', () => {
  // Clear any global AudioContext
  delete global.AudioContext;
  delete global.webkitAudioContext;
  delete globalThis.AudioContext;
  delete globalThis.webkitAudioContext;

  // Dynamically re-require or use fresh context
  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const sandbox = {};
  const runFn = new Function('global', 'module', 'exports', audioCode);
  const fakeModule = { exports: {} };
  runFn(sandbox, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  assert.doesNotThrow(() => {
    AudioEngine.init();
    AudioEngine.unlockAudio();
    AudioEngine.playJump();
    AudioEngine.playCoin();
    AudioEngine.playStomp();
    AudioEngine.playBump();
    AudioEngine.playDeath();
    AudioEngine.playWin();
    AudioEngine.playAirhorn();
    AudioEngine.playBruh();
    AudioEngine.playTone(440, 880, 'square', 0.1);
  });
});

// -----------------------------------------------------------------------------
// SECTION 3: AudioContext Constructor Throws (e.g. system resource exhaustion)
// -----------------------------------------------------------------------------
runTest('ADV-3', 'Resilience: AudioContext constructor throws exception', () => {
  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const fakeGlobal = {
    AudioContext: function() {
      throw new Error('Hardware audio device busy or permission denied');
    }
  };
  const fakeModule = { exports: {} };
  const runFn = new Function('global', 'window', 'globalThis', 'module', 'exports', audioCode);
  runFn(fakeGlobal, fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  assert.doesNotThrow(() => {
    AudioEngine.init();
    AudioEngine.unlockAudio();
    AudioEngine.playJump();
    AudioEngine.playCoin();
    AudioEngine.playWin();
  }, 'Audio methods must survive AudioContext constructor throwing');
});

// -----------------------------------------------------------------------------
// SECTION 4: AudioContext Suspended State (Browser Autoplay Policy Safety)
// -----------------------------------------------------------------------------
runTest('ADV-4', 'Browser Autoplay Policy: Suspended AudioContext causes safe no-op', () => {
  let createdVoiceNodes = 0;
  class SuspendedAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 10.0;
      this.destination = {};
    }
    createOscillator() { createdVoiceNodes++; return {}; }
    createGain() { return { gain: { setValueAtTime: () => {} }, connect: () => {} }; }
    createBiquadFilter() { createdVoiceNodes++; return {}; }
    createDynamicsCompressor() {
      return {
        threshold: { setValueAtTime: () => {} },
        knee: { setValueAtTime: () => {} },
        ratio: { setValueAtTime: () => {} },
        attack: { setValueAtTime: () => {} },
        release: { setValueAtTime: () => {} },
        connect: () => {}
      };
    }
    async resume() {
      // Simulate rejection or still suspended
      throw new Error('Autoplay blocked');
    }
  }

  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const fakeGlobal = {
    AudioContext: SuspendedAudioContext
  };
  const fakeModule = { exports: {} };
  const runFn = new Function('global', 'window', 'globalThis', 'module', 'exports', audioCode);
  runFn(fakeGlobal, fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  // When suspended, calling play methods should NOT create voice synthesis nodes and should NOT throw
  AudioEngine.playJump();
  AudioEngine.playCoin();
  AudioEngine.playStomp();
  AudioEngine.playWin();
  AudioEngine.playDeath();
  AudioEngine.playAirhorn();
  AudioEngine.playBruh();
  assert.equal(createdVoiceNodes, 0, 'No voice synthesis nodes should be allocated while context is suspended');
});

// -----------------------------------------------------------------------------
// SECTION 5: W3C Exponential Ramp Positive Floor Strictness
// -----------------------------------------------------------------------------
runTest('ADV-5', 'W3C Standard Conformance: Strict positive floor on all exponential ramps', () => {
  let rampViolations = 0;

  class Param {
    setValueAtTime(v) {}
    linearRampToValueAtTime(v) {}
    exponentialRampToValueAtTime(val, time) {
      if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        rampViolations++;
        throw new RangeError(`W3C Violation: exponentialRamp value must be strictly positive (> 0), got: ${val}`);
      }
    }
  }

  class MockNode {
    constructor() {
      this.frequency = new Param();
      this.gain = new Param();
      this.Q = new Param();
    }
    connect() { return this; }
    disconnect() {}
    start() {}
    stop() {}
  }

  class StrictAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.destination = new MockNode();
    }
    createOscillator() { return new MockNode(); }
    createGain() { return new MockNode(); }
    createBiquadFilter() { return new MockNode(); }
    createDynamicsCompressor() {
      const comp = new MockNode();
      comp.threshold = new Param();
      comp.knee = new Param();
      comp.ratio = new Param();
      comp.attack = new Param();
      comp.release = new Param();
      return comp;
    }
    createBuffer() { return {}; }
    createBufferSource() { return new MockNode(); }
  }

  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const fakeGlobal = { AudioContext: StrictAudioContext };
  const fakeModule = { exports: {} };
  const runFn = new Function('global', 'window', 'globalThis', 'module', 'exports', audioCode);
  runFn(fakeGlobal, fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  // Test every sound trigger
  AudioEngine.playJump();
  AudioEngine.playCoin();
  AudioEngine.playStomp();
  AudioEngine.playBump();
  AudioEngine.playDeath();
  AudioEngine.playWin();
  AudioEngine.playAirhorn();
  AudioEngine.playBruh();

  // Test playTone with adversarial inputs
  AudioEngine.playTone(0, 0, 'square', 0.1, 0, 0); // 0 volume & 0 frequency
  AudioEngine.playTone(-100, -500, 'sawtooth', 0.1, -1, -0.5); // Negative volume & frequency

  assert.equal(rampViolations, 0, `Detected ${rampViolations} W3C exponential ramp violations`);
});

// -----------------------------------------------------------------------------
// SECTION 6: Polyphony & High-Frequency Stress Test (500 Concurrent Triggers)
// -----------------------------------------------------------------------------
runTest('ADV-6', 'Stress: 500 rapid polyphonic triggers in tight loop', () => {
  class MockParam {
    setValueAtTime() {}
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime(val) {
      if (val <= 0) throw new RangeError('Value must be > 0');
    }
  }
  class MockNode {
    constructor() {
      this.frequency = new MockParam();
      this.gain = new MockParam();
      this.Q = new MockParam();
      this.threshold = new MockParam();
      this.knee = new MockParam();
      this.ratio = new MockParam();
      this.attack = new MockParam();
      this.release = new MockParam();
    }
    connect() { return this; }
    disconnect() {}
    start() {}
    stop() {}
  }
  class RunningCtx {
    constructor() {
      this.state = 'running';
      this.currentTime = 100.0;
      this.destination = new MockNode();
    }
    createOscillator() { return new MockNode(); }
    createGain() { return new MockNode(); }
    createBiquadFilter() { return new MockNode(); }
    createDynamicsCompressor() { return new MockNode(); }
    createBuffer() { return {}; }
    createBufferSource() { return new MockNode(); }
  }

  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const fakeGlobal = { AudioContext: RunningCtx };
  const fakeModule = { exports: {} };
  const runFn = new Function('global', 'window', 'globalThis', 'module', 'exports', audioCode);
  runFn(fakeGlobal, fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  const tStart = Date.now();
  for (let i = 0; i < 100; i++) {
    AudioEngine.playJump();
    AudioEngine.playCoin();
    AudioEngine.playStomp();
    AudioEngine.playBump();
    AudioEngine.playAirhorn();
  }
  const elapsed = Date.now() - tStart;
  console.log(`     -> 500 audio triggers scheduled in ${elapsed}ms (${(elapsed / 500).toFixed(4)}ms/trigger)`);
  assert(elapsed < 200, `Scheduling 500 triggers took too long: ${elapsed}ms`);
});

// -----------------------------------------------------------------------------
// SECTION 7: Multi-gesture Event Listener Cleanup Test
// -----------------------------------------------------------------------------
runTest('ADV-7', 'Clean Lifecycle: Gesture unlock removes all event listeners', () => {
  const registeredListeners = new Map();
  const fakeWindow = {
    addEventListener(evt, handler, options) {
      registeredListeners.set(evt, handler);
    },
    removeEventListener(evt, handler) {
      registeredListeners.delete(evt);
    },
    AudioContext: class {
      constructor() {
        this.state = 'suspended';
        this.destination = {};
      }
      createDynamicsCompressor() {
        return {
          threshold: { setValueAtTime: () => {} },
          knee: { setValueAtTime: () => {} },
          ratio: { setValueAtTime: () => {} },
          attack: { setValueAtTime: () => {} },
          release: { setValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createGain() {
        return { gain: { setValueAtTime: () => {} }, connect: () => {} };
      }
      async resume() { this.state = 'running'; }
      createBuffer() { return {}; }
      createBufferSource() {
        return { connect: () => {}, start: () => {} };
      }
    }
  };

  const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf-8');
  const fakeModule = { exports: {} };
  const runFn = new Function('global', 'window', 'globalThis', 'module', 'exports', audioCode);
  runFn(fakeWindow, fakeWindow, fakeWindow, fakeModule, fakeModule.exports);
  const AudioEngine = fakeModule.exports;

  AudioEngine.init();
  assert.equal(registeredListeners.size, 5, 'Should have attached 5 unlock gesture listeners');

  // Trigger one of the listeners (e.g. touchstart)
  const touchHandler = registeredListeners.get('touchstart');
  assert(typeof touchHandler === 'function', 'touchstart handler must be registered');
  touchHandler();

  assert.equal(registeredListeners.size, 0, 'All gesture unlock listeners must be cleanly removed on first interaction');
});

console.log('\n===============================================================');
console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
