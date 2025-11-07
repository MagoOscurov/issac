import { Enemy } from './enemy.js';
import { Item } from './item.js';
import { getRandomInt, getRandomPosition } from './helpers.js';
import { DIRECTIONS, COLORS, ROOM_CONFIG, ENEMY_CONFIG } from './constants.js';

export class Room {
    constructor(roomType = 'normal', width = ROOM_CONFIG.WIDTH, height = ROOM_CONFIG.HEIGHT) {
        this.width = width;
        this.height = height;
        this.type = roomType; // 'start', 'normal', 'boss', 'item', 'secret'
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.doors = {
            top: false,     // Can be: false (no door), true (closed door), 'open' (open door)
            right: false,
            bottom: false,
            left: false
        };
        this.cleared = false;
        this.roomPadding = ROOM_CONFIG.PADDING;
        this.doorSize = ROOM_CONFIG.DOOR_SIZE;
        this.maxEnemies = ROOM_CONFIG.MAX_ENEMIES;
        this.backgroundTiles = this.generateBackground();
        this.generateRoom();
    }

    generateBackground() {
        const tileSize = 40;
        const tiles = [];
        const rows = Math.ceil(this.height / tileSize);
        const cols = Math.ceil(this.width / tileSize);
        
        // Create a simple grid pattern
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // Alternate between two slightly different shades
                const isDark = (x + y) % 2 === 0;
                tiles.push({
                    x: x * tileSize,
                    y: y * tileSize,
                    width: tileSize,
                    height: tileSize,
                    color: isDark ? '#1a1a1a' : '#222222'
                });
            }
        }
        
        return tiles;
    }

    generateRoom() {
        // Clear existing enemies and items
        this.enemies = [];
        this.items = [];
        this.cleared = this.type === 'start'; // Start room starts cleared

        // For start room, ensure all doors are open
        if (this.type === 'start') {
            for (const door in this.doors) {
                if (this.doors[door] !== false) { // If door exists (not false)
                    this.doors[door] = 'open';
                }
            }
        }
        // Generate enemies for non-start rooms
        else if (this.type === 'normal' || this.type === 'boss' || this.type === 'item') {
            // Asegurar que siempre haya al menos un enemigo en habitaciones normales
            const minEnemies = this.type === 'normal' ? 1 : 1;
            const enemyCount = getRandomInt(minEnemies, this.maxEnemies);
            
            // Intentar generar enemigos hasta que al menos uno se genere correctamente
            let attempts = 0;
            const maxAttempts = 5;
            
            while (this.enemies.length === 0 && attempts < maxAttempts) {
                this.spawnEnemies(enemyCount);
                attempts++;
                
                // Si no se generaron enemigos pero debería haber al menos uno, forzar un enemigo básico
                if (this.enemies.length === 0 && attempts === maxAttempts - 1) {
                    const x = this.width / 2;
                    const y = this.height / 2;
                    const enemy = new Enemy(x, y, 'basic');
                    this.enemies.push(enemy);
                }
            }
            
            // 30% chance for an item to spawn in normal rooms
            if (this.type === 'normal' && Math.random() < 0.3) {
                this.spawnItem();
            }
        }
        
        // Special room types
        if (this.type === 'item') {
            this.spawnItem(true);
        } else if (this.type === 'boss') {
            this.spawnBoss();
        }
        
        // Set up doors based on room type
        if (this.type === 'start') {
            // Start room has all doors open by default
            for (const door in this.doors) {
                if (this.doors[door]) {
                    this.doors[door] = 'open';
                }
            }
        } else {
            // For other rooms, check if they should be cleared
            // Si no hay enemigos, la sala se considera automáticamente despejada
            if (this.enemies.length === 0) {
                this.cleared = true;
            }
            
            // Configurar puertas basado en si la sala está despejada o no
            for (const door in this.doors) {
                if (this.doors[door]) {
                    this.doors[door] = this.cleared ? 'open' : true;
                }
            }
        }
    }

    spawnEnemies(count) {
        const enemyTypes = ['basic', 'fast', 'tank'];
        
        for (let i = 0; i < count; i++) {
            // Choose random enemy type (weighted towards basic)
            let type;
            const rand = Math.random();
            if (rand < 0.6) {
                type = 'basic';
            } else if (rand < 0.9) {
                type = 'fast';
            } else {
                type = 'tank';
            }
            
            // Get a valid spawn position (not too close to walls or other enemies)
            let x, y, validPosition;
            const maxAttempts = 20;
            let attempts = 0;
            
            do {
                x = getRandomInt(
                    this.roomPadding + ENEMY_CONFIG.WIDTH,
                    this.width - this.roomPadding - ENEMY_CONFIG.WIDTH
                );
                y = getRandomInt(
                    this.roomPadding + ENEMY_CONFIG.HEIGHT,
                    this.height - this.roomPadding - ENEMY_CONFIG.HEIGHT
                );
                
                // Check if position is too close to other enemies
                validPosition = true;
                for (const enemy of this.enemies) {
                    const dx = enemy.x - x;
                    const dy = enemy.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) { // Minimum distance between enemies
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            } while (!validPosition && attempts < maxAttempts);
            
            if (validPosition) {
                const enemy = new Enemy(x, y, type);
                this.enemies.push(enemy);
            }
        }
    }

    spawnBoss() {
        // Spawn a boss enemy in the center of the room
        const boss = new Enemy(
            this.width / 2,
            this.height / 2,
            'tank' // Boss is a stronger version of tank
        );
        
        // Make boss stronger
        boss.health *= 3;
        boss.maxHealth = boss.health;
        boss.damage *= 2;
        boss.width *= 1.5;
        boss.height *= 1.5;
        boss.scoreValue *= 5;
        
        this.enemies.push(boss);
    }

    spawnItem(isSpecial = false) {
        // Don't spawn items if there are already items in the room
        if (this.items.length > 0) return;
        
        // Choose item type
        let itemType;
        if (isSpecial) {
            // For special rooms, choose from all item types
            const specialTypes = ['health', 'damage_up', 'speed_up'];
            itemType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
        } else {
            // For normal rooms, 70% chance for health, 30% for other items
            const rand = Math.random();
            if (rand < 0.7) {
                itemType = 'health';
            } else {
                itemType = Math.random() < 0.5 ? 'damage_up' : 'speed_up';
            }
        }
        
        // Create item in the center of the room
        const item = new Item(
            this.width / 2,
            this.height / 2,
            itemType
        );
        
        this.items.push(item);
    }

    update(player) {
        let roomJustCleared = false;
        
        // Si es la sala de inicio, asegurarse de que siempre esté despejada y las puertas abiertas
        if (this.type === 'start') {
            this.cleared = true;
            // Asegurar que todas las puertas existentes estén abiertas
            for (const door in this.doors) {
                if (this.doors[door]) {
                    this.doors[door] = 'open';
                }
            }
            return false; // No hay necesidad de verificar nada más en la sala de inicio
        }
        
        // Check if room was just cleared (enemies were just defeated)
        const hadEnemies = this.enemies.length > 0;
        
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip if enemy is not active
            if (!enemy.isActive) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Update enemy
            enemy.update(player, this);
            
            // Check collision with player
            if (this.checkCollision(enemy, player) && !player.invincible) {
                player.takeDamage(enemy.damage);
            }
        }
        
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Skip if projectile is not active
            if (!projectile.isActive) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Update projectile
            projectile.update();
            
            // Check if projectile is out of bounds
            if (this.isOutOfBounds(projectile)) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies (if player's projectile)
            if (projectile.owner === 'player') {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    
                    if (enemy.isActive && this.checkCollision(projectile, enemy)) {
                        const killed = enemy.takeDamage(projectile.damage);
                        projectile.isActive = false;
                        
                        if (killed) {
                            // Add score when enemy is killed
                            if (player.onEnemyKilled) {
                                player.onEnemyKilled(enemy);
                            }
                            
                            // 20% chance to drop a health pickup
                            if (Math.random() < 0.2) {
                                this.spawnItem();
                            }
                            
                            this.enemies.splice(j, 1);
                        }
                        
                        break;
                    }
                }
            }
            // Check collision with player (if enemy's projectile)
            else if (projectile.owner === 'enemy') {
                if (this.checkCollision(projectile, player) && !player.invincible) {
                    player.takeDamage(projectile.damage);
                    projectile.isActive = false;
                    continue;
                }
            }
        }
        
        // Check if room was just cleared (enemies were just defeated and now there are none left)
        if (hadEnemies && this.enemies.length === 0 && !this.cleared) {
            this.cleared = true;
            roomJustCleared = true;
            
            // Open all doors when room is cleared
            if (this.doors.top) this.doors.top = 'open';
            if (this.doors.right) this.doors.right = 'open';
            if (this.doors.bottom) this.doors.bottom = 'open';
            if (this.doors.left) this.doors.left = 'open';
            
            // 30% chance to spawn an item when room is cleared
            if (this.type !== 'item' && Math.random() < 0.3) {
                this.spawnItem();
            }
        }
        
        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            // Check if item is collected by player
            if (this.checkCollision(item, player)) {
                player.addItem(item);
                this.items.splice(i, 1);
                continue;
            }
            
            // Update item animation or other properties if needed
            if (item.update) {
                item.update();
            }
        }
        
        return roomJustCleared;
    }
    
    draw(ctx) {
        // Draw background tiles
        for (const tile of this.backgroundTiles) {
            ctx.fillStyle = tile.color;
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        }
        
        // Draw room border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);
        
        // Draw doors
        this.drawDoors(ctx);
        
        // Draw all items
        for (const item of this.items) {
            item.draw(ctx);
        }
        
        // Draw all projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                projectile.draw(ctx);
            }
        }
        
        // Draw all enemies
        for (const enemy of this.enemies) {
            if (enemy.isActive) {
                enemy.draw(ctx);
            }
        }
    }

    drawDoors(ctx) {
        const doorSize = this.doorSize;
        const wallThickness = 20;
        
        // Draw top door
        if (this.doors.top) {
            const doorX = this.width / 2 - doorSize / 2;
            const doorY = 0;
            
            ctx.fillStyle = this.doors.top === 'open' ? '#4CAF50' : '#8B4513';
            ctx.fillRect(doorX, doorY, doorSize, wallThickness);
            
            if (this.doors.top !== 'open') {
                // Draw door details (optional)
                ctx.fillStyle = '#654321';
                ctx.fillRect(doorX + 5, doorY + 5, 5, 5);
            }
        }
        
        // Draw right door
        if (this.doors.right) {
            const doorX = this.width - wallThickness;
            const doorY = this.height / 2 - doorSize / 2;
            
            ctx.fillStyle = this.doors.right === 'open' ? '#4CAF50' : '#8B4513';
            ctx.fillRect(doorX, doorY, wallThickness, doorSize);
            
            if (this.doors.right !== 'open') {
                // Draw door details (optional)
                ctx.fillStyle = '#654321';
                ctx.fillRect(doorX + 5, doorY + 5, 5, 5);
            }
        }
        
        // Draw bottom door
        if (this.doors.bottom) {
            const doorX = this.width / 2 - doorSize / 2;
            const doorY = this.height - wallThickness;
            
            ctx.fillStyle = this.doors.bottom === 'open' ? '#4CAF50' : '#8B4513';
            ctx.fillRect(doorX, doorY, doorSize, wallThickness);
            
            if (this.doors.bottom !== 'open') {
                // Draw door details (optional)
                ctx.fillStyle = '#654321';
                ctx.fillRect(doorX + 5, doorY + 5, 5, 5);
            }
        }
        
        // Draw left door
        if (this.doors.left) {
            const doorX = 0;
            const doorY = this.height / 2 - doorSize / 2;
            
            ctx.fillStyle = this.doors.left === 'open' ? '#4CAF50' : '#8B4513';
            ctx.fillRect(doorX, doorY, wallThickness, doorSize);
            
            if (this.doors.left !== 'open') {
                // Draw door details (optional)
                ctx.fillStyle = '#654321';
                ctx.fillRect(doorX + 5, doorY + 5, 5, 5);
            }
        }
    }

    checkCollision(obj1, obj2) {
        return (
            obj1.x - obj1.width / 2 < obj2.x + obj2.width / 2 &&
            obj1.x + obj1.width / 2 > obj2.x - obj2.width / 2 &&
            obj1.y - obj1.height / 2 < obj2.y + obj2.height / 2 &&
            obj1.y + obj1.height / 2 > obj2.y - obj2.height / 2
        );
    }
    
    checkWallCollision(obj) {
        // Check boundaries with wall padding
        const wallPadding = 10; // Padding to prevent getting too close to walls
        
        // Check left wall
        if (obj.x - obj.width / 2 < wallPadding) {
            obj.x = wallPadding + obj.width / 2;
            return true;
        }
        
        // Check right wall
        if (obj.x + obj.width / 2 > this.width - wallPadding) {
            obj.x = this.width - wallPadding - obj.width / 2;
            return true;
        }
        
        // Check top wall
        if (obj.y - obj.height / 2 < wallPadding) {
            obj.y = wallPadding + obj.height / 2;
            return true;
        }
        
        // Check bottom wall
        if (obj.y + obj.height / 2 > this.height - wallPadding) {
            obj.y = this.height - wallPadding - obj.height / 2;
            return true;
        }
        
        return false;
    }

    isOutOfBounds(obj) {
        return (
            obj.x < 0 ||
            obj.x > this.width ||
            obj.y < 0 ||
            obj.y > this.height
        );
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }
}
