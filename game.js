// ============================================
// DREAMWORLD - A Dual-Perspective Adventure
// v1.3 - Gameplay Systems Update
// - Persistent enemy deaths
// - Score/points system
// - Enemy item drops
// - Dream Essence mechanic (world linking)
// - Usable inventory items
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

const KeyState = { justPressed: {} };

document.addEventListener('keydown', (e) => {
    if (!GameState.keysPressed[e.code]) {
        KeyState.justPressed[e.code] = true;
    }
    GameState.keysPressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'Digit1', 'Digit2', 'Digit3', 'KeyZ'].includes(e.code)) {
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
    },

    update() {
        if (GameState.portalCooldown > 0) GameState.portalCooldown--;
        if (GameState.invincible > 0) GameState.invincible--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (GameState.powerBoostTimer > 0) GameState.powerBoostTimer--;
        if (GameState.shieldTimer > 0) GameState.shieldTimer--;

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

    shoot() {
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

        // Faster projectiles with power boost
        const speed = GameState.powerBoostTimer > 0 ? 12 : 8;

        GameState.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: vx * speed,
            vy: vy * speed,
            isFireball: GameState.currentWorld === 'dream',
            life: 60,
            powered: GameState.powerBoostTimer > 0 // Track if this was a powered shot
        });
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
        life: 300, // Disappears after 5 seconds
        bobOffset: Math.random() * Math.PI * 2
    });
}

function updateDrops() {
    const playerRect = Player.getRect();

    GameState.drops = GameState.drops.filter(drop => {
        drop.life--;
        if (drop.life <= 0) return false;

        // Check pickup collision
        const dropRect = { x: drop.x - 8, y: drop.y - 8, width: 16, height: 16 };
        if (rectsOverlap(playerRect, dropRect)) {
            collectDrop(drop);
            return false;
        }

        return true;
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

        // Flash when about to disappear
        if (drop.life < 60 && Math.floor(drop.life / 8) % 2 === 0) return;

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
            GameState.powerBoostTimer = 300; // 5 seconds
            break;
        case 'shield':
            GameState.shieldTimer = 600; // 10 seconds
            break;
    }
    updateUI();
}

function useWorldPower() {
    // Use Dream Essence in Real World, Real Energy in Dream World
    if (GameState.currentWorld === 'real' && GameState.dreamEssence > 0) {
        // Dream Essence: Slow motion for enemies + increased damage
        GameState.dreamEssence--;
        GameState.powerBoostTimer = Math.max(GameState.powerBoostTimer, 180); // 3 seconds
        // Also heal 1 HP
        if (GameState.health < GameState.maxHealth) {
            GameState.health++;
        }
        updateUI();
    } else if (GameState.currentWorld === 'dream' && GameState.realEnergy > 0) {
        // Real Energy: Extra jump height + brief invincibility
        GameState.realEnergy--;
        GameState.invincible = Math.max(GameState.invincible, 120); // 2 seconds invincibility
        GameState.shieldTimer = Math.max(GameState.shieldTimer, 180); // 3 seconds shield
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
            // Fireball (dream world) - scaled down
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Bullet (real world) - scaled down
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(drawX - 3, drawY - 1, 6, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(drawX - 2, drawY, 4, 2);
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
    RealWorld.draw();
    drawDivider();
    DreamWorld.draw();
    drawActiveHighlight();
    drawEnemies();
    drawDrops();
    drawProjectiles();
    Player.draw();
    drawPowerUpStatus();

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

console.log('Dreamworld v1.3 - Gameplay Systems Update! Score, item drops, world powers. X=shoot, Z=world power, 1-3=use items');
