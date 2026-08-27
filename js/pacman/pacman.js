/**
 * Pac-Man Player Class - Ultra Smooth Tile-Lane Centering & 10% Speed Boost
 */

const DIRS = {
  NONE: { x: 0, y: 0, angle: 0 },
  UP: { x: 0, y: -1, angle: 1.5 * Math.PI },
  DOWN: { x: 0, y: 1, angle: 0.5 * Math.PI },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 }
};

class Pacman {
  constructor(map) {
    this.map = map;
    this.spawnX = 13.5 * TILE_SIZE;
    this.spawnY = 23.5 * TILE_SIZE;
    this.radius = 12;
    this.speed = 2.45; // +10% de velocidad (de 2.2 a 2.45)
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.dir = DIRS.LEFT;
    this.nextDir = DIRS.LEFT;
    this.prevTile = { col: Math.floor(this.x / TILE_SIZE), row: Math.floor(this.y / TILE_SIZE) };
    this.nextDirTime = 0;
    this.mouthAngle = 0.2;
    this.mouthSpeed = 0.09;
    this.mouthDir = 1;
    this.isDead = false;
    this.deathProgress = 0;
  }

  setNextDirection(dirName) {
    if (DIRS[dirName]) {
      const requestedDir = DIRS[dirName];
      this.nextDir = requestedDir;
      this.nextDirTime = Date.now();

      // Giro de 180° instantáneo en cualquier punto del pasillo
      if (this.dir !== DIRS.NONE && this.dir.x === -requestedDir.x && this.dir.y === -requestedDir.y) {
        this.dir = requestedDir;
        this.nextDir = DIRS.NONE;
        return;
      }

      // Si está detenido y la dirección es libre, arrancar inmediatamente
      if (this.dir === DIRS.NONE) {
        const curCol = Math.floor(this.x / TILE_SIZE);
        const curRow = Math.floor(this.y / TILE_SIZE);
        if (!this.map.isWall(curCol + requestedDir.x, curRow + requestedDir.y)) {
          this.dir = requestedDir;
          this.nextDir = DIRS.NONE;
        }
      }
    }
  }

  canMoveTile(col, row, dir) {
    const nextCol = col + dir.x;
    const nextRow = row + dir.y;
    if (this.map.isWall(nextCol, nextRow) || this.map.isGhostHouseGate(nextCol, nextRow)) {
      return false;
    }
    return true;
  }

  update(speedMultiplier = 1.0) {
    if (this.isDead) {
      this.deathProgress += 0.025;
      return;
    }

    this.prevTile = { col: Math.floor(this.x / TILE_SIZE), row: Math.floor(this.y / TILE_SIZE) };
    const currentSpeed = this.speed * speedMultiplier;
    const now = Date.now();

    const currentTileX = Math.floor(this.x / TILE_SIZE);
    const currentTileY = Math.floor(this.y / TILE_SIZE);
    const centerTileX = (currentTileX + 0.5) * TILE_SIZE;
    const centerTileY = (currentTileY + 0.5) * TILE_SIZE;

    // 1. Intentar aplicar el giro bufferizado (nextDir)
    if (this.nextDir !== DIRS.NONE) {
      if (now - this.nextDirTime > 450) {
        this.nextDir = DIRS.NONE; // Expiración del buffer
      } else {
        const distCenterX = Math.abs(this.x - centerTileX);
        const distCenterY = Math.abs(this.y - centerTileY);

        // Si se encuentra dentro del margen de esquina
        if (distCenterX <= currentSpeed * 2.5 && distCenterY <= currentSpeed * 2.5) {
          if (this.canMoveTile(currentTileX, currentTileY, this.nextDir)) {
            // Alinear al carril ortogonal
            if (this.nextDir.x !== 0) {
              this.y = centerTileY;
            }
            if (this.nextDir.y !== 0) {
              this.x = centerTileX;
            }
            this.dir = this.nextDir;
            this.nextDir = DIRS.NONE;
          }
        }
      }
    }

    // 2. Mover en la dirección actual
    if (this.dir !== DIRS.NONE) {
      // Si va en horizontal, asegurar alineación en el eje Y del carril
      if (this.dir.x !== 0) {
        this.y = centerTileY;
      }
      // Si va en vertical, asegurar alineación en el eje X del carril
      if (this.dir.y !== 0) {
        this.x = centerTileX;
      }

      // Comprobar si puede seguir avanzando
      const nextX = this.x + this.dir.x * currentSpeed;
      const nextY = this.y + this.dir.y * currentSpeed;

      const checkCol = Math.floor((this.x + this.dir.x * (TILE_SIZE * 0.45)) / TILE_SIZE);
      const checkRow = Math.floor((this.y + this.dir.y * (TILE_SIZE * 0.45)) / TILE_SIZE);

      if (!this.map.isWall(checkCol, checkRow) && !this.map.isGhostHouseGate(checkCol, checkRow)) {
        this.x = nextX;
        this.y = nextY;

        // Animar boca
        this.mouthAngle += this.mouthSpeed * this.mouthDir;
        if (this.mouthAngle > 0.38 || this.mouthAngle < 0.02) {
          this.mouthDir *= -1;
        }
      } else {
        // Frenar centrado contra la pared para no sobrepasarla
        this.x = centerTileX;
        this.y = centerTileY;
        this.dir = DIRS.NONE; // Queda quieto esperando input
      }
    }

    // 3. Túnel de teletransporte lateral (fila 14)
    if (this.x < -8) {
      this.x = COLS * TILE_SIZE + 4;
    } else if (this.x > COLS * TILE_SIZE + 8) {
      this.x = -4;
    }
  }

  getTile() {
    return {
      col: Math.floor(this.x / TILE_SIZE),
      row: Math.floor(this.y / TILE_SIZE)
    };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDead) {
      const angle = this.deathProgress * Math.PI;
      if (angle < Math.PI) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -Math.PI / 2 + angle, -Math.PI / 2 + Math.PI * 2 - angle, false);
        ctx.lineTo(0, 0);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const rotation = this.dir.angle;
    ctx.rotate(rotation);

    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = (window.pacmanLowPerf ? 2 : 8);

    const startAngle = this.mouthAngle * Math.PI;
    const endAngle = (2 - this.mouthAngle) * Math.PI;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.restore();
  }
}

window.Pacman = Pacman;
window.DIRS = DIRS;
