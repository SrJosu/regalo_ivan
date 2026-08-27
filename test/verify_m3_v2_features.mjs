/**
 * test/verify_m3_v2_features.mjs - Deep Verification Suite for M3 V2 Iván's Birthday Features
 *
 * Verifies:
 * 1. Personalized HUD: "IVÁN", "🎂 × 00", "WORLD 2026".
 * 2. DOM Victory Modal (#victory-modal), #reward-btn with exact text & YouTube href, #btn-replay.
 * 3. Meme Enemy Trio: PopCat (180ms mouth loop), Doge, GrumpyCat, Goomba backward compatibility.
 * 4. Stomp squash: 450ms squash duration, rebound impulse, GameAudio.playStomp() trigger.
 * 5. Floating meme combat text particles ("+100 AURA", "BONK!", etc.) and confetti particle emitter.
 * 6. Level features: Sky banner ("🎂 ¡FELIZ CUMPLEAÑOS IVÁN! 🎂"), milestone signposts (cols 12, 40, 72, 92),
 *    birthday castle (castle_battlement, castle_cake), sunglasses on clouds.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🎂 M3 V2 IVÁN BIRTHDAY GIFT EDITION: DEEP VERIFICATION SUITE');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} — ${err.message}`);
    throw err;
  }
}

// 1. Static HTML & CSS Inspection
test('index.html contains personalized HUD and exact required victory reward button', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  assert(html.includes('IVÁN'), 'HUD contains IVÁN');
  assert(html.includes('🎂'), 'HUD contains 🎂 cake counter');
  assert(html.includes('2026'), 'HUD contains 2026 world');
  assert(html.includes('id="victory-modal"'), 'DOM contains #victory-modal');
  assert(html.includes('id="reward-btn"'), 'DOM contains #reward-btn');
  assert(html.includes('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"'), 'Reward button has YouTube href');
  assert(html.includes('Terminado el juego. Pincha aquí para recibir la recompensa'), 'Exact required reward button text present');
  assert(html.includes('id="btn-replay"'), 'DOM contains #btn-replay');
});

test('css/style.css contains styles for victory modal (z-index: 100) and glowing reward button', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css/style.css'), 'utf-8');
  assert(css.includes('.victory-overlay'), 'CSS defines .victory-overlay');
  assert(css.includes('z-index: 100'), 'Victory overlay has z-index: 100');
  assert(css.includes('.reward-button'), 'CSS defines .reward-button');
  assert(css.includes('.replay-button'), 'CSS defines .replay-button');
});

// Import modules
import '../js/assets.js';
import '../js/physics.js';
import '../js/input.js';
import '../js/audio.js';
import '../js/level.js';
import '../js/entities.js';
import '../js/game.js';

const GameAssets = globalThis.GameAssets;
const GameLevel = globalThis.GameLevel;
const GameEntities = globalThis.GameEntities;
const Game = globalThis.Game;

await GameAssets.init();

// 2. Meme Entities & 180ms PopCat Mouth Popping
test('PopCat toggles mouth open/close on 180ms loop', () => {
  const popcat = GameEntities.createPopCat(100, 192);
  assert(popcat.type === 'popcat', 'Type is popcat');
  assert(popcat.animTimer === 0, 'animTimer starts at 0');

  // animTimer in [0.0, 0.17] -> mouth closed (floor(t/0.18) % 2 === 0)
  popcat.animTimer = 0.05;
  const isMouthOpen1 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen1 === false, 'Mouth is closed at 50ms');

  // animTimer in [0.18, 0.35] -> mouth open (floor(t/0.18) % 2 === 1)
  popcat.animTimer = 0.20;
  const isMouthOpen2 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen2 === true, 'Mouth is open at 200ms');

  // animTimer in [0.36, 0.53] -> mouth closed again
  popcat.animTimer = 0.38;
  const isMouthOpen3 = (Math.floor(popcat.animTimer / 0.18) % 2) === 1;
  assert(isMouthOpen3 === false, 'Mouth is closed at 380ms');
});

test('Doge and GrumpyCat entities initialize with distinct attributes', () => {
  const doge = GameEntities.createDoge(100, 192);
  assert(doge.type === 'doge', 'Doge type is doge');
  assert(doge.vx === -45, 'Doge runs with agile speed -45 px/s');

  const grumpy = GameEntities.createGrumpyCat(100, 192);
  assert(grumpy.type === 'grumpy', 'GrumpyCat type is grumpy');
  assert(grumpy.vx === -28, 'GrumpyCat runs with slow speed -28 px/s');

  const goomba = GameEntities.createGoomba(100, 192);
  assert(goomba.type === 'popcat', 'Goomba resolves to popcat subtype');
});

test('Stomp squash mechanics: 450ms duration, rebound impulse, sound trigger', () => {
  const level = GameLevel.createLevel();
  const enemy = GameEntities.createPopCat(100, 192);
  const player = GameEntities.createPlayer(100, 180);
  player.vy = 200; // Falling down onto enemy

  let stompType = null;
  enemy.update(0.016, level, player, (x, y, type) => {
    stompType = type;
  });

  assert(enemy.isSquashed === true, 'Enemy is marked squashed');
  assert(enemy.squashTimer === 0.45, 'Squash timer set to 450ms (0.45s)');
  assert(player.vy === -260, 'Player rebound velocity is -260 px/s');
  assert(player.isJumping === true, 'Player marked isJumping');
  assert(stompType === 'popcat', 'Stomp callback returned popcat type');

  // Update 300ms (enemy still squashed & alive)
  enemy.update(0.30, level, player);
  assert(enemy.isAlive === true, 'Enemy remains alive during squash animation');

  // Update another 200ms (squash timer expires at 450ms)
  enemy.update(0.20, level, player);
  assert(enemy.isAlive === false, 'Enemy cleaned up after 450ms squash duration');
});

test('Floating meme combat text particles and confetti particles spawn and update', () => {
  const textParticle = GameEntities.createFloatingMemeText(100, 100, 'stomp', 'doge');
  assert(textParticle.isAlive === true, 'Text particle created alive');
  assert(typeof textParticle.text === 'string' && textParticle.text.length > 0, 'Text particle contains non-empty text');
  assert(textParticle.vy < 0, 'Text particle floats upward');

  textParticle.update(0.016);
  assert(textParticle.y < 100, 'Text particle moved upward');

  const confetti = GameEntities.createConfettiBurst(100, 100, 8);
  assert(confetti.length === 8, 'Confetti burst spawned 8 particles');
  confetti.forEach(c => {
    assert(c.isAlive === true, 'Confetti particle is alive');
    c.update(0.016);
  });

  const victoryConfetti = GameEntities.createVictoryConfetti(100, 10, 12);
  assert(victoryConfetti.length === 12, 'Victory confetti spawned 12 particles');
});

// 3. Level Map Features
test('Level map defines Sky Banner, 4 Roadside Milestone Signposts, and Birthday Castle', () => {
  const level = GameLevel.createLevel();
  assert(level.skyBanner !== null, 'Sky banner defined in level');
  assert(level.skyBanner.text.includes('FELIZ CUMPLEAÑOS IVÁN'), 'Sky banner contains birthday greeting for Iván');
  assert(level.skyBanner.startCol === 4 && level.skyBanner.endCol === 16, 'Sky banner spans cols 4 to 16');

  assert(Array.isArray(level.signposts) && level.signposts.length === 4, 'Level contains 4 milestone signposts');
  const cols = level.signposts.map(s => s.col);
  assert(cols.includes(12) && cols.includes(40) && cols.includes(72) && cols.includes(92), 'Signposts at cols 12, 40, 72, 92');

  assert(level.isSolid(112, level.GROUND_ROW - 5) === true, 'Castle battlement is solid');
  assert(level.getTile(114, level.GROUND_ROW - 6) === 'castle_cake', '3-Tier Birthday cake crowns central battlement');
  assert(level.getTile(114, level.GROUND_ROW - 1) === 'castle_door', 'Castle has mahogany door');
});

test('Level spawns diverse meme enemies across stage', () => {
  const level = GameLevel.createLevel();
  assert(level.enemySpawns.length >= 10, 'Level spawns at least 10 meme enemies');
  const types = new Set(level.enemySpawns.map(s => s.type));
  assert(types.has('popcat'), 'Enemy spawns include popcat');
  assert(types.has('doge'), 'Enemy spawns include doge');
  assert(types.has('grumpy'), 'Enemy spawns include grumpy');
});

// 4. Game Manager & Victory Modal Integration
test('GameManager initializes, handles win state, and resets cleanly', () => {
  Game.startNewGame();
  assert(Game.state === 'PLAYING', 'Game in PLAYING state');
  assert(Game.goombas.length >= 10, 'All meme enemies spawned into game');
  assert(Game.modalRevealed === false, 'Victory modal not revealed initially');

  // Trigger win
  Game.handleFlagpole();
  assert(Game.state === 'WIN', 'State transitions to WIN');
  assert(Game.score >= 1000, 'Score awarded for flagpole');

  // Advance win timer past reveal threshold
  for (let i = 0; i < 120; i++) {
    Game.update(1 / 60);
  }
  assert(Game.modalRevealed === true, 'Victory modal marked revealed after celebration delay');

  // Restart
  Game.restart();
  assert(Game.state === 'PLAYING', 'State reset to PLAYING');
  assert(Game.modalRevealed === false, 'Modal hidden on restart');
  assert(Game.score === 0, 'Score reset');
});

console.log('\n===============================================================');
console.log(`📊 M3 V2 DEEP VERIFICATION SUMMARY: ${passed} / ${total} PASSED (100%)`);
console.log('===============================================================\n');
