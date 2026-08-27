/**
 * Autonomous Headless Pac-Man Game Simulator & Regression Tester
 * Simula frames de juego continuos, movimientos, colisiones, pellets y cambios de nivel.
 */

const fs = require('fs');

// Mock DOM and browser environment
global.window = {
  addEventListener: () => {},
  AudioContext: function() {
    return {
      state: 'running',
      currentTime: 0,
      destination: {},
      createGain: () => ({ gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({ type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {}, disconnect: () => {} }),
      resume: async () => {}
    };
  },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = v.toString(); }
  }
};
global.navigator = { vibrate: () => {} };
global.localStorage = global.window.localStorage;
global.document = {
  addEventListener: () => {},
  createElement: () => ({ className: '', innerHTML: '', textContent: '' }),
  body: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
  getElementById: (id) => ({
    textContent: '',
    innerHTML: '',
    value: '',
    checked: true,
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    appendChild: () => {},
    getContext: () => ({
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
      beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
      arc: () => {}, fill: () => {}, stroke: () => {}, fillRect: () => {},
      clearRect: () => {}, fillText: () => {}, shadowBlur: 0, shadowColor: '',
      lineWidth: 1, strokeStyle: '', fillStyle: ''
    })
  }),
  querySelectorAll: () => []
};

const vm = require('vm');
vm.runInThisContext(fs.readFileSync('js/audio.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/particles.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/map.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/ghosts.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/pacman.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/game.js', 'utf8'));

console.log('--- INICIANDO SIMULACIÓN DE PARTIDA COMPLETA ---');

const game = new Game();
game.startGame();

let frames = 0;
let pelletsEaten = 0;
let ghostEatenCount = 0;
let errors = [];

// Encontrar todas las posiciones de pellets para guiar a un bot
function getNextPelletTarget(game) {
  const pTile = game.pacman.getTile();
  let nearest = null;
  let minDist = Infinity;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (game.map.grid[r][c] === 2 || game.map.grid[r][c] === 3) {
        const d = Math.hypot(c - pTile.col, r - pTile.row);
        if (d < minDist) {
          minDist = d;
          nearest = { col: c, row: r };
        }
      }
    }
  }
  return nearest;
}

// Loop de 6000 frames (aprox 1.5 minutos de gameplay simulado)
for (let f = 0; f < 6000; f++) {
  frames++;
  const dt = 1 / 60;

  // Bot AI para Pacman: buscar camino hacia el pellet más cercano
  if (f % 10 === 0 && game.state === GAME_STATES.PLAYING) {
    const target = getNextPelletTarget(game);
    if (target) {
      const pCol = Math.floor(game.pacman.x / TILE_SIZE);
      const pRow = Math.floor(game.pacman.y / TILE_SIZE);
      const dx = target.col - pCol;
      const dy = target.row - pRow;

      if (Math.abs(dx) > Math.abs(dy)) {
        game.pacman.setNextDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        game.pacman.setNextDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  }

  // Simular frame
  try {
    game.update(dt);
  } catch (err) {
    errors.push(`Error en frame ${f}: ${err.message}`);
    break;
  }

  // Registrar progreso
  if (game.stats.pelletsEaten > pelletsEaten) {
    pelletsEaten = game.stats.pelletsEaten;
  }
  if (game.stats.ghostsEaten > ghostEatenCount) {
    ghostEatenCount = game.stats.ghostsEaten;
    console.log(`[Frame ${f}] Fantasma comido! Combo actual: x${game.ghostComboMultiplier}, Score: ${game.score}`);
  }

  if (game.state === GAME_STATES.LEVEL_CLEAR) {
    console.log(`[Frame ${f}] ¡NIVEL COMPLETADO! Nivel alcanzado: ${game.level + 1}, Score: ${game.score}`);
  }

  if (game.state === GAME_STATES.GAME_OVER) {
    console.log(`[Frame ${f}] Game Over simulado. Score final: ${game.score}`);
    break;
  }
}

console.log('--- REPORTE DE SIMULACIÓN ---');
console.log(`Frames ejecutados: ${frames}`);
console.log(`Pellets comidos: ${pelletsEaten}`);
console.log(`Fantasmas comidos: ${ghostEatenCount}`);
console.log(`Nivel final: ${game.level}`);
console.log(`Puntuación final: ${game.score}`);
console.log(`Errores encontrados: ${errors.length === 0 ? '0 (Excelente)' : errors.join(', ')}`);
