# M3 Birthday Level Map & Lore Analysis & Specification

> **Milestone**: M3 — Birthday Level Map & Lore Design  
> **Target Release**: V2 Iván's Birthday Gift Edition  
> **Author**: M3 Birthday Level Map & Lore Explorer  
> **Status**: APPROVED & READY FOR IMPLEMENTATION  
> **Working Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_explorer_2`

---

## 1. Executive Summary & Design Overview

The goal of Milestone 3 is to elevate the World 1-1 level map from a standard platformer stage into a rich, hilarious, and personalized **Birthday Meme-Odyssey designed specifically for "Iván"**.

This document provides the complete technical and creative blueprint for 5 core level features:
1. **Floating Sky Banner** across columns 4 to 16 in the clouds: `"🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"`.
2. **Roadside Humorous Milestone Signposts** celebrating Iván's birthday along the level (cols 12, 40, 72, 92).
3. **Meme Enemy Spawn Roster** featuring diverse patrols of **Pop Cat**, **Doge**, and **Grumpy Cat**.
4. **The Grand Birthday Castle** at the goal adorned with `castle_battlement` flags and a crowning 3-tier `castle_cake`.
5. **"Deal-With-It" Sunglasses** rendered on background parallax clouds.

All implementations maintain **0 external network dependencies**, strict backward compatibility with existing tests, 60 FPS performance, and full touch/mobile responsiveness (360x800 logical viewport).

---

## 2. Component 1: Floating Sky Banner ("🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂")

### 2.1 Spatial & Visual Layout
- **Column Coordinates**: Columns 4 through 16 (inclusive).
- **World Pixel Range**:
  - `startX = 4 * TILE_SIZE = 64px`
  - `endX = 16 * TILE_SIZE + 16 = 272px`
  - `totalWidth = 208px`
  - `yPosition = 2 * TILE_SIZE = 32px` (floating in upper sky layer, rows 1 to 3)
- **Visual Design**:
  - **Banner Body**: Festive ribbon with deep magenta / gold fill (`rgba(233, 30, 99, 0.90)` and `#FFD700` border), scalloped ribbon tails on left & right.
  - **Typography**: Crisp retro font: `"🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"` rendered with white text, bold gold outline/drop shadow (`#3E1A00`), and subtle celebratory pulse.
  - **Dynamic Physics/Animation**: Sinusoidal floating wave motion: `yOffset = Math.sin(animTimer * 2.5) * 2.5px`.
  - **Balloon Anchors**: Left and right banner edges tied to floating red (`#FF1744`) and cyan (`#00E5FF`) party balloons.

### 2.2 Data Structure in `js/level.js`
In `createLevelData()`:
```javascript
skyBanner: {
  startCol: 4,
  endCol: 16,
  y: 32,
  text: '🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂',
  balloonLeft: { col: 3.5, y: 18, color: '#FF1744' },
  balloonRight: { col: 16.5, y: 18, color: '#00E5FF' }
}
```

### 2.3 Rendering Logic in `Level.prototype.draw()`
```javascript
drawSkyBanner(ctx) {
  if (!this.skyBanner) return;
  const startX = this.skyBanner.startCol * TILE_SIZE;
  const endX = (this.skyBanner.endCol + 1) * TILE_SIZE;
  const bannerW = endX - startX;
  const bannerH = 20;
  
  const drawX = Math.round(startX - this.cameraX);
  const floatY = Math.round(this.skyBanner.y + Math.sin(this.animTimer * 2.5) * 2.5);

  // Culling check against viewport
  if (drawX + bannerW < -20 || drawX > 200) return;

  ctx.save();
  // 1. Draw Balloon anchor cords
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(drawX + 8, floatY + 6);
  ctx.lineTo(drawX - 6, floatY - 8);
  ctx.moveTo(drawX + bannerW - 8, floatY + 6);
  ctx.lineTo(drawX + bannerW + 6, floatY - 8);
  ctx.stroke();

  // 2. Draw Balloons
  // Left balloon
  ctx.fillStyle = '#FF1744';
  ctx.beginPath();
  ctx.ellipse(drawX - 6, floatY - 12, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right balloon
  ctx.fillStyle = '#00E5FF';
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
  ctx.font = 'bold 8px "Press Start 2P", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Text Drop Shadow
  ctx.fillStyle = '#3E1A00';
  ctx.fillText(this.skyBanner.text, drawX + bannerW / 2 + 1, floatY + bannerH / 2 + 1);
  // Main Text Fill (Bright Gold / White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(this.skyBanner.text, drawX + bannerW / 2, floatY + bannerH / 2);

  ctx.restore();
}
```

---

## 3. Component 2: Roadside Humorous Milestone Signposts

### 3.1 Signpost Locations & Birthday Lore
Four milestone signposts are placed at strategic checkpoints along the level to encourage Iván and deliver continuous birthday humor:

| Milestone # | Tile Col | Pixel X | Floor Row | Sign Title | Lore & Humorous Message | Context / Landmark |
|---|---|---|---|---|---|---|
| **Sign 1** | **Col 12** | 192px | Row 12 (y=192) | `KM 0` | `"🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!\n¡A por la gran recompensa!"` | Starting zone, right after first question blocks. |
| **Sign 2** | **Col 40** | 640px | Row 12 (y=192) | `KM 10` | `"🐱 CUIDADO CON LOS GATOS MEME:\n¡Muerden si no sabes saltar!"` | Safe clearing right after tall Pipe 3 (col 38-39). |
| **Sign 3** | **Col 72** | 1152px | Row 12 (y=192) | `KM 25` | `"😎 KM 25: Más sabio, con más flow\ny jugando como un Dios."` | High-skill section between Pipe 4 & Pipe 5. |
| **Sign 4** | **Col 92** | 1472px | Row 12 (y=192) | `KM 30` | `"🏰 ¡LA TARTA GIGANTE Y TU REGALO\nTE ESPERAN EN EL CASTILLO!"` | Final clearing right before the end pyramid staircase. |

### 3.2 Signpost Data Structure in `js/level.js`
```javascript
signposts: [
  {
    id: 1,
    col: 12,
    x: 12 * TILE_SIZE,
    y: (GROUND_ROW - 1) * TILE_SIZE,
    title: 'KM 0',
    lines: ['🎂 NIVEL 2026: ¡CUMPLE DE IVÁN!', '¡A por la gran recompensa!'],
    icon: '🎂'
  },
  {
    id: 2,
    col: 40,
    x: 40 * TILE_SIZE,
    y: (GROUND_ROW - 1) * TILE_SIZE,
    title: 'KM 10',
    lines: ['🐱 CUIDADO CON LOS GATOS MEME:', '¡Muerden si no sabes saltar!'],
    icon: '⚠️'
  },
  {
    id: 3,
    col: 72,
    x: 72 * TILE_SIZE,
    y: (GROUND_ROW - 1) * TILE_SIZE,
    title: 'KM 25',
    lines: ['😎 KM 25: Más sabio, con más flow', 'y jugando como un Dios.'],
    icon: '⭐'
  },
  {
    id: 4,
    col: 92,
    x: 92 * TILE_SIZE,
    y: (GROUND_ROW - 1) * TILE_SIZE,
    title: 'KM 30',
    lines: ['🏰 ¡LA TARTA GIGANTE Y TU REGALO', 'TE ESPERAN EN EL CASTILLO!'],
    icon: '🎁'
  }
]
```

### 3.3 Visual Presentation & Proximity Dialog Popup
1. **The Physical Signpost**:
   - Wooden upright post (3px wide, 14px high, color `#8D4F00`).
   - Wooden signboard plate (20px wide, 12px high, color `#C07D38` with beveled highlight `#FFD700` and dark border `#4A2306`).
   - Center text: Golden title (e.g. `KM 0`, `KM 10`, etc.).
2. **Interactive Speech Bubble Dialog**:
   - When player's x-coordinate is within 36px (`Math.abs(player.x - sign.x) < 36`):
     - An animated speech bubble pops up above the sign (`y = sign.y - 34px`).
     - Speech bubble has a rounded dark slate background (`rgba(20, 20, 30, 0.92)`), gold border (`#FFD700`), downward triangular tail, and multi-line celebratory text.

---

## 4. Component 3: Meme Enemy Spawn Roster (Pop Cat, Doge, Grumpy Cat)

### 4.1 Meme Enemy Archetypes & Behaviors

| Enemy Character | Subtype Key | Visual & Animation Characteristics | Combat & Stomp Easter Eggs |
|---|---|---|---|
| **Pop Cat** | `'popcat'` | Opens and closes mouth rhythmically (`popcat_walk_1` / `popcat_walk_2`) every 160ms. Wide pancake squash (`popcat_squash`). | Emits authentic Web Audio Pop Cat "POP!" sound. Awards +100 score with floating `"+100 POP!"` particle. |
| **Doge** | `'doge'` | Golden Shiba Inu head with raised inquisitive eyebrow and sideways trot (`doge_walk_1` / `doge_walk_2`). | Emits cartoon "Bonk!" sound. Spawns random floating Doge text: `"much jump"`, `"very iván"`, `"so birthday"`, `"wow"`, `"+100 AURA"`. |
| **Grumpy Cat** | `'grumpy'` | Dark seal-point mask, piercing icy-blue stare, permanent scowl (`grumpy_walk_1` / `grumpy_walk_2`). | Emits cartoon thud. Spawns floating scowl text: `"NO."`, `"-100 CRINGE"`, `"much party? NO."`. |

### 4.2 Complete 11-Patrol Level Spawn Roster
The 11 meme enemies are placed across the 130-tile level to maintain rhythm, progression, and comedic variety:

```javascript
const enemySpawns = [
  // 1. Pop Cat introductory patrol (col 15)
  { type: 'popcat', x: 15 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 2. Doge patrol between Pipe 1 (col 18) and Pipe 2 (col 26)
  { type: 'doge', x: 22 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 3. Grumpy Cat patrol before Pit 1 (cols 34-35)
  { type: 'grumpy', x: 30 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 4. Pop Cat patrol after Pipe 3 (col 38) and Sign 2 (col 40)
  { type: 'popcat', x: 43 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 5. Doge patrol under mid-level elevated block bridge (cols 44-54)
  { type: 'doge', x: 53 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 6. Grumpy Cat guard before 3-tile wide Pit 2 (cols 60-62)
  { type: 'grumpy', x: 57 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 7. Pop Cat patrol between Pipe 4 (col 66) and Sign 3 (col 72)
  { type: 'popcat', x: 69 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 8. Doge patrol between Sign 3 (col 72) and Pipe 5 (col 76)
  { type: 'doge', x: 74 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 9. Grumpy Cat under high question block runway (cols 80-86)
  { type: 'grumpy', x: 82 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 10. Doge patrol before Pit 3 (cols 88-89)
  { type: 'doge', x: 86 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  
  // 11. Pop Cat gatekeeper right before Sign 4 (col 92) and Victory Pyramid
  { type: 'popcat', x: 91 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE }
];
```

---

## 5. Component 4: Grand Birthday Castle & Party Goal

### 5.1 Castle Architectural Layout
The castle at the end of the stage is customized with party battlements and a 3-tier birthday cake centerpiece:

- **Base Footprint**: Columns 112 to 116 (5 tiles wide = 80px), Rows 9 to 12 (`GROUND_ROW - 4` to `GROUND_ROW - 1`).
- **Masonry Tiles (`castle_brick`)**: Ashlar masonry adorned with festive ruby and cyan bunting (`js/assets.js` line 1085).
- **Castle Doorway (`castle_door`)**: Column 114, Rows 11 & 12 (Arched mahogany door).
- **Party Battlements (`castle_battlement`)**: Columns 112, 114, 116, Row 8 (`GROUND_ROW - 5`), featuring fluttering ruby and gold flags.
- **Centerpiece 3-Tier Birthday Cake (`castle_cake`)**:
  - Column 114, Row 7 (`GROUND_ROW - 6`).
  - Rendered with strawberry cream frosting, glowing candle flame, chocolate layers, and gold stars!

### 5.2 Grid Placement Code in `createLevelData()`
```javascript
// 6. Birthday Castle (x: 112..116, y: GROUND_ROW - 4 .. GROUND_ROW - 1)
for (let cx = 112; cx <= 116; cx++) {
  for (let cy = GROUND_ROW - 4; cy < GROUND_ROW; cy++) {
    grid[cy][cx] = 'castle_brick';
  }
}
// Party Battlements with festive flags
grid[GROUND_ROW - 5][112] = 'castle_battlement';
grid[GROUND_ROW - 5][114] = 'castle_battlement';
grid[GROUND_ROW - 5][116] = 'castle_battlement';

// Grand Centerpiece 3-Tier Birthday Cake
grid[GROUND_ROW - 6][114] = 'castle_cake';

// Castle Door (Arched Mahogany)
grid[GROUND_ROW - 1][114] = 'castle_door';
grid[GROUND_ROW - 2][114] = 'castle_door';
```

### 5.3 Solid Tile Configuration
Update `SOLID_TILES` in `js/level.js`:
```javascript
const SOLID_TILES = new Set([
  'ground', 'ground_filler', 'brick', 'question', 'empty',
  'pipe_tl', 'pipe_tr', 'pipe_bl', 'pipe_br',
  'castle_brick', 'castle_battlement'
]);
```
*(Note: `castle_door` and `castle_cake` are intentionally non-solid so Iván can walk through the door during the victory walk and the cake sits decoratively atop the battlement).*

---

## 6. Component 5: "Deal-With-It" Sunglasses on Background Clouds

### 6.1 Visual Design & Coordinates
The classic 8-bit MLG "Deal With It" sunglasses are placed on each background parallax cloud:

```
    [==============================]  <-- Top bridge bar
    | [■][■]  \  |     | [■][■]  \  |  <-- Left/Right lenses with 45° white glint
    [==============================]  
```

- **Dimensions**: 14px wide × 5px high.
- **Color Palette**:
  - Frame & Lens Body: Pitch Black (`#000000`)
  - Specular Glints: Crisp White (`#FFFFFF`) at 45° angle across both lenses.

### 6.2 Implementation in `drawBackground()` (`js/game.js`)
```javascript
drawBackground(ctx, cameraX) {
  // Parallax Clouds (slow scroll)
  const cloudCam = cameraX * 0.3;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  
  for (let i = 0; i < 15; i++) {
    const cx = Math.round((i * 140 + 30) - cloudCam);
    const cy = 40 + (i % 2 === 0 ? 0 : 8); // Alternate cloud altitudes
    
    if (cx > -60 && cx < VIEWPORT_WIDTH + 60) {
      // 1. Draw Fluffy Cloud Body
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 4, 14, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw "Deal-With-It" Sunglasses on Cloud Center
      const sx = cx + 4;
      const sy = cy - 6;
      
      // Black Sunglasses Frames & Bridge
      ctx.fillStyle = '#000000';
      // Left Lens
      ctx.fillRect(sx, sy, 5, 4);
      // Right Lens
      ctx.fillRect(sx + 7, sy, 5, 4);
      // Bridge
      ctx.fillRect(sx + 4, sy + 1, 4, 1);
      // Frame Temples
      ctx.fillRect(sx - 1, sy, 1, 2);
      ctx.fillRect(sx + 12, sy, 1, 2);

      // White Specular Glints (45° diagonal glint \ \)
      ctx.fillStyle = '#FFFFFF';
      // Left Glint
      ctx.fillRect(sx + 1, sy + 1, 1, 1);
      ctx.fillRect(sx + 2, sy + 2, 1, 1);
      // Right Glint
      ctx.fillRect(sx + 8, sy + 1, 1, 1);
      ctx.fillRect(sx + 9, sy + 2, 1, 1);
    }
  }

  // Ground Hills with festive flowers
  const hillCam = cameraX * 0.6;
  ctx.fillStyle = '#00A800';
  for (let i = 0; i < 12; i++) {
    const hx = Math.round((i * 180 + 20) - hillCam);
    if (hx > -80 && hx < VIEWPORT_WIDTH + 80) {
      ctx.beginPath();
      ctx.arc(hx, 208, 28, Math.PI, 0);
      ctx.fill();
    }
  }
}
```

---

## 7. Concrete File Modification Proposals

### 7.1 Proposed Changes to `js/level.js`
1. **Extend `createLevelData()`**:
   - Add `skyBanner` object.
   - Add `signposts` array with 4 milestone entries.
   - Replace 7 generic goomba spawns with full 11-enemy meme roster (`popcat`, `doge`, `grumpy`).
   - Add `castle_battlement` and `castle_cake` to castle grid.
2. **Extend `SOLID_TILES` Set**: Add `'castle_battlement'`.
3. **Extend `Level.prototype.draw()`**:
   - Call `this.drawSkyBanner(ctx)` after tile rendering.
   - Call `this.drawSignposts(ctx, playerX)` to render wooden milestone posts and proximity dialog bubbles.

### 7.2 Proposed Changes to `js/entities.js`
1. **Upgrade `Goomba` class into `MemeEnemy`**:
   - Support `subtype`: `'popcat'`, `'doge'`, `'grumpy'` (with `'goomba'` alias).
   - Render corresponding sprite keys: `popcat_walk_1/2`, `doge_walk_1/2`, `grumpy_walk_1/2`, and squash frames.
   - Stomp sound & particle triggers:
     - Pop Cat -> `GameAudio.playStomp()` + `"+100 POP!"`
     - Doge -> `GameAudio.playStomp()` + random Doge phrase (`"much jump"`, `"so birthday"`, `"wow"`, `"+100 AURA"`)
     - Grumpy Cat -> `GameAudio.playBump()` + `"NO."` / `"-100 CRINGE"`

### 7.3 Proposed Changes to `js/game.js`
1. Pass `this.player.x` to `level.draw(ctx, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, this.player ? this.player.x : 0)` so signpost proximity dialogs can detect player distance.
2. Update `drawBackground(ctx, cameraX)` to include Deal-With-It sunglasses on clouds.

---

## 8. Verification & Test Plan

1. **Unit & Integration Suite**:
   - Run `node test/verify_m3_gameplay.mjs` — verify 100% tests pass.
   - Run `node test/test_tier1_features.mjs` — verify 100% feature coverage tests pass.
2. **Headless Browser CDP Suite**:
   - Run `node test/headless_validator.mjs` — verify 0 console errors, 0 uncaught exceptions.
3. **Visual Inspections**:
   - Verify floating sky banner appears in cols 4 to 16.
   - Verify signposts appear at cols 12, 40, 72, 92 with interactive popups.
   - Verify Pop Cat, Doge, and Grumpy Cat animate and stomp properly.
   - Verify castle renders party battlements and crowning birthday cake.
   - Verify clouds display Deal-With-It sunglasses.

---
