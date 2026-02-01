// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions
const GAME_WIDTH = 640;
const REAL_WORLD_HEIGHT = 320; // 10 tiles - SQUARE
const DREAM_WORLD_HEIGHT = 192; // 6 tiles - shorter for sidescroller
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT + DREAM_WORLD_HEIGHT;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const DREAM_WORLD_Y_OFFSET = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// LEVEL DATA (templates - will be cloned)
// ============================================

const LevelTemplates = {
    realWorld: {
        // 10x10 square maps
        1: [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1,4,0,1],
            [1,0,0,0,0,0,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,1,1,0,1],
            [1,0,0,0,0,0,1,2,0,1],
            [1,0,0,0,0,0,1,0,3,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1],
        ],
        2: [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,1,0,0,0,0,4,1],
            [1,0,0,1,0,0,1,0,0,1],
            [1,0,0,0,0,0,1,0,0,1],
            [1,1,0,0,1,0,0,0,0,1],
            [1,0,0,0,1,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,2,1],
            [1,0,1,1,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,0,3,1],
            [1,1,1,1,1,1,1,1,1,1],
        ],
        3: [
            [1,1,1,1,1,1,1,1,1,1],
            [1,4,0,0,1,0,0,0,0,1],
            [1,1,1,0,1,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,1,2,0,3,1],
            [1,1,1,1,1,1,1,1,1,1],
        ]
    },
    dreamWorld: {
        // 6 tiles high, elongated horizontally (40+ tiles wide)
        1: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,3,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        2: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1,6],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,4,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,3,6],
            [1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,1,6],
        ],
        3: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,1,6],
            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,4,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,1,6],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,3,6],
            [1,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1,1,6],
        ]
    }
};

// ============================================
// LEVELS - Active copies of templates
// ============================================

const Levels = {
    current: 1,
    realWorld: null,
    dreamWorld: null,

    loadLevel(num) {
        this.current = num;
        // Deep clone the level templates so we don't modify originals
        this.realWorld = JSON.parse(JSON.stringify(LevelTemplates.realWorld[num]));
        this.dreamWorld = JSON.parse(JSON.stringify(LevelTemplates.dreamWorld[num]));
    },

    getReal() {
        return this.realWorld;
    },

    getDream() {
        return this.dreamWorld;
    },

    nextLevel() {
        if (this.current >= 3) {
            return false; // Game complete
        }
        this.loadLevel(this.current + 1);
        return true;
    },

    reset() {
        this.loadLevel(1);
    }
};

// ============================================
// GAME STATE
// ============================================

const GameState = {
    currentWorld: 'real',
    inventory: [],
    keysPressed: {},
    portalCooldown: 0,
    cameraX: 0,
    nearDoor: null,
    gameComplete: false
};

// ============================================
// INPUT HANDLING
// ============================================

const KeyState = {
    justPressed: {}
};

document.addEventListener('keydown', (e) => {
    if (!GameState.keysPressed[e.code]) {
        KeyState.justPressed[e.code] = true;
    }
    GameState.keysPressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    GameState.keysPressed[e.code] = false;
    KeyState.justPressed[e.code] = false;
});

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
    x: 64,
    y: 64,
    width: 28,
    height: 28,

    // Grid position
    gridX: 2,
    gridY: 2,

    // Movement state
    isMoving: false,
    moveProgress: 0,
    moveSpeed: 0.12,
    startX: 0,
    startY: 0,
    targetGridX: 0,
    targetGridY: 0,

    // Jump/Fall state for sidescroller
    isJumping: false,
    isFalling: false,
    jumpPhase: 0, // 0-1 for jump arc
    fallSpeed: 0,

    facing: 1,
    animFrame: 0,
    animTimer: 0,

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
    },

    update() {
        if (GameState.portalCooldown > 0) {
            GameState.portalCooldown--;
        }

        if (GameState.currentWorld === 'real') {
            this.updateTopDown();
        } else {
            this.updateSideScroller();
            this.updateCamera();
        }

        // Animation
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
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
            // Check for input - allow holding keys for continuous stepping (like Pokemon)
            let dx = 0, dy = 0;

            // Prioritize vertical vs horizontal (no diagonal movement)
            if (GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) dy = -1;
            else if (GameState.keysPressed['ArrowDown'] || GameState.keysPressed['KeyS']) dy = 1;
            else if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) dx = -1;
            else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) dx = 1;

            if (dx !== 0 || dy !== 0) {
                this.tryMove(dx, dy, Levels.getReal());
            }
        }
    },

    updateSideScroller() {
        const tiles = Levels.getDream();
        const maxY = tiles.length - 1;

        // Handle jumping (allows horizontal movement during jump)
        if (this.isJumping) {
            this.jumpPhase += 0.02; // Slow jump

            // Allow horizontal movement during jump
            if (!this.isMoving) {
                if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
                    this.facing = -1;
                    this.tryMoveSideAir(-1, tiles);
                } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
                    this.facing = 1;
                    this.tryMoveSideAir(1, tiles);
                }
            }

            // Process horizontal movement during jump
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

            if (this.jumpPhase >= 1) {
                // Jump complete - now fall
                this.isJumping = false;
                this.jumpPhase = 0;
                this.gridY = this.targetGridY;
                this.y = this.gridY * TILE_SIZE + 2;
                this.startFalling(tiles);
            } else {
                // Smooth jump arc
                const jumpHeight = 2.5 * TILE_SIZE;
                const t = this.jumpPhase;
                // Parabolic arc: goes up then down
                const arcHeight = jumpHeight * Math.sin(t * Math.PI);

                const startY = this.startY;
                const endY = this.targetGridY * TILE_SIZE + 2;

                // Linear interpolation for Y position plus arc offset
                this.y = startY + (endY - startY) * t - arcHeight;
            }
            return;
        }

        // Handle falling (allows horizontal movement during fall)
        if (this.isFalling) {
            this.fallSpeed += 0.008; // Gentle gravity
            this.y += this.fallSpeed * TILE_SIZE;

            // Allow horizontal movement during fall
            if (!this.isMoving) {
                if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
                    this.facing = -1;
                    this.tryMoveSideAir(-1, tiles);
                } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
                    this.facing = 1;
                    this.tryMoveSideAir(1, tiles);
                }
            }

            // Process horizontal movement during fall
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

            // Check if we've reached next tile down
            const currentTileY = Math.floor((this.y + this.height) / TILE_SIZE);

            if (currentTileY > this.gridY) {
                // Check if there's ground at this new position
                if (currentTileY < tiles.length && this.hasGround(this.gridX, currentTileY, tiles)) {
                    // Land on this tile
                    this.gridY = currentTileY - 1;
                    this.y = this.gridY * TILE_SIZE + 2;
                    this.isFalling = false;
                    this.fallSpeed = 0;
                } else if (currentTileY >= maxY) {
                    // Fell off bottom
                    this.respawnInDreamWorld();
                } else {
                    // Keep falling
                    this.gridY = currentTileY;
                }
            }
            return;
        }

        // Handle horizontal movement on ground
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;

            if (this.moveProgress >= 1) {
                this.gridX = this.targetGridX;
                this.x = this.gridX * TILE_SIZE + 2;
                this.isMoving = false;
                this.moveProgress = 0;

                // Check if we need to fall
                this.startFalling(tiles);
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 2 - this.startX) * this.moveProgress;
            }
            return;
        }

        // Not moving - check for ground first
        if (!this.hasGround(this.gridX, this.gridY + 1, tiles)) {
            this.startFalling(tiles);
            return;
        }

        // Process input - allow holding keys for continuous movement
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            this.facing = -1;
            this.tryMoveSide(-1, tiles);
        } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            this.facing = 1;
            this.tryMoveSide(1, tiles);
        }

        // Jump requires a press (not hold) to prevent bunny hopping
        if (consumeKeyPress('Space') || consumeKeyPress('ArrowUp') || consumeKeyPress('KeyW')) {
            this.tryJump(tiles);
        }
    },

    hasGround(x, y, tiles) {
        if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) {
            return false;
        }
        const tile = tiles[y][x];
        return tile === 1 || tile === 6; // Platform or end wall
    },

    startFalling(tiles) {
        if (this.isFalling || this.isJumping) return;

        // Check if there's ground directly below
        if (!this.hasGround(this.gridX, this.gridY + 1, tiles)) {
            this.isFalling = true;
            this.fallSpeed = 0.02;
        }
    },

    tryMove(dx, dy, tiles) {
        const newX = this.gridX + dx;
        const newY = this.gridY + dy;

        if (newY < 0 || newY >= tiles.length || newX < 0 || newX >= tiles[0].length) {
            return;
        }

        const tile = tiles[newY][newX];
        if (tile !== 1 && tile !== 3) {
            this.startX = this.x;
            this.startY = this.y;
            this.targetGridX = newX;
            this.targetGridY = newY;
            this.isMoving = true;
            this.moveProgress = 0;
        }
    },

    tryMoveSide(dx, tiles) {
        const newX = this.gridX + dx;

        if (newX < 0 || newX >= tiles[0].length) return;

        const tile = tiles[this.gridY][newX];
        if (tile !== 1 && tile !== 3 && tile !== 6) {
            this.startX = this.x;
            this.targetGridX = newX;
            this.isMoving = true;
            this.moveProgress = 0;
        }
    },

    tryMoveSideAir(dx, tiles) {
        // Movement during jump/fall - check target horizontal position
        const newX = this.gridX + dx;

        if (newX < 0 || newX >= tiles[0].length) return;

        // In the air, only check the current Y grid position for walls
        const checkY = Math.max(0, Math.min(tiles.length - 1, this.gridY));
        const tile = tiles[checkY][newX];
        if (tile !== 1 && tile !== 6) {
            this.startX = this.x;
            this.targetGridX = newX;
            this.isMoving = true;
            this.moveProgress = 0;
        }
    },

    tryJump(tiles) {
        if (this.isJumping || this.isFalling) return;

        // Must be on ground to jump
        if (!this.hasGround(this.gridX, this.gridY + 1, tiles)) return;

        // Jump up 2 tiles (or less if blocked)
        let targetY = this.gridY - 2;
        if (targetY < 0) targetY = 0;

        // Check for ceiling
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

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        let yOffset, cameraOffset;

        if (GameState.currentWorld === 'real') {
            yOffset = 0;
            cameraOffset = 0;
        } else {
            yOffset = DREAM_WORLD_Y_OFFSET;
            cameraOffset = GameState.cameraX;
        }

        const drawX = this.x - cameraOffset;
        const drawY = this.y + yOffset;

        if (drawX < -this.width || drawX > GAME_WIDTH) return;

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
        const bounce = isAnimating ? Math.sin(this.animTimer * 0.4) * 2 : 0;
        const legOffset = isAnimating ? (this.animFrame % 2 === 0 ? 3 : -3) : 0;

        // Legs
        ctx.fillStyle = bodyColor;
        ctx.fillRect(4, 18 + bounce, 8, 8);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(2 - legOffset, 24 + bounce, 10, 4);

        ctx.fillStyle = bodyColor;
        ctx.fillRect(16, 18 + bounce, 8, 8);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(16 + legOffset, 24 + bounce, 10, 4);

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(4, 8 + bounce, 20, 12);

        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(14, 6 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();

        // Hair/spikes
        ctx.fillStyle = isReal ? '#2255aa' : '#cc3355';
        ctx.beginPath();
        ctx.moveTo(6, 2 + bounce);
        ctx.lineTo(10, -4 + bounce);
        ctx.lineTo(14, 2 + bounce);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14, 0 + bounce);
        ctx.lineTo(20, -6 + bounce);
        ctx.lineTo(20, 4 + bounce);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 3 + bounce, 4, 5);
        ctx.fillRect(16, 3 + bounce, 4, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(12, 4 + bounce, 2, 3);
        ctx.fillRect(18, 4 + bounce, 2, 3);

        ctx.restore();
    }
};

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

        // Label
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, 5, 140, 22);
        ctx.fillStyle = '#90EE90';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`REAL WORLD - Level ${Levels.current}`, 10, 20);
    },

    drawTile(tile, px, py) {
        switch (tile) {
            case 1:
                ctx.fillStyle = '#2a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#3a7540';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#2a5530';
                ctx.fillRect(px + TILE_SIZE/2 - 1, py, 2, TILE_SIZE);
                ctx.fillRect(px, py + TILE_SIZE/2 - 1, TILE_SIZE, 2);
                break;
            case 2:
                ctx.fillStyle = '#9933ff';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#cc66ff';
                const pulse = 8 + Math.sin(Date.now() / 200) * 4;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, TILE_SIZE - 4);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 4, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + TILE_SIZE/2 - 4, 4, 8);
                break;
            case 4:
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 12, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 16, 4, 10);
                ctx.fillRect(px + TILE_SIZE/2, py + 20, 6, 3);
                break;
            case 5:
                ctx.fillStyle = '#3a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a3320';
                ctx.fillRect(px + 8, py + 2, TILE_SIZE - 16, TILE_SIZE - 2);
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

        // Label
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, DREAM_WORLD_Y_OFFSET + 5, 150, 22);
        ctx.fillStyle = '#DDA0DD';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`DREAM WORLD - Level ${Levels.current}`, 10, DREAM_WORLD_Y_OFFSET + 20);

        // Door prompt
        if (GameState.nearDoor && GameState.currentWorld === 'dream') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(GAME_WIDTH/2 - 80, DREAM_WORLD_Y_OFFSET + DREAM_WORLD_HEIGHT - 35, 160, 28);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to enter', GAME_WIDTH/2, DREAM_WORLD_Y_OFFSET + DREAM_WORLD_HEIGHT - 16);
        }
    },

    drawTile(tile, px, py) {
        if (px < -TILE_SIZE || px > GAME_WIDTH) return;

        switch (tile) {
            case 1:
                ctx.fillStyle = '#5a3a7a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#7a5a9a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 6);
                ctx.fillStyle = '#4a2a6a';
                ctx.fillRect(px + 2, py + TILE_SIZE - 4, TILE_SIZE - 4, 2);
                break;
            case 2:
                ctx.fillStyle = '#33ff99';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#66ffbb';
                const pulse = 8 + Math.sin(Date.now() / 200) * 4;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, TILE_SIZE - 4);
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 4, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + TILE_SIZE/2 - 4, 4, 8);
                break;
            case 4:
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 12, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 16, 4, 10);
                ctx.fillRect(px + TILE_SIZE/2, py + 20, 6, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(px + TILE_SIZE/2 - 5, py + 10, 2, 2);
                break;
            case 5:
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(px + 6, py + 2, TILE_SIZE - 12, TILE_SIZE - 2);
                ctx.fillStyle = '#ffaa33';
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 300) * 0.2;
                ctx.fillRect(px + 8, py + 4, TILE_SIZE - 16, TILE_SIZE - 4);
                ctx.globalAlpha = 1;
                break;
            case 6:
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 6 + Math.sin(Date.now()/200)*2, 0, Math.PI * 2);
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

            if (tileY >= 0 && tileY < tiles.length &&
                tileX >= 0 && tileX < tiles[0].length) {

                const tile = tiles[tileY][tileX];
                const tileRect = {
                    x: tileX * TILE_SIZE,
                    y: tileY * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                };

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
                            const idx = GameState.inventory.indexOf(neededKey);
                            if (idx > -1) GameState.inventory.splice(idx, 1);
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
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function switchWorld() {
    GameState.portalCooldown = 60;

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
        Player.gridX = 6;
        Player.gridY = 6;
        Player.x = Player.gridX * TILE_SIZE + 2;
        Player.y = Player.gridY * TILE_SIZE + 2;
        Player.isMoving = false;
        Player.moveProgress = 0;
    }
    updateUI();
}

function enterDoor() {
    nextLevel();
}

function reachGoal() {
    nextLevel();
}

function nextLevel() {
    if (Levels.nextLevel()) {
        console.log(`Advancing to Level ${Levels.current}`);
        GameState.currentWorld = 'real';
        GameState.inventory = [];
        GameState.cameraX = 0;
        Player.init();
        updateUI();
    } else {
        alert('Congratulations! You completed all 3 levels!');
        Levels.reset();
        GameState.currentWorld = 'real';
        GameState.inventory = [];
        GameState.cameraX = 0;
        Player.init();
        updateUI();
    }
}

function updateUI() {
    const indicator = document.getElementById('world-indicator');
    const inventoryEl = document.getElementById('inventory-items');
    const hintsEl = document.getElementById('controls-hint');

    if (GameState.currentWorld === 'real') {
        indicator.textContent = `REAL WORLD - L${Levels.current}`;
        indicator.className = 'real-world';
        hintsEl.textContent = 'Arrows: step';
    } else {
        indicator.textContent = `DREAM WORLD - L${Levels.current}`;
        indicator.className = 'dream-world';
        hintsEl.textContent = 'Arrows + Space | E: door';
    }

    inventoryEl.textContent = GameState.inventory.length > 0
        ? GameState.inventory.join(', ')
        : 'Empty';
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

// ============================================
// GAME LOOP
// ============================================

function update() {
    Player.update();
    checkInteractions();
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    RealWorld.draw();
    drawDivider();
    DreamWorld.draw();
    drawActiveHighlight();
    Player.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START
// ============================================

Levels.loadLevel(1);
Player.init();
updateUI();
gameLoop();

console.log('Dreamworld v0.6 - Air control during jump + continuous stepping');
