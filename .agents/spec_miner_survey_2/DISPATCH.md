## 2026-08-26T16:05:09Z

You are Spec Miner 2 for the initial project survey phase.
Your Working Directory: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\spec_miner_survey_2
Original Request File: c:\Users\SrJos\Downloads\Proyecto ivan\.agents\ORIGINAL_REQUEST.md

Task:
Read ORIGINAL_REQUEST.md and extract the complete functional specifications for a classic Mario-style platformer:
1. Game Physics: Gravity constant, jump impulse, terminal velocity, horizontal acceleration, deceleration/skidding, max run speed, variable jump height (holding jump button).
2. Collision System: Grid/tile-based map, AABB (axis-aligned bounding box) collision detection and resolution (horizontal collision stops movement, vertical landing sets grounded, hitting block from below triggers bounce).
3. Entities & Game Mechanics:
   - Player character (idle, run, jump states, facing left/right)
   - Platforms & blocks (ground tiles, floating brick blocks, question/item blocks)
   - Collectibles (coins with spin animation, pickup sound/effect, score increment)
   - Enemies (e.g. Goomba-style walking enemies, stomp mechanic, player damage/reset)
   - Goal Flagpole / Castle / Win state sequence
   - Audio effects (synthesized via Web Audio API for zero external dependency or clean assets)
   - Image-based assets (sprites/tiles: player sprites, tile textures, coin frames, flag, background)
4. Write your detailed specification report to `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\spec_miner_survey_2\spec_report.md` and handoff report `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\spec_miner_survey_2\handoff.md`.
5. Send a completion message back to the orchestrator.
