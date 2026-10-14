const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
    citizenId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    rawText: { 
        type: String, 
        required: true 
    },
    department: { 
        type: String, 
        required: true 
    },
    urgency: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Critical'], 
        default: 'Medium' 
    },
    status: { 
        type: String, 
        enum: ['New', 'Pending', 'In-Progress', 'Resolved', 'Reopened'], 
        default: 'New' 
    },
    location: { 
        type: String,
        required: true
    },
    // NEW FIELDS FOR GPS
    latitude: { 
        type: Number 
    },
    longitude: { 
        type: Number 
    },
    feedbackVerification: { 
        type: String,
        enum: ['Pending', 'Satisfied', 'Unsatisfied'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Grievance', grievanceSchema);