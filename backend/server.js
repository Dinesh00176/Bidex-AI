const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB, isConnected } = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const chatRoutes = require('./routes/chatRoutes');
const demoRoutes = require('./routes/demoRoutes');
const mlRoutes = require('./routes/mlRoutes');
const { modelService } = require('./services/modelService');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or allowed frontend origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from the specified Origin.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use('/api/', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mlStatus = modelService.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BidWise AI Enterprise Backend',
    databaseConnected: isConnected(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    modelConfigured: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    mlStatus: {
      available: mlStatus.available,
      modelVersion: mlStatus.modelVersion,
      featureSchemaVersion: mlStatus.featureSchemaVersion
    },
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/tenders/:id/analysis', analysisRoutes);
app.use('/api/tenders/:id/chat', chatRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/ml', mlRoutes);

// 404 and Global Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server = app.listen(PORT, () => {
      logger.info(`BidWise AI Backend running on port ${PORT} [Environment: ${process.env.NODE_ENV || 'development'}]`);
    });
  });
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }
});

module.exports = app;
