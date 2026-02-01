// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// v1.1 - Enemy AI & Levels Update
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions (scaled down ~12%)
const TILE_SIZE = 56;
const REAL_WORLD_TILES = 10;
const GAME_WIDTH = REAL_WORLD_TILES * TILE_SIZE; // 560px
const REAL_WORLD_HEIGHT = REAL_WORLD_TILES * TILE_SIZE; // 560px
const DREAM_WORLD_HEIGHT = 6 * TILE_SIZE; // 336px
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT + DREAM_WORLD_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const DREAM_WORLD_Y_OFFSET = REAL_WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// LEVEL DATA - Just Level 1 for now
// ============================================

const LevelTemplates = {
    realWorld: {
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
            [1,0,0,0,1,0,0,0,4,1],
            [1,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,1,0,1],
            [1,1,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,1,2,0,1],
            [1,0,1,0,0,0,1,0,3,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1],
        ],
        3: [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,4,0,1],
            [1,0,1,0,1,0,1,1,0,1],
            [1,0,1,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,1,1],
            [1,1,0,1,0,0,0,2,0,1],
            [1,0,0,1,0,1,0,0,3,1],
            [1,0,0,0,0,1,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1],
        ]
    },
    dreamWorld: {
        1: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1,1,6],
            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,3,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        2: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,1,6],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,4,1,1,6],
            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,3,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ],
        3: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
            [1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0,1,6],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,4,1,1,6],
            [0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,3,6],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
        ]
    },
    // Enemy spawn positions per level
    // Types: 'patrol' (back and forth), 'chase' (follows player slowly)
    enemies: {
        real: {
            1: [
                { x: 3, y: 3, type: 'patrol', patrol: 'horizontal', range: 2, speed: 1.0 },
                { x: 5, y: 7, type: 'patrol', patrol: 'vertical', range: 2, speed: 1.0 }
            ],
            2: [
                { x: 4, y: 4, type: 'chase', speed: 0.5 },
                { x: 7, y: 2, type: 'patrol', patrol: 'horizontal', range: 2, speed: 1.2 },
                { x: 2, y: 6, type: 'patrol', patrol: 'vertical', range: 2, speed: 1.2 }
            ],
            3: [
                { x: 4, y: 4, type: 'chase', speed: 0.6 },
                { x: 6, y: 6, type: 'chase', speed: 0.5 },
                { x: 2, y: 2, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.5 },
                { x: 7, y: 7, type: 'patrol', patrol: 'vertical', range: 2, speed: 1.5 }
            ]
        },
        dream: {
            1: [
                { x: 10, y: 4, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.5 },
                { x: 20, y: 4, type: 'patrol', patrol: 'horizontal', range: 2, speed: 1.5 }
            ],
            2: [
                { x: 8, y: 4, type: 'patrol', patrol: 'horizontal', range: 2, speed: 1.8 },
                { x: 15, y: 4, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.5 },
                { x: 22, y: 4, type: 'patrol', patrol: 'horizontal', range: 2, speed: 2.0 }
            ],
            3: [
                { x: 6, y: 4, type: 'patrol', patrol: 'horizontal', range: 2, speed: 2.0 },
                { x: 12, y: 2, type: 'patrol', patrol: 'horizontal', range: 3, speed: 1.8 },
                { x: 18, y: 4, type: 'patrol', patrol: 'horizontal', range: 2, speed: 2.2 },
                { x: 24, y: 4, type: 'patrol', patrol: 'horizontal', range: 3, speed: 2.0 }
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
    gameComplete: false
};

// ============================================
// INPUT HANDLING
// ============================================

const KeyState = { justPressed: {} };

document.addEventListener('keydown', (e) => {
    if (!GameState.keysPressed[e.code]) {
        KeyState.justPressed[e.code] = true;
    }
    GameState.keysPressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyX'].includes(e.code)) {
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
    x: 56,
    y: 56,
    width: 48,
    height: 48,
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

    init() {
        this.gridX = 2;
        this.gridY = 2;
        this.x = this.gridX * TILE_SIZE + 4;
        this.y = this.gridY * TILE_SIZE + 4;
        this.isMoving = false;
        this.isJumping = false;
        this.isFalling = false;
        this.jumpPhase = 0;
        this.fallSpeed = 0;
        this.shootCooldown = 0;
    },

    update() {
        if (GameState.portalCooldown > 0) GameState.portalCooldown--;
        if (GameState.invincible > 0) GameState.invincible--;
        if (this.shootCooldown > 0) this.shootCooldown--;

        if (GameState.currentWorld === 'real') {
            this.updateTopDown();
        } else {
            this.updateSideScroller();
            this.updateCamera();
        }

        // Shooting - X key
        if (consumeKeyPress('KeyX') && this.shootCooldown <= 0) {
            this.shoot();
        }

        // Animation
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    },

    shoot() {
        this.shootCooldown = 20;

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

        GameState.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: vx * 8,
            vy: vy * 8,
            isFireball: GameState.currentWorld === 'dream',
            life: 60
        });
    },

    updateTopDown() {
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            if (this.moveProgress >= 1) {
                this.finishMove();
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 4 - this.startX) * this.moveProgress;
                this.y = this.startY + (this.targetGridY * TILE_SIZE + 4 - this.startY) * this.moveProgress;
            }
        } else {
            let dx = 0, dy = 0;
            if (GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) { dy = -1; this.facingY = -1; }
            else if (GameState.keysPressed['ArrowDown'] || GameState.keysPressed['KeyS']) { dy = 1; this.facingY = 1; }
            else if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) { dx = -1; this.facing = -1; this.facingY = 0; }
            else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) { dx = 1; this.facing = 1; this.facingY = 0; }

            if (dx !== 0 || dy !== 0) {
                this.tryMove(dx, dy, Levels.getReal());
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
                this.y = this.gridY * TILE_SIZE + 4;
                this.checkFalling(tiles);
            } else {
                const jumpHeight = 2.5 * TILE_SIZE;
                const arcHeight = jumpHeight * Math.sin(this.jumpPhase * Math.PI);
                const startY = this.startY;
                const endY = this.targetGridY * TILE_SIZE + 4;
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
                this.y = this.gridY * TILE_SIZE + 4;
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
                this.x = this.gridX * TILE_SIZE + 4;
                this.isMoving = false;
                this.moveProgress = 0;
                this.checkFalling(tiles);
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 4 - this.startX) * this.moveProgress;
            }
            return;
        }

        // Check if we should fall
        if (!this.isSolid(this.gridX, this.gridY + 1, tiles)) {
            this.isFalling = true;
            this.fallSpeed = 0.02;
            return;
        }

        // Input
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            this.facing = -1;
            this.tryMoveSide(-1, tiles);
        } else if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            this.facing = 1;
            this.tryMoveSide(1, tiles);
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
                this.x = this.gridX * TILE_SIZE + 4;
                this.isMoving = false;
                this.moveProgress = 0;
            } else {
                this.x = this.startX + (this.targetGridX * TILE_SIZE + 4 - this.startX) * this.moveProgress;
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
        if (newY < 0 || newY >= tiles.length || newX < 0 || newX >= tiles[0].length) return;
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

        // Check collision at current Y position
        const tile = tiles[this.gridY][newX];
        if (tile === 1 || tile === 3) return; // Blocked by wall or locked door

        this.startX = this.x;
        this.targetGridX = newX;
        this.isMoving = true;
        this.moveProgress = 0;
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
        this.x = this.gridX * TILE_SIZE + 4;
        this.y = this.gridY * TILE_SIZE + 4;
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
        this.x = this.gridX * TILE_SIZE + 4;
        this.y = this.gridY * TILE_SIZE + 4;
        this.isJumping = false;
        this.isFalling = false;
        this.isMoving = false;
        this.fallSpeed = 0;
        GameState.cameraX = 0;
    },

    takeDamage() {
        if (GameState.invincible > 0) return;
        GameState.health--;
        GameState.invincible = 60; // 1 second invincibility
        if (GameState.health <= 0) {
            // Reset level
            GameState.health = GameState.maxHealth;
            GameState.inventory = [];
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
        const bounce = isAnimating ? Math.sin(this.animTimer * 0.4) * 3 : 0;
        const legOffset = isAnimating ? (this.animFrame % 2 === 0 ? 5 : -5) : 0;

        // Legs (scaled down)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(6, 30 + bounce, 14, 14);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(3 - legOffset, 40 + bounce, 16, 7);
        ctx.fillStyle = bodyColor;
        ctx.fillRect(28, 30 + bounce, 14, 14);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(28 + legOffset, 40 + bounce, 16, 7);

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(6, 14 + bounce, 36, 20);

        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(24, 10 + bounce, 14, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = isReal ? '#2255aa' : '#cc3355';
        ctx.beginPath();
        ctx.moveTo(10, 3 + bounce);
        ctx.lineTo(17, -6 + bounce);
        ctx.lineTo(24, 3 + bounce);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(24, 0 + bounce);
        ctx.lineTo(34, -10 + bounce);
        ctx.lineTo(34, 7 + bounce);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(17, 5 + bounce, 6, 8);
        ctx.fillRect(27, 5 + bounce, 6, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(20, 7 + bounce, 3, 5);
        ctx.fillRect(30, 7 + bounce, 3, 5);

        ctx.restore();
    }
};

// ============================================
// ENEMIES
// ============================================

function spawnEnemies() {
    GameState.enemies = [];
    const world = GameState.currentWorld;
    const enemyData = LevelTemplates.enemies[world === 'real' ? 'real' : 'dream'][Levels.current];

    if (enemyData) {
        enemyData.forEach(e => {
            GameState.enemies.push({
                x: e.x * TILE_SIZE + 4,
                y: e.y * TILE_SIZE + 4,
                startX: e.x * TILE_SIZE + 4,
                startY: e.y * TILE_SIZE + 4,
                width: 42,
                height: 42,
                type: e.type || 'patrol',
                patrol: e.patrol || 'horizontal',
                range: (e.range || 2) * TILE_SIZE,
                speed: e.speed || 1.0,
                direction: 1,
                world: world
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
            // Chase enemy - moves toward player slowly
            const dx = Player.x - enemy.x;
            const dy = Player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) { // Only move if not already on player
                nextX = enemy.x + (dx / dist) * enemy.speed;
                nextY = enemy.y + (dy / dist) * enemy.speed;
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
            // Chase enemies try to move in both axes independently
            if (!blockedX) enemy.x = nextX;
            if (!blockedY) enemy.y = nextY;
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

        // Pac-Man style ghost - symmetrical dome with wavy bottom
        const isReal = GameState.currentWorld === 'real';
        const ghostColor = isReal ? '#ff4444' : '#cc44ff';
        const centerX = drawX + enemy.width / 2;
        const centerY = drawY + enemy.height / 2;
        const radius = 18;
        const waveTime = Date.now() * 0.01; // Animate wavy bottom

        // Ghost body - dome top
        ctx.fillStyle = ghostColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 4, radius, Math.PI, 0);
        ctx.lineTo(centerX + radius, centerY + 12);

        // Wavy bottom - 4 symmetric waves
        const waveCount = 4;
        const waveWidth = (radius * 2) / waveCount;
        for (let i = 0; i < waveCount; i++) {
            const wx = centerX + radius - (i + 0.5) * waveWidth;
            const waveOffset = Math.sin(waveTime + i) * 2;
            const wy = centerY + 12 + (i % 2 === 0 ? 6 + waveOffset : waveOffset);
            ctx.lineTo(wx, wy);
        }
        ctx.lineTo(centerX - radius, centerY + 12);
        ctx.closePath();
        ctx.fill();

        // Lighter inner highlight
        ctx.fillStyle = isReal ? '#ff7777' : '#dd77ff';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes - symmetrical, centered, looking at player
        const eyeOffsetX = 7;
        const eyeY = centerY - 4;
        const eyeRadius = 6;
        const pupilRadius = 3;

        // Look toward player
        const toPlayerX = Player.x - enemy.x;
        const toPlayerY = Player.y - enemy.y;
        const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;
        const lookX = (toPlayerX / dist) * 2;
        const lookY = (toPlayerY / dist) * 2;

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
                GameState.enemies.splice(i, 1);
                return false;
            }
        }

        return p.life > 0 && p.x > -50 && p.x < GAME_WIDTH * 3 && p.y > -50 && p.y < GAME_HEIGHT;
    });
}

function drawProjectiles() {
    const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
    const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;

    GameState.projectiles.forEach(p => {
        const drawX = p.x - cameraOffset;
        const drawY = p.y + yOffset;

        if (p.isFireball) {
            // Fireball (dream world)
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Bullet (real world)
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(drawX - 5, drawY - 2, 10, 5);
            ctx.fillStyle = '#fff';
            ctx.fillRect(drawX - 3, drawY - 1, 6, 3);
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
                const pulse = 12 + Math.sin(Date.now() / 200) * 6;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 8, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4:
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 20, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 4, py + 28, 8, 20);
                ctx.fillRect(px + TILE_SIZE/2, py + 38, 12, 6);
                break;
            case 5:
                ctx.fillStyle = '#3a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a3320';
                ctx.fillRect(px + 12, py + 4, TILE_SIZE - 24, TILE_SIZE - 4);
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

        switch (tile) {
            case 1:
                ctx.fillStyle = '#5a3a7a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#7a5a9a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 8);
                ctx.fillStyle = '#4a2a6a';
                ctx.fillRect(px + 2, py + TILE_SIZE - 6, TILE_SIZE - 4, 4);
                break;
            case 2:
                ctx.fillStyle = '#33ff99';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#66ffbb';
                const pulse = 12 + Math.sin(Date.now() / 200) * 6;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                ctx.fillStyle = '#654321';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2 + 8, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4:
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 20, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 4, py + 28, 8, 20);
                ctx.fillRect(px + TILE_SIZE/2, py + 38, 12, 6);
                break;
            case 5:
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(px + 8, py + 4, TILE_SIZE - 16, TILE_SIZE - 4);
                ctx.fillStyle = '#ffaa33';
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 300) * 0.2;
                ctx.fillRect(px + 12, py + 8, TILE_SIZE - 24, TILE_SIZE - 8);
                ctx.globalAlpha = 1;
                break;
            case 6:
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 10 + Math.sin(Date.now()/200)*3, 0, Math.PI * 2);
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

    if (GameState.currentWorld === 'real') {
        GameState.currentWorld = 'dream';
        Player.gridX = 1;
        Player.gridY = 1;
        Player.x = Player.gridX * TILE_SIZE + 4;
        Player.y = Player.gridY * TILE_SIZE + 4;
        Player.isMoving = false;
        Player.isJumping = false;
        Player.isFalling = false;
        Player.facing = 1;
        GameState.cameraX = 0;
    } else {
        GameState.currentWorld = 'real';
        Player.gridX = 6;
        Player.gridY = 6;
        Player.x = Player.gridX * TILE_SIZE + 4;
        Player.y = Player.gridY * TILE_SIZE + 4;
        Player.isMoving = false;
        Player.moveProgress = 0;
    }
    spawnEnemies();
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

    if (Levels.nextLevel()) {
        // Progress to next level
        GameState.currentWorld = 'real';
        GameState.inventory = [];
        GameState.cameraX = 0;
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

    if (GameState.currentWorld === 'real') {
        indicator.textContent = `REAL WORLD - Level ${Levels.current}`;
        indicator.className = 'real-world';
        hintsEl.textContent = `HP: ${'❤'.repeat(GameState.health)}${'♡'.repeat(GameState.maxHealth - GameState.health)}`;
    } else {
        indicator.textContent = `DREAM WORLD - Level ${Levels.current}`;
        indicator.className = 'dream-world';
        hintsEl.textContent = `HP: ${'❤'.repeat(GameState.health)}${'♡'.repeat(GameState.maxHealth - GameState.health)}`;
    }

    inventoryEl.textContent = GameState.inventory.length > 0 ? GameState.inventory.join(', ') : 'Empty';
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
    updateEnemies();
    updateProjectiles();
    checkInteractions();
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    RealWorld.draw();
    drawDivider();
    DreamWorld.draw();
    drawActiveHighlight();
    drawEnemies();
    drawProjectiles();
    Player.draw();

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
spawnEnemies();
updateUI();
gameLoop();

console.log('Dreamworld v1.1 - Enemy AI & Levels! Arrows to move, X to shoot/fireball');
