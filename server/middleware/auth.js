// e:\placement\Zoological Drawdown\AI Word Guess\server\middleware\auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if necessary

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (select -password to exclude password)
            // Attach user object to the request
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                // Handle case where user associated with token no longer exists
                 return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
