## 2026-08-26T16:25:20Z
You are the Worker for Milestone 2 (Core Engine, Physics & Touch DOM).
Your Working Directory: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_worker_1
Original Request File: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\ORIGINAL_REQUEST.md
Project Blueprint: c:\Users\SrJos\Downloads\Proyecto ivan\PROJECT.md
M2 Explorer Analysis: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_explorer_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own and write:
- `c:\Users\SrJos\Downloads\Proyecto ivan\index.html`
- `c:\Users\SrJos\Downloads\Proyecto ivan\css\style.css`
- `c:\Users\SrJos\Downloads\Proyecto ivan\js\input.js`
- `c:\Users\SrJos\Downloads\Proyecto ivan\js\physics.js`
- `c:\Users\SrJos\Downloads\Proyecto ivan\test\verify_m2_engine.mjs`

Task Requirements:
1. Implement `index.html`:
   - Mobile-first responsive viewport `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`.
   - Game canvas (`#game-canvas`, 360x800).
   - HUD header (`#hud`) with MARIO, SCORE (000000), COINS (x00), WORLD (1-1), TIME (400), LIVES (x3).
   - DOM touch control overlay (`#touch-controls` container, `#btn-left`, `#btn-right`, `#btn-jump`).
   - Clean script inclusions (`js/assets.js`, `js/input.js`, `js/physics.js`, and future modules).
2. Implement `css/style.css`:
   - Strict zero-scroll layout (`margin: 0; padding: 0; overflow: hidden; touch-action: none; user-select: none`).
   - Target 360x800 mobile viewport with responsive aspect-ratio containment.
   - Touch buttons sized >= 56x56px positioned in ergonomic lower thumb zone (Y >= 480px).
   - High-contrast visual styling and active-state feedback (`:active`, `.active`).
3. Implement `js/input.js` (`window.GameInput`):
   - Multi-touch DOM listener capturing `touchstart`, `touchend`, `touchcancel` on `#btn-left`, `#btn-right`, `#btn-jump` with `e.preventDefault()`.
   - Independent touch identifier tracking to allow concurrent running + jumping.
   - Keyboard event listeners (ArrowLeft, ArrowRight, ArrowUp, KeyA, KeyD, KeyW, Space).
   - Exported API: `init(domContainer)`, `getState()`, `update()` (pulse clearing), `reset()`.
4. Implement `js/physics.js` (`window.GamePhysics`):
   - Kinematics: horizontal acceleration (500px/s^2), friction (600px/s^2), skidding (1200px/s^2), max walk (150px/s), max run (240px/s), variable jump (vy0 = -360px/s), hold gravity (650px/s^2), fall gravity (1200px/s^2), terminal velocity (400px/s).
   - Coyote time (85ms), jump buffering (100ms).
   - Tile-based AABB collision detection and resolution with anti-tunneling sub-stepping.
   - Exported API: `applyKinematics(entity, dt)`, `resolveMapCollisions(entity, map)`, `checkAABB(rectA, rectB)`.
5. Implement `test/verify_m2_engine.mjs`:
   - Automated Node.js verification testing DOM touch listeners, multi-touch concurrency, keyboard mapping, kinematics formulas, coyote time, jump buffer, and AABB tile collision.
   - Run `node test/verify_m2_engine.mjs` and verify it passes with 0 failures.
6. Write your handoff report to `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_worker_1\handoff.md`.
7. Send a completion message back to the orchestrator.
