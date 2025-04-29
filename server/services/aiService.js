const { GoogleGenerativeAI } = require('@google/generative-ai'); // Keep this in case you initialize here later

/**
 * Generates a clue for the word guessing game using Google Gemini.
 *
 * @param {object} model - The initialized Google Gemini Generative Model instance.
 * @param {string} wordToGuess - The hidden word.
 * @param {string} category - The selected category (e.g., 'tech', 'animals').
 * @param {string} difficulty - The selected difficulty ('easy', 'medium', 'hard').
 * @param {string} wordDisplay - The current masked display of the word (e.g., "_ A _ A").
 * @param {string[]} existingClues - An array of clues already given.
 * @param {string[]} guesses - An array of letters/words already guessed.
 * @param {number} incorrectGuessesCount - Number of incorrect guesses made.
 * @param {number} maxIncorrectGuesses - Maximum allowed incorrect guesses.
 * @returns {Promise<string>} - A promise that resolves with the generated clue string.
 * @throws {Error} - Throws an error if the AI fails to generate a clue.
 */


const generateWord = async (model, category, difficulty) => {
    if (!model) {
        throw new Error("Gemini model not provided to generateWord service.");
    }

    let wordLengthHint = '';
    switch (difficulty) {
        case 'easy':
            wordLengthHint = 'Suggest a relatively common word, perhaps 5-8 letters long.';
            break;
        case 'medium':
            wordLengthHint = 'Suggest a moderately common word, perhaps 6-10 letters long.';
            break;
        case 'hard':
            wordLengthHint = 'Suggest a less common or slightly trickier word, perhaps 7-12 letters long, or even a short two-word phrase if appropriate for the category.';
            break;
        default:
            wordLengthHint = 'Suggest a word suitable for a word guessing game.';
    }

    const prompt = `
You are an AI for a word guessing game.
Your task is to select *one* suitable word or a short common phrase (max 2 words) for the player to guess.

Rules:
- The word MUST belong to the category: "${category}". If the category is "random", pick from any common knowledge category. If the category is "interesting", pick an unusual but guessable word.
- Consider the difficulty level: "${difficulty}". ${wordLengthHint}
- The word should be in English.
- Avoid proper nouns unless the category is 'places' or similar.
- Do NOT include punctuation or numbers.
- Respond with ONLY the chosen word or phrase in lowercase. Do not add any explanation or surrounding text.

Category: ${category}
Difficulty: ${difficulty}

Chosen word or phrase:`;

    try {
        console.log("--- Sending Prompt to Gemini (Generate Word) ---");
        console.log(`Category: ${category}, Difficulty: ${difficulty}`);
        // console.log(prompt); // Keep prompt logging optional for brevity
        console.log("---------------------------------------------");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const word = response.text().trim().toLowerCase();

        console.log("--- Received Word from Gemini ---");
        console.log(word);
        console.log("------------------------------");

        if (!word || word.length < 3) { // Basic validation
            throw new Error("Gemini returned an invalid or too short word.");
        }
        // Add more validation if needed (e.g., check for unwanted characters)

        return word;

    } catch (error) {
        console.error(`Error generating word from Gemini (Category: ${category}, Difficulty: ${difficulty}):`, error);
        throw new Error(`Failed to generate a word for category "${category}". Please try again.`);
    }
};


/**
 * Generates a clue for the word guessing game using Google Gemini.
*/
const generateClue = async (model, wordToGuess, wordDisplay, existingClues, guesses, incorrectGuessesCount, maxIncorrectGuesses) => {
    if (!model) {
        throw new Error("Gemini model not provided to generateClue service.");
    }

    const attemptsLeft = maxIncorrectGuesses - incorrectGuessesCount;
    const clueNumber = existingClues.length + 1;
    const incorrectGuessesString = guesses.filter(g => !wordToGuess.toLowerCase().includes(g)).join(', ') || 'None';
    const correctGuessesString = guesses.filter(g => g.length === 1 && wordToGuess.toLowerCase().includes(g)).join(', ') || 'None';


    // Construct the prompt for Gemini
    let prompt = `
You are a helpful AI assistant for a word guessing game (like Hangman).
The player is trying to guess a word.

Game State:
- Hidden Word Length: ${wordToGuess.length} letters
- Current Display: ${wordDisplay}
- Correct Guesses So Far: ${correctGuessesString}
- Incorrect Guesses So Far: ${incorrectGuessesString}
- Attempts Left: ${attemptsLeft} out of ${maxIncorrectGuesses}
- Clues Already Given: ${existingClues.length > 0 ? existingClues.map((c, i) => `\n  ${i + 1}. ${c}`).join('') : 'None'}

Your Task:
Provide the *next* helpful clue (Clue #${clueNumber}) for the hidden word: "${wordToGuess}".

Instructions:
- Make the clue progressively more helpful based on the clue number.
- Clue 1 should be general (e.g., category, broad concept).
- Subsequent clues should become more specific but *never* reveal the word directly.
- Do *not* reveal specific unguessed letters directly (e.g., don't say "It contains the letter 'E'").
- Consider the letters already guessed (correctly and incorrectly).
- Keep the clue concise (1-2 sentences).
- Do not repeat previous clues.
- Focus on hinting towards the meaning, context, or properties of the word "${wordToGuess}".
`;

    // Add specific instructions based on clue number for better progression
    if (clueNumber === 1) {
        prompt += "\nThis is the first clue, so provide a general hint (like its category or a common association).";
    } else if (clueNumber === 2) {
        prompt += "\nThis is the second clue. Provide a slightly more specific hint than the first, perhaps related to its use or a characteristic.";
    } else {
        prompt += `\nThis is clue number ${clueNumber}. Provide an increasingly specific hint, building on previous clues if possible, without giving away the word.`;
    }

    prompt += "\nGenerate only the clue text itself.";


    try {
        console.log("--- Sending Prompt to Gemini ---");
        console.log(prompt); // Log the prompt for debugging
        console.log("-----------------------------");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const newClue = response.text().trim();

        console.log("--- Received Clue from Gemini ---");
        console.log(newClue);
        console.log("------------------------------");

        if (!newClue) {
            throw new Error("Gemini returned an empty clue.");
        }

        return newClue;

    } catch (error) {
        console.error("Error generating clue from Gemini:", error);
        // Rethrow or return a specific error message
        throw new Error("Failed to generate AI clue. Please try again later.");
    }
};



/**
 * Generates interesting information about a given word using Google Gemini.
 *
 * @param {object} model - The initialized Google Gemini Generative Model instance.
 * @param {string} word - The word to get information about.
 * @returns {Promise<string>} - A promise that resolves with the generated information string.
 * @throws {Error} - Throws an error if the AI fails to generate information.
 */
const generateWordInfo = async (model, word) => {
    if (!model) {
        throw new Error("Gemini model not provided to generateWordInfo service.");
    }

    const prompt = `
You are an AI assistant providing interesting facts.
The user has just finished a word guessing game where the word was "${word}".

Your Task:
Provide 1-3 concise and interesting facts, definitions, or context about the word "${word}".
Keep it engaging and suitable for someone who just interacted with the word in a game.
Format the output clearly. Start directly with the information. Do not add introductory phrases like "Here are some facts...".
If it's a phrase, explain the phrase or its origin.

Word: ${word}

Information:`;

    try {
        console.log(`--- Sending Prompt to Gemini (Generate Word Info for: ${word}) ---`);
        // console.log(prompt);
        console.log("---------------------------------------------------------");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const info = response.text().trim();

        console.log("--- Received Word Info from Gemini ---");
        console.log(info);
        console.log("-----------------------------------");

        if (!info) {
            throw new Error("Gemini returned empty information for the word.");
        }

        return info;

    } catch (error) {
        console.error(`Error generating word info from Gemini for "${word}":`, error);
        throw new Error(`Failed to generate information for the word "${word}".`);
    }
};


module.exports = {
    generateWord,
    generateClue,
    generateWordInfo
};