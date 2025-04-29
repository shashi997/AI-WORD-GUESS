const express = require('express');
const router = express.Router();
const GameSession = require('../models/GameSession'); // Adjust path if necessary
const { protect } = require('../middleware/auth'); // Import auth middleware
const User = require('../models/User'); // Needed for updating stats
const { generateWord, generateClue, generateWordInfo } = require('../services/aiService'); // Import the AI service


// --- TODO: Word List ---
// Replace this with a more robust way to get words (e.g., from a file, database, or API)
// const wordList = ["javascript", "hangman", "developer", "coding", "nodejs", "express", "react", "database"];
// function getRandomWord() {
//     // Basic filtering for variety (optional)
//     const filteredList = wordList.filter(word => word.length > 3); // Example: only words longer than 3 letters
//     // Handle edge case where filtering results in an empty list
//     if (filteredList.length === 0) {
//         console.warn("Word list filtering resulted in an empty list. Using original list.");
//         return wordList[Math.floor(Math.random() * wordList.length)];
//     }
//     return filteredList[Math.floor(Math.random() * filteredList.length)];
// }

// --- Helper Function to Update User Stats ---
// Moved outside routes for reusability
const updateUserStats = async (userId, wonGame) => {
    try {
        const update = { $inc: { gamesPlayed: 1 } };
        if (wonGame) {
            update.$inc.gamesWon = 1;
        }
        await User.findByIdAndUpdate(userId, update);
        console.log(`Stats updated for user ${userId}: wonGame=${wonGame}`);
    } catch (error) {
        console.error(`Failed to update stats for user ${userId}:`, error);
        // Decide if this error should be surfaced to the user or just logged
    }
};

// --- Define Difficulty Settings ---
const DIFFICULTY_SETTINGS = {
    easy: { maxIncorrectGuesses: 8, maxCluesAllowed: 5 },
    medium: { maxIncorrectGuesses: 6, maxCluesAllowed: 4 },
    hard: { maxIncorrectGuesses: 5, maxCluesAllowed: 3 },
};
const VALID_CATEGORIES = ['tech', 'animals', 'places', 'science', 'interesting', 'random'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];


// --- Start New Game ---
// POST /api/games/start
router.post('/start', protect, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { category, difficulty } = req.body;
        const geminiModel = req.app.locals.geminiModel; // Get model from app.locals

        // --- Input Validation ---
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: `Invalid or missing category. Choose from: ${VALID_CATEGORIES.join(', ')}` });
        }
        if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
            return res.status(400).json({ message: `Invalid or missing difficulty. Choose from: ${VALID_DIFFICULTIES.join(', ')}` });
        }
        if (!geminiModel) {
             console.error("Gemini model not found in app.locals for /start route");
             return res.status(503).json({ message: 'AI service is currently unavailable to generate a word.' });
        }

        // --- AI Word Generation ---
        let wordToGuess;
        try {
            wordToGuess = await generateWord(geminiModel, category, difficulty);
        } catch (aiError) {
            console.error("AI Word Generation Failed:", aiError);
            // Pass the specific error message from the service
            return next(aiError); // Let central error handler manage AI errors
        }

        // --- Determine Game Settings ---
        const settings = DIFFICULTY_SETTINGS[difficulty];

        // Create initial display (e.g., "_ _ _ _")
        let initialDisplay = '';
        for (let i = 0; i < wordToGuess.length; i++) {
            initialDisplay += wordToGuess[i] === ' ' ? '  ' : '_ ';
        }
        initialDisplay = initialDisplay.trim();

        // --- Create New Game Session ---
        const newGame = new GameSession({
            userId: userId,
            wordToGuess: wordToGuess, // Already lowercase from AI service
            wordDisplay: initialDisplay,
            category: category,
            difficulty: difficulty,
            maxIncorrectGuesses: settings.maxIncorrectGuesses,
            maxCluesAllowed: settings.maxCluesAllowed,
            guesses: [],
            clues: [],
            // Other fields like incorrectGuesses, isGameOver, isWon use schema defaults
        });

        await newGame.save();

        // --- Prepare Response ---
        // Don't send wordToGuess back to the client initially
        const gameDataForClient = {
             _id: newGame._id,
             wordDisplay: newGame.wordDisplay,
             incorrectGuesses: newGame.incorrectGuesses,
             maxIncorrectGuesses: newGame.maxIncorrectGuesses,
             maxCluesAllowed: newGame.maxCluesAllowed, // Send clue limit
             isGameOver: newGame.isGameOver,
             isWon: newGame.isWon,
             clues: newGame.clues,
             guesses: newGame.guesses,
             category: newGame.category, // Send back category/difficulty
             difficulty: newGame.difficulty,
        };

        res.status(201).json({ message: `Game started! Category: ${category}, Difficulty: ${difficulty}`, game: gameDataForClient });

    } catch (error) {
        console.error("Start Game Error:", error);
        next(error); // Pass error to the central error handler
    }
});


// --- Get Current Game State ---
// GET /api/games/:sessionId
// Added 'next' parameter
router.get('/:sessionId',  protect, async (req, res, next) => {
    try {
        const game = await GameSession.findById(req.params.sessionId);

        if (!game) {
            return res.status(404).json({ message: 'Game session not found' });
        }
        if (game.userId.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Not authorized to access this game session' });
        }

        // Prepare data, revealing word only if game is over
        const gameDataForClient = {
             _id: game._id,
             wordDisplay: game.wordDisplay,
             incorrectGuesses: game.incorrectGuesses,
             maxIncorrectGuesses: game.maxIncorrectGuesses,
             maxCluesAllowed: game.maxCluesAllowed, // Include clue limit
             isGameOver: game.isGameOver,
             isWon: game.isWon,
             clues: game.clues,
             guesses: game.guesses,
             category: game.category,
             difficulty: game.difficulty,
             // Only reveal the word if the game is over
             ...(game.isGameOver && { wordToGuess: game.wordToGuess }),
             // Indicate if word info is available (optional, could be fetched separately)
             // wordInfoAvailable: game.isGameOver && !game.wordInfo // Example flag
        };

        res.json({ message: 'Current game state retrieved.', game: gameDataForClient });

    } catch (error) {
        console.error("Get Game State Error:", error);
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid game session ID format' });
        }
        next(error);
    }
});


// --- Submit a Guess ---
// POST /api/games/:sessionId/guess
// Added 'next' parameter
router.post('/:sessionId/guess', protect, async (req, res, next) => {
    const { guess } = req.body; // Expecting { "guess": "a" } or { "guess": "word" }

    if (!guess || typeof guess !== 'string' || guess.trim().length === 0) {
        // Provide a more specific error message
        return res.status(400).json({ message: 'Invalid guess provided. Please enter a letter or the full word.' });
    }

    const formattedGuess = guess.trim().toLowerCase();

    try {
        const game = await GameSession.findById(req.params.sessionId);

        if (!game) {
            return res.status(404).json({ message: 'Game session not found' });
        }

        // Authorization
        if (game.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this game session' });
        }

        // Check if game is already over
        if (game.isGameOver) {
            return res.status(400).json({ message: 'Game is already over. Start a new game.' });
        }

        // Check if guess was already made
        if (game.guesses.includes(formattedGuess)) {
             return res.status(400).json({ message: `You already guessed '${formattedGuess}'. Try a different letter or word.` });
        }

        // --- Process Guess ---
        // FIX: Declare shouldUpdateStats here
        let shouldUpdateStats = false;
        game.guesses.push(formattedGuess);
        let message = `Guess '${formattedGuess}' submitted.`;
        let correctGuess = false;

        if (formattedGuess.length === 1) { // Letter guess
            if (game.wordToGuess.includes(formattedGuess)) {
                correctGuess = true;
                message = `Correct! '${formattedGuess.toUpperCase()}' is in the word/phrase.`;
                game.updateDisplay(); // Update display based on new correct letter
            } else {
                game.incorrectGuesses += 1;
                message = `Incorrect. '${formattedGuess.toUpperCase()}' is not in the word/phrase.`;
            }
        } else { // Word/Phrase guess
            if (formattedGuess === game.wordToGuess) {
                correctGuess = true;
                // Mark all constituent letters as guessed for display update
                const lettersInWord = [...new Set(game.wordToGuess.split('').filter(c => c !== ' '))];
                game.guesses = [...new Set([...game.guesses, ...lettersInWord])];
                game.updateDisplay(); // Reveal the whole word/phrase
                game.isGameOver = true;
                game.isWon = true;
                game.endTime = Date.now();
                message = `Amazing! You guessed it: ${game.wordToGuess}`;
                shouldUpdateStats = true;
            } else {
                game.incorrectGuesses += 1; // Penalize incorrect full guess
                message = `Incorrect. '${formattedGuess}' is not the right word/phrase.`;
            }
        }

        // --- Check Game Over Conditions (if not already ended by full guess) ---
        if (!game.isGameOver) {
             if (game.checkWin()) { // Check if all letters/spaces are revealed
                 game.isGameOver = true;
                 game.isWon = true;
                 game.endTime = Date.now();
                 game.updateDisplay(); // Ensure display is fully updated
                 message = `Congratulations! You revealed: ${game.wordToGuess}`;
                 shouldUpdateStats = true;
             } else if (game.incorrectGuesses >= game.maxIncorrectGuesses) {
                 game.isGameOver = true;
                 game.isWon = false;
                 game.endTime = Date.now();
                 message = `Game Over! Too many incorrect guesses. The word/phrase was: ${game.wordToGuess}`;
                 shouldUpdateStats = true;
             }
        }

        // Update user stats if the game just ended
        if (shouldUpdateStats && req.user?._id) {
            await updateUserStats(req.user._id, game.isWon);
        }

        await game.save();

        // Prepare response data
        const gameDataForClient = {
             _id: game._id,
             wordDisplay: game.wordDisplay,
             incorrectGuesses: game.incorrectGuesses,
             maxIncorrectGuesses: game.maxIncorrectGuesses,
             maxCluesAllowed: game.maxCluesAllowed,
             isGameOver: game.isGameOver,
             isWon: game.isWon,
             clues: game.clues,
             guesses: game.guesses,
             category: game.category,
             difficulty: game.difficulty,
             ...(game.isGameOver && { wordToGuess: game.wordToGuess })
        };

        res.json({ message: message, game: gameDataForClient, correctGuess: correctGuess });

    } catch (error) {
        console.error("Submit Guess Error:", error);
         if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid game session ID format' });
        }
        next(error);
    }
});


// --- Get Next Clue ---
// GET /api/games/:sessionId/clue
// Added 'next' parameter
router.get('/:sessionId/clue', protect, async (req, res, next) => {
    try {
        const game = await GameSession.findById(req.params.sessionId);
        const geminiModel = req.app.locals.geminiModel; // Get model from app.locals

        if (!game) {
            return res.status(404).json({ message: 'Game session not found' });
        }

        // Authorization
        if (game.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to get clues for this game' });
        }

        if (game.isGameOver) {
            return res.status(400).json({ message: 'Cannot get clue, the game is already over.' });
        }

        if (!geminiModel) {
            console.error("Gemini model not found in app.locals for /clue route");
            // Use 503 Service Unavailable for service dependency issues
            return res.status(503).json({ message: 'AI Clue service is currently unavailable.' });
       }

        // --- Call AI Service to Generate Clue ---
        let newClue = '';
        try {
            newClue = await generateClue(
                geminiModel,
                game.wordToGuess,
                game.wordDisplay,
                game.clues, // Pass existing clues
                game.guesses,
                game.incorrectGuesses,
                game.maxIncorrectGuesses
            );

            // Add the new clue to the game session and save
            game.clues.push(newClue);
            // Removed clueIndex, just rely on array length
            await game.save();

            res.json({
                message: `Clue ${game.clues.length}/${game.maxCluesAllowed} generated.`,
                clue: newClue, // Send only the new clue
                allClues: game.clues, // Send all clues including the new one
                cluesRemaining: game.maxCluesAllowed - game.clues.length // Helpful for client UI
            });

        } catch (aiError) {
            console.error("AI Clue Generation Failed:", aiError);
            // Pass the AI-specific error to the central handler
            next(aiError);
        }

    } catch (error) {
        console.error("Get Clue Route Error:", error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid game session ID format' });
        }
        // Pass other errors to the central error handler
        next(error); // Use the passed 'next' function
    }
});


// --- NEW: Get Word Info (Post-Game) ---
// GET /api/games/:sessionId/info
router.get('/:sessionId/info', protect, async (req, res, next) => {
    try {
        const game = await GameSession.findById(req.params.sessionId);
        const geminiModel = req.app.locals.geminiModel;

        if (!game) return res.status(404).json({ message: 'Game session not found' });
        if (game.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        // --- Check if game is actually over ---
        if (!game.isGameOver) {
            return res.status(400).json({ message: 'Game is not over yet. Finish the game to get word info.' });
        }

        if (!geminiModel) {
            console.error("Gemini model not found in app.locals for /info route");
            return res.status(503).json({ message: 'AI service is currently unavailable.' });
        }

        // --- Check if info already generated and stored (optional optimization) ---
        if (game.wordInfo) {
             console.log(`Returning stored info for word: ${game.wordToGuess}`);
             return res.json({
                 message: `Information for "${game.wordToGuess}".`,
                 word: game.wordToGuess,
                 info: game.wordInfo
             });
        }

        // --- Call AI Service to Generate Info ---
        try {
            const wordInfo = await generateWordInfo(geminiModel, game.wordToGuess);

            // --- Optionally store the generated info in the DB ---
            // This prevents repeated API calls for the same finished game
            game.wordInfo = wordInfo;
            await game.save();
            // --- End Optional Store ---

            res.json({
                message: `Information generated for "${game.wordToGuess}".`,
                word: game.wordToGuess,
                info: wordInfo
            });

        } catch (aiError) {
            console.error("AI Word Info Generation Failed:", aiError);
            next(aiError); // Pass AI errors to central handler
        }

    } catch (error) {
        console.error("Get Word Info Route Error:", error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid game session ID format' });
        }
        next(error);
    }
});



// --- End Game Session (Forfeit) ---
// POST /api/games/:sessionId/end
// Added 'next' parameter
router.post('/:sessionId/end',  protect, async (req, res, next) => {
    try {
        const game = await GameSession.findById(req.params.sessionId);

        if (!game) {
            return res.status(404).json({ message: 'Game session not found' });
        }

        // Authorization
        if (game.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to end this game session' });
        }

        if (game.isGameOver) {
            // It's not really an error if the game is already over, maybe just return current state
            return res.status(400).json({ message: 'This game has already ended.' });
        }

        // Mark game as over (forfeited)
        game.isGameOver = true;
        game.isWon = false; // Explicitly set to false as it's ended prematurely
        game.endTime = Date.now();

        // Update user stats for the forfeit (played, not won)
        if (req.user && req.user._id) {
            await updateUserStats(req.user._id, false);
        } else {
             console.warn("Cannot update stats on forfeit: User ID not found in request.");
        }


        await game.save();

        // Prepare response, including revealing the word
        res.json({
            message: "Game session forfeited.",
            game: {
                _id: game._id,
                wordDisplay: game.wordDisplay,
                incorrectGuesses: game.incorrectGuesses,
                maxIncorrectGuesses: game.maxIncorrectGuesses,
                maxCluesAllowed: game.maxCluesAllowed,
                isGameOver: game.isGameOver,
                isWon: game.isWon,
                clues: game.clues,
                guesses: game.guesses,
                category: game.category,
                difficulty: game.difficulty,
                wordToGuess: game.wordToGuess // Reveal word on forfeit
            }
        });

    } catch (error) {
        console.error("End Game Error:", error);
         if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid game session ID format' });
        }
        // Pass error to the central error handler
        next(error); // Use the passed 'next' function
    }
});


module.exports = router;