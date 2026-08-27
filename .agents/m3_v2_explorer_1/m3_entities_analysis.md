# M3 Analysis & Architectural Design: Meme Entities, Combat Text & Particle Systems

**Target Edition**: V2 Iván's Birthday Gift Edition  
**Working Directory**: `c:\Users\SrJos\Downloads\Proyecto ivan\.agents\m3_v2_explorer_1`  
**Target Files**: `js/entities.js`, `js/assets.js`, `js/audio.js`, `js/level.js`, `js/game.js`  
**Author**: M3 Meme Entities & Combat Text Explorer  
**Timestamp**: 2026-08-27T19:25:00Z  

---

## 1. Executive Summary

Milestone 3 transforms the platformer gameplay from a standard prototype into an interactive, hilarious internet meme and birthday experience. This document provides the complete technical specification, physics formulations, animation timing loops, particle emitters, and full drop-in code recommendations for:

1. **Meme Enemy Trio (`PopCat`, `Doge`, `GrumpyCat`, `MemeEnemy`, `Goomba`)**:
   - Full integration with M1 high-definition pixel art matrices (`popcat_walk_1/2`, `doge_walk_1/2`, `grumpy_walk_1/2`, and `*_squash`).
   - Distinctive physics profiles (PopCat standard patrol, Doge agile trot, Grumpy Cat slow scowl).
   - 100% backwards compatibility for existing `Goomba` callers and tests.
2. **PopCat Rhythmic Mouth Popping Animation**:
   - Dedicated 180ms (`0.180s`) mouth state toggle timer between open (`popcat_walk_2`) and closed (`popcat_walk_1`) mouth.
3. **Stomp Squash Mechanics**:
   - Top-collision AABB detection (`player.vy > 0 && player.y + player.height <= enemy.y + 10`).
   - Exact 450ms (`0.450s`) squash state duration before entity cleanup.
   - Instant upward player rebound jump impulse (`player.vy = -260 px/s`, `player.isJumping = true`).
   - Audio trigger `GameAudio.playStomp()` (Pop Cat resonant mouth cavity pop + sub-bass).
4. **Floating Meme Combat Text Particle System**:
   - Upward drifting combat text particles with high-contrast 2px black outline, vibrant fills, and pop-in scale curves.
   - Contextual meme text pools for Stomps (`"+100 AURA"`, `"BONK!"`, `"much jump, wow"`, `"NO."`, `"GET SQUASHED"`), Coins (`"+200 COIN"`, `"MUCH RICH"`, `"STONKS ↗"`, `"+1000 IVÁN"`), and Block Bumps.
5. **Multi-Colored Confetti Particle Emitter**:
   - Physics-based confetti with flutter oscillation, air resistance, rotation, and 8 celebratory colors.
   - Emitter triggers on coin pickup (6–8 burst particles), block bump (4–6 particles), and flagpole victory (continuous 80–120 shower across the viewport).

---

## 2. Deep Dive 1: Meme Enemy Hierarchy & Sprite Integration

### 2.1 Sprite Assets Registry in `js/assets.js`
The M1 sprite pipeline in `js/assets.js` provides the following sprite keys under category `'enemy'`:
- **Pop Cat**: `popcat_walk_1` (mouth closed), `popcat_walk_2` (wide open mouth), `popcat_squash` (squashed wide mouth).
- **Doge**: `doge_walk_1` (side eye squint), `doge_walk_2` (tongue out bork), `doge_squash` (flattened Shiba).
- **Grumpy Cat**: `grumpy_walk_1` (scowling step left), `grumpy_walk_2` (scowling step right), `grumpy_squash` (disgruntled scowl pancake).
- **Aliases**: `walk_1`, `walk_2`, `squash`, `goomba_walk_1`, `goomba_squash` all resolve gracefully.

### 2.2 Class Hierarchy Design
```
                     ┌──────────────────┐
                     │    MemeEnemy     │ (Base Class: AABB, Kinematics, Stomp, Hazard)
                     └─────────┬────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐
│     PopCat       │  │      Doge        │  │    GrumpyCat     │
│ (180ms mouth pop)│  │ (Agile Doge trot)│  │ (Slow Grumpy run)│
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │
┌────────┴─────────┐
│  Goomba (Alias)  │ (100% Backwards Compatibility)
└──────────────────┘
```

### 2.3 Individual Entity Specifications
| Entity Variant | Base Speed (`vx`) | Walk Anim Rate | Stomp Text Pool | Specific Mechanic |
|---|---|---|---|---|
| **PopCat** | `-35` px/s | 180ms mouth timer | `"+100 AURA"`, `"BONK!"`, `"POPPED!"`, `"O-P-E-N!"` | Rhythmic mouth popping (open/closed) |
| **Doge** | `-45` px/s | 120ms leg toggle | `"much jump, wow"`, `"such bounce"`, `"very bonk"`, `"so flat"` | High-speed comical trot |
| **GrumpyCat** | `-28` px/s | 200ms leg toggle | `"NO."`, `"GET SQUASHED"`, `"I HATED THAT"`, `"MEH"` | Resolute slow march with constant scowl |

---

## 3. Deep Dive 2: PopCat Rhythmic Mouth Popping Animation (180ms)

### 3.1 Timing Formula
The mouth popping animation toggles every 180ms (`0.180s`).
```javascript
const POPCAT_MOUTH_INTERVAL = 0.18; // 180ms

// Inside PopCat.prototype.update(dt):
this.animTimer += dt;

// Inside PopCat.prototype.draw(ctx, cameraX):
if (this.isSquashed) {
  spriteName = 'popcat_squash';
} else {
  const isMouthOpen = (Math.floor(this.animTimer / POPCAT_MOUTH_INTERVAL) % 2) === 1;
  spriteName = isMouthOpen ? 'popcat_walk_2' : 'popcat_walk_1';
}
```
This guarantees an authentic, continuous, comedic "pop-pop-pop" mouth motion while patrolling the birthday world.

---

## 4. Deep Dive 3: Stomp Squash Mechanics & Rebound Impulse

### 4.1 Stomp Collision Detection
The player stomps an enemy when falling downward and colliding on top:
$$\text{isStomp} = (\text{player.vy} > 0) \land (\text{player.y} + \text{player.height} \le \text{enemy.y} + 10)$$

### 4.2 Stomp Resolution Sequence
1. **Enemy State Transition**:
   - `enemy.isSquashed = true;`
   - `enemy.squashTimer = 0.45;` (450ms duration)
   - `enemy.vx = 0; enemy.vy = 0;`
2. **Player Physics Rebound**:
   - `player.vy = -260;` (immediate upward impulse)
   - `player.isJumping = true;`
   - `player.onGround = false;`
3. **Audio Synthesis Trigger**:
   - `GameAudio.playStomp()` (resonant 420Hz bandpass mouth cavity pop + sub-bass 180Hz->50Hz drop).
4. **Scoring & Effects**:
   - Adds 100 points to score.
   - Spawns floating meme combat text (e.g., `"+100 AURA"`).
   - Spawns confetti particle burst (6–8 flakes).
5. **Entity Lifecycle**:
   - During `squashTimer > 0`, the squashed sprite is drawn.
   - When `squashTimer <= 0`, `enemy.isAlive = false` and it is removed from the active entity list.

---

## 5. Deep Dive 4: Floating Meme Combat Text Particle System

### 5.1 Meme Text Pools
```javascript
const MEME_TEXTS = {
  stomp_popcat: ['+100 AURA', 'BONK!', 'POPPED!', 'O-P-E-N!', '+100 IVÁN'],
  stomp_doge: ['much jump, wow', 'such bounce', 'very bonk', 'so flat', '+100 DOGE'],
  stomp_grumpy: ['NO.', 'GET SQUASHED', 'I HATED THAT', 'MEH', '+100 AURA'],
  stomp_default: ['+100 AURA', 'BONK!', 'much jump, wow', 'NO.', 'GET SQUASHED'],
  coin: ['+200 COIN', 'MUCH RICH', 'STONKS ↗', '+1000 IVÁN', 'KA-CHING!', 'AURA +200'],
  block: ['+50 IVÁN', 'BOOP!', 'CLANG!', '¡CUMPLEAÑOS!']
};
```

### 5.2 Floating Text Particle Architecture (`FloatingText`)
- **Physics**:
  - `x, y`: position
  - `vy = -55` px/s (smooth upward drift)
  - `vx = (Math.random() - 0.5) * 16` (slight random lateral drift)
  - `life = 0.70`s, `maxLife = 0.70`s
- **Dynamic Scaling & Alpha Fade**:
  - Pop-in elastic scale: $S(t) = \min(1.2, 0.4 + 1.6 \times (1 - \text{life}/\text{maxLife}))$ for the first 100ms, then settling to $1.0$.
  - Alpha fade: $\alpha = \text{clamp}(\text{life} / 0.3, 0, 1)$.
- **Rendering**:
  - Canvas 2D stroke text (`lineWidth = 2.5`, `strokeStyle = '#000000'`) for crisp contrast against any background.
  - Filled with vibrant font (`fillStyle = this.color`, font `'bold 8px "Press Start 2P", monospace'`).

---

## 6. Deep Dive 5: Confetti Particle Emitter

### 6.1 Particle Physics & Flutter Dynamics
Each confetti particle models paper aerodynamics:
- **Velocity**: `vx += Math.sin(this.wobbleTimer * 10) * 15 * dt;`
- **Gravity**: `vy += 260 * dt;`
- **Drag**: `vx *= 0.96; vy *= 0.98;`
- **Rotation**: `rotation += rotSpeed * dt;`
- **Palette**:
  - Birthday Ruby Red: `#FF1744`
  - Royal Gold: `#FFD700`
  - Festive Magenta: `#FF1493`
  - Electric Cyan: `#00E5FF`
  - Lime Green: `#76FF03`
  - Vivid Orange: `#FF6D00`
  - Birthday Purple: `#D500F9`
  - Pure White: `#FFFFFF`

### 6.2 Emitter Types & Counts
| Trigger | Particle Count | Initial Velocity Profile | Lifespan |
|---|---|---|---|
| **Coin Pickup** | 6–8 particles | Radial burst ($v_x \in [-70, 70]$, $v_y \in [-130, -50]$) | 0.6s – 1.0s |
| **Block Bump** | 4–6 particles | Upward fountain ($v_x \in [-40, 40]$, $v_y \in [-160, -90]$) | 0.5s – 0.9s |
| **Flagpole Victory** | 80–120 particles | Wide sky shower across viewport width ($v_y \in [40, 120]$) | 1.8s – 3.0s |

---

## 7. Proposed Drop-in Code for `js/entities.js`

Here is the complete, modular, high-performance implementation designed for `js/entities.js`:

```javascript
/**
 * js/entities.js - Player, Meme Enemies (PopCat, Doge, GrumpyCat), Collectibles,
 *                  Floating Meme Combat Text & Confetti Particle System
 *
 * V2 Iván's Birthday Gift Edition (M3)
 */
(function (global) {
  'use strict';

  const TILE_SIZE = 16;

  // =========================================================================
  // 1. FLOATING MEME COMBAT TEXT PARTICLE
  // =========================================================================
  const MEME_TEXTS = {
    stomp_popcat: ['+100 AURA', 'BONK!', 'POPPED!', 'O-P-E-N!', '+100 IVÁN'],
    stomp_doge: ['much jump, wow', 'such bounce', 'very bonk', 'so flat', '+100 DOGE'],
    stomp_grumpy: ['NO.', 'GET SQUASHED', 'I HATED THAT', 'MEH', '+100 AURA'],
    stomp_default: ['+100 AURA', 'BONK!', 'much jump, wow', 'NO.', 'GET SQUASHED'],
    coin: ['+200 COIN', 'MUCH RICH', 'STONKS ↗', '+1000 IVÁN', 'KA-CHING!', 'AURA +200'],
    block: ['+50 IVÁN', 'BOOP!', 'CLANG!', '¡CUMPLEAÑOS!']
  };

  class Particle {
    constructor(x, y, text, color = '#FFD700', options = {}) {
      this.x = x;
      this.y = y;
      this.text = String(text);
      this.color = color;
      this.vx = (options.vx !== undefined) ? options.vx : ((Math.random() - 0.5) * 18);
      this.vy = (options.vy !== undefined) ? options.vy : -55; // Drifts upward
      this.life = (options.life !== undefined) ? options.life : 0.70; // 700ms lifespan
      this.maxLife = this.life;
      this.isAlive = true;
      this.scale = 0.5;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;

      // Elastic pop-in scale
      const elapsed = this.maxLife - this.life;
      if (elapsed < 0.12) {
        this.scale = 0.5 + (elapsed / 0.12) * 0.7; // Scale up to 1.2
      } else {
        this.scale = Math.max(1.0, 1.2 - (elapsed - 0.12) * 0.5);
      }

      if (this.life <= 0) {
        this.isAlive = false;
      }
    }

    draw(ctx, cameraX) {
      if (!this.isAlive) return;
      const alpha = Math.max(0, Math.min(1, this.life / 0.25));
      const drawX = Math.round(this.x - cameraX);
      const drawY = Math.round(this.y);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(drawX, drawY);
      ctx.scale(this.scale, this.scale);

      ctx.font = 'bold 8px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 2px Black outline for high contrast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(this.text, 0, 0);

      // Bright fill
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, 0, 0);

      ctx.restore();
    }
  }

  // =========================================================================
  // 2. CELEBRATORY CONFETTI PARTICLE EMITTER
  // =========================================================================
  const CONFETTI_COLORS = [
    '#FF1744', // Ruby Red
    '#FFD700', // Gold
    '#FF1493', // Deep Pink
    '#00E5FF', // Cyan
    '#76FF03', // Lime
    '#FF6D00', // Orange
    '#D500F9', // Purple
    '#FFFFFF'  // White
  ];

  class ConfettiParticle {
    constructor(x, y, vx, vy, color, life = 1.0, size = 3) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color || CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 12;
      this.wobbleTimer = Math.random() * 10;
      this.isAlive = true;
    }

    update(dt) {
      this.wobbleTimer += dt;
      this.vx += Math.sin(this.wobbleTimer * 8) * 12 * dt;
      this.vy += 260 * dt; // Flutter gravity
      this.vx *= 0.96;
      this.vy *= 0.98;

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
      this.life -= dt;

      if (this.life <= 0) {
        this.isAlive = false;
      }
    }

    draw(ctx, cameraX) {
      if (!this.isAlive) return;
      const alpha = Math.max(0, Math.min(1, this.life / 0.3));
      const drawX = Math.round(this.x - cameraX);
      const drawY = Math.round(this.y);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(drawX, drawY);
      ctx.rotate(this.rotation);

      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);

      ctx.restore();
    }
  }

  // =========================================================================
  // 3. BLOCK COIN (Pops out of hit question block)
  // =========================================================================
  class BlockCoin {
    constructor(x, y) {
      this.x = x;
      this.startY = y;
      this.y = y - 8;
      this.vy = -260; // Initial pop impulse
      this.gravity = 1100;
      this.animTimer = 0;
      this.isAlive = true;
    }

    update(dt) {
      this.animTimer += dt;
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;

      if (this.vy > 0 && this.y >= this.startY - 4) {
        this.isAlive = false;
      }
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;
      const frameIdx = (Math.floor(this.animTimer * 16) % 4) + 1;
      const spriteName = `coin_${frameIdx}`;
      global.GameAssets.drawSprite(
        ctx,
        'item',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // =========================================================================
  // 4. COLLECTIBLE FLOATING COIN
  // =========================================================================
  class Coin {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 14;
      this.height = 14;
      this.animTimer = Math.random(); // Desync animations
      this.isAlive = true;
    }

    update(dt, player, onCollect) {
      if (!this.isAlive) return;
      this.animTimer += dt;

      if (player && player.isAlive && global.GamePhysics && global.GamePhysics.checkAABB) {
        const coinBox = { x: this.x + 1, y: this.y + 1, width: this.width, height: this.height };
        const playerBox = { x: player.x + 2, y: player.y, width: player.width - 4, height: player.height };

        if (global.GamePhysics.checkAABB(coinBox, playerBox)) {
          this.isAlive = false;
          if (onCollect) {
            onCollect(this.x, this.y);
          }
        }
      }
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;
      const frameIdx = (Math.floor(this.animTimer * 8) % 4) + 1;
      const spriteName = `coin_${frameIdx}`;
      global.GameAssets.drawSprite(
        ctx,
        'item',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // =========================================================================
  // 5. BASE MEME ENEMY CLASS
  // =========================================================================
  class MemeEnemy {
    constructor(x, y, type = 'popcat', baseSpeed = -35) {
      this.x = x;
      this.y = y;
      this.width = 16;
      this.height = 16;
      this.type = type; // 'popcat', 'doge', 'grumpy', 'goomba'
      this.vx = baseSpeed;
      this.vy = 0;
      this.facing = this.vx < 0 ? -1 : 1;
      this.onGround = false;
      this.isAlive = true;
      this.isSquashed = false;
      this.squashTimer = 0;
      this.animTimer = 0;
    }

    squash() {
      this.isSquashed = true;
      this.squashTimer = 0.45; // 450ms squash duration
      this.vx = 0;
      this.vy = 0;
    }

    update(dt, map, player, onStomp, onKillPlayer) {
      if (!this.isAlive) return;

      if (this.isSquashed) {
        this.squashTimer -= dt;
        if (this.squashTimer <= 0) {
          this.isAlive = false;
        }
        return;
      }

      this.animTimer += dt;

      // Apply Gravity
      if (!this.onGround && global.GamePhysics) {
        this.vy += global.GamePhysics.GRAVITY_FALL * dt;
        this.vy = Math.min(this.vy, global.GamePhysics.TERMINAL_VELOCITY);
      }

      // Move & Resolve map collisions
      const prevVx = this.vx;
      if (global.GamePhysics && global.GamePhysics.resolveMapCollisions) {
        const col = global.GamePhysics.resolveMapCollisions(this, map, dt);
        if (col.collidedX) {
          this.vx = -prevVx;
          this.facing = this.vx < 0 ? -1 : 1;
        }
      }

      // Check pit fall
      if (map && this.y > map.worldPixelHeight + 32) {
        this.isAlive = false;
        return;
      }

      // Player Interaction
      if (player && player.isAlive && player.state !== 'DEAD' && player.state !== 'FLAG_SLIDE' && player.state !== 'VICTORY_WALK') {
        const enemyBox = { x: this.x + 2, y: this.y + 2, width: this.width - 4, height: this.height - 2 };
        const playerBox = { x: player.x + 2, y: player.y, width: player.width - 4, height: player.height };

        if (global.GamePhysics && global.GamePhysics.checkAABB(enemyBox, playerBox)) {
          // Stomp condition: Player falling onto top half of enemy
          const isStomp = player.vy > 0 && (player.y + player.height <= this.y + 10);

          if (isStomp) {
            this.squash();
            player.vy = -260; // Upward rebound bounce
            player.isJumping = true;
            player.onGround = false;
            if (onStomp) {
              onStomp(this.x, this.y, this.type);
            }
          } else {
            // Hazard: Enemy hurts Player
            if (onKillPlayer) {
              onKillPlayer();
            }
          }
        }
      }
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;

      let spriteName = 'walk_1';
      if (this.isSquashed) {
        spriteName = `${this.type}_squash`;
      } else {
        const frameIdx = (Math.floor(this.animTimer * 6) % 2) + 1;
        spriteName = `${this.type}_walk_${frameIdx}`;
      }

      const flipX = this.vx > 0;
      global.GameAssets.drawSprite(
        ctx,
        'enemy',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE,
        flipX
      );
    }
  }

  // =========================================================================
  // 6. POPCAT (180ms Rhythmic Mouth Popping)
  // =========================================================================
  class PopCat extends MemeEnemy {
    constructor(x, y) {
      super(x, y, 'popcat', -35);
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;

      let spriteName = 'popcat_walk_1';
      if (this.isSquashed) {
        spriteName = 'popcat_squash';
      } else {
        // 180ms Rhythmic mouth popping toggle
        const isMouthOpen = (Math.floor(this.animTimer / 0.18) % 2) === 1;
        spriteName = isMouthOpen ? 'popcat_walk_2' : 'popcat_walk_1';
      }

      const flipX = this.vx > 0;
      global.GameAssets.drawSprite(
        ctx,
        'enemy',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE,
        flipX
      );
    }
  }

  // =========================================================================
  // 7. DOGE (Kabosu Shiba Inu)
  // =========================================================================
  class Doge extends MemeEnemy {
    constructor(x, y) {
      super(x, y, 'doge', -45); // Agile Doge trot
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;

      let spriteName = 'doge_walk_1';
      if (this.isSquashed) {
        spriteName = 'doge_squash';
      } else {
        const frameIdx = (Math.floor(this.animTimer * 7) % 2) + 1;
        spriteName = `doge_walk_${frameIdx}`;
      }

      const flipX = this.vx > 0;
      global.GameAssets.drawSprite(
        ctx,
        'enemy',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE,
        flipX
      );
    }
  }

  // =========================================================================
  // 8. GRUMPY CAT (Tardar Sauce)
  // =========================================================================
  class GrumpyCat extends MemeEnemy {
    constructor(x, y) {
      super(x, y, 'grumpy', -28); // Slow disgruntled march
    }

    draw(ctx, cameraX) {
      if (!this.isAlive || !global.GameAssets || !global.GameAssets.isReady) return;

      let spriteName = 'grumpy_walk_1';
      if (this.isSquashed) {
        spriteName = 'grumpy_squash';
      } else {
        const frameIdx = (Math.floor(this.animTimer * 4) % 2) + 1;
        spriteName = `grumpy_walk_${frameIdx}`;
      }

      const flipX = this.vx > 0;
      global.GameAssets.drawSprite(
        ctx,
        'enemy',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE,
        flipX
      );
    }
  }

  // =========================================================================
  // 9. GOOMBA (Legacy Alias for Backward Compatibility)
  // =========================================================================
  class Goomba extends PopCat {
    constructor(x, y) {
      super(x, y);
    }
  }

  // =========================================================================
  // 10. PLAYER ENTITY & STATE MACHINE
  // =========================================================================
  class Player {
    constructor(x, y) {
      this.width = 16;
      this.height = 16;
      this.reset(x, y);
    }

    reset(x = 40, y = 192) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.facing = 1;
      this.onGround = true;
      this.isJumping = false;
      this.isSkidding = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;

      this.state = 'IDLE'; // IDLE, WALK, RUN, SKID, JUMP, FALL, FLAG_SLIDE, VICTORY_WALK, DEAD
      this.isAlive = true;
      this.animDist = 0;
      this.deathTimer = 0;
      this.flagSlideY = 0;
    }

    die() {
      if (this.state === 'DEAD') return;
      this.state = 'DEAD';
      this.isAlive = false;
      this.vx = 0;
      this.vy = -340; // Hop upward before falling
      this.deathTimer = 0;
      if (global.GameAudio) {
        global.GameAudio.playDeath();
      }
    }

    update(dt, input, map, onBlockHit, onFlagpoleReach) {
      if (this.state === 'DEAD') {
        this.deathTimer += dt;
        if (this.deathTimer > 0.3) {
          this.vy += (global.GamePhysics ? global.GamePhysics.GRAVITY_FALL : 1200) * dt;
          this.y += this.vy * dt;
        }
        return;
      }

      if (this.state === 'FLAG_SLIDE') {
        this.y += 90 * dt;
        const groundSurface = (map ? (map.GROUND_ROW * TILE_SIZE) : 208) - this.height;
        if (this.y >= groundSurface) {
          this.y = groundSurface;
          this.state = 'VICTORY_WALK';
          this.facing = 1;
        }
        return;
      }

      if (this.state === 'VICTORY_WALK') {
        this.vx = 55;
        this.x += this.vx * dt;
        this.animDist += Math.abs(this.vx) * dt;

        const doorX = map ? map.castleDoorX : 1824;
        if (this.x >= doorX) {
          this.x = doorX;
          this.vx = 0;
          this.state = 'IDLE';
        }
        return;
      }

      if (global.GamePhysics) {
        global.GamePhysics.applyKinematics(this, dt, input);
        const col = global.GamePhysics.resolveMapCollisions(this, map, dt);

        if (col.collidedY && col.hitCeilingTile && onBlockHit) {
          onBlockHit(col.hitCeilingTile.tx, col.hitCeilingTile.ty);
        }
      }

      if (map && this.y > map.worldPixelHeight) {
        this.die();
        return;
      }

      if (map && map.flagpole && this.x + this.width >= map.flagpole.x + 4 && this.x <= map.flagpole.x + 12) {
        if (this.y < map.flagpole.bottomY) {
          this.state = 'FLAG_SLIDE';
          this.vx = 0;
          this.vy = 0;
          this.x = map.flagpole.x - 8;
          if (onFlagpoleReach) {
            onFlagpoleReach();
          }
          return;
        }
      }

      if (!this.onGround) {
        this.state = this.vy < 0 ? 'JUMP' : 'FALL';
      } else if (this.isSkidding) {
        this.state = 'SKID';
      } else if (Math.abs(this.vx) > 0.5) {
        this.animDist += Math.abs(this.vx) * dt;
        this.state = Math.abs(this.vx) > 140 ? 'RUN' : 'WALK';
      } else {
        this.state = 'IDLE';
      }
    }

    draw(ctx, cameraX) {
      if (!global.GameAssets || !global.GameAssets.isReady) return;

      let spriteName = 'idle';

      if (this.state === 'DEAD') {
        spriteName = 'die';
      } else if (this.state === 'FLAG_SLIDE') {
        spriteName = 'flag';
      } else if (this.state === 'JUMP' || this.state === 'FALL') {
        spriteName = 'jump';
      } else if (this.state === 'SKID') {
        spriteName = 'skid';
      } else if (this.state === 'WALK' || this.state === 'RUN' || this.state === 'VICTORY_WALK') {
        const frameIdx = (Math.floor(this.animDist / 12) % 3) + 1;
        spriteName = `run_${frameIdx}`;
      } else {
        spriteName = 'idle';
      }

      const flipX = this.facing === -1;
      global.GameAssets.drawSprite(
        ctx,
        'player',
        spriteName,
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE,
        flipX
      );
    }
  }

  // =========================================================================
  // 11. FLAG ON FLAGPOLE
  // =========================================================================
  class GoalFlag {
    constructor(poleX, topY, bottomY) {
      this.x = poleX - 8;
      this.topY = topY + 8;
      this.bottomY = bottomY - 8;
      this.y = this.topY;
      this.isSliding = false;
    }

    startSlide() {
      this.isSliding = true;
    }

    update(dt) {
      if (this.isSliding && this.y < this.bottomY) {
        this.y += 90 * dt;
        if (this.y > this.bottomY) {
          this.y = this.bottomY;
        }
      }
    }

    draw(ctx, cameraX) {
      if (!global.GameAssets || !global.GameAssets.isReady) return;
      global.GameAssets.drawSprite(
        ctx,
        'tile',
        'flag',
        Math.round(this.x - cameraX),
        Math.round(this.y),
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // =========================================================================
  // 12. HELPER FACTORY METHODS
  // =========================================================================
  function createFloatingMemeText(x, y, eventType = 'stomp', enemyType = 'popcat') {
    let pool = MEME_TEXTS.stomp_default;
    let color = '#FFD700';

    if (eventType === 'coin') {
      pool = MEME_TEXTS.coin;
      color = '#00E5FF';
    } else if (eventType === 'block') {
      pool = MEME_TEXTS.block;
      color = '#FF1493';
    } else if (eventType === 'stomp') {
      if (enemyType === 'doge') {
        pool = MEME_TEXTS.stomp_doge;
        color = '#FFD700';
      } else if (enemyType === 'grumpy') {
        pool = MEME_TEXTS.stomp_grumpy;
        color = '#FF1744';
      } else {
        pool = MEME_TEXTS.stomp_popcat;
        color = '#76FF03';
      }
    }

    const text = pool[Math.floor(Math.random() * pool.length)];
    return new Particle(x, y, text, color);
  }

  function createConfettiBurst(x, y, count = 8, options = {}) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (options.speed || 80) + (Math.random() - 0.5) * 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 60; // Upward bias
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const life = 0.6 + Math.random() * 0.6;
      particles.push(new ConfettiParticle(x, y, vx, vy, color, life, 3));
    }
    return particles;
  }

  function createVictoryConfetti(x, y, count = 20) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const px = x + (Math.random() - 0.5) * 160;
      const py = y + (Math.random() - 0.5) * 40;
      const vx = (Math.random() - 0.5) * 50;
      const vy = 30 + Math.random() * 80;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const life = 1.8 + Math.random() * 1.2;
      particles.push(new ConfettiParticle(px, py, vx, vy, color, life, 3 + Math.floor(Math.random() * 3)));
    }
    return particles;
  }

  const GameEntities = {
    Player,
    MemeEnemy,
    PopCat,
    Doge,
    GrumpyCat,
    Goomba,
    Coin,
    BlockCoin,
    Particle,
    ConfettiParticle,
    GoalFlag,
    MEME_TEXTS,
    CONFETTI_COLORS,
    createPlayer(x, y) { return new Player(x, y); },
    createGoomba(x, y) { return new Goomba(x, y); },
    createPopCat(x, y) { return new PopCat(x, y); },
    createDoge(x, y) { return new Doge(x, y); },
    createGrumpyCat(x, y) { return new GrumpyCat(x, y); },
    createMemeEnemy(type, x, y) {
      const lower = String(type).toLowerCase();
      if (lower === 'doge') return new Doge(x, y);
      if (lower === 'grumpy' || lower === 'grumpycat') return new GrumpyCat(x, y);
      return new PopCat(x, y);
    },
    createCoin(x, y) { return new Coin(x, y); },
    createParticle(x, y, text, color, options) { return new Particle(x, y, text, color, options); },
    createFloatingMemeText,
    createConfettiBurst,
    createVictoryConfetti
  };

  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GameEntities = GameEntities;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEntities;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
```

---

## 8. Integration Points

### 8.1 `js/level.js` Spawns Update
In `js/level.js`, diversify the enemy spawns array across the meme trio:
```javascript
const enemySpawns = [
  { type: 'popcat', x: 15 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'doge',   x: 22 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'grumpy', x: 31 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'popcat', x: 42 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'doge',   x: 52 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'grumpy', x: 70 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE },
  { type: 'popcat', x: 84 * TILE_SIZE, y: (GROUND_ROW - 1) * TILE_SIZE }
];
```

### 8.2 `js/game.js` Event Hooks
1. **Meme Enemy Spawning**:
   ```javascript
   this.goombas = [];
   if (this.level && this.level.enemySpawns && global.GameEntities) {
     this.level.enemySpawns.forEach(spawn => {
       const enemy = global.GameEntities.createMemeEnemy ?
         global.GameEntities.createMemeEnemy(spawn.type, spawn.x, spawn.y) :
         global.GameEntities.createGoomba(spawn.x, spawn.y);
       this.goombas.push(enemy);
     });
   }
   ```
2. **On Stomp Hook**:
   ```javascript
   (x, y, enemyType) => {
     this.score += 100;
     if (global.GameEntities.createFloatingMemeText) {
       this.particles.push(global.GameEntities.createFloatingMemeText(x + 8, y, 'stomp', enemyType));
     }
     if (global.GameEntities.createConfettiBurst) {
       this.particles.push(...global.GameEntities.createConfettiBurst(x + 8, y, 6));
     }
     if (global.GameAudio) global.GameAudio.playStomp();
     this.updateHUD();
   }
   ```
3. **On Coin Hook**:
   ```javascript
   addCoin(x, y) {
     this.coins++;
     this.score += 200;
     if (global.GameEntities.createFloatingMemeText) {
       this.particles.push(global.GameEntities.createFloatingMemeText(x, y, 'coin'));
     }
     if (global.GameEntities.createConfettiBurst) {
       this.particles.push(...global.GameEntities.createConfettiBurst(x, y, 6));
     }
     if (global.GameAudio) {
       global.GameAudio.playCoin();
     }
     this.updateHUD();
   }
   ```
4. **On Block Hit Hook**:
   ```javascript
   handleBlockHit(tx, ty) {
     if (!this.level) return;
     const res = this.level.bumpBlock(tx, ty);
     if (!res) return;
     const worldX = tx * 16;
     const worldY = ty * 16;
     if (res.coinEarned) {
       if (global.GameEntities && global.GameEntities.BlockCoin) {
         this.blockCoins.push(new global.GameEntities.BlockCoin(worldX, worldY));
       }
       this.addCoin(worldX + 8, worldY - 8);
     } else {
       if (global.GameEntities.createFloatingMemeText) {
         this.particles.push(global.GameEntities.createFloatingMemeText(worldX + 8, worldY - 4, 'block'));
       }
       if (global.GameEntities.createConfettiBurst) {
         this.particles.push(...global.GameEntities.createConfettiBurst(worldX + 8, worldY, 4));
       }
       if (global.GameAudio) {
         global.GameAudio.playBump();
       }
     }
   }
   ```
5. **On Victory Sequence (Confetti Shower)**:
   ```javascript
   if (this.state === 'WIN') {
     if (Math.random() < 0.35 && global.GameEntities.createVictoryConfetti) {
       this.particles.push(...global.GameEntities.createVictoryConfetti(this.level.cameraX + 90, 10, 4));
     }
   }
   ```

---

## 9. Verification & Test Plan

1. **PopCat 180ms Mouth Pop**:
   - Verify `animTimer` in [0.0, 0.17] renders `popcat_walk_1` and in [0.18, 0.35] renders `popcat_walk_2`.
2. **Stomp Squash Duration (450ms) & Rebound**:
   - Stomp at $t=0$: verifies `squashTimer = 0.45`, `player.vy = -260`.
   - At $t=0.40$: enemy is still alive and squashed (`isSquashed = true, isAlive = true`).
   - At $t=0.50$: enemy is removed (`isAlive = false`).
3. **Meme Combat Text & Confetti**:
   - Verify particle creation on Stomp, Coin, and Block Hit.
   - Verify particles update upward trajectory and expire cleanly without memory leaks.
4. **Automated Suite Execution**:
   - Run `node test/verify_m3_gameplay.mjs` and `node test/test_tier1_features.mjs`.

---
*Analysis completed by M3 Meme Entities & Combat Text Explorer.*
