import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const GamePhysics = require(path.join(rootDir, 'js', 'physics.js'));

const mockMap = {
  isSolid(tx, ty) {
    return ty >= 10;
  },
  getTile(tx, ty) {
    return ty >= 10 ? 'ground' : null;
  }
};

const player = GamePhysics.createKinematicEntity({
  x: 32,
  y: 130,
  vx: 0,
  vy: 300,
  width: 16,
  height: 16
});

for (let frame = 1; frame <= 5; frame++) {
  console.log(`--- Frame ${frame} (dt = 1/30s) ---`);
  console.log('Before resolution:', { y: player.y, vy: player.vy, onGround: player.onGround });
  const res = GamePhysics.resolveMapCollisions(player, mockMap, 1/30);
  console.log('After resolution:', {
    y: player.y,
    vy: player.vy,
    onGround: player.onGround,
    collidedY: res.collidedY,
    landedOnTile: res.landedOnTile
  });
}
