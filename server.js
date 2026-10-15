const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const grievanceRoutes = require('./routes/grievance.routes');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
    // FIXED: Matched the exact URL from your Vercel deployment
    origin: ['https://frontend-tnkh.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/egov_grievance';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);

// Fallback route for stats if your frontend is calling /api/stats directly
app.get('/api/stats', async (req, res) => {
    try {
        const Grievance = require('./models/Grievance');
        const total = await Grievance.countDocuments();
        const deptCounts = await Grievance.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
        const statusCounts = await Grievance.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        res.json({ total, deptCounts, statusCounts });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

app.use(express.static(path.join(__dirname, '../')));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});