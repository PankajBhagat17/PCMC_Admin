const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Look for the token in the headers
        const token = req.header('Authorization').replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied.' });
        }

        // Verify the token using the same secret key
        const decoded = jwt.verify(token, 'pcmc_super_secret_key');
        
        // Attach the user's ID to the request so the controller can use it
        req.body.userId = decoded.userId;
        
        next(); // Proceed to the controller
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid or expired.' });
    }
};
