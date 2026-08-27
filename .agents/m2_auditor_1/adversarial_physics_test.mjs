/**
 * .agents/m2_auditor_1/adversarial_physics_test.mjs
 *
 * Detailed adversarial test exploring the exact sub-stepping, kinematics,
 * and input boundary conditions.
 */

import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const GamePhysics = require(path.join(rootDir, 'js/physics.js'));
const GameInput = require(path.join(rootDir, 'js/input.js'));

console.log('--- Adversarial Physics Analysis ---');

const mockMap = {
  isSolid(tx, ty) {
    if (tx < 0 || tx > 20) return true;
    if (ty >= 10) return true; // Ground floor at y=160
    if (tx === 15 && ty >= 6 && ty <= 9) return true;
    return false;
  },
  getTile(tx, ty) {
    if (ty >= 10) return 'ground';
    if (tx === 15) return 'pipe';
    return null;
  }
};

// Scenario A: Multi-substep landing onGround state
console.log('\n[Scenario A] Multi-substep falling entity landing check:');
const entityA = GamePhysics.createKinematicEntity({ x: 32, y: 100, vx: 0, vy: 800, width: 16, height: 16 });
const outcomeA = GamePhysics.resolveMapCollisions(entityA, mockMap, 0.1);
console.log(`  entityA.y after 0.1s dt: ${entityA.y} (expected 144)`);
console.log(`  entityA.vy after 0.1s dt: ${entityA.vy} (expected 0)`);
console.log(`  entityA.onGround: ${entityA.onGround} (expected true, actual: ${entityA.onGround})`);
console.log(`  outcomeA.collidedY: ${outcomeA.collidedY}`);

// Scenario B: Entity sitting on ground with vy=0 calling resolveMapCollisions
console.log('\n[Scenario B] Entity sitting on ground with vy=0:');
const entityB = GamePhysics.createKinematicEntity({ x: 32, y: 144, vx: 0, vy: 0, width: 16, height: 16, onGround: true });
const outcomeB = GamePhysics.resolveMapCollisions(entityB, mockMap, 1/60);
console.log(`  entityB.y: ${entityB.y}`);
console.log(`  entityB.onGround after resolveMapCollisions: ${entityB.onGround} (expected true, actual: ${entityB.onGround})`);

// Scenario C: Jump impulse with Euler gravity
console.log('\n[Scenario C] Jump impulse with Euler gravity:');
const entityC = GamePhysics.createKinematicEntity({ x: 0, y: 144, onGround: true });
GamePhysics.applyKinematics(entityC, 1/60, { jump: true, jumpJustPressed: true });
console.log(`  entityC.vy after frame 1: ${entityC.vy} px/s (JUMP_VELOCITY=-360, after gravity hold: -349.17 px/s)`);

// Scenario D: Wall collision over multiple frames
console.log('\n[Scenario D] Wall collision:');
const entityD = GamePhysics.createKinematicEntity({ x: 220, y: 144, vx: 200, width: 16, height: 16, onGround: true });
let collidedFrame = -1;
for (let f = 1; f <= 5; f++) {
  const res = GamePhysics.resolveMapCollisions(entityD, mockMap, 1/60);
  console.log(`  Frame ${f}: x=${entityD.x.toFixed(2)}, vx=${entityD.vx}, collidedX=${res.collidedX}`);
  if (res.collidedX && collidedFrame === -1) collidedFrame = f;
}
console.log(`  Obstacle at x=240 reached and collided on frame ${collidedFrame} (x=${entityD.x})`);
