const Grievance = require('../models/Grievance');
const User = require('../models/User');

exports.submitGrievance = async (req, res) => {
    try {
        // Now accepting latitude and longitude from the frontend
        const { rawText, userId, latitude, longitude } = req.body;

        // 1. Fetch citizen's profile for the fallback location
        const citizen = await User.findById(userId);
        if (!citizen) {
            return res.status(404).json({ message: "Citizen profile not found." });
        }
        
        let finalLocation = `${citizen.address.flat}, ${citizen.address.street}, Ward ${citizen.address.ward}`;

        // 2. If live GPS coordinates were sent, convert them to a readable street address
        if (latitude && longitude) {
            try {
                const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    // Use the live street address, or raw coordinates if the street name isn't available
                    finalLocation = geoData.display_name || `Live GPS: ${latitude}, ${longitude}`;
                } else {
                    finalLocation = `Live GPS: ${latitude}, ${longitude}`;
                }
            } catch (geoError) {
                console.error("Geocoding API failed, falling back to raw coordinates.");
                finalLocation = `Live GPS: ${latitude}, ${longitude}`;
            }
        }

        // 3. Send text to the Python AI Microservice!
        let aiResult = { department: "General Administration", urgency: "Medium" }; 
        
        try {
            const aiResponse = await fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: rawText })
            });
            
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                aiResult.department = aiData.department;
                aiResult.urgency = aiData.urgency;
                console.log("🤖 AI Engine Routing:", aiData);
            }
        } catch (error) {
            console.error("⚠️ Python AI Engine is offline. Falling back to default routing.");
        }

        // 4. Save the routed grievance to MongoDB with the correct location string
        const newGrievance = new Grievance({
            citizenId: userId,
            rawText: rawText,
            department: aiResult.department,
            urgency: aiResult.urgency,
            location: finalLocation,
            latitude: latitude || null,
            longitude: longitude || null,
            status: 'New'
        });

        await newGrievance.save();

        res.status(201).json({
            message: "Grievance processed and routed successfully.",
            grievance: newGrievance
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during submission." });
    }
};

// Admin Route: Get all grievances
exports.getAllGrievances = async (req, res) => {
    try {
        const grievances = await Grievance.find()
            .populate('citizenId', 'name mobile')
            .sort({ createdAt: -1 });
        res.status(200).json(grievances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching grievances." });
    }
};

// Get a single grievance by its ID
exports.getGrievanceById = async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) {
            return res.status(404).json({ message: "Ticket not found." });
        }
        res.status(200).json(grievance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Invalid Ticket ID or Server Error." });
    }
};

// Public Route: Get live dashboard stats
exports.getStats = async (req, res) => {
    try {
        const total = await Grievance.countDocuments();
        
        // Count grievances by status
        const statusData = await Grievance.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Count grievances by department
        const deptData = await Grievance.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }, {$sort: { count: -1 } } // Sort highest to lowest
        ]);

        res.status(200).json({ 
            total, 
            statusCounts: statusData, 
            deptCounts: deptData 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching stats." });
    }
};

// Handle the Accountability Loop Feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { isSatisfied } = req.body;
        const grievance = await Grievance.findById(req.params.id);
        
        if (!grievance) {
            return res.status(404).json({ message: "Ticket not found." });
        }

        if (isSatisfied) {
            grievance.feedbackVerification = 'Satisfied';
        } else {
            grievance.feedbackVerification = 'Unsatisfied';
            grievance.status = 'Reopened'; // Escalation protocol
        }
        
        await grievance.save();
        res.status(200).json({ message: "Feedback processed.", grievance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error processing feedback." });
    }
};

// Admin Route: Update ticket status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const grievance = await Grievance.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        
        if (!grievance) {
            return res.status(404).json({ message: "Ticket not found." });
        }
        
        res.status(200).json({ message: "Status updated successfully.", grievance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error updating status." });
    }
};