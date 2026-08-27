/**
 * js/physics.js - Platformer Kinematics, Variable Jump & AABB Tile Collision Engine
 *
 * Classic Mario Browser & Mobile Platformer (M2)
 *
 * Features:
 * - Full platformer kinematics (acceleration, friction, skidding, terminal velocity)
 * - Variable-height jump arc with early release cutoff
 * - Coyote time (85ms edge forgiveness) and jump buffering (100ms early input queue)
 * - Axis-separated AABB tilemap collision resolution (prevents corner snags & tunneling)
 * - Sub-stepping integration for high-speed fall safety
 * - Isomorphic: works seamlessly in Browser, Chrome CDP, and Node.js
 */
(function (global) {
  'use strict';

  // --- 1. PHYSICAL CONSTANTS ---
  const TILE_SIZE = 16;
  const GRAVITY_FALL = 1200;           // Downward acceleration when falling or jump released (px/s²)
  const GRAVITY_HOLD = 650;            // Lighter gravity when holding Jump button while ascending (px/s²)
  const JUMP_VELOCITY = -360;          // Initial vertical jump impulse (px/s)
  const JUMP_RELEASE_CUTOFF = -120;    // Upward velocity cap when jump is released prematurely (px/s)
  const ACCELERATION = 500;            // Ground horizontal acceleration (px/s²)
  const AIR_ACCELERATION = 360;        // Air horizontal acceleration (px/s²)
  const FRICTION = 600;                // Ground coasting deceleration (px/s²)
  const SKID_DECELERATION = 1200;      // Braking deceleration when reversing direction (px/s²)
  const MAX_WALK_SPEED = 150;          // Standard walk velocity cap (px/s)
  const MAX_RUN_SPEED = 240;           // Maximum horizontal run velocity cap (px/s)
  const TERMINAL_VELOCITY = 400;       // Maximum downward fall velocity (px/s)
  const COYOTE_TIME = 0.085;           // Coyote time window after walking off ledges (seconds)
  const JUMP_BUFFER_TIME = 0.100;      // Jump press buffer window prior to landing (seconds)

  // --- 2. HELPER UTILITIES ---
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function checkAABB(rectA, rectB) {
    if (!rectA || !rectB) return false;
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  function isTileSolid(map, tx, ty) {
    if (!map) return false;
    if (typeof map.isSolid === 'function') {
      return map.isSolid(tx, ty);
    }
    if (map.tiles && Array.isArray(map.tiles)) {
      if (ty < 0 || ty >= map.tiles.length) return false;
      const row = map.tiles[ty];
      if (!row || tx < 0 || tx >= row.length) return false;
      const tileVal = row[tx];
      return tileVal !== 0 && tileVal !== null && tileVal !== undefined && tileVal !== '.' && tileVal !== ' ';
    }
    return false;
  }

  function getTileType(map, tx, ty) {
    if (!map) return null;
    if (typeof map.getTile === 'function') {
      return map.getTile(tx, ty);
    }
    if (map.tiles && Array.isArray(map.tiles)) {
      if (ty >= 0 && ty < map.tiles.length && map.tiles[ty]) {
        return map.tiles[ty][tx] || null;
      }
    }
    return null;
  }

  // --- 3. KINEMATICS ENGINE ---
  /**
   * Applies horizontal acceleration, friction, skidding, variable jump, gravity, and timers.
   *
   * @param {Object} entity - The moving entity (Mario, Goomba, etc.)
   * @param {number} dt - Delta time in seconds (e.g. 0.0166)
   * @param {Object} [inputState] - Current input state { left, right, jump, jumpJustPressed, jumpJustReleased }
   */
  function applyKinematics(entity, dt, inputState) {
    if (!entity || dt <= 0) return;

    // Default entity state
    if (entity.vx === undefined) entity.vx = 0;
    if (entity.vy === undefined) entity.vy = 0;
    if (entity.onGround === undefined) entity.onGround = false;
    if (entity.isJumping === undefined) entity.isJumping = false;
    if (entity.isSkidding === undefined) entity.isSkidding = false;
    if (entity.facing === undefined) entity.facing = 1;
    if (entity.coyoteTimer === undefined) entity.coyoteTimer = 0;
    if (entity.jumpBufferTimer === undefined) entity.jumpBufferTimer = 0;

    // Fallback to global input if not provided
    const input = inputState || (typeof global.GameInput !== 'undefined' ? global.GameInput.getState() : {
      left: false, right: false, jump: false, jumpJustPressed: false, jumpJustReleased: false
    });

    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const maxSpeed = entity.maxSpeed || MAX_RUN_SPEED;
    const accel = entity.onGround ? (entity.acceleration || ACCELERATION) : (entity.airAcceleration || AIR_ACCELERATION);

    // --- A. Horizontal Kinematics & Skidding ---
    if (dir !== 0) {
      entity.facing = dir;

      // Check skidding condition (moving significantly in opposite direction while on ground)
      if (entity.onGround && entity.vx * dir < -20) {
        entity.isSkidding = true;
        entity.vx += dir * SKID_DECELERATION * dt;
      } else {
        entity.isSkidding = false;
        entity.vx += dir * accel * dt;
      }

      // Clamp horizontal velocity to maximum speed
      entity.vx = clamp(entity.vx, -maxSpeed, maxSpeed);
    } else {
      // No directional input: apply ground friction
      entity.isSkidding = false;
      if (entity.onGround) {
        const frictionDelta = FRICTION * dt;
        if (Math.abs(entity.vx) <= frictionDelta) {
          entity.vx = 0;
        } else {
          entity.vx -= Math.sign(entity.vx) * frictionDelta;
        }
      }
    }

    // --- B. Coyote Time & Jump Buffering ---
    if (entity.onGround) {
      entity.coyoteTimer = COYOTE_TIME;
    } else {
      entity.coyoteTimer = Math.max(0, entity.coyoteTimer - dt);
    }

    if (input.jumpJustPressed) {
      entity.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      entity.jumpBufferTimer = Math.max(0, entity.jumpBufferTimer - dt);
    }

    // --- C. Jump Triggering ---
    const wantsToJump = (entity.jumpBufferTimer > 0) || input.jumpJustPressed;
    const canJump = entity.onGround || (entity.coyoteTimer > 0);

    if (wantsToJump && canJump && !entity.isJumping) {
      entity.vy = entity.jumpVelocity || JUMP_VELOCITY;
      entity.onGround = false;
      entity.isJumping = true;
      entity.coyoteTimer = 0;
      entity.jumpBufferTimer = 0;
    }

    // --- D. Variable Jump Release Cutoff ---
    // If player releases jump while still rising quickly, truncate the arc
    if (entity.isJumping && entity.vy < JUMP_RELEASE_CUTOFF) {
      if (!input.jump || input.jumpJustReleased) {
        entity.vy = Math.max(entity.vy, JUMP_RELEASE_CUTOFF);
      }
    }

    // --- E. Gravity & Terminal Velocity ---
    // Use lower gravity when holding jump while ascending; heavy gravity otherwise
    let gravity = GRAVITY_FALL;
    if (entity.isJumping && input.jump && entity.vy < 0) {
      gravity = GRAVITY_HOLD;
    }

    entity.vy += gravity * dt;
    entity.vy = Math.min(entity.vy, entity.terminalVelocity || TERMINAL_VELOCITY);
  }

  // --- 4. TILEMAP COLLISION RESOLUTION ---
  /**
   * Resolves axis-separated collisions between an entity and the tilemap.
   *
   * @param {Object} entity - The moving entity with { x, y, vx, vy, width, height }
   * @param {Object} map - The tilemap with isSolid(tx, ty) and/or tiles array
   * @param {number} [dt=0.0166] - Delta time
   * @returns {Object} Collision outcome { collidedX, collidedY, hitCeilingTile, landedOnTile }
   */
  function resolveMapCollisions(entity, map, dt) {
    const outcome = {
      collidedX: false,
      collidedY: false,
      hitCeilingTile: null,
      landedOnTile: null
    };

    if (!entity || !map) return outcome;

    const actualDt = (typeof dt === 'number' && dt > 0) ? dt : 0.016667;
    const width = entity.width || 16;
    const height = entity.height || 16;

    // Sub-stepping to prevent tunneling at high fall speeds
    const maxSubStepDist = TILE_SIZE / 2; // 8px
    const totalDistX = Math.abs(entity.vx * actualDt);
    const totalDistY = Math.abs(entity.vy * actualDt);
    const numSubSteps = Math.max(1, Math.ceil(Math.max(totalDistX, totalDistY) / maxSubStepDist));
    const subDt = actualDt / numSubSteps;

    for (let step = 0; step < numSubSteps; step++) {
      // ----------------------------------------------------
      // 1. HORIZONTAL AXIS RESOLUTION (X)
      // ----------------------------------------------------
      if (entity.vx !== 0) {
        const nextX = entity.x + entity.vx * subDt;

        // Level boundary clamp: prevent going left of x = 0
        if (nextX <= 0) {
          entity.x = 0;
          entity.vx = 0;
          outcome.collidedX = true;
        } else {
          const startY = Math.floor(entity.y / TILE_SIZE);
          const endY = Math.floor((entity.y + height - 0.001) / TILE_SIZE);

          if (entity.vx > 0) {
            // Moving Right: check leading edge
            const checkTileX = Math.floor((nextX + width - 0.001) / TILE_SIZE);
            let hitRight = false;

            for (let ty = startY; ty <= endY; ty++) {
              if (isTileSolid(map, checkTileX, ty)) {
                hitRight = true;
                break;
              }
            }

            if (hitRight) {
              entity.x = checkTileX * TILE_SIZE - width;
              entity.vx = 0;
              outcome.collidedX = true;
            } else {
              entity.x = nextX;
            }
          } else if (entity.vx < 0) {
            // Moving Left: check trailing edge
            const checkTileX = Math.floor(nextX / TILE_SIZE);
            let hitLeft = false;

            for (let ty = startY; ty <= endY; ty++) {
              if (isTileSolid(map, checkTileX, ty)) {
                hitLeft = true;
                break;
              }
            }

            if (hitLeft) {
              entity.x = (checkTileX + 1) * TILE_SIZE;
              entity.vx = 0;
              outcome.collidedX = true;
            } else {
              entity.x = nextX;
            }
          }
        }
      }

      // ----------------------------------------------------
      // 2. VERTICAL AXIS RESOLUTION (Y)
      // ----------------------------------------------------
      const startX = Math.floor(entity.x / TILE_SIZE);
      const endX = Math.floor((entity.x + width - 0.001) / TILE_SIZE);

      if (entity.vy > 0) {
        // Moving Down / Landing: check bottom edge
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
        // Moving Up / Ceiling Hit: check top edge
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
        // entity.vy === 0: Check if supported by solid ground directly underneath
        const checkTileY = Math.floor((entity.y + height + 0.1) / TILE_SIZE);
        let grounded = false;
        for (let tx = startX; tx <= endX; tx++) {
          if (isTileSolid(map, tx, checkTileY)) {
            grounded = true;
            break;
          }
        }
        entity.onGround = grounded;
      }
    }

    return outcome;
  }

  // --- 5. FACTORY UTILITY ---
  function createKinematicEntity(options) {
    const opts = options || {};
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      width: opts.width || 16,
      height: opts.height || 16,
      onGround: opts.onGround !== undefined ? opts.onGround : false,
      isJumping: opts.isJumping || false,
      isSkidding: opts.isSkidding || false,
      facing: opts.facing || 1,
      coyoteTimer: opts.coyoteTimer || 0,
      jumpBufferTimer: opts.jumpBufferTimer || 0,
      maxSpeed: opts.maxSpeed || MAX_RUN_SPEED,
      acceleration: opts.acceleration || ACCELERATION,
      airAcceleration: opts.airAcceleration || AIR_ACCELERATION,
      jumpVelocity: opts.jumpVelocity || JUMP_VELOCITY,
      terminalVelocity: opts.terminalVelocity || TERMINAL_VELOCITY
    };
  }

  // --- 6. PUBLIC API ---
  const GamePhysics = {
    // Constants
    TILE_SIZE,
    GRAVITY_FALL,
    GRAVITY_HOLD,
    JUMP_VELOCITY,
    JUMP_RELEASE_CUTOFF,
    ACCELERATION,
    AIR_ACCELERATION,
    FRICTION,
    SKID_DECELERATION,
    MAX_WALK_SPEED,
    MAX_RUN_SPEED,
    TERMINAL_VELOCITY,
    COYOTE_TIME,
    JUMP_BUFFER_TIME,

    // Core Methods
    applyKinematics,
    resolveMapCollisions,
    checkAABB,
    createKinematicEntity,
    clamp
  };

  // --- 7. ENVIRONMENT EXPORTS ---
  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GamePhysics = GamePhysics;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamePhysics;
  }

})(typeof window !== 'undefined' ? window : this);
