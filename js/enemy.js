import { Entity } from './entity.js';
import { DIRECTIONS, COLORS, ENEMY_CONFIG } from './constants.js';
import { getRandomInt, getDistance } from './helpers.js';

export class Enemy extends Entity {
    constructor(x, y, type = 'basic') {
        super(x, y, ENEMY_CONFIG.WIDTH, ENEMY_CONFIG.HEIGHT, 'enemy');
        this.speed = ENEMY_CONFIG.SPEED;
        this.damage = ENEMY_CONFIG.DAMAGE;
        this.scoreValue = ENEMY_CONFIG.SCORE;
        this.type = type;
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.directionChangeCooldown = 0;
        this.direction = DIRECTIONS.DOWN;
        this.detectionRadius = 250; // How close the player needs to be for the enemy to chase
    }

    getMaxHealth() {
        switch (this.type) {
            case 'basic':
                return 2;
            case 'tank':
                return 5;
            case 'fast':
                return 1;
            default:
                return ENEMY_CONFIG.HEALTH;
        }
    }

    getSpeed() {
        switch (this.type) {
            case 'fast':
                return this.speed * 1.5;
            case 'tank':
                return this.speed * 0.7;
            default:
                return this.speed;
        }
    }

    update(player, room) {
        // Random movement or chase player
        this.updateDirection(player, room);
        
        // Update position
        const speed = this.getSpeed();
        this.x += this.velocity.x * speed;
        this.y += this.velocity.y * speed;
        
        // Keep enemy in bounds
        this.keepInBounds(room);
    }

    updateDirection(player, room) {
        // Decrease cooldown for direction change
        if (this.directionChangeCooldown > 0) {
            this.directionChangeCooldown--;
            return;
        }

        // Check if player is in detection radius
        const distanceToPlayer = getDistance(this.x, this.y, player.x, player.y);
        
        if (distanceToPlayer < this.detectionRadius) {
            // Chase player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                this.velocity.x = dx / length;
                this.velocity.y = dy / length;
                
                // Update facing direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.direction = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
                } else {
                    this.direction = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
                }
            }
        } else {
            // Random movement
            if (Math.random() < 0.02) { // 2% chance to change direction each frame
                const directions = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: -1, y: 0 },
                    { x: 0, y: 1 },
                    { x: 0, y: -1 }
                ];
                
                const dir = directions[Math.floor(Math.random() * directions.length)];
                this.velocity.x = dir.x;
                this.velocity.y = dir.y;
                
                // Update facing direction
                if (dir.x !== 0 || dir.y !== 0) {
                    if (Math.abs(dir.x) > Math.abs(dir.y)) {
                        this.direction = dir.x > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
                    } else {
                        this.direction = dir.y > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
                    }
                }
                
                this.directionChangeCooldown = getRandomInt(30, 90); // 0.5 to 1.5 seconds at 60 FPS
            }
        }
    }

    draw(ctx) {
        // Draw enemy body
        ctx.fillStyle = this.getEnemyColor();
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        
        // Draw enemy eyes based on direction
        const eyeSize = this.width / 4;
        const eyeOffsetX = this.width / 3;
        const eyeOffsetY = this.height / 3;
        
        ctx.fillStyle = 'white';
        
        switch (this.direction) {
            case DIRECTIONS.UP:
                // Eyes looking up
                ctx.fillRect(this.x - eyeOffsetX, this.y - eyeOffsetY, eyeSize, eyeSize);
                ctx.fillRect(this.x + eyeOffsetX - eyeSize, this.y - eyeOffsetY, eyeSize, eyeSize);
                break;
            case DIRECTIONS.DOWN:
                // Eyes looking down
                ctx.fillRect(this.x - eyeOffsetX, this.y + eyeOffsetY - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(this.x + eyeOffsetX - eyeSize, this.y + eyeOffsetY - eyeSize, eyeSize, eyeSize);
                break;
            case DIRECTIONS.LEFT:
                // Eyes looking left
                ctx.fillRect(this.x - eyeOffsetX, this.y - eyeOffsetY, eyeSize, eyeSize);
                ctx.fillRect(this.x - eyeOffsetX, this.y + eyeOffsetY - eyeSize, eyeSize, eyeSize);
                break;
            case DIRECTIONS.RIGHT:
                // Eyes looking right
                ctx.fillRect(this.x + eyeOffsetX - eyeSize, this.y - eyeOffsetY, eyeSize, eyeSize);
                ctx.fillRect(this.x + eyeOffsetX - eyeSize, this.y + eyeOffsetY - eyeSize, eyeSize, eyeSize);
                break;
        }
        
        // Draw health bar if not full health
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }
    
    getEnemyColor() {
        switch (this.type) {
            case 'tank':
                return '#8B0000'; // Dark red
            case 'fast':
                return '#FFA500'; // Orange
            default:
                return COLORS.ENEMY; // Default red
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Flash white when hit
        this.hitAnimation = 10;
        
        if (this.health <= 0) {
            this.die();
            return true; // Enemy was killed
        }
        
        return false; // Enemy is still alive
    }
}
