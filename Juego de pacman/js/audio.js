/**
 * PAC-MAN Web Audio API Synthesizer Engine with Master Volume Control
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.volume = 0.3; // Volumen actual
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenLfo = null;
    this.isSirenPlaying = false;
    this.wakaToggle = false;
    this.lastWakaTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (muted) {
      this.stopSiren();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  playWaka() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    if (now - this.lastWakaTime < 0.08) return;
    this.lastWakaTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      const freq = this.wakaToggle ? 480 : 340;
      this.wakaToggle = !this.wakaToggle;
      
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {}
  }

  playEatFruit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [587.33, 880, 1174.66, 1760];
      notes.forEach((freq, index) => {
        const now = this.ctx.currentTime + index * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.07);
      });
    } catch (e) {}
  }

  playEatGhost() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  playDeath() {
    if (this.isMuted) return;
    this.init();
    this.stopSiren();
    if (!this.ctx) return;

    try {
      const notes = [
        880, 830.61, 783.99, 739.99, 698.46, 659.25, 
        622.25, 587.33, 554.37, 523.25, 493.88, 440, 392, 330, 220, 110
      ];

      notes.forEach((freq, idx) => {
        const startTime = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + 0.06);

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.065);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.07);
      });
    } catch (e) {}
  }

  playStartJingle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const melody = [
        { f: 493.88, d: 0.12 },
        { f: 987.77, d: 0.12 },
        { f: 739.99, d: 0.12 },
        { f: 622.25, d: 0.12 },
        { f: 987.77, d: 0.08 },
        { f: 739.99, d: 0.16 },
        { f: 622.25, d: 0.20 },
        { f: 523.25, d: 0.12 },
        { f: 1046.5, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 1046.5, d: 0.08 },
        { f: 783.99, d: 0.16 },
        { f: 659.25, d: 0.22 }
      ];

      let time = this.ctx.currentTime;
      melody.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, time);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d * 0.9);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + note.d);

        time += note.d;
      });
    } catch (e) {}
  }

  startSiren(isFrightened = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopSiren();

    try {
      const now = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      this.sirenOsc.type = isFrightened ? 'square' : 'triangle';
      const baseFreq = isFrightened ? 320 : 190;
      this.sirenOsc.frequency.setValueAtTime(baseFreq, now);

      this.sirenLfo.frequency.setValueAtTime(isFrightened ? 6.5 : 2.8, now);
      lfoGain.gain.setValueAtTime(isFrightened ? 90 : 45, now);

      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain.gain.setValueAtTime(0.1, now);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);

      this.sirenOsc.start(now);
      this.sirenLfo.start(now);
      this.isSirenPlaying = true;
    } catch (e) {}
  }

  stopSiren() {
    if (this.isSirenPlaying && this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        if (this.sirenLfo) this.sirenLfo.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
      this.sirenLfo = null;
      this.sirenGain = null;
      this.isSirenPlaying = false;
    }
  }
}

window.soundEngine = new SoundEngine();
