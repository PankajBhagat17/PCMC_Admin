const Grievance = require('../models/Grievance');

// Smart Node.js Fallback Routing
const fallbackCategorize = (text) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('drain')) {
        return { department: 'Water Supply & Drainage', urgency: 'High' };
    }
    if (lower.includes('road') || lower.includes('pothole') || lower.includes('bridge')) {
        return { department: 'Public Works (PWD)', urgency: 'Medium' };
    }
    if (lower.includes('light') || lower.includes('electric') || lower.includes('wire') || lower.includes('power')) {
        return { department: 'Electrical Department', urgency: 'High' };
    }
    if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('dustbin')) {
        return { department: 'Solid Waste Management', urgency: 'Medium' };
    }
    if (lower.includes('dog') || lower.includes('animal') || lower.includes('mosquito') || lower.includes('health')) {
        return { department: 'Public Health', urgency: 'Medium' };
    }
    if (lower.includes('encroach') || lower.includes('illegal') || lower.includes('stall')) {
        return { department: 'Encroachment', urgency: 'Low' };
    }
    if (lower.includes('tree') || lower.includes('park') || lower.includes('garden') || lower.includes('branch')) {
        return { department: 'Parks & Gardens', urgency: 'Low' };
    }
    if (lower.includes('tax') || lower.includes('property') || lower.includes('bill')) {
        return { department: 'Property Tax', urgency: 'Low' };
    }
    
    return { department: 'General Administration', urgency: 'Low' };
};

// Create a new grievance
exports.createGrievance = async (req, res) => {
    try {
        const { location, rawText } = req.body;
        let finalDepartment = 'General Administration';
        let finalUrgency = 'Low';

        try {
            console.log("Attempting to reach Python AI Engine...");
            const aiUrl = 'https://pcmc-ai-engine.onrender.com/predict';
            
            const aiResponse = await fetch(aiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: rawText })
            });

            if (!aiResponse.ok) throw new Error(`AI Server returned status: ${aiResponse.status}`);
            
            const aiData = await aiResponse.json();
            finalDepartment = aiData.department || 'General Administration';
            finalUrgency = aiData.urgency || 'Low';
            console.log(`Successfully categorized via Python AI: ${finalDepartment}`);

        } catch (aiError) {
            console.log("AI Engine offline or timed out. Using keyword fallback.");
            const fallbackResult = fallbackCategorize(rawText);
            finalDepartment = fallbackResult.department;
            finalUrgency = fallbackResult.urgency;
        }

        // Save to MongoDB
        const newGrievance = new Grievance({
            location,
            rawText,
            department: finalDepartment,
            urgency: finalUrgency,
            status: 'New'
        });

        await newGrievance.save();
        res.status(201).json({ message: "Grievance submitted successfully", ticket: newGrievance });

    } catch (error) {
        console.error("Failed to create grievance:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all grievances
exports.getAllGrievances = async (req, res) => {
    try {
        const grievances = await Grievance.find().sort({ createdAt: -1 });
        res.json(grievances);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching grievances" });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updatedGrievance = await Grievance.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        
        if (!updatedGrievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        
        res.json(updatedGrievance);
    } catch (error) {
        res.status(500).json({ message: "Error updating status" });
    }
};