# Handoff Report: Milestone 2 Adversarial Challenge

**Agent**: `m2_challenger_1` (Challenger)  
**Roles**: critic, specialist  
**Working Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m2_challenger_1`  
**Target Milestone**: Milestone 2 (Core Engine, Physics & Touch DOM)  
**Date**: 2026-08-26  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Adversarial stress-testing was executed against `js/input.js`, `js/physics.js`, `index.html`, and `css/style.css` using the automated empirical test harness `test_adversarial_m2.mjs` (94 tests across 7 suites).

### Test Suite Execution Output
```
Command: node .agents/m2_challenger_1/test_adversarial_m2.mjs

📊 ADVERSARIAL STRESS TEST SUMMARY
   Total Tests Run: 94
   Passed:          88
   Failed:          6

❌ FAILURES RECORDED:
   - FAILED: dt = 33.3ms: Entity onGround state is TRUE after landing
   - FAILED: dt = 66.7ms: Entity onGround state is TRUE after landing
   - FAILED: dt = 100.0ms: Entity onGround state is TRUE after landing
   - FAILED: Super-velocity entity onGround is TRUE
   - FAILED: Left boundary collision flagged
   - FAILED: Velocity zeroed on left boundary impact
```

### Specific Code Observations

1. **`js/physics.js` Lines 202–206, 273–298 (Sub-stepping `onGround` clobbering)**:
   ```javascript
   // js/physics.js:202-206
   const maxSubStepDist = TILE_SIZE / 2; // 8px
   const totalDistX = Math.abs(entity.vx * actualDt);
   const totalDistY = Math.abs(entity.vy * actualDt);
   const numSubSteps = Math.max(1, Math.ceil(Math.max(totalDistX, totalDistY) / maxSubStepDist));
   const subDt = actualDt / numSubSteps;

   for (let step = 0; step < numSubSteps; step++) {
     ...
     // js/physics.js:273-298
     if (entity.vy >= 0) {
       const checkTileY = Math.floor((nextY + height - 0.001) / TILE_SIZE);
       let landed = false;
       ...
       if (landed) {
         entity.y = checkTileY * TILE_SIZE - height;
         entity.vy = 0;
         entity.onGround = true;
         entity.isJumping = false;
         outcome.collidedY = true;
         outcome.landedOnTile = landingTile;
       } else {
         entity.y = nextY;
         entity.onGround = false;
       }
     }
   }
   ```
   - When `numSubSteps > 1` (e.g., fall velocity $300\text{--}400\text{px/s}$ or frame rate $\le 30\text{ FPS}$):
     - On `step = 0`: Entity lands on tile row 10 ($y = 144, vy = 0, onGround = true$).
     - On `step = 1`: Entity velocity is now $0$. `nextY` is $144$.
     - `checkTileY = Math.floor((144 + 16 - 0.001) / 16) = Math.floor(159.999 / 16) = 9`.
     - Tile row 9 is air (`isTileSolid(map, tx, 9) === false`).
     - Line 296 executes: `else { entity.y = nextY; entity.onGround = false; }`.
     - Result: `entity.onGround` is overwritten to `false` at the end of the step loop.

2. **`js/physics.js` Lines 216–220 (Left Boundary `nextX < 0`)**:
   ```javascript
   // js/physics.js:216-220
   if (nextX < 0) {
     entity.x = 0;
     entity.vx = 0;
     outcome.collidedX = true;
   } else {
     ...
   }
   ```
   - When an entity starts at $x = 4$ with $vx = -240\text{px/s}$ and $subDt = 1/60\text{s}$, $nextX = 4 - 4 = 0$.
   - $0 < 0$ is `false`. The entity position is updated to $0$, but `entity.vx` remains $-240\text{px/s}$ and `outcome.collidedX` remains `false` on the impact frame.

3. **Multi-Touch & Timing Pass Observations**:
   - Multi-Touch Concurrency (`js/input.js`): 5 simultaneous touches, random interleaved releases, 500 rapid chaos cycles passed with 0 phantom keys or state desyncs.
   - Jump Buffering (`js/physics.js`): Correctly triggers jump within $100\text{ms}$ buffer window (50ms, 80ms) and correctly expires past $100\text{ms}$ (110ms).
   - Coyote Time (`js/physics.js`): Correctly triggers jump within $85\text{ms}$ ledge window (40ms, 60ms) and correctly expires past $85\text{ms}$ (95ms).
   - DOM & CSS Layout: Viewport meta, 360x800 canvas, zero-scroll `touch-action: none`, and button sizes $\ge 56\text{px}$ all conform 100%.

---

## 2. Logic Chain

1. **Sub-Stepping Grounding Failure**:
   - *Observation*: During any physics tick where displacement $> 8\text{px}$ (e.g., $dt = 1/30\text{s}$ or terminal velocity $400\text{px/s}$), `numSubSteps` is $\ge 2$.
   - *Logic*: Step 0 lands and zeros `vy`. Step 1 computes `checkTileY = Math.floor((144 + 16 - 0.001) / 16) = 9` (the entity's body position) instead of checking the ground below ($ty = 10$). Because row 9 is air, step 1 enters the `else` branch and sets `entity.onGround = false`.
   - *Impact*: In subsequent frames, `applyKinematics` believes the entity is in mid-air: ground friction is disabled, air acceleration ($360\text{px/s}^2$) is applied instead of ground acceleration ($500\text{px/s}^2$), and coyote time ticks down to 0 within $85\text{ms}$, preventing the player from jumping while standing still on the floor.

2. **Left World Boundary Clamping Inconsistency**:
   - *Observation*: `nextX < 0` does not trigger when $nextX = 0$.
   - *Logic*: If an entity moves from $x = 4$ with $vx = -240\text{px/s}$ at $60\text{ FPS}$, $nextX$ lands exactly at $0$. Because $0 < 0$ is `false`, `entity.vx` is not zeroed and `collidedX` is not flagged until the next frame.
   - *Impact*: Inconsistent boundary collision response and velocity retention for 1 frame.

---

## 3. Caveats

- `js/input.js` multi-touch implementation is robust and fully verified across high-concurrency chaos scenarios.
- The physics engine formulas for variable jump gravity ($650\text{px/s}^2$ vs $1200\text{px/s}^2$), coyote time window ($85\text{ms}$), jump buffer window ($100\text{ms}$), and skidding deceleration ($1200\text{px/s}^2$) are mathematically sound and operate correctly when `onGround` is accurate.
- No other caveats.

---

## 4. Conclusion & Actionable Fixes

**Verdict**: **REQUEST_CHANGES**

The Worker (`m2_worker_1`) must apply the following targeted modifications to `js/physics.js`:

### Actionable Modification 1: Fix Ground Check & Resting Ground Retention in `js/physics.js`
In `resolveMapCollisions` in `js/physics.js`:
1. When `entity.vy > 0`, calculate `checkTileY = Math.floor((nextY + height) / TILE_SIZE)`.
2. When `entity.vy === 0` (either resting on ground or zeroed after landing in step 0), verify whether solid ground is directly below the entity's feet:
   ```javascript
   if (entity.vy > 0) {
     const nextY = entity.y + entity.vy * subDt;
     const checkTileY = Math.floor((nextY + height) / TILE_SIZE);
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
       entity.onGround = false;
     }
   } else if (entity.vy < 0) {
     const nextY = entity.y + entity.vy * subDt;
     const checkTileY = Math.floor(nextY / TILE_SIZE);
     let hitCeiling = false;
     let ceilingTile = null;

     for (let tx = startX; tx <= endX; tx++) {
       if (isTileSolid(map, tx, checkTileY)) {
         hitCeiling = true;
         ceilingTile = { tx: tx, ty: checkTileY, type: getTileType(map, tx, checkTileY) };
         break;
       }
     }

     if (hitCeiling) {
       entity.y = (checkTileY + 1) * TILE_SIZE;
       entity.vy = 0;
       outcome.collidedY = true;
       outcome.hitCeilingTile = ceilingTile;
     } else {
       entity.y = nextY;
       entity.onGround = false;
     }
   } else {
     // entity.vy === 0: Preserve grounded status if solid tile is directly underneath
     const checkTileY = Math.floor((entity.y + height + 0.001) / TILE_SIZE);
     let grounded = false;
     for (let tx = startX; tx <= endX; tx++) {
       if (isTileSolid(map, tx, checkTileY)) {
         grounded = true;
         break;
       }
     }
     entity.onGround = grounded;
   }
   ```

### Actionable Modification 2: Fix Left World Boundary Clamp in `js/physics.js`
In `resolveMapCollisions` in `js/physics.js` (line 216):
```javascript
// Replace:
if (nextX < 0) {
// With:
if (nextX <= 0) {
  entity.x = 0;
  entity.vx = 0;
  outcome.collidedX = true;
}
```

---

## 5. Verification Method

1. **Run M2 Worker Verification Test**:
   ```bash
   node test/verify_m2_engine.mjs
   ```
2. **Run Challenger Adversarial Stress Test Suite**:
   ```bash
   node .agents/m2_challenger_1/test_adversarial_m2.mjs
   ```
   **Pass Condition**: 94 / 94 tests passing with 0 failures.

---

## 6. Challenge Report

**Overall risk assessment**: HIGH (due to sub-stepping ground loss affecting player jump state machine on variable frame rates).

### Challenges

#### [High] Challenge 1: Sub-stepping `onGround` State Clobbering
- **Assumption challenged**: Sub-stepping loop preserves grounded state upon multi-step landing.
- **Attack scenario**: Entity falls at terminal velocity ($400\text{px/s}$) or runs at $30\text{ FPS}$ ($dt = 33.3\text{ms}$). Step 0 lands, step 1 checks row 9 (air) and resets `entity.onGround = false`.
- **Blast radius**: Player is locked out of jumping while standing on ground after $85\text{ms}$ coyote expiration.
- **Mitigation**: Update vertical collision resolution in `js/physics.js` as detailed in Section 4.

#### [Medium] Challenge 2: Left World Boundary Exact Impact
- **Assumption challenged**: Left boundary clamp activates when entity hits $x = 0$.
- **Attack scenario**: Moving left from $x = 4$ at $-240\text{px/s}$ lands exactly at $x = 0$. `nextX < 0` is false.
- **Blast radius**: Entity retains negative velocity for 1 extra frame and fails collision trigger.
- **Mitigation**: Change `nextX < 0` to `nextX <= 0`.

### Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Multi-touch 5 concurrent touches | All active touches mapped independently | All mapped independently | **PASS** |
| Interleaved touch releases | Lifting touch 1 does not cancel touch 2 | State preserved cleanly | **PASS** |
| 500 tap chaos cycles | Zero state corruption / stuck inputs | Clean idle state | **PASS** |
| Jump buffer 50ms / 80ms before landing | Jump triggered immediately on ground | Jump triggered with $v_y = -360\text{px/s}$ | **PASS** |
| Jump buffer 110ms before landing | Buffer expired, no jump | No jump triggered | **PASS** |
| Coyote time 40ms / 60ms after ledge | Jump triggered in air | Coyote jump triggered | **PASS** |
| Coyote time 95ms after ledge | Expired, jump denied | Jump denied, fall continues | **PASS** |
| Anti-tunneling at $400\text{px/s}$ ($dt = 8.3\text{ms}, 16.7\text{ms}$) | Intercepted on 16px tile | Landed safely at $y = 144$ | **PASS** |
| Anti-tunneling at $400\text{px/s}$ ($dt = 33.3\text{ms}, 66.7\text{ms}$) | `onGround === true` after landing | `onGround === false` (clobbered by step 1) | **FAIL** (Fixed in patch) |
| Left boundary at $x = 0$ ($nextX = 0$) | $vx = 0, collidedX = true$ | $vx = -240, collidedX = false$ | **FAIL** (Fixed in patch) |

### Unchallenged Areas
- Web Audio synthesis (`js/audio.js`) and Game Loop / Camera (`js/game.js`, `js/level.js`) are scoped for Milestone 3 and were not challenged.
