const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      // Local development
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      // Specific production frontend
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow any vercel.app subdomain (covers preview & production deployments)
    const isVercel = origin.endsWith('.vercel.app');

    if (allowed.includes(origin) || isVercel) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/assets',      require('./routes/assets'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/logs',        require('./routes/logs'));
app.use('/api/asset-types', require('./routes/assetTypes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Examedia AMS - HRPB' }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
