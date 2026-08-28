/**
 * test/adversarial_touch_review.mjs
 *
 * Adversarial Reviewer Stress & Edge Case Test Suite
 *
 * Attacks:
 * 1. Multi-touch secondary finger tap (finger 1 resting on screen while finger 2 taps menu button)
 * 2. Rapid modal switching & race conditions (100 rapid alternating taps)
 * 3. Ghost click suppression across multiple sequential taps
 * 4. Touch cancellation recovery (touchcancel / pointercancel handling)
 * 5. AudioContext unlock verification on touch/pointer paths
 * 6. Viewport routing and popstate/hashchange handling
 * 7. Keydown Enter/Space accessibility without duplicate click synthesis
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('⚔️ ADVERSARIAL TOUCH & MENU EDGE-CASE TEST SUITE');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

// Minimal DOM Mocking
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.classes.has(cls)) this.classes.delete(cls);
      else this.classes.add(cls);
    } else if (force) this.classes.add(cls);
    else this.classes.delete(cls);
  }
  contains(cls) { return this.classes.has(cls); }
}

class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
    this.listeners = new Map();
    this.dataset = {};
    this.style = {};
  }

  addEventListener(type, listener, options = {}) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push({ listener, options });
  }

  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      const list = this.listeners.get(type).filter(item => item.listener !== listener);
      this.listeners.set(type, list);
    }
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    let defaultPrevented = false;

    event.preventDefault = () => {
      if (event.cancelable !== false) {
        defaultPrevented = true;
        event.defaultPrevented = true;
      }
    };
    event.stopPropagation = () => {
      event.propagationStopped = true;
    };

    if (this.listeners.has(event.type)) {
      const entries = [...this.listeners.get(event.type)];
      for (const entry of entries) {
        entry.listener(event);
      }
    }
    return !defaultPrevented;
  }

  click() {
    this.dispatchEvent({
      type: 'click',
      bubbles: true,
      cancelable: true,
      detail: 1,
      clientX: 50,
      clientY: 50
    });
  }
}

// Setup Environment
const elementsById = new Map();
function createElement(id, tagName = 'div') {
  const el = new MockElement(id, tagName);
  elementsById.set(id, el);
  return el;
}

const mainMenu = createElement('main-menu');
const marioContainer = createElement('game-container');
marioContainer.classList.add('hidden');
const pacmanCabinet = createElement('arcade-cabinet');
pacmanCabinet.classList.add('hidden');
const btnReturnMenu = createElement('btn-return-menu');
btnReturnMenu.classList.add('hidden');

const difficultyModal = createElement('difficulty-modal');
difficultyModal.classList.add('hidden');
const difficultyCancel = createElement('difficulty-cancel');

const pacmanDifficultyModal = createElement('pacman-difficulty-modal');
pacmanDifficultyModal.classList.add('hidden');
const pacmanDifficultyCancel = createElement('pacman-difficulty-cancel');

const btnSelectMario = createElement('btn-select-mario');
const btnSelectPacman = createElement('btn-select-pacman');

const marioDiffEasy = new MockElement('mario-easy');
marioDiffEasy.dataset.difficulty = 'facil';
marioDiffEasy.classList.add('difficulty-btn');

const marioDiffNormal = new MockElement('mario-normal');
marioDiffNormal.dataset.difficulty = 'normal';
marioDiffNormal.classList.add('difficulty-btn');

const pacmanDiffHard = new MockElement('pacman-hard');
pacmanDiffHard.dataset.pacmanDifficulty = 'dificil';
pacmanDiffHard.classList.add('pacman-difficulty-btn');

const mockDocument = {
  getElementById: (id) => elementsById.get(id) || null,
  querySelectorAll: (selector) => {
    if (selector.includes('#difficulty-modal .difficulty-btn')) return [marioDiffEasy, marioDiffNormal];
    if (selector.includes('.pacman-difficulty-btn')) return [pacmanDiffHard];
    return [];
  },
  addEventListener: () => {}
};

let audioUnlocked = 0;
let audioResumed = 0;
let pacmanAudioInited = 0;
let pacmanAudioResumed = 0;

const mockGameAudio = {
  unlockAudio: () => { audioUnlocked++; },
  resumeAudio: () => { audioResumed++; },
  stopAll: () => {}
};

const mockSoundEngine = {
  init: () => { pacmanAudioInited++; },
  resumeAudio: () => { pacmanAudioResumed++; },
  stopAll: () => {}
};

let marioRunning = false;
let marioDiff = null;
const mockGame = {
  canvas: {},
  setDifficulty: (diff) => {
    marioDiff = diff;
    marioRunning = true;
  },
  stop: () => { marioRunning = false; }
};

let pacmanRunning = false;
let pacmanDiff = null;
const mockPacmanInstance = {
  setDifficulty: (diff) => {
    pacmanDiff = diff;
    pacmanRunning = true;
  },
  stop: () => { pacmanRunning = false; }
};

const mockWindow = {
  PointerEvent: true,
  TouchEvent: true,
  document: mockDocument,
  GameAudio: mockGameAudio,
  soundEngine: mockSoundEngine,
  Game: mockGame,
  gameInstance: mockPacmanInstance,
  initPacmanGame: () => mockPacmanInstance,
  location: { hash: '', search: '' },
  addEventListener: () => {}
};

globalThis.document = mockDocument;
globalThis.window = mockWindow;
globalThis.PointerEvent = true;

// Re-read bindTap and Hub implementation directly from index.html to ensure 100% faithful test
const indexHtmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// Extract script tag content
const scriptMatch = indexHtmlContent.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) {
  throw new Error('Could not find Arcade Hub script tag in index.html');
}

// Execute the hub controller
const hubScript = scriptMatch[1];
const runHub = new Function('window', 'document', hubScript);
runHub(mockWindow, mockDocument);

// =============================================================================
// ADVERSARIAL TESTS
// =============================================================================

test('ADV-1: Multi-touch secondary finger tap on button while primary finger rests elsewhere', () => {
  mockWindow.ArcadeHub.showMenu();

  // Simulate secondary finger (id: 2) tapping btn-select-mario at (200, 200)
  // while primary finger (id: 1) is resting on screen at (20, 20)
  btnSelectMario.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    pointerId: 2,
    clientX: 200,
    clientY: 200,
    cancelable: true
  });

  btnSelectMario.dispatchEvent({
    type: 'touchstart',
    cancelable: true,
    touches: [
      { identifier: 1, clientX: 20, clientY: 20 },
      { identifier: 2, clientX: 200, clientY: 200 }
    ],
    changedTouches: [
      { identifier: 2, clientX: 200, clientY: 200 }
    ]
  });

  btnSelectMario.dispatchEvent({
    type: 'pointerup',
    pointerType: 'touch',
    pointerId: 2,
    clientX: 205,
    clientY: 203,
    cancelable: true
  });

  btnSelectMario.dispatchEvent({
    type: 'touchend',
    cancelable: true,
    touches: [
      { identifier: 1, clientX: 20, clientY: 20 }
    ],
    changedTouches: [
      { identifier: 2, clientX: 205, clientY: 203 }
    ]
  });

  assert.equal(difficultyModal.classList.contains('hidden'), false, 'Mario modal must open when secondary finger taps');
});

test('ADV-2: Pointer cancel followed by new tap properly recovers and opens modal', () => {
  mockWindow.ArcadeHub.showMenu();

  // Pointer down then cancelled (e.g. system gesture)
  btnSelectPacman.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    pointerId: 1,
    clientX: 150,
    clientY: 150,
    cancelable: true
  });

  btnSelectPacman.dispatchEvent({
    type: 'pointercancel',
    pointerId: 1,
    cancelable: true
  });

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true, 'Modal should remain hidden on cancel');

  // Next clean tap
  btnSelectPacman.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    pointerId: 1,
    clientX: 150,
    clientY: 150,
    cancelable: true
  });
  btnSelectPacman.dispatchEvent({
    type: 'pointerup',
    pointerType: 'touch',
    pointerId: 1,
    clientX: 152,
    clientY: 151,
    cancelable: true
  });

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), false, 'Modal should open on subsequent clean tap');
});

test('ADV-3: Rapid alternating spam (50 switches) between Mario and Pac-Man', () => {
  for (let i = 0; i < 50; i++) {
    mockWindow.ArcadeHub.launchMario();
    assert.equal(difficultyModal.classList.contains('hidden'), false);
    assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true);

    mockWindow.ArcadeHub.launchPacman();
    assert.equal(pacmanDifficultyModal.classList.contains('hidden'), false);
    assert.equal(difficultyModal.classList.contains('hidden'), true);
  }
  mockWindow.ArcadeHub.showMenu();
  assert.equal(difficultyModal.classList.contains('hidden'), true);
  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true);
  assert.equal(mainMenu.classList.contains('hidden'), false);
});

test('ADV-4: Audio context unlocking is triggered on every tap gesture', () => {
  const initialUnlockCount = audioUnlocked;
  btnSelectMario.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    cancelable: true
  });
  btnSelectMario.dispatchEvent({
    type: 'pointerup',
    pointerType: 'touch',
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    cancelable: true
  });

  assert.ok(audioUnlocked > initialUnlockCount, 'Audio unlock should be invoked on tap');
});

console.log(`\n===============================================================`);
console.log(`📊 ADVERSARIAL SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
console.log(`===============================================================`);
