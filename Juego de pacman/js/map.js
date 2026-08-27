/**
 * PAC-MAN Original Maze Map Matrix & Procedural Vector Wall Renderer
 * Dimensiones: 28 columnas x 31 filas (Tile size: 16px -> 448px x 496px)
 */

const TILE_SIZE = 16;
const COLS = 28;
const ROWS = 31;

// Tipos de celdas:
// 0: Vacío, 1: Muro, 2: Pellet, 3: Energizer, 4: Puerta Fantasmas, 5: Interior Casa Fantasmas
const ORIGINAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,0,0,0,0,0,0], // Túnel fila 14
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

class GameMap {
  constructor() {
    this.grid = [];
    this.totalPellets = 0;
    this.pelletsRemaining = 0;
    this.reset();
  }

  reset() {
    this.grid = ORIGINAL_MAP.map(row => [...row]);
    this.totalPellets = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === 2 || this.grid[r][c] === 3) {
          this.totalPellets++;
        }
      }
    }
    this.pelletsRemaining = this.totalPellets;
  }

  isWall(col, row) {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) return false; // En el túnel no hay muro
    return this.grid[row][col] === 1;
  }

  isGhostHouseGate(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return this.grid[row][col] === 4;
  }

  isGhostHouse(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return this.grid[row][col] === 5 || this.grid[row][col] === 4;
  }

  isIntersection(col, row) {
    if (this.isWall(col, row)) return false;
    let exits = 0;
    const dirs = [
      { c: 0, r: -1 },
      { c: 0, r: 1 },
      { c: -1, r: 0 },
      { c: 1, r: 0 }
    ];
    for (const d of dirs) {
      if (!this.isWall(col + d.c, row + d.r)) {
        exits++;
      }
    }
    return exits >= 3;
  }

  eatTile(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 0;
    const val = this.grid[row][col];
    if (val === 2 || val === 3) {
      this.grid[row][col] = 0;
      this.pelletsRemaining--;
      return val;
    }
    return 0;
  }

  draw(ctx, energizerFlash = false, wallColor = '#2121ff') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (type === 1) {
          // Renderizado de muros con estilo arcade neón
          ctx.fillStyle = '#050714';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          
          ctx.strokeStyle = wallColor;
          ctx.lineWidth = 2;
          ctx.shadowColor = wallColor;
          ctx.shadowBlur = 4;

          // Dibujar contornos basados en vecinos para estética arcade pulida
          const up = this.isWall(c, r - 1);
          const down = this.isWall(c, r + 1);
          const left = this.isWall(c - 1, r);
          const right = this.isWall(c + 1, r);

          if (!up) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + TILE_SIZE, y);
            ctx.stroke();
          }
          if (!down) {
            ctx.beginPath();
            ctx.moveTo(x, y + TILE_SIZE);
            ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
            ctx.stroke();
          }
          if (!left) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + TILE_SIZE);
            ctx.stroke();
          }
          if (!right) {
            ctx.beginPath();
            ctx.moveTo(x + TILE_SIZE, y);
            ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
            ctx.stroke();
          }
        } else if (type === 2) {
          // Pellet normal
          ctx.fillStyle = '#ffb8ae';
          ctx.shadowColor = '#ffb8ae';
          ctx.shadowBlur = 3;
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 3) {
          // Energizer / Power Pellet
          if (energizerFlash) {
            ctx.fillStyle = '#ffb8ae';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (type === 4) {
          // Ghost Gate (puerta rosa claro)
          ctx.strokeStyle = '#ffb8ff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ffb8ff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(x, y + TILE_SIZE / 2);
          ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}

window.GameMap = GameMap;
window.TILE_SIZE = TILE_SIZE;
window.COLS = COLS;
window.ROWS = ROWS;
