import { Entity } from './entity.js';
import { COLORS, PROJECTILE_CONFIG } from './constants.js';

export class Projectile extends Entity {
    constructor(x, y, direction, speed, damage, owner, type = 'player') {
        super(x, y, PROJECTILE_CONFIG.WIDTH, PROJECTILE_CONFIG.HEIGHT, 'projectile');
        this.direction = direction;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner; // 'player' or 'enemy'
        this.type = type;
        this.lifetime = PROJECTILE_CONFIG.LIFETIME;
        this.setVelocityFromDirection();
    }

    setVelocityFromDirection() {
        switch (this.direction) {
            case 'UP':
                this.velocity = { x: 0, y: -1 };
                break;
            case 'DOWN':
                this.velocity = { x: 0, y: 1 };
                break;
            case 'LEFT':
                this.velocity = { x: -1, y: 0 };
                break;
            case 'RIGHT':
                this.velocity = { x: 1, y: 0 };
                break;
            default:
                this.velocity = { x: 0, y: 0 };
        }
    }

    update() {
        // Update position
        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;
        
        // Decrease lifetime
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx) {
        // Save the current context state
        ctx.save();
        
        // Move to the projectile's position
        ctx.translate(this.x, this.y);
        
        // Rotate based on direction for a teardrop shape
        let rotation = 0;
        switch (this.direction) {
            case 'UP':
                rotation = -Math.PI / 2;
                break;
            case 'DOWN':
                rotation = Math.PI / 2;
                break;
            case 'LEFT':
                rotation = Math.PI;
                break;
            // 'RIGHT' has rotation 0 (default)
        }
        
        ctx.rotate(rotation);
        
        // Draw teardrop shape
        ctx.fillStyle = this.owner === 'player' ? COLORS.PROJECTILE : '#FF6B6B';
        
        // Draw the teardrop shape (a circle with a point)
        const radius = this.width / 2;
        ctx.beginPath();
        
        // Draw a circle for the main body
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        
        // Draw the pointy end
        ctx.moveTo(0, -radius * 2);
        ctx.lineTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.closePath();
        
        ctx.fill();
        
        // Draw a highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-radius/3, -radius/3, radius/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Restore the context state
        ctx.restore();
    }

    getColor() {
        return this.owner === 'player' ? COLORS.PROJECTILE : '#FF6B6B';
    }
}
