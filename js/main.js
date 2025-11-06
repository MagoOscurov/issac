import { Game } from './game.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    
    // Initialize the game
    const game = new Game(canvas);
    
    // Start the game
    game.init();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // You can add responsive resizing logic here if needed
    });
});