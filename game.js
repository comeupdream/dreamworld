// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions
const GAME_WIDTH = 640;
const WORLD_HEIGHT = 256;
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = WORLD_HEIGHT * 2 + DIVIDER_HEIGHT;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const DREAM_WORLD_Y_OFFSET = WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// LEVELS
// ============================================

const Levels = {
    current: 1,

    realWorld: {
        1: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1,4,1,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        2: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,1,0,0,4,0,0,1,0,0,0,0,1,1,0,0,1],
            [1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,2,0,3,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        3: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1],
            [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,3,2,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ]
    },

    dreamWorld: {
        1: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,6],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,6],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,1,1,6],
            [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,6],
        ],
        2: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [1,1,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,6],
            [0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,4,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,3,6],
            [1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,1,1,6],
            [1,1,1,1,1,1,0,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,0,0,0,1,1,0,1,1,0,1,1,1,6],
        ],
        3: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
            [1,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,6],
            [0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,4,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,3,6],
            [1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,1,0,0,1,1,6],
            [1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,0,1,1,1,6],
        ]
    },

    getReal() {
        return this.realWorld[this.current] || this.realWorld[1];
    },

    getDream() {
        return this.dreamWorld[this.current] || this.dreamWorld[1];
    },

    nextLevel() {
        this.current++;
        if (this.current > 3) {
            return false; // Game complete
        }
        return true;
    },

    reset() {
        this.current = 1;
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

document.addEventListener('keydown', (e) => {
    GameState.keysPressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    GameState.keysPressed[e.code] = false;
});

// ============================================
// PLAYER
// ============================================

const Player = {
    x: 64,
    y: 64,
    width: 28,
    height: 28,

    // Grid-based movement (used in BOTH worlds now)
    gridX: 2,
    gridY: 2,
    isMoving: false,
    moveProgress: 0,
    moveSpeed: 0.18, // Speed of step animation
    moveDirection: null,
    targetX: 2,
    targetY: 2,

    // Sidescroller additions
    isJumping: false,
    jumpProgress: 0,
    jumpStartY: 0,
    jumpTargetY: 0,
    jumpPeakHeight: 2.5, // Jump height in tiles
    facing: 1,

    // Falling
    isFalling: false,
    fallStartY: 0,
    fallProgress: 0,

    // Animation
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
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    },

    updateTopDown() {
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;

            if (this.moveProgress >= 1) {
                this.moveProgress = 0;
                this.isMoving = false;
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                this.x = this.gridX * TILE_SIZE + 2;
                this.y = this.gridY * TILE_SIZE + 2;
            } else {
                const startX = this.gridX * TILE_SIZE + 2;
                const startY = this.gridY * TILE_SIZE + 2;
                const endX = this.targetX * TILE_SIZE + 2;
                const endY = this.targetY * TILE_SIZE + 2;
                this.x = startX + (endX - startX) * this.moveProgress;
                this.y = startY + (endY - startY) * this.moveProgress;
            }
        } else {
            let dx = 0, dy = 0;

            if (GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) {
                dy = -1;
                this.moveDirection = 'up';
            } else if (GameState.keysPressed['ArrowDown'] || GameState.keysPressed['KeyS']) {
                dy = 1;
                this.moveDirection = 'down';
            } else if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
                dx = -1;
                this.moveDirection = 'left';
            } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
                dx = 1;
                this.moveDirection = 'right';
            }

            if (dx !== 0 || dy !== 0) {
                const newGridX = this.gridX + dx;
                const newGridY = this.gridY + dy;

                if (this.canMoveToReal(newGridX, newGridY)) {
                    this.targetX = newGridX;
                    this.targetY = newGridY;
                    this.isMoving = true;
                    this.moveProgress = 0;
                }
            }
        }
    },

    updateSideScroller() {
        const tiles = Levels.getDream();

        // Handle jumping
        if (this.isJumping) {
            this.jumpProgress += 0.08;

            if (this.jumpProgress >= 1) {
                // Landing
                this.isJumping = false;
                this.jumpProgress = 0;
                this.gridY = this.jumpTargetY;
                this.y = this.gridY * TILE_SIZE + 2;

                // Check if we need to fall further
                this.checkFalling(tiles);
            } else {
                // Parabolic jump arc
                const t = this.jumpProgress;
                const arc = -4 * (t - 0.5) * (t - 0.5) + 1; // Peaks at 0.5
                const startY = this.jumpStartY;
                const endY = this.jumpTargetY * TILE_SIZE + 2;
                const peakOffset = this.jumpPeakHeight * TILE_SIZE * arc;

                this.y = startY + (endY - startY) * t - peakOffset;
            }
            return; // Can't move while jumping
        }

        // Handle falling
        if (this.isFalling) {
            this.fallProgress += 0.15;

            if (this.fallProgress >= 1) {
                this.isFalling = false;
                this.fallProgress = 0;
                this.gridY = this.targetY;
                this.y = this.gridY * TILE_SIZE + 2;

                // Check if we need to fall more
                this.checkFalling(tiles);
            } else {
                const startY = this.fallStartY;
                const endY = this.targetY * TILE_SIZE + 2;
                this.y = startY + (endY - startY) * this.fallProgress;
            }
            return;
        }

        // Handle horizontal movement
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;

            if (this.moveProgress >= 1) {
                this.moveProgress = 0;
                this.isMoving = false;
                this.gridX = this.targetX;
                this.x = this.gridX * TILE_SIZE + 2;

                // Check if we need to fall
                this.checkFalling(tiles);
            } else {
                const startX = this.gridX * TILE_SIZE + 2;
                const endX = this.targetX * TILE_SIZE + 2;
                this.x = startX + (endX - startX) * this.moveProgress;
            }
            return; // Can't input while moving
        }

        // Check for ground beneath us first
        this.checkFalling(tiles);
        if (this.isFalling) return;

        // Process input - one step at a time
        let dx = 0;

        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            dx = -1;
            this.facing = -1;
        } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            dx = 1;
            this.facing = 1;
        }

        // Jump
        if (GameState.keysPressed['Space'] || GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) {
            this.tryJump(tiles);
        }

        // Horizontal movement
        if (dx !== 0 && !this.isJumping) {
            const newGridX = this.gridX + dx;

            if (this.canMoveToDream(newGridX, this.gridY, tiles)) {
                this.targetX = newGridX;
                this.isMoving = true;
                this.moveProgress = 0;
            }
        }
    },

    checkFalling(tiles) {
        if (this.isJumping || this.isFalling) return;

        const belowY = this.gridY + 1;

        // Check if there's ground below
        if (belowY < tiles.length) {
            const tileBelow = tiles[belowY][this.gridX];
            if (tileBelow !== 1 && tileBelow !== 6) {
                // No ground - fall
                this.isFalling = true;
                this.fallStartY = this.y;
                this.fallProgress = 0;
                this.targetY = belowY;
            }
        }

        // Fell off bottom
        if (this.gridY >= tiles.length - 1) {
            this.respawnInDreamWorld();
        }
    },

    tryJump(tiles) {
        if (this.isJumping || this.isFalling) return;

        // Find landing spot (2 tiles up, or highest reachable)
        let targetY = this.gridY - 2;

        // Can't jump above map
        if (targetY < 0) targetY = 0;

        // Check for ceiling collision
        for (let y = this.gridY - 1; y >= targetY; y--) {
            if (y >= 0 && tiles[y] && tiles[y][this.gridX] === 1) {
                targetY = y + 1;
                break;
            }
        }

        if (targetY < this.gridY) {
            this.isJumping = true;
            this.jumpProgress = 0;
            this.jumpStartY = this.y;
            this.jumpTargetY = targetY;
        }
    },

    canMoveToReal(tileX, tileY) {
        const tiles = Levels.getReal();
        if (tileY < 0 || tileY >= tiles.length ||
            tileX < 0 || tileX >= tiles[0].length) {
            return false;
        }
        const tile = tiles[tileY][tileX];
        return tile !== 1 && tile !== 3;
    },

    canMoveToDream(tileX, tileY, tiles) {
        if (tileY < 0 || tileY >= tiles.length ||
            tileX < 0 || tileX >= tiles[0].length) {
            return false;
        }
        const tile = tiles[tileY][tileX];
        return tile !== 1 && tile !== 3 && tile !== 6;
    },

    updateCamera() {
        const tiles = Levels.getDream();
        const mapWidth = tiles[0].length * TILE_SIZE;
        const targetCameraX = this.x - GAME_WIDTH / 3;
        const maxCameraX = mapWidth - GAME_WIDTH;

        GameState.cameraX += (targetCameraX - GameState.cameraX) * 0.1;
        GameState.cameraX = Math.max(0, Math.min(maxCameraX, GameState.cameraX));
    },

    respawnInDreamWorld() {
        this.gridX = 1;
        this.gridY = 2;
        this.x = this.gridX * TILE_SIZE + 2;
        this.y = this.gridY * TILE_SIZE + 2;
        this.isJumping = false;
        this.isFalling = false;
        this.isMoving = false;
        GameState.cameraX = 0;
    },

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
        const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;
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
        const bounce = isAnimating ? Math.sin(this.animTimer * 0.5) * 2 : 0;
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
        ctx.fillRect(0, 0, GAME_WIDTH, WORLD_HEIGHT);

        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                const tile = tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                this.drawTile(tile, px, py);
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, 5, 130, 22);
        ctx.fillStyle = '#90EE90';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`REAL WORLD - L${Levels.current}`, 10, 20);
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
        ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, GAME_WIDTH, WORLD_HEIGHT);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const baseX = (i * 73) % (GAME_WIDTH * 2);
            const x = (baseX - GameState.cameraX * 0.3 + GAME_WIDTH) % GAME_WIDTH;
            const y = DREAM_WORLD_Y_OFFSET + (i * 47) % (WORLD_HEIGHT - 60);
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
        ctx.fillRect(5, DREAM_WORLD_Y_OFFSET + 5, 140, 22);
        ctx.fillStyle = '#DDA0DD';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`DREAM WORLD - L${Levels.current}`, 10, DREAM_WORLD_Y_OFFSET + 20);

        if (GameState.nearDoor && GameState.currentWorld === 'dream') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(GAME_WIDTH/2 - 80, DREAM_WORLD_Y_OFFSET + WORLD_HEIGHT - 40, 160, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to enter', GAME_WIDTH/2, DREAM_WORLD_Y_OFFSET + WORLD_HEIGHT - 20);
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
                // Star
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
                            enterDoor();
                            GameState.keysPressed['KeyE'] = false;
                        }
                    }

                    if (tile === 6) {
                        reachGoal();
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
        Player.gridY = 2;
        Player.x = Player.gridX * TILE_SIZE + 2;
        Player.y = Player.gridY * TILE_SIZE + 2;
        Player.isMoving = false;
        Player.isJumping = false;
        Player.isFalling = false;
        Player.facing = 1;
        GameState.cameraX = 0;
    } else {
        GameState.currentWorld = 'real';
        Player.gridX = 13;
        Player.gridY = 3;
        Player.targetX = 13;
        Player.targetY = 3;
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
        // More levels to go
        GameState.currentWorld = 'real';
        GameState.inventory = [];
        GameState.cameraX = 0;
        Player.init();
        updateUI();
        console.log(`Starting Level ${Levels.current}!`);
    } else {
        // Game complete!
        GameState.gameComplete = true;
        alert('Congratulations! You completed all 3 levels!');
        Levels.reset();
        GameState.gameComplete = false;
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
        indicator.textContent = `REAL WORLD - Level ${Levels.current}`;
        indicator.className = 'real-world';
        hintsEl.textContent = 'Arrow keys: step | Portal: switch world';
    } else {
        indicator.textContent = `DREAM WORLD - Level ${Levels.current}`;
        indicator.className = 'dream-world';
        hintsEl.textContent = 'Arrows: step | Space: jump | E: enter door';
    }

    inventoryEl.textContent = GameState.inventory.length > 0
        ? GameState.inventory.join(', ')
        : 'Empty';
}

function drawDivider() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, WORLD_HEIGHT, GAME_WIDTH, DIVIDER_HEIGHT);
}

function drawActiveHighlight() {
    ctx.strokeStyle = GameState.currentWorld === 'real' ? '#90EE90' : '#DDA0DD';
    ctx.lineWidth = 4;
    ctx.shadowColor = GameState.currentWorld === 'real' ? '#90EE90' : '#DDA0DD';
    ctx.shadowBlur = 10;

    if (GameState.currentWorld === 'real') {
        ctx.strokeRect(2, 2, GAME_WIDTH - 4, WORLD_HEIGHT - 4);
    } else {
        ctx.strokeRect(2, DREAM_WORLD_Y_OFFSET + 2, GAME_WIDTH - 4, WORLD_HEIGHT - 4);
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

Player.init();
updateUI();
gameLoop();

console.log('Dreamworld v0.4 - Grid-based movement + 3 Levels!');
