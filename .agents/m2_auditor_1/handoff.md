# Forensic Audit Report — Milestone 2 (Core Engine, Physics & Touch DOM)

**Work Product**: `index.html`, `css/style.css`, `js/input.js`, `js/physics.js`, `test/verify_m2_engine.mjs`  
**Profile**: General Project (Demo / Benchmark mode — from-scratch vanilla JS)  
**Verdict**: **INTEGRITY VIOLATION** (Rejected: Automated test suite execution failed with exit code 1; physical collision logic defect in `onGround` state retention during sub-stepping / resting state).

---

### Phase Results
- **Phase 1: Source Code Static Analysis**: PASS
  - No hardcoded test result strings or dummy constants.
  - No facade implementations (`return <constant>` or empty stubs).
  - Genuine mobile-first viewport, HUD structure, DOM buttons (`#btn-left`, `#btn-right`, `#btn-jump`).
  - Zero external npm libraries used.
- **Phase 2: Multi-Touch & Input System**: PASS
  - `js/input.js` implements genuine multi-touch identifier tracking via `Map`.
  - Concurrency verified: simultaneous Left + Jump allows independent movement and jumping.
  - Keyboard mappings (`ArrowLeft`, `ArrowRight`, `Space`, `WASD`, `KeyZ`, `KeyJ`, `KeyR`) verified.
  - Frame pulse edge detection (`jumpJustPressed`, `jumpJustReleased`) verified.
- **Phase 3: Kinematics & Euler Integration**: PASS
  - Authentic acceleration ($500\text{px/s}^2$), friction ($600\text{px/s}^2$), skidding ($1200\text{px/s}^2$).
  - Variable-height jump arc and gravity switching ($650\text{px/s}^2$ hold vs $1200\text{px/s}^2$ fall).
  - Coyote time ($85\text{ms}$) and jump buffering ($100\text{ms}$) mathematically verified.
- **Phase 4: Project Test Suite Execution (`node test/verify_m2_engine.mjs`)**: **FAIL**
  - Process exited with code 1.
  - Test Section 4 failure: `Coyote jump succeeded with initial impulse (-360 px/s)`.
  - Test Section 5 failure: `Collision detected against solid obstacle on X axis`.
- **Phase 5: AABB Map Collision Resolution & Sub-Stepping**: **FAIL**
  - Defect 1: In `js/physics.js` line 297, when `entity.vy === 0` (resting on ground floor), `nextY + height - 0.001` evaluates to tile row `ty = 9` (the air space above floor at row 10). Because row 9 is not solid, `resolveMapCollisions` sets `entity.onGround = false`.
  - Defect 2: In multi-step sub-stepping (`numSubSteps > 1`), landing on sub-step $k$ zeroes `entity.vy` and sets `onGround = true`. On subsequent sub-steps $k+1 \dots N$, `vy = 0` causes the collision check at row 9 to fail, resetting `entity.onGround = false` by the time `resolveMapCollisions` returns.

---

## 1. Observation

1. **Test Suite Execution Failure (`node test/verify_m2_engine.mjs`)**:
   ```
   ==================================================
   🔷 4. js/physics.js Kinematics & Jump Mechanics
   ==================================================
     ...
     ✓ Coyote timer is still active after 50ms in air
     ❌ FAIL: Coyote jump succeeded with initial impulse (-360 px/s)
   Section error: Coyote jump succeeded with initial impulse (-360 px/s)

   ==================================================
   🔷 5. AABB Tilemap Collision Resolution
   ==================================================
     ...
     ❌ FAIL: Collision detected against solid obstacle on X axis
   Section error: Collision detected against solid obstacle on X axis

   ==================================================
   📊 M2 Engine Verification Summary:
      Passed: 61
      Failed: 2
   ==================================================
   ```

2. **Root Cause in `js/physics.js` (lines 273–300)**:
   ```javascript
   if (entity.vy >= 0) {
     const checkTileY = Math.floor((nextY + height - 0.001) / TILE_SIZE);
     let landed = false;
     let landingTile = null;

     for (let tx = startX; tx <= endX; tx++) {
       if (isTileSolid(map, tx, checkTileY)) {
         landed = true;
         landingTile = { tx: tx, ty: checkTileY, type: getTileType(map, tx, checkTileY) };
         break;
       }
     }

     if (landed) {
       entity.y = checkTileY * TILE_SIZE - height;
       entity.vy = 0;
       entity.onGround = true;
       entity.isJumping = false;
       outcome.collidedY = true;
       outcome.landedOnTile = landingTile;
     } else {
       entity.y = nextY;
       entity.onGround = false; // <-- OVERWRITES onGround to false when vy == 0 or subsequent sub-steps
     }
   }
   ```

3. **Empirical Diagnostic Tool Output (`node .agents/m2_auditor_1/adversarial_physics_test.mjs`)**:
   ```
   [Scenario A] Multi-substep falling entity landing check:
     entityA.y after 0.1s dt: 144 (expected 144)
     entityA.vy after 0.1s dt: 0 (expected 0)
     entityA.onGround: false (expected true, actual: false)
     outcomeA.collidedY: true

   [Scenario B] Entity sitting on ground with vy=0:
     entityB.y: 144
     entityB.onGround after resolveMapCollisions: false (expected true, actual: false)

   [Scenario C] Jump impulse with Euler gravity:
     entityC.vy after frame 1: -349.1666666666667 px/s (JUMP_VELOCITY=-360, after gravity hold: -349.17 px/s)

   [Scenario D] Wall collision:
     Frame 1: x=223.33, vx=200, collidedX=false
     Frame 2: x=224.00, vx=0, collidedX=true
     Obstacle at x=240 reached and collided on frame 2 (x=224)
   ```

---

## 2. Logic Chain

1. **Premise 1**: The Forensic Auditor's behavioral verification mandate requires running the project's test suite (`node test/verify_m2_engine.mjs`). A build or test suite failure invalidates the milestone completion claim.
2. **Premise 2**: Running `node test/verify_m2_engine.mjs` failed with exit code 1 due to two failed assertions:
   - Line 255 asserted that `jumper.vy === GamePhysics.JUMP_VELOCITY` ($-360\text{px/s}$). However, `applyKinematics` integrates Euler gravity at the end of the step (`entity.vy += gravity * dt`), resulting in an actual velocity of $-349.17\text{px/s}$. The test assertion was mathematically flawed by assuming zero gravity integration during the jump frame.
   - Line 312 placed a player at $x = 220$ with width 16 (right edge at $x = 236$) and $v_x = 200\text{px/s}$ moving towards a wall at $x = 240$ (distance to wall = $4\text{px}$). In a single frame at $\Delta t = \frac{1}{60}\text{s}$, the player moves $200 \times \frac{1}{60} = 3.33\text{px}$, ending at $x = 223.33$ (right edge at $239.33\text{px} < 240\text{px}$). The wall is only reached on Frame 2. The test assumed single-frame collision without sufficient travel distance.
3. **Premise 3**: In `js/physics.js`, `resolveMapCollisions` contains a critical bug in ground state retention.
   - When an entity rests on a tile floor at $y = 144$ (height 16, floor at $y = 160$) with $v_y = 0$, `nextY + height - 0.001` equals $159.999$, which maps to tile row $\lfloor 159.999 / 16 \rfloor = 9$. Tile row 9 is air. Because `landed` evaluates to `false`, the `else` branch executes `entity.onGround = false`.
   - Furthermore, during high-speed sub-stepping (`numSubSteps > 1`), landing on sub-step $k$ resets $v_y = 0$. Then sub-steps $k+1 \dots N$ continue executing with $v_y = 0$, triggering the `else` branch and leaving `entity.onGround = false`.
4. **Conclusion**: Because the automated test suite fails and `js/physics.js` exhibits ground detection instability under sub-stepping and resting states, the work product cannot be certified as clean and must be rejected for remediation.

---

## 3. Caveats

- The visual and DOM implementation (`index.html`, `css/style.css`, `#touch-controls`, `#game-canvas`, `#hud`) is exceptionally clean and complies 100% with mobile 360x800 responsive layout requirements.
- `js/input.js` is fully functional with authentic multi-touch concurrency, `Map` tracking, touch sliding, and keyboard fallbacks.
- The physics engine logic in `js/physics.js` is 95% complete and authentic (no fake facades or shortcuts), but contains the specific sub-stepping/resting ground detection flaw and test assertion mismatches detailed above.

---

## 4. Conclusion

**Verdict**: **INTEGRITY VIOLATION / REJECT**

### Required Builder Remediation:
1. **Fix `js/physics.js` (`resolveMapCollisions`)**:
   - In vertical collision handling, when entity lands (`landed = true`), break out of the sub-stepping loop (or do not allow subsequent sub-steps with $v_y = 0$ to overwrite `entity.onGround` to `false`).
   - When an entity has $v_y = 0$ or is checking ground support, probe the tile row directly beneath the entity's feet (e.g. `Math.floor((entity.y + height + 0.1) / TILE_SIZE)`) to accurately detect whether solid ground exists under the entity before setting `onGround = false`.
2. **Fix `test/verify_m2_engine.mjs`**:
   - In Section 4 (line 255 & line 266), update assertions to account for gravity integration during the jump frame (e.g. `assert(jumper.vy <= -340 && jumper.isJumping, ...)` or `assert(Math.abs(jumper.vy - (GamePhysics.JUMP_VELOCITY + GamePhysics.GRAVITY_HOLD * dt)) < 1e-3, ...)`).
   - In Section 5 (line 312), either set `player.x = 15 * 16 - 18` (so distance is 2px $< 3.33\text{px}$), or advance collision resolution in a loop/multiple frames until collision occurs.
3. Re-run `node test/verify_m2_engine.mjs` to ensure 100% passing tests (0 failures).

---

## 5. Verification Method

To verify the findings and confirm fixes:
1. Run project test suite:
   ```bash
   node test/verify_m2_engine.mjs
   ```
2. Run adversarial physics test:
   ```bash
   node .agents/m2_auditor_1/adversarial_physics_test.mjs
   ```
3. Run complete forensic audit suite:
   ```bash
   node .agents/m2_auditor_1/test_m2_forensic.mjs
   ```
