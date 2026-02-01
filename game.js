// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions - split screen
const GAME_WIDTH = 640;
const WORLD_HEIGHT = 256; // 8 tiles per world
const DIVIDER_HEIGHT = 8;
const GAME_HEIGHT = WORLD_HEIGHT * 2 + DIVIDER_HEIGHT; // 520 total
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Y offset for dream world (below real world + divider)
const DREAM_WORLD_Y_OFFSET = WORLD_HEIGHT + DIVIDER_HEIGHT;

// ============================================
// GAME STATE
// ============================================

const GameState = {
    currentWorld: 'real', // 'real' or 'dream'
    inventory: [],
    keysPressed: {}
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
    y: 100,
    width: 24,
    height: 24,
    speed: 4,

    // Side-scroller physics
    velX: 0,
    velY: 0,
    gravity: 0.5,
    jumpForce: -10,
    onGround: false,

    // Colors
    realWorldColor: '#4488ff',
    dreamWorldColor: '#ff88ff',

    update() {
        if (GameState.currentWorld === 'real') {
            this.updateTopDown();
        } else {
            this.updateSideScroller();
        }
    },

    updateTopDown() {
        let dx = 0;
        let dy = 0;

        if (GameState.keysPressed['ArrowUp'] || GameState.keysPressed['KeyW']) dy = -this.speed;
        if (GameState.keysPressed['ArrowDown'] || GameState.keysPressed['KeyS']) dy = this.speed;
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) dx = -this.speed;
        if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) dx = this.speed;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (!this.collidesWithWorld(newX, this.y, RealWorld, 0)) {
            this.x = newX;
        }
        if (!this.collidesWithWorld(this.x, newY, RealWorld, 0)) {
            this.y = newY;
        }

        // Keep in bounds of real world area
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
    },

    updateSideScroller() {
        this.velX = 0;
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            this.velX = -this.speed;
        }
        if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            this.velX = this.speed;
        }

        if ((GameState.keysPressed['Space'] || GameState.keysPressed['ArrowUp']) && this.onGround) {
            this.velY = this.jumpForce;
            this.onGround = false;
        }

        this.velY += this.gravity;
        if (this.velY > 12) this.velY = 12;

        // Horizontal movement
        const newX = this.x + this.velX;
        if (!this.collidesWithWorld(newX, this.y, DreamWorld, 0)) {
            this.x = newX;
        }

        // Vertical movement
        const newY = this.y + this.velY;
        if (!this.collidesWithWorld(this.x, newY, DreamWorld, 0)) {
            this.y = newY;
            this.onGround = false;
        } else {
            if (this.velY > 0) {
                this.onGround = true;
                this.y = Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE - this.height;
            }
            this.velY = 0;
        }

        // Keep in bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        if (this.y > WORLD_HEIGHT) {
            // Fell off - respawn at portal
            this.y = 64;
            this.x = 64;
        }
    },

    collidesWithWorld(x, y, world, yOffset) {
        const points = [
            { x: x + 2, y: y + 2 },
            { x: x + this.width - 2, y: y + 2 },
            { x: x + 2, y: y + this.height - 2 },
            { x: x + this.width - 2, y: y + this.height - 2 }
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

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    draw() {
        const color = GameState.currentWorld === 'real' ? this.realWorldColor : this.dreamWorldColor;
        const yOffset = GameState.currentWorld === 'real' ? 0 : DREAM_WORLD_Y_OFFSET;

        const drawX = this.x;
        const drawY = this.y + yOffset;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(drawX, drawY, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(drawX + 5, drawY + 6, 4, 4);
        ctx.fillRect(drawX + 15, drawY + 6, 4, 4);

        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(drawX + 6, drawY + 7, 2, 2);
        ctx.fillRect(drawX + 16, drawY + 7, 2, 2);
    }
};

// ============================================
// WORLD DEFINITIONS
// ============================================

// Tile types:
// 0 = empty/floor
// 1 = wall
// 2 = portal
// 3 = locked door
// 4 = key
// 5 = unlocked door (passable)

const RealWorld = {
    name: 'REAL WORLD',
    bgColor: '#1a3320',
    yOffset: 0,
    // Top-down map (8 tiles high, 20 tiles wide)
    tiles: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,4,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,0,3,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    draw() {
        // Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, GAME_WIDTH, WORLD_HEIGHT);

        // Draw tiles
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                this.drawTile(tile, px, py);
            }
        }

        // Label
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(5, 5, 100, 20);
        ctx.fillStyle = '#90EE90';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('REAL WORLD', 10, 18);
    },

    drawTile(tile, px, py) {
        switch (tile) {
            case 1: // Wall
                ctx.fillStyle = '#2a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#3a7540';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                break;
            case 2: // Portal
                ctx.fillStyle = '#9933ff';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#cc66ff';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 8 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3: // Locked door
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + 12, py + 12, 8, 8);
                break;
            case 4: // Key
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 10, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14, 4, 12);
                ctx.fillRect(px + TILE_SIZE/2, py + 20, 5, 3);
                break;
            case 5: // Unlocked door
                ctx.fillStyle = '#3a5530';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                break;
        }
    }
};

const DreamWorld = {
    name: 'DREAM WORLD',
    bgColor: '#2a1a3a',
    yOffset: DREAM_WORLD_Y_OFFSET,
    // Side-scroller map (8 tiles high, 20 tiles wide)
    tiles: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
        [0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,4,0,0],
        [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    draw() {
        // Background gradient
        const gradient = ctx.createLinearGradient(0, DREAM_WORLD_Y_OFFSET, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(1, '#3a2a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, DREAM_WORLD_Y_OFFSET, GAME_WIDTH, WORLD_HEIGHT);

        // Stars
        ctx.fillStyle = '#ffffff44';
        for (let i = 0; i < 30; i++) {
            const x = (i * 73) % GAME_WIDTH;
            const y = DREAM_WORLD_Y_OFFSET + (i * 47) % (WORLD_HEIGHT - 50);
            const size = (i % 3) + 1;
            ctx.fillRect(x, y, size, size);
        }

        // Draw tiles
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE + DREAM_WORLD_Y_OFFSET;

                this.drawTile(tile, px, py);
            }
        }

        // Label
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(5, DREAM_WORLD_Y_OFFSET + 5, 110, 20);
        ctx.fillStyle = '#DDA0DD';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('DREAM WORLD', 10, DREAM_WORLD_Y_OFFSET + 18);
    },

    drawTile(tile, px, py) {
        switch (tile) {
            case 1: // Platform
                ctx.fillStyle = '#6a4a8a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8a6aaa';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 4);
                break;
            case 2: // Portal
                ctx.fillStyle = '#33ff99';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#66ffbb';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 8 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3: // Locked door
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + 12, py + 12, 8, 8);
                break;
            case 4: // Key
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + 10, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14, 4, 12);
                ctx.fillRect(px + TILE_SIZE/2, py + 20, 5, 3);
                break;
            case 5: // Unlocked door
                ctx.fillStyle = '#3a2a4a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                break;
        }
    }
};

// ============================================
// GAME LOGIC
// ============================================

function checkInteractions() {
    const world = GameState.currentWorld === 'real' ? RealWorld : DreamWorld;
    const playerRect = Player.getRect();

    const centerX = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
    const centerY = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);

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

                    // Locked door
                    if (tile === 3) {
                        const neededKey = GameState.currentWorld === 'real' ? 'Dream Key' : 'Golden Key';
                        if (GameState.inventory.includes(neededKey)) {
                            world.tiles[tileY][tileX] = 5;
                            const idx = GameState.inventory.indexOf(neededKey);
                            if (idx > -1) GameState.inventory.splice(idx, 1);
                            updateUI();
                        }
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
    if (GameState.currentWorld === 'real') {
        GameState.currentWorld = 'dream';
        // Spawn near dream portal
        Player.x = 2 * TILE_SIZE + 4;
        Player.y = 0;
        Player.velY = 0;
        Player.onGround = false;
    } else {
        GameState.currentWorld = 'real';
        // Spawn near real portal
        Player.x = 14 * TILE_SIZE + 4;
        Player.y = 3 * TILE_SIZE + 4;
    }
    updateUI();
}

function updateUI() {
    const indicator = document.getElementById('world-indicator');
    const inventoryEl = document.getElementById('inventory-items');
    const hintsEl = document.getElementById('controls-hint');

    if (GameState.currentWorld === 'real') {
        indicator.textContent = 'REAL WORLD';
        indicator.className = 'real-world';
        hintsEl.textContent = 'Arrow keys to move';
    } else {
        indicator.textContent = 'DREAM WORLD';
        indicator.className = 'dream-world';
        hintsEl.textContent = 'Arrows + Space to jump';
    }

    inventoryEl.textContent = GameState.inventory.length > 0
        ? GameState.inventory.join(', ')
        : 'Empty';
}

// ============================================
// DIVIDER
// ============================================

function drawDivider() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, WORLD_HEIGHT, GAME_WIDTH, DIVIDER_HEIGHT);

    // Decorative dots
    ctx.fillStyle = '#666';
    for (let x = 10; x < GAME_WIDTH; x += 20) {
        ctx.fillRect(x, WORLD_HEIGHT + 3, 4, 2);
    }
}

// ============================================
// ACTIVE WORLD HIGHLIGHT
// ============================================

function drawActiveHighlight() {
    ctx.strokeStyle = GameState.currentWorld === 'real' ? '#90EE90' : '#DDA0DD';
    ctx.lineWidth = 3;

    if (GameState.currentWorld === 'real') {
        ctx.strokeRect(1, 1, GAME_WIDTH - 2, WORLD_HEIGHT - 2);
    } else {
        ctx.strokeRect(1, DREAM_WORLD_Y_OFFSET + 1, GAME_WIDTH - 2, WORLD_HEIGHT - 2);
    }
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

    // Always draw both worlds
    RealWorld.draw();
    drawDivider();
    DreamWorld.draw();

    // Highlight active world
    drawActiveHighlight();

    // Draw player in current world
    Player.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START GAME
// ============================================

updateUI();
gameLoop();

console.log('Dreamworld loaded! Both worlds visible. Use portals to switch between them.');
