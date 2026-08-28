/**
 * js/entities.js - Player, Meme Enemies (PopCat, Doge, GrumpyCat), Collectibles,
 *                  Floating Meme Combat Text & Confetti Particle System
 *
 * V2 Iván's Birthday Gift Edition (M3)
 *
 * Implements genuine player state machine, meme enemy AI patrol & squash mechanics,
 * 180ms PopCat mouth pop loop, rotating coin collectibles, question block coin pop-ups,
 * flagpole victory slide, floating meme combat text and celebratory confetti particles.
 */
(function (global) {
  'use strict';

  const TILE_SIZE = 16;

  // =========================================================================
  // 1. FLOATING MEME COMBAT TEXT PARTICLE
  // =========================================================================
  const MEME_TEXTS = {
    stomp_popcat: ['+100 AURA', 'BONK!', 'POPPED! 🐱', 'O-P-E-N!', '+100 IVÁN', '¡QUÉ PRO! 🔥'],
    stomp_doge: ['much jump, wow', 'such bounce 🐕', 'very bonk', 'so flat', '+100 DOGE', 'GIGACHAD 🗿'],
    stomp_grumpy: ['NO.', 'GET SQUASHED 😾', 'I HATED THAT', 'MEH', '+100 AURA', 'SIGMA BOY ⚡'],
    stomp_default: ['+100 AURA', 'BONK!', 'much jump, wow', 'NO.', 'GET SQUASHED', '¡TREMENDO SALTO!'],
    coin: ['+200 COIN', 'MUCH RICH 💰', 'STONKS ↗', '+1000 IVÁN 👑', 'KA-CHING! ✨', 'AURA +200', '¡FELICIDADES! 🎂'],
    block: ['+50 IVÁN', 'BOOP!', 'CLANG! 🔨', '¡CUMPLEAÑOS! 🎁', 'REGALAZO 🎈']
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

      // When falling past starting position, finish
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
      this.animTimer = Math.random(); // Desync animations slightly
      this.isAlive = true;
    }

    update(dt, player, onCollect) {
      if (!this.isAlive) return;
      this.animTimer += dt;

      // AABB overlap check with player
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
      this.squashTimer = 0.45; // Display squashed sprite for 450ms
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
        // Reverse direction on solid obstacle collision (pipes, walls)
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
  // 10. PLAYER ENTITY & STATE MACHINE (Super Iván)
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
      this.facing = 1; // +1 = Right, -1 = Left
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
      // ----------------------------------------------------
      // DEAD STATE
      // ----------------------------------------------------
      if (this.state === 'DEAD') {
        this.deathTimer += dt;
        if (this.deathTimer > 0.3) {
          // Fall down after dramatic pause
          this.vy += (global.GamePhysics ? global.GamePhysics.GRAVITY_FALL : 1200) * dt;
          this.y += this.vy * dt;
        }
        return;
      }

      // ----------------------------------------------------
      // FLAG_SLIDE STATE (Victory Sequence Part 1)
      // ----------------------------------------------------
      if (this.state === 'FLAG_SLIDE') {
        this.y += 90 * dt; // Slide down pole
        const groundSurface = (map ? (map.GROUND_ROW * TILE_SIZE) : 208) - this.height;
        if (this.y >= groundSurface) {
          this.y = groundSurface;
          this.state = 'VICTORY_WALK';
          this.facing = 1;
        }
        return;
      }

      // ----------------------------------------------------
      // VICTORY_WALK STATE (Victory Sequence Part 2)
      // ----------------------------------------------------
      if (this.state === 'VICTORY_WALK') {
        this.vx = 55;
        this.x += this.vx * dt;
        this.animDist += Math.abs(this.vx) * dt;

        // Stop at castle door
        const doorX = map ? map.castleDoorX : 1824;
        if (this.x >= doorX) {
          this.x = doorX;
          this.vx = 0;
          this.state = 'IDLE';
        }
        return;
      }

      // ----------------------------------------------------
      // NORMAL GAMEPLAY STATE UPDATE
      // ----------------------------------------------------
      if (global.GamePhysics) {
        // 1. Apply Kinematics formulas
        global.GamePhysics.applyKinematics(this, dt, input);

        // 2. Resolve Map Collisions
        const col = global.GamePhysics.resolveMapCollisions(this, map, dt);

        // Do not let a one-pixel overlap with the edge of a tile keep the
        // player hovering over a real pit.  The centre of the player's feet
        // decides: suspended bricks are above ground and therefore unaffected.
        const feetCenterX = this.x + this.width / 2;
        const groundY = map ? map.GROUND_ROW * 16 : 208;
        if (map && typeof map.isPitAtWorldX === 'function' &&
            map.isPitAtWorldX(feetCenterX) && this.y + this.height >= groundY - 0.5) {
          this.onGround = false;
          this.isJumping = false;
          this.vy = Math.max(this.vy, 45);
          this.y += 1;
        }

        // Ceiling collision block interaction (Question & Brick blocks)
        if (col.collidedY && col.hitCeilingTile && onBlockHit) {
          onBlockHit(col.hitCeilingTile.tx, col.hitCeilingTile.ty);
        }
      }

      // Check falling into pit hazard
      if (map && this.y > map.worldPixelHeight) {
        this.die();
        return;
      }

      // Check Flagpole collision
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

      // Update Animation State
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
        // Run animation has 3 frames (run_1, run_2, run_3)
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
