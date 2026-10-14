const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registration Logic
exports.register = async (req, res) => {
    try {
        const { fullName, email, mobile, address, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ mobile }, { email }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this mobile number or email.' });
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save the new user to the database
        user = new User({
            name: fullName,
            email,
            mobile,
            address,
            password: hashedPassword
        });
        await user.save();

        // Create a secure token
        const token = jwt.sign({ userId: user._id, role: user.role }, 'pcmc_super_secret_key', { expiresIn: '7d' });

        res.status(201).json({ 
            token, 
            user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login Logic
exports.login = async (req, res) => {
    try {
        const { mobile, password } = req.body;

        // Find user by mobile number
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(400).json({ message: 'Invalid mobile number or password.' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid mobile number or password.' });
        }

        // Create a secure token
        const token = jwt.sign({ userId: user._id, role: user.role }, 'pcmc_super_secret_key', { expiresIn: '7d' });

        res.status(200).json({ 
            token, 
            user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};