/**
 * js/input.js - High-Fidelity Multi-Touch & Keyboard Controller
 *
 * Classic Mario Browser & Mobile Platformer (M2)
 *
 * Features:
 * - Independent multi-touch identifier tracking for concurrent run + jump
 * - Strict e.preventDefault() on touch and platformer navigation keys
 * - Touch sliding support (touchmove re-targeting between left/right)
 * - Keyboard mappings (Arrow keys, WASD, Space, Z, J, R)
 * - Frame-by-frame edge detection (jumpJustPressed, jumpJustReleased, resetJustPressed)
 * - Visual button active-state synchronization
 * - 100% isomorphic: runs in Browser, Headless CDP, and Node.js test environments
 */
(function (global) {
  'use strict';

  // --- 1. KEYBOARD MAPPINGS ---
  const KEY_MAPPINGS = {
    left: ['ArrowLeft', 'KeyA', 'a', 'A'],
    right: ['ArrowRight', 'KeyD', 'd', 'D'],
    jump: ['Space', ' ', 'ArrowUp', 'KeyW', 'w', 'W', 'KeyZ', 'z', 'Z', 'KeyJ', 'j', 'J'],
    reset: ['KeyR', 'r', 'R']
  };

  // Build reverse lookup for fast keydown/keyup handling
  const CODE_TO_ACTION = {};
  for (const [action, keys] of Object.entries(KEY_MAPPINGS)) {
    for (const key of keys) {
      CODE_TO_ACTION[key] = action;
    }
  }

  // --- 2. INPUT CONTROLLER STATE ---
  let isInitialized = false;

  // Active inputs
  const keyState = {
    left: false,
    right: false,
    jump: false,
    reset: false
  };

  // Map of touch identifier -> action ('left' | 'right' | 'jump')
  const touchMap = new Map();

  // Edge detection history
  let prevJump = false;
  let prevReset = false;
  let prevLeft = false;
  let prevRight = false;

  let jumpJustPressed = false;
  let jumpJustReleased = false;
  let resetJustPressed = false;

  // DOM Elements cache
  let domBtnLeft = null;
  let domBtnRight = null;
  let domBtnJump = null;
  let domContainer = null;

  // --- 3. DOM HELPER METHODS ---
  function updateButtonVisuals() {
    const leftActive = isActionActive('left');
    const rightActive = isActionActive('right');
    const jumpActive = isActionActive('jump');

    if (domBtnLeft && domBtnLeft.classList) {
      domBtnLeft.classList.toggle('active', leftActive);
    }
    if (domBtnRight && domBtnRight.classList) {
      domBtnRight.classList.toggle('active', rightActive);
    }
    if (domBtnJump && domBtnJump.classList) {
      domBtnJump.classList.toggle('active', jumpActive);
    }
  }

  function isActionActive(action) {
    if (keyState[action]) return true;
    for (const act of touchMap.values()) {
      if (act === action) return true;
    }
    return false;
  }

  // --- 4. TOUCH EVENT HANDLERS ---
  function handleTouchStart(e, action) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const touches = (e && e.changedTouches) ? Array.from(e.changedTouches) : [{ identifier: 0 }];
    for (const touch of touches) {
      touchMap.set(touch.identifier, action);
    }
    updateButtonVisuals();
  }

  function handleTouchEnd(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const touches = (e && e.changedTouches) ? Array.from(e.changedTouches) : null;
    if (touches) {
      for (const touch of touches) {
        touchMap.delete(touch.identifier);
      }
    } else {
      touchMap.clear();
    }
    updateButtonVisuals();
  }

  function handleTouchMove(e) {
    if (!e || !e.changedTouches) return;
    if (e.preventDefault) e.preventDefault();

    // Check if touch moved between d-pad buttons
    const leftRect = domBtnLeft && domBtnLeft.getBoundingClientRect ? domBtnLeft.getBoundingClientRect() : null;
    const rightRect = domBtnRight && domBtnRight.getBoundingClientRect ? domBtnRight.getBoundingClientRect() : null;
    const jumpRect = domBtnJump && domBtnJump.getBoundingClientRect ? domBtnJump.getBoundingClientRect() : null;

    for (const touch of Array.from(e.changedTouches)) {
      if (!touchMap.has(touch.identifier)) continue;

      const x = touch.clientX;
      const y = touch.clientY;

      let newAction = null;
      if (leftRect && x >= leftRect.left && x <= leftRect.right && y >= leftRect.top && y <= leftRect.bottom) {
        newAction = 'left';
      } else if (rightRect && x >= rightRect.left && x <= rightRect.right && y >= rightRect.top && y <= rightRect.bottom) {
        newAction = 'right';
      } else if (jumpRect && x >= jumpRect.left && x <= jumpRect.right && y >= jumpRect.top && y <= jumpRect.bottom) {
        newAction = 'jump';
      }

      if (newAction) {
        touchMap.set(touch.identifier, newAction);
      }
    }
    updateButtonVisuals();
  }

  // --- 5. KEYBOARD EVENT HANDLERS ---
  function handleKeyDown(e) {
    const key = e.code || e.key;
    const action = CODE_TO_ACTION[key] || CODE_TO_ACTION[e.key];

    if (action) {
      // Prevent browser scrolling on Arrow keys and Space
      if (e.preventDefault && (key.startsWith('Arrow') || key === 'Space' || key === ' ')) {
        e.preventDefault();
      }
      keyState[action] = true;
      updateButtonVisuals();
    }
  }

  function handleKeyUp(e) {
    const key = e.code || e.key;
    const action = CODE_TO_ACTION[key] || CODE_TO_ACTION[e.key];

    if (action) {
      if (e.preventDefault && (key.startsWith('Arrow') || key === 'Space' || key === ' ')) {
        e.preventDefault();
      }
      keyState[action] = false;
      updateButtonVisuals();
    }
  }

  function handleBlur() {
    // Release all inputs on window blur / visibility loss
    for (const key of Object.keys(keyState)) {
      keyState[key] = false;
    }
    touchMap.clear();
    updateButtonVisuals();
  }

  // --- 6. PUBLIC API ---
  const GameInput = {
    /**
     * Initializes DOM event listeners on touch buttons and the window.
     * @param {HTMLElement|Document} [container] - Optional root DOM container or document
     */
    init(container) {
      const doc = (typeof document !== 'undefined') ? document : null;
      const win = (typeof window !== 'undefined') ? window : null;

      domContainer = container || (doc ? doc.getElementById('game-container') : null);

      if (doc) {
        domBtnLeft = doc.getElementById('btn-left');
        domBtnRight = doc.getElementById('btn-right');
        domBtnJump = doc.getElementById('btn-jump');

        if (domBtnLeft) {
          domBtnLeft.addEventListener('touchstart', (e) => handleTouchStart(e, 'left'), { passive: false });
          domBtnLeft.addEventListener('touchend', handleTouchEnd, { passive: false });
          domBtnLeft.addEventListener('touchcancel', handleTouchEnd, { passive: false });
          // Mouse fallback for desktop testing
          domBtnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); keyState.left = true; updateButtonVisuals(); });
          domBtnLeft.addEventListener('mouseup', (e) => { e.preventDefault(); keyState.left = false; updateButtonVisuals(); });
          domBtnLeft.addEventListener('mouseleave', () => { keyState.left = false; updateButtonVisuals(); });
        }

        if (domBtnRight) {
          domBtnRight.addEventListener('touchstart', (e) => handleTouchStart(e, 'right'), { passive: false });
          domBtnRight.addEventListener('touchend', handleTouchEnd, { passive: false });
          domBtnRight.addEventListener('touchcancel', handleTouchEnd, { passive: false });
          // Mouse fallback
          domBtnRight.addEventListener('mousedown', (e) => { e.preventDefault(); keyState.right = true; updateButtonVisuals(); });
          domBtnRight.addEventListener('mouseup', (e) => { e.preventDefault(); keyState.right = false; updateButtonVisuals(); });
          domBtnRight.addEventListener('mouseleave', () => { keyState.right = false; updateButtonVisuals(); });
        }

        if (domBtnJump) {
          domBtnJump.addEventListener('touchstart', (e) => handleTouchStart(e, 'jump'), { passive: false });
          domBtnJump.addEventListener('touchend', handleTouchEnd, { passive: false });
          domBtnJump.addEventListener('touchcancel', handleTouchEnd, { passive: false });
          // Mouse fallback
          domBtnJump.addEventListener('mousedown', (e) => { e.preventDefault(); keyState.jump = true; updateButtonVisuals(); });
          domBtnJump.addEventListener('mouseup', (e) => { e.preventDefault(); keyState.jump = false; updateButtonVisuals(); });
          domBtnJump.addEventListener('mouseleave', () => { keyState.jump = false; updateButtonVisuals(); });
        }
      }

      if (win) {
        win.addEventListener('keydown', handleKeyDown);
        win.addEventListener('keyup', handleKeyUp);
        win.addEventListener('blur', handleBlur);
        win.addEventListener('touchmove', handleTouchMove, { passive: false });
        win.addEventListener('touchend', handleTouchEnd, { passive: false });
        win.addEventListener('touchcancel', handleTouchEnd, { passive: false });
      }

      isInitialized = true;
    },

    /**
     * Retrieves the instantaneous aggregated input state.
     * @returns {Object} Input state including continuous and edge pulse flags
     */
    getState() {
      const left = isActionActive('left');
      const right = isActionActive('right');
      const jump = isActionActive('jump');
      const reset = isActionActive('reset');

      return {
        left: left,
        right: right,
        jump: jump,
        jumpJustPressed: jumpJustPressed,
        jumpJustReleased: jumpJustReleased,
        reset: reset,
        resetJustPressed: resetJustPressed
      };
    },

    /**
     * Computes single-frame edge triggers (justPressed / justReleased) and advances input clock.
     * Should be invoked once per game loop tick.
     */
    update() {
      const currentJump = isActionActive('jump');
      const currentReset = isActionActive('reset');
      const currentLeft = isActionActive('left');
      const currentRight = isActionActive('right');

      jumpJustPressed = currentJump && !prevJump;
      jumpJustReleased = !currentJump && prevJump;
      resetJustPressed = currentReset && !prevReset;

      prevJump = currentJump;
      prevReset = currentReset;
      prevLeft = currentLeft;
      prevRight = currentRight;
    },

    /**
     * Resets all pressed keys, active touch identifiers, and edge detection states.
     */
    reset() {
      for (const key of Object.keys(keyState)) {
        keyState[key] = false;
      }
      touchMap.clear();
      prevJump = false;
      prevReset = false;
      prevLeft = false;
      prevRight = false;
      jumpJustPressed = false;
      jumpJustReleased = false;
      resetJustPressed = false;
      updateButtonVisuals();
    },

    /**
     * Direct touch injection for automated headless or unit testing.
     */
    injectTouch(identifier, action) {
      if (action) {
        touchMap.set(identifier, action);
      } else {
        touchMap.delete(identifier);
      }
      updateButtonVisuals();
    },

    /**
     * Direct key injection for automated headless or unit testing.
     */
    injectKey(code, isDown) {
      const action = CODE_TO_ACTION[code] || CODE_TO_ACTION[code.toLowerCase()];
      if (action) {
        keyState[action] = !!isDown;
        updateButtonVisuals();
      }
    },

    /**
     * Inspect active touch map (for assertions).
     */
    getTouchMap() {
      return new Map(touchMap);
    },

    /**
     * Check initialization status.
     */
    isReady() {
      return isInitialized;
    }
  };

  // Auto-initialize when document is available
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => GameInput.init());
    } else {
      GameInput.init();
    }
  }

  // --- 7. ENVIRONMENT EXPORTS ---
  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GameInput = GameInput;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameInput;
  }

})(typeof window !== 'undefined' ? window : this);
