import { checkCollision } from './helpers.js';

export class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.health = 1;
        this.maxHealth = 1;
        this.isActive = true;
        this.direction = 'DOWN';
    }

    update() {
        // Update position based on velocity
        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;
    }

    draw(ctx) {
        // Base entity is just a colored rectangle
        ctx.fillStyle = this.getColor();
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Draw health bar if entity has more than 1 max health
        if (this.maxHealth > 1) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.width * 1.5;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 10;
        
        // Background
        ctx.fillStyle = 'red';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Current health
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillStyle = 'lime';
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    getColor() {
        return 'gray'; // Default color
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(other) {
        return checkCollision(this.getBounds(), other.getBounds());
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isActive = false;
    }

    isOutOfBounds(room) {
        return (
            this.x < 0 ||
            this.x > room.width ||
            this.y < 0 ||
            this.y > room.height
        );
    }

    keepInBounds(room) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        if (this.x < halfWidth) this.x = halfWidth;
        if (this.x > room.width - halfWidth) this.x = room.width - halfWidth;
        if (this.y < halfHeight) this.y = halfHeight;
        if (this.y > room.height - halfHeight) this.y = room.height - halfHeight;
    }
}
