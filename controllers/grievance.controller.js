const Grievance = require('../models/Grievance');

// Strict list of exact frontend departments
const validDepartments = [
    'Water Supply & Drainage',
    'Public Works (PWD)',
    'Electrical Department',
    'Solid Waste Management',
    'Public Health',
    'Encroachment',
    'Parks & Gardens',
    'Property Tax'
];

// Smart Node.js Fallback Routing
const fallbackCategorize = (text) => {
    const lower = (text || "").toLowerCase();
    
    if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('drain')) return { department: 'Water Supply & Drainage', urgency: 'High' };
    if (lower.includes('road') || lower.includes('pothole') || lower.includes('bridge')) return { department: 'Public Works (PWD)', urgency: 'Medium' };
    if (lower.includes('light') || lower.includes('electric') || lower.includes('wire') || lower.includes('power')) return { department: 'Electrical Department', urgency: 'High' };
    if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('dustbin') || lower.includes('dust')) return { department: 'Solid Waste Management', urgency: 'Medium' };
    if (lower.includes('dog') || lower.includes('animal') || lower.includes('mosquito') || lower.includes('health')) return { department: 'Public Health', urgency: 'Medium' };
    if (lower.includes('encroach') || lower.includes('illegal') || lower.includes('stall')) return { department: 'Encroachment', urgency: 'Low' };
    if (lower.includes('tree') || lower.includes('park') || lower.includes('garden') || lower.includes('branch')) return { department: 'Parks & Gardens', urgency: 'Low' };
    if (lower.includes('tax') || lower.includes('property') || lower.includes('bill')) return { department: 'Property Tax', urgency: 'Low' };
    
    return { department: 'General Administration', urgency: 'Low' };
};

// Create a new grievance
exports.createGrievance = async (req, res) => {
    try {
        const { citizenId, location, rawText, description, issue, text, latitude, longitude } = req.body;
        const actualText = rawText || description || issue || text || "";
        
        let finalDepartment = 'General Administration';
        let finalUrgency = 'Low';

        try {
            console.log("Attempting to reach Python AI Engine with text:", actualText);
            const aiUrl = 'https://pcmc-ai-engine.onrender.com/predict';
            
            const aiResponse = await fetch(aiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: actualText })
            });

            if (!aiResponse.ok) throw new Error(`AI Server returned status: ${aiResponse.status}`);
            
            const aiData = await aiResponse.json();
            console.log("Raw AI Response:", aiData); 
            
            let tempDept = aiData.department || aiData.prediction || aiData.category || null;

            // BULLETPROOF CHECK: If AI is missing, unsure, or returns a weird name, force the fallback
            if (!tempDept || !validDepartments.includes(tempDept) || tempDept === 'General Administration') {
                console.log("AI returned unsure/invalid category. Forcing keyword fallback...");
                const fallbackResult = fallbackCategorize(actualText);
                finalDepartment = fallbackResult.department;
                finalUrgency = fallbackResult.urgency;
            } else {
                finalDepartment = tempDept;
                finalUrgency = aiData.urgency || 'Low';
                console.log(`Successfully categorized via Python AI: ${finalDepartment}`);
            }

        } catch (aiError) {
            console.log("AI Engine offline or timed out. Using keyword fallback.");
            const fallbackResult = fallbackCategorize(actualText);
            finalDepartment = fallbackResult.department;
            finalUrgency = fallbackResult.urgency;
        }

        const newGrievance = new Grievance({
            citizenId: citizenId || "60d5ec49f1b2c8b1f8e4e1a1",
            location,
            latitude,
            longitude,
            rawText: actualText,
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
        
        const updatedGrievance = await Grievance.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedGrievance) return res.status(404).json({ message: "Grievance not found" });
        res.json(updatedGrievance);
    } catch (error) {
        res.status(500).json({ message: "Error updating status" });
    }
};