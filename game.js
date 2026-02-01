// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// v1.5 - Combat & UI Update
// - Melee attack (C key) with swing animation
// - Charged shots (hold X to charge)
// - Tap-to-move single tile, hold for continuous
// - Title screen with Tetris block logo
// - Pause menu (ESC key)
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions - smaller tiles, bigger grid
const TILE_SIZE = 28;
const REAL_WORLD_TILES = 20;
const GAME_WIDTH = REAL_WORLD_TILES * TILE_SIZE; // 560px
const REAL_WORLD_HEIGHT = REAL_WORLD_TILES * TILE_SIZE; // 560px
const DREAM_WORLD_HEIGHT = 12 * TILE_SIZE; // 336px (12 rows now)
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT + DREAM_WORLD_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const DREAM_WORLD_Y_OFFSET = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// 8-BIT AUDIO SYSTEM
// ============================================

const Audio8Bit = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicPlaying: false,
    musicNodes: [],

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Master gains
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.4;
            this.sfxGain.connect(this.ctx.destination);
        } catch (e) {
            console.log('Web Audio not supported');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Laser pew pew sound
    playLaser(isFireball = false) {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (isFireball) {
            // Fireball - deeper, more whooshy
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        } else {
            // Bullet - classic pew pew
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
        }

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.15);
    },

    // Enemy hit sound
    playHit() {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.2);
    },

    // Pickup sound
    playPickup() {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.sfxGain);

        // Rising arpeggio
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.setValueAtTime(554, this.ctx.currentTime + 0.05);
        osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.25);
    },

    // Damage sound
    playDamage() {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(80, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // Melee swing sound
    playMelee() {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.sfxGain);

        // Quick swoosh sound
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.12);
    },

    // Portal/teleport sound
    playPortal() {
        if (!this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.sfxGain);

        // Warping sweep
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.5);
    },

    // 8-bit space trap music track
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.resume();
        this.musicPlaying = true;

        // Music parameters - slow spacey trap
        const bpm = 100;
        const beatTime = 60 / bpm;

        // Note frequencies - minor key for spacey vibe
        const notes = {
            C2: 65.41, E2: 82.41, G2: 98.00, A2: 110.00, B2: 123.47,
            C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, G3: 196.00, A3: 220.00, B3: 246.94,
            C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, G4: 392.00, A4: 440.00, B4: 493.88,
            C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, G5: 783.99, A5: 880.00,
            C6: 1046.50, E6: 1318.51, G6: 1567.98
        };

        // Airy space melody - high notes, long sustains, sparse
        const melody = [
            // Bar 1-2: Floating intro
            { note: 'E5', start: 0, dur: 2 },
            { note: 'G5', start: 2, dur: 1 },
            { note: 'A5', start: 3.5, dur: 0.5 },
            // Bar 3-4
            { note: 'G5', start: 4, dur: 1.5 },
            { note: 'E5', start: 6, dur: 2 },
            // Bar 5-6: Higher floating
            { note: 'A5', start: 8, dur: 1 },
            { note: 'G5', start: 9, dur: 1 },
            { note: 'E5', start: 10, dur: 1 },
            { note: 'D5', start: 11.5, dur: 0.5 },
            // Bar 7-8
            { note: 'E5', start: 12, dur: 2 },
            { note: 'G5', start: 14, dur: 1 },
            { note: 'E5', start: 15.5, dur: 0.5 },
        ];

        // Airy pad notes - very long, background texture
        const pad = [
            { note: 'C4', start: 0, dur: 8 },
            { note: 'G4', start: 0, dur: 8 },
            { note: 'E4', start: 8, dur: 8 },
            { note: 'A4', start: 8, dur: 8 },
        ];

        // Square synth bass - 808 style sub bass
        const bass = [
            // Bar 1-2
            { note: 'C2', start: 0, dur: 0.5 },
            { note: 'C2', start: 1.5, dur: 0.25 },
            { note: 'C2', start: 2, dur: 0.5 },
            { note: 'G2', start: 3.5, dur: 0.25 },
            // Bar 3-4
            { note: 'A2', start: 4, dur: 0.5 },
            { note: 'A2', start: 5.5, dur: 0.25 },
            { note: 'G2', start: 6, dur: 0.5 },
            { note: 'E2', start: 7, dur: 0.5 },
            // Bar 5-6
            { note: 'C2', start: 8, dur: 0.5 },
            { note: 'C2', start: 9.5, dur: 0.25 },
            { note: 'E2', start: 10, dur: 0.5 },
            { note: 'G2', start: 11.5, dur: 0.25 },
            // Bar 7-8
            { note: 'A2', start: 12, dur: 0.5 },
            { note: 'G2', start: 13.5, dur: 0.25 },
            { note: 'E2', start: 14, dur: 0.5 },
            { note: 'C2', start: 15.5, dur: 0.25 },
        ];

        // 808 trap drum pattern - kicks, snares, hi-hat rolls
        const drums = [
            // Bar 1
            { type: '808kick', start: 0 },
            { type: 'hat', start: 0.25 },
            { type: 'hat', start: 0.5 },
            { type: 'hat', start: 0.75 },
            { type: '808snare', start: 1 },
            { type: 'hat', start: 1.25 },
            { type: 'hat', start: 1.5 },
            { type: 'hat', start: 1.75 },
            // Bar 2
            { type: '808kick', start: 2 },
            { type: 'hat', start: 2.25 },
            { type: 'hat', start: 2.5 },
            { type: '808kick', start: 2.75 },
            { type: '808snare', start: 3 },
            // Hi-hat roll
            { type: 'hat', start: 3.25 },
            { type: 'hat', start: 3.375 },
            { type: 'hat', start: 3.5 },
            { type: 'hat', start: 3.625 },
            { type: 'hat', start: 3.75 },
            { type: 'hat', start: 3.875 },
        ];

        const loopLength = 16 * beatTime; // 16 beats

        const scheduleMusic = () => {
            if (!this.musicPlaying) return;

            const now = this.ctx.currentTime;

            // Schedule airy melody with delay effect
            melody.forEach(n => {
                this.playSpaceMelody(notes[n.note], now + n.start * beatTime, n.dur * beatTime);
            });

            // Schedule background pad
            pad.forEach(n => {
                this.playPad(notes[n.note], now + n.start * beatTime, n.dur * beatTime);
            });

            // Schedule 808 bass
            bass.forEach(n => {
                this.play808Bass(notes[n.note], now + n.start * beatTime, n.dur * beatTime);
            });

            // Schedule trap drums (loop 4 times for 16 beats)
            for (let i = 0; i < 4; i++) {
                drums.forEach(d => {
                    this.playTrapDrum(d.type, now + (d.start + i * 4) * beatTime);
                });
            }

            // Schedule next loop
            setTimeout(() => scheduleMusic(), (loopLength - 0.1) * 1000);
        };

        scheduleMusic();
    },

    // Airy space melody with delay
    playSpaceMelody(freq, startTime, duration) {
        if (!this.ctx) return;

        // Main note
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        // Soft attack, long release
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
        gain.gain.setValueAtTime(0.12, startTime + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + duration + 0.3);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.3);

        // Delay echo
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = freq;
        osc2.connect(gain2);
        gain2.connect(this.musicGain);

        const delayTime = 0.3;
        gain2.gain.setValueAtTime(0, startTime + delayTime);
        gain2.gain.linearRampToValueAtTime(0.06, startTime + delayTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0, startTime + delayTime + duration * 0.5);

        osc2.start(startTime + delayTime);
        osc2.stop(startTime + delayTime + duration * 0.5);
    },

    // Background pad
    playPad(freq, startTime, duration) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.musicGain);

        // Very soft, slow attack/release
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 1);
        gain.gain.setValueAtTime(0.04, startTime + duration - 1);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    },

    // 808 sub bass
    play808Bass(freq, startTime, duration) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.musicGain);

        // Punchy attack, quick decay
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    },

    // 808 trap drums
    playTrapDrum(type, startTime) {
        if (!this.ctx) return;

        if (type === '808kick') {
            // Deep 808 kick with pitch drop
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(this.musicGain);

            // Pitch drops from 150 to 40
            osc.frequency.setValueAtTime(150, startTime);
            osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);

            // Long tail
            gain.gain.setValueAtTime(0.5, startTime);
            gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);

        } else if (type === '808snare') {
            // Punchy snare with noise tail
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = 180;
            osc.connect(oscGain);
            oscGain.connect(this.musicGain);

            oscGain.gain.setValueAtTime(0.3, startTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);

            // Noise component
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            const noiseGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            noise.buffer = buffer;
            filter.type = 'highpass';
            filter.frequency.value = 2000;

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.musicGain);

            noiseGain.gain.setValueAtTime(0.25, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            noise.start(startTime);
            noise.stop(startTime + 0.2);

        } else if (type === 'hat') {
            // Crisp hi-hat
            const bufferSize = this.ctx.sampleRate * 0.05;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            noise.buffer = buffer;
            filter.type = 'highpass';
            filter.frequency.value = 7000;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

            noise.start(startTime);
            noise.stop(startTime + 0.05);
        }
    },

    stopMusic() {
        this.musicPlaying = false;
    },

    setMusicVolume(vol) {
        if (this.musicGain) this.musicGain.gain.value = vol;
    },

    setSfxVolume(vol) {
        if (this.sfxGain) this.sfxGain.gain.value = vol;
    }
};

// Initialize audio on first user interaction (music starts from title screen)
document.addEventListener('click', () => {
    if (!Audio8Bit.ctx) {
        Audio8Bit.init();
    } else {
        Audio8Bit.resume();
    }
}, { once: true });

document.addEventListener('keydown', () => {
    if (!Audio8Bit.ctx) {
        Audio8Bit.init();
    } else {
        Audio8Bit.resume();
    }
}, { once: true });

// ============================================
// LEVEL DATA - Just Level 1 for now
// ============================================

const LevelTemplates = {
    realWorld: {
        // 20x20 grids
        1: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,4,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        2: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,4,0,1],
            [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        3: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,0,0,1],
            [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
            [1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ]
    },
    dreamWorld: {
        // 12 rows tall, longer horizontally
        1: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,4,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        2: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        3: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ]
    },
    // Enemy spawn positions per level - updated for 20x20 grid
    // Types: 'patrol' (back and forth), 'chase' (follows player UDLR)
    enemies: {
        real: {
            1: [
                { x: 6, y: 6, type: 'patrol', patrol: 'horizontal', range: 3, speed: 0.8 },
                { x: 10, y: 10, type: 'patrol', patrol: 'vertical', range: 3, speed: 0.8 }
            ],
            2: [
                { x: 10, y: 10, type: 'chase', speed: 0.4 },
                { x: 14, y: 4, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.0 },
                { x: 4, y: 12, type: 'patrol', patrol: 'vertical', range: 3, speed: 1.0 }
            ],
            3: [
                { x: 10, y: 8, type: 'chase', speed: 0.5 },
                { x: 12, y: 12, type: 'chase', speed: 0.4 },
                { x: 4, y: 4, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 },
                { x: 14, y: 14, type: 'patrol', patrol: 'vertical', range: 4, speed: 1.2 }
            ]
        },
        dream: {
            1: [
                { x: 20, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 },
                { x: 40, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 }
            ],
            2: [
                { x: 15, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.4 },
                { x: 35, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 },
                { x: 55, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.6 }
            ],
            3: [
                { x: 12, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.6 },
                { x: 28, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.4 },
                { x: 45, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.8 },
                { x: 62, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.6 }
            ]
        }
    }
};

// ============================================
// LEVELS
// ============================================

const Levels = {
    current: 1,
    maxLevel: 3,
    realWorld: null,
    dreamWorld: null,

    loadLevel(num) {
        this.current = num;
        this.realWorld = JSON.parse(JSON.stringify(LevelTemplates.realWorld[num]));
        this.dreamWorld = JSON.parse(JSON.stringify(LevelTemplates.dreamWorld[num]));
    },

    getReal() { return this.realWorld; },
    getDream() { return this.dreamWorld; },

    nextLevel() {
        if (this.current < this.maxLevel) {
            this.loadLevel(this.current + 1);
            return true;
        }
        return false; // No more levels - game complete
    },

    reset() { this.loadLevel(1); }
};

// ============================================
// GAME STATE
// ============================================

const GameState = {
    screenState: 'title', // 'title', 'playing', 'paused'
    currentWorld: 'real',
    inventory: [],
    keysPressed: {},
    portalCooldown: 0,
    cameraX: 0,
    nearDoor: null,
    health: 3,
    maxHealth: 3,
    invincible: 0, // Invincibility frames after hit
    projectiles: [],
    enemies: [],
    gameComplete: false,
    // New v1.3 systems
    score: 0,
    killedEnemies: { real: {}, dream: {} }, // Track killed enemies by level: { 1: [0, 2], 2: [1] } = indices
    drops: [], // Item drops on the ground
    dreamEssence: 0, // Collected from Dream World, powers Real World abilities
    realEnergy: 0,   // Collected from Real World, powers Dream World abilities
    usableItems: [], // Consumable items: health potions, power boosts, etc.
    powerBoostTimer: 0, // Active power boost countdown
    shieldTimer: 0      // Active shield countdown
};

// ============================================
// INPUT HANDLING
// ============================================

const KeyState = {
    justPressed: {},
    pressTime: {},      // When key was first pressed
    movedOnce: {},      // Track if we did the initial tap move
    continuousMove: {}  // Track if continuous movement is active
};

const HOLD_THRESHOLD = 100; // ms before continuous movement activates

document.addEventListener('keydown', (e) => {
    // Handle title screen input
    if (GameState.screenState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
            GameState.screenState = 'playing';
            Audio8Bit.init();
            Audio8Bit.startMusic();
            e.preventDefault();
        }
        return;
    }

    // Handle pause menu input
    if (GameState.screenState === 'paused') {
        if (e.code === 'Escape') {
            GameState.screenState = 'playing';
        } else if (e.code === 'ArrowUp') {
            GameState.pauseSelection = (GameState.pauseSelection - 1 + 3) % 3;
            Audio8Bit.playPickup();
        } else if (e.code === 'ArrowDown') {
            GameState.pauseSelection = (GameState.pauseSelection + 1) % 3;
            Audio8Bit.playPickup();
        } else if (e.code === 'Enter' || e.code === 'Space') {
            handlePauseSelection();
        }
        e.preventDefault();
        return;
    }

    // Toggle pause during gameplay
    if (e.code === 'Escape' && GameState.screenState === 'playing') {
        GameState.screenState = 'paused';
        GameState.pauseSelection = 0;
        e.preventDefault();
        return;
    }

    // Normal gameplay input
    if (!GameState.keysPressed[e.code]) {
        KeyState.justPressed[e.code] = true;
        KeyState.pressTime[e.code] = Date.now();
        KeyState.movedOnce[e.code] = false;
        KeyState.continuousMove[e.code] = false;
    }
    GameState.keysPressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'KeyC', 'Digit1', 'Digit2', 'Digit3', 'KeyZ', 'Escape'].includes(e.code)) {
        e.preventDefault();
    }
});

function handlePauseSelection() {
    switch (GameState.pauseSelection) {
        case 0: // Resume
            GameState.screenState = 'playing';
            break;
        case 1: // Restart
            restartGame();
            GameState.screenState = 'playing';
            break;
        case 2: // Title screen
            restartGame();
            GameState.screenState = 'title';
            Audio8Bit.stopMusic();
            break;
    }
}

function restartGame() {
    Levels.loadLevel(1);
    Player.init();
    GameState.health = 3;
    GameState.score = 0;
    GameState.inventory = [];
    GameState.usableItems = [];
    GameState.dreamEssence = 0;
    GameState.realEnergy = 0;
    GameState.projectiles = [];
    GameState.drops = [];
    GameState.killedEnemies = { real: {}, dream: {} };
    GameState.gameComplete = false;
    GameState.powerBoostTimer = 0;
    GameState.shieldTimer = 0;
    spawnEnemies();
    updateUI();
}

document.addEventListener('keyup', (e) => {
    GameState.keysPressed[e.code] = false;
    KeyState.justPressed[e.code] = false;
    KeyState.pressTime[e.code] = 0;
    KeyState.movedOnce[e.code] = false;
    KeyState.continuousMove[e.code] = false;
});

// Check if key allows movement (either first tap or continuous after hold)
function canMoveWithKey(code) {
    if (!GameState.keysPressed[code]) return false;

    const holdTime = Date.now() - (KeyState.pressTime[code] || 0);

    // If we haven't moved once yet, allow the tap move
    if (!KeyState.movedOnce[code]) {
        return true;
    }

    // If held long enough, enable continuous movement
    if (holdTime >= HOLD_THRESHOLD) {
        KeyState.continuousMove[code] = true;
    }

    return KeyState.continuousMove[code];
}

// Mark that we did the initial tap move for this key
function markKeyMoved(code) {
    KeyState.movedOnce[code] = true;
}

function consumeKeyPress(code) {
    if (KeyState.justPressed[code]) {
        KeyState.justPressed[code] = false;
        return true;
    }
    return false;
}

// ============================================
// PLAYER
// ============================================

const Player = {
    x: 28,
    y: 28,
    width: 24,
    height: 24,
    gridX: 2,
    gridY: 2,
    isMoving: false,
    moveProgress: 0,
    moveSpeed: 0.08,
    startX: 0,
    startY: 0,
    targetGridX: 0,
    targetGridY: 0,
    isJumping: false,
    isFalling: false,
    jumpPhase: 0,
    fallSpeed: 0,
    facing: 1,
    facingY: 1, // For top-down shooting direction
    animFrame: 0,
    animTimer: 0,
    shootCooldown: 0,
    meleeCooldown: 0,
    meleeActive: 0,      // Frames melee hitbox is active
    chargeTime: 0,       // How long X has been held
    isCharging: false,

    init() {
        this.gridX = 2;
        this.gridY = 2;
        this.x = this.gridX * TILE_SIZE + 2;
        this.y = this.gridY * TILE_SIZE + 2;
        this.isMoving = false;
        this.isJumping = false;
        this.isFalling = false;
        this.jumpPhase = 0;
        this.fallSpeed = 0;
        this.shootCooldown = 0;
        this.meleeCooldown = 0;
        this.meleeActive = 0;
        this.chargeTime = 0;
        this.isCharging = false;
    },

    update() {
        if (GameState.portalCooldown > 0) GameState.portalCooldown--;
        if (GameState.invincible > 0) GameState.invincible--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.meleeCooldown > 0) this.meleeCooldown--;
        if (this.meleeActive > 0) this.meleeActive--;
        if (GameState.powerBoostTimer > 0) GameState.powerBoostTimer--;
        if (GameState.shieldTimer > 0) GameState.shieldTimer--;

        if (GameState.currentWorld === 'real') {
            this.updateTopDown();
        } else {
            this.updateSideScroller();
            this.updateCamera();
        }

        // Charged shooting - hold X key
        if (GameState.keysPressed['KeyX']) {
            this.chargeTime++;
            if (this.chargeTime >= 10) { // Start showing charge after 10 frames
                this.isCharging = true;
            }
        } else if (this.chargeTime > 0) {
            // Released X - fire based on charge level
            if (this.shootCooldown <= 0) {
                const charged = this.chargeTime >= 45; // ~0.75 seconds for full charge
                this.shoot(charged);
            }
            this.chargeTime = 0;
            this.isCharging = false;
        }

        // Melee attack - C key
        if (consumeKeyPress('KeyC') && this.meleeCooldown <= 0) {
            this.melee();
        }

        // Check melee hits
        if (this.meleeActive > 0) {
            this.checkMeleeHits();
        }

        // Use items - 1, 2, 3 keys
        if (consumeKeyPress('Digit1')) useItem(0);
        if (consumeKeyPress('Digit2')) useItem(1);
        if (consumeKeyPress('Digit3')) useItem(2);

        // Use essence/energy power - Z key
        if (consumeKeyPress('KeyZ')) useWorldPower();

        // Animation
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    },

    shoot(charged = false) {
        // Faster shooting with power boost
        this.shootCooldown = GameState.powerBoostTimer > 0 ? 10 : 20;

        let vx = 0, vy = 0;
        if (GameState.currentWorld === 'real') {
            // Shoot in last moved direction
            if (this.facingY === -1) vy = -1;
            else if (this.facingY === 1) vy = 1;
            else if (this.facing === -1) vx = -1;
            else vx = 1;
            // Default to right if no direction
            if (vx === 0 && vy === 0) vx = 1;
        } else {
            // Side scroller - shoot horizontally
            vx = this.facing;
        }

        // Faster projectiles with power boost, even faster when charged
        let speed = GameState.powerBoostTimer > 0 ? 12 : 8;
        if (charged) speed = 14;

        GameState.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: vx * speed,
            vy: vy * speed,
            isFireball: GameState.currentWorld === 'dream',
            life: charged ? 90 : 60,
            powered: GameState.powerBoostTimer > 0,
            charged: charged // Big charged shot
        });

        // Play laser sound
        Audio8Bit.playLaser(GameState.currentWorld === 'dream');
    },

    melee() {
        this.meleeCooldown = 25; // Can attack every ~0.4 seconds
        this.meleeActive = 10;   // Hitbox active for ~0.17 seconds
        Audio8Bit.playMelee();
    },

    getMeleeRect() {
        // Melee hitbox in front of player
        const meleeRange = 20;
        const meleeWidth = 18;
        const meleeHeight = 20;

        if (GameState.currentWorld === 'real') {
            // Top-down: attack in facing direction
            if (this.facingY === -1) {
                return { x: this.x + 2, y: this.y - meleeRange, width: meleeWidth, height: meleeRange };
            } else if (this.facingY === 1) {
                return { x: this.x + 2, y: this.y + this.height, width: meleeWidth, height: meleeRange };
            } else if (this.facing === -1) {
                return { x: this.x - meleeRange, y: this.y + 2, width: meleeRange, height: meleeHeight };
            } else {
                return { x: this.x + this.width, y: this.y + 2, width: meleeRange, height: meleeHeight };
            }
        } else {
            // Side scroller: attack left or right
            if (this.facing === -1) {
                return { x: this.x - meleeRange, y: this.y, width: meleeRange, height: this.height };
            } else {
                return { x: this.x + this.width, y: this.y, width: meleeRange, height: this.height };
            }
        }
    },

    checkMeleeHits() {
        const meleeRect = this.getMeleeRect();
        const worldKey = GameState.currentWorld === 'real' ? 'real' : 'dream';

        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            if (enemy.world !== GameState.currentWorld) continue;
            if (enemy.meleeHit) continue; // Already hit by this swing

            const enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

            if (rectsOverlap(meleeRect, enemyRect)) {
                // Mark as hit so we don't hit again this swing
                enemy.meleeHit = true;

                // Track kill
                if (!GameState.killedEnemies[worldKey][Levels.current]) {
                    GameState.killedEnemies[worldKey][Levels.current] = [];
                }
                if (!GameState.killedEnemies[worldKey][Levels.current].includes(enemy.templateIndex)) {
                    GameState.killedEnemies[worldKey][Levels.current].push(enemy.templateIndex);
                }

                // Award points (melee bonus!)
                const points = (enemy.type === 'chase' ? 150 : 100) + 50;
                GameState.score += points;

                // Spawn drop
                spawnDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type);

                GameState.enemies.splice(i, 1);
                Audio8Bit.playHit();
                updateUI();
            }
        }
    },

    updateTopDown() {
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            if (this.moveProgress >= 1) {
                this.finishMove();
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 2 - this.startX) * this.moveProgress;
                this.y = this.startY + (this.targetGridY * TILE_SIZE + 2 - this.startY) * this.moveProgress;
            }
        } else {
            let dx = 0, dy = 0;
            let moveKey = null;

            // Check each direction with tap/hold logic
            if (canMoveWithKey('ArrowUp') || canMoveWithKey('KeyW')) {
                dy = -1; this.facingY = -1;
                moveKey = GameState.keysPressed['ArrowUp'] ? 'ArrowUp' : 'KeyW';
            } else if (canMoveWithKey('ArrowDown') || canMoveWithKey('KeyS')) {
                dy = 1; this.facingY = 1;
                moveKey = GameState.keysPressed['ArrowDown'] ? 'ArrowDown' : 'KeyS';
            } else if (canMoveWithKey('ArrowLeft') || canMoveWithKey('KeyA')) {
                dx = -1; this.facing = -1; this.facingY = 0;
                moveKey = GameState.keysPressed['ArrowLeft'] ? 'ArrowLeft' : 'KeyA';
            } else if (canMoveWithKey('ArrowRight') || canMoveWithKey('KeyD')) {
                dx = 1; this.facing = 1; this.facingY = 0;
                moveKey = GameState.keysPressed['ArrowRight'] ? 'ArrowRight' : 'KeyD';
            }

            if ((dx !== 0 || dy !== 0) && moveKey) {
                if (this.tryMove(dx, dy, Levels.getReal())) {
                    markKeyMoved(moveKey);
                }
            }
        }
    },

    updateSideScroller() {
        const tiles = Levels.getDream();

        // Jumping
        if (this.isJumping) {
            this.jumpPhase += 0.025;

            // Horizontal movement during jump
            this.handleAirMovement(tiles);

            if (this.jumpPhase >= 1) {
                this.isJumping = false;
                this.jumpPhase = 0;
                this.gridY = this.targetGridY;
                this.y = this.gridY * TILE_SIZE + 2;
                this.checkFalling(tiles);
            } else {
                const jumpHeight = 2.5 * TILE_SIZE;
                const arcHeight = jumpHeight * Math.sin(this.jumpPhase * Math.PI);
                const startY = this.startY;
                const endY = this.targetGridY * TILE_SIZE + 2;
                this.y = startY + (endY - startY) * this.jumpPhase - arcHeight;
            }
            return;
        }

        // Falling
        if (this.isFalling) {
            this.fallSpeed += 0.008;
            this.y += this.fallSpeed * TILE_SIZE;

            this.handleAirMovement(tiles);

            // Check landing
            const feetTileY = Math.floor((this.y + this.height) / TILE_SIZE);
            if (feetTileY < tiles.length && this.isSolid(this.gridX, feetTileY, tiles)) {
                this.gridY = feetTileY - 1;
                this.y = this.gridY * TILE_SIZE + 2;
                this.isFalling = false;
                this.fallSpeed = 0;
            } else if (feetTileY >= tiles.length) {
                this.respawnInDreamWorld();
            } else {
                this.gridY = Math.floor(this.y / TILE_SIZE);
            }
            return;
        }

        // Ground movement
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            if (this.moveProgress >= 1) {
                this.gridX = this.targetGridX;
                this.x = this.gridX * TILE_SIZE + 2;
                this.isMoving = false;
                this.moveProgress = 0;
                this.checkFalling(tiles);
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 2 - this.startX) * this.moveProgress;
            }
            return;
        }

        // Check if we should fall
        if (!this.isSolid(this.gridX, this.gridY + 1, tiles)) {
            this.isFalling = true;
            this.fallSpeed = 0.02;
            return;
        }

        // Input with tap/hold logic
        let moveKey = null;
        if (canMoveWithKey('ArrowLeft') || canMoveWithKey('KeyA')) {
            this.facing = -1;
            moveKey = GameState.keysPressed['ArrowLeft'] ? 'ArrowLeft' : 'KeyA';
            if (this.tryMoveSide(-1, tiles)) {
                markKeyMoved(moveKey);
            }
        } else if (canMoveWithKey('ArrowRight') || canMoveWithKey('KeyD')) {
            this.facing = 1;
            moveKey = GameState.keysPressed['ArrowRight'] ? 'ArrowRight' : 'KeyD';
            if (this.tryMoveSide(1, tiles)) {
                markKeyMoved(moveKey);
            }
        }

        if (consumeKeyPress('Space') || consumeKeyPress('ArrowUp') || consumeKeyPress('KeyW')) {
            this.tryJump(tiles);
        }
    },

    handleAirMovement(tiles) {
        if (!this.isMoving) {
            if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
                this.facing = -1;
                this.tryMoveSideAir(-1, tiles);
            } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
                this.facing = 1;
                this.tryMoveSideAir(1, tiles);
            }
        }

        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            if (this.moveProgress >= 1) {
                this.gridX = this.targetGridX;
                this.x = this.gridX * TILE_SIZE + 2;
                this.isMoving = false;
                this.moveProgress = 0;
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 2 - this.startX) * this.moveProgress;
            }
        }
    },

    isSolid(x, y, tiles) {
        if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return false;
        const tile = tiles[y][x];
        return tile === 1 || tile === 6;
    },

    checkFalling(tiles) {
        if (!this.isFalling && !this.isJumping && !this.isSolid(this.gridX, this.gridY + 1, tiles)) {
            this.isFalling = true;
            this.fallSpeed = 0.02;
        }
    },

    tryMove(dx, dy, tiles) {
        const newX = this.gridX + dx;
        const newY = this.gridY + dy;
        if (newY < 0 || newY >= tiles.length || newX < 0 || newX >= tiles[0].length) return false;
        const tile = tiles[newY][newX];
        if (tile !== 1 && tile !== 3) {
            this.startX = this.x;
            this.startY = this.y;
            this.targetGridX = newX;
            this.targetGridY = newY;
            this.isMoving = true;
            this.moveProgress = 0;
            return true;
        }
        return false;
    },

    tryMoveSide(dx, tiles) {
        const newX = this.gridX + dx;
        if (newX < 0 || newX >= tiles[0].length) return false;

        // Check collision at current Y position
        const tile = tiles[this.gridY][newX];
        if (tile === 1 || tile === 3) return false; // Blocked by wall or locked door

        this.startX = this.x;
        this.targetGridX = newX;
        this.isMoving = true;
        this.moveProgress = 0;
        return true;
    },

    tryMoveSideAir(dx, tiles) {
        const newX = this.gridX + dx;
        if (newX < 0 || newX >= tiles[0].length) return;

        // Check collision at current grid Y
        const checkY = Math.max(0, Math.min(tiles.length - 1, this.gridY));
        if (tiles[checkY][newX] === 1) return;

        this.startX = this.x;
        this.targetGridX = newX;
        this.isMoving = true;
        this.moveProgress = 0;
    },

    tryJump(tiles) {
        if (this.isJumping || this.isFalling) return;
        if (!this.isSolid(this.gridX, this.gridY + 1, tiles)) return;

        let targetY = Math.max(0, this.gridY - 2);

        // Check ceiling
        for (let y = this.gridY - 1; y >= targetY; y--) {
            if (y >= 0 && tiles[y] && tiles[y][this.gridX] === 1) {
                targetY = y + 1;
                break;
            }
        }

        if (targetY < this.gridY) {
            this.isJumping = true;
            this.jumpPhase = 0;
            this.startY = this.y;
            this.targetGridY = targetY;
        }
    },

    finishMove() {
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.x = this.gridX * TILE_SIZE + 2;
        this.y = this.gridY * TILE_SIZE + 2;
        this.isMoving = false;
        this.moveProgress = 0;
    },

    updateCamera() {
        const tiles = Levels.getDream();
        const mapWidth = tiles[0].length * TILE_SIZE;
        const targetCameraX = this.x - GAME_WIDTH / 3;
        const maxCameraX = Math.max(0, mapWidth - GAME_WIDTH);
        GameState.cameraX += (targetCameraX - GameState.cameraX) * 0.08;
        GameState.cameraX = Math.max(0, Math.min(maxCameraX, GameState.cameraX));
    },

    respawnInDreamWorld() {
        this.gridX = 1;
        this.gridY = 1;
        this.x = this.gridX * TILE_SIZE + 2;
        this.y = this.gridY * TILE_SIZE + 2;
        this.isJumping = false;
        this.isFalling = false;
        this.isMoving = false;
        this.fallSpeed = 0;
        GameState.cameraX = 0;
    },

    takeDamage() {
        if (GameState.invincible > 0) return;

        // Shield blocks damage
        if (GameState.shieldTimer > 0) {
            GameState.shieldTimer = 0; // Shield breaks after one hit
            GameState.invincible = 30;
            updateUI();
            return;
        }

        GameState.health--;
        GameState.invincible = 60; // 1 second invincibility
        Audio8Bit.playDamage();
        if (GameState.health <= 0) {
            // Reset level (but keep killed enemies tracked)
            GameState.health = GameState.maxHealth;
            GameState.inventory = [];
            GameState.drops = [];
            Levels.loadLevel(Levels.current);
            spawnEnemies();
            this.init();
            GameState.cameraX = 0;
        }
        updateUI();
    },

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        let yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
        let cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;

        const drawX = this.x - cameraOffset;
        const drawY = this.y + yOffset;

        if (drawX < -this.width || drawX > GAME_WIDTH) return;

        // Flash when invincible
        if (GameState.invincible > 0 && Math.floor(GameState.invincible / 4) % 2 === 0) return;

        const isReal = GameState.currentWorld === 'real';
        const bodyColor = isReal ? '#4488ff' : '#ff6688';
        const shoeColor = '#aa2222';
        const skinColor = '#ffcc99';

        ctx.save();
        if (!isReal && this.facing === -1) {
            ctx.translate(drawX + this.width, drawY);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(drawX, drawY);
        }

        const isAnimating = this.isMoving || this.isJumping;
        const bounce = isAnimating ? Math.sin(this.animTimer * 0.4) * 1.5 : 0;
        const legOffset = isAnimating ? (this.animFrame % 2 === 0 ? 2 : -2) : 0;

        // Legs (scaled for 24px sprite)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(3, 15 + bounce, 7, 7);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(1 - legOffset, 20 + bounce, 8, 4);
        ctx.fillStyle = bodyColor;
        ctx.fillRect(14, 15 + bounce, 7, 7);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(14 + legOffset, 20 + bounce, 8, 4);

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(3, 7 + bounce, 18, 10);

        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(12, 5 + bounce, 7, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = isReal ? '#2255aa' : '#cc3355';
        ctx.beginPath();
        ctx.moveTo(5, 2 + bounce);
        ctx.lineTo(8, -3 + bounce);
        ctx.lineTo(12, 2 + bounce);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, 0 + bounce);
        ctx.lineTo(17, -5 + bounce);
        ctx.lineTo(17, 4 + bounce);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(8, 3 + bounce, 3, 4);
        ctx.fillRect(13, 3 + bounce, 3, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 4 + bounce, 2, 3);
        ctx.fillRect(15, 4 + bounce, 2, 3);

        ctx.restore();

        // Draw charge indicator
        if (this.isCharging) {
            const chargeLevel = Math.min(this.chargeTime / 45, 1);
            const chargeRadius = 16 + chargeLevel * 8;

            ctx.strokeStyle = chargeLevel >= 1 ? '#ffff00' : '#88aaff';
            ctx.lineWidth = 2 + chargeLevel * 2;
            ctx.globalAlpha = 0.5 + chargeLevel * 0.3;
            ctx.beginPath();
            ctx.arc(drawX + this.width / 2, drawY + this.height / 2, chargeRadius, 0, Math.PI * 2 * chargeLevel);
            ctx.stroke();

            // Sparkles when fully charged
            if (chargeLevel >= 1) {
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 4; i++) {
                    const angle = Date.now() * 0.01 + i * Math.PI / 2;
                    const sx = drawX + this.width / 2 + Math.cos(angle) * chargeRadius;
                    const sy = drawY + this.height / 2 + Math.sin(angle) * chargeRadius;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
        }

        // Draw melee swing
        if (this.meleeActive > 0) {
            const swingProgress = 1 - (this.meleeActive / 10);
            ctx.strokeStyle = isReal ? '#88ccff' : '#ffaa88';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8 - swingProgress * 0.6;

            const meleeRect = this.getMeleeRect();
            const mx = meleeRect.x - cameraOffset;
            const my = meleeRect.y + yOffset;

            // Draw arc/slash
            ctx.beginPath();
            if (isReal) {
                // Top-down slash
                if (this.facingY === -1) {
                    ctx.arc(drawX + this.width / 2, drawY, 18, Math.PI + swingProgress * 0.5, Math.PI * 2 - swingProgress * 0.5);
                } else if (this.facingY === 1) {
                    ctx.arc(drawX + this.width / 2, drawY + this.height, 18, swingProgress * 0.5, Math.PI - swingProgress * 0.5);
                } else if (this.facing === -1) {
                    ctx.arc(drawX, drawY + this.height / 2, 18, Math.PI / 2 + swingProgress * 0.5, Math.PI * 1.5 - swingProgress * 0.5);
                } else {
                    ctx.arc(drawX + this.width, drawY + this.height / 2, 18, -Math.PI / 2 + swingProgress * 0.5, Math.PI / 2 - swingProgress * 0.5);
                }
            } else {
                // Side scroller slash
                if (this.facing === -1) {
                    ctx.arc(drawX, drawY + this.height / 2, 18, Math.PI / 2 + swingProgress * 0.5, Math.PI * 1.5 - swingProgress * 0.5);
                } else {
                    ctx.arc(drawX + this.width, drawY + this.height / 2, 18, -Math.PI / 2 + swingProgress * 0.5, Math.PI / 2 - swingProgress * 0.5);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
};

// ============================================
// ENEMIES
// ============================================

function spawnEnemies() {
    GameState.enemies = [];
    const world = GameState.currentWorld;
    const worldKey = world === 'real' ? 'real' : 'dream';
    const enemyData = LevelTemplates.enemies[worldKey][Levels.current];

    // Initialize killed enemies tracker for this level if needed
    if (!GameState.killedEnemies[worldKey][Levels.current]) {
        GameState.killedEnemies[worldKey][Levels.current] = [];
    }

    const killedIndices = GameState.killedEnemies[worldKey][Levels.current];

    if (enemyData) {
        enemyData.forEach((e, index) => {
            // Skip if this enemy was already killed
            if (killedIndices.includes(index)) return;

            GameState.enemies.push({
                x: e.x * TILE_SIZE + 2,
                y: e.y * TILE_SIZE + 2,
                startX: e.x * TILE_SIZE + 2,
                startY: e.y * TILE_SIZE + 2,
                width: 22,
                height: 22,
                type: e.type || 'patrol',
                patrol: e.patrol || 'horizontal',
                range: (e.range || 2) * TILE_SIZE,
                speed: e.speed || 1.0,
                direction: 1,
                chaseAxis: 'x', // For chase enemies: which axis to move on
                world: world,
                templateIndex: index // Track which template enemy this is
            });
        });
    }
}

function updateEnemies() {
    const tiles = GameState.currentWorld === 'real' ? Levels.getReal() : Levels.getDream();

    GameState.enemies.forEach(enemy => {
        if (enemy.world !== GameState.currentWorld) return;

        // Calculate next position based on enemy type
        let nextX = enemy.x;
        let nextY = enemy.y;

        if (enemy.type === 'chase') {
            // Chase enemy - moves toward player UDLR only (no diagonal)
            const dx = Player.x - enemy.x;
            const dy = Player.y - enemy.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx > 5 || absDy > 5) { // Only move if not already on player
                // Move on one axis at a time - pick the one with greater distance
                // Alternate axis when blocked to prevent getting stuck
                if (enemy.chaseAxis === 'x' && absDx > 5) {
                    nextX = enemy.x + Math.sign(dx) * enemy.speed;
                } else if (absDy > 5) {
                    nextY = enemy.y + Math.sign(dy) * enemy.speed;
                    enemy.chaseAxis = 'y';
                } else if (absDx > 5) {
                    nextX = enemy.x + Math.sign(dx) * enemy.speed;
                    enemy.chaseAxis = 'x';
                }
            }
        } else if (enemy.patrol === 'horizontal') {
            nextX = enemy.x + enemy.speed * enemy.direction;
        } else if (enemy.patrol === 'vertical') {
            nextY = enemy.y + enemy.speed * enemy.direction;
        }

        // Check wall collision at next position
        const leftTile = Math.floor(nextX / TILE_SIZE);
        const rightTile = Math.floor((nextX + enemy.width) / TILE_SIZE);
        const topTile = Math.floor(nextY / TILE_SIZE);
        const bottomTile = Math.floor((nextY + enemy.height) / TILE_SIZE);

        let blockedX = false;
        let blockedY = false;

        // Check X movement
        for (let ty = Math.floor(enemy.y / TILE_SIZE); ty <= Math.floor((enemy.y + enemy.height) / TILE_SIZE) && !blockedX; ty++) {
            for (let tx = leftTile; tx <= rightTile && !blockedX; tx++) {
                if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
                    const tile = tiles[ty][tx];
                    if (tile === 1 || tile === 3 || tile === 6) blockedX = true;
                } else {
                    blockedX = true;
                }
            }
        }

        // Check Y movement
        for (let ty = topTile; ty <= bottomTile && !blockedY; ty++) {
            for (let tx = Math.floor(enemy.x / TILE_SIZE); tx <= Math.floor((enemy.x + enemy.width) / TILE_SIZE) && !blockedY; tx++) {
                if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
                    const tile = tiles[ty][tx];
                    if (tile === 1 || tile === 3 || tile === 6) blockedY = true;
                } else {
                    blockedY = true;
                }
            }
        }

        if (enemy.type === 'chase') {
            // Chase enemies move UDLR only - switch axis when blocked
            if (nextX !== enemy.x) {
                if (!blockedX) {
                    enemy.x = nextX;
                } else {
                    enemy.chaseAxis = 'y'; // Switch to Y axis if X blocked
                }
            }
            if (nextY !== enemy.y) {
                if (!blockedY) {
                    enemy.y = nextY;
                } else {
                    enemy.chaseAxis = 'x'; // Switch to X axis if Y blocked
                }
            }
        } else {
            // Patrol enemies reverse direction on collision
            const blocked = (enemy.patrol === 'horizontal') ? blockedX : blockedY;
            if (blocked) {
                enemy.direction *= -1;
            } else {
                if (enemy.patrol === 'horizontal') {
                    if (nextX > enemy.startX + enemy.range || nextX < enemy.startX - enemy.range) {
                        enemy.direction *= -1;
                    } else {
                        enemy.x = nextX;
                    }
                } else if (enemy.patrol === 'vertical') {
                    if (nextY > enemy.startY + enemy.range || nextY < enemy.startY - enemy.range) {
                        enemy.direction *= -1;
                    } else {
                        enemy.y = nextY;
                    }
                }
            }
        }

        // Check collision with player
        const playerRect = Player.getRect();
        const enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        if (rectsOverlap(playerRect, enemyRect)) {
            Player.takeDamage();
        }
    });
}

function drawEnemies() {
    const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
    const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;

    GameState.enemies.forEach(enemy => {
        if (enemy.world !== GameState.currentWorld) return;

        const drawX = enemy.x - cameraOffset;
        const drawY = enemy.y + yOffset;

        if (drawX < -enemy.width || drawX > GAME_WIDTH) return;

        // Pac-Man style ghost - symmetrical dome with wavy bottom (scaled for 22px)
        const isReal = GameState.currentWorld === 'real';
        const ghostColor = isReal ? '#ff4444' : '#cc44ff';
        const centerX = drawX + enemy.width / 2;
        const centerY = drawY + enemy.height / 2;
        const radius = 9;
        const waveTime = Date.now() * 0.01;

        // Ghost body - dome top
        ctx.fillStyle = ghostColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
        ctx.lineTo(centerX + radius, centerY + 6);

        // Wavy bottom - 3 symmetric waves
        const waveCount = 3;
        const waveWidth = (radius * 2) / waveCount;
        for (let i = 0; i < waveCount; i++) {
            const wx = centerX + radius - (i + 0.5) * waveWidth;
            const waveOffset = Math.sin(waveTime + i) * 1;
            const wy = centerY + 6 + (i % 2 === 0 ? 3 + waveOffset : waveOffset);
            ctx.lineTo(wx, wy);
        }
        ctx.lineTo(centerX - radius, centerY + 6);
        ctx.closePath();
        ctx.fill();

        // Lighter inner highlight
        ctx.fillStyle = isReal ? '#ff7777' : '#dd77ff';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes - symmetrical, centered, looking at player
        const eyeOffsetX = 3;
        const eyeY = centerY - 2;
        const eyeRadius = 3;
        const pupilRadius = 1.5;

        // Look toward player
        const toPlayerX = Player.x - enemy.x;
        const toPlayerY = Player.y - enemy.y;
        const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;
        const lookX = (toPlayerX / dist) * 1;
        const lookY = (toPlayerY / dist) * 1;

        // White part of eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupils - look at player
        ctx.fillStyle = '#2233aa';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================
// PROJECTILES
// ============================================

function updateProjectiles() {
    const tiles = GameState.currentWorld === 'real' ? Levels.getReal() : Levels.getDream();

    GameState.projectiles = GameState.projectiles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Check wall collision
        const tileX = Math.floor(p.x / TILE_SIZE);
        const tileY = Math.floor(p.y / TILE_SIZE);
        if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
            if (tiles[tileY][tileX] === 1) return false;
        }

        // Check enemy collision
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            if (enemy.world !== GameState.currentWorld) continue;

            if (p.x > enemy.x && p.x < enemy.x + enemy.width &&
                p.y > enemy.y && p.y < enemy.y + enemy.height) {

                // Track this enemy as killed
                const worldKey = GameState.currentWorld === 'real' ? 'real' : 'dream';
                if (!GameState.killedEnemies[worldKey][Levels.current]) {
                    GameState.killedEnemies[worldKey][Levels.current] = [];
                }
                if (!GameState.killedEnemies[worldKey][Levels.current].includes(enemy.templateIndex)) {
                    GameState.killedEnemies[worldKey][Levels.current].push(enemy.templateIndex);
                }

                // Award points based on enemy type
                const points = enemy.type === 'chase' ? 150 : 100;
                GameState.score += points;

                // Spawn item drop
                spawnDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type);

                GameState.enemies.splice(i, 1);
                Audio8Bit.playHit();
                updateUI();
                return false;
            }
        }

        return p.life > 0 && p.x > -50 && p.x < GAME_WIDTH * 3 && p.y > -50 && p.y < GAME_HEIGHT;
    });
}

// ============================================
// ITEM DROPS
// ============================================

function spawnDrop(x, y, enemyType) {
    // Determine drop type based on world and chance
    const roll = Math.random();
    let dropType;

    if (GameState.currentWorld === 'real') {
        // Real World drops: coins, health, dream essence
        if (roll < 0.3) dropType = 'coin';
        else if (roll < 0.45) dropType = 'health';
        else if (roll < 0.6) dropType = 'dream_essence';
        else if (roll < 0.7) dropType = 'power_boost';
        else return; // No drop (30% chance)
    } else {
        // Dream World drops: coins, health, real energy
        if (roll < 0.3) dropType = 'coin';
        else if (roll < 0.45) dropType = 'health';
        else if (roll < 0.6) dropType = 'real_energy';
        else if (roll < 0.7) dropType = 'shield';
        else return; // No drop (30% chance)
    }

    GameState.drops.push({
        x: x,
        y: y,
        type: dropType,
        bobOffset: Math.random() * Math.PI * 2
    });
}

function updateDrops() {
    const playerRect = Player.getRect();

    GameState.drops = GameState.drops.filter(drop => {
        // Check pickup collision
        const dropRect = { x: drop.x - 8, y: drop.y - 8, width: 16, height: 16 };
        if (rectsOverlap(playerRect, dropRect)) {
            collectDrop(drop);
            return false;
        }

        return true; // Drops persist until collected
    });
}

function collectDrop(drop) {
    switch (drop.type) {
        case 'coin':
            GameState.score += 50;
            break;
        case 'health':
            if (GameState.health < GameState.maxHealth) {
                GameState.health++;
            } else {
                GameState.score += 25; // Bonus points if at full health
            }
            break;
        case 'dream_essence':
            GameState.dreamEssence++;
            GameState.score += 25;
            break;
        case 'real_energy':
            GameState.realEnergy++;
            GameState.score += 25;
            break;
        case 'power_boost':
            // Add to usable items
            if (GameState.usableItems.length < 3) {
                GameState.usableItems.push('power_boost');
            } else {
                GameState.score += 75;
            }
            break;
        case 'shield':
            // Add to usable items
            if (GameState.usableItems.length < 3) {
                GameState.usableItems.push('shield');
            } else {
                GameState.score += 75;
            }
            break;
    }
    Audio8Bit.playPickup();
    updateUI();
}

function drawDrops() {
    const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
    const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;

    GameState.drops.forEach(drop => {
        const bob = Math.sin(Date.now() * 0.005 + drop.bobOffset) * 3;
        const drawX = drop.x - cameraOffset;
        const drawY = drop.y + yOffset + bob;

        if (drawX < -16 || drawX > GAME_WIDTH + 16) return;

        switch (drop.type) {
            case 'coin':
                // Gold coin
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(drawX - 1, drawY - 1, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'health':
                // Red heart
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(drawX - 3, drawY - 2, 4, 0, Math.PI * 2);
                ctx.arc(drawX + 3, drawY - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(drawX - 7, drawY);
                ctx.lineTo(drawX, drawY + 8);
                ctx.lineTo(drawX + 7, drawY);
                ctx.fill();
                break;
            case 'dream_essence':
                // Purple swirl
                ctx.fillStyle = '#cc66ff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff99ff';
                ctx.beginPath();
                const swirl = Date.now() * 0.01;
                ctx.arc(drawX + Math.cos(swirl) * 3, drawY + Math.sin(swirl) * 3, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'real_energy':
                // Green energy orb
                ctx.fillStyle = '#44ff44';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#aaffaa';
                ctx.beginPath();
                const pulse = Date.now() * 0.01;
                ctx.arc(drawX + Math.cos(pulse) * 3, drawY + Math.sin(pulse) * 3, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'power_boost':
                // Orange star
                ctx.fillStyle = '#ff8800';
                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.rotate(Date.now() * 0.003);
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, -8);
                    ctx.lineTo(2, -3);
                    ctx.lineTo(7, -3);
                    ctx.lineTo(3, 1);
                    ctx.lineTo(5, 7);
                    ctx.lineTo(0, 3);
                    ctx.lineTo(-5, 7);
                    ctx.lineTo(-3, 1);
                    ctx.lineTo(-7, -3);
                    ctx.lineTo(-2, -3);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
                break;
            case 'shield':
                // Blue shield
                ctx.fillStyle = '#4488ff';
                ctx.beginPath();
                ctx.moveTo(drawX, drawY - 8);
                ctx.lineTo(drawX + 7, drawY - 4);
                ctx.lineTo(drawX + 7, drawY + 2);
                ctx.lineTo(drawX, drawY + 8);
                ctx.lineTo(drawX - 7, drawY + 2);
                ctx.lineTo(drawX - 7, drawY - 4);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#88bbff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    });
}

// ============================================
// USABLE ITEMS & WORLD POWERS
// ============================================

function useItem(slot) {
    if (slot >= GameState.usableItems.length) return;

    const item = GameState.usableItems[slot];
    GameState.usableItems.splice(slot, 1);

    switch (item) {
        case 'power_boost':
            GameState.powerBoostTimer = 900; // 15 seconds
            break;
        case 'shield':
            GameState.shieldTimer = 1200; // 20 seconds
            break;
    }
    updateUI();
}

function useWorldPower() {
    // Use Dream Essence in Real World, Real Energy in Dream World
    if (GameState.currentWorld === 'real' && GameState.dreamEssence > 0) {
        // Dream Essence: Power boost + heal
        GameState.dreamEssence--;
        GameState.powerBoostTimer = Math.max(GameState.powerBoostTimer, 600); // 10 seconds
        // Also heal 1 HP
        if (GameState.health < GameState.maxHealth) {
            GameState.health++;
        }
        updateUI();
    } else if (GameState.currentWorld === 'dream' && GameState.realEnergy > 0) {
        // Real Energy: Invincibility + shield
        GameState.realEnergy--;
        GameState.invincible = Math.max(GameState.invincible, 300); // 5 seconds invincibility
        GameState.shieldTimer = Math.max(GameState.shieldTimer, 600); // 10 seconds shield
        updateUI();
    }
}

function drawProjectiles() {
    const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
    const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;

    GameState.projectiles.forEach(p => {
        const drawX = p.x - cameraOffset;
        const drawY = p.y + yOffset;

        if (p.isFireball) {
            // Fireball (dream world)
            if (p.charged) {
                // Charged fireball - big and powerful
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Normal fireball - scaled down
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Bullet (real world)
            if (p.charged) {
                // Charged bullet - big plasma shot
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Normal bullet - scaled down
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(drawX - 3, drawY - 1, 6, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(drawX - 2, drawY, 4, 2);
            }
        }
    });
}

// ============================================
// WORLD RENDERING
// ============================================

const RealWorld = {
    draw() {
        const tiles = Levels.getReal();
        ctx.fillStyle = '#1a3320';
        ctx.fillRect(0, 0, GAME_WIDTH, REAL_WORLD_HEIGHT);

        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                const tile = tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                this.drawTile(tile, px, py);
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, 5, 180, 22);
        ctx.fillStyle = '#90EE90';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(`REAL WORLD - X to shoot`, 10, 20);
    },

    drawTile(tile, px, py) {
        const s = TILE_SIZE / 56; // Scale factor for smaller tiles
        switch (tile) {
            case 1:
                ctx.fillStyle = '#2a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#3a7540';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.fillStyle = '#2a5530';
                ctx.fillRect(px + TILE_SIZE/2, py, 1, TILE_SIZE);
                ctx.fillRect(px, py + TILE_SIZE/2, TILE_SIZE, 1);
                break;
            case 2:
                ctx.fillStyle = '#9933ff';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#cc66ff';
                const pulse = 6*s + Math.sin(Date.now() / 200) * 3*s;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 2*s, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 2, py + 1, TILE_SIZE - 4, TILE_SIZE - 2);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 4*s, 4*s, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4:
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 10*s, 6*s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14*s, 4, 10*s);
                ctx.fillRect(px + TILE_SIZE/2, py + 19*s, 6*s, 3*s);
                break;
            case 5:
                ctx.fillStyle = '#3a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a3320';
                ctx.fillRect(px + 6*s, py + 2, TILE_SIZE - 12*s, TILE_SIZE - 2);
                break;
        }
    }
};

const DreamWorld = {
    draw() {
        const tiles = Levels.getDream();

        const gradient = ctx.createLinearGradient(0, DREAM_WORLD_Y_OFFSET, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#0a0515');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, GAME_WIDTH, DREAM_WORLD_HEIGHT);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
            const baseX = (i * 73) % (GAME_WIDTH * 2);
            const x = (baseX - GameState.cameraX * 0.3 + GAME_WIDTH) % GAME_WIDTH;
            const y = DREAM_WORLD_Y_OFFSET + (i * 31) % (DREAM_WORLD_HEIGHT - 40);
            const twinkle = Math.sin(Date.now() * 0.005 + i) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle * 0.8;
            ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
        }
        ctx.globalAlpha = 1;

        const startTile = Math.floor(GameState.cameraX / TILE_SIZE);
        const endTile = Math.ceil((GameState.cameraX + GAME_WIDTH) / TILE_SIZE) + 1;

        for (let y = 0; y < tiles.length; y++) {
            for (let x = startTile; x < Math.min(endTile, tiles[y].length); x++) {
                const tile = tiles[y][x];
                const px = x * TILE_SIZE - GameState.cameraX;
                const py = y * TILE_SIZE + DREAM_WORLD_Y_OFFSET;
                this.drawTile(tile, px, py);
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, DREAM_WORLD_Y_OFFSET + 5, 200, 22);
        ctx.fillStyle = '#DDA0DD';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(`DREAM WORLD - X for fireball`, 10, DREAM_WORLD_Y_OFFSET + 20);

        if (GameState.nearDoor && GameState.currentWorld === 'dream') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(GAME_WIDTH/2 - 80, DREAM_WORLD_Y_OFFSET + DREAM_WORLD_HEIGHT - 35, 160, 28);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to enter', GAME_WIDTH/2, DREAM_WORLD_Y_OFFSET + DREAM_WORLD_HEIGHT - 16);
            ctx.textAlign = 'left';
        }
    },

    drawTile(tile, px, py) {
        if (px < -TILE_SIZE || px > GAME_WIDTH) return;
        const s = TILE_SIZE / 56; // Scale factor for smaller tiles

        switch (tile) {
            case 1:
                ctx.fillStyle = '#5a3a7a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#7a5a9a';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 4*s);
                ctx.fillStyle = '#4a2a6a';
                ctx.fillRect(px + 1, py + TILE_SIZE - 3*s, TILE_SIZE - 2, 2*s);
                break;
            case 2:
                ctx.fillStyle = '#33ff99';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#66ffbb';
                const pulse = 6*s + Math.sin(Date.now() / 200) * 3*s;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 2*s, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 2, py + 1, TILE_SIZE - 4, TILE_SIZE - 2);
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 4*s, 4*s, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4:
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 10*s, 6*s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14*s, 4, 10*s);
                ctx.fillRect(px + TILE_SIZE/2, py + 19*s, 6*s, 3*s);
                break;
            case 5:
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(px + 4*s, py + 2, TILE_SIZE - 8*s, TILE_SIZE - 2);
                ctx.fillStyle = '#ffaa33';
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 300) * 0.2;
                ctx.fillRect(px + 6*s, py + 4*s, TILE_SIZE - 12*s, TILE_SIZE - 4*s);
                ctx.globalAlpha = 1;
                break;
            case 6:
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 5*s + Math.sin(Date.now()/200)*1.5*s, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
};

// ============================================
// GAME LOGIC
// ============================================

function checkInteractions() {
    if (GameState.portalCooldown > 0) return;

    const tiles = GameState.currentWorld === 'real' ? Levels.getReal() : Levels.getDream();
    const playerRect = Player.getRect();
    const centerX = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
    const centerY = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);

    GameState.nearDoor = null;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tileX = centerX + dx;
            const tileY = centerY + dy;

            if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
                const tile = tiles[tileY][tileX];
                const tileRect = { x: tileX * TILE_SIZE, y: tileY * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };

                if (rectsOverlap(playerRect, tileRect)) {
                    if (tile === 2) {
                        switchWorld();
                        return;
                    }
                    if (tile === 4) {
                        tiles[tileY][tileX] = 0;
                        const keyName = GameState.currentWorld === 'real' ? 'Golden Key' : 'Dream Key';
                        if (!GameState.inventory.includes(keyName)) {
                            GameState.inventory.push(keyName);
                            updateUI();
                        }
                    }
                    if (tile === 3) {
                        const neededKey = GameState.currentWorld === 'real' ? 'Dream Key' : 'Golden Key';
                        if (GameState.inventory.includes(neededKey)) {
                            tiles[tileY][tileX] = 5;
                            GameState.inventory.splice(GameState.inventory.indexOf(neededKey), 1);
                            updateUI();
                        }
                    }
                    if (tile === 5) {
                        GameState.nearDoor = { x: tileX, y: tileY };
                        if (GameState.keysPressed['KeyE']) {
                            GameState.keysPressed['KeyE'] = false;
                            enterDoor();
                            return;
                        }
                    }
                    if (tile === 6) {
                        reachGoal();
                        return;
                    }
                }
            }
        }
    }
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function switchWorld() {
    GameState.portalCooldown = 60;
    GameState.projectiles = [];
    GameState.drops = []; // Clear drops when switching worlds
    Audio8Bit.playPortal();

    if (GameState.currentWorld === 'real') {
        GameState.currentWorld = 'dream';
        Player.gridX = 1;
        Player.gridY = 1;
        Player.x = Player.gridX * TILE_SIZE + 2;
        Player.y = Player.gridY * TILE_SIZE + 2;
        Player.isMoving = false;
        Player.isJumping = false;
        Player.isFalling = false;
        Player.facing = 1;
        GameState.cameraX = 0;
    } else {
        GameState.currentWorld = 'real';
        Player.gridX = 12;
        Player.gridY = 12;
        Player.x = Player.gridX * TILE_SIZE + 2;
        Player.y = Player.gridY * TILE_SIZE + 2;
        Player.isMoving = false;
        Player.moveProgress = 0;
    }
    spawnEnemies(); // Will now respect killed enemies tracker
    updateUI();
}

function enterDoor() {
    completeLevel();
}

function reachGoal() {
    completeLevel();
}

function completeLevel() {
    GameState.projectiles = [];
    GameState.drops = [];

    if (Levels.nextLevel()) {
        // Progress to next level - reset killed enemies for new level
        GameState.currentWorld = 'real';
        GameState.inventory = [];
        GameState.cameraX = 0;
        // Keep score, essence, energy, and usable items!
        Player.init();
        spawnEnemies();
        updateUI();
    } else {
        // Game complete - show victory and restart
        GameState.gameComplete = true;
        setTimeout(() => {
            GameState.gameComplete = false;
            Levels.reset();
            GameState.currentWorld = 'real';
            GameState.inventory = [];
            GameState.cameraX = 0;
            GameState.health = GameState.maxHealth;
            // Reset all progress on game restart
            GameState.score = 0;
            GameState.killedEnemies = { real: {}, dream: {} };
            GameState.dreamEssence = 0;
            GameState.realEnergy = 0;
            GameState.usableItems = [];
            GameState.powerBoostTimer = 0;
            GameState.shieldTimer = 0;
            Player.init();
            spawnEnemies();
            updateUI();
        }, 3000);
    }
}

function updateUI() {
    const indicator = document.getElementById('world-indicator');
    const inventoryEl = document.getElementById('inventory-items');
    const hintsEl = document.getElementById('controls-hint');

    // Score and level
    const scoreText = `SCORE: ${GameState.score}`;

    if (GameState.currentWorld === 'real') {
        indicator.textContent = `REAL WORLD - Level ${Levels.current} | ${scoreText}`;
        indicator.className = 'real-world';
    } else {
        indicator.textContent = `DREAM WORLD - Level ${Levels.current} | ${scoreText}`;
        indicator.className = 'dream-world';
    }

    // Health and resources
    const hp = `HP: ${'❤'.repeat(GameState.health)}${'♡'.repeat(GameState.maxHealth - GameState.health)}`;
    const essence = GameState.dreamEssence > 0 ? ` | 💜×${GameState.dreamEssence}` : '';
    const energy = GameState.realEnergy > 0 ? ` | 💚×${GameState.realEnergy}` : '';
    hintsEl.textContent = hp + essence + energy;

    // Inventory: Keys + Usable items
    let invText = '';

    // Keys
    if (GameState.inventory.length > 0) {
        invText = GameState.inventory.join(', ');
    }

    // Usable items with keybinds
    if (GameState.usableItems.length > 0) {
        const itemNames = GameState.usableItems.map((item, i) => {
            const name = item === 'power_boost' ? '⭐Power' : '🛡Shield';
            return `[${i + 1}]${name}`;
        });
        invText += (invText ? ' | ' : '') + itemNames.join(' ');
    }

    // World power hint
    if (GameState.currentWorld === 'real' && GameState.dreamEssence > 0) {
        invText += (invText ? ' | ' : '') + '[Z] Use Dream Power';
    } else if (GameState.currentWorld === 'dream' && GameState.realEnergy > 0) {
        invText += (invText ? ' | ' : '') + '[Z] Use Real Power';
    }

    inventoryEl.textContent = invText || 'Empty';
}

function drawDivider() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, REAL_WORLD_HEIGHT, GAME_WIDTH, DIVIDER_HEIGHT);
}

function drawActiveHighlight() {
    ctx.strokeStyle = GameState.currentWorld === 'real' ? '#90EE90' : '#DDA0DD';
    ctx.lineWidth = 4;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;

    if (GameState.currentWorld === 'real') {
        ctx.strokeRect(2, 2, GAME_WIDTH - 4, REAL_WORLD_HEIGHT - 4);
    } else {
        ctx.strokeRect(2, DREAM_WORLD_Y_OFFSET + 2, GAME_WIDTH - 4, DREAM_WORLD_HEIGHT - 4);
    }
    ctx.shadowBlur = 0;
}

function drawPowerUpStatus() {
    const yBase = GameState.currentWorld === 'real' ? 30 : DREAM_WORLD_Y_OFFSET + 30;

    // Power boost indicator
    if (GameState.powerBoostTimer > 0) {
        ctx.fillStyle = 'rgba(255, 136, 0, 0.8)';
        ctx.fillRect(5, yBase, 80, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`POWER ${Math.ceil(GameState.powerBoostTimer / 60)}s`, 10, yBase + 12);
    }

    // Shield indicator
    if (GameState.shieldTimer > 0) {
        ctx.fillStyle = 'rgba(68, 136, 255, 0.8)';
        ctx.fillRect(5, yBase + (GameState.powerBoostTimer > 0 ? 20 : 0), 80, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`SHIELD ${Math.ceil(GameState.shieldTimer / 60)}s`, 10, yBase + 12 + (GameState.powerBoostTimer > 0 ? 20 : 0));
    }

    // Shield visual effect around player
    if (GameState.shieldTimer > 0) {
        const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
        const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;
        const drawX = Player.x - cameraOffset + Player.width / 2;
        const drawY = Player.y + yOffset + Player.height / 2;

        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// ============================================
// GAME LOOP
// ============================================

function update() {
    Player.update();
    updateEnemies();
    updateProjectiles();
    updateDrops();
    checkInteractions();
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Handle different screen states
    if (GameState.screenState === 'title') {
        drawTitleScreen();
        return;
    }

    // Draw game world
    RealWorld.draw();
    drawDivider();
    DreamWorld.draw();
    drawActiveHighlight();
    drawEnemies();
    drawDrops();
    drawProjectiles();
    Player.draw();
    drawPowerUpStatus();

    // Pause overlay
    if (GameState.screenState === 'paused') {
        drawPauseMenu();
        return;
    }

    // Victory screen overlay
    if (GameState.gameComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '18px Courier New';
        ctx.fillText('All levels complete!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        ctx.fillText('Restarting...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        ctx.textAlign = 'left';
    }
}

// ============================================
// TITLE SCREEN & PAUSE MENU
// ============================================

// Tetris block pixel art letters for "DREAMWORLD"
// Each letter is defined as a grid of blocks (5 wide x 7 tall)
const TetrisLetters = {
    D: [
        [1,1,1,0,0],
        [1,0,0,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,1,0],
        [1,1,1,0,0]
    ],
    R: [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,1,0,0],
        [1,0,0,1,0],
        [1,0,0,0,1]
    ],
    E: [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    A: [
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    M: [
        [1,0,0,0,1],
        [1,1,0,1,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    W: [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,1,0,1,1],
        [1,0,0,0,1]
    ],
    O: [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    L: [
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ]
};

// Colors for Tetris blocks - pink, purple, green rotation
const TetrisColors = ['#ff69b4', '#9932cc', '#32cd32', '#ff1493', '#8a2be2', '#00fa9a'];

function drawTetrisLetter(letter, startX, startY, blockSize, colorIndex) {
    const grid = TetrisLetters[letter];
    if (!grid) return;

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x]) {
                const bx = startX + x * blockSize;
                const by = startY + y * blockSize;
                const color = TetrisColors[(colorIndex + x + y) % TetrisColors.length];

                // Block with Tetris-style 3D effect
                ctx.fillStyle = color;
                ctx.fillRect(bx, by, blockSize - 1, blockSize - 1);

                // Highlight (top-left)
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(bx, by, blockSize - 1, 2);
                ctx.fillRect(bx, by, 2, blockSize - 1);

                // Shadow (bottom-right)
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(bx, by + blockSize - 3, blockSize - 1, 2);
                ctx.fillRect(bx + blockSize - 3, by, 2, blockSize - 1);
            }
        }
    }
}

function drawTitleScreen() {
    // Background - dark gradient with stars
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0015');
    gradient.addColorStop(0.5, '#1a0030');
    gradient.addColorStop(1, '#0a0025');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Animated stars
    const time = Date.now() / 1000;
    for (let i = 0; i < 50; i++) {
        const sx = (i * 137 + time * 10) % GAME_WIDTH;
        const sy = (i * 97) % GAME_HEIGHT;
        const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + twinkle * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + twinkle, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw "DREAMWORLD" with Tetris blocks
    const word = 'DREAMWORLD';
    const blockSize = 6;
    const letterWidth = 5 * blockSize + 4; // 5 blocks + spacing
    const totalWidth = word.length * letterWidth;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const startY = 150;

    // Floating animation
    const floatOffset = Math.sin(time * 2) * 5;

    for (let i = 0; i < word.length; i++) {
        const letterOffset = Math.sin(time * 3 + i * 0.5) * 3;
        drawTetrisLetter(
            word[i],
            startX + i * letterWidth,
            startY + floatOffset + letterOffset,
            blockSize,
            i
        );
    }

    // Subtitle
    ctx.fillStyle = '#cc99ff';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('A Dual-Perspective Adventure', GAME_WIDTH / 2, startY + 70);

    // Start button
    const btnY = 320;
    const btnWidth = 160;
    const btnHeight = 45;
    const btnX = (GAME_WIDTH - btnWidth) / 2;

    // Button glow
    const glowIntensity = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 20 * glowIntensity;

    // Button background
    ctx.fillStyle = '#9932cc';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

    // Button border (Tetris style)
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(btnX, btnY, btnWidth, 3);
    ctx.fillRect(btnX, btnY, 3, btnHeight);
    ctx.fillStyle = '#4a1070';
    ctx.fillRect(btnX, btnY + btnHeight - 3, btnWidth, 3);
    ctx.fillRect(btnX + btnWidth - 3, btnY, 3, btnHeight);

    ctx.shadowBlur = 0;

    // Button text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('START GAME', GAME_WIDTH / 2, btnY + 30);

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('Press ENTER or SPACE to start', GAME_WIDTH / 2, 400);
    ctx.fillText('ESC to pause during game', GAME_WIDTH / 2, 420);

    // Controls info
    ctx.fillStyle = '#666';
    ctx.font = '11px Courier New';
    ctx.fillText('Arrow Keys: Move | X: Shoot (hold to charge) | C: Melee', GAME_WIDTH / 2, 480);
    ctx.fillText('Z: World Power | 1-3: Use Items | E: Enter Doors', GAME_WIDTH / 2, 500);

    ctx.textAlign = 'left';
}

function drawPauseMenu() {
    // Darken game
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pause title
    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, 200);

    // Menu options
    const menuY = 280;
    const optionHeight = 50;
    const options = ['RESUME', 'RESTART', 'TITLE SCREEN'];

    const time = Date.now() / 1000;

    options.forEach((option, i) => {
        const y = menuY + i * optionHeight;
        const isHovered = GameState.pauseSelection === i;

        if (isHovered) {
            // Highlighted option
            ctx.fillStyle = '#9932cc';
            ctx.fillRect(GAME_WIDTH / 2 - 100, y - 20, 200, 35);
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = '#aaa';
        }

        ctx.font = isHovered ? 'bold 18px Courier New' : '16px Courier New';
        ctx.fillText(option, GAME_WIDTH / 2, y);
    });

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('Arrow Keys to select, ENTER to confirm, ESC to resume', GAME_WIDTH / 2, 480);

    ctx.textAlign = 'left';
}

// Initialize pause menu state
GameState.pauseSelection = 0;

function gameLoop() {
    if (GameState.screenState === 'playing') {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START
// ============================================

Levels.loadLevel(1);
Player.init();
spawnEnemies();
updateUI();
gameLoop();

console.log('Dreamworld v1.5 - Combat & UI Update! Melee (C), charged shots (hold X), title screen, pause (ESC)');
