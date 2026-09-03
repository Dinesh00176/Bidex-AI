require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { seedDemoEnvironment } = require('../controllers/demoController');
const logger = require('../utils/logger');

const runSeed = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for CLI demo seed script');

    // Simulate express req/res
    const req = {};
    const res = {
      json: (data) => {
        console.log('\n========================================');
        console.log('✅ DEMO ENVIRONMENT SEEDED SUCCESSFULLY');
        console.log('========================================');
        console.log(`Demo User Email: demo@bidwise.ai`);
        console.log(`Demo Password:   demoPassword123!`);
        console.log(`Demo Tender ID:  ${data.tenderId}`);
        console.log('========================================\n');
        process.exit(0);
      }
    };
    const next = (err) => {
      logger.error('Error seeding demo', err);
      process.exit(1);
    };

    await seedDemoEnvironment(req, res, next);
  } catch (error) {
    logger.error('CLI Seed Failed', error);
    process.exit(1);
  }
};

runSeed();
