/**
 * js/level.js - Tilemap Definition, Level Parser & Camera System
 *
 * V2 Iván's Birthday Gift Edition (M3)
 *
 * Level Map: Birthday World 2026 platformer layout with pipes, question blocks,
 * brick platforms, pit hazards, collectibles, diverse meme enemy roster (PopCat, Doge, GrumpyCat),
 * floating sky banner ("🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"), roadside milestone signs,
 * staircase, flagpole & grand birthday castle topped with 3-tier birthday cake.
 */
(function (global) {
  'use strict';

  const TILE_SIZE = 16;
  const LEVEL_WIDTH = 130; // 130 tiles * 16px = 2080px
  const LEVEL_HEIGHT = 16; // 16 tiles * 16px = 256px
  const GROUND_ROW = 13;   // Ground floor starts at row 13 (y = 208px)

  // Solid tile types for collision engine
  const SOLID_TILES = new Set([
    'ground', 'ground_filler', 'brick', 'question', 'empty',
    'pipe_tl', 'pipe_tr', 'pipe_bl', 'pipe_br',
    'castle_brick', 'castle_battlement'
  ]);

  /**
   * Factory to generate the default World 2026 layout for Iván's Birthday.
   */
  function createLevelData() {
    // 2D Array: grid[ty][tx]
    const grid = [];
    for (let ty = 0; ty < LEVEL_HEIGHT; ty++) {
      grid[ty] = new Array(LEVEL_WIDTH).fill(null);
    }

    // 1. Ground & Underground Filler
    // Pits at: [34, 35], [60, 61, 62], [88, 89]
    const pits = new Set([34, 35, 60, 61, 62, 88, 89]);
    for (let tx = 0; tx < LEVEL_WIDTH; tx++) {
      if (!pits.has(tx)) {
        grid[GROUND_ROW][tx] = 'ground';
        for (let ty = GROUND_ROW + 1; ty < LEVEL_HEIGHT; ty++) {
          grid[ty][tx] = 'ground_filler';
        }
      }
    }

    // Helper to place pipes (2 tiles wide, specified top-left tx, ty, height)
    function placePipe(tx, height) {
      const topY = GROUND_ROW - height;
      grid[topY][tx] = 'pipe_tl';
      grid[topY][tx + 1] = 'pipe_tr';
      for (let y = topY + 1; y < GROUND_ROW; y++) {
        grid[y][tx] = 'pipe_bl';
        grid[y][tx + 1] = 'pipe_br';
      }
    }

    // 2. Pipes
    placePipe(18, 2); // Pipe 1 (height 2)
    placePipe(26, 3); // Pipe 2 (height 3)
    placePipe(38, 4); // Pipe 3 (height 4)
    placePipe(66, 2); // Pipe 4 (height 2)
    placePipe(76, 3); // Pipe 5 (height 3)

    // 3. Question & Brick Blocks
    // Area 1: Initial blocks (x: 8..14)
    grid[9][8] = 'question';
    grid[9][10] = 'brick';
    grid[9][11] = 'question';
    grid[9][12] = 'brick';
    grid[9][13] = 'question';
    grid[9][14] = 'brick';
    grid[5][11] = 'question'; // High question block

    // Area 2: Mid-level blocks (x: 44..54)
    grid[9][44] = 'brick';
    grid[9][45] = 'question';
    grid[9][46] = 'brick';
    grid[5][47] = 'brick';
    grid[5][48] = 'brick';
    grid[5][49] = 'question';
    grid[5][50] = 'brick';
    grid[9][52] = 'question';
    grid[9][54] = 'brick';

    // Area 3: Over-pit safety bricks (x: 61, 62)
    grid[7][61] = 'brick';
    grid[7][62] = 'brick';

    // Area 4: High question run (x: 80..86)
    grid[9][80] = 'brick';
    grid[9][81] = 'question';
    grid[9][82] = 'brick';
    grid[5][83] = 'question';
    grid[9][84] = 'brick';
    grid[9][85] = 'question';

    // 4. End Pyramid / Staircase (x: 94..102)
    for (let step = 1; step <= 8; step++) {
      const tx = 94 + step;
      for (let y = GROUND_ROW - step; y < GROUND_ROW; y++) {
        grid[y][tx] = 'brick';
      }
    }
    // Single top step
    grid[GROUND_ROW - 8][103] = 'brick';

    // 5. Goal Flagpole (x = 107)
    const poleX = 107;
    grid[GROUND_ROW - 9][poleX] = 'flagpole_top';
    for (let y = GROUND_ROW - 8; y < GROUND_ROW; y++) {
      grid[y][poleX] = 'flagpole_shaft';
    }

    // 6. Grand Birthday Castle (x: 112..116, y: GROUND_ROW - 4 .. GROUND_ROW - 1)
    for (let cx = 112; cx <= 116; cx++) {
      for (let cy = GROUND_ROW - 4; cy < GROUND_ROW; cy++) {
        grid[cy][cx] = 'castle_brick';
      }
    }
    // Party Battlements with festive flags
    grid[GROUND_ROW - 5][112] = 'castle_battlement';
    grid[GROUND_ROW - 5][114] = 'castle_battlement';
    grid[GROUND_ROW - 5][116] = 'castle_battlement';

    // Grand Centerpiece 3-Tier Birthday Cake atop central battlement
    grid[GROUND_ROW - 6][114] = 'castle_cake';

    // Castle Door (Arched Mahogany)
    grid[GROUND_ROW - 1][114] = 'castle_door';
    grid[GROUND_ROW - 2][114] = 'castle_door';

    // 7. Floating Sky Banner in Clouds (Columns 4 to 16)
    const skyBanner = {
      startCol: 4,
      endCol: 16,
      y: 32,
      text: '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂'
    };

    // 8. Roadside Milestone Signposts along the Level
    const signposts = [
      {
        id: 1,
        col: 12,
        x: 12 * TILE_SIZE,
        y: (GROUND_ROW - 1) * TILE_SIZE,
        title: 'KM 0',
        lines: ['🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!', '¡A por la gran recompensa!']
      },
      {
        id: 2,
        col: 40,
        x: 40 * TILE_SIZE,
        y: (GROUND_ROW - 1) * TILE_SIZE,
        title: 'KM 10',
        lines: ['🐱 CUIDADO CON LOS GATOS MEME:', '¡Muerden si no sabes saltar!']
      },
      {
        id: 3,
        col: 72,
        x: 72 * TILE_SIZE,
        y: (GROUND_ROW - 1) * TILE_SIZE,
        title: 'KM 25',
        lines: ['😎 KM 25: Más sabio, con más flow', 'y jugando como un Dios.']
      },
      {
        id: 4,
        col: 92,
        x: 92 * TILE_SIZE,
        y: (GROUND_ROW - 1) * TILE_SIZE,
        title: 'KM 30',
        lines: ['🏰 ¡LA TARTA GIGANTE Y TU REGALO', 'TE ESPERAN EN EL CASTILLO!']
      }
    ];

    // 9. Diverse Meme Enemy Initial Spawns (PopCat, Doge, GrumpyCat)
    const enemySpawns = [
      { type: 'popcat', x: 15 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'doge',   x: 22 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'grumpy', x: 30 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'popcat', x: 43 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'doge',   x: 53 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'grumpy', x: 57 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'popcat', x: 69 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'doge',   x: 74 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'grumpy', x: 82 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'doge',   x: 86 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
      { type: 'popcat', x: 91 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE }
    ];

    const coinSpawns = [
      { x: 19.5 * TILE_SIZE, y: (GROUND_ROW - 4) * TILE_SIZE },
      { x: 27.5 * TILE_SIZE, y: (GROUND_ROW - 5) * TILE_SIZE },
      { x: 34.5 * TILE_SIZE, y: (GROUND_ROW - 3) * TILE_SIZE },
      { x: 48 * TILE_SIZE, y: 3 * TILE_SIZE },
      { x: 49 * TILE_SIZE, y: 3 * TILE_SIZE },
      { x: 50 * TILE_SIZE, y: 3 * TILE_SIZE },
      { x: 61.5 * TILE_SIZE, y: 5 * TILE_SIZE },
      { x: 73 * TILE_SIZE, y: (GROUND_ROW - 2) * TILE_SIZE },
      { x: 74 * TILE_SIZE, y: (GROUND_ROW - 2) * TILE_SIZE }
    ];

    return {
      grid,
      skyBanner,
      signposts,
      enemySpawns,
      coinSpawns,
      flagpole: {
        x: poleX * TILE_SIZE,
        topY: (GROUND_ROW - 9) * TILE_SIZE,
        bottomY: (GROUND_ROW - 1) * TILE_SIZE
      },
      castleDoorX: 114 * TILE_SIZE
    };
  }

  /**
   * Level Manager Class
   */
  class Level {
    constructor() {
      this.TILE_SIZE = TILE_SIZE;
      this.WIDTH = LEVEL_WIDTH;
      this.HEIGHT = LEVEL_HEIGHT;
      this.GROUND_ROW = GROUND_ROW;
      this.worldPixelWidth = LEVEL_WIDTH * TILE_SIZE;
      this.worldPixelHeight = LEVEL_HEIGHT * TILE_SIZE;

      this.cameraX = 0;
      this.bumpingBlocks = []; // Active block bump animations: [{ tx, ty, timer }]
      this.animTimer = 0;

      this.reset();
    }

    reset() {
      const data = createLevelData();
      this.grid = data.grid;
      this.skyBanner = data.skyBanner;
      this.signposts = data.signposts;
      this.enemySpawns = data.enemySpawns;
      this.coinSpawns = data.coinSpawns;
      this.flagpole = data.flagpole;
      this.castleDoorX = data.castleDoorX;
      this.cameraX = 0;
      this.bumpingBlocks = [];
      this.animTimer = 0;
    }

    isSolid(tx, ty) {
      if (tx < 0 || tx >= this.WIDTH) return true;
      if (ty < 0) return false;
      if (ty >= this.HEIGHT) return false; // Falling below is pit hazard, not solid floor
      const tile = this.grid[ty][tx];
      return tile ? SOLID_TILES.has(tile) : false;
    }

    getTile(tx, ty) {
      if (tx < 0 || tx >= this.WIDTH || ty < 0 || ty >= this.HEIGHT) return null;
      return this.grid[ty][tx];
    }

    setTile(tx, ty, type) {
      if (tx >= 0 && tx < this.WIDTH && ty >= 0 && ty < this.HEIGHT) {
        this.grid[ty][tx] = type;
      }
    }

    /**
     * Handles hitting a block from underneath.
     * @returns {Object|null} result details { type, transformed, coinEarned }
     */
    bumpBlock(tx, ty) {
      const tile = this.getTile(tx, ty);
      if (!tile) return null;

      // Start bounce animation
      this.bumpingBlocks.push({ tx, ty, timer: 0.15 });

      if (tile === 'question') {
        this.setTile(tx, ty, 'empty');
        return { type: 'question', transformed: true, coinEarned: true };
      } else if (tile === 'brick') {
        return { type: 'brick', transformed: false, coinEarned: false };
      }
      return null;
    }

    update(dt) {
      this.animTimer += dt;

      // Update block bump animations
      for (let i = this.bumpingBlocks.length - 1; i >= 0; i--) {
        const b = this.bumpingBlocks[i];
        b.timer -= dt;
        if (b.timer <= 0) {
          this.bumpingBlocks.splice(i, 1);
        }
      }
    }

    /**
     * Updates camera tracking following the player smoothly.
     * Enforces classic Mario left-lock rule (camera never scrolls left).
     */
    updateCamera(playerX, viewportWidth) {
      const targetX = playerX - viewportWidth * 0.35;
      if (targetX > this.cameraX) {
        this.cameraX = targetX;
      }
      // Clamp at right level boundary
      const maxCameraX = this.worldPixelWidth - viewportWidth;
      if (this.cameraX > maxCameraX) {
        this.cameraX = maxCameraX;
      }
      if (this.cameraX < 0) {
        this.cameraX = 0;
      }
    }

    /**
     * Draws the floating sky banner across columns 4 to 16.
     */
    drawSkyBanner(ctx) {
      if (!this.skyBanner) return;
      const startX = this.skyBanner.startCol * TILE_SIZE;
      const endX = (this.skyBanner.endCol + 1) * TILE_SIZE;
      const bannerW = endX - startX;
      const bannerH = 18;

      const drawX = Math.round(startX - this.cameraX);
      const floatY = Math.round(this.skyBanner.y + Math.sin(this.animTimer * 2.5) * 2.5);

      // Culling check against viewport (180 virtual width)
      if (drawX + bannerW < -40 || drawX > 220) return;

      ctx.save();
      // 1. Draw Balloon anchor cords
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 8, floatY + 6);
      ctx.lineTo(drawX - 6, floatY - 8);
      ctx.moveTo(drawX + bannerW - 8, floatY + 6);
      ctx.lineTo(drawX + bannerW + 6, floatY - 8);
      ctx.stroke();

      // 2. Draw Balloons
      ctx.fillStyle = '#FF1744'; // Left balloon
      ctx.beginPath();
      ctx.ellipse(drawX - 6, floatY - 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00E5FF'; // Right balloon
      ctx.beginPath();
      ctx.ellipse(drawX + bannerW + 6, floatY - 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Ribbon Banner Body
      ctx.fillStyle = 'rgba(233, 30, 99, 0.92)';
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.fillRect(drawX, floatY, bannerW, bannerH);
      ctx.strokeRect(drawX, floatY, bannerW, bannerH);

      // 4. Ribbon Tail Notches
      ctx.fillStyle = '#C2185B';
      ctx.beginPath();
      ctx.moveTo(drawX, floatY);
      ctx.lineTo(drawX - 8, floatY + bannerH / 2);
      ctx.lineTo(drawX, floatY + bannerH);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(drawX + bannerW, floatY);
      ctx.lineTo(drawX + bannerW + 8, floatY + bannerH / 2);
      ctx.lineTo(drawX + bannerW, floatY + bannerH);
      ctx.fill();

      // 5. Centered Birthday Text
      ctx.font = 'bold 7px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Text Drop Shadow
      ctx.fillStyle = '#3E1A00';
      ctx.fillText(this.skyBanner.text, drawX + bannerW / 2 + 1, floatY + bannerH / 2 + 1);
      // Main Text Fill
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(this.skyBanner.text, drawX + bannerW / 2, floatY + bannerH / 2);

      ctx.restore();
    }

    /**
     * Draws roadside milestone signs and interactive speech bubbles.
     */
    drawSignposts(ctx, playerX = 0) {
      if (!this.signposts) return;

      this.signposts.forEach(sign => {
        const drawX = Math.round(sign.x - this.cameraX);
        const drawY = Math.round(sign.y);

        // Culling
        if (drawX < -80 || drawX > 260) return;

        ctx.save();

        // 1. Signpost Wooden Pole
        ctx.fillStyle = '#8D4F00';
        ctx.fillRect(drawX + 6, drawY + 4, 4, 12);

        // 2. Signpost Wooden Board
        ctx.fillStyle = '#C07D38';
        ctx.strokeStyle = '#4A2306';
        ctx.lineWidth = 1;
        ctx.fillRect(drawX, drawY - 4, 20, 10);
        ctx.strokeRect(drawX, drawY - 4, 20, 10);

        // Top gold highlight bevel
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(drawX + 1, drawY - 3, 18, 1);

        // Sign Title
        ctx.font = 'bold 5px "Press Start 2P", monospace, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sign.title, drawX + 10, drawY + 1);

        // 3. Proximity Speech Bubble Popup (within 36px of player)
        const dist = Math.abs(playerX - (sign.x + 8));
        if (dist < 36) {
          const bubbleW = 140;
          const bubbleH = 24;
          let bubbleX = drawX - bubbleW / 2 + 10;
          // Clamp bubble inside viewport
          bubbleX = Math.max(8, Math.min(180 - bubbleW - 8, bubbleX));
          const bubbleY = drawY - 34;

          // Bubble Background
          ctx.fillStyle = 'rgba(20, 20, 35, 0.92)';
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 1.5;
          ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
          ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

          // Downward tail pointing to sign
          ctx.fillStyle = 'rgba(20, 20, 35, 0.92)';
          ctx.beginPath();
          ctx.moveTo(drawX + 7, bubbleY + bubbleH);
          ctx.lineTo(drawX + 13, bubbleY + bubbleH);
          ctx.lineTo(drawX + 10, bubbleY + bubbleH + 4);
          ctx.fill();

          // Dialogue Text Lines
          ctx.font = 'bold 5px "Press Start 2P", monospace, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFD700';
          ctx.fillText(sign.lines[0], bubbleX + bubbleW / 2, bubbleY + 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(sign.lines[1], bubbleX + bubbleW / 2, bubbleY + 16);
        }

        ctx.restore();
      });
    }

    /**
     * Renders visible level tiles, banners, and milestone signs.
     */
    draw(ctx, viewportWidth, viewportHeight, playerX = 0) {
      if (!global.GameAssets || !global.GameAssets.isReady) return;

      const startCol = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
      const endCol = Math.min(this.WIDTH - 1, Math.ceil((this.cameraX + viewportWidth) / TILE_SIZE) + 1);

      // Question block 3-frame animation
      const qFrameIndex = (Math.floor(this.animTimer * 5) % 3) + 1;
      const questionSprite = `question_${qFrameIndex}`;

      // Build bump lookup map for fast Y-offset calculation
      const bumpMap = new Map();
      this.bumpingBlocks.forEach(b => {
        // Sine arc bump offset (up to -6px)
        const progress = (0.15 - b.timer) / 0.15; // 0 -> 1
        const offset = -Math.sin(progress * Math.PI) * 6;
        bumpMap.set(`${b.tx},${b.ty}`, offset);
      });

      // 1. Draw Tiles
      for (let ty = 0; ty < this.HEIGHT; ty++) {
        for (let tx = startCol; tx <= endCol; tx++) {
          const tile = this.grid[ty][tx];
          if (!tile) continue;

          let spriteName = tile;
          if (tile === 'question') {
            spriteName = questionSprite;
          }

          const drawX = Math.round(tx * TILE_SIZE - this.cameraX);
          const bumpOffset = bumpMap.get(`${tx},${ty}`) || 0;
          const drawY = Math.round(ty * TILE_SIZE + bumpOffset);

          global.GameAssets.drawSprite(ctx, 'tile', spriteName, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
      }

      // 2. Draw Floating Sky Banner
      this.drawSkyBanner(ctx);

      // 3. Draw Roadside Milestone Signs
      this.drawSignposts(ctx, playerX);
    }
  }

  const GameLevel = {
    TILE_SIZE,
    LEVEL_WIDTH,
    LEVEL_HEIGHT,
    GROUND_ROW,
    Level,
    createLevel() {
      return new Level();
    }
  };

  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GameLevel = GameLevel;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLevel;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
