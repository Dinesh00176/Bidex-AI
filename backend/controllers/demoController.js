const User = require('../models/User');
const Company = require('../models/Company');
const Tender = require('../models/Tender');
const Analysis = require('../models/Analysis');
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');
const {
  DEMO_USER,
  DEMO_COMPANY,
  DEMO_TENDER_PAGES
} = require('../utils/seedData');
const { processTenderAsync } = require('./tenderController');
const { isConnected } = require('../config/db');
const logger = require('../utils/logger');

/**
 * @route   POST /api/demo/seed
 * @desc    Seeds or resets a complete interactive demo environment and runs real AI pipeline
 * @access  Public
 */
const seedDemoEnvironment = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Demo unavailable because the database is not connected.'
      });
    }

    logger.info('Initializing or refreshing live interactive demo environment');

    // 1. Create or retrieve demo user
    let user = await User.findOne({ email: DEMO_USER.email });
    if (!user) {
      user = await User.create({
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.password,
        role: DEMO_USER.role
      });
    }

    // 2. Create or reset demo company
    await Company.deleteMany({ userId: user._id });
    const company = await Company.create({
      userId: user._id,
      ...DEMO_COMPANY,
      documents: [
        {
          title: 'ISO 27001:2013 Certificate of Registration',
          docType: 'ISO Certificate',
          fileName: 'demo_iso27001_cert.pdf',
          originalName: 'Apex_ISO_27001_Certificate.pdf',
          filePath: 'uploads/demo_iso27001_cert.pdf',
          fileSize: 450000,
          extractedSummary: 'Accredited ISO/IEC 27001:2013 certification valid through December 2026 for secure cloud development and managed operations.',
          extractedKeyFacts: ['Valid ISO 27001 Certification Identified', 'Accredited by UKAS Management Systems'],
          uploadedAt: new Date()
        },
        {
          title: 'Audited Financial Statements 3-Year Summary',
          docType: 'Audit Report',
          fileName: 'demo_audit_statement.pdf',
          originalName: 'Apex_Audited_Financials_FY24.pdf',
          filePath: 'uploads/demo_audit_statement.pdf',
          fileSize: 1200000,
          extractedSummary: 'Chartered Accountant certified turnover showing ₹6.8 Cr (FY23), ₹7.5 Cr (FY24), ₹8.2 Cr (FY25) with positive net worth.',
          extractedKeyFacts: ['3-Year Average Turnover: ₹7.50 Crore', 'Positive net worth certified'],
          uploadedAt: new Date()
        }
      ]
    });

    user.companyId = company._id;
    await user.save();

    // 3. Create or reset demo tender
    await Tender.deleteMany({ userId: user._id });
    const tender = await Tender.create({
      userId: user._id,
      companyId: company._id,
      title: 'Smart City Integrated IoT Command & Control Platform [DEMO]',
      organization: 'Smart Urban Infrastructure Authority (SUIA)',
      referenceNumber: 'SUIA/2026/IOT-RFP-098',
      estimatedValue: 65000000,
      currency: 'INR',
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      location: 'Smart City Central Command Facility',
      status: 'processing',
      progress: 10,
      progressStep: 'Initializing Live AI Analysis with Gemini...',
      filePath: 'sample_documents/Smart_City_IoT_Tender_RFP_2026.pdf',
      originalName: 'Smart_City_IoT_Tender_RFP_2026.pdf',
      fileSize: 3450000,
      mimeType: 'application/pdf',
      pageCount: DEMO_TENDER_PAGES.length,
      extractedPages: DEMO_TENDER_PAGES,
      summary: 'Comprehensive RFP for deploying high-scale IoT edge ingestion, 99.9% HA platform SLA, real-time command dashboard, and 3-year operations SLA.',
      scopeOfWork: 'Design, supply, integrate, test and maintain the Centralized City Operations IoT Platform across 4 city zones with 10k edge nodes.'
    });

    // 4. Clear any old chat or analysis for this user
    await Analysis.deleteMany({ tenderId: tender._id });
    await Chat.deleteMany({ tenderId: tender._id });

    // 5. Kick off the REAL AI processing pipeline asynchronously
    processTenderAsync(tender._id, user._id).catch(err => {
      logger.error(`Live demo processing error for tender ${tender._id}:`, err.message);
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'bidwise_enterprise_secure_jwt_secret_key_2026_x99!',
      { expiresIn: '7d' }
    );

    logger.info(`Live demo environment initialized with Gemini pipeline for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Live demo environment initialized successfully. AI pipeline started.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        companyName: company.companyName
      },
      tenderId: tender._id,
      companyId: company._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { seedDemoEnvironment };

