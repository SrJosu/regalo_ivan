/**
 * Ghosts AI Engine - Anti-Stall Navigation & +10% Speed Boost
 */

const GHOST_MODES = {
  SCATTER: 'SCATTER',
  CHASE: 'CHASE',
  FRIGHTENED: 'FRIGHTENED',
  EATEN: 'EATEN'
};

const GHOST_TYPES = {
  BLINKY: { name: 'Blinky', color: '#ff0000', scatterTile: { col: 25, row: -3 }, homeX: 13.5, homeY: 11.5, pelletLimit: 0 },
  PINKY:  { name: 'Pinky',  color: '#ffb8ff', scatterTile: { col: 2,  row: -3 }, homeX: 13.5, homeY: 14.5, pelletLimit: 0 },
  INKY:   { name: 'Inky',   color: '#00ffff', scatterTile: { col: 27, row: 31 }, homeX: 11.5, homeY: 14.5, pelletLimit: 30 },
  CLYDE:  { name: 'Clyde',  color: '#ffb852', scatterTile: { col: 0,  row: 31 }, homeX: 15.5, homeY: 14.5, pelletLimit: 60 }
};

const NO_UP_ZONES = [
  { col: 12, row: 11 },
  { col: 15, row: 11 },
  { col: 12, row: 23 },
  { col: 15, row: 23 }
];

class Ghost {
  constructor(type, map) {
    this.type = type;
    this.name = type.name;
    this.color = type.color;
    this.scatterTile = type.scatterTile;
    this.homeX = type.homeX * TILE_SIZE;
    this.homeY = type.homeY * TILE_SIZE;
    this.pelletLimit = type.pelletLimit;
    this.map = map;
    this.radius = 12;
    this.speed = 2.05; // +10% de velocidad (de 1.85 a 2.05)
    this.targetTile = { col: 0, row: 0 };
    this.lastDecidedTile = { col: -1, row: -1 };
    this.reset();
  }

  reset() {
    this.x = this.homeX;
    this.y = this.homeY;
    this.mode = GHOST_MODES.SCATTER;
    this.dir = (this.name === 'Blinky') ? DIRS.LEFT : DIRS.UP;
    this.prevTile = { col: Math.floor(this.x / TILE_SIZE), row: Math.floor(this.y / TILE_SIZE) };
    this.lastDecidedTile = { col: -1, row: -1 };
    this.frightenedTimer = 0;
    this.frightenedDuration = 7;
    this.animationTimer = 0;
    this.isInsideHouse = (this.name !== 'Blinky');
    this.houseTimer = 0;
    this.targetTile = this.scatterTile;
  }

  setFrightened(duration = 7) {
    if (this.mode !== GHOST_MODES.EATEN) {
      this.mode = GHOST_MODES.FRIGHTENED;
      this.frightenedDuration = duration;
      this.frightenedTimer = duration;
      this.reverseDirection();
    }
  }

  reverseDirection() {
    if (this.dir === DIRS.UP) this.dir = DIRS.DOWN;
    else if (this.dir === DIRS.DOWN) this.dir = DIRS.UP;
    else if (this.dir === DIRS.LEFT) this.dir = DIRS.RIGHT;
    else if (this.dir === DIRS.RIGHT) this.dir = DIRS.LEFT;
  }

  isInTunnel() {
    const row = Math.floor(this.y / TILE_SIZE);
    const col = Math.floor(this.x / TILE_SIZE);
    return row === 14 && (col <= 5 || col >= 22);
  }

  isNoUpZone(col, row) {
    return NO_UP_ZONES.some(z => z.col === col && z.row === row);
  }

  calculateTargetTile(pacman, blinky, currentGlobalMode, pelletsRemaining, aiAggression = 1) {
    const pCol = Math.floor(pacman.x / TILE_SIZE);
    const pRow = Math.floor(pacman.y / TILE_SIZE);

    if (this.mode === GHOST_MODES.EATEN) {
      return { col: 13, row: 11 };
    }

    let effectiveMode = this.mode;
    if (this.name === 'Blinky' && pelletsRemaining < 10 && this.mode !== GHOST_MODES.FRIGHTENED) {
      effectiveMode = GHOST_MODES.CHASE;
    }

    if (effectiveMode === GHOST_MODES.SCATTER) {
      return this.scatterTile;
    }

    if (effectiveMode === GHOST_MODES.CHASE) {
      switch (this.name) {
        case 'Blinky':
          return {
            col: pCol + pacman.dir.x * (aiAggression > 1.1 ? 2 : 0),
            row: pRow + pacman.dir.y * (aiAggression > 1.1 ? 2 : 0)
          };

        case 'Pinky': {
          const lookAhead = aiAggression > 1.1 ? 6 : 4;
          let targetCol = pCol + pacman.dir.x * lookAhead;
          let targetRow = pRow + pacman.dir.y * lookAhead;
          if (pacman.dir === DIRS.UP) {
            targetCol -= 4;
          }
          return { col: targetCol, row: targetRow };
        }

        case 'Inky': {
          let aheadCol = pCol + pacman.dir.x * 2;
          let aheadRow = pRow + pacman.dir.y * 2;
          if (pacman.dir === DIRS.UP) {
            aheadCol -= 2;
          }
          const bCol = Math.floor((blinky ? blinky.x : this.x) / TILE_SIZE);
          const bRow = Math.floor((blinky ? blinky.y : this.y) / TILE_SIZE);
          return {
            col: aheadCol + (aheadCol - bCol),
            row: aheadRow + (aheadRow - bRow)
          };
        }

        case 'Clyde': {
          const myCol = Math.floor(this.x / TILE_SIZE);
          const myRow = Math.floor(this.y / TILE_SIZE);
          const dist = Math.hypot(myCol - pCol, myRow - pRow);
          return (dist > 8) ? { col: pCol, row: pRow } : this.scatterTile;
        }
      }
    }

    return this.scatterTile;
  }

  getNextValidDirections(currentCol, currentRow) {
    const dirs = [DIRS.UP, DIRS.LEFT, DIRS.DOWN, DIRS.RIGHT];
    const valid = [];

    for (const d of dirs) {
      if (this.dir && d.x === -this.dir.x && d.y === -this.dir.y) {
        continue;
      }

      if (d === DIRS.UP && this.isNoUpZone(currentCol, currentRow) && this.mode !== GHOST_MODES.FRIGHTENED) {
        continue;
      }

      const testCol = currentCol + d.x;
      const testRow = currentRow + d.y;

      if (!this.map.isWall(testCol, testRow)) {
        if (this.map.isGhostHouseGate(testCol, testRow)) {
          if (this.mode === GHOST_MODES.EATEN || this.isInsideHouse) {
            valid.push(d);
          }
        } else {
          valid.push(d);
        }
      }
    }

    // Fallback absoluto anti-atasco: si no hay direcciones disponibles, dar la vuelta
    if (valid.length === 0 && this.dir) {
      valid.push({ x: -this.dir.x, y: -this.dir.y, angle: this.dir.angle });
    }

    return valid;
  }

  update(dt, pacman, blinky, currentGlobalMode, pelletsEaten, pelletsRemaining, level, speedMultiplier = 1.0, aiAggression = 1.0) {
    this.animationTimer += dt * 8;
    this.prevTile = { col: Math.floor(this.x / TILE_SIZE), row: Math.floor(this.y / TILE_SIZE) };

    // 1. Salida de la casa de fantasmas
    if (this.isInsideHouse) {
      let canLeave = false;
      const levelMultiplier = Math.max(0.3, (1 - (level - 1) * 0.15) / aiAggression);
      const effectiveLimit = Math.floor(this.pelletLimit * levelMultiplier);

      this.houseTimer += dt;
      if (pelletsEaten >= effectiveLimit || this.houseTimer > (this.name === 'Pinky' ? 1.5 : (this.name === 'Inky' ? 3.5 : 6))) {
        canLeave = true;
      }

      if (canLeave) {
        // Centrar en X e ir hacia arriba
        this.x = 13.5 * TILE_SIZE;
        this.y -= 1.5;
        if (this.y <= 11.5 * TILE_SIZE) {
          this.isInsideHouse = false;
          this.y = 11.5 * TILE_SIZE;
          this.dir = DIRS.LEFT;
          this.lastDecidedTile = { col: 13, row: 11 };
        }
      } else {
        this.y += Math.sin(this.animationTimer * 0.6) * 0.5;
      }
      return;
    }

    // 2. Modos Frightened y Eaten
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.mode = currentGlobalMode;
      }
    } else if (this.mode !== GHOST_MODES.EATEN) {
      this.mode = currentGlobalMode;
    }

    if (this.mode === GHOST_MODES.EATEN) {
      const myCol = Math.floor(this.x / TILE_SIZE);
      const myRow = Math.floor(this.y / TILE_SIZE);
      if (myCol === 13 && (myRow === 11 || myRow === 12 || myRow === 13)) {
        this.mode = currentGlobalMode;
        this.isInsideHouse = false;
      }
    }

    // 3. Velocidad
    let currentSpeed = this.speed * speedMultiplier * aiAggression;
    if (this.isInTunnel()) {
      currentSpeed *= 0.5;
    } else if (this.mode === GHOST_MODES.FRIGHTENED) {
      currentSpeed *= 0.55;
    } else if (this.mode === GHOST_MODES.EATEN) {
      currentSpeed *= 2.2;
    } else if (this.name === 'Blinky') {
      if (pelletsRemaining < 10) {
        currentSpeed *= 1.15;
      } else if (pelletsRemaining < 20) {
        currentSpeed *= 1.08;
      }
    }

    // 4. Decisiones de dirección en el centro de las casillas
    const currentTileX = Math.floor(this.x / TILE_SIZE);
    const currentTileY = Math.floor(this.y / TILE_SIZE);
    const centerTileX = (currentTileX + 0.5) * TILE_SIZE;
    const centerTileY = (currentTileY + 0.5) * TILE_SIZE;

    const distCenterX = Math.abs(this.x - centerTileX);
    const distCenterY = Math.abs(this.y - centerTileY);

    const isNewTile = (currentTileX !== this.lastDecidedTile.col || currentTileY !== this.lastDecidedTile.row);

    if (isNewTile && distCenterX <= currentSpeed * 1.5 && distCenterY <= currentSpeed * 1.5) {
      this.x = centerTileX;
      this.y = centerTileY;
      this.lastDecidedTile = { col: currentTileX, row: currentTileY };

      this.targetTile = this.calculateTargetTile(pacman, blinky, currentGlobalMode, pelletsRemaining, aiAggression);
      const validDirs = this.getNextValidDirections(currentTileX, currentTileY);

      if (validDirs.length > 0) {
        if (this.mode === GHOST_MODES.FRIGHTENED) {
          this.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
          let bestDir = validDirs[0];
          let bestDist = Infinity;

          for (const d of validDirs) {
            const nextCol = currentTileX + d.x;
            const nextRow = currentTileY + d.y;
            const dist = Math.hypot(nextCol - this.targetTile.col, nextRow - this.targetTile.row);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          }
          this.dir = bestDir;
        }
      }
    }

    // 5. Alineación al carril de movimiento
    if (this.dir.x !== 0) {
      this.y = centerTileY;
    }
    if (this.dir.y !== 0) {
      this.x = centerTileX;
    }

    this.x += this.dir.x * currentSpeed;
    this.y += this.dir.y * currentSpeed;

    // 6. Tunnel wrapping
    if (this.x < -8) {
      this.x = COLS * TILE_SIZE + 4;
      this.lastDecidedTile = { col: -1, row: -1 };
    } else if (this.x > COLS * TILE_SIZE + 8) {
      this.x = -4;
      this.lastDecidedTile = { col: -1, row: -1 };
    }
  }

  draw(ctx, highContrast = false, debug = false) {
    if (debug && this.mode !== GHOST_MODES.FRIGHTENED && !this.isInsideHouse) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo((this.targetTile.col + 0.5) * TILE_SIZE, (this.targetTile.row + 0.5) * TILE_SIZE);
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.fillRect(this.targetTile.col * TILE_SIZE + 4, this.targetTile.row * TILE_SIZE + 4, 8, 8);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const r = this.radius;

    if (this.mode === GHOST_MODES.EATEN) {
      this.drawEyes(ctx);
      ctx.restore();
      return;
    }

    let bodyColor = this.color;
    let isFlashing = false;

    if (this.mode === GHOST_MODES.FRIGHTENED) {
      if (this.frightenedTimer < 2.2 && Math.floor(this.frightenedTimer * 5) % 2 === 0) {
        bodyColor = highContrast ? '#ffff00' : '#ffffff';
        isFlashing = true;
      } else {
        bodyColor = highContrast ? '#00e5ff' : '#2121ff';
      }
    }

    if (highContrast && this.mode === GHOST_MODES.FRIGHTENED) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = (window.pacmanLowPerf ? 2 : 8);
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -2, r, Math.PI, 0, false);
    ctx.lineTo(r, r - 2);

    const wave = Math.sin(this.animationTimer) * 2;
    ctx.lineTo(r * 0.5, r - 4 + wave);
    ctx.lineTo(0, r - 2 - wave);
    ctx.lineTo(-r * 0.5, r - 4 + wave);
    ctx.lineTo(-r, r - 2);
    ctx.closePath();
    ctx.fill();
    if (highContrast && this.mode === GHOST_MODES.FRIGHTENED) {
      ctx.stroke();
    }

    if (this.mode === GHOST_MODES.FRIGHTENED) {
      ctx.fillStyle = isFlashing ? '#ff0000' : '#ffb8ae';
      ctx.fillRect(-5, -4, 3, 3);
      ctx.fillRect(2, -4, 3, 3);

      ctx.strokeStyle = isFlashing ? '#ff0000' : '#ffb8ae';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 3);
      ctx.lineTo(-3, 1);
      ctx.lineTo(0, 3);
      ctx.lineTo(3, 1);
      ctx.lineTo(6, 3);
      ctx.stroke();

      if (highContrast) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, -10);
      }
    } else {
      this.drawEyes(ctx);
    }

    ctx.restore();
  }

  drawEyes(ctx) {
    const eyeOffsetX = this.dir.x * 2.5;
    const eyeOffsetY = this.dir.y * 2.5;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(-4 + eyeOffsetX * 0.5, -3 + eyeOffsetY * 0.5, 3.5, 0, Math.PI * 2);
    ctx.arc(4 + eyeOffsetX * 0.5, -3 + eyeOffsetY * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(-4 + eyeOffsetX, -3 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.arc(4 + eyeOffsetX, -3 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Ghost = Ghost;
window.GHOST_TYPES = GHOST_TYPES;
window.GHOST_MODES = GHOST_MODES;
window.NO_UP_ZONES = NO_UP_ZONES;
