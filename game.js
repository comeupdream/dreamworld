// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// v2.2 - Split-Screen with Dual Scrolling Cameras
// - Original viewport sizes preserved
// - Real World: 560x560 square viewport
// - Dream World: 560x336 rectangle viewport
// - Camera scrolls within viewports for larger worlds
// - 24px tiles for more detail
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tile size
const TILE_SIZE = 24;

// Viewport dimensions - DIFFERENT for each world
const REAL_VIEWPORT_WIDTH = 560;
const REAL_VIEWPORT_HEIGHT = 560;  // Square viewport for top-down
const DREAM_VIEWPORT_WIDTH = 560;
const DREAM_VIEWPORT_HEIGHT = 336; // Rectangle viewport for side-scroller

// Total canvas size
const GAME_WIDTH = 560;
const GAME_HEIGHT = REAL_VIEWPORT_HEIGHT + DREAM_VIEWPORT_HEIGHT;  // 560 + 336 = 896

// World positions on screen
const REAL_WORLD_Y_OFFSET = 0;
const DREAM_WORLD_Y_OFFSET = REAL_VIEWPORT_HEIGHT;  // Below real world (at y=560)

// World sizes (in tiles) - larger than viewport, camera scrolls
const REAL_WORLD_WIDTH = 40;
const REAL_WORLD_HEIGHT_TILES = 40;
const DREAM_WORLD_WIDTH = 60;
const DREAM_WORLD_HEIGHT_TILES = 20;

// How many tiles visible in each viewport
const REAL_VIEWPORT_TILES_X = Math.ceil(REAL_VIEWPORT_WIDTH / TILE_SIZE);   // ~24 tiles
const REAL_VIEWPORT_TILES_Y = Math.ceil(REAL_VIEWPORT_HEIGHT / TILE_SIZE);  // ~24 tiles
const DREAM_VIEWPORT_TILES_X = Math.ceil(DREAM_VIEWPORT_WIDTH / TILE_SIZE); // ~24 tiles
const DREAM_VIEWPORT_TILES_Y = Math.ceil(DREAM_VIEWPORT_HEIGHT / TILE_SIZE); // ~14 tiles

// Legacy constants for compatibility
const VIEWPORT_WIDTH = REAL_VIEWPORT_WIDTH;
const VIEWPORT_HEIGHT = REAL_VIEWPORT_HEIGHT;
const REAL_WORLD_HEIGHT = REAL_VIEWPORT_HEIGHT;
const DREAM_WORLD_HEIGHT = DREAM_VIEWPORT_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game speed multiplier (0.9 = 10% slower)
const GAME_SPEED = 0.9;

// ============================================
// DUAL CAMERA SYSTEM
// Each world has its own independent camera
// ============================================

// Create a camera factory for reusability
function createCamera(worldType) {
    // Get the correct viewport dimensions for this world type
    const viewportWidth = worldType === 'real' ? REAL_VIEWPORT_WIDTH : DREAM_VIEWPORT_WIDTH;
    const viewportHeight = worldType === 'real' ? REAL_VIEWPORT_HEIGHT : DREAM_VIEWPORT_HEIGHT;

    return {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        smoothing: 0.1,
        worldType: worldType,
        viewportWidth: viewportWidth,
        viewportHeight: viewportHeight,

        getWorldBounds() {
            try {
                let tiles;
                if (this.worldType === 'real') {
                    tiles = Levels.getReal();
                } else {
                    tiles = Levels.getDream();
                }
                const height = tiles.length * TILE_SIZE;
                const width = (tiles[0]?.length || 20) * TILE_SIZE;
                return { width, height };
            } catch (e) {
                if (this.worldType === 'real') {
                    return {
                        width: REAL_WORLD_WIDTH * TILE_SIZE,
                        height: REAL_WORLD_HEIGHT_TILES * TILE_SIZE
                    };
                } else {
                    return {
                        width: DREAM_WORLD_WIDTH * TILE_SIZE,
                        height: DREAM_WORLD_HEIGHT_TILES * TILE_SIZE
                    };
                }
            }
        },

        update(playerX, playerY, playerWidth, playerHeight) {
            const bounds = this.getWorldBounds();

            // Target position centers player on screen
            this.targetX = playerX + (playerWidth / 2) - this.viewportWidth / 2;
            this.targetY = playerY + (playerHeight / 2) - this.viewportHeight / 2;

            // Clamp target to world bounds (don't scroll past edges)
            const maxX = Math.max(0, bounds.width - this.viewportWidth);
            const maxY = Math.max(0, bounds.height - this.viewportHeight);
            this.targetX = Math.max(0, Math.min(this.targetX, maxX));
            this.targetY = Math.max(0, Math.min(this.targetY, maxY));

            // Smooth interpolation toward target
            this.x += (this.targetX - this.x) * this.smoothing;
            this.y += (this.targetY - this.y) * this.smoothing;

            // Snap if very close (prevents jitter)
            if (Math.abs(this.x - this.targetX) < 0.5) this.x = this.targetX;
            if (Math.abs(this.y - this.targetY) < 0.5) this.y = this.targetY;
        },

        snapTo(playerX, playerY, playerWidth, playerHeight) {
            const bounds = this.getWorldBounds();

            this.x = playerX + (playerWidth / 2) - this.viewportWidth / 2;
            this.y = playerY + (playerHeight / 2) - this.viewportHeight / 2;

            // Clamp to world bounds
            const maxX = Math.max(0, bounds.width - this.viewportWidth);
            const maxY = Math.max(0, bounds.height - this.viewportHeight);
            this.x = Math.max(0, Math.min(this.x, maxX));
            this.y = Math.max(0, Math.min(this.y, maxY));

            this.targetX = this.x;
            this.targetY = this.y;
        },

        isVisible(x, y, width, height) {
            return x + width > this.x &&
                   x < this.x + this.viewportWidth &&
                   y + height > this.y &&
                   y < this.y + this.viewportHeight;
        }
    };
}

// Two independent cameras
const RealCamera = createCamera('real');
const DreamCamera = createCamera('dream');

// Helper to get the active camera based on current world
function getActiveCamera() {
    return GameState.currentWorld === 'real' ? RealCamera : DreamCamera;
}

// Legacy Camera object for backwards compatibility
const Camera = {
    get x() { return getActiveCamera().x; },
    get y() { return getActiveCamera().y; },
    set x(val) { getActiveCamera().x = val; },
    set y(val) { getActiveCamera().y = val; },

    update() {
        // Update only the active world's camera
        const cam = getActiveCamera();
        if (GameState.currentWorld === 'real') {
            cam.update(Player.x, Player.y, TILE_SIZE, TILE_SIZE);
        } else {
            cam.update(Player.x, Player.y, Player.width, Player.height);
        }
    },

    snapToPlayer() {
        const cam = getActiveCamera();
        if (GameState.currentWorld === 'real') {
            cam.snapTo(Player.x, Player.y, TILE_SIZE, TILE_SIZE);
        } else {
            cam.snapTo(Player.x, Player.y, Player.width, Player.height);
        }
    },

    getWorldBounds() {
        return getActiveCamera().getWorldBounds();
    },

    isVisible(x, y, width, height) {
        return getActiveCamera().isVisible(x, y, width, height);
    },

    screenToWorld(screenX, screenY) {
        const cam = getActiveCamera();
        return { x: screenX + cam.x, y: screenY + cam.y };
    },

    worldToScreen(worldX, worldY) {
        const cam = getActiveCamera();
        return { x: worldX - cam.x, y: worldY - cam.y };
    }
};

// ============================================
// 8-BIT AUDIO SYSTEM
// ============================================

const Audio8Bit = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicPlaying: false,
    musicNodes: [],
    musicLoopTimeout: null, // Track the loop timeout

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
    // Sword slice sound - sharp metallic whoosh
    playMelee() {
        if (!this.ctx) return;
        this.resume();

        // High-pitched slice
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
        gain1.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc1.start(this.ctx.currentTime);
        osc1.stop(this.ctx.currentTime + 0.15);

        // Metallic ring
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc2.start(this.ctx.currentTime);
        osc2.stop(this.ctx.currentTime + 0.2);

        // Noise swoosh
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        noise.start(this.ctx.currentTime);
    },

    // Charging vortex sound
    chargeSound: null,
    chargeGain: null,

    startChargeSound() {
        if (!this.ctx) return;
        if (this.chargeSound) return; // Already playing
        this.resume();

        // Create oscillators for vortex effect
        this.chargeSound = [];
        this.chargeGain = this.ctx.createGain();
        this.chargeGain.connect(this.sfxGain);
        this.chargeGain.gain.value = 0;

        // Multiple detuned oscillators for wooshing
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 150 + i * 50;
            osc.detune.value = i * 10;
            osc.connect(this.chargeGain);
            osc.start();
            this.chargeSound.push(osc);
        }

        // LFO for wobble
        this.chargeLFO = this.ctx.createOscillator();
        this.chargeLFO.frequency.value = 8;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 30;
        this.chargeLFO.connect(lfoGain);
        this.chargeSound.forEach(osc => lfoGain.connect(osc.frequency));
        this.chargeLFO.start();
    },

    updateChargeSound(chargeLevel) {
        if (!this.chargeGain) return;
        // Increase volume and pitch as charge builds
        this.chargeGain.gain.value = Math.min(0.25, chargeLevel * 0.3);
        if (this.chargeSound) {
            this.chargeSound.forEach((osc, i) => {
                osc.frequency.value = 150 + i * 50 + chargeLevel * 200;
            });
        }
        if (this.chargeLFO) {
            this.chargeLFO.frequency.value = 8 + chargeLevel * 12;
        }
    },

    stopChargeSound() {
        if (this.chargeSound) {
            this.chargeSound.forEach(osc => osc.stop());
            this.chargeSound = null;
        }
        if (this.chargeLFO) {
            this.chargeLFO.stop();
            this.chargeLFO = null;
        }
        this.chargeGain = null;
    },

    // Game over sound - pixels disintegrating, Galaga-style destruction
    playGameOver() {
        if (!this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Initial explosion burst
        const explosionBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const explosionData = explosionBuffer.getChannelData(0);
        for (let i = 0; i < explosionBuffer.length; i++) {
            const env = Math.exp(-i / (this.ctx.sampleRate * 0.15));
            explosionData[i] = (Math.random() * 2 - 1) * env;
        }
        const explosion = this.ctx.createBufferSource();
        const explosionGain = this.ctx.createGain();
        const explosionFilter = this.ctx.createBiquadFilter();
        explosion.buffer = explosionBuffer;
        explosionFilter.type = 'lowpass';
        explosionFilter.frequency.value = 1000;
        explosion.connect(explosionFilter);
        explosionFilter.connect(explosionGain);
        explosionGain.connect(this.sfxGain);
        explosionGain.gain.setValueAtTime(0.4, now);
        explosion.start(now);

        // Descending "death" tones (Galaga style)
        for (let i = 0; i < 6; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + i * 0.12;
            const startFreq = 800 - i * 100;
            osc.frequency.setValueAtTime(startFreq, startTime);
            osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, startTime + 0.1);

            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            osc.start(startTime);
            osc.stop(startTime + 0.12);
        }

        // Pixel scatter sounds (multiple small wooshes)
        for (let i = 0; i < 8; i++) {
            const scatterBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
            const scatterData = scatterBuffer.getChannelData(0);
            for (let j = 0; j < scatterBuffer.length; j++) {
                const env = Math.pow(1 - j / scatterBuffer.length, 2);
                scatterData[j] = (Math.random() * 2 - 1) * env;
            }
            const scatter = this.ctx.createBufferSource();
            const scatterGain = this.ctx.createGain();
            const scatterFilter = this.ctx.createBiquadFilter();
            scatter.buffer = scatterBuffer;
            scatterFilter.type = 'highpass';
            scatterFilter.frequency.value = 1500 + Math.random() * 1000;
            scatter.connect(scatterFilter);
            scatterFilter.connect(scatterGain);
            scatterGain.connect(this.sfxGain);

            const scatterTime = now + 0.3 + i * 0.15 + Math.random() * 0.1;
            scatterGain.gain.setValueAtTime(0, now);
            scatterGain.gain.setValueAtTime(0.12, scatterTime);
            scatterGain.gain.exponentialRampToValueAtTime(0.01, scatterTime + 0.12);
            scatter.start(scatterTime);
        }

        // Low rumble (disintegration)
        const rumbleOsc = this.ctx.createOscillator();
        const rumbleGain = this.ctx.createGain();
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(this.sfxGain);
        rumbleOsc.frequency.setValueAtTime(60, now);
        rumbleOsc.frequency.exponentialRampToValueAtTime(30, now + 2);
        rumbleGain.gain.setValueAtTime(0.2, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
        rumbleOsc.start(now);
        rumbleOsc.stop(now + 2);

        // Final fade-out sweep
        const sweepOsc = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweepOsc.type = 'sine';
        sweepOsc.connect(sweepGain);
        sweepGain.connect(this.sfxGain);
        sweepOsc.frequency.setValueAtTime(400, now + 1.5);
        sweepOsc.frequency.exponentialRampToValueAtTime(50, now + 3);
        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.setValueAtTime(0.15, now + 1.5);
        sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 3);
        sweepOsc.start(now + 1.5);
        sweepOsc.stop(now + 3);

        // Scattered pixel "plinks" (forming/disintegrating)
        for (let i = 0; i < 15; i++) {
            const plink = this.ctx.createOscillator();
            const plinkGain = this.ctx.createGain();
            plink.type = 'square';
            plink.connect(plinkGain);
            plinkGain.connect(this.sfxGain);

            const plinkTime = now + 0.5 + Math.random() * 2.5;
            const plinkFreq = 200 + Math.random() * 800;
            plink.frequency.setValueAtTime(plinkFreq, plinkTime);
            plink.frequency.exponentialRampToValueAtTime(plinkFreq * 0.3, plinkTime + 0.05);

            plinkGain.gain.setValueAtTime(0, now);
            plinkGain.gain.setValueAtTime(0.08, plinkTime);
            plinkGain.gain.exponentialRampToValueAtTime(0.01, plinkTime + 0.05);

            plink.start(plinkTime);
            plink.stop(plinkTime + 0.06);
        }
    },

    // Jetpack jump sound (dream world)
    playJetpackJump() {
        if (!this.ctx) return;
        this.resume();

        // Burst of air/thrust
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Noise that fades out
            const env = Math.pow(1 - i / bufferSize, 0.5);
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        noise.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        noise.start(this.ctx.currentTime);

        // Rising tone (thrust)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
        osc1.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.2);
        gain1.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc1.start(this.ctx.currentTime);
        osc1.stop(this.ctx.currentTime + 0.2);

        // High whistle (steam/air)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc2.start(this.ctx.currentTime);
        osc2.stop(this.ctx.currentTime + 0.15);
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
        if (!this.ctx) return;
        // Stop any existing music first
        if (this.musicPlaying) {
            this.stopMusic();
        }
        this.resume();
        this.restoreMusic(); // Restore volume in case it was muted
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

            // Schedule next loop (store timeout so we can cancel it)
            this.musicLoopTimeout = setTimeout(() => scheduleMusic(), (loopLength - 0.1) * 1000);
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
        // Cancel the loop timeout
        if (this.musicLoopTimeout) {
            clearTimeout(this.musicLoopTimeout);
            this.musicLoopTimeout = null;
        }
        // Mute music gain to stop any currently playing notes
        if (this.musicGain) {
            this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
    },

    // Restore music volume when restarting
    restoreMusic() {
        if (this.musicGain) {
            this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        }
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
        // Tile types: 0=floor, 1=wall, 2=portal, 3=goal, 4=key, 5=door, 6=exit, 7=room door, 8=water, 9=bridge, 10=locked door, 11=chest
        // LEVEL 1: Introduction - 40x40 expanded world with water puzzles
        1: {
            rooms: {
                // Room 0: Custom designed starting area with water maze, key at (27,26), locked door at (25,14)
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,1,1,1,1,0,8,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
                    [1,0,0,0,0,0,1,1,1,1,1,0,8,8,1,8,8,8,8,8,8,8,8,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,9,9,9,9,9,9,9,9,8,8,8,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,8,8,1,8,8,8,8,9,8,8,8,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,8,8,8,8,9,9,9,9,9,9,10,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,7,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
                    [1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,9,8,8,8,8,9,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,9,8,8,8,8,9,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,9,8,8,8,8,9,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,8,8,1,8,8,8,8,8,8,8,8,8,0,0,1,9,9,9,9,9,9,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,8,8,1,8,8,8,8,8,8,8,8,8,0,0,1,9,8,8,8,8,8,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,8,8,1,8,8,8,8,8,8,8,8,8,0,0,1,4,8,8,8,8,8,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,8,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,1,8,8,1,8,8,8,8,8,8,8,8,8,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,1,8,8,1,8,8,8,8,8,8,8,8,8,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,1,1,8,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,0,0,0,1,8,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,1,1,1,1,8,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Portal room - larger with more exploration
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 0, spawnX: 36, spawnY: 17 }  // Updated to spawn near room door at (37,17)
            }
        },
        // LEVEL 2: Lake crossing - 2 rooms with larger water areas (40x40)
        2: {
            rooms: {
                // Room 0: Expanded lake with winding bridge paths to key
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
                    [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1],
                    [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,4,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Expanded portal island with larger water area
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,2,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,6,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,9,9,9,9,9,9,9,9,9,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 0, spawnX: 34, spawnY: 24 }
            }
        },
        // LEVEL 3: Boss level - 3 rooms, challenging exploration (40x40)
        3: {
            rooms: {
                // Room 0: Expanded entry hall with water moats
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1],
                    [1,0,0,0,0,1,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,8,8,8,1,0,0,0,0,1],
                    [1,0,0,0,0,1,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,8,8,8,1,0,0,0,0,1],
                    [1,0,0,0,0,1,8,8,8,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,8,8,8,1,0,0,0,0,1],
                    [1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Expanded key chamber with water hazards
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 2: Expanded portal chamber with decorative water
                2: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 2, spawnX: 2, spawnY: 1 },
                2: { targetRoom: 1, spawnX: 34, spawnY: 13 }
            }
        },
        // LEVEL 4: Swamp maze - 2 rooms, Act 2 start (40x40)
        4: {
            rooms: {
                // Room 0: Expanded swamp with winding bridge maze
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,9,9,9,9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,4,0,0,0,1],
                    [1,0,0,0,0,0,0,0,9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,9,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Expanded portal clearing with larger island
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,2,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,6,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,9,9,9,9,9,9,9,9,9,9,9,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 0, spawnX: 34, spawnY: 20 }
            }
        },
        // LEVEL 5: Shadow fortress - 3 rooms (40x40)
        5: {
            rooms: {
                // Room 0: Expanded courtyard with water moats
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,9,9,9,4,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,9,9,9,9,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,9,9,9,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,9,9,9,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Expanded armory with bridge maze
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,1,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,1,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 2: Expanded portal throne room
                2: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,9,9,9,9,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,9,9,9,9,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,1],
                    [1,0,0,0,0,0,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 2, spawnX: 2, spawnY: 1 },
                2: { targetRoom: 1, spawnX: 34, spawnY: 13 }
            }
        },
        // LEVEL 6: Final boss - 3 rooms, epic finale (40x40)
        6: {
            rooms: {
                // Room 0: Void entrance - key on central platform surrounded by void water
                0: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,8,8,8,8,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,8,8,8,0,0,0,8,8,8,8,8,8,8,9,0,0,0,0,0,0,9,8,8,8,8,8,8,0,0,0,0,8,8,0,0,0,1],
                    [1,0,0,9,9,9,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,9,9,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 1: Key sanctum - spiral bridge maze to the second key
                1: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,1],
                    [1,0,0,8,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,8,8,8,8,8,8,8,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,8,8,8,8,8,8,8,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,0,0,0,4,0,0,0,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,0,0,0,0,0,0,0,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,0,0,0,0,0,0,0,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,8,8,8,8,9,9,9,8,8,8,8,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,8,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,0,10,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ],
                // Room 2: Final portal chamber - epic arena with portal and exit
                2: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,2,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,0,6,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,9,9,9,9,9,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,9,0,0,0,9,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,1],
                    [1,0,0,0,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            },
            doors: {
                0: { targetRoom: 1, spawnX: 2, spawnY: 1 },
                1: { targetRoom: 2, spawnX: 2, spawnY: 1 },
                2: { targetRoom: 1, spawnX: 34, spawnY: 26 }
            }
        }
    },
    dreamWorld: {
        // Level 1: Taller dream world with vertical platforming (20 rows tall, 60 wide)
        1: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
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
            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,6],
            [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,3,6],
            [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        // Level 4: Wider gaps, 15% harder than L1 (65 tiles wide)
        4: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        // Level 5: Vertical climbing section, 15% harder than L2 (75 tiles wide)
        5: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,3,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        // Level 6: Boss gauntlet - long run to Void Specter (90 tiles wide)
        6: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,6],
            [0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ]
    },
    // Enemy spawn positions per level - updated for 20x20 grid
    // Types: 'patrol' (back and forth), 'chase' (follows player UDLR)
    enemies: {
        real: {
            // Level 1: 2 rooms - 6 blue ghost patrols in room 0 covering ~35% of map
            1: [
                // Room 0: 6 patrol enemies spread across walkable areas
                { x: 15, y: 2, type: 'patrol', patrol: 'horizontal', range: 12, speed: 0.8, room: 0 },   // Top area
                { x: 3, y: 10, type: 'patrol', patrol: 'vertical', range: 10, speed: 0.85, room: 0 },   // Left corridor upper
                { x: 3, y: 28, type: 'patrol', patrol: 'vertical', range: 8, speed: 0.8, room: 0 },     // Left corridor lower
                { x: 20, y: 36, type: 'patrol', patrol: 'horizontal', range: 14, speed: 0.9, room: 0 }, // Bottom area
                { x: 32, y: 5, type: 'patrol', patrol: 'horizontal', range: 5, speed: 0.85, room: 0 },  // Upper right
                { x: 36, y: 22, type: 'patrol', patrol: 'vertical', range: 10, speed: 0.8, room: 0 },   // Right side
                // Room 1: 1 patrol enemy
                { x: 12, y: 8, type: 'patrol', patrol: 'horizontal', range: 3, speed: 0.9, room: 1 }
            ],
            // Level 2: Lake crossing - enemies guard the bridges
            2: [
                { x: 3, y: 16, type: 'patrol', patrol: 'horizontal', range: 4, speed: 0.9, room: 0 },
                { x: 16, y: 16, type: 'chase', speed: 0.4, room: 0 },
                { x: 6, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.0, room: 1, variant: 'shadow' }
            ],
            // Level 3: Boss level - 3 rooms with increasing difficulty
            3: [
                { x: 3, y: 14, type: 'patrol', patrol: 'horizontal', range: 4, speed: 0.9, room: 0 },
                { x: 15, y: 14, type: 'chase', speed: 0.45, room: 0 },
                { x: 5, y: 14, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.0, room: 1, variant: 'shadow' },
                { x: 14, y: 14, type: 'chase', speed: 0.5, room: 1 },
                { x: 8, y: 14, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.1, room: 2, variant: 'shadow' }
            ],
            // Level 4: Swamp maze - bridge patrol enemies
            4: [
                { x: 17, y: 16, type: 'patrol', patrol: 'vertical', range: 3, speed: 0.92, room: 0 },
                { x: 3, y: 16, type: 'chase', speed: 0.46, room: 0 },
                { x: 10, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.0, room: 1 }
            ],
            // Level 5: Shadow fortress - 3 rooms with shadows
            5: [
                { x: 10, y: 10, type: 'chase', speed: 0.46, room: 0 },
                { x: 10, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.15, room: 1, variant: 'shadow' },
                { x: 5, y: 14, type: 'chase', speed: 0.5, room: 1 },
                { x: 10, y: 10, type: 'patrol', patrol: 'vertical', range: 3, speed: 1.2, room: 2, variant: 'shadow' }
            ],
            // Level 6: Final boss - 3 rooms, tough enemies
            6: [
                { x: 10, y: 10, type: 'chase', speed: 0.5, room: 0, variant: 'shadow' },
                { x: 10, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.2, room: 1, variant: 'shadow' },
                { x: 5, y: 14, type: 'chase', speed: 0.5, room: 1, variant: 'shadow' },
                { x: 10, y: 10, type: 'chase', speed: 0.58, room: 2, variant: 'shadow' },
                { x: 8, y: 14, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.38, room: 2, variant: 'shadow' }
            ]
        },
        dream: {
            1: [
                { x: 20, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 },
                { x: 40, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2 }
            ],
            2: [
                { x: 15, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.4 },
                { x: 35, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.2, variant: 'shadow' },
                { x: 55, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.6 }
            ],
            3: [
                // Level 3 dream world is the BOSS ARENA - fewer regular enemies
                { x: 12, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.6, variant: 'shadow' },
                { x: 28, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.4, variant: 'shadow' }
            ],
            // Level 4: 15% harder than L1
            4: [
                { x: 18, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.38 },
                { x: 35, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.38 },
                { x: 50, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.5 }
            ],
            // Level 5: 15% harder than L2, introduces Void Orbs
            5: [
                { x: 15, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.61 },
                { x: 30, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.38, variant: 'shadow' },
                { x: 45, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.84, variant: 'shadow' },
                { x: 60, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.61 },
                { x: 50, y: 5, type: 'voidorb', patrol: 'horizontal', range: 3, speed: 0.5 }
            ],
            // Level 6: Boss gauntlet - all shadows + void orbs
            6: [
                { x: 15, y: 10, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.84, variant: 'shadow' },
                { x: 35, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.61, variant: 'shadow' },
                { x: 55, y: 10, type: 'patrol', patrol: 'horizontal', range: 4, speed: 1.84, variant: 'shadow' },
                { x: 25, y: 4, type: 'voidorb', patrol: 'horizontal', range: 4, speed: 0.5 },
                { x: 50, y: 4, type: 'voidorb', patrol: 'horizontal', range: 3, speed: 0.6 }
            ]
        }
    },
    // Boss levels - which levels have a boss
    bossLevels: [3, 6] // Level 3 has mini-boss, Level 6 has final boss
};

// ============================================
// LEVELS
// ============================================

const Levels = {
    current: 1,
    maxLevel: 6,
    realWorld: null,
    realWorldRooms: {}, // Store all rooms for current level
    doorConnections: {}, // Store door connection info
    dreamWorld: null,

    loadLevel(num) {
        this.current = num;
        // Load all real world rooms for this level
        const template = LevelTemplates.realWorld[num];
        if (template.rooms) {
            // Multi-room level
            this.realWorldRooms = {};
            for (const roomId in template.rooms) {
                this.realWorldRooms[roomId] = JSON.parse(JSON.stringify(template.rooms[roomId]));
            }
            this.realWorld = this.realWorldRooms[0]; // Start in room 0
            this.doorConnections = template.doors || {};
        } else {
            // Legacy single-room level
            this.realWorld = JSON.parse(JSON.stringify(template));
            this.realWorldRooms = { 0: this.realWorld };
            this.doorConnections = {};
        }
        this.dreamWorld = JSON.parse(JSON.stringify(LevelTemplates.dreamWorld[num]));
        GameState.currentRoom = 0;
    },

    switchRoom(roomId) {
        if (this.realWorldRooms[roomId]) {
            this.realWorld = this.realWorldRooms[roomId];
            GameState.currentRoom = roomId;
            return true;
        }
        return false;
    },

    getDoorConnection(fromRoom) {
        return this.doorConnections[fromRoom] || null;
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
    currentRoom: 0, // Track which room player is in (0 = main, 1 = portal room)
    inventory: [],
    keysPressed: {},
    portalCooldown: 0,
    cameraX: 0,
    nearDoor: null,
    health: 3,
    maxHealth: 5, // Can grow up to 5 hearts
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
    shieldTimer: 0,     // Active shield countdown
    // Boss system
    boss: null,         // Current boss object
    bossDefeated: {},   // Track defeated bosses by level
    bossUnlocked: false, // True after reaching dream goal on boss level
    // Life system
    lives: 2,           // Extra lives (2 = 3 total chances per level)
    // Message system
    messageText: '',    // Current message to display
    messageTimer: 0,    // How long to show message
    // Game over system
    gameOver: false,    // True when showing game over screen
    gameOverTimer: 0,   // Animation timer for game over
    // Shop system
    coins: 0,           // Currency for shop
    shopSelection: 0,   // Current shop menu selection
    inShop: false,      // True when in shop screen
    shieldHits: 0,      // Remaining shield hits (multi-hit shields)
    hasCrystalArmor: false, // Crystal Armor from dream world chest - 50% damage reduction
    // Title screen
    titleSelection: 0,  // 0 = Start from Level 1, 1 = Start from Level 4
    act1Complete: false // True after beating level 3 boss (persisted)
};

// Load act1 completion from localStorage
try {
    GameState.act1Complete = localStorage.getItem('dreamworld_act1') === 'true';
} catch (e) {}

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
        // Arrow keys to select option
        if (e.code === 'ArrowUp') {
            GameState.titleSelection = (GameState.titleSelection - 1 + 3) % 3;
            Audio8Bit.init();
            Audio8Bit.playPickup();
            e.preventDefault();
            return;
        }
        if (e.code === 'ArrowDown') {
            GameState.titleSelection = (GameState.titleSelection + 1) % 3;
            Audio8Bit.init();
            Audio8Bit.playPickup();
            e.preventDefault();
            return;
        }
        if (e.code === 'Enter' || e.code === 'Space') {
            GameState.screenState = 'playing';
            Audio8Bit.init();
            Audio8Bit.startMusic();
            // Level 4 start
            if (GameState.titleSelection === 1) {
                Levels.loadLevel(4);
                GameState.bossDefeated[3] = true;
                GameState.coins = 200;
                Player.init();
                spawnEnemies();
                updateUI();
            }
            // Level 6 start (DEBUG)
            if (GameState.titleSelection === 2) {
                Levels.loadLevel(6);
                GameState.bossDefeated[3] = true;
                GameState.bossDefeated[5] = true;
                GameState.coins = 500;
                GameState.health = 5;
                GameState.maxHealth = 5;
                Player.init();
                spawnEnemies();
                updateUI();
            }
            e.preventDefault();
        }
        return;
    }

    // Handle pause menu input
    if (GameState.screenState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
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

    // Handle shop input
    if (GameState.inShop) {
        const itemCount = ShopItems.length;
        if (e.code === 'ArrowUp') {
            GameState.shopSelection = (GameState.shopSelection - 1 + itemCount) % itemCount;
            Audio8Bit.playPickup();
        } else if (e.code === 'ArrowDown') {
            GameState.shopSelection = (GameState.shopSelection + 1) % itemCount;
            Audio8Bit.playPickup();
        } else if (e.code === 'Enter' || e.code === 'Space') {
            buyShopItem();
        }
        e.preventDefault();
        return;
    }

    // Toggle pause during gameplay (ESC or P)
    if ((e.code === 'Escape' || e.code === 'KeyP') && GameState.screenState === 'playing') {
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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'KeyC', 'Digit1', 'Digit2', 'Digit3', 'KeyZ', 'KeyP', 'Escape'].includes(e.code)) {
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
    GameState.maxHealth = 3; // Reset to starting hearts
    GameState.lives = 2;
    GameState.score = 0;
    GameState.coins = 0; // Reset shop currency
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
    GameState.shieldHits = 0;
    GameState.boss = null;
    GameState.bossDefeated = {};
    GameState.bossUnlocked = false;
    GameState.inShop = false;
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
    facingDir: 'down', // Cardinal direction: 'up', 'down', 'left', 'right'
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
        this.facingDir = 'down';
        this.facing = 1;
        this.facingY = 1;
    },

    update() {
        if (GameState.portalCooldown > 0) GameState.portalCooldown--;
        if (GameState.invincible > 0) GameState.invincible--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.meleeCooldown > 0) this.meleeCooldown--;
        if (this.meleeActive > 0) this.meleeActive--;
        if (GameState.powerBoostTimer > 0) GameState.powerBoostTimer--;
        if (GameState.shieldTimer > 0) GameState.shieldTimer--;
        if (GameState.messageTimer > 0) GameState.messageTimer--;

        if (GameState.currentWorld === 'real') {
            this.updateTopDown();
        } else {
            this.updateSideScroller();
            this.updateCamera();
        }

        // Charged shooting - hold X key (disabled during level complete)
        if (GameState.keysPressed['KeyX'] && !GameState.gameComplete) {
            this.chargeTime++;
            if (this.chargeTime >= 10) { // Start showing charge after 10 frames
                this.isCharging = true;
                Audio8Bit.startChargeSound();
            }
            // Update charge sound intensity
            if (this.isCharging) {
                const chargeLevel = Math.min(this.chargeTime / 45, 1);
                Audio8Bit.updateChargeSound(chargeLevel);
            }
        } else if (this.chargeTime > 0) {
            // Released X - fire based on charge level
            Audio8Bit.stopChargeSound();
            if (this.shootCooldown <= 0) {
                const charged = this.chargeTime >= 45; // ~0.75 seconds for full charge
                this.shoot(charged);
            }
            this.chargeTime = 0;
            this.isCharging = false;
        }

        // Melee attack - C key (disabled during level complete)
        if (consumeKeyPress('KeyC') && this.meleeCooldown <= 0 && !GameState.gameComplete) {
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

        // Check regular enemies
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            if (enemy.world !== GameState.currentWorld) continue;
            if (enemy.meleeHit) continue; // Already hit by this swing

            const enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

            if (rectsOverlap(meleeRect, enemyRect)) {
                // Mark as hit so we don't hit again this swing
                enemy.meleeHit = true;

                // Melee does 1 damage + melee bonus points
                if (damageEnemy(enemy, 1, i)) {
                    // Enemy died - add melee bonus
                    GameState.score += 50;
                    updateUI();
                }
            }
        }

        // Check boss
        if (GameState.boss && GameState.boss.active && GameState.currentWorld === GameState.boss.world) {
            const boss = GameState.boss;
            if (!boss.meleeHit) {
                const bossRect = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
                if (rectsOverlap(meleeRect, bossRect)) {
                    boss.meleeHit = true;
                    damageBoss(1);
                }
            }
        }
    },

    updateTopDown() {
        if (this.isMoving) {
            // Power boost increases speed by 50%!
            const speed = (GameState.powerBoostTimer > 0 ? this.moveSpeed * 1.5 : this.moveSpeed) * GAME_SPEED;
            this.moveProgress += speed;
            if (this.moveProgress >= 1) {
                this.finishMove();
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 2 - this.startX) * this.moveProgress;
                this.y = this.startY + (this.targetGridY * TILE_SIZE + 2 - this.startY) * this.moveProgress;
            }
        } else {
            let dx = 0, dy = 0;
            let moveKey = null;

            // Check each direction with tap/hold logic - turn and move together in real world
            if (canMoveWithKey('ArrowUp') || canMoveWithKey('KeyW')) {
                dy = -1; this.facingY = -1; this.facingDir = 'up';
                moveKey = GameState.keysPressed['ArrowUp'] ? 'ArrowUp' : 'KeyW';
            } else if (canMoveWithKey('ArrowDown') || canMoveWithKey('KeyS')) {
                dy = 1; this.facingY = 1; this.facingDir = 'down';
                moveKey = GameState.keysPressed['ArrowDown'] ? 'ArrowDown' : 'KeyS';
            } else if (canMoveWithKey('ArrowLeft') || canMoveWithKey('KeyA')) {
                dx = -1; this.facing = -1; this.facingY = 0; this.facingDir = 'left';
                moveKey = GameState.keysPressed['ArrowLeft'] ? 'ArrowLeft' : 'KeyA';
            } else if (canMoveWithKey('ArrowRight') || canMoveWithKey('KeyD')) {
                dx = 1; this.facing = 1; this.facingY = 0; this.facingDir = 'right';
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
            this.jumpPhase += 0.025 * GAME_SPEED;

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
            this.fallSpeed += 0.008 * GAME_SPEED;
            this.y += this.fallSpeed * TILE_SIZE * GAME_SPEED;

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
            // Power boost increases speed by 50%!
            const speed = (GameState.powerBoostTimer > 0 ? this.moveSpeed * 1.5 : this.moveSpeed) * GAME_SPEED;
            this.moveProgress += speed;
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

        // Input with tap/hold logic - turn first, then move
        let moveKey = null;
        let desiredFacing = null;

        if (canMoveWithKey('ArrowLeft') || canMoveWithKey('KeyA')) {
            desiredFacing = -1;
            moveKey = GameState.keysPressed['ArrowLeft'] ? 'ArrowLeft' : 'KeyA';
        } else if (canMoveWithKey('ArrowRight') || canMoveWithKey('KeyD')) {
            desiredFacing = 1;
            moveKey = GameState.keysPressed['ArrowRight'] ? 'ArrowRight' : 'KeyD';
        }

        if (desiredFacing !== null && moveKey) {
            if (this.facing !== desiredFacing) {
                // Just turn to face the new direction, don't move
                this.facing = desiredFacing;
                this.facingDir = desiredFacing === -1 ? 'left' : 'right';
                markKeyMoved(moveKey);
            } else {
                // Already facing this direction, try to move
                if (this.tryMoveSide(desiredFacing, tiles)) {
                    markKeyMoved(moveKey);
                }
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
            // Power boost increases speed by 50%!
            const speed = (GameState.powerBoostTimer > 0 ? this.moveSpeed * 1.5 : this.moveSpeed) * GAME_SPEED;
            this.moveProgress += speed;
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

        // Locked door (10) - try to unlock with Golden Key
        if (tile === 10) {
            if (GameState.inventory.includes('Golden Key')) {
                tiles[newY][newX] = 7; // Unlock to regular room door
                GameState.inventory.splice(GameState.inventory.indexOf('Golden Key'), 1);
                Audio8Bit.playPickup();
                showMessage('Door unlocked!', 90);
                updateUI();
            } else {
                showMessage('Locked! Need a Golden Key', 60);
            }
            return false;
        }

        // Block: wall(1), locked goal(3), water(8)
        if (tile !== 1 && tile !== 3 && tile !== 8) {
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
        // Block: wall(1), locked goal(3), water(8), locked door(10)
        if (tile === 1 || tile === 3 || tile === 8 || tile === 10) return false;

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

        // Jump 2 tiles up - can pass through platforms from below (one-way platforms)
        let targetY = Math.max(0, this.gridY - 2);

        // Only check for actual ceiling/wall blocks, not floating platforms
        // A platform is "floating" if there's empty space below it
        for (let y = this.gridY - 1; y >= targetY; y--) {
            if (y >= 0 && tiles[y] && tiles[y][this.gridX] === 1) {
                // Check if this is a solid ceiling (has solid below it) vs floating platform
                const hasGroundBelow = y + 1 < tiles.length && tiles[y + 1] && tiles[y + 1][this.gridX] === 1;
                if (hasGroundBelow) {
                    // This is part of a solid structure, block here
                    targetY = y + 1;
                    break;
                }
                // Otherwise it's a floating platform - can jump through!
            }
        }

        if (targetY < this.gridY) {
            this.isJumping = true;
            this.jumpPhase = 0;
            this.startY = this.y;
            this.targetGridY = targetY;
            Audio8Bit.playJetpackJump();
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

        // Multi-hit shield blocks damage
        if (GameState.shieldTimer > 0 && GameState.shieldHits > 0) {
            GameState.shieldHits--;
            if (GameState.shieldHits <= 0) {
                GameState.shieldTimer = 0; // Shield depleted
            }
            GameState.invincible = 60; // Doubled for high refresh
            Audio8Bit.playHit(); // Feedback for shield absorbing hit
            updateUI();
            return;
        }

        // Crystal Armor: 50% chance to block damage
        if (GameState.hasCrystalArmor && Math.random() < 0.5) {
            GameState.invincible = 60; // Brief invincibility
            Audio8Bit.playHit(); // Armor absorbed the hit
            return;
        }

        GameState.health--;
        GameState.invincible = 120; // 1 second invincibility (doubled for high refresh)
        Audio8Bit.playDamage();
        if (GameState.health <= 0) {
            // Player died - check lives
            if (GameState.lives > 0) {
                // Use a life and respawn in current level
                GameState.lives--;
                GameState.health = GameState.maxHealth;
                GameState.inventory = [];
                GameState.drops = [];
                GameState.projectiles = [];
                Levels.loadLevel(Levels.current);
                spawnEnemies();
                this.init();
                GameState.cameraX = 0;

                // Reset boss HP if boss exists (but keep unlocked status)
                if (GameState.boss) {
                    GameState.boss.hp = GameState.boss.maxHp;
                    GameState.boss.phase = 1;
                    GameState.boss.speed = 1.5;
                    GameState.boss.hitFlash = 0;
                }
            } else {
                // Game over - trigger game over screen
                GameState.gameOver = true;
                GameState.gameOverTimer = 0;
                Audio8Bit.playGameOver();
            }
        }
        updateUI();
    },

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        const isReal = GameState.currentWorld === 'real';
        const cam = isReal ? RealCamera : DreamCamera;
        const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;
        const vpWidth = isReal ? REAL_VIEWPORT_WIDTH : DREAM_VIEWPORT_WIDTH;
        const vpHeight = isReal ? REAL_VIEWPORT_HEIGHT : DREAM_VIEWPORT_HEIGHT;

        // Apply camera offset + viewport offset
        const drawX = this.x - cam.x;
        const drawY = this.y - cam.y + yOffset;

        // Don't draw if off screen
        if (!cam.isVisible(this.x, this.y, this.width, this.height)) return;

        // Flash when invincible
        if (GameState.invincible > 0 && Math.floor(GameState.invincible / 4) % 2 === 0) return;

        const bodyColor = isReal ? '#4488ff' : '#ff6688';
        const shoeColor = '#aa2222';
        const skinColor = '#ffcc99';

        ctx.save();
        // Clip to current world's viewport
        ctx.beginPath();
        ctx.rect(0, yOffset, vpWidth, vpHeight);
        ctx.clip();

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

        // Draw sword slash effect
        if (this.meleeActive > 0) {
            const swingProgress = 1 - (this.meleeActive / 10);
            const slashRadius = 22 + swingProgress * 8;

            // Determine slash position and angle based on facing
            let slashX, slashY, startAngle, endAngle;
            if (isReal) {
                if (this.facingY === -1) {
                    slashX = drawX + this.width / 2;
                    slashY = drawY - 5;
                    startAngle = Math.PI * 1.3 - swingProgress * 0.8;
                    endAngle = Math.PI * 1.7 + swingProgress * 0.8;
                } else if (this.facingY === 1) {
                    slashX = drawX + this.width / 2;
                    slashY = drawY + this.height + 5;
                    startAngle = -Math.PI * 0.3 - swingProgress * 0.8;
                    endAngle = Math.PI * 0.3 + swingProgress * 0.8;
                } else if (this.facing === -1) {
                    slashX = drawX - 5;
                    slashY = drawY + this.height / 2;
                    startAngle = Math.PI * 0.8 - swingProgress * 0.8;
                    endAngle = Math.PI * 1.2 + swingProgress * 0.8;
                } else {
                    slashX = drawX + this.width + 5;
                    slashY = drawY + this.height / 2;
                    startAngle = -Math.PI * 0.2 - swingProgress * 0.8;
                    endAngle = Math.PI * 0.2 + swingProgress * 0.8;
                }
            } else {
                if (this.facing === -1) {
                    slashX = drawX - 5;
                    slashY = drawY + this.height / 2;
                    startAngle = Math.PI * 0.8 - swingProgress * 0.8;
                    endAngle = Math.PI * 1.2 + swingProgress * 0.8;
                } else {
                    slashX = drawX + this.width + 5;
                    slashY = drawY + this.height / 2;
                    startAngle = -Math.PI * 0.2 - swingProgress * 0.8;
                    endAngle = Math.PI * 0.2 + swingProgress * 0.8;
                }
            }

            // Slash trail (multiple layers for motion blur)
            for (let i = 3; i >= 0; i--) {
                const trailProgress = swingProgress - i * 0.08;
                if (trailProgress < 0) continue;
                const trailAlpha = (0.6 - swingProgress * 0.5) * (1 - i * 0.25);
                const trailRadius = slashRadius - i * 2;

                ctx.strokeStyle = isReal ? `rgba(136, 200, 255, ${trailAlpha})` : `rgba(255, 170, 136, ${trailAlpha})`;
                ctx.lineWidth = 4 - i;
                ctx.beginPath();
                ctx.arc(slashX, slashY, trailRadius, startAngle + i * 0.1, endAngle - i * 0.1);
                ctx.stroke();
            }

            // Main slash arc
            ctx.strokeStyle = isReal ? '#ffffff' : '#ffddaa';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.9 - swingProgress * 0.7;
            ctx.beginPath();
            ctx.arc(slashX, slashY, slashRadius, startAngle, endAngle);
            ctx.stroke();

            // Slash sparkles
            if (swingProgress < 0.5) {
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 3; i++) {
                    const sparkAngle = startAngle + (endAngle - startAngle) * (i / 2);
                    const sparkX = slashX + Math.cos(sparkAngle) * slashRadius;
                    const sparkY = slashY + Math.sin(sparkAngle) * slashRadius;
                    const sparkSize = 2 + Math.random() * 2;
                    ctx.globalAlpha = 0.8 - swingProgress * 1.5;
                    ctx.fillRect(sparkX - sparkSize/2, sparkY - sparkSize/2, sparkSize, sparkSize);
                }
            }

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
    const currentRoom = GameState.currentRoom;

    if (enemyData) {
        enemyData.forEach((e, index) => {
            // Skip if this enemy was already killed
            if (killedIndices.includes(index)) return;

            // For real world with rooms, only spawn enemies for current room
            if (world === 'real' && e.room !== undefined && e.room !== currentRoom) return;

            // Determine HP based on enemy variant (shadow = 2 HP, normal = 1 HP)
            const variant = e.variant || 'normal';
            const hp = variant === 'shadow' ? 2 : 1;

            // Void orbs are slightly smaller and have shooting capability
            const isVoidOrb = e.type === 'voidorb';
            const enemyWidth = isVoidOrb ? 20 : 22;
            const enemyHeight = isVoidOrb ? 20 : 22;
            const enemyHp = isVoidOrb ? 2 : hp; // Void orbs have 2 HP

            GameState.enemies.push({
                x: e.x * TILE_SIZE + 2,
                y: e.y * TILE_SIZE + 2,
                startX: e.x * TILE_SIZE + 2,
                startY: e.y * TILE_SIZE + 2,
                width: enemyWidth,
                height: enemyHeight,
                type: e.type || 'patrol',
                variant: isVoidOrb ? 'voidorb' : variant, // 'normal', 'shadow', or 'voidorb'
                hp: enemyHp,
                maxHp: enemyHp,
                patrol: e.patrol || 'horizontal',
                range: (e.range || 2) * TILE_SIZE,
                speed: e.speed || 1.0,
                direction: 1,
                chaseAxis: 'x', // For chase enemies: which axis to move on
                world: world,
                templateIndex: index, // Track which template enemy this is
                shootTimer: isVoidOrb ? 180 : 0, // Void orbs shoot every 3 seconds
                shootCooldown: 180, // 3 second cooldown
                plasmaPhase: Math.random() * Math.PI * 2 // For animation
            });
        });
    }
}

// Damage an enemy and handle death
function damageEnemy(enemy, damage, index) {
    // Power boost doubles damage!
    const actualDamage = GameState.powerBoostTimer > 0 ? damage * 2 : damage;
    enemy.hp -= actualDamage;
    enemy.hitFlash = 10; // Flash white for 10 frames

    if (enemy.hp <= 0) {
        // Track kill
        const worldKey = GameState.currentWorld === 'real' ? 'real' : 'dream';
        if (!GameState.killedEnemies[worldKey][Levels.current]) {
            GameState.killedEnemies[worldKey][Levels.current] = [];
        }
        if (!GameState.killedEnemies[worldKey][Levels.current].includes(enemy.templateIndex)) {
            GameState.killedEnemies[worldKey][Levels.current].push(enemy.templateIndex);
        }

        // Award points based on enemy type and variant
        let points = enemy.type === 'chase' ? 150 : 100;
        if (enemy.variant === 'shadow') points += 100; // Bonus for shadow enemies
        GameState.score += points;
        GameState.coins += Math.floor(points / 10); // Coins from kills

        // Spawn drop
        spawnDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type);

        GameState.enemies.splice(index, 1);
        Audio8Bit.playHit();
        updateUI();
        return true; // Enemy died
    } else {
        Audio8Bit.playHit();
        return false; // Enemy still alive
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
                    nextX = enemy.x + Math.sign(dx) * enemy.speed * GAME_SPEED;
                } else if (absDy > 5) {
                    nextY = enemy.y + Math.sign(dy) * enemy.speed * GAME_SPEED;
                    enemy.chaseAxis = 'y';
                } else if (absDx > 5) {
                    nextX = enemy.x + Math.sign(dx) * enemy.speed * GAME_SPEED;
                    enemy.chaseAxis = 'x';
                }
            }
        } else if (enemy.patrol === 'horizontal') {
            nextX = enemy.x + enemy.speed * enemy.direction * GAME_SPEED;
        } else if (enemy.patrol === 'vertical') {
            nextY = enemy.y + enemy.speed * enemy.direction * GAME_SPEED;
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

        // Void orb shooting behavior
        if (enemy.type === 'voidorb') {
            enemy.plasmaPhase += 0.05; // Animate plasma
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0) {
                // Shoot a slow dark orb at player
                const centerX = enemy.x + enemy.width / 2;
                const centerY = enemy.y + enemy.height / 2;
                const dx = Player.x + Player.width/2 - centerX;
                const dy = Player.y + Player.height/2 - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const speed = 1.5; // Very slow projectile

                GameState.projectiles.push({
                    x: centerX,
                    y: centerY,
                    vx: (dx / dist) * speed,
                    vy: (dy / dist) * speed,
                    isEnemyProjectile: true,
                    isDarkOrb: true,
                    life: 240, // 4 seconds lifetime
                    isSmallOrb: true // Smaller visual
                });

                enemy.shootTimer = enemy.shootCooldown;
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
    const isReal = GameState.currentWorld === 'real';
    const cam = isReal ? RealCamera : DreamCamera;
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;

    GameState.enemies.forEach(enemy => {
        if (enemy.world !== GameState.currentWorld) return;

        // Skip if not visible
        if (!cam.isVisible(enemy.x, enemy.y, enemy.width, enemy.height)) return;

        // Apply camera offset + viewport offset
        const drawX = enemy.x - cam.x;
        const drawY = enemy.y - cam.y + yOffset;

        // Decrement hit flash
        if (enemy.hitFlash > 0) enemy.hitFlash--;

        const centerX = drawX + enemy.width / 2;
        const centerY = drawY + enemy.height / 2;

        // Void Orb - mini plasma ball like the boss
        if (enemy.variant === 'voidorb') {
            const time = enemy.plasmaPhase || 0;
            const radius = 8;

            // Hit flash override
            if (enemy.hitFlash > 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
                ctx.fill();
                return;
            }

            // Outer glow
            ctx.fillStyle = 'rgba(75, 0, 130, 0.4)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
            ctx.fill();

            // Core plasma ball
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, '#ff44ff');
            gradient.addColorStop(0.4, '#9900ff');
            gradient.addColorStop(0.8, '#4b0082');
            gradient.addColorStop(1, '#1a0033');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // 4 mini electric tentacles
            ctx.strokeStyle = '#cc66ff';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + time;
                const len = 8 + Math.sin(time * 2 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                // Add some jitter for electric effect
                const midX = centerX + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 2;
                const midY = centerY + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 2;
                const endX = centerX + Math.cos(angle) * len;
                const endY = centerY + Math.sin(angle) * len;
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Inner bright core
            ctx.fillStyle = 'rgba(255, 200, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(centerX - 2, centerY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const radius = 9;
        const waveTime = Date.now() * 0.01;
        const isReal = GameState.currentWorld === 'real';
        const isShadow = enemy.variant === 'shadow';

        // Determine colors based on variant
        let ghostColor, highlightColor, eyeColor, pupilColor;
        if (enemy.hitFlash > 0) {
            // Flash white when hit
            ghostColor = '#fff';
            highlightColor = '#fff';
        } else if (isShadow) {
            // Shadow ghost - dark and menacing
            ghostColor = '#1a1a2e';
            highlightColor = '#2d2d44';
        } else {
            // Normal ghost
            ghostColor = isReal ? '#4488ff' : '#cc44ff';
            highlightColor = isReal ? '#77aaff' : '#dd77ff';
        }

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

        // Shadow ghost dark aura effect
        if (isShadow && enemy.hitFlash <= 0) {
            ctx.strokeStyle = '#ff0044';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff0044';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Lighter inner highlight (skip if flashing)
        if (enemy.hitFlash <= 0) {
            ctx.fillStyle = highlightColor;
            ctx.beginPath();
            ctx.arc(centerX - 2, centerY - 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eyes
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

        if (isShadow && enemy.hitFlash <= 0) {
            // Shadow ghost - glowing red eyes
            ctx.fillStyle = '#ff0044';
            ctx.shadowColor = '#ff0044';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(centerX - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Dark pupils
            ctx.fillStyle = '#330011';
            ctx.beginPath();
            ctx.arc(centerX - eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normal ghost eyes - white with blue pupils
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(centerX - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2233aa';
            ctx.beginPath();
            ctx.arc(centerX - eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffsetX + lookX, eyeY + lookY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ============================================
// BOSS SYSTEM
// ============================================

// Boss templates - can add more bosses for different levels
const BossTemplates = {
    3: { // Level 3 mini-boss
        name: 'Nightmare Kuriboh',
        hp: 20,
        width: 44,  // About 2x ghost size (ghost is 22px)
        height: 44,
        world: 'real', // Boss appears in real world - more room to fight!
        speed: 0.8,  // Nerfed: slower base speed (was 1.5)
        patterns: ['roam', 'charge'],
        spawnX: 10, // Center of real world grid
        spawnY: 10,
        type: 'kuriboh'
    },
    6: { // Level 6 final boss - Void Specter (PUMPED UP!)
        name: 'Void Specter',
        hp: 30, // Back to 30!
        width: 50,
        height: 50,
        world: 'dream', // Boss appears in dream world!
        speed: 0, // Doesn't move traditionally - teleports!
        patterns: ['teleport', 'shoot', 'shield', 'burst'],
        spawnX: 75, // Near end of dream world level 6
        spawnY: 5,  // Mid-height
        type: 'specter',
        teleportCooldown: 360, // 6 seconds between teleports
        shootCooldown: 240,   // 4 seconds between shots
        shieldCooldown: 960,  // 16 seconds between shield phases
        burstCooldown: 600    // 10 seconds between electric bursts
    }
};

function spawnBoss(level) {
    const template = BossTemplates[level];
    if (!template) return false;

    // Check if already defeated
    if (GameState.bossDefeated[level]) return false;

    GameState.boss = {
        active: true,
        level: level,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        x: template.spawnX * TILE_SIZE,
        y: template.spawnY * TILE_SIZE,
        width: template.width,
        height: template.height,
        world: template.world,
        speed: template.speed,
        type: template.type || 'kuriboh',
        moveDir: 'right', // UDLR movement direction
        pattern: 'roam', // Top-down roaming pattern for real world
        patternTimer: 0,
        dirChangeTimer: 0, // Timer for changing direction
        hitFlash: 0,
        meleeHit: false,
        animFrame: 0,
        animTimer: 0,
        attackCooldown: 0,
        phase: 1, // Boss gets harder at lower HP
        // Specter-specific properties
        teleportTimer: template.teleportCooldown || 180,
        teleportCooldown: template.teleportCooldown || 180,
        shootTimer: template.shootCooldown || 60,
        shootCooldown: template.shootCooldown || 60,
        tentacles: [], // Electric tentacle positions
        plasmaPhase: 0, // For plasma animation
        // NEW: Shield phase properties
        shieldTimer: template.shieldCooldown || 480,
        shieldCooldown: template.shieldCooldown || 480,
        isShielded: false,
        shieldChargeTime: 0,
        // NEW: Electric burst properties
        burstTimer: template.burstCooldown || 300,
        burstCooldown: template.burstCooldown || 300,
        burstActive: 0, // Frames of active burst
        // NEW: Damage tracking for revenge teleport
        recentDamage: 0,
        damageTimer: 0
    };

    // Initialize tentacles for Void Specter
    if (template.type === 'specter') {
        for (let i = 0; i < 8; i++) {
            GameState.boss.tentacles.push({
                angle: (i / 8) * Math.PI * 2,
                length: 20 + Math.random() * 15,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    return true;
}

function damageBoss(damage) {
    if (!GameState.boss || !GameState.boss.active) return;

    const boss = GameState.boss;

    // Void Specter: Shield blocks all damage!
    if (boss.type === 'specter' && boss.isShielded) {
        Audio8Bit.playHit(); // Clang sound but no damage
        return;
    }

    // Power boost doubles damage!
    const actualDamage = GameState.powerBoostTimer > 0 ? damage * 2 : damage;
    boss.hp -= actualDamage;
    boss.hitFlash = 15;

    // Void Specter: Track recent damage for revenge teleport
    if (boss.type === 'specter') {
        boss.recentDamage += actualDamage;
        boss.damageTimer = 120; // 1 second window (doubled for high refresh)
    }

    // Phase transitions at HP thresholds
    if (boss.hp <= boss.maxHp * 0.3 && boss.phase < 3) {
        boss.phase = 3;
        boss.speed = 1.4;
    } else if (boss.hp <= boss.maxHp * 0.6 && boss.phase < 2) {
        boss.phase = 2;
        boss.speed = 1.1;
    }

    if (boss.hp <= 0) {
        // Boss defeated!
        GameState.bossDefeated[boss.level] = true;
        GameState.score += 1000 * boss.level;
        GameState.coins += 100 * boss.level; // Big coin bonus from boss
        Audio8Bit.playPickup();

        // Unlock act 2 after beating level 3 boss
        if (boss.level === 3 && !GameState.act1Complete) {
            GameState.act1Complete = true;
            try { localStorage.setItem('dreamworld_act1', 'true'); } catch (e) {}
        }

        // Big reward drops
        for (let i = 0; i < 5; i++) {
            spawnDrop(boss.x + boss.width/2 + (Math.random()-0.5)*40,
                      boss.y + boss.height/2 + (Math.random()-0.5)*40, 'boss');
        }

        GameState.boss = null;
        updateUI();
    } else {
        Audio8Bit.playHit();
    }
}

// Void Specter boss - teleports and shoots dark orbs
function updateVoidSpecter(boss) {
    const tiles = Levels.getDream();

    // Update plasma animation
    boss.plasmaPhase += 0.1;

    // Update tentacle animations
    for (const tentacle of boss.tentacles) {
        tentacle.phase += 0.15;
        tentacle.length = 20 + Math.sin(tentacle.phase) * 10;
    }

    // Phase-based timing adjustments (nerfed - less aggressive scaling)
    let teleportMod = 1;
    let shootMod = 1;
    let projectileCount = 1;

    if (boss.phase >= 3) {
        teleportMod = 0.75;  // Teleport 1.33x faster (was 2x)
        shootMod = 0.75;     // Shoot 1.33x faster (was 2x)
        projectileCount = 2; // 2 shots (was 3)
    } else if (boss.phase >= 2) {
        teleportMod = 0.85; // Teleport 1.17x faster (was 1.5x)
        shootMod = 0.85;
        projectileCount = 2;
    }

    // === NEW: Damage tracking for revenge teleport ===
    if (boss.damageTimer > 0) {
        boss.damageTimer--;
        if (boss.damageTimer <= 0) {
            boss.recentDamage = 0; // Reset damage if window expired
        }
    }

    // Revenge teleport: if took 5+ damage in 1 second, teleport immediately!
    if (boss.recentDamage >= 5 && boss.damageTimer > 0) {
        boss.recentDamage = 0;
        boss.damageTimer = 0;
        boss.teleportTimer = 0; // Force immediate teleport
        Audio8Bit.playPortal();
    }

    // === NEW: Shield phase logic ===
    if (!boss.isShielded) {
        boss.shieldTimer--;
        if (boss.shieldTimer <= 0) {
            // Activate shield!
            boss.isShielded = true;
            boss.shieldChargeTime = 240; // 2 seconds of charging (doubled for high refresh)
            Audio8Bit.playPickup(); // Shield activation sound
        }
    } else {
        // Charging up big attack while shielded
        boss.shieldChargeTime--;
        if (boss.shieldChargeTime <= 0) {
            // BURST! 5-projectile spread attack
            const centerX = boss.x + boss.width / 2;
            const centerY = boss.y + boss.height / 2;
            const angleToPlayer = Math.atan2(
                Player.y + Player.height/2 - centerY,
                Player.x + Player.width/2 - centerX
            );

            for (let i = 0; i < 5; i++) {
                const spreadAngle = angleToPlayer + ((i - 2) * 0.4); // Wide spread
                const speed = 4 + boss.phase * 0.5; // Fast projectiles!

                GameState.projectiles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(spreadAngle) * speed,
                    vy: Math.sin(spreadAngle) * speed,
                    isEnemyProjectile: true,
                    isDarkOrb: true,
                    isBurstShot: true, // Special visual marker
                    life: 180
                });
            }

            Audio8Bit.playLaser(true);
            boss.isShielded = false;
            boss.shieldTimer = boss.shieldCooldown; // Reset cooldown
        }
    }

    // === NEW: Electric burst attack ===
    boss.burstTimer--;
    if (boss.burstTimer <= 0 && boss.burstActive <= 0) {
        // Start electric burst!
        boss.burstActive = 60; // Half second of active burst (doubled for high refresh)
        Audio8Bit.playHit();
    }

    if (boss.burstActive > 0) {
        boss.burstActive--;

        // Check if player is in burst radius (100 pixels)
        const dx = (Player.x + Player.width/2) - (boss.x + boss.width/2);
        const dy = (Player.y + Player.height/2) - (boss.y + boss.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 100) {
            Player.takeDamage();
        }

        if (boss.burstActive <= 0) {
            boss.burstTimer = boss.burstCooldown; // Reset cooldown
        }
    }

    // Teleport logic
    boss.teleportTimer--;
    if (boss.teleportTimer <= 0) {
        // Find valid teleport position in dream world (must be in open air!)
        const dreamWidth = tiles[0].length * TILE_SIZE;
        const dreamHeight = tiles.length * TILE_SIZE;

        // Helper to check if position is valid (not in solid tiles)
        const isValidPosition = (x, y) => {
            // Check all corners of boss hitbox
            const corners = [
                { x: x, y: y },
                { x: x + boss.width, y: y },
                { x: x, y: y + boss.height },
                { x: x + boss.width, y: y + boss.height }
            ];
            for (const corner of corners) {
                const tileX = Math.floor(corner.x / TILE_SIZE);
                const tileY = Math.floor(corner.y / TILE_SIZE);
                if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
                    if (tiles[tileY][tileX] === 1) return false; // Solid tile
                }
            }
            return true;
        };

        // Try to find a valid teleport position
        let newX, newY;
        let attempts = 0;
        let foundValid = false;
        do {
            // Teleport near player but not too close, prefer open areas above platforms
            newX = Player.x + (Math.random() - 0.5) * 350;
            newY = 40 + Math.random() * 120; // Stay in upper portion where it's usually open

            // Clamp to world bounds
            newX = Math.max(100, Math.min(dreamWidth - 150, newX));
            newY = Math.max(30, Math.min(200, newY));

            // Check if position is valid and not too close to player
            if (isValidPosition(newX, newY) && Math.abs(newX - Player.x) > 80) {
                foundValid = true;
            }
            attempts++;
        } while (!foundValid && attempts < 20);

        // Only teleport if we found a valid spot
        if (foundValid) {
            boss.x = newX;
            boss.y = newY;
            Audio8Bit.playPortal();
        }
        boss.teleportTimer = boss.teleportCooldown * teleportMod;
    }

    // Shooting logic
    boss.shootTimer--;
    if (boss.shootTimer <= 0) {
        // Shoot dark orb(s) at player
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;

        for (let i = 0; i < projectileCount; i++) {
            // Calculate angle to player with spread
            let dx = Player.x + Player.width/2 - centerX;
            let dy = Player.y + Player.height/2 - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;

            // Add spread for multiple projectiles
            let spreadAngle = 0;
            if (projectileCount > 1) {
                spreadAngle = ((i - (projectileCount-1)/2) * 0.3);
            }

            const baseAngle = Math.atan2(dy, dx);
            const angle = baseAngle + spreadAngle;

            const speed = 2 + boss.phase * 0.5; // Slower projectiles (50% nerf)

            // Add to projectiles as enemy projectile
            GameState.projectiles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                isEnemyProjectile: true,
                isDarkOrb: true, // Special visual
                life: 180
            });
        }

        boss.shootTimer = boss.shootCooldown * shootMod;
        Audio8Bit.playLaser(true); // Fireball sound
    }

    // Collision with player
    const playerRect = Player.getRect();
    const bossRect = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
    if (rectsOverlap(playerRect, bossRect)) {
        Player.takeDamage();
    }
}

function updateBoss() {
    if (!GameState.boss || !GameState.boss.active) return;
    if (GameState.currentWorld !== GameState.boss.world) return;

    const boss = GameState.boss;
    boss.meleeHit = false; // Reset melee hit flag each frame
    boss.animTimer++;
    if (boss.animTimer > 8) {
        boss.animTimer = 0;
        boss.animFrame = (boss.animFrame + 1) % 4;
    }

    // Void Specter has unique behavior
    if (boss.type === 'specter') {
        updateVoidSpecter(boss);
        return;
    }

    // Kuriboh behavior (original)
    const tiles = Levels.getReal();
    boss.patternTimer++;
    boss.dirChangeTimer++;

    // Helper to check if boss can move to position (wall collision)
    const canMoveTo = (x, y) => {
        const corners = [
            { x: x, y: y },
            { x: x + boss.width - 1, y: y },
            { x: x, y: y + boss.height - 1 },
            { x: x + boss.width - 1, y: y + boss.height - 1 }
        ];
        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
                if (tiles[tileY][tileX] === 1) return false;
            }
        }
        return true;
    };

    // UDLR movement - one direction at a time (like chase enemies)
    const directions = ['up', 'down', 'left', 'right'];
    const speed = boss.speed * (1 + (boss.phase - 1) * 0.3) * GAME_SPEED;

    if (boss.pattern === 'roam') {
        // Move in current direction
        let nextX = boss.x;
        let nextY = boss.y;

        switch (boss.moveDir) {
            case 'up': nextY -= speed; break;
            case 'down': nextY += speed; break;
            case 'left': nextX -= speed; break;
            case 'right': nextX += speed; break;
        }

        // Check wall collision
        if (canMoveTo(nextX, nextY)) {
            boss.x = nextX;
            boss.y = nextY;
        } else {
            // Hit wall - pick new random direction
            boss.moveDir = directions[Math.floor(Math.random() * 4)];
            boss.dirChangeTimer = 0;
        }

        // Randomly change direction occasionally
        if (boss.dirChangeTimer > 60 && Math.random() < 0.02) {
            boss.moveDir = directions[Math.floor(Math.random() * 4)];
            boss.dirChangeTimer = 0;
        }

        // Occasionally switch to charge pattern
        const chargeChance = boss.phase >= 3 ? 240 : boss.phase >= 2 ? 360 : 480;
        if (boss.patternTimer > chargeChance) {
            boss.pattern = 'charge';
            boss.patternTimer = 0;
            // Set charge direction - pick axis with larger difference to player
            const dx = Player.x - boss.x;
            const dy = Player.y - boss.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                boss.moveDir = dx > 0 ? 'right' : 'left';
            } else {
                boss.moveDir = dy > 0 ? 'down' : 'up';
            }
        }
    } else if (boss.pattern === 'charge') {
        // Charge in UDLR direction toward player
        const chargeSpeed = speed * (1.5 + boss.phase * 0.3);
        let nextX = boss.x;
        let nextY = boss.y;

        switch (boss.moveDir) {
            case 'up': nextY -= chargeSpeed; break;
            case 'down': nextY += chargeSpeed; break;
            case 'left': nextX -= chargeSpeed; break;
            case 'right': nextX += chargeSpeed; break;
        }

        // Check wall collision
        if (canMoveTo(nextX, nextY)) {
            boss.x = nextX;
            boss.y = nextY;
        } else {
            // Hit wall during charge - return to roam
            boss.pattern = 'roam';
            boss.patternTimer = 0;
            boss.moveDir = directions[Math.floor(Math.random() * 4)];
        }

        // Return to roam after charge duration
        const chargeDuration = boss.phase >= 3 ? 30 : 40;
        if (boss.patternTimer > chargeDuration) {
            boss.pattern = 'roam';
            boss.patternTimer = 0;
            // Continue in same direction or pick new one
            if (Math.random() < 0.5) {
                boss.moveDir = directions[Math.floor(Math.random() * 4)];
            }
        }
    }

    // Collision with player
    const playerRect = Player.getRect();
    const bossRect = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
    if (rectsOverlap(playerRect, bossRect)) {
        Player.takeDamage();
    }
}

// Draw Void Specter - plasma orb with electric tentacles
function drawVoidSpecter(boss) {
    const isReal = GameState.currentWorld === 'real';
    const cam = isReal ? RealCamera : DreamCamera;
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;

    // Skip if off screen
    if (!cam.isVisible(boss.x - 50, boss.y - 50, boss.width + 100, boss.height + 100)) return;

    // Apply camera offset + viewport offset
    const drawX = boss.x - cam.x;
    const drawY = boss.y - cam.y + yOffset;

    // Decrement hit flash
    if (boss.hitFlash > 0) boss.hitFlash--;

    const centerX = drawX + boss.width / 2;
    const centerY = drawY + boss.height / 2;
    const time = Date.now() / 1000;
    const radius = boss.width / 2;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2);
    glowGradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
    glowGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.2)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Electric tentacles - drawn first (behind orb)
    ctx.lineCap = 'round';
    for (const tentacle of boss.tentacles) {
        const baseAngle = tentacle.angle + time * 0.5;
        const segments = 6;
        const segmentLength = tentacle.length / segments;

        // Draw lightning bolt tentacle
        ctx.beginPath();
        let tx = centerX + Math.cos(baseAngle) * radius * 0.8;
        let ty = centerY + Math.sin(baseAngle) * radius * 0.8;
        ctx.moveTo(tx, ty);

        for (let s = 0; s < segments; s++) {
            const segAngle = baseAngle + Math.sin(tentacle.phase + s * 0.8 + time * 8) * 0.5;
            const jitter = Math.sin(tentacle.phase + s * 2 + time * 15) * 5;
            tx += Math.cos(segAngle) * segmentLength + jitter * 0.3;
            ty += Math.sin(segAngle) * segmentLength + jitter * 0.3;
            ctx.lineTo(tx, ty);
        }

        // Glow effect for tentacle
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Spark at end
        if (Math.random() < 0.3) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(tx, ty, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Main plasma orb
    if (boss.hitFlash > 0) {
        ctx.fillStyle = '#fff';
    } else {
        // Multi-layer plasma effect
        const plasmaGradient = ctx.createRadialGradient(
            centerX - radius * 0.2, centerY - radius * 0.2, 0,
            centerX, centerY, radius
        );

        // Phase affects color intensity
        const phaseIntensity = boss.phase >= 3 ? 1.5 : boss.phase >= 2 ? 1.2 : 1;

        plasmaGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * phaseIntensity})`);
        plasmaGradient.addColorStop(0.2, `rgba(200, 150, 255, ${0.8 * phaseIntensity})`);
        plasmaGradient.addColorStop(0.4, `rgba(138, 43, 226, ${0.9 * phaseIntensity})`);
        plasmaGradient.addColorStop(0.7, `rgba(75, 0, 130, 1)`);
        plasmaGradient.addColorStop(1, `rgba(30, 0, 50, 1)`);
        ctx.fillStyle = plasmaGradient;
    }

    // Draw main orb
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner plasma swirls
    if (boss.hitFlash <= 0) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
            const swirlAngle = boss.plasmaPhase + (i / 4) * Math.PI * 2;
            const swirlX = centerX + Math.cos(swirlAngle) * radius * 0.4;
            const swirlY = centerY + Math.sin(swirlAngle) * radius * 0.4;
            const swirlSize = radius * 0.3 + Math.sin(boss.plasmaPhase * 2 + i) * radius * 0.1;

            const swirlGrad = ctx.createRadialGradient(swirlX, swirlY, 0, swirlX, swirlY, swirlSize);
            swirlGrad.addColorStop(0, 'rgba(255, 200, 255, 0.6)');
            swirlGrad.addColorStop(0.5, 'rgba(200, 100, 255, 0.3)');
            swirlGrad.addColorStop(1, 'rgba(100, 0, 200, 0)');
            ctx.fillStyle = swirlGrad;
            ctx.beginPath();
            ctx.arc(swirlX, swirlY, swirlSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        // Central bright core
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.3);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGrad.addColorStop(0.5, 'rgba(200, 200, 255, 0.4)');
        coreGrad.addColorStop(1, 'rgba(150, 100, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    // Phase 3: Intense aura
    if (boss.phase >= 3 && boss.hitFlash <= 0) {
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 8 + Math.sin(time * 10) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // === SHIELD VISUAL ===
    if (boss.isShielded) {
        // Pulsing hexagonal shield barrier
        const shieldRadius = radius + 20 + Math.sin(time * 8) * 5;
        const chargeProgress = 1 - (boss.shieldChargeTime / 240); // 0 to 1

        // Outer shield ring
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + chargeProgress * 0.5})`;
        ctx.lineWidth = 3 + chargeProgress * 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        // Hexagon shape
        for (let i = 0; i <= 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 2;
            const px = centerX + Math.cos(angle) * shieldRadius;
            const py = centerY + Math.sin(angle) * shieldRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner glow
        const shieldGlow = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, shieldRadius + 10);
        shieldGlow.addColorStop(0, 'rgba(0, 255, 255, 0)');
        shieldGlow.addColorStop(0.7, `rgba(0, 200, 255, ${0.2 + chargeProgress * 0.3})`);
        shieldGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = shieldGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shieldRadius + 10, 0, Math.PI * 2);
        ctx.fill();

        // "CHARGING" text when shielded
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHARGING', centerX, centerY - radius - 30);

        // Charge bar
        ctx.fillStyle = '#003333';
        ctx.fillRect(centerX - 25, centerY - radius - 25, 50, 6);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(centerX - 25, centerY - radius - 25, 50 * chargeProgress, 6);
    }

    // === ELECTRIC BURST VISUAL ===
    if (boss.burstActive > 0) {
        const burstProgress = boss.burstActive / 60; // 1 to 0
        const burstRadius = 100;

        // Electric field effect
        ctx.strokeStyle = `rgba(255, 255, 0, ${burstProgress * 0.8})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;

        // Multiple electric rings
        for (let ring = 0; ring < 3; ring++) {
            const ringRadius = burstRadius * (0.4 + ring * 0.3) * (1 + Math.sin(time * 20 + ring) * 0.1);
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Lightning bolts radiating outward
        for (let bolt = 0; bolt < 8; bolt++) {
            const boltAngle = (bolt / 8) * Math.PI * 2 + time * 5;
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(boltAngle) * radius, centerY + Math.sin(boltAngle) * radius);

            let bx = centerX + Math.cos(boltAngle) * radius;
            let by = centerY + Math.sin(boltAngle) * radius;

            for (let seg = 0; seg < 4; seg++) {
                const jitter = (Math.random() - 0.5) * 20;
                bx += Math.cos(boltAngle) * 20 + Math.cos(boltAngle + Math.PI/2) * jitter;
                by += Math.sin(boltAngle) * 20 + Math.sin(boltAngle + Math.PI/2) * jitter;
                ctx.lineTo(bx, by);
            }
            ctx.strokeStyle = `rgba(255, 255, 100, ${burstProgress})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.shadowBlur = 0;

        // Warning text
        ctx.fillStyle = `rgba(255, 255, 0, ${burstProgress})`;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ BURST ⚡', centerX, centerY + radius + 40);
    }

    // Draw health bar
    drawBossHealthBar();
}

function drawBoss() {
    if (!GameState.boss || !GameState.boss.active) return;
    if (GameState.currentWorld !== GameState.boss.world) return;

    const boss = GameState.boss;
    const isReal = GameState.currentWorld === 'real';
    const cam = isReal ? RealCamera : DreamCamera;
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;

    // Void Specter has unique appearance
    if (boss.type === 'specter') {
        drawVoidSpecter(boss);
        return;
    }

    // Skip if off screen
    if (!cam.isVisible(boss.x, boss.y, boss.width, boss.height)) return;

    // Apply camera offset + viewport offset
    const drawX = boss.x - cam.x;
    const drawY = boss.y - cam.y + yOffset;

    // Decrement hit flash
    if (boss.hitFlash > 0) boss.hitFlash--;

    const centerX = drawX + boss.width / 2;
    const centerY = drawY + boss.height / 2;
    const time = Date.now() / 1000;

    // Scale factor based on boss size (44px = ~2x ghost, visuals scale accordingly)
    const scale = boss.width / 44;

    // Kuriboh-style boss: fuzzy ball with big eyes, small limbs
    // Scaled down to fit 4-5x ghost size

    // Body pulsing
    const pulse = Math.sin(time * 4) * (1.5 * scale);
    const bodyRadius = (18 * scale) + pulse;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, drawY + boss.height - (3 * scale), bodyRadius * 0.8, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hit flash or normal coloring
    if (boss.hitFlash > 0) {
        ctx.fillStyle = '#fff';
    } else {
        // Furry brown body with gradient
        const gradient = ctx.createRadialGradient(centerX - 3*scale, centerY - 3*scale, 3*scale, centerX, centerY, bodyRadius);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#5D3A1A');
        gradient.addColorStop(1, '#3D2510');
        ctx.fillStyle = gradient;
    }

    // Main fuzzy body
    ctx.beginPath();
    ctx.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fur texture - small bumps around edge
    if (boss.hitFlash <= 0) {
        ctx.fillStyle = '#4D2A10';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 0.5;
            const bumpX = centerX + Math.cos(angle) * (bodyRadius - 2*scale);
            const bumpY = centerY + Math.sin(angle) * (bodyRadius - 2*scale);
            ctx.beginPath();
            ctx.arc(bumpX, bumpY, (3 + Math.sin(time * 3 + i)) * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Small feet (like Kirby/Goomba)
    if (boss.hitFlash <= 0) {
        ctx.fillStyle = '#FFD93D';
        // Left foot
        ctx.beginPath();
        ctx.ellipse(centerX - 10*scale, drawY + boss.height - 5*scale, 6*scale, 4*scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Right foot
        ctx.beginPath();
        ctx.ellipse(centerX + 10*scale, drawY + boss.height - 5*scale, 6*scale, 4*scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Big expressive eyes (Kuriboh style)
    const eyeOffsetX = 8 * scale;
    const eyeY = centerY - 3*scale;
    const eyeWidth = 9 * scale;
    const eyeHeight = 10 * scale;

    // White of eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(centerX - eyeOffsetX, eyeY, eyeWidth / 2, eyeHeight / 2, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + eyeOffsetX, eyeY, eyeWidth / 2, eyeHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(centerX - eyeOffsetX, eyeY, eyeWidth / 2, eyeHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX + eyeOffsetX, eyeY, eyeWidth / 2, eyeHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Pupils - look at player, angry in later phases
    const toPlayerX = Player.x - boss.x;
    const toPlayerY = Player.y - boss.y;
    const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;
    const lookX = (toPlayerX / dist) * 2 * scale;
    const lookY = (toPlayerY / dist) * 1.5 * scale;

    // Pupil color changes with phase
    const pupilColor = boss.phase >= 3 ? '#ff0000' : boss.phase >= 2 ? '#ff4400' : '#000';
    ctx.fillStyle = pupilColor;
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX + lookX, eyeY + lookY, 2.5*scale, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX + lookX, eyeY + lookY, 2.5*scale, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX - 1.5*scale, eyeY - 2*scale, 1.2*scale, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX - 1.5*scale, eyeY - 2*scale, 1.2*scale, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows in later phases
    if (boss.phase >= 2) {
        ctx.strokeStyle = '#3D2510';
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - eyeOffsetX - 5*scale, eyeY - 7*scale);
        ctx.lineTo(centerX - eyeOffsetX + 3*scale, eyeY - 5*scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + eyeOffsetX + 5*scale, eyeY - 7*scale);
        ctx.lineTo(centerX + eyeOffsetX - 3*scale, eyeY - 5*scale);
        ctx.stroke();
    }

    // Small clawed hands (like Metroid enemies)
    if (boss.hitFlash <= 0) {
        const handWave = Math.sin(time * 5) * 6 * scale;
        ctx.fillStyle = '#FFD93D';

        // Left hand
        ctx.beginPath();
        ctx.ellipse(centerX - bodyRadius - 3*scale, centerY + handWave, 5*scale, 4*scale, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // Claws
        ctx.fillStyle = '#333';
        for (let c = 0; c < 3; c++) {
            ctx.beginPath();
            ctx.ellipse(centerX - bodyRadius - 6*scale + c * 2.5*scale, centerY + handWave + 3*scale, 1.2*scale, 2.5*scale, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Right hand
        ctx.fillStyle = '#FFD93D';
        ctx.beginPath();
        ctx.ellipse(centerX + bodyRadius + 3*scale, centerY - handWave, 5*scale, 4*scale, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Claws
        ctx.fillStyle = '#333';
        for (let c = 0; c < 3; c++) {
            ctx.beginPath();
            ctx.ellipse(centerX + bodyRadius + 6*scale - c * 2.5*scale, centerY - handWave + 3*scale, 1.2*scale, 2.5*scale, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Phase 3: Aura effect
    if (boss.phase >= 3 && boss.hitFlash <= 0) {
        ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        ctx.lineWidth = 2 * scale;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10 * scale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bodyRadius + 5*scale + Math.sin(time * 8) * 3*scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Draw health bar
    drawBossHealthBar();
}

function drawBossHealthBar() {
    if (!GameState.boss || !GameState.boss.active) return;
    if (GameState.currentWorld !== GameState.boss.world) return;

    const boss = GameState.boss;
    const barWidth = 200;
    const barHeight = 16;
    const barX = (GAME_WIDTH - barWidth) / 2;
    // Position health bar at top of current world
    const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
    const barY = yOffset + 30;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 25);

    // Boss name
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, GAME_WIDTH / 2, barY + 8);

    // Health bar background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + 12, barWidth, barHeight);

    // Health bar fill
    const hpPercent = boss.hp / boss.maxHp;
    const hpColor = hpPercent > 0.6 ? '#44ff44' : hpPercent > 0.3 ? '#ffff44' : '#ff4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY + 12, barWidth * hpPercent, barHeight);

    // Health bar border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY + 12, barWidth, barHeight);

    // HP text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText(`${boss.hp} / ${boss.maxHp}`, GAME_WIDTH / 2, barY + 23);

    ctx.textAlign = 'left';
}

// ============================================
// PROJECTILES
// ============================================

function updateProjectiles() {
    const tiles = GameState.currentWorld === 'real' ? Levels.getReal() : Levels.getDream();

    GameState.projectiles = GameState.projectiles.filter(p => {
        p.x += p.vx * GAME_SPEED;
        p.y += p.vy * GAME_SPEED;
        p.life--;

        // Check wall collision
        const tileX = Math.floor(p.x / TILE_SIZE);
        const tileY = Math.floor(p.y / TILE_SIZE);
        if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
            if (tiles[tileY][tileX] === 1) return false;
        }

        // Enemy projectiles (from Void Specter) damage player
        if (p.isEnemyProjectile) {
            const playerRect = Player.getRect();
            if (p.x > playerRect.x && p.x < playerRect.x + playerRect.width &&
                p.y > playerRect.y && p.y < playerRect.y + playerRect.height) {
                Player.takeDamage();
                return false; // Projectile consumed
            }
            // Use actual level width for bounds check (dream world can be very wide)
            const maxX = tiles[0].length * TILE_SIZE + 100;
            return p.life > 0 && p.x > -50 && p.x < maxX && p.y > -50 && p.y < GAME_HEIGHT;
        }

        // Check enemy collision
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            if (enemy.world !== GameState.currentWorld) continue;

            if (p.x > enemy.x && p.x < enemy.x + enemy.width &&
                p.y > enemy.y && p.y < enemy.y + enemy.height) {

                // Charged shots do 3x damage, normal shots do 1
                const damage = p.charged ? 3 : 1;
                damageEnemy(enemy, damage, i);
                return false; // Projectile consumed
            }
        }

        // Check boss collision
        if (GameState.boss && GameState.boss.active && GameState.currentWorld === GameState.boss.world) {
            const boss = GameState.boss;
            if (p.x > boss.x && p.x < boss.x + boss.width &&
                p.y > boss.y && p.y < boss.y + boss.height) {
                const damage = p.charged ? 3 : 1;
                damageBoss(damage);
                return false;
            }
        }

        // Use actual level width for bounds check (dream world can be very wide)
        const maxX = tiles[0].length * TILE_SIZE + 100;
        return p.life > 0 && p.x > -50 && p.x < maxX && p.y > -50 && p.y < GAME_HEIGHT;
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
            GameState.coins += 10; // Currency for shop
            break;
        case 'health':
            if (GameState.health < GameState.maxHealth) {
                GameState.health++;
            } else if (GameState.maxHealth < 5) {
                // At full health - add a permanent heart!
                GameState.maxHealth++;
                GameState.health++;
            } else {
                GameState.score += 50; // Bonus points if at max hearts
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
    const isReal = GameState.currentWorld === 'real';
    const cam = isReal ? RealCamera : DreamCamera;
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;

    GameState.drops.forEach(drop => {
        // Skip if not visible
        if (!cam.isVisible(drop.x - 16, drop.y - 16, 32, 32)) return;

        const bob = Math.sin(Date.now() * 0.005 + drop.bobOffset) * 3;
        const drawX = drop.x - cam.x;
        const drawY = drop.y - cam.y + yOffset + bob;

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
    // Slot 0 (key 1) = power_boost, Slot 1 (key 2) = shield (any type)
    if (slot === 0) {
        // Power boost
        const itemIndex = GameState.usableItems.indexOf('power_boost');
        if (itemIndex === -1) return;
        GameState.usableItems.splice(itemIndex, 1);
        GameState.powerBoostTimer = 1800; // 15 seconds - 2x DMG, 1.5x SPD (doubled for high refresh)
    } else {
        // Shield - find any shield type (prefer stronger ones)
        let shieldIndex = GameState.usableItems.findIndex(i => i === 'shield_5');
        let shieldHits = 5;
        if (shieldIndex === -1) {
            shieldIndex = GameState.usableItems.findIndex(i => i === 'shield_3');
            shieldHits = 3;
        }
        if (shieldIndex === -1) {
            shieldIndex = GameState.usableItems.findIndex(i => i === 'shield_1');
            shieldHits = 1;
        }
        if (shieldIndex === -1) {
            shieldIndex = GameState.usableItems.indexOf('shield'); // Basic pickup shield
            shieldHits = 1;
        }
        if (shieldIndex === -1) return; // No shield available

        GameState.usableItems.splice(shieldIndex, 1);
        GameState.shieldTimer = 99999; // Lasts until hits run out
        GameState.shieldHits = shieldHits;
    }
    updateUI();
}

function useWorldPower() {
    // Use Dream Essence in Real World, Real Energy in Dream World
    if (GameState.currentWorld === 'real' && GameState.dreamEssence > 0) {
        // Dream Essence: Power boost + heal
        GameState.dreamEssence--;
        GameState.powerBoostTimer = Math.max(GameState.powerBoostTimer, 1200); // 10 seconds (doubled for high refresh)
        // Also heal 1 HP
        if (GameState.health < GameState.maxHealth) {
            GameState.health++;
        }
        updateUI();
    } else if (GameState.currentWorld === 'dream' && GameState.realEnergy > 0) {
        // Real Energy: Invincibility + shield
        GameState.realEnergy--;
        GameState.invincible = Math.max(GameState.invincible, 600); // 5 seconds invincibility (doubled for high refresh)
        GameState.shieldTimer = Math.max(GameState.shieldTimer, 1200); // 10 seconds shield (doubled for high refresh)
        updateUI();
    }
}

function drawProjectiles() {
    const isReal = GameState.currentWorld === 'real';
    const cam = isReal ? RealCamera : DreamCamera;
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;

    GameState.projectiles.forEach(p => {
        // Skip if not visible
        if (!cam.isVisible(p.x - 15, p.y - 15, 30, 30)) return;

        // Apply camera offset + viewport offset
        const drawX = p.x - cam.x;
        const drawY = p.y - cam.y + yOffset;

        // Dark orb from Void Specter or Void Orb enemies
        if (p.isDarkOrb) {
            // Small orbs from void orb enemies are 60% size
            const scale = p.isSmallOrb ? 0.6 : 1.0;
            // Outer glow
            ctx.fillStyle = 'rgba(75, 0, 130, 0.5)';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 12 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Main orb
            ctx.fillStyle = '#4b0082';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#9932cc';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Bright center
            ctx.fillStyle = '#da70d6';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

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
        const cam = RealCamera;

        // Save context and clip to real world viewport (square: 560x560)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, REAL_WORLD_Y_OFFSET, REAL_VIEWPORT_WIDTH, REAL_VIEWPORT_HEIGHT);
        ctx.clip();

        // Fill viewport with background
        ctx.fillStyle = '#331400'; // Dark orange background
        ctx.fillRect(0, REAL_WORLD_Y_OFFSET, REAL_VIEWPORT_WIDTH, REAL_VIEWPORT_HEIGHT);

        // Calculate visible tile range for optimization
        const startTileX = Math.floor(cam.x / TILE_SIZE);
        const startTileY = Math.floor(cam.y / TILE_SIZE);
        const endTileX = Math.min(startTileX + REAL_VIEWPORT_TILES_X + 2, tiles[0]?.length || 0);
        const endTileY = Math.min(startTileY + REAL_VIEWPORT_TILES_Y + 2, tiles.length);

        // Draw only visible tiles with camera offset
        for (let y = Math.max(0, startTileY); y < endTileY; y++) {
            for (let x = Math.max(0, startTileX); x < endTileX; x++) {
                const tile = tiles[y][x];
                const px = x * TILE_SIZE - cam.x;
                const py = y * TILE_SIZE - cam.y + REAL_WORLD_Y_OFFSET;
                this.drawTile(tile, px, py);
            }
        }

        ctx.restore();
    },

    drawTile(tile, px, py) {
        const s = TILE_SIZE / 56; // Scale factor for smaller tiles
        switch (tile) {
            case 1:
                // Walls - bright OJ orange brick style!
                ctx.fillStyle = '#cc4400'; // Deep orange outer
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#ff6600'; // Bright orange inner
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.fillStyle = '#cc4400'; // Grid lines
                ctx.fillRect(px + TILE_SIZE/2, py, 1, TILE_SIZE);
                ctx.fillRect(px, py + TILE_SIZE/2, TILE_SIZE, 1);
                break;
            case 2:
                // Portal - keep purple (connects worlds)
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
                // Locked door - orange tones
                ctx.fillStyle = '#994400';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#cc5500';
                ctx.fillRect(px + 2, py + 1, TILE_SIZE - 4, TILE_SIZE - 2);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 4*s, 4*s, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4:
                // Key - keep gold
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 10*s, 6*s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14*s, 4, 10*s);
                ctx.fillRect(px + TILE_SIZE/2, py + 19*s, 6*s, 3*s);
                break;
            case 5:
                // Open door - orange frame with dark opening
                ctx.fillStyle = '#994400';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#331400';
                ctx.fillRect(px + 6*s, py + 2, TILE_SIZE - 12*s, TILE_SIZE - 2);
                break;
            case 6:
                // Goal/Exit - green glowing tile
                ctx.fillStyle = '#00aa44';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#00ff66';
                const exitPulse = 4*s + Math.sin(Date.now() / 300) * 2*s;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, exitPulse, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 7:
                // Room door - wooden door with handle (unlocked)
                ctx.fillStyle = '#663300'; // Dark wood frame
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#995522'; // Wood door
                ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, TILE_SIZE - 2);
                ctx.fillStyle = '#553311'; // Door details
                ctx.fillRect(px + 5, py + 4, TILE_SIZE - 10, 4);
                ctx.fillRect(px + 5, py + TILE_SIZE - 10, TILE_SIZE - 10, 4);
                // Door handle
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE - 8, py + TILE_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 8:
                // Water - animated blue with waves
                const waterTime = Date.now() / 500;
                const waveOffset = Math.sin(waterTime + px * 0.1) * 2;
                ctx.fillStyle = '#1a4a6e'; // Deep water
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a6a9e'; // Mid water
                ctx.fillRect(px, py + 4 + waveOffset, TILE_SIZE, TILE_SIZE - 8);
                ctx.fillStyle = '#4a9ace'; // Light ripples
                ctx.fillRect(px + 4, py + 8 + waveOffset, TILE_SIZE - 8, 3);
                ctx.fillRect(px + 8, py + 16 + waveOffset, TILE_SIZE - 12, 2);
                break;
            case 9:
                // Bridge - wooden planks over water
                ctx.fillStyle = '#1a4a6e'; // Water underneath
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513'; // Bridge wood
                ctx.fillRect(px, py + 4, TILE_SIZE, TILE_SIZE - 8);
                ctx.fillStyle = '#654321'; // Plank lines
                ctx.fillRect(px, py + 8, TILE_SIZE, 2);
                ctx.fillRect(px, py + 16, TILE_SIZE, 2);
                ctx.fillStyle = '#5a3a1a'; // Side rails
                ctx.fillRect(px, py + 2, TILE_SIZE, 3);
                ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 3);
                break;
            case 10:
                // Locked room door - needs Golden Key
                ctx.fillStyle = '#4a2a0a'; // Dark locked wood
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#6a3a1a'; // Locked door
                ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, TILE_SIZE - 2);
                ctx.fillStyle = '#3a1a0a'; // Door details
                ctx.fillRect(px + 5, py + 4, TILE_SIZE - 10, 4);
                ctx.fillRect(px + 5, py + TILE_SIZE - 10, TILE_SIZE - 10, 4);
                // Golden lock
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + TILE_SIZE/2 - 5, py + TILE_SIZE/2 - 3, 10, 8);
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 - 5, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4a2a0a';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 - 5, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
};

const DreamWorld = {
    draw() {
        const tiles = Levels.getDream();
        const worldHeight = tiles.length * TILE_SIZE;
        const cam = DreamCamera;

        // Save context and clip to dream world viewport (rectangle: 560x336)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, DREAM_WORLD_Y_OFFSET, DREAM_VIEWPORT_WIDTH, DREAM_VIEWPORT_HEIGHT);
        ctx.clip();

        // Gradient background that fills viewport
        const gradient = ctx.createLinearGradient(0, DREAM_WORLD_Y_OFFSET, 0, DREAM_WORLD_Y_OFFSET + DREAM_VIEWPORT_HEIGHT);
        gradient.addColorStop(0, '#0a0515');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, DREAM_VIEWPORT_WIDTH, DREAM_VIEWPORT_HEIGHT);

        // Parallax stars (move slower than camera for depth)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 80; i++) {
            const baseX = (i * 73) % (DREAM_WORLD_WIDTH * TILE_SIZE);
            const baseY = (i * 47) % worldHeight;
            const parallax = 0.3; // Stars move at 30% of camera speed
            const x = baseX - cam.x * parallax;
            const y = baseY - cam.y * parallax;
            // Wrap stars within viewport
            const wrappedX = ((x % DREAM_VIEWPORT_WIDTH) + DREAM_VIEWPORT_WIDTH) % DREAM_VIEWPORT_WIDTH;
            const wrappedY = ((y % DREAM_VIEWPORT_HEIGHT) + DREAM_VIEWPORT_HEIGHT) % DREAM_VIEWPORT_HEIGHT;
            const twinkle = Math.sin(Date.now() * 0.005 + i) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle * 0.8;
            ctx.fillRect(wrappedX, DREAM_WORLD_Y_OFFSET + wrappedY, (i % 3) + 1, (i % 3) + 1);
        }
        ctx.globalAlpha = 1;

        // Calculate visible tile range
        const startTileX = Math.floor(cam.x / TILE_SIZE);
        const startTileY = Math.floor(cam.y / TILE_SIZE);
        const endTileX = Math.min(startTileX + DREAM_VIEWPORT_TILES_X + 2, tiles[0]?.length || 0);
        const endTileY = Math.min(startTileY + DREAM_VIEWPORT_TILES_Y + 2, tiles.length);

        // Draw only visible tiles with camera offset
        for (let y = Math.max(0, startTileY); y < endTileY; y++) {
            for (let x = Math.max(0, startTileX); x < endTileX; x++) {
                if (x < tiles[y].length) {
                    const tile = tiles[y][x];
                    const px = x * TILE_SIZE - cam.x;
                    const py = y * TILE_SIZE - cam.y + DREAM_WORLD_Y_OFFSET;
                    this.drawTile(tile, px, py);
                }
            }
        }

        ctx.restore();

        // Door prompt (outside of clip region)
        if (GameState.nearDoor && GameState.currentWorld === 'dream') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(GAME_WIDTH/2 - 80, DREAM_WORLD_Y_OFFSET + DREAM_VIEWPORT_HEIGHT - 35, 160, 28);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to enter', GAME_WIDTH/2, DREAM_WORLD_Y_OFFSET + DREAM_VIEWPORT_HEIGHT - 16);
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
            case 11:
                // Locked treasure chest - needs Dream Key
                const chestPulse = Math.sin(Date.now() / 400) * 2;
                // Chest body
                ctx.fillStyle = '#8B4513'; // Brown wood
                ctx.fillRect(px + 2, py + TILE_SIZE/2, TILE_SIZE - 4, TILE_SIZE/2 - 2);
                // Chest lid
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(px + 1, py + TILE_SIZE/3, TILE_SIZE - 2, TILE_SIZE/5);
                // Gold trim
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + 3, py + TILE_SIZE/2 - 2, TILE_SIZE - 6, 4);
                // Lock
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(px + TILE_SIZE/2 - 4, py + TILE_SIZE/2 + 2, 8, 8);
                ctx.fillStyle = '#4a4a4a';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 - 2 + chestPulse, 5, 0, Math.PI * 2);
                ctx.fill();
                // Sparkle
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE - 8, py + TILE_SIZE/3, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 12:
                // Opened treasure chest (empty)
                ctx.fillStyle = '#6B3513';
                ctx.fillRect(px + 2, py + TILE_SIZE/2, TILE_SIZE - 4, TILE_SIZE/2 - 2);
                // Open lid (tilted back)
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 1, py + 4, TILE_SIZE - 2, TILE_SIZE/4);
                // Gold trim
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(px + 3, py + TILE_SIZE/2 - 2, TILE_SIZE - 6, 3);
                // Empty inside
                ctx.fillStyle = '#2a1a0a';
                ctx.fillRect(px + 4, py + TILE_SIZE/2 + 2, TILE_SIZE - 8, TILE_SIZE/3);
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
                        // Only complete level from dream world - real world exit does nothing
                        if (GameState.currentWorld === 'dream') {
                            reachGoal();
                            return;
                        }
                    }
                    // Room door (tile 7) - transition to another room
                    if (tile === 7) {
                        enterRoomDoor();
                        return;
                    }
                    // Locked room door (tile 10) - needs Golden Key to unlock
                    if (tile === 10) {
                        if (GameState.inventory.includes('Golden Key')) {
                            tiles[tileY][tileX] = 7; // Unlock to regular room door
                            GameState.inventory.splice(GameState.inventory.indexOf('Golden Key'), 1);
                            Audio8Bit.playPickup();
                            updateUI();
                        }
                    }
                    // Treasure chest (tile 11) - needs Dream Key, gives Crystal Armor
                    if (tile === 11 && GameState.currentWorld === 'dream') {
                        if (GameState.inventory.includes('Dream Key')) {
                            tiles[tileY][tileX] = 12; // Open the chest
                            GameState.inventory.splice(GameState.inventory.indexOf('Dream Key'), 1);
                            // Grant Crystal Armor
                            if (!GameState.hasCrystalArmor) {
                                GameState.hasCrystalArmor = true;
                                showMessage('CRYSTAL ARMOR ACQUIRED! -50% damage!', 180);
                            }
                            Audio8Bit.playPickup();
                            updateUI();
                        }
                    }
                }
            }
        }
    }
}

// Handle room-to-room door transition
function enterRoomDoor() {
    const doorInfo = Levels.getDoorConnection(GameState.currentRoom);
    if (!doorInfo) return;

    // Switch to target room
    Levels.switchRoom(doorInfo.targetRoom);

    // Move player to spawn position in new room
    Player.gridX = doorInfo.spawnX;
    Player.gridY = doorInfo.spawnY;
    Player.x = Player.gridX * TILE_SIZE + 2;
    Player.y = Player.gridY * TILE_SIZE + 2;
    Player.isMoving = false;

    // Clear projectiles and respawn enemies for new room
    GameState.projectiles = [];
    spawnEnemies();

    Audio8Bit.playPortal();
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Helper function to find a tile type in a tile array
function findTilePosition(tiles, tileType) {
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            if (tiles[y][x] === tileType) {
                return { x, y, found: true };
            }
        }
    }
    return { x: 0, y: 0, found: false };
}

function switchWorld() {
    GameState.portalCooldown = 60;
    GameState.projectiles = [];
    GameState.drops = []; // Clear drops when switching worlds
    Audio8Bit.playPortal();

    if (GameState.currentWorld === 'real') {
        GameState.currentWorld = 'dream';
        // Find portal location in dream world and spawn there
        const dreamTiles = Levels.getDream();
        const portal = findTilePosition(dreamTiles, 2); // Find portal tile

        if (portal.found) {
            Player.gridX = portal.x;
            Player.gridY = portal.y;
            Player.x = portal.x * TILE_SIZE + 2;
            Player.y = portal.y * TILE_SIZE + 2;
        } else {
            // Fallback: spawn near bottom left
            Player.gridX = 2;
            Player.gridY = dreamTiles.length - 3;
            Player.x = Player.gridX * TILE_SIZE + 2;
            Player.y = Player.gridY * TILE_SIZE + 2;
        }

        Player.isMoving = false;
        Player.isJumping = false;
        Player.isFalling = false;
        Player.velocityY = 0;
        Player.facing = 1;

        // Snap dream camera to player position
        DreamCamera.snapTo(Player.x, Player.y, Player.width, Player.height);

        // Despawn boss when leaving real world (unless defeated)
        if (GameState.boss && !GameState.bossDefeated[Levels.current]) {
            GameState.boss = null;
        }

        // Spawn dream world boss if unlocked (e.g., Void Specter at level 6)
        if (GameState.bossUnlocked && !GameState.bossDefeated[Levels.current]) {
            const bossTemplate = BossTemplates[Levels.current];
            if (bossTemplate && bossTemplate.world === 'dream') {
                spawnBoss(Levels.current);
                showMessage(`${bossTemplate.name.toUpperCase()} APPEARS!`, 120);
            }
        }
    } else {
        GameState.currentWorld = 'real';
        // Find portal location in real world and spawn there
        const realTiles = Levels.getReal();
        const portal = findTilePosition(realTiles, 2); // Find portal tile

        if (portal.found) {
            Player.gridX = portal.x;
            Player.gridY = portal.y;
        } else {
            // Fallback: spawn at center-ish position
            Player.gridX = Math.floor(realTiles[0].length / 2);
            Player.gridY = Math.floor(realTiles.length / 2);
        }

        Player.x = Player.gridX * TILE_SIZE + 2;
        Player.y = Player.gridY * TILE_SIZE + 2;
        Player.isMoving = false;
        Player.moveProgress = 0;
        Player.targetX = Player.x;
        Player.targetY = Player.y;

        // Snap real camera to player position
        RealCamera.snapTo(Player.x, Player.y, TILE_SIZE, TILE_SIZE);

        // Spawn boss only if unlocked (player reached dream goal first)
        if (GameState.bossUnlocked && !GameState.bossDefeated[Levels.current]) {
            spawnBoss(Levels.current);
            showMessage('NIGHTMARE KURIBOH APPEARS!', 120);
        }
    }
    spawnEnemies(); // Will now respect killed enemies tracker
    updateUI();
}

function enterDoor() {
    // Don't process if boss is already active or already unlocked
    if (GameState.boss && GameState.boss.active) return;
    if (GameState.bossUnlocked && !GameState.bossDefeated[Levels.current]) return;

    // Check if this is a boss level - same logic as reachGoal
    if (LevelTemplates.bossLevels.includes(Levels.current) && !GameState.bossDefeated[Levels.current]) {
        const bossTemplate = BossTemplates[Levels.current];
        GameState.bossUnlocked = true;

        // If boss is in current world, spawn immediately
        if (bossTemplate && bossTemplate.world === GameState.currentWorld) {
            spawnBoss(Levels.current);
            showMessage(`${bossTemplate.name.toUpperCase()} APPEARS!`, 120);
        } else {
            showMessage('BOSS UNLOCKED! Return to the portal!', 180);
        }
        return; // Don't complete level yet
    }
    completeLevel();
}

function reachGoal() {
    // Don't process if boss is already active or already unlocked (prevents repeated calls)
    if (GameState.boss && GameState.boss.active) return;
    if (GameState.bossUnlocked && !GameState.bossDefeated[Levels.current]) return;

    // Check if this is a boss level
    if (LevelTemplates.bossLevels.includes(Levels.current) && !GameState.bossDefeated[Levels.current]) {
        const bossTemplate = BossTemplates[Levels.current];
        GameState.bossUnlocked = true;

        // If boss is in current world (dream world for Void Specter), spawn immediately
        if (bossTemplate && bossTemplate.world === GameState.currentWorld) {
            spawnBoss(Levels.current);
            showMessage(`${bossTemplate.name.toUpperCase()} APPEARS!`, 120);
        } else {
            // Boss is in other world - tell player to go there
            showMessage('BOSS UNLOCKED! Return to the portal!', 180);
        }
        return; // Don't complete level yet
    }
    completeLevel();
}

function showMessage(text, duration) {
    GameState.messageText = text;
    GameState.messageTimer = duration;
}

// Start the next level (called after shop or directly)
function startNextLevel() {
    GameState.currentWorld = 'real';
    GameState.inventory = [];
    GameState.lives = 2; // Reset lives for new level
    // Keep score, essence, energy, coins, and usable items!
    Player.init();
    Camera.snapToPlayer(); // Center camera on player
    spawnEnemies();
    // Boss will spawn when player unlocks it (reaches dream goal then returns)
    updateUI();
}

// Exit shop and continue to next level
function exitShop() {
    GameState.inShop = false;
    startNextLevel();
}

// Shop items configuration
const ShopItems = [
    { name: 'Heart (+1 Max)', price: 100, action: () => {
        if (GameState.maxHealth < 5) {
            GameState.maxHealth++;
            GameState.health = Math.min(GameState.health + 1, GameState.maxHealth);
            return true;
        }
        return false; // Already at max
    }},
    { name: 'Extra Life', price: 150, action: () => {
        GameState.lives++;
        return true;
    }},
    { name: 'Basic Shield (1 hit)', price: 75, action: () => {
        GameState.usableItems.push('shield_1');
        return true;
    }},
    { name: 'Steel Shield (3 hits)', price: 200, action: () => {
        GameState.usableItems.push('shield_3');
        return true;
    }},
    { name: 'Crystal Shield (5 hits)', price: 400, action: () => {
        GameState.usableItems.push('shield_5');
        return true;
    }},
    { name: 'Power Boost', price: 50, action: () => {
        GameState.usableItems.push('power_boost');
        return true;
    }},
    { name: '>>> CONTINUE >>>', price: 0, action: () => {
        exitShop();
        return true;
    }}
];

function buyShopItem() {
    const item = ShopItems[GameState.shopSelection];
    if (item.price === 0 || GameState.coins >= item.price) {
        if (item.action()) {
            GameState.coins -= item.price;
            Audio8Bit.playPickup();
        } else {
            // Can't buy (e.g., max health reached)
            Audio8Bit.playDamage();
        }
    } else {
        // Not enough coins
        Audio8Bit.playDamage();
    }
}

function completeLevel() {
    GameState.projectiles = [];
    GameState.drops = [];
    GameState.boss = null; // Clear any existing boss
    GameState.bossUnlocked = false; // Reset for next level

    // Check if we just completed level 3 - show shop before level 4
    const justCompletedLevel = Levels.current;

    if (Levels.nextLevel()) {
        // Show shop after level 3 boss
        if (justCompletedLevel === 3) {
            GameState.inShop = true;
            GameState.shopSelection = 0;
            return; // Don't start level 4 yet
        }

        // Progress to next level - reset for new level
        startNextLevel();
    } else {
        // Game complete - show victory and restart
        GameState.gameComplete = true;
        setTimeout(() => {
            GameState.gameComplete = false;
            Levels.reset();
            GameState.currentWorld = 'real';
            GameState.inventory = [];
            GameState.cameraX = 0;
            GameState.maxHealth = 3; // Reset to starting hearts
            GameState.health = GameState.maxHealth;
            GameState.lives = 2;
            // Reset all progress on game restart
            GameState.score = 0;
            GameState.killedEnemies = { real: {}, dream: {} };
            GameState.dreamEssence = 0;
            GameState.realEnergy = 0;
            GameState.usableItems = [];
            GameState.powerBoostTimer = 0;
            GameState.shieldTimer = 0;
            GameState.boss = null;
            GameState.bossDefeated = {};
            GameState.bossUnlocked = false;
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

    // Score, coins and level
    const scoreText = `SCORE: ${GameState.score} | 🪙${GameState.coins}`;

    if (GameState.currentWorld === 'real') {
        indicator.textContent = `REAL WORLD - Level ${Levels.current} | ${scoreText}`;
        indicator.className = 'real-world';
    } else {
        indicator.textContent = `DREAM WORLD - Level ${Levels.current} | ${scoreText}`;
        indicator.className = 'dream-world';
    }

    // Health, lives, and resources
    const hp = `HP: ${'❤'.repeat(GameState.health)}${'♡'.repeat(GameState.maxHealth - GameState.health)}`;
    const lives = ` | LIVES: ${GameState.lives}`;
    const essence = GameState.dreamEssence > 0 ? ` | 💜×${GameState.dreamEssence}` : '';
    const energy = GameState.realEnergy > 0 ? ` | 💚×${GameState.realEnergy}` : '';
    hintsEl.textContent = hp + lives + essence + energy;

    // Inventory: Keys + Usable items
    let invText = '';

    // Keys
    if (GameState.inventory.length > 0) {
        invText = GameState.inventory.join(', ');
    }

    // Usable items with keybinds - show stacked counts
    if (GameState.usableItems.length > 0) {
        const powerCount = GameState.usableItems.filter(i => i === 'power_boost').length;
        // Count all shield types
        const shieldCount = GameState.usableItems.filter(i =>
            i === 'shield' || i === 'shield_1' || i === 'shield_3' || i === 'shield_5'
        ).length;
        const itemDisplay = [];
        if (powerCount > 0) itemDisplay.push(`[1]⭐Power×${powerCount}`);
        if (shieldCount > 0) itemDisplay.push(`[2]🛡Shield×${shieldCount}`);
        invText += (invText ? ' | ' : '') + itemDisplay.join(' ');
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

// Draw world indicator at top of screen
function drawWorldIndicator() {
    const isReal = GameState.currentWorld === 'real';
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;
    const text = isReal ? 'REAL WORLD - X to shoot' : 'DREAM WORLD - X for fireball';
    const bgColor = isReal ? 'rgba(255, 102, 0, 0.8)' : 'rgba(138, 43, 226, 0.8)';
    const textColor = isReal ? '#fff' : '#DDA0DD';

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(5, yOffset + 5, 220, 22);
    ctx.fillStyle = bgColor;
    ctx.fillRect(6, yOffset + 6, 218, 20);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(text, 12, yOffset + 20);

    // Show level and room info
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(VIEWPORT_WIDTH - 105, yOffset + 5, 100, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Courier New';
    const roomText = isReal ? `L${Levels.current} R${GameState.currentRoom}` : `Level ${Levels.current}`;
    ctx.fillText(roomText, VIEWPORT_WIDTH - 98, yOffset + 20);
}

function drawPowerUpStatus() {
    const isReal = GameState.currentWorld === 'real';
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;
    const yBase = yOffset + 30; // Position below world indicator

    // Power boost indicator - shows 2x DMG + 1.5x SPD
    if (GameState.powerBoostTimer > 0) {
        ctx.fillStyle = 'rgba(255, 136, 0, 0.9)';
        ctx.fillRect(5, yBase, 110, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`⚡2xDMG 1.5xSPD ${Math.ceil(GameState.powerBoostTimer / 120)}s`, 8, yBase + 12);
    }

    // Shield indicator - show hits remaining
    if (GameState.shieldTimer > 0 && GameState.shieldHits > 0) {
        // Color based on hits remaining
        const shieldColor = GameState.shieldHits >= 5 ? 'rgba(138, 43, 226, 0.9)' :
                           GameState.shieldHits >= 3 ? 'rgba(100, 149, 237, 0.9)' :
                           'rgba(68, 136, 255, 0.8)';
        ctx.fillStyle = shieldColor;
        ctx.fillRect(5, yBase + (GameState.powerBoostTimer > 0 ? 20 : 0), 95, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`🛡 SHIELD ×${GameState.shieldHits}`, 10, yBase + 12 + (GameState.powerBoostTimer > 0 ? 20 : 0));
    }

    // Shield visual effect around player
    if (GameState.shieldTimer > 0) {
        const cam = isReal ? RealCamera : DreamCamera;
        const drawX = Player.x - cam.x + Player.width / 2;
        const drawY = Player.y - cam.y + yOffset + Player.height / 2;

        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawMessage() {
    if (GameState.messageTimer <= 0 || !GameState.messageText) return;

    const isReal = GameState.currentWorld === 'real';
    const yOffset = isReal ? REAL_WORLD_Y_OFFSET : DREAM_WORLD_Y_OFFSET;
    const yPos = yOffset + VIEWPORT_HEIGHT / 2 - 10; // Center in current viewport

    // Pulsing effect
    const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;

    // Background
    ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * pulse})`;
    ctx.fillRect(GAME_WIDTH / 2 - 180, yPos - 15, 360, 40);

    // Border
    ctx.strokeStyle = `rgba(255, 100, 100, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(GAME_WIDTH / 2 - 180, yPos - 15, 360, 40);

    // Text
    ctx.fillStyle = `rgba(255, 255, 100, ${pulse})`;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(GameState.messageText, GAME_WIDTH / 2, yPos + 10);
    ctx.textAlign = 'left';
}

function drawPauseButton() {
    // Draw pause button in top right corner
    const btnX = GAME_WIDTH - 55;
    const btnY = 5;
    const btnW = 50;
    const btnH = 20;

    // Button background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(btnX, btnY, btnW, btnH);

    // Button border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    // Button text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('[P]ause', btnX + btnW / 2, btnY + 14);
    ctx.textAlign = 'left';
}

// ============================================
// GAME LOOP
// ============================================

function update() {
    Player.update();
    Camera.update(); // Update camera to follow player
    updateEnemies();
    updateBoss();
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

    // Shop screen (after level 3 boss)
    if (GameState.inShop) {
        drawShop();
        return;
    }

    // Draw BOTH worlds (split-screen layout)
    RealWorld.draw();   // Top half
    DreamWorld.draw();  // Bottom half

    // Draw divider line between worlds
    ctx.fillStyle = '#444';
    ctx.fillRect(0, DREAM_WORLD_Y_OFFSET - 2, GAME_WIDTH, 4);
    ctx.fillStyle = '#888';
    ctx.fillRect(0, DREAM_WORLD_Y_OFFSET - 1, GAME_WIDTH, 2);

    // Draw game entities in active world only (with camera offset)
    drawEnemies();
    drawBoss();
    drawDrops();
    drawProjectiles();
    Player.draw();

    // UI elements (fixed on screen, no camera offset)
    drawWorldIndicator();
    drawPowerUpStatus();
    drawMessage();
    drawPauseButton();

    // Pause overlay
    if (GameState.screenState === 'paused') {
        drawPauseMenu();
        return;
    }

    // Game over overlay (WASTED style)
    if (GameState.gameOver) {
        drawGameOver();
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

    // Menu options - always show all 3 for testing
    const options = ['LEVEL 1', 'LEVEL 4', 'LEVEL 6 (DEBUG)'];

    const btnWidth = 180;
    const btnHeight = 35;
    const btnX = (GAME_WIDTH - btnWidth) / 2;
    const startBtnY = 290;

    for (let i = 0; i < options.length; i++) {
        const btnY = startBtnY + i * 42;
        const isSelected = GameState.titleSelection === i;

        // Button glow for selected
        if (isSelected) {
            const glowIntensity = Math.sin(time * 4) * 0.3 + 0.7;
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 20 * glowIntensity;
        }

        // Button background
        ctx.fillStyle = isSelected ? '#9932cc' : '#4a1070';
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        // Button border
        ctx.fillStyle = isSelected ? '#ff69b4' : '#6a3090';
        ctx.fillRect(btnX, btnY, btnWidth, 3);
        ctx.fillRect(btnX, btnY, 3, btnHeight);
        ctx.fillStyle = isSelected ? '#4a1070' : '#2a0040';
        ctx.fillRect(btnX, btnY + btnHeight - 3, btnWidth, 3);
        ctx.fillRect(btnX + btnWidth - 3, btnY, 3, btnHeight);

        ctx.shadowBlur = 0;

        // Button text
        ctx.fillStyle = isSelected ? '#fff' : '#999';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText(options[i], GAME_WIDTH / 2, btnY + 23);

        // Selection arrow
        if (isSelected) {
            ctx.fillStyle = '#ff69b4';
            ctx.fillText('>', btnX - 20, btnY + 23);
        }
    }

    // Controls hint
    const hintY = 430;
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('UP/DOWN to select, ENTER to start', GAME_WIDTH / 2, hintY);
    if (false) {
        ctx.fillText('Press ENTER or SPACE to start', GAME_WIDTH / 2, hintY);
    }
    ctx.fillText('ESC to pause during game', GAME_WIDTH / 2, hintY + 20);

    // Controls info
    ctx.fillStyle = '#666';
    ctx.font = '11px Courier New';
    ctx.fillText('Arrow Keys: Move | X: Shoot (hold to charge) | C: Melee', GAME_WIDTH / 2, 480);
    ctx.fillText('Z: World Power | 1-3: Use Items | E: Enter Doors', GAME_WIDTH / 2, 500);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    const t = GameState.gameOverTimer;

    // Desaturation effect - darken with reddish tint (slowed by 0.5x)
    const fadeIn = Math.min(1, t / 60); // Fade in over 1 second
    ctx.fillStyle = `rgba(20, 0, 0, ${0.7 * fadeIn})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Scanline effect
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * fadeIn})`;
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
        ctx.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Only show text after initial fade
    if (t > 40) {
        const textFade = Math.min(1, (t - 40) / 40);

        // Glitch offset
        const glitchX = t < 120 ? (Math.random() - 0.5) * 10 : 0;
        const glitchY = t < 120 ? (Math.random() - 0.5) * 5 : 0;

        // Big blocky "GAME OVER" text
        ctx.save();
        ctx.translate(GAME_WIDTH / 2 + glitchX, GAME_HEIGHT / 2 - 30 + glitchY);

        // Red glow/shadow
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 * textFade})`;
        ctx.font = 'bold 64px Courier New';
        ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) {
            ctx.fillText('GAME OVER', 2 + i, 2 + i);
        }

        // Main text - white with red tint
        ctx.fillStyle = `rgba(255, 50, 50, ${textFade})`;
        ctx.fillText('GAME OVER', 0, 0);

        // Pixel block effect on letters
        if (t < 160) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.8 * textFade})`;
            for (let i = 0; i < 10; i++) {
                const bx = (Math.random() - 0.5) * 300;
                const by = (Math.random() - 0.5) * 60;
                const bs = 4 + Math.random() * 8;
                ctx.fillRect(bx, by - 20, bs, bs);
            }
        }

        ctx.restore();

        // Subtitle
        if (t > 120) {
            const subFade = Math.min(1, (t - 120) / 60);
            ctx.fillStyle = `rgba(200, 200, 200, ${subFade})`;
            ctx.font = '18px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Returning to title...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
            ctx.textAlign = 'left';
        }
    }

    // VHS-style color separation at edges
    if (t > 20 && t < 200) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 0, 0, 0.1)`;
        ctx.fillRect(0, 0, 3, GAME_HEIGHT);
        ctx.fillStyle = `rgba(0, 255, 255, 0.1)`;
        ctx.fillRect(GAME_WIDTH - 3, 0, 3, GAME_HEIGHT);
        ctx.globalCompositeOperation = 'source-over';
    }
}

function drawShop() {
    // Dark purple background
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Starfield background effect
    const time = Date.now() / 1000;
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + time * 10) % GAME_WIDTH;
        const y = (i * 89 + Math.sin(time + i) * 20) % GAME_HEIGHT;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Shop title
    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('DREAM SHOP', GAME_WIDTH / 2, 60);

    // Coins display
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`Coins: ${GameState.coins}`, GAME_WIDTH / 2, 95);

    // Shop items
    const startY = 140;
    const itemHeight = 45;

    ShopItems.forEach((item, i) => {
        const y = startY + i * itemHeight;
        const isSelected = GameState.shopSelection === i;
        const canAfford = item.price === 0 || GameState.coins >= item.price;

        // Selection background
        if (isSelected) {
            ctx.fillStyle = 'rgba(147, 112, 219, 0.4)';
            ctx.fillRect(60, y - 15, GAME_WIDTH - 120, 38);
            ctx.strokeStyle = '#9370db';
            ctx.lineWidth = 2;
            ctx.strokeRect(60, y - 15, GAME_WIDTH - 120, 38);
        }

        // Item name
        if (item.price === 0) {
            // Continue button - special styling
            ctx.fillStyle = isSelected ? '#00ff00' : '#88ff88';
            ctx.font = isSelected ? 'bold 18px Courier New' : '16px Courier New';
        } else {
            ctx.fillStyle = canAfford ? (isSelected ? '#fff' : '#ccc') : '#666';
            ctx.font = isSelected ? 'bold 16px Courier New' : '14px Courier New';
        }
        ctx.textAlign = 'left';
        ctx.fillText(item.name, 80, y + 5);

        // Price
        if (item.price > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = canAfford ? '#ffd700' : '#664400';
            ctx.fillText(`${item.price} coins`, GAME_WIDTH - 80, y + 5);
        }
    });

    // Current inventory display
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Health: ${GameState.health}/${GameState.maxHealth} | Lives: ${GameState.lives + 1} | Items: ${GameState.usableItems.length}`, GAME_WIDTH / 2, GAME_HEIGHT - 50);

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('↑/↓ to select, ENTER to buy', GAME_WIDTH / 2, GAME_HEIGHT - 25);

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
    if (GameState.screenState === 'playing' && !GameState.gameOver && !GameState.inShop) {
        update();
    }

    // Handle game over animation (slowed by 0.5x)
    if (GameState.gameOver) {
        GameState.gameOverTimer++;

        // After 360 frames (6 seconds), reset to title
        if (GameState.gameOverTimer > 360) {
            resetToTitle();
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

function resetToTitle() {
    // Full reset
    GameState.gameOver = false;
    GameState.gameOverTimer = 0;
    GameState.maxHealth = 3;
    GameState.health = GameState.maxHealth;
    GameState.lives = 2;
    GameState.score = 0;
    GameState.coins = 0; // Reset shop currency
    GameState.inventory = [];
    GameState.drops = [];
    GameState.projectiles = [];
    GameState.killedEnemies = { real: {}, dream: {} };
    GameState.dreamEssence = 0;
    GameState.realEnergy = 0;
    GameState.usableItems = [];
    GameState.powerBoostTimer = 0;
    GameState.shieldTimer = 0;
    GameState.shieldHits = 0;
    GameState.boss = null;
    GameState.bossDefeated = {};
    GameState.bossUnlocked = false;
    GameState.inShop = false;
    GameState.currentWorld = 'real';
    GameState.cameraX = 0;
    GameState.screenState = 'title';
    GameState.titleSelection = 0;
    Levels.loadLevel(1);
    Player.init();
    spawnEnemies();
    updateUI();
}

// ============================================
// START
// ============================================

Levels.loadLevel(1);
Player.init();
spawnEnemies();
updateUI();
gameLoop();

console.log('Dreamworld v2.0 - Double the Content! 6 levels, 2 bosses (Nightmare Kuriboh L3, Void Specter L6), Dream Shop after L3, coins system!');
