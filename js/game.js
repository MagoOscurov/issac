import { Player } from './player.js';
import { Room } from './room.js';
import { Projectile } from './projectile.js';
import { DIRECTIONS, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { drawTextWithOutline } from './helpers.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.currentLevel = 1;
        this.rooms = [];
        this.currentRoomIndex = 0;
        this.roomGrid = [];
        this.roomSize = 3; // 3x3 grid of rooms
        this.roomWidth = this.width;
        this.roomHeight = this.height - 50; // Leave space for HUD
        
        // Game objects
        this.player = null;
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000/60; // 60 FPS
    }
    
    init() {
        // Create player in the center of the screen
        this.player = new Player(this.roomWidth / 2, this.roomHeight / 2);
        
        // Generate rooms
        this.generateRooms();
        
        // Set up player's onEnemyKilled callback
        this.player.onEnemyKilled = (enemy) => {
            this.score += enemy.scoreValue;
            this.updateHUD();
        };
        
        // Start with the first room
        this.enterRoom(0, 0);
        
        // Update HUD
        this.updateHUD();
        
        // Start the game loop
        this.isRunning = true;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    generateRooms() {
        // Create a grid of rooms
        this.roomGrid = [];
        this.rooms = [];
        
        // Initialize grid with nulls
        for (let y = 0; y < this.roomSize; y++) {
            const row = [];
            for (let x = 0; x < this.roomSize; x++) {
                row.push(null);
            }
            this.roomGrid.push(row);
        }
        
        // Start with the center room
        const startX = Math.floor(this.roomSize / 2);
        const startY = Math.floor(this.roomSize / 2);
        
        // Create the starting room
        const startRoom = new Room('start', this.roomWidth, this.roomHeight);
        this.rooms.push(startRoom);
        this.roomGrid[startY][startX] = 0; // Index of the room in this.rooms
        
        // Generate paths to other rooms
        this.generateRoomPaths(startX, startY);
        
        // Make sure at least one room has an item
        const itemRoomIndex = Math.floor(Math.random() * (this.rooms.length - 1)) + 1; // Skip the first room
        if (this.rooms[itemRoomIndex]) {
            this.rooms[itemRoomIndex].type = 'item';
            this.rooms[itemRoomIndex].generateRoom(); // Regenerate with item type
        }
    }
    
    generateRoomPaths(x, y, depth = 0, maxDepth = 4) {
        if (depth >= maxDepth) return;
        
        const directions = [
            { dx: 0, dy: -1, door: 'top', opposite: 'bottom' },
            { dx: 1, dy: 0, door: 'right', opposite: 'left' },
            { dx: 0, dy: 1, door: 'bottom', opposite: 'top' },
            { dx: -1, dy: 0, door: 'left', opposite: 'right' }
        ];
        
        // Shuffle directions to create more interesting paths
        this.shuffleArray(directions);
        
        // Try to connect to existing rooms first
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Check if the new position is within bounds
            if (newX >= 0 && newX < this.roomSize && newY >= 0 && newY < this.roomSize) {
                // If the room exists and we're not already connected
                if (this.roomGrid[newY][newX] !== null) {
                    const currentRoomIndex = this.roomGrid[y][x];
                    const otherRoomIndex = this.roomGrid[newY][newX];
                    const currentRoom = this.rooms[currentRoomIndex];
                    const otherRoom = this.rooms[otherRoomIndex];
                    
                    // Increase connection chance to 75% for more interconnected rooms
                    if (Math.random() < 0.75 && !currentRoom.doors[dir.door]) {
                        currentRoom.doors[dir.door] = true;
                        otherRoom.doors[dir.opposite] = true;
                    }
                }
            }
        }
        
        // Then proceed with normal path generation
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Check if the new position is within bounds and not already visited
            if (newX >= 0 && newX < this.roomSize && 
                newY >= 0 && newY < this.roomSize && 
                this.roomGrid[newY][newX] === null) {
                
                // Create a new room
                const roomType = depth === maxDepth - 1 ? 'boss' : 'normal';
                const room = new Room(roomType, this.roomWidth, this.roomHeight);
                
                // Add the room to our list and grid
                const roomIndex = this.rooms.length;
                this.rooms.push(room);
                this.roomGrid[newY][newX] = roomIndex;
                
                // Connect the rooms with doors
                const currentRoomIndex = this.roomGrid[y][x];
                const currentRoom = this.rooms[currentRoomIndex];
                
                // Always connect new rooms
                currentRoom.doors[dir.door] = true;
                room.doors[dir.opposite] = true;
                
                // Recursively generate more rooms
                this.generateRoomPaths(newX, newY, depth + 1, maxDepth);
            }
        }
        
        // Ensure all rooms are connected (flood fill check)
        if (depth === 0) {
            this.ensureAllRoomsConnected();
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    ensureAllRoomsConnected() {
        const visited = new Set();
        const toVisit = [0]; // Start from the first room (start room)
        
        while (toVisit.length > 0) {
            const roomIndex = toVisit.pop();
            if (visited.has(roomIndex)) continue;
            
            visited.add(roomIndex);
            const room = this.rooms[roomIndex];
            
            // Find all connected rooms
            const directions = [
                { dx: 0, dy: -1, door: 'top', opposite: 'bottom' },
                { dx: 1, dy: 0, door: 'right', opposite: 'left' },
                { dx: 0, dy: 1, door: 'bottom', opposite: 'top' },
                { dx: -1, dy: 0, door: 'left', opposite: 'right' }
            ];
            
            // Find this room's position in the grid
            let roomX = -1, roomY = -1;
            for (let y = 0; y < this.roomSize; y++) {
                for (let x = 0; x < this.roomSize; x++) {
                    if (this.roomGrid[y][x] === roomIndex) {
                        roomX = x;
                        roomY = y;
                        break;
                    }
                }
                if (roomX !== -1) break;
            }
            
            // Check all directions for connected rooms
            for (const dir of directions) {
                if (room.doors[dir.door]) {
                    const newX = roomX + dir.dx;
                    const newY = roomY + dir.dy;
                    
                    if (newX >= 0 && newX < this.roomSize && newY >= 0 && newY < this.roomSize) {
                        const nextRoomIndex = this.roomGrid[newY][newX];
                        if (nextRoomIndex !== null && !visited.has(nextRoomIndex)) {
                            toVisit.push(nextRoomIndex);
                        }
                    }
                }
            }
        }
        
        // If not all rooms are connected, force connections
        if (visited.size < this.rooms.length) {
            // Find all unconnected rooms
            const unconnected = [];
            for (let i = 0; i < this.rooms.length; i++) {
                if (!visited.has(i)) {
                    unconnected.push(i);
                }
            }
            
            // Connect each unconnected room to a random connected room
            for (const roomIndex of unconnected) {
                // Find position of unconnected room
                let roomX = -1, roomY = -1;
                for (let y = 0; y < this.roomSize; y++) {
                    for (let x = 0; x < this.roomSize; x++) {
                        if (this.roomGrid[y][x] === roomIndex) {
                            roomX = x;
                            roomY = y;
                            break;
                        }
                    }
                    if (roomX !== -1) break;
                }
                
                // Find a random connected neighbor
                const directions = [
                    { dx: 0, dy: -1, door: 'top', opposite: 'bottom' },
                    { dx: 1, dy: 0, door: 'right', opposite: 'left' },
                    { dx: 0, dy: 1, door: 'bottom', opposite: 'top' },
                    { dx: -1, dy: 0, door: 'left', opposite: 'right' }
                ];
                
                for (const dir of directions) {
                    const newX = roomX + dir.dx;
                    const newY = roomY + dir.dy;
                    
                    if (newX >= 0 && newX < this.roomSize && newY >= 0 && newY < this.roomSize) {
                        const neighborIndex = this.roomGrid[newY][newX];
                        if (neighborIndex !== null && visited.has(neighborIndex)) {
                            // Connect these rooms
                            this.rooms[roomIndex].doors[dir.door] = 'open';
                            this.rooms[neighborIndex].doors[dir.opposite] = 'open';
                            visited.add(roomIndex);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    enterRoom(roomX, roomY) {
        // Check if the coordinates are within the grid
        if (roomX < 0 || roomX >= this.roomSize || roomY < 0 || roomY >= this.roomSize) {
            return false;
        }
        
        const roomIndex = this.roomGrid[roomY][roomX];
        if (roomIndex === null || roomIndex === undefined) {
            return false;
        }
        
        // Update current room
        this.currentRoomIndex = roomIndex;
        this.currentRoom = this.rooms[roomIndex];
        this.currentRoomX = roomX;
        this.currentRoomY = roomY;
        
        // Position player based on the direction they came from
        if (typeof this.lastRoomX !== 'undefined' && typeof this.lastRoomY !== 'undefined') {
            const dx = roomX - this.lastRoomX;
            const dy = roomY - this.lastRoomY;
            
            if (dx > 0) {
                // Came from left
                this.player.x = 50;
                this.player.y = this.roomHeight / 2;
            } else if (dx < 0) {
                // Came from right
                this.player.x = this.roomWidth - 50;
                this.player.y = this.roomHeight / 2;
            } else if (dy > 0) {
                // Came from top
                this.player.x = this.roomWidth / 2;
                this.player.y = 50;
            } else if (dy < 0) {
                // Came from bottom
                this.player.x = this.roomWidth / 2;
                this.player.y = this.roomHeight - 50;
            }
        } else {
            // Initial room, position in center
            this.player.x = this.roomWidth / 2;
            this.player.y = this.roomHeight / 2;
        }
        
        return true;
    }
    
    updateHUD() {
        const healthElement = document.getElementById('health');
        const scoreElement = document.getElementById('score');
        const itemsElement = document.getElementById('items');
        
        if (healthElement) {
            healthElement.textContent = `❤️ x ${this.player.health}`;
        }
        
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score}`;
        }
        
        if (itemsElement) {
            const itemCounts = {};
            this.player.collectedItems.forEach(item => {
                itemCounts[item] = (itemCounts[item] || 0) + 1;
            });
            
            const itemText = Object.entries(itemCounts)
                .map(([item, count]) => `${item}: ${count}`)
                .join(', ');
                
            itemsElement.textContent = `Items: ${itemText || 'None'}`;
        }
    }
    
    setupEventListeners() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent default for arrow keys and space to avoid scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // Handle shooting with arrow keys or space
            if (e.key === ' ' || e.key.startsWith('Arrow')) {
                this.handleShooting();
            }
            
            // Handle restart game
            if (e.key === 'r' && !this.isRunning) {
                this.restart();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Handle restart button click
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restart());
        }
    }
    
    handleShooting() {
        if (!this.player || !this.currentRoom) return;
        
        // Determine shooting direction based on arrow keys
        let direction = null;
        
        if (this.keys['ArrowUp'] || this.keys['w']) {
            direction = DIRECTIONS.UP;
        } else if (this.keys['ArrowDown'] || this.keys['s']) {
            direction = DIRECTIONS.DOWN;
        } else if (this.keys['ArrowLeft'] || this.keys['a']) {
            direction = DIRECTIONS.LEFT;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            direction = DIRECTIONS.RIGHT;
        }
        
        if (direction) {
            const projectile = this.player.shoot();
            if (projectile) {
                projectile.direction = direction;
                this.currentRoom.addProjectile(new Projectile(
                    this.player.x,
                    this.player.y,
                    projectile.direction,
                    projectile.speed,
                    projectile.damage,
                    'player'
                ));
            }
        }
    }
    
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Add to accumulator
        this.accumulator += deltaTime;
        
        // Update game state at fixed time steps
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        // Render the game
        this.render();
        
        // Continue the game loop
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update(deltaTime) {
        if (!this.player || !this.currentRoom) return;
        
        // Update player input
        this.player.keys = {
            w: this.keys['w'] || this.keys['W'] || false,
            a: this.keys['a'] || this.keys['A'] || false,
            s: this.keys['s'] || this.keys['S'] || false,
            d: this.keys['d'] || this.keys['D'] || false,
            ArrowUp: this.keys['ArrowUp'] || false,
            ArrowDown: this.keys['ArrowDown'] || false,
            ArrowLeft: this.keys['ArrowLeft'] || false,
            ArrowRight: this.keys['ArrowRight'] || false,
            ' ': this.keys[' '] || false
        };
        
        // Update player with current room for collision detection
        this.player.update(this.currentRoom);
        
        // Check for room transitions
        this.checkRoomTransitions();
        
        // Update current room
        const roomChanged = this.currentRoom.update(this.player);
        
        // Check if current room was just cleared
        if (roomChanged && !this.currentRoom.cleared) {
            this.currentRoom.cleared = true;
            this.checkLevelCompletion();
        }
        
        // Check for player death
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    checkRoomTransitions() {
        if (!this.player || !this.currentRoom) return;
        
        const playerX = this.player.x;
        const playerY = this.player.y;
        const playerWidth = this.player.width;
        const playerHeight = this.player.height;
        const doorThreshold = 20; // Aumentado para hacer más fácil la detección
        
        // Debug: Mostrar posición del jugador y estado de las puertas
        //console.log(`Player: (${playerX}, ${playerY}), Doors:`, this.currentRoom.doors);
        
        // Check if player is trying to go through a door
        // Puerta superior
        if (playerY - playerHeight / 2 < doorThreshold) {
            if (this.currentRoom.doors.top === 'open') {
                // Go up
                this.lastRoomX = this.currentRoomX;
                this.lastRoomY = this.currentRoomY;
                if (this.enterRoom(this.currentRoomX, this.currentRoomY - 1)) {
                    // Position player at the bottom of the new room
                    this.player.y = this.roomHeight - doorThreshold - playerHeight / 2;
                    this.updateHUD();
                }
            }
        } 
        // Puerta derecha
        else if (playerX + playerWidth / 2 > this.roomWidth - doorThreshold) {
            if (this.currentRoom.doors.right === 'open') {
                // Go right
                this.lastRoomX = this.currentRoomX;
                this.lastRoomY = this.currentRoomY;
                if (this.enterRoom(this.currentRoomX + 1, this.currentRoomY)) {
                    // Position player at the left of the new room
                    this.player.x = doorThreshold + playerWidth / 2;
                    this.updateHUD();
                }
            }
        } 
        // Puerta inferior
        else if (playerY + playerHeight / 2 > this.roomHeight - doorThreshold) {
            if (this.currentRoom.doors.bottom === 'open') {
                // Go down
                this.lastRoomX = this.currentRoomX;
                this.lastRoomY = this.currentRoomY;
                if (this.enterRoom(this.currentRoomX, this.currentRoomY + 1)) {
                    // Position player at the top of the new room
                    this.player.y = doorThreshold + playerHeight / 2;
                    this.updateHUD();
                }
            }
        } 
        // Puerta izquierda
        else if (playerX - playerWidth / 2 < doorThreshold) {
            if (this.currentRoom.doors.left === 'open') {
                // Go left
                this.lastRoomX = this.currentRoomX;
                this.lastRoomY = this.currentRoomY;
                if (this.enterRoom(this.currentRoomX - 1, this.currentRoomY)) {
                    // Position player at the right of the new room
                    this.player.x = this.roomWidth - doorThreshold - playerWidth / 2;
                    this.updateHUD();
                }
            }
        }
    }
    
    render() {
        if (!this.ctx) return;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw the current room
        if (this.currentRoom) {
            this.currentRoom.draw(this.ctx);
        }
        
        // Draw the player
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // Draw minimap
        this.drawMinimap();
        
        // Draw FPS counter (for debugging)
        // this.drawFPS();
    }
    
    drawMinimap() {
        const miniMapSize = 120;
        const roomSize = miniMapSize / this.roomSize;
        const padding = 10;
        
        // Draw minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(
            this.width - miniMapSize - padding,
            padding,
            miniMapSize + padding * 2,
            miniMapSize + padding * 2
        );
        
        // Draw minimap border
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.width - miniMapSize - padding,
            padding,
            miniMapSize + padding * 2,
            miniMapSize + padding * 2
        );
        
        // Draw rooms
        for (let y = 0; y < this.roomGrid.length; y++) {
            for (let x = 0; x < this.roomGrid[y].length; x++) {
                const roomIndex = this.roomGrid[y][x];
                
                if (roomIndex !== null) {
                    const room = this.rooms[roomIndex];
                    
                    // Room color based on type and cleared status
                    let roomColor = '#333';
                    if (room.type === 'start') {
                        roomColor = '#4CAF50'; // Green for start room
                    } else if (room.type === 'boss') {
                        roomColor = room.cleared ? '#9C27B0' : '#F44336'; // Purple if cleared, red if not
                    } else if (room.type === 'item') {
                        roomColor = room.cleared ? '#4CAF50' : '#FFC107'; // Green if cleared, yellow if not
                    } else {
                        roomColor = room.cleared ? '#4CAF50' : '#2196F3'; // Green if cleared, blue if not
                    }
                    
                    // Draw room
                    this.ctx.fillStyle = roomColor;
                    this.ctx.fillRect(
                        this.width - miniMapSize + x * roomSize,
                        padding + y * roomSize,
                        roomSize - 1,
                        roomSize - 1
                    );
                    
                    // Draw current room indicator
                    if (x === this.currentRoomX && y === this.currentRoomY) {
                        this.ctx.strokeStyle = '#FFEB3B';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(
                            this.width - miniMapSize + x * roomSize - 1,
                            padding + y * roomSize - 1,
                            roomSize + 1,
                            roomSize + 1
                        );
                    }
                }
            }
        }
    }
    
    drawFPS() {
        // This would be more accurate with a proper FPS counter
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${Math.round(1000 / 16)}`, 10, 20);
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Show game over screen
        const gameOverElement = document.getElementById('game-over');
        const finalScoreElement = document.getElementById('final-score');
        
        if (gameOverElement && finalScoreElement) {
            finalScoreElement.textContent = this.score;
            gameOverElement.classList.remove('hidden');
        }
    }
    
    checkLevelCompletion() {
        // Check if all rooms are cleared
        const allRoomsCleared = this.rooms.every(room => room.cleared || room.type === 'start');
        
        if (allRoomsCleared) {
            // Move to next level
            this.currentLevel++;
            
            // Show level up message
            const levelUpElement = document.getElementById('level-up');
            if (levelUpElement) {
                levelUpElement.textContent = `Level ${this.currentLevel} - Floor ${this.currentLevel}`;
                levelUpElement.classList.remove('hidden');
                
                // Hide message after 2 seconds
                setTimeout(() => {
                    levelUpElement.classList.add('hidden');
                }, 2000);
            }
            
            // Generate new level
            this.generateRooms();
            
            // Reset player position to start room
            const startX = Math.floor(this.roomSize / 2);
            const startY = Math.floor(this.roomSize / 2);
            this.enterRoom(startX, startY);
            
            // Heal player a bit when leveling up
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
            this.updateHUD();
        }
    }
    
    restart() {
        // Hide game over screen
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.classList.add('hidden');
        }
        
        // Reset game state
        this.score = 0;
        this.currentLevel = 1;
        
        // Reinitialize the game
        this.init();
    }
}
