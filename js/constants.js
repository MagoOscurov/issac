// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const DIRECTIONS = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

export const ENTITY_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    PROJECTILE: 'projectile',
    ITEM: 'item'
};

export const ITEM_TYPES = {
    HEALTH: 'health',
    DAMAGE_UP: 'damage_up',
    SPEED_UP: 'speed_up'
};

export const PLAYER_CONFIG = {
    WIDTH: 32,
    HEIGHT: 32,
    SPEED: 3,
    MAX_HEALTH: 3,
    PROJECTILE_SPEED: 7,
    FIRE_RATE: 15, // Lower is faster
    DAMAGE: 1
};

export const ENEMY_CONFIG = {
    WIDTH: 32,
    HEIGHT: 32,
    SPEED: 1,
    HEALTH: 2,
    DAMAGE: 1,
    SCORE: 100
};

export const PROJECTILE_CONFIG = {
    WIDTH: 8,
    HEIGHT: 8,
    SPEED: 7,
    LIFETIME: 60 // frames
};

export const ROOM_CONFIG = {
    WIDTH: CANVAS_WIDTH,
    HEIGHT: CANVAS_HEIGHT - 50, // Leave space for HUD
    PADDING: 50,
    DOOR_SIZE: 60,
    MAX_ENEMIES: 5
};

export const COLORS = {
    PLAYER: '#4CAF50',
    ENEMY: '#FF4444',
    PROJECTILE: '#FFD700',
    WALL: '#555555',
    FLOOR: '#222222',
    DOOR: '#8B4513',
    HEALTH_ITEM: '#FF4444',
    DAMAGE_ITEM: '#FFD700',
    SPEED_ITEM: '#4444FF',
    TEXT: '#FFFFFF'
};
