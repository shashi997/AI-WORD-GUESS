require('dotenv').config(); 
const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express()
const PORT = process.env.PORT || 8080; // Use port from .env or default to 8080
const GEMINI_API_KEY = process.env.GEMINI_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_KEY not found in .env file.");
    process.exit(1); // Exit if the API key is missing
}
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI not found in .env file.");
    process.exit(1); // Exit if the MongoDB URI is missing
}
if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET not found in .env file. Using a default or potentially insecure setup.");
    // Consider exiting if JWT is critical and not set: process.exit(1);
}


// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing (allow requests from your frontend)
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Middleware to parse URL-encoded bodies


// --- Initialize Google Gemini AI ---
let genAI;
let model;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use a valid and available model name. "gemini-1.5-flash" is a common choice.
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    console.log("Google Generative AI initialized successfully.");
    // You could attach the model to app.locals if needed by multiple routes/middleware
    app.locals.geminiModel = model;
} catch (error) {
    console.error("FATAL ERROR: Failed to initialize Google Generative AI:", error);
    process.exit(1); // Exit if AI client fails to initialize
}


app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the AI Word Guess API!' });
})

app.use('/api/users', require('./routes/users.route'))
app.use('/api/games', require('./routes/games.route'))
app.use('/api/ai', require('./routes/clues.route'))

// --- Basic Error Handling Middleware (Example) ---
// Place this after your routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB successfully!');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
.catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process with failure
})
