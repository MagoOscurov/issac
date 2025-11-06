// Helper functions
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

export function getDirectionVector(direction) {
    switch (direction) {
        case 'UP': return { x: 0, y: -1 };
        case 'DOWN': return { x: 0, y: 1 };
        case 'LEFT': return { x: -1, y: 0 };
        case 'RIGHT': return { x: 1, y: 0 };
        default: return { x: 0, y: 0 };
    }
}

export function getRandomPosition(room) {
    const padding = 50;
    return {
        x: getRandomInt(padding, room.width - padding),
        y: getRandomInt(padding, room.height - padding)
    };
}

export function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function drawTextWithOutline(ctx, text, x, y, color = 'white', outlineColor = 'black', size = '16px', font = 'Arial') {
    ctx.font = `${size} ${font}`;
    
    // Draw outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
    
    // Draw main text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

export function drawHealthBar(ctx, x, y, width, height, current, max, fill = '#00FF00', background = '#FF0000') {
    // Draw background
    ctx.fillStyle = background;
    ctx.fillRect(x, y, width, height);
    
    // Draw current health
    const healthWidth = (current / max) * width;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, healthWidth, height);
    
    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
}
