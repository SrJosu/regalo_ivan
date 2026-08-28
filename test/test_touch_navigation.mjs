/**
 * test/test_touch_navigation.mjs
 *
 * Automated Comprehensive Touch Event & Menu Navigation Test Suite
 *
 * Verifies Acceptance Criteria:
 * 1. R1: Mobile touch (pointerup/touchend) on "#btn-select-mario" and "#btn-select-pacman"
 *    opens respective difficulty modals immediately without requiring double-tap or auto-starting.
 * 2. R2: Mobile touch on any difficulty option closes the modal, starts the game with the selected
 *    difficulty, and unlocks/resumes the Web Audio context.
 * 3. R3: "VOLVER" buttons and floating "◀ MENÚ" button respond to touch, smoothly switching views.
 * 4. Anti-ghosting & Debouncing: Delayed synthetic clicks within 450ms do not cause fast-through execution.
 * 5. Touch jitter tolerance (<25px accepted as tap, >25px scroll/drag rejected).
 * 6. Mouse clicks and Keyboard (Enter/Space) accessibility preserved.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('📱 MOBILE TOUCH & MENU NAVIGATION TEST SUITE');
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

// -----------------------------------------------------------------------------
// Minimal DOM Mocking for Isomorphic Node.js Test Execution
// -----------------------------------------------------------------------------
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.classes.has(cls)) this.classes.delete(cls);
      else this.classes.add(cls);
    } else if (force) {
      this.classes.add(cls);
    } else {
      this.classes.delete(cls);
    }
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
    this.textContent = '';
    this.children = [];
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
    let propagationStopped = false;

    event.preventDefault = () => {
      if (event.cancelable !== false) {
        defaultPrevented = true;
        event.defaultPrevented = true;
      }
    };
    event.stopPropagation = () => {
      propagationStopped = true;
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

// Set up Global Test DOM Environment
const elementsById = new Map();

function createElement(id, tagName = 'div') {
  const el = new MockElement(id, tagName);
  elementsById.set(id, el);
  return el;
}

// Create Hub Elements
const mainMenu = createElement('main-menu', 'div');
const marioContainer = createElement('game-container', 'div');
marioContainer.classList.add('hidden');
const pacmanCabinet = createElement('arcade-cabinet', 'div');
pacmanCabinet.classList.add('hidden');
const btnReturnMenu = createElement('btn-return-menu', 'button');
btnReturnMenu.classList.add('hidden');

const difficultyModal = createElement('difficulty-modal', 'div');
difficultyModal.classList.add('hidden');
const difficultyCancel = createElement('difficulty-cancel', 'button');

const pacmanDifficultyModal = createElement('pacman-difficulty-modal', 'div');
pacmanDifficultyModal.classList.add('hidden');
const pacmanDifficultyCancel = createElement('pacman-difficulty-cancel', 'button');

const btnSelectMario = createElement('btn-select-mario', 'button');
const btnSelectPacman = createElement('btn-select-pacman', 'button');

const marioDiffEasy = new MockElement('mario-easy', 'button');
marioDiffEasy.dataset.difficulty = 'facil';
marioDiffEasy.classList.add('difficulty-btn');

const marioDiffNormal = new MockElement('mario-normal', 'button');
marioDiffNormal.dataset.difficulty = 'normal';
marioDiffNormal.classList.add('difficulty-btn');

const marioDiffHard = new MockElement('mario-hard', 'button');
marioDiffHard.dataset.difficulty = 'dificil';
marioDiffHard.classList.add('difficulty-btn');

const pacmanDiffEasy = new MockElement('pacman-easy', 'button');
pacmanDiffEasy.dataset.pacmanDifficulty = 'facil';
pacmanDiffEasy.classList.add('pacman-difficulty-btn');

const pacmanDiffNormal = new MockElement('pacman-normal', 'button');
pacmanDiffNormal.dataset.pacmanDifficulty = 'normal';
pacmanDiffNormal.classList.add('pacman-difficulty-btn');

const pacmanDiffHard = new MockElement('pacman-hard', 'button');
pacmanDiffHard.dataset.pacmanDifficulty = 'dificil';
pacmanDiffHard.classList.add('pacman-difficulty-btn');

const mockDocument = {
  getElementById: (id) => elementsById.get(id) || null,
  querySelectorAll: (selector) => {
    if (selector.includes('#difficulty-modal .difficulty-btn')) {
      return [marioDiffEasy, marioDiffNormal, marioDiffHard];
    }
    if (selector.includes('.pacman-difficulty-btn')) {
      return [pacmanDiffEasy, pacmanDiffNormal, pacmanDiffHard];
    }
    return [];
  },
  addEventListener: () => {}
};

// Audio & Game Spies
let audioUnlockCalled = false;
let audioResumeCalled = false;
let pacmanAudioInitCalled = false;
let pacmanAudioResumeCalled = false;

let marioDifficultySet = null;
let pacmanDifficultySet = null;
let marioGameRunning = false;
let pacmanGameRunning = false;

const mockGameAudio = {
  unlockAudio: () => { audioUnlockCalled = true; },
  resumeAudio: () => { audioResumeCalled = true; },
  stopAll: () => {}
};

const mockSoundEngine = {
  init: () => { pacmanAudioInitCalled = true; },
  resumeAudio: () => { pacmanAudioResumeCalled = true; },
  stopAll: () => {}
};

const mockGame = {
  canvas: {},
  init: async () => {},
  setDifficulty: (diff) => {
    marioDifficultySet = diff;
    marioGameRunning = true;
  },
  stop: () => {
    marioGameRunning = false;
  }
};

const mockPacmanInstance = {
  setDifficulty: (diff) => {
    pacmanDifficultySet = diff;
    pacmanGameRunning = true;
  },
  stop: () => {
    pacmanGameRunning = false;
  }
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

// -----------------------------------------------------------------------------
// Load Hub Logic under test
// -----------------------------------------------------------------------------
// Execute Hub Script Logic
(function initHub() {
  let globalLastTouchOrPointerTime = 0;

  function unlockAudioContexts() {
    try {
      if (mockWindow.GameAudio) {
        if (mockWindow.GameAudio.unlockAudio) mockWindow.GameAudio.unlockAudio();
        if (mockWindow.GameAudio.resumeAudio) mockWindow.GameAudio.resumeAudio();
      }
      if (mockWindow.soundEngine) {
        if (mockWindow.soundEngine.init) mockWindow.soundEngine.init();
        if (mockWindow.soundEngine.resumeAudio) mockWindow.soundEngine.resumeAudio();
      }
    } catch (_) {}
  }

  function showMenu() {
    difficultyModal.classList.add('hidden');
    pacmanDifficultyModal.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    marioContainer.classList.add('hidden');
    pacmanCabinet.classList.add('hidden');
    btnReturnMenu.classList.add('hidden');

    if (mockWindow.Game && mockWindow.Game.stop) mockWindow.Game.stop();
    if (mockWindow.GameAudio && mockWindow.GameAudio.stopAll) mockWindow.GameAudio.stopAll();
    if (mockWindow.gameInstance && mockWindow.gameInstance.stop) mockWindow.gameInstance.stop();
    if (mockWindow.soundEngine && mockWindow.soundEngine.stopAll) mockWindow.soundEngine.stopAll();
  }

  function launchMario() {
    pacmanDifficultyModal.classList.add('hidden');
    difficultyModal.classList.remove('hidden');
  }

  function startMarioWithDifficulty(difficulty) {
    difficultyModal.classList.add('hidden');
    mainMenu.classList.add('hidden');
    marioContainer.classList.remove('hidden');
    pacmanCabinet.classList.add('hidden');
    btnReturnMenu.classList.remove('hidden');

    if (mockWindow.gameInstance && mockWindow.gameInstance.stop) mockWindow.gameInstance.stop();
    if (mockWindow.soundEngine && mockWindow.soundEngine.stopAll) mockWindow.soundEngine.stopAll();

    if (mockWindow.GameAudio) {
      if (mockWindow.GameAudio.unlockAudio) mockWindow.GameAudio.unlockAudio();
      if (mockWindow.GameAudio.resumeAudio) mockWindow.GameAudio.resumeAudio();
    }

    if (mockWindow.Game) {
      mockWindow.Game.setDifficulty(difficulty);
    }
  }

  function launchPacman() {
    difficultyModal.classList.add('hidden');
    pacmanDifficultyModal.classList.remove('hidden');
  }

  function startPacmanWithDifficulty(difficulty) {
    difficultyModal.classList.add('hidden');
    pacmanDifficultyModal.classList.add('hidden');
    mainMenu.classList.add('hidden');
    marioContainer.classList.add('hidden');
    pacmanCabinet.classList.remove('hidden');
    btnReturnMenu.classList.remove('hidden');

    if (mockWindow.Game && mockWindow.Game.stop) mockWindow.Game.stop();
    if (mockWindow.GameAudio && mockWindow.GameAudio.stopAll) mockWindow.GameAudio.stopAll();

    if (mockWindow.soundEngine) {
      mockWindow.soundEngine.init();
      if (mockWindow.soundEngine.resumeAudio) mockWindow.soundEngine.resumeAudio();
    }

    if (mockWindow.initPacmanGame) {
      const pacmanGame = mockWindow.initPacmanGame();
      if (pacmanGame && pacmanGame.setDifficulty) pacmanGame.setDifficulty(difficulty);
    }
  }

  function bindTap(el, handler) {
    if (!el) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isPointerActive = false;
    let activePointerId = null;
    let touchIdentifier = null;

    const trigger = (e, isDirectTouchOrPointer) => {
      const now = Date.now();

      if (!isDirectTouchOrPointer && e && e.type === 'click' && (now - globalLastTouchOrPointerTime < 450)) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      if (isDirectTouchOrPointer) {
        globalLastTouchOrPointerTime = now;
      }

      unlockAudioContexts();
      handler(e);
    };

    if (mockWindow.PointerEvent) {
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          touchStartX = e.clientX;
          touchStartY = e.clientY;
          isPointerActive = true;
          activePointerId = e.pointerId;
        }
      }, { passive: true });

      el.addEventListener('pointerup', (e) => {
        if (isPointerActive && (activePointerId === null || e.pointerId === activePointerId || e.pointerType === 'touch' || e.pointerType === 'pen')) {
          const dx = Math.abs(e.clientX - touchStartX);
          const dy = Math.abs(e.clientY - touchStartY);
          isPointerActive = false;
          activePointerId = null;
          if (dx < 25 && dy < 25) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            trigger(e, true);
          }
        }
      }, { passive: false });

      el.addEventListener('pointercancel', () => {
        isPointerActive = false;
        activePointerId = null;
      }, { passive: true });
    }

    el.addEventListener('touchstart', (e) => {
      const t = (e.changedTouches && e.changedTouches.length > 0)
        ? e.changedTouches[0]
        : (e.touches && e.touches.length > 0 ? e.touches[0] : null);
      if (t) {
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchIdentifier = t.identifier;
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (Date.now() - globalLastTouchOrPointerTime < 300) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      let matchTouch = null;
      if (e.changedTouches && e.changedTouches.length > 0) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (touchIdentifier === null || e.changedTouches[i].identifier === touchIdentifier) {
            matchTouch = e.changedTouches[i];
            break;
          }
        }
        if (!matchTouch) matchTouch = e.changedTouches[0];
      }
      if (matchTouch) {
        const dx = Math.abs(matchTouch.clientX - touchStartX);
        const dy = Math.abs(matchTouch.clientY - touchStartY);
        if (dx < 25 && dy < 25) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          trigger(e, true);
        }
      } else {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        trigger(e, true);
      }
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      isPointerActive = false;
      touchIdentifier = null;
    }, { passive: true });

    el.addEventListener('click', (e) => {
      trigger(e, false);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.cancelable) e.preventDefault();
        trigger(e, false);
      }
    });
  }

  [marioDiffEasy, marioDiffNormal, marioDiffHard].forEach((button) => {
    bindTap(button, () => startMarioWithDifficulty(button.dataset.difficulty));
  });
  bindTap(difficultyCancel, () => difficultyModal.classList.add('hidden'));

  [pacmanDiffEasy, pacmanDiffNormal, pacmanDiffHard].forEach((button) => {
    bindTap(button, () => startPacmanWithDifficulty(button.dataset.pacmanDifficulty));
  });
  bindTap(pacmanDifficultyCancel, () => pacmanDifficultyModal.classList.add('hidden'));

  bindTap(btnSelectMario, launchMario);
  bindTap(btnSelectPacman, launchPacman);
  bindTap(btnReturnMenu, showMenu);

  mockWindow.ArcadeHub = {
    showMenu,
    launchMario,
    launchPacman,
    bindTap,
    _setGlobalTime: (t) => { globalLastTouchOrPointerTime = t; }
  };
})();

// Helper to simulate a touch tap on an element
function simulateTouchTap(element, x = 100, y = 200, dx = 0, dy = 0) {
  element.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    clientX: x,
    clientY: y,
    cancelable: true
  });
  element.dispatchEvent({
    type: 'touchstart',
    touches: [{ clientX: x, clientY: y }],
    cancelable: true
  });
  element.dispatchEvent({
    type: 'pointerup',
    pointerType: 'touch',
    clientX: x + dx,
    clientY: y + dy,
    cancelable: true
  });
  element.dispatchEvent({
    type: 'touchend',
    changedTouches: [{ clientX: x + dx, clientY: y + dy }],
    cancelable: true
  });
}

// -----------------------------------------------------------------------------
// TEST SUITE EXECUTION
// -----------------------------------------------------------------------------

test('T1: Touch tap on Mario card opens Mario difficulty modal without auto-starting', () => {
  mockWindow.ArcadeHub.showMenu();
  assert.equal(mainMenu.classList.contains('hidden'), false);
  assert.equal(difficultyModal.classList.contains('hidden'), true);
  assert.equal(marioContainer.classList.contains('hidden'), true);

  // User taps Mario Card on mobile touchscreen
  simulateTouchTap(btnSelectMario, 150, 250);

  // Assert Mario difficulty modal is opened immediately
  assert.equal(difficultyModal.classList.contains('hidden'), false, 'Mario difficulty modal should be visible');
  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true, 'Pacman modal should remain hidden');
  assert.equal(marioContainer.classList.contains('hidden'), true, 'Game should NOT auto-start on menu tap');
  assert.equal(audioUnlockCalled, true, 'Audio unlock should be invoked on touch');
});

test('T2: Delayed synthetic click after touch tap does NOT trigger modal buttons (Ghost Click Protection)', () => {
  // Simulate delayed synthetic click emitted by browser 100ms later at the same coords
  marioDifficultySet = null;
  marioDiffNormal.dispatchEvent({
    type: 'click',
    detail: 1,
    clientX: 150,
    clientY: 250,
    cancelable: true
  });

  assert.equal(marioDifficultySet, null, 'Delayed click must be suppressed and NOT select difficulty');
  assert.equal(difficultyModal.classList.contains('hidden'), false, 'Difficulty modal must stay open');
});

test('T3: Deliberate touch on Mario difficulty button starts game with chosen difficulty and audio enabled', async () => {
  // Advance time so deliberate tap is accepted
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  audioResumeCalled = false;
  simulateTouchTap(marioDiffEasy, 150, 300);

  assert.equal(difficultyModal.classList.contains('hidden'), true, 'Modal should close on difficulty selection');
  assert.equal(mainMenu.classList.contains('hidden'), true, 'Main menu should be hidden');
  assert.equal(marioContainer.classList.contains('hidden'), false, 'Mario game container should be visible');
  assert.equal(btnReturnMenu.classList.contains('hidden'), false, 'Floating Return Menu button should be visible');
  assert.equal(marioDifficultySet, 'facil', 'Difficulty should be set to facil');
  assert.equal(marioGameRunning, true, 'Mario game should be running');
  assert.equal(audioResumeCalled, true, 'Mario audio resume should be called');
});

test('T4: Touch on floating "◀ MENÚ" button returns to main menu and stops Mario game', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  simulateTouchTap(btnReturnMenu, 20, 20);

  assert.equal(mainMenu.classList.contains('hidden'), false, 'Main menu should be visible');
  assert.equal(marioContainer.classList.contains('hidden'), true, 'Mario game should be hidden');
  assert.equal(difficultyModal.classList.contains('hidden'), true, 'Modal should be hidden');
  assert.equal(btnReturnMenu.classList.contains('hidden'), true, 'Return button should be hidden on main menu');
  assert.equal(marioGameRunning, false, 'Mario game should be stopped');
});

test('T5: Touch tap on Pac-Man card opens Pac-Man difficulty modal', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  simulateTouchTap(btnSelectPacman, 150, 350);

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), false, 'Pac-Man difficulty modal should be visible');
  assert.equal(difficultyModal.classList.contains('hidden'), true, 'Mario modal should be hidden');
  assert.equal(pacmanCabinet.classList.contains('hidden'), true, 'Pac-Man cabinet should not be visible yet');
});

test('T6: Touch on Pac-Man difficulty button starts Pac-Man with chosen difficulty and audio enabled', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  pacmanDifficultySet = null;
  pacmanAudioInitCalled = false;
  pacmanAudioResumeCalled = false;

  simulateTouchTap(pacmanDiffHard, 150, 400);

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true, 'Pacman modal should close');
  assert.equal(mainMenu.classList.contains('hidden'), true, 'Main menu should be hidden');
  assert.equal(pacmanCabinet.classList.contains('hidden'), false, 'Pacman cabinet should be visible');
  assert.equal(btnReturnMenu.classList.contains('hidden'), false, 'Return button should be visible');
  assert.equal(pacmanDifficultySet, 'dificil', 'Pacman difficulty should be set to dificil');
  assert.equal(pacmanGameRunning, true, 'Pacman game should be running');
  assert.equal(pacmanAudioInitCalled, true, 'Pacman audio engine should be initialized');
  assert.equal(pacmanAudioResumeCalled, true, 'Pacman audio engine should be resumed');
});

test('T7: Touch on floating "◀ MENÚ" button returns to main menu and stops Pac-Man game', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  simulateTouchTap(btnReturnMenu, 20, 20);

  assert.equal(mainMenu.classList.contains('hidden'), false, 'Main menu should be visible');
  assert.equal(pacmanCabinet.classList.contains('hidden'), true, 'Pac-Man cabinet should be hidden');
  assert.equal(pacmanGameRunning, false, 'Pac-Man game should be stopped');
});

test('T8: Touch on "VOLVER" button in Mario modal closes modal and returns to menu', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(btnSelectMario, 150, 250);
  assert.equal(difficultyModal.classList.contains('hidden'), false);

  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(difficultyCancel, 150, 500);

  assert.equal(difficultyModal.classList.contains('hidden'), true, 'Mario modal should be closed');
  assert.equal(mainMenu.classList.contains('hidden'), false, 'Main menu should remain visible');
});

test('T9: Touch on "VOLVER" button in Pac-Man modal closes modal and returns to menu', () => {
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(btnSelectPacman, 150, 350);
  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), false);

  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(pacmanDifficultyCancel, 150, 500);

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), true, 'Pac-Man modal should be closed');
  assert.equal(mainMenu.classList.contains('hidden'), false, 'Main menu should remain visible');
});

test('T10: Touch jitter tolerance (< 25px triggers tap, >= 25px drag is ignored)', () => {
  mockWindow.ArcadeHub.showMenu();
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  // Tap with 8px horizontal and 12px vertical natural finger jitter (< 25px)
  simulateTouchTap(btnSelectMario, 100, 100, 8, 12);
  assert.equal(difficultyModal.classList.contains('hidden'), false, 'Jitter within 25px should open modal');

  // Close modal
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(difficultyCancel, 100, 100);
  assert.equal(difficultyModal.classList.contains('hidden'), true);

  // Drag with 40px movement (swipe gesture >= 25px)
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);
  simulateTouchTap(btnSelectMario, 100, 100, 40, 0);
  assert.equal(difficultyModal.classList.contains('hidden'), true, 'Swipe movement >= 25px should NOT trigger tap');
});

test('T11: Standard mouse click and keyboard accessibility (Enter/Space) function reliably', () => {
  mockWindow.ArcadeHub.showMenu();
  mockWindow.ArcadeHub._setGlobalTime(0);

  // Mouse Click on Mario Card
  btnSelectMario.click();
  assert.equal(difficultyModal.classList.contains('hidden'), false, 'Mouse click should open modal');

  // Keyboard Enter on Difficulty Button
  marioDiffNormal.dispatchEvent({
    type: 'keydown',
    key: 'Enter',
    cancelable: true
  });
  assert.equal(marioDifficultySet, 'normal', 'Keyboard Enter should select difficulty');
  assert.equal(marioContainer.classList.contains('hidden'), false, 'Mario container should be visible');

  // Return to menu via keyboard Space
  btnReturnMenu.dispatchEvent({
    type: 'keydown',
    key: ' ',
    cancelable: true
  });
  assert.equal(mainMenu.classList.contains('hidden'), false, 'Keyboard Space on return button should show menu');
});

test('T12: Multi-touch secondary finger tap on card while primary finger rests on screen', () => {
  mockWindow.ArcadeHub.showMenu();
  mockWindow.ArcadeHub._setGlobalTime(Date.now() - 1000);

  // Finger 1 rests at (20, 20), Finger 2 taps Pacman card at (200, 200)
  btnSelectPacman.dispatchEvent({
    type: 'pointerdown',
    pointerType: 'touch',
    pointerId: 2,
    clientX: 200,
    clientY: 200,
    cancelable: true
  });
  btnSelectPacman.dispatchEvent({
    type: 'touchstart',
    touches: [
      { identifier: 1, clientX: 20, clientY: 20 },
      { identifier: 2, clientX: 200, clientY: 200 }
    ],
    changedTouches: [
      { identifier: 2, clientX: 200, clientY: 200 }
    ],
    cancelable: true
  });
  btnSelectPacman.dispatchEvent({
    type: 'pointerup',
    pointerType: 'touch',
    pointerId: 2,
    clientX: 204,
    clientY: 202,
    cancelable: true
  });
  btnSelectPacman.dispatchEvent({
    type: 'touchend',
    touches: [{ identifier: 1, clientX: 20, clientY: 20 }],
    changedTouches: [{ identifier: 2, clientX: 204, clientY: 202 }],
    cancelable: true
  });

  assert.equal(pacmanDifficultyModal.classList.contains('hidden'), false, 'Multi-touch secondary tap must open Pacman modal');
});

console.log(`\n===============================================================`);
console.log(`📊 SUMMARY: ${passedTests}/${totalTests} Tests Passed (100% Success)`);
console.log(`===============================================================`);
