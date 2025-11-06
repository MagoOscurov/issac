import { COLORS } from './constants.js';

export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'health', 'damage_up', 'speed_up'
        this.isCollected = false;
        this.bobOffset = 0;
        this.bobDirection = 1;
        this.bobSpeed = 0.05;
        this.bobAmount = 2;
    }

    update() {
        // Bobbing animation
        this.bobOffset += this.bobSpeed * this.bobDirection;
        
        if (Math.abs(this.bobOffset) >= this.bobAmount) {
            this.bobDirection *= -1;
        }
    }

    draw(ctx) {
        // Save the current context state
        ctx.save();
        
        // Move to the item's position with bobbing effect
        ctx.translate(this.x, this.y + this.bobOffset);
        
        // Draw different items based on type
        switch (this.type) {
            case 'health':
                this.drawHealth(ctx);
                break;
            case 'damage_up':
                this.drawDamageUp(ctx);
                break;
            case 'speed_up':
                this.drawSpeedUp(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }
        
        // Restore the context state
        ctx.restore();
    }

    drawHealth(ctx) {
        // Draw a heart
        const size = this.width / 2;
        const x = -size / 2;
        const y = -size / 2;
        
        // Draw a red heart
        ctx.fillStyle = COLORS.HEALTH_ITEM;
        
        // Draw two circles for the top of the heart
        ctx.beginPath();
        ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.3, Math.PI, 0, false);
        ctx.arc(x + size * 0.7, y + size * 0.3, size * 0.3, Math.PI, 0, false);
        
        // Draw the triangle for the bottom of the heart
        ctx.lineTo(x + size * 0.5, y + size);
        ctx.closePath();
        ctx.fill();
        
        // Add a highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x + size * 0.3, y + size * 0.25, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDamageUp(ctx) {
        // Draw an arrow pointing up
        const size = this.width / 2;
        
        ctx.fillStyle = COLORS.DAMAGE_ITEM;
        
        // Draw the arrow
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(0, size / 4);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Add a star in the middle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.drawStar(ctx, 0, 0, 5, size * 0.2, size * 0.4);
    }

    drawSpeedUp(ctx) {
        // Draw a lightning bolt
        const size = this.width / 2;
        
        ctx.fillStyle = COLORS.SPEED_ITEM;
        
        // Draw the lightning bolt
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 3, 0);
        ctx.lineTo(-size / 6, 0);
        ctx.lineTo(size / 6, size / 2);
        ctx.lineTo(-size / 3, 0);
        ctx.closePath();
        ctx.fill();
        
        // Add some shine
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawDefault(ctx) {
        // Draw a question mark for unknown items
        const size = this.width / 2;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        // Helper function to draw a star
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    collect() {
        if (!this.isCollected) {
            this.isCollected = true;
            return this.type;
        }
        return null;
    }
}
