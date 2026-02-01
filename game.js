// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============================================
// GAME STATE
// ============================================

const GameState = {
    currentWorld: 'real', // 'real' or 'dream'
    inventory: [],
    keys: {},
    keysPressed: {}
};

// ============================================
// INPUT HANDLING
// ============================================

document.addEventListener('keydown', (e) => {
    GameState.keysPressed[e.code] = true;

    // Prevent scrolling with arrow keys and space
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
    x: 100,
    y: 200,
    width: 24,
    height: 24,
    speed: 4,

    // Side-scroller physics
    velX: 0,
    velY: 0,
    gravity: 0.5,
    jumpForce: -12,
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

        // Diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Try to move, checking collisions
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (!this.collidesWithWorld(newX, this.y, RealWorld)) {
            this.x = newX;
        }
        if (!this.collidesWithWorld(this.x, newY, RealWorld)) {
            this.y = newY;
        }

        // Keep in bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(GAME_HEIGHT - this.height, this.y));
    },

    updateSideScroller() {
        // Horizontal movement
        this.velX = 0;
        if (GameState.keysPressed['ArrowLeft'] || GameState.keysPressed['KeyA']) {
            this.velX = -this.speed;
        }
        if (GameState.keysPressed['ArrowRight'] || GameState.keysPressed['KeyD']) {
            this.velX = this.speed;
        }

        // Jumping
        if ((GameState.keysPressed['Space'] || GameState.keysPressed['ArrowUp']) && this.onGround) {
            this.velY = this.jumpForce;
            this.onGround = false;
        }

        // Apply gravity
        this.velY += this.gravity;

        // Cap fall speed
        if (this.velY > 12) this.velY = 12;

        // Move horizontally
        const newX = this.x + this.velX;
        if (!this.collidesWithWorld(newX, this.y, DreamWorld)) {
            this.x = newX;
        }

        // Move vertically
        const newY = this.y + this.velY;
        if (!this.collidesWithWorld(this.x, newY, DreamWorld)) {
            this.y = newY;
            this.onGround = false;
        } else {
            // Hit something
            if (this.velY > 0) {
                // Landing on ground
                this.onGround = true;
                // Snap to tile
                this.y = Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE - this.height;
            }
            this.velY = 0;
        }

        // Keep in bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        if (this.y > GAME_HEIGHT) {
            // Fell off - respawn
            this.y = 100;
            this.x = 100;
        }
    },

    collidesWithWorld(x, y, world) {
        // Check all four corners of the player
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
                if (tile === 1 || tile === 3) { // Wall or locked door
                    return true;
                }
            }
        }
        return false;
    },

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    },

    draw() {
        const color = GameState.currentWorld === 'real' ? this.realWorldColor : this.dreamWorldColor;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes (simple face)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 5, this.y + 6, 4, 4);
        ctx.fillRect(this.x + 15, this.y + 6, 4, 4);

        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 6, this.y + 7, 2, 2);
        ctx.fillRect(this.x + 16, this.y + 7, 2, 2);
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
    // Top-down map (15 tiles high, 20 tiles wide)
    tiles: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,1],
        [1,0,0,0,1,4,0,1,0,0,0,0,1,0,0,1,0,0,0,1],
        [1,0,0,0,1,0,0,1,0,0,0,0,1,0,2,1,0,0,0,1],
        [1,0,0,0,1,1,0,1,0,0,0,0,1,1,1,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    draw() {
        // Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw tiles
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

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
                        // Swirl effect
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
                        // Lock
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(px + 12, py + 12, 8, 8);
                        break;
                    case 4: // Key
                        this.drawKey(px, py);
                        break;
                    case 5: // Unlocked door (passable)
                        ctx.fillStyle = '#5a3510';
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = '#1a3320';
                        ctx.fillRect(px + 8, py, TILE_SIZE - 16, TILE_SIZE);
                        break;
                }
            }
        }
    },

    drawKey(px, py) {
        // Draw a golden key on floor tile
        ctx.fillStyle = '#FFD700';
        // Key head (circle)
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE/2, py + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        // Key shaft
        ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14, 4, 14);
        // Key teeth
        ctx.fillRect(px + TILE_SIZE/2, py + 22, 6, 3);
        ctx.fillRect(px + TILE_SIZE/2, py + 18, 4, 3);
    }
};

const DreamWorld = {
    name: 'DREAM WORLD',
    bgColor: '#2a1a3a',
    // Side-scroller map
    tiles: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
        [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,4,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    draw() {
        // Background - dreamy gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(1, '#3a2a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Stars
        ctx.fillStyle = '#ffffff44';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % GAME_WIDTH;
            const y = (i * 47) % (GAME_HEIGHT / 2);
            const size = (i % 3) + 1;
            ctx.fillRect(x, y, size, size);
        }

        // Draw tiles
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

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
                        // Lock
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(px + 12, py + 12, 8, 8);
                        break;
                    case 4: // Key
                        this.drawKey(px, py);
                        break;
                    case 5: // Unlocked door
                        ctx.fillStyle = '#5a3510';
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = '#3a2a5a';
                        ctx.fillRect(px + 8, py, TILE_SIZE - 16, TILE_SIZE);
                        break;
                }
            }
        }
    },

    drawKey(px, py) {
        // Draw a silver/dream key
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE/2, py + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px + TILE_SIZE/2 - 2, py + 14, 4, 14);
        ctx.fillRect(px + TILE_SIZE/2, py + 22, 6, 3);
        ctx.fillRect(px + TILE_SIZE/2, py + 18, 4, 3);
    }
};

// ============================================
// GAME LOGIC
// ============================================

function checkInteractions() {
    const world = GameState.currentWorld === 'real' ? RealWorld : DreamWorld;
    const playerRect = Player.getRect();

    // Find which tile the player center is on
    const centerX = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
    const centerY = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);

    // Check surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tileX = centerX + dx;
            const tileY = centerY + dy;

            if (tileY >= 0 && tileY < world.tiles.length &&
                tileX >= 0 && tileX < world.tiles[0].length) {

                const tile = world.tiles[tileY][tileX];

                // Check if player overlaps this tile
                const tileRect = {
                    x: tileX * TILE_SIZE,
                    y: tileY * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                };

                if (rectsOverlap(playerRect, tileRect)) {
                    // Portal - switch worlds
                    if (tile === 2) {
                        switchWorld();
                        return;
                    }

                    // Key - pick it up
                    if (tile === 4) {
                        world.tiles[tileY][tileX] = 0;
                        const keyName = GameState.currentWorld === 'real' ? 'Golden Key' : 'Dream Key';
                        if (!GameState.inventory.includes(keyName)) {
                            GameState.inventory.push(keyName);
                            updateUI();
                        }
                    }

                    // Locked door - try to open
                    if (tile === 3) {
                        const neededKey = GameState.currentWorld === 'real' ? 'Dream Key' : 'Golden Key';
                        if (GameState.inventory.includes(neededKey)) {
                            world.tiles[tileY][tileX] = 5; // Unlock door
                            // Remove key from inventory
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
        // Position player at dream world portal
        Player.x = 3 * TILE_SIZE;
        Player.y = 4 * TILE_SIZE;
        Player.velY = 0;
        Player.onGround = false;
    } else {
        GameState.currentWorld = 'real';
        // Position player at real world portal
        Player.x = 14 * TILE_SIZE;
        Player.y = 5 * TILE_SIZE;
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
        hintsEl.textContent = 'Arrow keys to move | Find the key!';
    } else {
        indicator.textContent = 'DREAM WORLD';
        indicator.className = 'dream-world';
        hintsEl.textContent = 'Arrows to move | Space to jump';
    }

    inventoryEl.textContent = GameState.inventory.length > 0
        ? GameState.inventory.join(', ')
        : 'Empty';
}

// ============================================
// GAME LOOP
// ============================================

function update() {
    Player.update();
    checkInteractions();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw current world
    if (GameState.currentWorld === 'real') {
        RealWorld.draw();
    } else {
        DreamWorld.draw();
    }

    // Draw player
    Player.draw();

    // Draw instruction overlay for first few seconds
    if (Date.now() - gameStartTime < 5000) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH / 2 - 150, 10, 300, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Find keys to unlock doors!', GAME_WIDTH / 2, 32);
        ctx.fillText('Use portals to switch worlds', GAME_WIDTH / 2, 52);
    }
}

let gameStartTime = Date.now();

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START GAME
// ============================================

// Initialize UI
updateUI();

// Start the game loop
gameLoop();

console.log('Dreamworld loaded! Use arrow keys to explore.');
