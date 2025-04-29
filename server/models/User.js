const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // Ensure usernames are unique
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'] // Basic email validation
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'] // Enforce minimum password length
    },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    // Consider calculating average guesses on demand or updating differently
    // averageGuesses: { type: Number, default: 0 },
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt


// --- Password Hashing Middleware ---
// Hash password before saving a new user
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash password
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware
    }
});


// --- Password Comparison Method ---
// Method to compare candidate password with the hashed password in the database
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
