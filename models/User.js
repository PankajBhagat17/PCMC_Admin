const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, 
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin', 'nodal_officer'], default: 'citizen' },
    address: {
        flat: { type: String, required: true },
        street: { type: String, required: true },
        landmark: { type: String },
        pincode: { type: String, required: true },
        ward: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);