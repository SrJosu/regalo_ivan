/**
 * Visual Effects: Neon Particle System & Floating Score Floaters
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floaters = [];
  }

  reset() {
    this.particles = [];
    this.floaters = [];
  }

  spawnPelletSpark(x, y, color = '#ffb8ae') {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.0 + Math.random() * 1.5;
      if (window.pacmanLowPerf ? this.particles.length < 100 : true) {
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 2,
          alpha: 1,
          life: 0.25,
          maxLife: 0.25
        });
      }
    }
  }

  spawnGhostBurst(x, y, color = '#00ffff') {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      if (window.pacmanLowPerf ? this.particles.length < 100 : true) {
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 3 + Math.random() * 2,
          alpha: 1,
          life: 0.6,
          maxLife: 0.6
        });
      }
    }
  }

  spawnScoreFloater(x, y, text, color = '#00ffff') {
    this.floaters.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -0.6,
      life: 0.9,
      maxLife: 0.9
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floaters
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.y += f.vy;
      f.life -= dt;
      f.alpha = Math.max(0, f.life / f.maxLife);
      if (f.life <= 0) {
        this.floaters.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = (window.pacmanLowPerf ? 0 : 6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render floaters
    for (const f of this.floaters) {
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
