## 2026-08-27T19:13:04Z
You are the M2 Meme Audio Synthesizer Worker for V2 Iván's Birthday Gift Edition.
Working directory: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_v2_worker_1
Target file: c:\Users\SrJos\Downloads\Proyecto ivan\js\audio.js (Write ownership: exclusive to js/audio.js)

Read the following reference reports before implementing:
- ORIGINAL_REQUEST.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\ORIGINAL_REQUEST.md
- PROJECT.md at c:\Users\SrJos\Downloads\Proyecto ivan\PROJECT.md
- m2_sound_design.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_v2_explorer_1\m2_sound_design.md
- m2_chiptune_design.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_v2_explorer_2\m2_chiptune_design.md
- m2_audio_architecture.md at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_v2_explorer_3\m2_audio_architecture.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implementation Tasks:
1. Implement the complete upgraded js/audio.js containing:
   - GameAudio.init(), GameAudio.unlockAudio(), with touchstart/mousedown/keydown unlock handlers and iOS silent buffer unlock.
   - playJump(): Cartoon spring "Boing!" / comedic pitch-sweep with FM vibrato (160Hz -> 680Hz + 22Hz LFO).
   - playCoin(): Anime sparkle / "Ka-Ching!" cash register coin (dual sine B5 988Hz -> E6 1319Hz + G#6 1661Hz sparkle decay).
   - playStomp(): Pop Cat mouth "POP!" / Bonk (resonant bandpass filtered impulse 420Hz, Q=8.0 with sub-bass drop).
   - playBump(): Metal Pipe reverberant thud / cartoon woodblock bump (140Hz -> 45Hz with mild overdrive).
   - playDeath(): Sad Trombone (4-note descending brass slide: D#4 -> D4 -> C#4 -> C4 with wah-wah tremolo).
   - playWin(): 8-bit celebratory "Happy Birthday" chiptune melody with square wave & vibrato transitioning into triumphant victory fanfare chord and party arpeggios.
   - Bonus meme triggers: playAirhorn() MLG airhorn triplet, playBruh().
   - Master DynamicsCompressorNode + headroom gain bus (0.70) for 0.0 dBFS clipping immunity.
   - W3C non-zero exponential ramp safety (min floor 0.0001) and zero console errors in headless environments.
2. Run test suites to verify that your audio engine works and breaks zero tests:
   - node test/test_tier1_features.mjs
   - node test/test_tier2_boundary.mjs
   - node test/test_tier3_combos.mjs
   - node test/test_tier4_workload.mjs
   - node test/headless_validator.mjs
3. Document commands, test results, and layout compliance in your handoff report at c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_v2_worker_1\handoff.md and send a completion message with the path.
