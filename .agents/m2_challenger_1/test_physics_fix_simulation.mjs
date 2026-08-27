/**
 * test_physics_fix_simulation.mjs
 * Simulates proposed fixes for resolveMapCollisions to verify 100% pass rate
 */

const TILE_SIZE = 16;

function isTileSolid(map, tx, ty) {
  if (!map) return false;
  if (typeof map.isSolid === 'function') return map.isSolid(tx, ty);
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
  if (typeof map.getTile === 'function') return map.getTile(tx, ty);
  if (map.tiles && Array.isArray(map.tiles)) {
    if (ty >= 0 && ty < map.tiles.length && map.tiles[ty]) {
      return map.tiles[ty][tx] || null;
    }
  }
  return null;
}

function fixedResolveMapCollisions(entity, map, dt) {
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

  const maxSubStepDist = TILE_SIZE / 2; // 8px
  const totalDistX = Math.abs(entity.vx * actualDt);
  const totalDistY = Math.abs(entity.vy * actualDt);
  const numSubSteps = Math.max(1, Math.ceil(Math.max(totalDistX, totalDistY) / maxSubStepDist));
  const subDt = actualDt / numSubSteps;

  for (let step = 0; step < numSubSteps; step++) {
    // 1. HORIZONTAL AXIS RESOLUTION (X)
    if (entity.vx !== 0) {
      const nextX = entity.x + entity.vx * subDt;

      // Left boundary clamp
      if (nextX <= 0) {
        entity.x = 0;
        entity.vx = 0;
        outcome.collidedX = true;
      } else {
        const startY = Math.floor(entity.y / TILE_SIZE);
        const endY = Math.floor((entity.y + height - 0.001) / TILE_SIZE);

        if (entity.vx > 0) {
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

    // 2. VERTICAL AXIS RESOLUTION (Y)
    const startX = Math.floor(entity.x / TILE_SIZE);
    const endX = Math.floor((entity.x + width - 0.001) / TILE_SIZE);

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
      // entity.vy === 0: Check if ground is still beneath entity
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
  }

  return outcome;
}

// Test with multi-step landing
const mockMap = {
  isSolid(tx, ty) { return ty >= 10; },
  getTile(tx, ty) { return ty >= 10 ? 'ground' : null; }
};

const p = { x: 32, y: 130, vx: 0, vy: 300, width: 16, height: 16, onGround: false };
console.log('Testing proposed fix with dt = 1/30s:');
const res = fixedResolveMapCollisions(p, mockMap, 1/30);
console.log('Result:', { y: p.y, vy: p.vy, onGround: p.onGround, collidedY: res.collidedY });

console.log('Testing steady state next frame dt = 1/30s:');
const res2 = fixedResolveMapCollisions(p, mockMap, 1/30);
console.log('Result 2:', { y: p.y, vy: p.vy, onGround: p.onGround, collidedY: res2.collidedY });
