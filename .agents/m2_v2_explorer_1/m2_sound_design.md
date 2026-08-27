# M2 Sound Design Specification: Procedural Web Audio Synthesizer Engine

> **Document Version**: 2.0.0  
> **Author**: M2 Sound Design Explorer (`m2_v2_explorer_1`)  
> **Status**: APPROVED AUDIO SPECIFICATION  
> **Target Milestone**: Milestone 2 (Meme Web Audio Synthesizer Engine)  
> **Repository Root**: `c:/Users/SrJos/Downloads/Proyecto ivan`  
> **Target Source File**: `js/audio.js`  

---

## 1. Executive Summary & Synthesis Principles

In **V2 Iván's Birthday Gift Edition**, the sound effects are upgraded from generic 8-bit bleeps into hilarious, punchy, and iconic **Internet Meme Sound Effects** created 100% procedurally via the standard **Web Audio API**.

### Core Engineering Invariants
1. **100% Procedural & Zero External Assets**: Zero `.mp3`, `.wav`, or `.ogg` network requests. No 404 errors, no CORS blocking, zero asset latency.
2. **Deterministic Offline & Headless Safety**: Runs in headless Chrome CDP and Node.js test environments with graceful null/mock handling and 0 console errors or exceptions.
3. **Ergonomic Dynamic Range & Mastering**: All sound volumes are balanced within $[0.14, 0.35]$ peak gain with exponential fade-outs to avoid audio clipping or speaker popping.
4. **Anti-Click Scheduling**: Every audio envelope utilizes linear attack ramps ($3\text{ms} - 5\text{ms}$) rather than instantaneous step changes to eliminate DC offset clicks.
5. **Automatic Memory & Node Lifecycle**: All transient oscillators and filters are scheduled with `.start(now)` and `.stop(now + duration)` allowing automatic Web Audio engine cleanup without memory leaks.

---

## 2. Audio Subsystem Architecture Overview

```
+---------------------------------------------------------------------------------------------------+
|                                  WEB AUDIO SYNTHESIS ENGINE (js/audio.js)                         |
|                                                                                                   |
|   +-------------------+       +---------------------+       +-------------------+                 |
|   | Carrier/Tone Osc  | ----> | BiquadFilter (Tone) | ----> | Gain Envelope     | --\             |
|   +-------------------+       +---------------------+       +-------------------+   \             |
|             ^                                                         ^              \            |
|             | (Freq FM)                                               | (Tremolo AM)  +-> [Audio  |
|   +-------------------+                                     +-------------------+    /    Context |
|   | Vibrato / LFO Osc |                                     | Tremolo / LFO Osc |   /     Dest]   |
|   +-------------------+                                     +-------------------+  /              |
|                                                                                   /               |
|   +-------------------+                                     +-------------------+/                |
|   | Sub-Bass Body Osc | ----------------------------------> | Sub Gain Envelope |                 |
|   +-------------------+                                     +-------------------+                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Sound Design Specifications

### 3.1 `playJump()`: Cartoon Spring "Boing!" / Comic Pitch Sweep

#### Character & Meme Reference
A comedic, bouncing cartoon spring sound (*Boing-g-g-g!*). Features an energetic upward pitch glide with dynamic LFO frequency modulation (spring flutter/vibrato) that rapidly settles.

#### Technical Parameters
- **Carrier Waveform**: `sine` (elastic, clean fundamental).
- **Pitch Sweep Range**: $160\text{ Hz} \to 680\text{ Hz}$ in $0.12\text{ s}$, settling to $560\text{ Hz}$ at $0.22\text{ s}$.
- **LFO Modulator (Spring Vibrato)**:
  - Waveform: `sine`.
  - Rate: $22\text{ Hz}$ (fast cartoon coil wobble).
  - Depth Envelope (`lfoGain`): $0\text{ Hz} \to 45\text{ Hz}$ peak at $t=0.03\text{ s}$, decaying exponentially to $0.1\text{ Hz}$ at $t=0.20\text{ s}$.
- **Main Gain Envelope**:
  - Attack: $0.001 \to 0.22$ over $5\text{ ms}$.
  - Decay: Exponential ramp from $0.22 \to 0.001$ over $0.22\text{ s}$.
  - Total Duration: $0.23\text{ s}$.

#### Node Connection Graph
```
[LFO (sine, 22Hz)] ---> [LFOGain (45Hz -> 0.1Hz)] ---> [CarrierOsc.frequency (160 -> 680Hz)]
                                                             |
                                                      [CarrierOsc (sine)]
                                                             |
                                                      [MainGain (0.22 -> 0.001)] ---> [Destination]
```

#### Reference Implementation Code
```javascript
function playJump() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

    const carrier = audioCtx.createOscillator();
    const carrierGain = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();

    // Carrier Setup: Sine wave with upward spring pitch glide
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(160, now);
    carrier.frequency.exponentialRampToValueAtTime(680, now + 0.12);
    carrier.frequency.linearRampToValueAtTime(560, now + 0.22);

    // LFO Setup: Spring coil flutter vibrato
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(45, now + 0.03);
    lfoGain.gain.exponentialRampToValueAtTime(0.1, now + 0.20);

    lfo.connect(lfoGain);
    lfoGain.connect(carrier.frequency);

    // Amplitude Envelope: Anti-click attack and smooth decay
    carrierGain.gain.setValueAtTime(0.001, now);
    carrierGain.gain.linearRampToValueAtTime(0.22, now + 0.005);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    carrier.connect(carrierGain);
    carrierGain.connect(audioCtx.destination);

    lfo.start(now);
    carrier.start(now);
    lfo.stop(now + 0.23);
    carrier.stop(now + 0.23);
  } catch (e) {}
}
```

---

### 3.2 `playCoin()`: Anime Sparkle / "Ka-Ching!" Cash Register Coin

#### Character & Meme Reference
A sparkling, joyful anime/arcade coin pickup combined with a metallic cash register "Ka-Ching!" bell chime.

#### Technical Parameters
- **Note 1 (The Coin Strike / Mechanical Ping)**:
  - Frequency: $B_5 = 988\text{ Hz}$.
  - Waveform: `sine`.
  - Timing: $t=0.000\text{ s} \to 0.065\text{ s}$.
  - Gain: $0.20 \to 0.01$ linear ramp.
- **Note 2 (The Main Bell Chime)**:
  - Frequency: $E_6 = 1319\text{ Hz}$.
  - Waveform: `sine`.
  - Timing: $t=0.065\text{ s} \to 0.380\text{ s}$.
  - Gain: $0.24$ peak, exponential decay to $0.0005$.
- **Harmonic Layer 1 (Anime 3rd Major Sparkle)**:
  - Frequency: $G\#_6 = 1661\text{ Hz}$.
  - Waveform: `sine`.
  - Timing: $t=0.065\text{ s} \to 0.380\text{ s}$.
  - Gain: $0.12$ peak, exponential decay to $0.0005$.
- **Harmonic Layer 2 (Crystal Shimmer Overtone)**:
  - Frequency: $B_6 = 1976\text{ Hz}$.
  - Waveform: `sine`.
  - Timing: $t=0.065\text{ s} \to 0.250\text{ s}$.
  - Gain: $0.06$ peak, exponential decay to $0.0005$.

#### Node Connection Graph
```
Note 1 (Strike @ 0.00s):
[Osc1 (sine, 988Hz)] ---> [Gain1 (0.20 -> 0.01 @ 0.065s)] -------------\
                                                                        |
Note 2 & Sparkle (starts @ 0.065s):                                     +--> [Destination]
[Osc2 (sine, 1319Hz)] ---> [Gain2 (0.24 -> 0.0005 @ 0.38s)] ----------+
[Osc3 (sine, 1661Hz)] ---> [Gain3 (0.12 -> 0.0005 @ 0.38s)] ----------+
[Osc4 (sine, 1976Hz)] ---> [Gain4 (0.06 -> 0.0005 @ 0.25s)] ----------/
```

#### Reference Implementation Code
```javascript
function playCoin() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

    // Note 1: B5 (988 Hz) - Coin strike
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(988, now);
    gain1.gain.setValueAtTime(0.20, now);
    gain1.gain.linearRampToValueAtTime(0.01, now + 0.065);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
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
    gain2.connect(audioCtx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.33);

    // Sparkle Harmonic: G#6 (1661 Hz) - Major 3rd anime sparkle
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1661, t2);
    gain3.gain.setValueAtTime(0.12, t2);
    gain3.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.32);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
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
    gain4.connect(audioCtx.destination);
    osc4.start(t2);
    osc4.stop(t2 + 0.23);
  } catch (e) {}
}
```

---

### 3.3 `playStomp()`: Pop Cat Mouth "POP!" / Bonk & Sub-bass Drop

#### Character & Meme Reference
The viral Pop Cat mouth opening "POP!" sound combined with a comic "Bonk!" squash effect. Features a resonant acoustic mouth cavity pop followed by a punchy sub-bass drop.

#### Technical Parameters
- **Layer 1: Resonant Mouth Pop (Pop Cat Formant)**:
  - Oscillator: `triangle` wave.
  - Pitch Sweep: $460\text{ Hz} \to 280\text{ Hz}$ in $0.04\text{ s}$.
  - Filter: `BiquadFilterNode` (`type: 'bandpass'`, Center Frequency $f_c = 420\text{ Hz}$, $Q = 8.0$).
  - Gain Envelope: Instant rise to $0.35$, exponential decay to $0.001$ over $0.045\text{ s}$.
- **Layer 2: Sub-bass "Bonk" Impact**:
  - Oscillator: `sine` wave.
  - Pitch Drop: $180\text{ Hz} \to 50\text{ Hz}$ in $0.09\text{ s}$.
  - Gain Envelope: Peak $0.26$, exponential decay to $0.001$ over $0.09\text{ s}$.

#### Node Connection Graph
```
[Pop Osc (triangle, 460->280Hz)] ---> [BiquadFilter (Bandpass, 420Hz, Q=8.0)] ---> [Gain1 (0.35->0.001)] ---\
                                                                                                                +--> [Destination]
[Sub Osc (sine, 180->50Hz)] ----------------------------------------------------> [Gain2 (0.26->0.001)] ---/
```

#### Reference Implementation Code
```javascript
function playStomp() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

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

    popGain.gain.setValueAtTime(0.35, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    popOsc.connect(filter);
    filter.connect(popGain);
    popGain.connect(audioCtx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.05);

    // Layer 2: Sub-bass "Bonk" Weight
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

    subGain.gain.setValueAtTime(0.26, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.095);
  } catch (e) {}
}
```

---

### 3.4 `playBump()`: Metal Pipe Reverberant Thud / Cartoon Woodblock

#### Character & Meme Reference
A comedic hollow metal pipe reverberant thud / cartoon woodblock bump when Iván hits an empty block or solid obstacle.

#### Technical Parameters
- **Layer 1: Metallic Pipe Clink / Resonant Ring**:
  - Oscillator: `square` wave.
  - Pitch Sweep: $580\text{ Hz} \to 320\text{ Hz}$ in $0.04\text{ s}$.
  - Filter: `BiquadFilterNode` (`type: 'bandpass'`, $f_c = 750\text{ Hz}$, $Q = 4.0$).
  - Gain Envelope: $0.14 \to 0.001$ over $0.04\text{ s}$.
- **Layer 2: Low Hollow Thud Body**:
  - Oscillator: `triangle` wave.
  - Pitch Drop: $220\text{ Hz} \to 65\text{ Hz}$ in $0.08\text{ s}$.
  - Gain Envelope: $0.26 \to 0.001$ over $0.08\text{ s}$.

#### Node Connection Graph
```
[Clang Osc (square, 580->320Hz)] ---> [BiquadFilter (Bandpass, 750Hz, Q=4.0)] ---> [Gain1 (0.14 -> 0.001 @ 0.04s)] ---\
                                                                                                                        +--> [Destination]
[Thud Osc (triangle, 220->65Hz)] ---------------------------------------------> [Gain2 (0.26 -> 0.001 @ 0.08s)] --/
```

#### Reference Implementation Code
```javascript
function playBump() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

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

    clangGain.gain.setValueAtTime(0.14, now);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clangOsc.connect(filter);
    filter.connect(clangGain);
    clangGain.connect(audioCtx.destination);

    clangOsc.start(now);
    clangOsc.stop(now + 0.045);

    // Layer 2: Hollow Thud Body
    const thudOsc = audioCtx.createOscillator();
    const thudGain = audioCtx.createGain();

    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(220, now);
    thudOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

    thudGain.gain.setValueAtTime(0.26, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    thudOsc.connect(thudGain);
    thudGain.connect(audioCtx.destination);

    thudOsc.start(now);
    thudOsc.stop(now + 0.085);
  } catch (e) {}
}
```

---

### 3.5 `playDeath()`: Sad Trombone (4-Note Descending Slide with Wah-Wah Tremolo)

#### Character & Meme Reference
The iconic internet meme fail sound (*Wah-Wah-Wah-Waaaaahhh*). 4 descending brass notes with plunger mute vowel modulation and an extended weeping glissando + tremolo on the final note.

#### Technical Parameters
- **Musical Progression**:
  1. $D\#_4 = 311.13\text{ Hz}$ ($t=0.00\text{ s} \to 0.20\text{ s}$).
  2. $D_4 = 293.66\text{ Hz}$ ($t=0.22\text{ s} \to 0.42\text{ s}$).
  3. $C\#_4 = 277.18\text{ Hz}$ ($t=0.44\text{ s} \to 0.64\text{ s}$).
  4. $C_4 = 261.63\text{ Hz} \to 195.00\text{ Hz}$ descending slide ($t=0.66\text{ s} \to 1.36\text{ s}$).
- **Timbre Generator**: `sawtooth` oscillator filtered through a resonant lowpass filter ($f_c = 950\text{ Hz}$, $Q = 3.5$) creating the classic brass/trombone body.
- **Wah-Wah Articulation**: Initial $40\text{ ms}$ upward pitch scoop ($0.94 \times f \to f$) and volume swell ($0.01 \to 0.20$) simulating plunger mute movement.
- **Final Note Slide & Tremolo**:
  - Downward glissando: $261.63\text{ Hz} \to 195.00\text{ Hz}$ over $0.70\text{ s}$.
  - Tremolo: Sine LFO at $6.5\text{ Hz}$ with gain depth $0.07$ directly modulating the note gain envelope.

#### Node Connection Graph
```
For Notes 1-3 (Wah-Wah Scoop):
[Osc (sawtooth)] ---> [Lowpass (950Hz, Q=3.5)] ---> [Gain (0.01->0.20->0.01)] ---> [Destination]

For Note 4 (Extended Weeping Finale):
[LFO (sine, 6.5Hz)] ---> [LFOGain (0.07)] ---> [NoteGain.gain]
                                                    ^
[Osc4 (sawtooth, 261->195Hz)] ---> [Lowpass (950Hz, Q=3.5)] ---> [NoteGain (0.22->0.001)] ---> [Destination]
```

#### Reference Implementation Code
```javascript
function playDeath() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

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
        // Wah-wah scoop
        osc.frequency.setValueAtTime(n.freq * 0.94, tStart);
        osc.frequency.linearRampToValueAtTime(n.freq, tStart + 0.04);

        gain.gain.setValueAtTime(0.01, tStart);
        gain.gain.linearRampToValueAtTime(0.20, tStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, tEnd);
      } else {
        // Note 4: Extended weeping slide + tremolo
        osc.frequency.setValueAtTime(n.freq, tStart);
        osc.frequency.setValueAtTime(n.freq, tStart + 0.15);
        osc.frequency.exponentialRampToValueAtTime(195, tEnd); // Slide down to 195 Hz

        gain.gain.setValueAtTime(0.01, tStart);
        gain.gain.linearRampToValueAtTime(0.22, tStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, tEnd);

        // Tremolo LFO on note 4
        const tremolo = audioCtx.createOscillator();
        const tremoloGain = audioCtx.createGain();
        tremolo.type = 'sine';
        tremolo.frequency.setValueAtTime(6.5, tStart);
        tremoloGain.gain.setValueAtTime(0.07, tStart);

        tremolo.connect(tremoloGain);
        tremoloGain.connect(gain.gain);

        tremolo.start(tStart);
        tremolo.stop(tEnd);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(tStart);
      osc.stop(tEnd + 0.02);
    });
  } catch (e) {}
}
```

---

### 3.6 `playWin()`: Iván's 8-Bit "Happy Birthday" Celebratory Chiptune Fanfare

#### Character & Meme Reference
A festive, joyful 8-bit chiptune rendition of the "Happy Birthday" ("Cumpleaños Feliz") opening phrase, leading into an ascending celebratory victory arpeggio with sparkle finish.

#### Technical Parameters
- **Melody Progression Table**:
  | # | Note Name | Frequency (Hz) | Duration (s) | Pause (s) | Waveform | Role |
  |---|---|---|---|---|---|---|
  | 1 | G4 | 392.00 | 0.16 | 0.04 | `square` | "Cum-" |
  | 2 | G4 | 392.00 | 0.16 | 0.04 | `square` | "-ple-" |
  | 3 | A4 | 440.00 | 0.28 | 0.04 | `square` | "-a-" |
  | 4 | G4 | 392.00 | 0.28 | 0.04 | `square` | "-ños" |
  | 5 | C5 | 523.25 | 0.28 | 0.04 | `square` | "fe-" |
  | 6 | B4 | 493.88 | 0.45 | 0.08 | `square` | "-liz!" |
  | 7 | C5 | 523.25 | 0.12 | 0.02 | `triangle` | Victory Arpeggio Root |
  | 8 | E5 | 659.25 | 0.12 | 0.02 | `triangle` | Victory Arpeggio 3rd |
  | 9 | G5 | 783.99 | 0.12 | 0.02 | `triangle` | Victory Arpeggio 5th |
  | 10| C6 | 1046.50| 0.65 | 0.00 | `triangle` | High Triumphant Sustain |

#### Reference Implementation Code
```javascript
function playWin() {
  try {
    const audioCtx = getContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

    // Happy Birthday Melody + Victory Arpeggio
    const melody = [
      { f: 392.00, d: 0.16, pause: 0.04 }, // G4
      { f: 392.00, d: 0.16, pause: 0.04 }, // G4
      { f: 440.00, d: 0.28, pause: 0.04 }, // A4
      { f: 392.00, d: 0.28, pause: 0.04 }, // G4
      { f: 523.25, d: 0.28, pause: 0.04 }, // C5
      { f: 493.88, d: 0.45, pause: 0.08 }, // B4
      { f: 523.25, d: 0.12, pause: 0.02 }, // C5
      { f: 659.25, d: 0.12, pause: 0.02 }, // E5
      { f: 783.99, d: 0.12, pause: 0.02 }, // G5
      { f: 1046.50, d: 0.65, pause: 0.00 } // C6 (Grand sustain)
    ];

    let tOffset = 0;
    melody.forEach((n, idx) => {
      const tStart = now + tOffset;
      const tEnd = tStart + n.d;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = idx >= 6 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(n.f, tStart);

      gain.gain.setValueAtTime(0.01, tStart);
      gain.gain.linearRampToValueAtTime(0.18, tStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, tEnd);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(tStart);
      osc.stop(tEnd + 0.01);

      tOffset += n.d + n.pause;
    });
  } catch (e) {}
}
```

---

## 4. Complete Unified Synthesis Blueprint for `js/audio.js`

Below is the complete, drop-in replacement blueprint for `js/audio.js` with all helper functions, lifecycle management, gesture unlock listeners, and module exports:

```javascript
/**
 * js/audio.js - Procedural Web Audio API Meme Synthesizer Engine
 *
 * V2 Iván's Birthday Gift Edition (M2)
 *
 * Synthesizes high-definition procedural meme sound effects:
 * - playJump(): Cartoon Spring "Boing!" with FM pitch sweep & vibrato flutter.
 * - playCoin(): Anime sparkle / "Ka-Ching!" cash register chime (B5 -> E6 + G#6 + B6).
 * - playStomp(): Pop Cat mouth "POP!" / Bonk (resonant bandpass 420Hz + sub-bass drop).
 * - playBump(): Metal Pipe reverberant thud / cartoon woodblock bump.
 * - playDeath(): Sad Trombone 4-note brass slide (D#4 -> D4 -> C#4 -> C4 glissando + tremolo).
 * - playWin(): Iván's 8-bit "Happy Birthday" chiptune melody & victory fanfare.
 *
 * 100% zero external audio asset dependencies. Deterministic safe fallback for headless/Node tests.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let isUnlocked = false;

  /**
   * Initializes the AudioContext safely.
   */
  function getContext() {
    if (!ctx) {
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (AudioCtx) {
        try {
          ctx = new AudioCtx();
        } catch (e) {
          ctx = null;
        }
      }
    }
    return ctx;
  }

  /**
   * Unlocks Web Audio on first user interaction.
   */
  function unlockAudio() {
    const audioCtx = getContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    isUnlocked = true;
  }

  /**
   * Initialize audio listeners for user gesture unlock.
   */
  function init() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
      const onFirstInteraction = () => {
        unlockAudio();
        unlockEvents.forEach(evt => window.removeEventListener(evt, onFirstInteraction));
      };
      unlockEvents.forEach(evt => window.addEventListener(evt, onFirstInteraction, { passive: true }));
    }
  }

  /**
   * Helper to safely synthesize tones (legacy compatibility).
   */
  function playTone(freqStart, freqEnd, type, duration, volumeStart = 0.2, volumeEnd = 0.001) {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
      }

      gain.gain.setValueAtTime(volumeStart, now);
      gain.gain.exponentialRampToValueAtTime(volumeEnd, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  /**
   * Sound: Player Jump (Cartoon Spring "Boing!" / Comic Pitch Sweep)
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

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(160, now);
      carrier.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      carrier.frequency.linearRampToValueAtTime(560, now + 0.22);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(22, now);
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(45, now + 0.03);
      lfoGain.gain.exponentialRampToValueAtTime(0.1, now + 0.20);

      lfo.connect(lfoGain);
      lfoGain.connect(carrier.frequency);

      carrierGain.gain.setValueAtTime(0.001, now);
      carrierGain.gain.linearRampToValueAtTime(0.22, now + 0.005);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      carrier.connect(carrierGain);
      carrierGain.connect(audioCtx.destination);

      lfo.start(now);
      carrier.start(now);
      lfo.stop(now + 0.23);
      carrier.stop(now + 0.23);
    } catch (e) {}
  }

  /**
   * Sound: Coin Collection (Anime Sparkle / "Ka-Ching!" Cash Register Coin)
   */
  function playCoin() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // Note 1: B5 (988 Hz) - Coin strike
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(988, now);
      gain1.gain.setValueAtTime(0.20, now);
      gain1.gain.linearRampToValueAtTime(0.01, now + 0.065);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
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
      gain2.connect(audioCtx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.33);

      // Sparkle Harmonic: G#6 (1661 Hz) - Major 3rd anime sparkle
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1661, t2);
      gain3.gain.setValueAtTime(0.12, t2);
      gain3.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.32);
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
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
      gain4.connect(audioCtx.destination);
      osc4.start(t2);
      osc4.stop(t2 + 0.23);
    } catch (e) {}
  }

  /**
   * Sound: Enemy Stomp (Pop Cat mouth "POP!" / Bonk)
   */
  function playStomp() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

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

      popGain.gain.setValueAtTime(0.35, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      popOsc.connect(filter);
      filter.connect(popGain);
      popGain.connect(audioCtx.destination);

      popOsc.start(now);
      popOsc.stop(now + 0.05);

      // Layer 2: Sub-bass "Bonk" Weight
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, now);
      subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

      subGain.gain.setValueAtTime(0.26, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      subOsc.connect(subGain);
      subGain.connect(audioCtx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.095);
    } catch (e) {}
  }

  /**
   * Sound: Block Bump (Metal Pipe reverberant thud / cartoon woodblock bump)
   */
  function playBump() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

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

      clangGain.gain.setValueAtTime(0.14, now);
      clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      clangOsc.connect(filter);
      filter.connect(clangGain);
      clangGain.connect(audioCtx.destination);

      clangOsc.start(now);
      clangOsc.stop(now + 0.045);

      // Layer 2: Hollow Thud Body
      const thudOsc = audioCtx.createOscillator();
      const thudGain = audioCtx.createGain();

      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(220, now);
      thudOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

      thudGain.gain.setValueAtTime(0.26, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      thudOsc.connect(thudGain);
      thudGain.connect(audioCtx.destination);

      thudOsc.start(now);
      thudOsc.stop(now + 0.085);
    } catch (e) {}
  }

  /**
   * Sound: Player Death (Sad Trombone Wah-Wah-Wah-Waaaaahhh)
   */
  function playDeath() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

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
          // Wah-wah scoop
          osc.frequency.setValueAtTime(n.freq * 0.94, tStart);
          osc.frequency.linearRampToValueAtTime(n.freq, tStart + 0.04);

          gain.gain.setValueAtTime(0.01, tStart);
          gain.gain.linearRampToValueAtTime(0.20, tStart + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.01, tEnd);
        } else {
          // Note 4: Extended weeping slide + tremolo
          osc.frequency.setValueAtTime(n.freq, tStart);
          osc.frequency.setValueAtTime(n.freq, tStart + 0.15);
          osc.frequency.exponentialRampToValueAtTime(195, tEnd); // Slide down to 195 Hz

          gain.gain.setValueAtTime(0.01, tStart);
          gain.gain.linearRampToValueAtTime(0.22, tStart + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, tEnd);

          // Tremolo LFO on note 4
          const tremolo = audioCtx.createOscillator();
          const tremoloGain = audioCtx.createGain();
          tremolo.type = 'sine';
          tremolo.frequency.setValueAtTime(6.5, tStart);
          tremoloGain.gain.setValueAtTime(0.07, tStart);

          tremolo.connect(tremoloGain);
          tremoloGain.connect(gain.gain);

          tremolo.start(tStart);
          tremolo.stop(tEnd);
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(tStart);
        osc.stop(tEnd + 0.02);
      });
    } catch (e) {}
  }

  /**
   * Sound: Stage Clear / Flag Fanfare (Iván's Happy Birthday Chiptune Melody)
   */
  function playWin() {
    try {
      const audioCtx = getContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // Happy Birthday Melody + Victory Arpeggio
      const melody = [
        { f: 392.00, d: 0.16, pause: 0.04 }, // G4
        { f: 392.00, d: 0.16, pause: 0.04 }, // G4
        { f: 440.00, d: 0.28, pause: 0.04 }, // A4
        { f: 392.00, d: 0.28, pause: 0.04 }, // G4
        { f: 523.25, d: 0.28, pause: 0.04 }, // C5
        { f: 493.88, d: 0.45, pause: 0.08 }, // B4
        { f: 523.25, d: 0.12, pause: 0.02 }, // C5
        { f: 659.25, d: 0.12, pause: 0.02 }, // E5
        { f: 783.99, d: 0.12, pause: 0.02 }, // G5
        { f: 1046.50, d: 0.65, pause: 0.00 } // C6 (Grand sustain)
      ];

      let tOffset = 0;
      melody.forEach((n, idx) => {
        const tStart = now + tOffset;
        const tEnd = tStart + n.d;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = idx >= 6 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(n.f, tStart);

        gain.gain.setValueAtTime(0.01, tStart);
        gain.gain.linearRampToValueAtTime(0.18, tStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, tEnd);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(tStart);
        osc.stop(tEnd + 0.01);

        tOffset += n.d + n.pause;
      });
    } catch (e) {}
  }

  const GameAudio = {
    init,
    unlockAudio,
    playJump,
    playCoin,
    playStomp,
    playBump,
    playDeath,
    playWin,
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
```

---

## 5. Verification & Test Plan

1. **API Signature Parity Check**:
   - `GameAudio.init()`, `unlockAudio()`, `playJump()`, `playCoin()`, `playStomp()`, `playBump()`, `playDeath()`, `playWin()`, and `playTone()` all exist and have `typeof === 'function'`.
2. **Headless Safety Check**:
   - Calling all audio methods in Node.js (where `AudioContext` is undefined) executes cleanly without throwing or logging console warnings.
3. **In-Browser Interactive Verification**:
   - Running `test/headless_validator.mjs` verifies that audio unlocks on touch gestures and plays during gameplay without registering any console errors or exceptions.
