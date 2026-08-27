# M2 Audio Architecture & Headless Compatibility Report
**Project**: V2 Iván's Birthday Gift Edition — Platformer Overhaul  
**Target File**: `js/audio.js`  
**Explorer Agent**: `m2_v2_explorer_3` (Audio Architecture & Headless Compatibility Explorer)  
**Date**: 2026-08-27  

---

## 1. Executive Summary

This investigation establishes the technical architecture, public API contract, headless testing compatibility, gesture-unlock mechanics, and defensive fallback strategies for the procedural Web Audio synthesizer engine (`js/audio.js`).

The game must run flawlessly across:
1. **Modern Mobile & Desktop Browsers** (Chrome, Edge, Safari, Firefox, iOS Mobile Safari, Android Chrome) with strict autoplay policies.
2. **Headless Chrome / CDP Test Environments** (`--headless=new`, `--mute-audio`, `--disable-gpu`) demanding strictly **0 console errors** and **0 runtime exceptions**.
3. **Pure Node.js Verification Runners** (`verify_m2_engine.mjs`, `verify_m3_gameplay.mjs`, `test_tier1..4.mjs`) where `window`, `document`, and `AudioContext` are undefined.
4. **Mocked / Polyfilled Test Harnesses** where partial or synthetic `AudioContext` implementations may be present.

---

## 2. Public API Contract Specification

The public API contract is defined in `PROJECT.md` (lines 111–123) and verified across the test suites (`test/headless_validator.mjs`, `test/test_tier3_combos.mjs`, `test/verify_m3_gameplay.mjs`).

```typescript
interface GameAudioAPI {
  /**
   * Registers user gesture event listeners on window/document to unlock AudioContext.
   * Idempotent; safe in non-DOM (Node.js) environments.
   */
  init(): void;

  /**
   * Instantiates AudioContext if needed and calls resume() within user gesture context.
   * Catches rejections silently and triggers iOS WebKit hardware unlock.
   */
  unlockAudio(): void;

  /**
   * Sound: Cartoon Spring "Boing!" / comic upward pitch sweep for player jump.
   */
  playJump(): void;

  /**
   * Sound: Anime sparkle / "Ka-Ching!" cash register chime for coin collection.
   */
  playCoin(): void;

  /**
   * Sound: Pop Cat mouth "POP!" / Bonk crunch for enemy stomp squash.
   */
  playStomp(): void;

  /**
   * Sound: Metal pipe reverberant thud / hollow bump for obstacle & block hits.
   */
  playBump(): void;

  /**
   * Sound: Sad Trombone chromatic brass slide for player death / game over.
   */
  playDeath(): void;

  /**
   * Sound: 8-bit "Happy Birthday" / celebratory chiptune fanfare on stage clear / victory.
   */
  playWin(): void;
}
```

### Module Export Topology (UMD / Multi-Environment)
To support both browser global script inclusion and Node.js CommonJS/ESM test imports:
```javascript
const targetScope = typeof window !== 'undefined'
  ? window
  : (typeof globalThis !== 'undefined' ? globalThis : global);

targetScope.GameAudio = GameAudio;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameAudio;
}
```

---

## 3. Headless Browser & Node.js Testing Environments Analysis

### Environment Matrix & Behavior Comparison

| Environment | `window` / `document` | `AudioContext` Availability | Autoplay State | Failure Risk | Defensive Guard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js Test Suites** (`verify_m2_engine.mjs`, `test_tier1..4.mjs`) | `undefined` | `undefined` | N/A | `ReferenceError: window is not defined`<br>`ReferenceError: AudioContext is not defined` | `typeof window !== 'undefined'` checks;<br>`getContext()` returns `null`;<br>Methods immediately return. |
| **Headless Chrome CDP** (`headless_validator.mjs` `--headless=new`) | Exists | Exists (`AudioContext`) | Initially `'suspended'` until user gesture | Console warning: *"The AudioContext was not allowed to start..."* fails 0-console-error check | `if (!audioCtx || audioCtx.state !== 'running') return;`<br>Silent `.catch(() => {})` on `resume()` |
| **Mocked / Polyfilled Unit Tests** (Adversarial harnesses) | May exist | Mocked class | Partial mock (missing methods or properties) | `TypeError` or `RangeError` from incomplete mock | Wrap all synthesis node creation & parameter scheduling in `try { ... } catch (e) {}` |
| **iOS Mobile Safari** (Physical iPhone / iPad) | Exists | `webkitAudioContext` / `AudioContext` | Suspended until touch; output muted until buffer play | Silent audio despite running game loop | Silent 1-sample buffer playback on gesture unlock |

---

## 4. User Interaction Gesture Unlock Architecture

### Browser Autoplay Policies
Modern browsers block Web Audio playback until explicit user interaction occurs.
- **Chrome / Edge / Firefox**: `new AudioContext()` starts in `'suspended'` state. Attempting to schedule nodes without running state may trigger browser warnings.
- **iOS WebKit**: Requires `ctx.resume()` and a momentary buffer activation inside a `touchstart` or `touchend` handler to unmute the hardware mixer.

### Gesture Listeners Implementation Pattern

```javascript
let ctx = null;
let isUnlocked = false;
let isInitialized = false;

function getContext() {
  if (!ctx) {
    const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                     (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
    if (AudioCtx) {
      try {
        ctx = new AudioCtx();
      } catch (e) {
        ctx = null;
      }
    }
  }
  return ctx;
}

function unlockAudio() {
  const audioCtx = getContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  // iOS WebKit hardware unlock: play 1-sample silent buffer
  try {
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (e) {
    // Non-fatal if buffer unlock is unsupported
  }

  isUnlocked = true;
}

function init() {
  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== 'undefined' && window.addEventListener) {
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'pointerdown'];
    const onFirstInteraction = () => {
      unlockAudio();
      unlockEvents.forEach(evt => {
        try {
          window.removeEventListener(evt, onFirstInteraction, { capture: true, passive: true });
        } catch (e) {
          window.removeEventListener(evt, onFirstInteraction);
        }
      });
    };

    unlockEvents.forEach(evt => {
      try {
        window.addEventListener(evt, onFirstInteraction, { capture: true, passive: true });
      } catch (e) {
        window.addEventListener(evt, onFirstInteraction);
      }
    });
  }
}
```

---

## 5. Web Audio API Technical Guardrails & Pitfalls

### Rule 1: Never exponentialRamp to 0
According to W3C Web Audio API specification, `exponentialRampToValueAtTime(value, time)` throws a `RangeError` if `value <= 0`.
- ❌ **Forbidden**: `gain.gain.exponentialRampToValueAtTime(0, now + duration);`
- ✅ **Required**: `gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);` OR `gain.gain.linearRampToValueAtTime(0, now + duration);`

### Rule 2: Strict Running State Guard
Before creating any oscillators, gain nodes, or filters:
- ✅ **Required**:
  ```javascript
  const audioCtx = getContext();
  if (!audioCtx || audioCtx.state !== 'running') return;
  ```
This guarantees that in headless environments or before user gesture, no un-resumed AudioContext warnings are emitted to `console.warn` or `console.error`.

### Rule 3: Defensive Try-Catch Wrapping
All synthesis calls must wrap oscillator/gain scheduling in `try { ... } catch (e) {}` so that audio hardware failure, audio graph disconnection, or mock errors never interrupt game physics or the rendering loop.

### Rule 4: Master Volume & Clipping Prevention
When multiple oscillators play simultaneously (e.g. Ka-Ching dual chime, Sad Trombone chord, Happy Birthday fanfare), gain values must be scaled appropriately (e.g. `0.15` to `0.25` per voice) to prevent digital clipping / distortion.

---

## 6. Worker Implementation Recommendations

When implementing `js/audio.js` for Milestone 2:

1. **Adopt Complete Node Graph Architecture**:
   - Implement the meme synthesizer blueprints designed by Explorer 1 (`m2_sound_design.md`):
     - `playJump()`: FM modulated cartoon spring "Boing!" (160Hz -> 680Hz + LFO wobble).
     - `playCoin()`: "Ka-Ching!" dual-tone register chime (B5 988Hz -> E6 1319Hz + G#6 1661Hz harmonic sparkle).
     - `playStomp()`: Pop Cat mouth "POP!" / resonant bandpass crunch (420Hz center, Q=8.0, sub-bass drop).
     - `playBump()`: Metal Pipe hollow thud (triangle wave 160Hz -> 60Hz + resonant overtone).
     - `playDeath()`: Sad Trombone 4-note chromatic slide ([493Hz, 440Hz, 392Hz, 329Hz] descending with brass vibrato).
     - `playWin()`: 8-bit "Happy Birthday" celebratory chiptune fanfare.

2. **Ensure Clean Event Unlocking**:
   - Use `{ capture: true, passive: true }` on gesture listeners (`touchstart`, `touchend`, `mousedown`, `keydown`, `pointerdown`).
   - Cleanly remove listeners on first interaction.
   - Include iOS 1-sample silent buffer trigger.

3. **Verify Gameplay Wiring**:
   - Verify `js/game.js` invokes `GameAudio.init()` during game startup.
   - Verify `js/entities.js` or `js/game.js` calls `GameAudio.playJump()` on player jump impulse.
   - Verify `GameAudio.playCoin()`, `GameAudio.playBump()`, `GameAudio.playStomp()`, `GameAudio.playDeath()`, and `GameAudio.playWin()` are wired to their respective game events.

4. **Validate Against All Test Suites**:
   - Run `node test/verify_m2_engine.mjs`
   - Run `node test/verify_m3_gameplay.mjs`
   - Run `node test/test_tier1_features.mjs`
   - Run `node test/test_tier2_boundary.mjs`
   - Run `node test/test_tier3_combos.mjs`
   - Run `node test/test_tier4_workload.mjs`
   - Run `node test/headless_validator.mjs` (Confirm 0 console errors & 0 uncaught exceptions).
