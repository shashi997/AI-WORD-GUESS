const mongoose = require('mongoose');

// Game Session Schema
const gameSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Link to your User model
    },
    wordToGuess: {
        type: String,
        required: true,
        lowercase: true // Store word in lowercase for easier comparison
    },
    wordDisplay: { // e.g., "_ _ _ _"
        type: String,
        required: true,
    },
    guesses: { // Letters or full words guessed
        type: [String],
        default: [],
        lowercase: true // Store guesses in lowercase
    },
    incorrectGuesses: {
        type: Number,
        default: 0,
    },
    maxIncorrectGuesses: { // Can be adjusted based on difficulty
        type: Number,
        required: true, // Make required, set during game start
        default: 6 // Remove default, set dynamically
    },
    clues: { // Store generated clues
        type: [String],
        default: []
    },
    maxCluesAllowed: { // New field for clue limit
        type: Number,
        required: true, // Make required, set during game start
    },
    category: { // New field for category
        type: String,
        required: true,
        enum: ['tech', 'animals', 'places', 'science', 'interesting', 'random'] // Example categories
    },
    difficulty: { // New field for difficulty
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    isGameOver: {
        type: Boolean,
        default: false,
    },
    isWon: {
        type: Boolean,
        default: false,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    // Optional: Store generated word info after game over
    wordInfo: {
        type: String,
        default: null
    }
}, { timestamps: true }); // Adds createdAt and updatedAt


// --- Helper Method to Update Display ---
gameSessionSchema.methods.updateDisplay = function() {
    const word = this.wordToGuess.toLowerCase();
    let display = '';
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char === ' ') {
            display += '  '; // Keep spaces visible
        } else if (this.guesses.includes(char)) {
            display += char.toUpperCase() + ' '; // Show guessed letters
        } else {
            display += '_ '; // Mask unguessed letters
        }
    }
    this.wordDisplay = display.trim();
};


// --- Helper Method to Check Win Condition ---
gameSessionSchema.methods.checkWin = function() {
    const word = this.wordToGuess.toLowerCase();
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        // If a character isn't a space and hasn't been guessed, the game isn't won yet
        if (char !== ' ' && !this.guesses.includes(char)) {
            return false;
        }
    }
    return true; // All letters guessed
};

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;
