// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions - split screen
const GAME_WIDTH = 640;
const WORLD_HEIGHT = 256;
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = WORLD_HEIGHT * 2 + DIVIDER_HEIGHT;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const DREAM_WORLD_Y_OFFSET = WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// GAME STATE
// ============================================

const GameState = {
    currentWorld: 'real',
    inventory: [],
    keysPressed: {},
    portalCooldown: 0,
    cameraX: 0, // Camera offset for dream world scrolling
    nearDoor: null, // Track if player is near an unlocked door
    level: 1
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

    // Grid-based movement for Real World
    gridX: 2,
    gridY: 2,
    isMoving: false,
    moveProgress: 0,
    moveSpeed: 0.15,
    moveDirection: null,
    targetX: 2,
    targetY: 2,

    // Side-scroller physics
    velX: 0,
    velY: 0,
    gravity: 0.6,
    jumpForce: -12,
    onGround: false,
    moveSpeedSide: 5,
    facing: 1,

    // Animation
    animFrame: 0,
    animTimer: 0,

    init() {
        this.x = this.gridX * TILE_SIZE + 2;
        this.y = this.gridY * TILE_SIZE + 2;
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

                if (this.canMoveTo(newGridX, newGridY, RealWorld)) {
                    this.targetX = newGridX;
                    this.targetY = newGridY;
                    this.isMoving = true;
                    this.moveProgress = 0;
                }
            }
        }
    },

    canMoveTo(tileX, tileY, world) {
        if (tileY < 0 || tileY >= world.tiles.length ||
            tileX < 0 || tileX >= world.tiles[0].length) {
            return false;
        }
        const tile = world.tiles[tileY][tileX];
        return tile !== 1 && tile !== 3;
    },

    updateSideScroller() {
        // Horizontal movement
        this.velX = 0;
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            this.velX = -this.moveSpeedSide;
            this.facing = -1;
        }
        if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            this.velX = this.moveSpeedSide;
            this.facing = 1;
        }

        // Jumping
        if ((GameState.keysPressed['Space'] || GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) && this.onGround) {
            this.velY = this.jumpForce;
            this.onGround = false;
        }

        // Gravity
        this.velY += this.gravity;
        if (this.velY > 14) this.velY = 14;

        // Horizontal collision
        const newX = this.x + this.velX;
        if (!this.collidesWithWorld(newX, this.y, DreamWorld)) {
            this.x = newX;
        } else {
            this.velX = 0;
        }

        // Vertical collision
        const newY = this.y + this.velY;
        if (!this.collidesWithWorld(this.x, newY, DreamWorld)) {
            this.y = newY;
            this.onGround = false;
        } else {
            if (this.velY > 0) {
                this.onGround = true;
                this.y = Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE - this.height;
            } else {
                this.y = Math.ceil(this.y / TILE_SIZE) * TILE_SIZE;
            }
            this.velY = 0;
        }

        // Keep in bounds (left side only - right side scrolls)
        if (this.x < 0) this.x = 0;

        // Fell off bottom
        if (this.y > WORLD_HEIGHT + 50) {
            this.respawnInDreamWorld();
        }
    },

    updateCamera() {
        // Camera follows player, keeping them centered-ish
        const targetCameraX = this.x - GAME_WIDTH / 3;
        const maxCameraX = DreamWorld.getWidth() - GAME_WIDTH;

        // Smooth camera follow
        GameState.cameraX += (targetCameraX - GameState.cameraX) * 0.1;

        // Clamp camera
        GameState.cameraX = Math.max(0, Math.min(maxCameraX, GameState.cameraX));
    },

    collidesWithWorld(x, y, world) {
        const points = [
            { x: x + 4, y: y + 4 },
            { x: x + this.width - 4, y: y + 4 },
            { x: x + 4, y: y + this.height - 2 },
            { x: x + this.width - 4, y: y + this.height - 2 }
        ];

        for (const point of points) {
            const tileX = Math.floor(point.x / TILE_SIZE);
            const tileY = Math.floor(point.y / TILE_SIZE);

            if (tileY >= 0 && tileY < world.tiles.length &&
                tileX >= 0 && tileX < world.tiles[0].length) {
                const tile = world.tiles[tileY][tileX];
                if (tile === 1 || tile === 3) {
                    return true;
                }
            }
        }
        return false;
    },

    respawnInDreamWorld() {
        // Spawn at portal position
        this.x = 1 * TILE_SIZE + 2;
        this.y = 2 * TILE_SIZE;
        this.velY = 0;
        this.onGround = false;
        GameState.cameraX = 0;
    },

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;
        // Apply camera offset for dream world
        const cameraOffset = GameState.currentWorld === 'real' ? 0 : GameState.cameraX;
        const drawX = this.x - cameraOffset;
        const drawY = this.y + yOffset;

        // Don't draw if off screen
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

        const bounce = (this.isMoving || Math.abs(this.velX) > 0) ? Math.sin(this.animTimer * 0.5) * 2 : 0;
        const legOffset = (this.isMoving || Math.abs(this.velX) > 0) ?
            (this.animFrame % 2 === 0 ? 3 : -3) : 0;

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
// WORLD DEFINITIONS
// ============================================

const RealWorld = {
    name: 'REAL WORLD',
    bgColor: '#1a3320',
    tiles: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,4,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0,0,3,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    draw() {
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, GAME_WIDTH, WORLD_HEIGHT);

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                this.drawTile(tile, px, py);
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, 5, 105, 22);
        ctx.fillStyle = '#90EE90';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('REAL WORLD', 10, 20);
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
                ctx.fillRect(px + TILE_SIZE/2, py + 24, 4, 3);
                break;
            case 5:
                // Unlocked door - open doorway
                ctx.fillStyle = '#3a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a3320';
                ctx.fillRect(px + 8, py + 2, TILE_SIZE - 16, TILE_SIZE - 2);
                break;
        }
    }
};

const DreamWorld = {
    name: 'DREAM WORLD',
    bgColor: '#2a1a3a',
    // Extended map - scrolls to the right
    tiles: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
        [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,6],
        [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,6],
        [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,6],
        [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,3,6],
        [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,6],
        [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
    ],

    getWidth() {
        return this.tiles[0].length * TILE_SIZE;
    },

    draw() {
        const gradient = ctx.createLinearGradient(0, DREAM_WORLD_Y_OFFSET, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#0a0515');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, GAME_WIDTH, WORLD_HEIGHT);

        // Stars (parallax - move slower than camera)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const baseX = (i * 73) % (GAME_WIDTH * 2);
            const x = (baseX - GameState.cameraX * 0.3) % GAME_WIDTH;
            const y = DREAM_WORLD_Y_OFFSET + (i * 47) % (WORLD_HEIGHT - 60);
            const twinkle = Math.sin(Date.now() * 0.005 + i) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle * 0.8;
            const size = (i % 3) + 1;
            if (x >= 0 && x < GAME_WIDTH) {
                ctx.fillRect(x, y, size, size);
            }
        }
        ctx.globalAlpha = 1;

        // Draw visible tiles only
        const startTile = Math.floor(GameState.cameraX / TILE_SIZE);
        const endTile = Math.ceil((GameState.cameraX + GAME_WIDTH) / TILE_SIZE) + 1;

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = startTile; x < Math.min(endTile, this.tiles[y].length); x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE - GameState.cameraX;
                const py = y * TILE_SIZE + DREAM_WORLD_Y_OFFSET;
                this.drawTile(tile, px, py);
            }
        }

        // Label (fixed position)
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(5, DREAM_WORLD_Y_OFFSET + 5, 115, 22);
        ctx.fillStyle = '#DDA0DD';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('DREAM WORLD', 10, DREAM_WORLD_Y_OFFSET + 20);

        // Show prompt if near door
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
        // Skip if off screen
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
                // Portal - spawn point
                ctx.fillStyle = '#33ff99';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#66ffbb';
                const pulse2 = 8 + Math.sin(Date.now() / 200) * 4;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, pulse2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3:
                // Locked door
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
                // Key
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 12, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 16, 4, 10);
                ctx.fillRect(px + TILE_SIZE/2, py + 20, 6, 3);
                ctx.fillRect(px + TILE_SIZE/2, py + 24, 4, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(px + TILE_SIZE/2 - 5, py + 10, 2, 2);
                break;
            case 5:
                // Unlocked door - can enter
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(px + 6, py + 2, TILE_SIZE - 12, TILE_SIZE - 2);
                // Glowing entrance
                ctx.fillStyle = '#ffaa33';
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 300) * 0.2;
                ctx.fillRect(px + 8, py + 4, TILE_SIZE - 16, TILE_SIZE - 4);
                ctx.globalAlpha = 1;
                break;
            case 6:
                // End wall / finish line marker
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                break;
        }
    }
};

// ============================================
// GAME LOGIC
// ============================================

function checkInteractions() {
    if (GameState.portalCooldown > 0) return;

    const world = GameState.currentWorld === 'real' ? RealWorld : DreamWorld;
    const playerRect = Player.getRect();

    const centerX = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
    const centerY = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);

    GameState.nearDoor = null;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tileX = centerX + dx;
            const tileY = centerY + dy;

            if (tileY >= 0 && tileY < world.tiles.length &&
                tileX >= 0 && tileX < world.tiles[0].length) {

                const tile = world.tiles[tileY][tileX];
                const tileRect = {
                    x: tileX * TILE_SIZE,
                    y: tileY * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                };

                if (rectsOverlap(playerRect, tileRect)) {
                    // Portal
                    if (tile === 2) {
                        switchWorld();
                        return;
                    }

                    // Key
                    if (tile === 4) {
                        world.tiles[tileY][tileX] = 0;
                        const keyName = GameState.currentWorld === 'real' ? 'Golden Key' : 'Dream Key';
                        if (!GameState.inventory.includes(keyName)) {
                            GameState.inventory.push(keyName);
                            updateUI();
                        }
                    }

                    // Locked door - unlock with key
                    if (tile === 3) {
                        const neededKey = GameState.currentWorld === 'real' ? 'Dream Key' : 'Golden Key';
                        if (GameState.inventory.includes(neededKey)) {
                            world.tiles[tileY][tileX] = 5;
                            const idx = GameState.inventory.indexOf(neededKey);
                            if (idx > -1) GameState.inventory.splice(idx, 1);
                            updateUI();
                        }
                    }

                    // Unlocked door - can enter with E
                    if (tile === 5) {
                        GameState.nearDoor = { x: tileX, y: tileY };
                        if (GameState.keysPressed['KeyE']) {
                            enterDoor();
                            GameState.keysPressed['KeyE'] = false; // Prevent repeat
                        }
                    }

                    // End goal
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
        // Spawn AT the green portal in dream world
        Player.x = 1 * TILE_SIZE + 2;
        Player.y = 2 * TILE_SIZE;
        Player.velY = 0;
        Player.velX = 0;
        Player.onGround = false;
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
    // For now - show completion message
    // Later this will load next level
    console.log('Entered door! Level complete!');
    GameState.level++;

    // Reset for next "level" (placeholder - just resets)
    alert('Level Complete! Press OK to continue...');
    resetLevel();
}

function reachGoal() {
    console.log('Reached the goal!');
    GameState.level++;
    alert('You reached the end! Level Complete!');
    resetLevel();
}

function resetLevel() {
    // Reset to real world
    GameState.currentWorld = 'real';
    GameState.inventory = [];
    GameState.cameraX = 0;
    Player.gridX = 2;
    Player.gridY = 2;
    Player.targetX = 2;
    Player.targetY = 2;
    Player.x = Player.gridX * TILE_SIZE + 2;
    Player.y = Player.gridY * TILE_SIZE + 2;
    Player.isMoving = false;

    // Reset doors to locked state
    RealWorld.tiles[3][17] = 3;
    DreamWorld.tiles[5][48] = 3;

    // Reset keys
    RealWorld.tiles[1][7] = 4;
    DreamWorld.tiles[6][17] = 4;

    updateUI();
}

function updateUI() {
    const indicator = document.getElementById('world-indicator');
    const inventoryEl = document.getElementById('inventory-items');
    const hintsEl = document.getElementById('controls-hint');

    if (GameState.currentWorld === 'real') {
        indicator.textContent = 'REAL WORLD';
        indicator.className = 'real-world';
        hintsEl.textContent = 'Arrow keys to walk';
    } else {
        indicator.textContent = 'DREAM WORLD';
        indicator.className = 'dream-world';
        hintsEl.textContent = 'Arrows + Space | E to enter doors';
    }

    inventoryEl.textContent = GameState.inventory.length > 0
        ? GameState.inventory.join(', ')
        : 'Empty';
}

function drawDivider() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, WORLD_HEIGHT, GAME_WIDTH, DIVIDER_HEIGHT);

    const gradTop = ctx.createLinearGradient(0, WORLD_HEIGHT - 10, 0, WORLD_HEIGHT);
    gradTop.addColorStop(0, 'transparent');
    gradTop.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, WORLD_HEIGHT - 10, GAME_WIDTH, 10);

    const gradBot = ctx.createLinearGradient(0, DREAM_WORLD_Y_OFFSET, 0, DREAM_WORLD_Y_OFFSET + 10);
    gradBot.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradBot.addColorStop(1, 'transparent');
    ctx.fillStyle = gradBot;
    ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, GAME_WIDTH, 10);
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

console.log('Dreamworld v0.3 - Scrolling Dream World!');
