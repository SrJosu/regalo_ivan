/**
 * js/audio.js - Procedural Web Audio API Meme Synthesizer Engine
 *
 * V2 Iván's Birthday Gift Edition (M2)
 *
 * High-definition, 100% procedural sound effects and chiptune music:
 * - playJump(): Cartoon Spring "Boing!" with FM pitch-sweep (160Hz -> 680Hz) & 22Hz LFO vibrato.
 * - playCoin(): Anime Sparkle / "Ka-Ching!" cash register coin (B5 988Hz -> E6 1319Hz + G#6 1661Hz sparkle + B6 1976Hz overtone).
 * - playStomp(): Pop Cat mouth "POP!" / Bonk (resonant 420Hz bandpass, Q=8.0 + 180Hz->50Hz sub-bass drop).
 * - playBump(): Metal Pipe reverberant thud / cartoon woodblock bump (580Hz->320Hz bandpass 750Hz + 220Hz->65Hz body).
 * - playDeath(): Sad Trombone 4-note brass slide (D#4 311.13Hz -> D4 293.66Hz -> C#4 277.18Hz -> C4 261.63Hz->195Hz + wah-wah & 6.5Hz tremolo).
 * - playWin(): Iván's 8-bit celebratory "Happy Birthday" chiptune melody + party arpeggio cascade + grand victory fanfare triad.
 * - playAirhorn(): MLG Airhorn Triplet meme sound effect (detuned 4-oscillator brass stack + resonant bandpass).
 * - playBruh(): Procedural vocal formant "Bruh" meme sound effect (dual vocal bandpass filters 480Hz & 1050Hz).
 * - playTone(): Backwards-compatible generic tone generator with non-zero ramp safety.
 *
 * Technical Invariants:
 * - 0 External audio files (pure Web Audio API synthesis).
 * - Master DynamicsCompressorNode + 0.70 headroom gain bus for 0.0 dBFS clipping immunity.
 * - W3C exponential ramp safety (minimum floor >= 0.0001).
 * - Multi-gesture auto-unlock listeners with iOS WebKit silent 1-sample buffer playback.
 * - Graceful fallback in headless browser and Node.js environments (0 console errors or warnings).
 */
(function (global) {
  'use strict';

  let ctx = null;
  let masterCompressor = null;
  let masterGain = null;
  let isUnlocked = false;
  let isInitialized = false;

  /**
   * Initializes or returns the shared AudioContext and master audio bus.
   */
  function getContext() {
    if (!ctx) {
      const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                       (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
      if (AudioCtx) {
        try {
          ctx = new AudioCtx();

          // Initialize Master Dynamics Compressor Limiter (0.0 dBFS clipping immunity)
          masterCompressor = ctx.createDynamicsCompressor();
          masterCompressor.threshold.setValueAtTime(-12, ctx.currentTime);
          masterCompressor.knee.setValueAtTime(8, ctx.currentTime);
          masterCompressor.ratio.setValueAtTime(6, ctx.currentTime);
          masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
          masterCompressor.release.setValueAtTime(0.15, ctx.currentTime);

          // Headroom Gain Bus (0.70)
          masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0.70, ctx.currentTime);

          masterCompressor.connect(masterGain);
          masterGain.connect(ctx.destination);
        } catch (e) {
          ctx = null;
          masterCompressor = null;
          masterGain = null;
        }
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  /**
   * Returns the master input node (compressor) or direct destination.
   */
  function getMasterBus(audioCtx) {
    if (masterCompressor) {
      return masterCompressor;
    }
    return audioCtx.destination;
  }

  /**
   * Unlocks Web Audio on first user interaction with iOS WebKit support.
   */
  function unlockAudio() {
    const audioCtx = getContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    // iOS WebKit hardware unlock: trigger 1-sample silent buffer playback
    try {
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
    } catch (e) {
      // Non-fatal if buffer playback is not supported
    }

    isUnlocked = true;
  }

  /**
   * Attach gesture unlock listeners to window/document.
   */
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    if (typeof window !== 'undefined' && window.addEventListener) {
      const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'pointerdown'];
      const onFirstInteraction = () => {
        unlockAudio();
        unlockEvents.forEach(evt => {
          try {
            window.removeEventListener(evt, onFirstInteraction, { capture: true, passive: true });
          } catch (e) {
            window.removeEventListener(evt, onFirstInteraction);
          }
        });
      };

      unlockEvents.forEach(evt => {
        try {
          window.addEventListener(evt, onFirstInteraction, { capture: true, passive: true });
        } catch (e) {
          window.addEventListener(evt, onFirstInteraction);
        }
      });
    }
  }

  /**
   * Helper: Click-free tone synthesis (backwards compatible).
   */
  function playTone(freqStart, freqEnd, type, duration, volumeStart = 0.2, volumeEnd = 0.0001) {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type || 'square';
      osc.frequency.setValueAtTime(Math.max(1, freqStart), now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
      }

      const safeVolStart = Math.max(0.0001, volumeStart);
      const safeVolEnd = Math.max(0.0001, volumeEnd);

      gain.gain.setValueAtTime(safeVolStart, now);
      gain.gain.exponentialRampToValueAtTime(safeVolEnd, now + duration);

      osc.connect(gain);
      gain.connect(getMasterBus(audioCtx));

      osc.start(now);
      osc.stop(now + duration + 0.02);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * Sound: Player Jump (Cartoon Spring "Boing!" / Comic Pitch Sweep)
   * FM pitch sweep (160Hz -> 680Hz) modulated by 22Hz LFO spring vibrato flutter.
   */
  function playJump() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      const carrier = audioCtx.createOscillator();
      const carrierGain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();

      // Carrier: Sine wave with spring pitch glide
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(160, now);
      carrier.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      carrier.frequency.linearRampToValueAtTime(560, now + 0.22);

      // LFO Modulator: 22Hz cartoon spring coil flutter
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(22, now);
      lfoGain.gain.setValueAtTime(0.0001, now);
      lfoGain.gain.linearRampToValueAtTime(45, now + 0.03);
      lfoGain.gain.exponentialRampToValueAtTime(0.1, now + 0.20);

      lfo.connect(lfoGain);
      lfoGain.connect(carrier.frequency);

      // Amplitude Envelope: 5ms anti-click attack and smooth exponential decay
      carrierGain.gain.setValueAtTime(0.0001, now);
      carrierGain.gain.linearRampToValueAtTime(0.22, now + 0.005);
      carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      carrier.connect(carrierGain);
      carrierGain.connect(getMasterBus(audioCtx));

      lfo.start(now);
      carrier.start(now);
      lfo.stop(now + 0.23);
      carrier.stop(now + 0.23);

      carrier.onended = () => {
        try {
          carrier.disconnect();
          carrierGain.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * Sound: Coin Collection (Anime Sparkle / "Ka-Ching!" Cash Register Coin)
   * Dual sine chime (B5 988Hz -> E6 1319Hz) with G#6 1661Hz anime sparkle & B6 1976Hz shimmer.
   */
  function playCoin() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const bus = getMasterBus(audioCtx);

      // Note 1: B5 (988 Hz) - Coin strike / mechanical ping
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(988, now);
      gain1.gain.setValueAtTime(0.20, now);
      gain1.gain.linearRampToValueAtTime(0.01, now + 0.065);
      osc1.connect(gain1);
      gain1.connect(bus);
      osc1.start(now);
      osc1.stop(now + 0.065);

      // Note 2: E6 (1319 Hz) - Main bell chime
      const t2 = now + 0.065;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1319, t2);
      gain2.gain.setValueAtTime(0.24, t2);
      gain2.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.32);
      osc2.connect(gain2);
      gain2.connect(bus);
      osc2.start(t2);
      osc2.stop(t2 + 0.33);

      // Sparkle Harmonic: G#6 (1661 Hz) - Anime major 3rd sparkle
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1661, t2);
      gain3.gain.setValueAtTime(0.12, t2);
      gain3.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.32);
      osc3.connect(gain3);
      gain3.connect(bus);
      osc3.start(t2);
      osc3.stop(t2 + 0.33);

      // Sparkle Shimmer: B6 (1976 Hz) - Crystal overtone
      const osc4 = audioCtx.createOscillator();
      const gain4 = audioCtx.createGain();
      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(1976, t2);
      gain4.gain.setValueAtTime(0.06, t2);
      gain4.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.22);
      osc4.connect(gain4);
      gain4.connect(bus);
      osc4.start(t2);
      osc4.stop(t2 + 0.23);

      // Clean cleanup
      osc2.onended = () => {
        try {
          osc1.disconnect();
          gain1.disconnect();
          osc2.disconnect();
          gain2.disconnect();
          osc3.disconnect();
          gain3.disconnect();
          osc4.disconnect();
          gain4.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * Sound: Enemy Stomp (Pop Cat mouth "POP!" / Bonk)
   * Resonant bandpass filtered mouth cavity pop (420Hz, Q=8.0) + sub-bass drop (180Hz -> 50Hz).
   */
  function playStomp() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const bus = getMasterBus(audioCtx);

      // Layer 1: Resonant Cavity Mouth Pop (Pop Cat "POP!")
      const popOsc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const popGain = audioCtx.createGain();

      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(460, now);
      popOsc.frequency.exponentialRampToValueAtTime(280, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, now);
      filter.Q.setValueAtTime(8.0, now);

      popGain.gain.setValueAtTime(0.0001, now);
      popGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      popOsc.connect(filter);
      filter.connect(popGain);
      popGain.connect(bus);

      popOsc.start(now);
      popOsc.stop(now + 0.05);

      // Layer 2: Sub-bass "Bonk" Weight
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, now);
      subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.26, now + 0.002);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      subOsc.connect(subGain);
      subGain.connect(bus);

      subOsc.start(now);
      subOsc.stop(now + 0.095);

      subOsc.onended = () => {
        try {
          popOsc.disconnect();
          filter.disconnect();
          popGain.disconnect();
          subOsc.disconnect();
          subGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * Sound: Block Bump (Metal Pipe reverberant thud / cartoon woodblock bump)
   * Resonant clang through 750Hz bandpass + low hollow thud body (220Hz -> 65Hz).
   */
  function playBump() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const bus = getMasterBus(audioCtx);

      // Layer 1: Metallic Pipe Clang
      const clangOsc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const clangGain = audioCtx.createGain();

      clangOsc.type = 'square';
      clangOsc.frequency.setValueAtTime(580, now);
      clangOsc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, now);
      filter.Q.setValueAtTime(4.0, now);

      clangGain.gain.setValueAtTime(0.0001, now);
      clangGain.gain.linearRampToValueAtTime(0.14, now + 0.002);
      clangGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      clangOsc.connect(filter);
      filter.connect(clangGain);
      clangGain.connect(bus);

      clangOsc.start(now);
      clangOsc.stop(now + 0.045);

      // Layer 2: Hollow Thud Body (140Hz->45Hz / 220Hz->65Hz)
      const thudOsc = audioCtx.createOscillator();
      const thudGain = audioCtx.createGain();

      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(220, now);
      thudOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

      thudGain.gain.setValueAtTime(0.0001, now);
      thudGain.gain.linearRampToValueAtTime(0.26, now + 0.002);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      thudOsc.connect(thudGain);
      thudGain.connect(bus);

      thudOsc.start(now);
      thudOsc.stop(now + 0.085);

      thudOsc.onended = () => {
        try {
          clangOsc.disconnect();
          filter.disconnect();
          clangGain.disconnect();
          thudOsc.disconnect();
          thudGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * Sound: Player Death (Sad Trombone Wah-Wah-Wah-Waaaaahhh)
   * 4-note descending brass slide (D#4 -> D4 -> C#4 -> C4 glissando + 6.5Hz wah-wah tremolo).
   */
  function playDeath() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const bus = getMasterBus(audioCtx);

      // Sad Trombone 4-Note Descending Progression
      const notes = [
        { freq: 311.13, start: 0.00, dur: 0.20, slide: false }, // D#4
        { freq: 293.66, start: 0.22, dur: 0.20, slide: false }, // D4
        { freq: 277.18, start: 0.44, dur: 0.20, slide: false }, // C#4
        { freq: 261.63, start: 0.66, dur: 0.70, slide: true }   // C4 (Descending slide + tremolo)
      ];

      notes.forEach(n => {
        const tStart = now + n.start;
        const tEnd = tStart + n.dur;

        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, tStart);
        filter.Q.setValueAtTime(3.5, tStart);

        if (!n.slide) {
          // Wah-wah scoop: starts slightly lower in pitch and swells up
          osc.frequency.setValueAtTime(n.freq * 0.94, tStart);
          osc.frequency.linearRampToValueAtTime(n.freq, tStart + 0.04);

          gain.gain.setValueAtTime(0.0001, tStart);
          gain.gain.linearRampToValueAtTime(0.20, tStart + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
        } else {
          // Note 4: Extended weeping slide + tremolo
          osc.frequency.setValueAtTime(n.freq, tStart);
          osc.frequency.setValueAtTime(n.freq, tStart + 0.15);
          osc.frequency.exponentialRampToValueAtTime(195, tEnd); // Slide down to 195 Hz

          gain.gain.setValueAtTime(0.0001, tStart);
          gain.gain.linearRampToValueAtTime(0.22, tStart + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

          // Tremolo LFO on note 4
          const tremolo = audioCtx.createOscillator();
          const tremoloGain = audioCtx.createGain();
          tremolo.type = 'sine';
          tremolo.frequency.setValueAtTime(6.5, tStart);
          tremoloGain.gain.setValueAtTime(0.07, tStart);

          tremolo.connect(gain.gain);
          tremolo.start(tStart);
          tremolo.stop(tEnd);

          tremolo.onended = () => {
            try {
              tremolo.disconnect();
              tremoloGain.disconnect();
            } catch (e) {}
          };
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(bus);

        osc.start(tStart);
        osc.stop(tEnd + 0.02);

        osc.onended = () => {
          try {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
          } catch (e) {}
        };
      });
    } catch (e) {}
  }

  /**
   * Helper: Schedules a click-free synthesized note with optional 8-bit vibrato.
   */
  function scheduleChiptuneNote(audioCtx, freq, startTime, duration, type = 'square', vol = 0.18, vibrato = false) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), startTime);

    // De-clicking Gain Envelope (5ms linear attack, sustain, 15ms exponential release)
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    gain.gain.setValueAtTime(vol, startTime + Math.max(0.005, duration - 0.02));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Optional 8-Bit Vibrato via LFO
    let lfo = null;
    let lfoGain = null;
    if (vibrato && duration > 0.25) {
      lfo = audioCtx.createOscillator();
      lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(6.0, startTime);
      lfoGain.gain.setValueAtTime(0.0, startTime);
      lfoGain.gain.setValueAtTime(0.0, startTime + 0.10);
      lfoGain.gain.linearRampToValueAtTime(7.0, startTime + 0.25);

      lfo.connect(osc.frequency);
      lfo.start(startTime + 0.10);
      lfo.stop(startTime + duration);
    }

    osc.connect(gain);
    gain.connect(getMasterBus(audioCtx));

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
        if (lfo) lfo.disconnect();
        if (lfoGain) lfoGain.disconnect();
      } catch (e) {}
    };
  }

  /**
   * Sound: Stage Clear / Flag Fanfare (Iván's 8-Bit "Happy Birthday" Chiptune Melody + Victory Fanfare)
   * Authentic NES-style square melody & triangle bassline, party arpeggios, and grand chord triad.
   */
  function playWin() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // Section A: "Cumpleaños Feliz / Happy Birthday Iván" Melody
      const melody = [
        { f: 392.00, t: 0.00, d: 0.16, v: false }, // G4 (Cum-)
        { f: 392.00, t: 0.18, d: 0.14, v: false }, // G4 (-ple-)
        { f: 440.00, t: 0.34, d: 0.28, v: false }, // A4 (-a-)
        { f: 392.00, t: 0.64, d: 0.28, v: false }, // G4 (-ños)
        { f: 523.25, t: 0.94, d: 0.28, v: false }, // C5 (fe-)
        { f: 493.88, t: 1.24, d: 0.54, v: true  }, // B4 (-liz...)

        { f: 392.00, t: 1.82, d: 0.16, v: false }, // G4 (Cum-)
        { f: 392.00, t: 2.00, d: 0.14, v: false }, // G4 (-ple-)
        { f: 440.00, t: 2.16, d: 0.24, v: false }, // A4 (-a-)
        { f: 493.88, t: 2.42, d: 0.24, v: false }, // B4 (-ños)
        { f: 523.25, t: 2.68, d: 0.32, v: true  }  // C5 (I-ván!)
      ];

      // Accompanying NES Triangle Bassline
      const bassline = [
        { f: 130.81, t: 0.00, d: 0.30 }, // C3
        { f: 196.00, t: 0.34, d: 0.28 }, // G3
        { f: 164.81, t: 0.64, d: 0.28 }, // E3
        { f: 196.00, t: 0.94, d: 0.28 }, // G3
        { f: 196.00, t: 1.24, d: 0.50 }, // G3
        { f: 146.83, t: 1.82, d: 0.30 }, // D3
        { f: 196.00, t: 2.16, d: 0.24 }, // G3
        { f: 130.81, t: 2.42, d: 0.40 }  // C3
      ];

      // Schedule Section A Melody
      melody.forEach(n => {
        scheduleChiptuneNote(audioCtx, n.f, now + n.t, n.d, 'square', 0.18, n.v);
      });

      // Schedule Section A Bass
      bassline.forEach(b => {
        scheduleChiptuneNote(audioCtx, b.f, now + b.t, b.d, 'triangle', 0.22, false);
      });

      // Section B: Rapid Party Arpeggio Cascade (2.95s -> 3.35s)
      const arpNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      arpNotes.forEach((freq, idx) => {
        scheduleChiptuneNote(audioCtx, freq, now + 2.95 + idx * 0.045, 0.06, 'square', 0.14, false);
      });

      // Section C: Grand Triumphant Victory Fanfare Triad (3.35s -> 4.30s)
      const chordTime = now + 3.35;
      const chordNotes = [
        { f: 130.81, d: 0.95, type: 'triangle', vol: 0.24 }, // Bass C3
        { f: 523.25, d: 0.90, type: 'square',   vol: 0.14 }, // C5
        { f: 659.25, d: 0.90, type: 'square',   vol: 0.14 }, // E5
        { f: 783.99, d: 0.90, type: 'square',   vol: 0.14 }, // G5
        { f: 1046.50, d: 0.95, type: 'square',  vol: 0.16, vib: true } // C6 Lead with Vibrato
      ];

      chordNotes.forEach(c => {
        scheduleChiptuneNote(audioCtx, c.f, chordTime, c.d, c.type, c.vol, !!c.vib);
      });

      // Festive Sparkle Octave Trill on Top
      const trillNotes = [1046.50, 1318.51, 1567.98, 2093.00];
      trillNotes.forEach((freq, idx) => {
        scheduleChiptuneNote(audioCtx, freq, chordTime + 0.10 + idx * 0.08, 0.09, 'sine', 0.10, false);
      });

    } catch (e) {}
  }

  /**
   * Helper: Schedules a single MLG Airhorn brass blast.
   */
  function scheduleAirhornBlast(audioCtx, startTime, duration, isFinal = false) {
    const osc1 = audioCtx.createOscillator(); // Main Fundamental Sawtooth
    const osc2 = audioCtx.createOscillator(); // Detuned Unison (+7Hz)
    const osc3 = audioCtx.createOscillator(); // Sub-Octave Square
    const osc4 = audioCtx.createOscillator(); // 5th Harmonic Sawtooth

    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    const rootFreq = 739.99; // F#5

    // Initial air-pressure pitch transient overshoot
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(rootFreq + 45, startTime);
    osc1.frequency.exponentialRampToValueAtTime(rootFreq, startTime + 0.02);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(rootFreq + 52, startTime);
    osc2.frequency.exponentialRampToValueAtTime(rootFreq + 7, startTime + 0.02);

    osc3.type = 'square';
    osc3.frequency.setValueAtTime(rootFreq / 2 + 20, startTime);
    osc3.frequency.exponentialRampToValueAtTime(rootFreq / 2, startTime + 0.02);

    osc4.type = 'sawtooth';
    osc4.frequency.setValueAtTime(rootFreq * 1.5, startTime);

    if (isFinal) {
      // Downward slide on final blast tail
      osc1.frequency.setValueAtTime(rootFreq, startTime + duration - 0.10);
      osc1.frequency.exponentialRampToValueAtTime(650, startTime + duration);
    }

    // Resonant Horn Bell Filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1850, startTime);
    filter.Q.setValueAtTime(3.2, startTime);

    // Dynamic Horn Gain Envelope
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.005);
    gain.gain.setValueAtTime(0.25, startTime + duration - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Route Oscillators through Filter and Gain
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    osc4.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterBus(audioCtx));

    const stopTime = startTime + duration + 0.02;
    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc4.start(startTime);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    osc4.stop(stopTime);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        osc3.disconnect();
        osc4.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  /**
   * Sound: playAirhorn() - Classic MLG Triplet Meme Audio Effect
   * Blast Pattern: Honk (110ms) -> Honk (110ms) -> HOOOONK (450ms)
   */
  function playAirhorn() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // Blast 1: Short honk
      scheduleAirhornBlast(audioCtx, now + 0.00, 0.11, false);
      // Blast 2: Short honk
      scheduleAirhornBlast(audioCtx, now + 0.14, 0.11, false);
      // Blast 3: Triumphant long honk
      scheduleAirhornBlast(audioCtx, now + 0.28, 0.45, true);
    } catch (e) {}
  }

  /**
   * Sound: playBruh() - Procedural Vocal Formant "Bruh" Meme Sound Effect
   * Dual formant bandpass filters (480Hz & 1050Hz) driven by pitch-gliding vocal fundamental.
   */
  function playBruh() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const bus = getMasterBus(audioCtx);

      const osc = audioCtx.createOscillator();
      const formant1 = audioCtx.createBiquadFilter();
      const formant2 = audioCtx.createBiquadFilter();
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();
      const mainGain = audioCtx.createGain();

      // Vocal fundamental pitch drop (105Hz -> 75Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(105, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.38);

      // Formant 1: Vowel "uh" acoustic resonance
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(480, now);
      formant1.Q.setValueAtTime(4.5, now);

      // Formant 2: Upper throat formant
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1050, now);
      formant2.Q.setValueAtTime(4.0, now);

      gain1.gain.setValueAtTime(0.70, now);
      gain2.gain.setValueAtTime(0.30, now);

      // Vocal Amplitude Envelope
      mainGain.gain.setValueAtTime(0.0001, now);
      mainGain.gain.linearRampToValueAtTime(0.32, now + 0.015);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);

      osc.connect(formant1);
      osc.connect(formant2);
      formant1.connect(gain1);
      formant2.connect(gain2);
      gain1.connect(mainGain);
      gain2.connect(mainGain);
      mainGain.connect(bus);

      osc.start(now);
      osc.stop(now + 0.42);

      osc.onended = () => {
        try {
          osc.disconnect();
          formant1.disconnect();
          formant2.disconnect();
          gain1.disconnect();
          gain2.disconnect();
          mainGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  function stopAll() {
    if (masterGain && ctx) {
      try {
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
      } catch (e) {}
    }
  }

  function resumeAudio() {
    if (masterGain && ctx) {
      try {
        masterGain.gain.setValueAtTime(0.70, ctx.currentTime);
      } catch (e) {}
    }
  }

  // Public GameAudio Interface Contract
  const GameAudio = {
    init,
    unlockAudio,
    stopAll,
    resumeAudio,
    playJump,
    playCoin,
    playStomp,
    playBump,
    playDeath,
    playWin,
    playAirhorn,
    playBruh,
    playTone
  };

  const targetScope = typeof window !== 'undefined'
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : global);

  targetScope.GameAudio = GameAudio;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAudio;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
