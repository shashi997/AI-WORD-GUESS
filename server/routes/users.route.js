const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path if necessary
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth'); // Import auth middleware


// --- Helper Function to Generate JWT ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};


// --- Register User ---
// POST /api/users/register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    try {
        // Check if user already exists (by email or username)
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }

        // Create new user (password hashing is handled by the pre-save hook in the model)
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            // Respond with user info (excluding password) and a token
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id), // Generate and send token
                message: 'User registered successfully!'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Registration Error:", error);
        // Handle potential validation errors from Mongoose
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
})

// --- Login User ---
// POST /api/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists and password matches
        if (user && (await user.comparePassword(password))) {
            // Respond with user info (excluding password) and a token
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id), // Generate and send token
                message: 'User logged in successfully!'
            });
        } else {
            // Generic message for security (don't reveal if email exists or password was wrong)
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
})


// --- Get User Profile (Example Protected Route) ---
// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
    // req.user is attached by the 'protect' middleware
    try {
        // Fetch fresh user data in case it changed since token was issued
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

module.exports = router;
