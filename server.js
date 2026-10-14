const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const grievanceRoutes = require('./routes/grievance.routes');

const app = express();

// 1. UPDATE: Use Render's port, or fallback to 3000 for local testing
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 2. UPDATE: Use Render's Environment Variable for MongoDB, or fallback to local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/egov_grievance';

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Connect our API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);

// SERVE FRONTEND (Only used if testing locally, Vercel handles the live frontend)
app.use(express.static(path.join(__dirname, '../')));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});