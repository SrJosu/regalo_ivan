## 2026-08-27T19:21:17Z
You are the M3 Gameplay, Level & Victory UI Worker for V2 Iván's Birthday Gift Edition.
Working directory: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_worker_1
Target files: js/entities.js, js/level.js, js/game.js, index.html, css/style.css (Exclusive write ownership of these 5 files)

Read the following reference reports before implementing:
- ORIGINAL_REQUEST.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\ORIGINAL_REQUEST.md
- PROJECT.md at c:\Users\SrJos\Downloads\Proyecto ivan\PROJECT.md
- m3_entities_analysis.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_explorer_1\m3_entities_analysis.md
- m3_level_analysis.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_explorer_2\m3_level_analysis.md
- m3_victory_ui_analysis.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_explorer_3\m3_victory_ui_analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implementation Tasks:
1. index.html & css/style.css:
   - Personalize HUD header: "IVÁN" instead of "MARIO", "🎂 × 00", "WORLD 2026".
   - Add DOM Victory Modal (#victory-modal) containing the EXACT REQUIRED REWARD BUTTON:
     <a id="reward-btn" class="reward-button" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">Terminado el juego. Pincha aquí para recibir la recompensa</a>
     and replay button (<button id="btn-replay" class="replay-button">Jugar de nuevo</button>).
   - Style in css/style.css: z-index: 100, pointer-events: auto on modal/button, golden glowing button style, perfectly centered in mobile 360x800 viewport without overflow.
2. js/entities.js:
   - Implement Meme Enemy classes/subtypes (PopCat, Doge, GrumpyCat) with Pop Cat mouth open/close animation loop (180ms).
   - Stomp squash behavior: 450ms squash, player rebound impulse, GameAudio.playStomp() trigger, and floating meme combat text particles ("+100 AURA", "BONK!", "much jump", "wow", "NO.").
   - Confetti particle emitter for coins and victory.
3. js/level.js:
   - Add sky banner: "🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂".
   - Add roadside milestone signposts (cols 12, 40, 72, 92).
   - Deploy diverse meme enemy spawns across the level.
   - Birthday castle at goal with birthday cake parapet.
   - Deal-with-it sunglasses on background clouds.
4. js/game.js:
   - In WIN state (when reaching castle): trigger GameAudio.playWin(), celebratory confetti cannon, and reveal #victory-modal.
   - Wire #btn-replay and keyboard/touch restart.
5. Run tests:
   - node test/test_tier1_features.mjs
   - node test/test_tier2_boundary.mjs
   - node test/test_tier3_combos.mjs
   - node test/test_tier4_workload.mjs
   - node test/headless_validator.mjs
6. Document commands, results, and layout compliance in your handoff report at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_worker_1\handoff.md and send a completion message with the path.
