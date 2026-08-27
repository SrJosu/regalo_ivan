/**
 * PAC-MAN Arcade Pro - Namco 1980 Accurate Engine
 * Incorpora:
 * - Dual-Box + Swap Anti-Passthrough Collision Detection
 * - Tabla Oficial de Tiempos de Energizer de Namco (Niveles 1 a 21)
 * - Salida de Fantasmas por Contador de Pellets
 * - Debug Overlay de IAs de Fantasmas
 * - High Contrast / Fullscreen / Stats / Temas Neón
 */

const GAME_STATES = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  PACMAN_DYING: 'PACMAN_DYING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER'
};

const FRUIT_TABLE = [
  { name: 'Cereza', points: 100, icon: '🍒', minLevel: 1 },
  { name: 'Fresa', points: 300, icon: '🍓', minLevel: 2 },
  { name: 'Naranja', points: 500, icon: '🍊', minLevel: 3 },
  { name: 'Manzana', points: 700, icon: '🍏', minLevel: 4 },
  { name: 'Melón', points: 1000, icon: '🍈', minLevel: 5 },
  { name: 'Galaxian', points: 2000, icon: '🛸', minLevel: 6 },
  { name: 'Campana', points: 3000, icon: '🔔', minLevel: 7 },
  { name: 'Llave', points: 5000, icon: '🔑', minLevel: 8 }
];

// Tabla Oficial de Duración de Energizer en Segundos (Namco 1980)
const FRIGHTENED_TIME_TABLE = [
  6.0, // Nivel 1
  5.0, // Nivel 2
  4.0, // Nivel 3
  3.0, // Nivel 4
  2.0, // Nivel 5
  5.0, // Nivel 6 (Arcade quirk)
  2.0, // Nivel 7
  2.0, // Nivel 8
  1.0, // Nivel 9
  5.0, // Nivel 10
  2.0, // Nivel 11
  1.0, // Nivel 12
  1.0, // Nivel 13
  3.0, // Nivel 14
  1.0, // Nivel 15
  1.0, // Nivel 16
  0.0  // Nivel 17+ (Solo invierten dirección, no se pueden comer)
];

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pacman_pro_high_score') || '0', 10);
    this.level = 1;
    this.lives = 3;
    this.state = GAME_STATES.READY;

    this.stats = {
      ghostsEaten: 0,
      pelletsEaten: 0,
      fruitsEaten: 0,
      maxCombo: 0
    };

    this.globalStats = JSON.parse(localStorage.getItem('pacman_global_stats') || JSON.stringify({
      gamesPlayed: 0,
      ghostsTotal: 0,
      pelletsTotal: 0,
      maxLevel: 1
    }));

    this.map = new GameMap();
    this.pacman = new Pacman(this.map);

    this.ghosts = [
      new Ghost(GHOST_TYPES.BLINKY, this.map),
      new Ghost(GHOST_TYPES.PINKY, this.map),
      new Ghost(GHOST_TYPES.INKY, this.map),
      new Ghost(GHOST_TYPES.CLYDE, this.map)
    ];

    this.globalGhostMode = GHOST_MODES.SCATTER;
    this.modeTimer = 0;
    this.modeIndex = 0;
    this.modeSchedule = [
      { mode: GHOST_MODES.SCATTER, duration: 7 },
      { mode: GHOST_MODES.CHASE, duration: 20 },
      { mode: GHOST_MODES.SCATTER, duration: 7 },
      { mode: GHOST_MODES.CHASE, duration: 20 },
      { mode: GHOST_MODES.SCATTER, duration: 5 },
      { mode: GHOST_MODES.CHASE, duration: 20 },
      { mode: GHOST_MODES.SCATTER, duration: 5 },
      { mode: GHOST_MODES.CHASE, duration: Infinity }
    ];

    this.ghostComboMultiplier = 0;
    this.energizerFlashTimer = 0;
    this.energizerFlashState = true;
    this.wasFrightenedPlaying = false;

    this.activeFruit = null;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    this.wallThemeColor = '#2121ff';
    this.highContrast = false;
    this.debugAI = false;
    this.gameMode = 'normal';
    this.speedMultiplier = 1.0;

    this.lastTime = 0;
    this.stateTimer = 0;
    this.flashMazeTimer = 0;
    this.mazeWhite = false;

    this.initUI();
    this.initInputs();
    this.updateHUD();
  }

  initUI() {
    this.dom = {
      cabinet: document.getElementById('arcade-cabinet'),
      currentScore: document.getElementById('current-score'),
      highScore: document.getElementById('high-score'),
      levelDisplay: document.getElementById('level-display'),
      livesContainer: document.getElementById('lives-container'),
      fruitContainer: document.getElementById('fruit-container'),
      overlay: document.getElementById('game-overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlaySubtitle: document.getElementById('overlay-subtitle'),
      overlayBtn: document.getElementById('overlay-btn'),
      gameoverStats: document.getElementById('gameover-stats'),
      statGhosts: document.getElementById('stat-ghosts'),
      statPellets: document.getElementById('stat-pellets'),
      statFruits: document.getElementById('stat-fruits'),
      statCombo: document.getElementById('stat-combo'),
      pauseModal: document.getElementById('pause-modal'),
      resumeBtn: document.getElementById('resume-btn'),
      restartBtn: document.getElementById('restart-btn'),
      statsToggleBtn: document.getElementById('stats-toggle-btn'),
      statsModal: document.getElementById('stats-modal'),
      closeStatsBtn: document.getElementById('close-stats-btn'),
      globalStatGames: document.getElementById('global-stat-games'),
      globalStatGhosts: document.getElementById('global-stat-ghosts'),
      globalStatPellets: document.getElementById('global-stat-pellets'),
      globalStatMaxlevel: document.getElementById('global-stat-maxlevel'),
      settingsModal: document.getElementById('settings-modal'),
      settingsToggleBtn: document.getElementById('settings-toggle-btn'),
      closeSettingsBtn: document.getElementById('close-settings-btn'),
      volumeSlider: document.getElementById('volume-slider'),
      themeSelect: document.getElementById('theme-select'),
      highContrastToggle: document.getElementById('high-contrast-toggle'),
      debugAiToggle: document.getElementById('debug-ai-toggle'),
      crtToggle: document.getElementById('crt-toggle'),
      dpadToggle: document.getElementById('dpad-toggle'),
      speedSelect: document.getElementById('speed-select'),
      btnPauseQuick: document.getElementById('btn-pause-quick'),
      btnSoundQuick: document.getElementById('btn-sound-quick'),
      btnFullscreenQuick: document.getElementById('btn-fullscreen-quick'),
      btnSettingsQuick: document.getElementById('btn-settings-quick'),
      virtualDpad: document.getElementById('virtual-dpad'),
      qrBanner: document.getElementById('qr-banner')
    };

    this.dom.highScore.textContent = this.highScore.toString().padStart(2, '0');

    this.dom.overlayBtn.addEventListener('click', () => {
      window.soundEngine.init();
      if (this.state === GAME_STATES.READY) {
        this.startGame();
      } else if (this.state === GAME_STATES.GAME_OVER) {
        this.resetGame();
      }
    });

    this.dom.overlay.addEventListener('click', (e) => {
      if (e.target === this.dom.overlay) {
        window.soundEngine.init();
        if (this.state === GAME_STATES.READY) {
          this.startGame();
        } else if (this.state === GAME_STATES.GAME_OVER) {
          this.resetGame();
        }
      }
    });

    this.dom.resumeBtn.addEventListener('click', () => this.togglePause());
    this.dom.restartBtn.addEventListener('click', () => {
      this.dom.pauseModal.classList.add('hidden');
      this.resetGame();
    });

    this.dom.statsToggleBtn.addEventListener('click', () => {
      this.dom.pauseModal.classList.add('hidden');
      this.dom.globalStatGames.textContent = this.globalStats.gamesPlayed;
      this.dom.globalStatGhosts.textContent = this.globalStats.ghostsTotal;
      this.dom.globalStatPellets.textContent = this.globalStats.pelletsTotal;
      this.dom.globalStatMaxlevel.textContent = this.globalStats.maxLevel;
      this.dom.statsModal.classList.remove('hidden');
    });

    this.dom.closeStatsBtn.addEventListener('click', () => {
      this.dom.statsModal.classList.add('hidden');
      if (this.state === GAME_STATES.PAUSED) {
        this.dom.pauseModal.classList.remove('hidden');
      }
    });

    this.dom.settingsToggleBtn.addEventListener('click', () => {
      this.dom.pauseModal.classList.add('hidden');
      this.dom.settingsModal.classList.remove('hidden');
    });

    this.dom.closeSettingsBtn.addEventListener('click', () => {
      this.dom.settingsModal.classList.add('hidden');
      if (this.state === GAME_STATES.PAUSED) {
        this.dom.pauseModal.classList.remove('hidden');
      }
    });

    this.dom.btnPauseQuick.addEventListener('click', () => this.togglePause());

    this.dom.btnSoundQuick.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      this.dom.btnSoundQuick.textContent = isMuted ? '🔇' : '🔊';
    });

    this.dom.btnFullscreenQuick.addEventListener('click', () => this.toggleFullscreen());

    this.dom.btnSettingsQuick.addEventListener('click', () => {
      this.dom.settingsModal.classList.remove('hidden');
    });

    this.dom.volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      window.soundEngine.setVolume(vol);
      this.dom.btnSoundQuick.textContent = (vol === 0) ? '🔇' : '🔊';
    });

    this.dom.themeSelect.addEventListener('change', (e) => {
      this.wallThemeColor = e.target.value;
    });

    this.dom.highContrastToggle.addEventListener('change', (e) => {
      this.highContrast = e.target.checked;
    });

    if (this.dom.debugAiToggle) {
      this.dom.debugAiToggle.addEventListener('change', (e) => {
        this.debugAI = e.target.checked;
      });
    }

    this.dom.crtToggle.addEventListener('change', (e) => {
      document.body.classList.toggle('crt-enabled', e.target.checked);
    });

    this.dom.dpadToggle.addEventListener('change', (e) => {
      this.dom.virtualDpad.style.display = e.target.checked ? 'flex' : 'none';
    });

    this.dom.speedSelect.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      if (this.gameMode === 'turbo') {
        this.speedMultiplier = 1.35;
      } else if (this.gameMode === 'easy') {
        this.speedMultiplier = 0.85;
      } else {
        this.speedMultiplier = 1.0;
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GAME_STATES.PLAYING) {
        this.togglePause();
      }
    });

    this.showOverlay('READY!', 'Presiona JUGAR o una flecha para empezar', 'JUGAR');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.dom.cabinet.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  triggerScreenShake(amount = 6) {
    this.shakeIntensity = amount;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      const pacmanCabinet = document.getElementById('arcade-cabinet');
      if (pacmanCabinet && (pacmanCabinet.classList.contains('hidden') || pacmanCabinet.style.display === 'none')) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      window.soundEngine.init();

      if (e.key === ' ' || e.code === 'Space') {
        if (this.state === GAME_STATES.READY) {
          this.startGame();
          return;
        } else if (this.state === GAME_STATES.GAME_OVER) {
          this.resetGame();
          return;
        }
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
        return;
      }

      const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (this.state === GAME_STATES.READY && moveKeys.includes(e.key)) {
        this.startGame();
      }

      if (this.state !== GAME_STATES.PLAYING) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.pacman.setNextDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.pacman.setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.pacman.setNextDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.pacman.setNextDirection('RIGHT');
          break;
      }
    });

    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      const handlePress = (e) => {
        e.preventDefault();
        window.soundEngine.init();
        if (this.state === GAME_STATES.READY) {
          this.startGame();
        }
        const dir = btn.getAttribute('data-dir');
        if (dir && this.pacman) {
          this.pacman.setNextDirection(dir);
        }
      };
      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('mousedown', handlePress);
    });

    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      window.soundEngine.init();
      if (this.state === GAME_STATES.READY) {
        this.startGame();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.pacman.setNextDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          this.pacman.setNextDirection(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    }, { passive: true });
  }

  showOverlay(title, subtitle, btnText, showStats = false) {
    this.dom.overlayTitle.textContent = title;
    this.dom.overlaySubtitle.textContent = subtitle;
    this.dom.overlayBtn.textContent = btnText;

    if (showStats) {
      this.dom.statGhosts.textContent = this.stats.ghostsEaten;
      this.dom.statPellets.textContent = this.stats.pelletsEaten;
      this.dom.statFruits.textContent = this.stats.fruitsEaten;
      this.dom.statCombo.textContent = `x${this.stats.maxCombo}`;
      this.dom.gameoverStats.classList.remove('hidden');
    } else {
      this.dom.gameoverStats.classList.add('hidden');
    }

    this.dom.overlay.classList.remove('hidden');
  }

  hideOverlay() {
    this.dom.overlay.classList.add('hidden');
  }

  showQRBanner() {
    if (this.qrTimeout) {
      clearTimeout(this.qrTimeout);
    }
    if (this.dom.qrBanner) {
      this.dom.qrBanner.classList.remove('hidden');
      this.qrTimeout = setTimeout(() => {
        this.dom.qrBanner.classList.add('hidden');
      }, 4000);
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      window.soundEngine.stopSiren();
      this.dom.pauseModal.classList.remove('hidden');
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.dom.pauseModal.classList.add('hidden');
      this.dom.settingsModal.classList.add('hidden');
      this.dom.statsModal.classList.add('hidden');
      window.soundEngine.startSiren(this.isAnyGhostFrightened());
    }
  }

  startGame() {
    this.hideOverlay();
    window.soundEngine.playStartJingle();
    this.state = GAME_STATES.PLAYING;

    this.globalStats.gamesPlayed++;
    localStorage.setItem('pacman_global_stats', JSON.stringify(this.globalStats));

    setTimeout(() => {
      if (this.state === GAME_STATES.PLAYING) {
        window.soundEngine.startSiren(false);
      }
    }, 4000);
  }

  resetGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.stats = {
      ghostsEaten: 0,
      pelletsEaten: 0,
      fruitsEaten: 0,
      maxCombo: 0
    };
    this.map.reset();
    this.pacman.reset();
    this.resetGhosts();
    this.updateHUD();
    this.hideOverlay();
    this.state = GAME_STATES.READY;
    this.showOverlay('READY!', 'Presiona JUGAR o una flecha para empezar', 'JUGAR');
  }

  resetRound() {
    this.pacman.reset();
    this.resetGhosts();
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalGhostMode = GHOST_MODES.SCATTER;
    this.state = GAME_STATES.PLAYING;
    window.soundEngine.startSiren(false);
  }

  resetGhosts() {
    this.ghosts.forEach(g => g.reset());
    this.ghostComboMultiplier = 0;
  }

  isAnyGhostFrightened() {
    return this.ghosts.some(g => g.mode === GHOST_MODES.FRIGHTENED);
  }

  triggerEnergizer() {
    this.ghostComboMultiplier = 0;
    const tableIndex = Math.min(this.level - 1, FRIGHTENED_TIME_TABLE.length - 1);
    const duration = FRIGHTENED_TIME_TABLE[tableIndex];

    if (duration > 0) {
      this.ghosts.forEach(g => g.setFrightened(duration));
      this.wasFrightenedPlaying = true;
      window.soundEngine.startSiren(true);
    } else {
      // Nivel 17+: Solo invierten dirección (Namco Arcade Rule)
      this.ghosts.forEach(g => g.reverseDirection());
    }
  }

  checkPelletCollisions() {
    const tile = this.pacman.getTile();
    const eaten = this.map.eatTile(tile.col, tile.row);

    if (eaten === 2) {
      this.addScore(10);
      this.stats.pelletsEaten++;
      this.globalStats.pelletsTotal++;
      window.soundEngine.playWaka();
      window.particleSystem.spawnPelletSpark(
        (tile.col + 0.5) * TILE_SIZE,
        (tile.row + 0.5) * TILE_SIZE
      );
      this.checkFruitSpawn();
    } else if (eaten === 3) {
      this.addScore(50);
      this.stats.pelletsEaten++;
      this.globalStats.pelletsTotal++;
      window.soundEngine.playWaka();
      window.particleSystem.spawnPelletSpark(
        (tile.col + 0.5) * TILE_SIZE,
        (tile.row + 0.5) * TILE_SIZE,
        '#ffff00'
      );
      this.triggerEnergizer();
      this.checkFruitSpawn();
    }

    if (this.map.pelletsRemaining <= 0) {
      this.levelCleared();
    }
  }

  checkFruitSpawn() {
    const eatenCount = this.map.totalPellets - this.map.pelletsRemaining;
    if ((eatenCount === 70 || eatenCount === 170) && !this.activeFruit) {
      const fruitIndex = Math.min(this.level - 1, FRUIT_TABLE.length - 1);
      this.activeFruit = {
        ...FRUIT_TABLE[fruitIndex],
        x: 13.5 * TILE_SIZE,
        y: 17 * TILE_SIZE,
        life: 9.5
      };
    }
  }

  checkFruitCollision() {
    if (!this.activeFruit) return;
    const dist = Math.hypot(this.pacman.x - this.activeFruit.x, this.pacman.y - this.activeFruit.y);
    if (dist < 14) {
      this.addScore(this.activeFruit.points);
      this.stats.fruitsEaten++;
      window.soundEngine.playEatFruit();
      window.particleSystem.spawnGhostBurst(this.activeFruit.x, this.activeFruit.y, '#ff0055');
      window.particleSystem.spawnScoreFloater(this.activeFruit.x, this.activeFruit.y, `+${this.activeFruit.points}`, '#ff55aa');
      this.activeFruit = null;
    }
  }

  /**
   * Dual-Box + Swap Anti-Passthrough Collision Engine
   */
  checkGhostCollisions() {
    const pTile = this.pacman.getTile();
    const pPrev = this.pacman.prevTile;

    for (const ghost of this.ghosts) {
      const gTile = { col: Math.floor(ghost.x / TILE_SIZE), row: Math.floor(ghost.y / TILE_SIZE) };
      const gPrev = ghost.prevTile;

      const dist = Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y);
      const sameTile = (pTile.col === gTile.col && pTile.row === gTile.row);
      const swappedTile = (pPrev && gPrev && pPrev.col === gTile.col && pPrev.row === gTile.row && gPrev.col === pTile.col && gPrev.row === pTile.row);

      if (dist < 13.5 || sameTile || swappedTile) {
        if (ghost.mode === GHOST_MODES.FRIGHTENED) {
          ghost.mode = GHOST_MODES.EATEN;
          this.ghostComboMultiplier++;
          this.stats.ghostsEaten++;
          this.globalStats.ghostsTotal++;
          if (this.ghostComboMultiplier > this.stats.maxCombo) {
            this.stats.maxCombo = this.ghostComboMultiplier;
          }

          const points = 200 * Math.pow(2, this.ghostComboMultiplier - 1);
          this.addScore(points);
          this.triggerScreenShake(5);
          window.soundEngine.playEatGhost();
          window.particleSystem.spawnGhostBurst(ghost.x, ghost.y, ghost.color);
          window.particleSystem.spawnScoreFloater(ghost.x, ghost.y, `${points}`, '#00ffff');
          this.showQRBanner();
        } else if (ghost.mode === GHOST_MODES.CHASE || ghost.mode === GHOST_MODES.SCATTER) {
          this.pacmanDeath();
          break;
        }
      }
    }
  }

  pacmanDeath() {
    this.state = GAME_STATES.PACMAN_DYING;
    this.pacman.isDead = true;
    this.stateTimer = 1.8;
    this.triggerScreenShake(8);
    window.soundEngine.playDeath();
  }

  levelCleared() {
    this.state = GAME_STATES.LEVEL_CLEAR;
    this.stateTimer = 2.5;
    this.flashMazeTimer = 0;
    window.soundEngine.stopSiren();
  }

  addScore(pts) {
    const oldScore = this.score;
    this.score += pts;

    if (oldScore < 10000 && this.score >= 10000) {
      this.lives++;
      window.soundEngine.playEatFruit();
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pacman_pro_high_score', this.highScore.toString());
    }
    this.updateHUD();
  }

  updateHUD() {
    this.dom.currentScore.textContent = this.score.toString().padStart(2, '0');
    this.dom.highScore.textContent = this.highScore.toString().padStart(2, '0');
    this.dom.levelDisplay.textContent = this.level.toString();

    this.dom.livesContainer.innerHTML = '';
    for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
      const lifeSpan = document.createElement('span');
      lifeSpan.className = 'life-icon';
      lifeSpan.innerHTML = `
        <svg viewBox="0 0 20 20" width="18" height="18">
          <path d="M 10 10 L 19 4 A 9 9 0 1 0 19 16 Z" fill="#ffff00" />
        </svg>
      `;
      this.dom.livesContainer.appendChild(lifeSpan);
    }

    this.dom.fruitContainer.innerHTML = '';
    const currentFruitIdx = Math.min(this.level - 1, FRUIT_TABLE.length - 1);
    for (let i = 0; i <= currentFruitIdx; i++) {
      const f = FRUIT_TABLE[i];
      const iconSpan = document.createElement('span');
      iconSpan.className = 'fruit-icon';
      iconSpan.textContent = f.icon;
      this.dom.fruitContainer.appendChild(iconSpan);
    }
  }

  update(dt) {
    if (this.shakeIntensity > 0.05) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    this.energizerFlashTimer += dt;
    if (this.energizerFlashTimer > 0.2) {
      this.energizerFlashTimer = 0;
      this.energizerFlashState = !this.energizerFlashState;
    }

    window.particleSystem.update(dt);

    if (this.state === GAME_STATES.PLAYING) {
      if (!this.isAnyGhostFrightened()) {
        this.modeTimer += dt;
        const currentSched = this.modeSchedule[this.modeIndex];
        if (currentSched && this.modeTimer >= currentSched.duration) {
          this.modeTimer = 0;
          this.modeIndex = Math.min(this.modeIndex + 1, this.modeSchedule.length - 1);
          this.globalGhostMode = this.modeSchedule[this.modeIndex].mode;
          this.ghosts.forEach(g => g.reverseDirection());
        }
      }

      const blinky = this.ghosts.find(g => g.name === 'Blinky');
      const eatenCount = this.map.totalPellets - this.map.pelletsRemaining;

      this.pacman.update(this.speedMultiplier);

      this.ghosts.forEach(ghost => {
        ghost.update(
          dt,
          this.pacman,
          blinky,
          this.globalGhostMode,
          eatenCount,
          this.map.pelletsRemaining,
          this.level,
          this.speedMultiplier
        );
      });

      if (this.activeFruit) {
        this.activeFruit.life -= dt;
        if (this.activeFruit.life <= 0) {
          this.activeFruit = null;
        } else {
          this.checkFruitCollision();
        }
      }

      this.checkPelletCollisions();
      this.checkGhostCollisions();

      // Control de sirena al terminar el modo asustado
      if (this.wasFrightenedPlaying && !this.isAnyGhostFrightened()) {
        this.wasFrightenedPlaying = false;
        window.soundEngine.startSiren(false);
      }

    } else if (this.state === GAME_STATES.PACMAN_DYING) {
      this.pacman.update(this.speedMultiplier);
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.lives--;
        this.updateHUD();
        if (this.lives > 0) {
          this.resetRound();
        } else {
          this.state = GAME_STATES.GAME_OVER;
          window.soundEngine.stopSiren();
          if (this.level > this.globalStats.maxLevel) {
            this.globalStats.maxLevel = this.level;
          }
          localStorage.setItem('pacman_global_stats', JSON.stringify(this.globalStats));

          this.showOverlay('GAME OVER', `PUNTUACIÓN FINAL: ${this.score}`, 'JUGAR DE NUEVO', true);
        }
      }

    } else if (this.state === GAME_STATES.LEVEL_CLEAR) {
      this.stateTimer -= dt;
      this.flashMazeTimer += dt;
      if (this.flashMazeTimer > 0.25) {
        this.flashMazeTimer = 0;
        this.mazeWhite = !this.mazeWhite;
      }

      if (this.stateTimer <= 0) {
        this.level++;
        if (this.level > this.globalStats.maxLevel) {
          this.globalStats.maxLevel = this.level;
          localStorage.setItem('pacman_global_stats', JSON.stringify(this.globalStats));
        }
        this.map.reset();
        this.resetRound();
        this.updateHUD();
      }
    }
  }

  draw() {
    this.ctx.save();

    if (this.shakeIntensity > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const activeWallColor = (this.state === GAME_STATES.LEVEL_CLEAR && this.mazeWhite) 
      ? '#ffffff' 
      : this.wallThemeColor;

    this.map.draw(this.ctx, this.energizerFlashState, activeWallColor);

    if (this.activeFruit) {
      this.ctx.save();
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.activeFruit.icon, this.activeFruit.x, this.activeFruit.y);
      this.ctx.restore();
    }

    this.pacman.draw(this.ctx);

    if (this.state !== GAME_STATES.PACMAN_DYING && this.state !== GAME_STATES.LEVEL_CLEAR) {
      this.ghosts.forEach(g => g.draw(this.ctx, this.highContrast, this.debugAI));
    }

    window.particleSystem.draw(this.ctx);

    this.ctx.restore();
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.isRunning) {
      this.update(dt);
      this.draw();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
    if (window.soundEngine) {
      window.soundEngine.stopSiren();
    }
  }
}

window.PacmanGame = Game;

// Expose instance creator
window.initPacmanGame = function() {
  if (!window.gameInstance) {
    window.gameInstance = new Game();
  }
  window.gameInstance.start();
  return window.gameInstance;
};

