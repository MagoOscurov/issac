import { Entity } from './entity.js';
import { DIRECTIONS, COLORS, PLAYER_CONFIG } from './constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT, 'player');
        this.speed = PLAYER_CONFIG.SPEED;
        this.maxHealth = PLAYER_CONFIG.MAX_HEALTH;
        this.health = this.maxHealth;
        this.damage = PLAYER_CONFIG.DAMAGE;
        this.projectileSpeed = PLAYER_CONFIG.PROJECTILE_SPEED;
        this.fireRate = PLAYER_CONFIG.FIRE_RATE;
        this.fireCooldown = 0;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false
        };
        this.facing = DIRECTIONS.DOWN;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 60; // 1 second at 60 FPS
        this.collectedItems = [];
    }

    update(room) {
        // Handle movement
        this.handleMovement();
        
        // Save current position in case we need to revert
        const prevX = this.x;
        const prevY = this.y;
        
        // Update position based on velocity
        super.update();
        
        // Check for wall collisions and adjust position if needed
        if (room && room.checkWallCollision) {
            if (room.checkWallCollision(this)) {
                // If we hit a wall, revert to previous position
                this.x = prevX;
                this.y = prevY;
            }
        }
        
        // Update fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown--;
        }
        
        // Handle invincibility frames
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    handleMovement() {
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Handle WASD movement
        if (this.keys.w || this.keys.ArrowUp) {
            this.velocity.y = -1;
            this.facing = DIRECTIONS.UP;
        }
        if (this.keys.s || this.ArrowDown) {
            this.velocity.y = 1;
            this.facing = DIRECTIONS.DOWN;
        }
        if (this.keys.a || this.ArrowLeft) {
            this.velocity.x = -1;
            this.facing = DIRECTIONS.LEFT;
        }
        if (this.keys.d || this.ArrowRight) {
            this.velocity.x = 1;
            this.facing = DIRECTIONS.RIGHT;
        }

        // Normalize diagonal movement
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            this.velocity.x /= length;
            this.velocity.y /= length;
        }
    }

    shoot() {
        if (this.fireCooldown > 0) return null;
        
        this.fireCooldown = this.fireRate;
        
        // Create a new projectile in the direction the player is facing
        const projectile = {
            x: this.x,
            y: this.y,
            direction: this.facing,
            speed: this.projectileSpeed,
            damage: this.damage
        };
        
        return projectile;
    }

    takeDamage(amount) {
        if (this.invincible) return false;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        
        if (this.health <= 0) {
            this.die();
        }
        
        return true;
    }

    addItem(item) {
        this.collectedItems.push(item);
        
        // Apply item effects
        switch (item.type) {
            case 'health':
                this.health = Math.min(this.health + 1, this.maxHealth);
                break;
            case 'damage_up':
                this.damage += 0.5;
                break;
            case 'speed_up':
                this.speed += 0.5;
                break;
        }
    }

    draw(ctx) {
        // Draw player with invincibility flash
        if (!this.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = this.invincible ? '#99FF99' : COLORS.PLAYER;
            
            // Draw player body
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
            
            // Draw eyes based on facing direction
            ctx.fillStyle = 'white';
            const eyeSize = this.width / 4;
            const eyeOffset = this.width / 4;
            
            switch (this.facing) {
                case DIRECTIONS.UP:
                    ctx.fillRect(
                        this.x - eyeOffset,
                        this.y - eyeOffset,
                        eyeSize,
                        eyeSize
                    );
                    ctx.fillRect(
                        this.x + eyeOffset - eyeSize,
                        this.y - eyeOffset,
                        eyeSize,
                        eyeSize
                    );
                    break;
                case DIRECTIONS.DOWN:
                    ctx.fillRect(
                        this.x - eyeOffset,
                        this.y + eyeOffset - eyeSize,
                        eyeSize,
                        eyeSize
                    );
                    ctx.fillRect(
                        this.x + eyeOffset - eyeSize,
                        this.y + eyeOffset - eyeSize,
                        eyeSize,
                        eyeSize
                    );
                    break;
                case DIRECTIONS.LEFT:
                    ctx.fillRect(
                        this.x - eyeOffset,
                        this.y - eyeOffset,
                        eyeSize,
                        eyeSize
                    );
                    ctx.fillRect(
                        this.x - eyeOffset,
                        this.y + eyeOffset - eyeSize,
                        eyeSize,
                        eyeSize
                    );
                    break;
                case DIRECTIONS.RIGHT:
                    ctx.fillRect(
                        this.x + eyeOffset - eyeSize,
                        this.y - eyeOffset,
                        eyeSize,
                        eyeSize
                    );
                    ctx.fillRect(
                        this.x + eyeOffset - eyeSize,
                        this.y + eyeOffset - eyeSize,
                        eyeSize,
                        eyeSize
                    );
                    break;
            }
        }
        
        // Draw health bar
        this.drawHealthBar(ctx);
    }

    reset() {
        this.health = this.maxHealth;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.collectedItems = [];
        this.damage = PLAYER_CONFIG.DAMAGE;
        this.speed = PLAYER_CONFIG.SPEED;
    }
}
