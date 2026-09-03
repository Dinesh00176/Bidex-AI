const fs = require('fs');
const Tender = require('../models/Tender');
const Company = require('../models/Company');
const Analysis = require('../models/Analysis');
const Chat = require('../models/Chat');
const { extractPdfPages } = require('../services/pdfService');
const { extractStructuredRequirements } = require('../services/extractionService');
const { matchRequirementsWithCompany } = require('../services/matchingService');
const { evaluateRisks } = require('../services/riskService');
const { computeBidDecision } = require('../services/decisionService');
const { modelService } = require('../services/modelService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/tenders
 * @desc    Get all tenders for authenticated user with search/filter/pagination
 * @access  Private
 */
const getTenders = async (req, res, next) => {
  try {
    const { search, status, decision, sort = '-createdAt' } = req.query;

    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    let tenders = await Tender.find(query).sort(sort).lean();

    // Attach analysis summary if available
    const tenderIds = tenders.map(t => t._id);
    const analyses = await Analysis.find({ tenderId: { $in: tenderIds } }).lean();
    const analysisMap = {};
    analyses.forEach(a => {
      analysisMap[a.tenderId.toString()] = a;
    });

    let results = tenders.map(tender => {
      const analysis = analysisMap[tender._id.toString()];
      return {
        ...tender,
        analysis: analysis ? {
          recommendation: analysis.decision?.recommendation,
          overallScore: analysis.decision?.overallScore,
          criticalRisksCount: (analysis.risks || []).filter(r => r.severity === 'CRITICAL').length,
          highRisksCount: (analysis.risks || []).filter(r => r.severity === 'HIGH').length,
          requirementsCount: (analysis.requirements || []).length
        } : null
      };
    });

    // Filter by decision if requested
    if (decision) {
      const dec = decision.toUpperCase();
      results = results.filter(t => {
        if (!t.analysis || !t.analysis.recommendation) return false;
        const rec = t.analysis.recommendation.toUpperCase();
        if (dec === 'REVIEW') {
          return rec === 'REVIEW' || rec === 'NEEDS REVIEW' || rec === 'NEEDS_REVIEW';
        }
        return rec === dec;
      });
    }

    res.json({
      success: true,
      count: results.length,
      tenders: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tenders/upload
 * @desc    Upload a tender PDF document and extract initial page text
 * @access  Private
 */
const uploadTender = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid PDF tender document to upload.'
      });
    }

    logger.info(`Processing uploaded file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Extract pages from PDF
    let pdfData;
    try {
      pdfData = await extractPdfPages(req.file.path);
    } catch (pdfError) {
      logger.error('Failed to parse uploaded PDF', pdfError.message);

      // Clean up uploaded file from disk if extraction fails
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          logger.warn('Failed to clean up rejected PDF file', unlinkErr.message);
        }
      }

      if (pdfError.code === 'SCANNED_IMAGE_PDF') {
        return res.status(400).json({
          success: false,
          code: 'SCANNED_IMAGE_PDF',
          message: 'This PDF appears to contain scanned or image-only pages and does not contain sufficient machine-readable text for analysis.'
        });
      }

      if (pdfError.code === 'INVALID_PDF_FORMAT') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PDF_FORMAT',
          message: 'Invalid file format. The file is not a valid standard PDF document.'
        });
      }

      if (pdfError.code === 'CORRUPTED_PDF') {
        return res.status(400).json({
          success: false,
          code: 'CORRUPTED_PDF',
          message: 'Invalid or corrupted PDF document. Please ensure it is a valid, readable PDF file.'
        });
      }

      return res.status(400).json({
        success: false,
        message: pdfError.message || 'Unable to extract text from the uploaded PDF document.'
      });
    }

    // Default title from filename if not provided
    const baseTitle = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const tender = await Tender.create({
      userId: req.user._id,
      companyId: req.user.companyId,
      title: baseTitle,
      organization: req.body.organization || 'Procurement Authority',
      referenceNumber: req.body.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      deadline: req.body.deadline ? new Date(req.body.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: (req.body.autoProcess === 'true' || req.body.autoProcess === true) ? 'processing' : 'uploaded',
      progress: (req.body.autoProcess === 'true' || req.body.autoProcess === true) ? 10 : 0,
      progressStep: (req.body.autoProcess === 'true' || req.body.autoProcess === true) ? 'Initializing AI analysis...' : 'Uploaded',
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      pageCount: pdfData.pageCount,
      extractedPages: pdfData.extractedPages,
      summary: ''
    });

    logger.info(`Tender created in DB with ID: ${tender._id} [Status: ${tender.status}]`);

    // If autoProcess query is true, trigger background processing
    if (req.body.autoProcess === 'true' || req.body.autoProcess === true) {
      processTenderAsync(tender._id, req.user._id).catch(err => {
        logger.error(`Async tender processing failed for ${tender._id}:`, err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tender PDF uploaded and parsed successfully',
      tender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id
 * @desc    Get single tender details
 * @access  Private
 */
const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const analysis = await Analysis.findOne({ tenderId: tender._id });

    res.json({
      success: true,
      tender,
      hasAnalysis: !!analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tenders/:id
 * @desc    Delete a tender and its related analysis/chat
 * @access  Private
 */
const deleteTender = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Remove physical file
    if (fs.existsSync(tender.filePath)) {
      try {
        fs.unlinkSync(tender.filePath);
      } catch (err) {
        logger.warn('Could not delete physical tender file', err.message);
      }
    }

    // Remove DB records
    await Promise.all([
      Tender.findByIdAndDelete(tender._id),
      Analysis.deleteMany({ tenderId: tender._id }),
      Chat.deleteMany({ tenderId: tender._id })
    ]);

    logger.info(`Tender and associated analysis deleted: ${tender._id}`);

    res.json({
      success: true,
      message: 'Tender and associated analysis deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Full Pipeline Execution (Extract -> Match -> Risk -> Decision -> Store)
 */
const processTenderAsync = async (tenderId, userId) => {
  const tender = await Tender.findById(tenderId);
  if (!tender) return;

  // Retrieve user company profile (or proceed in tender-only mode if no profile exists yet)
  const company = (await Company.findOne({ userId })) || (await Company.findOne({ userId: tender.userId })) || null;
  const activeCompany = company || {
    companyName: '',
    industry: '',
    yearsExperience: 0,
    annualTurnover: 0,
    employeeCount: 0,
    certifications: [],
    technicalSkills: [],
    services: [],
    documents: []
  };

  try {
    // Step 1: Extracting Requirements
    tender.status = 'processing';
    tender.progress = 20;
    tender.progressStep = 'Extracting Tender Requirements with Gemini AI';
    tender.errorMessage = '';
    await tender.save();

    logger.info(`Starting requirement extraction for tender ${tenderId} (${tender.extractedPages ? tender.extractedPages.length : 0} pages)`);
    const extractionResult = await extractStructuredRequirements(tender.extractedPages, {
      title: tender.title,
      organization: tender.organization,
      referenceNumber: tender.referenceNumber
    });

    const { tenderOverview, requirements } = extractionResult;

    if (!requirements || requirements.length === 0) {
      throw new Error('No structured requirements could be extracted from this document.');
    }

    // Step 2: Update tender metadata and normalize
    tender.progress = 45;
    tender.progressStep = 'Validating and Normalizing Requirement Categories';
    await tender.save();

    if (tenderOverview) {
      if (tenderOverview.title && !tender.title) tender.title = tenderOverview.title;
      if (tenderOverview.organization) tender.organization = tenderOverview.organization;
      if (tenderOverview.referenceNumber) tender.referenceNumber = tenderOverview.referenceNumber;
      if (tenderOverview.estimatedValue) tender.estimatedValue = tenderOverview.estimatedValue;
      if (tenderOverview.deadline && !isNaN(new Date(tenderOverview.deadline).getTime())) {
        tender.deadline = new Date(tenderOverview.deadline);
      }
      if (tenderOverview.summary) tender.summary = tenderOverview.summary;
      if (tenderOverview.scopeOfWork) tender.scopeOfWork = tenderOverview.scopeOfWork;
      if (tenderOverview.location) tender.location = tenderOverview.location;
    }

    // Step 3: Matching Requirements against Company Capabilities
    tender.progress = 65;
    tender.progressStep = 'Comparing Requirements with Company Capability Matrix';
    await tender.save();

    const matches = matchRequirementsWithCompany(requirements, activeCompany);

    // Step 4: Risk Evaluation
    tender.progress = 80;
    tender.progressStep = 'Analyzing Procurement Risks & Contractual Clauses';
    await tender.save();

    const risks = evaluateRisks({
      requirements,
      matches,
      tender,
      company: activeCompany
    });

    // Step 5: Decision Generation
    tender.progress = 90;
    tender.progressStep = 'Calculating Weighted Bid Recommendation & ML Signal';
    await tender.save();

    const decision = computeBidDecision({
      requirements,
      matches,
      risks
    });

    // Run ML Prediction (Supplementary Signal)
    let mlPrediction = {
      status: 'NOT_TRAINED',
      available: false,
      probability: null,
      confidencePercent: null,
      predictedOutcome: null,
      topInfluencingFactors: [],
      message: 'ML model not trained — using AI + rules'
    };

    try {
      mlPrediction = modelService.predictFromContext({
        tender,
        company: activeCompany,
        requirements,
        matches,
        risks
      });
    } catch (mlErr) {
      logger.warn('ML inference signal generation bypassed', mlErr.message);
    }

    decision.mlPrediction = mlPrediction;

    // Step 6: Persist Analysis Atomically
    tender.progress = 95;
    tender.progressStep = 'Finalizing and Persisting Analysis Workspace';
    await tender.save();

    const isMock = process.env.AI_MODE === 'mock' || !process.env.GEMINI_API_KEY;
    await Analysis.findOneAndUpdate(
      { tenderId: tender._id },
      {
        tenderId: tender._id,
        companyId: company ? company._id : null,
        userId: tender.userId,
        requirements,
        matches,
        risks,
        decision,
        mlPrediction,
        metadata: {
          provider: extractionResult.extractionProvider === 'fallback' ? 'Deterministic Fallback' : (isMock ? 'mock' : 'Google Gemini'),
          extractionProvider: extractionResult.extractionProvider || 'gemini',
          extractionWarning: extractionResult.extractionWarning || null,
          modelUsed: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
          aiGenerated: extractionResult.extractionProvider !== 'fallback' && !isMock,
          analyzedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Step 7: Mark tender completed ONLY AFTER Analysis is saved to DB
    tender.status = 'completed';
    tender.progress = 100;
    tender.progressStep = 'Completed';
    tender.errorMessage = '';
    await tender.save();

    logger.info(`Tender ${tender._id} processing completed successfully. Recommendation: ${decision.recommendation}`);
  } catch (error) {
    logger.error(`Error in tender processing pipeline for ${tender._id}:`, error.message);
    tender.status = 'failed';
    tender.progress = 0;
    tender.progressStep = 'Failed';
    tender.errorMessage = error.message || 'An error occurred during AI analysis pipeline.';
    await tender.save();
  }
};

/**
 * @route   POST /api/tenders/:id/process
 * @desc    Start or re-run full AI analysis on tender
 * @access  Private
 */
const processTender = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.status === 'processing' && tender.progress > 0 && tender.progress < 100) {
      return res.status(400).json({
        success: false,
        message: 'Analysis is already in progress for this tender.'
      });
    }

    if (!tender.extractedPages || tender.extractedPages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text pages found in this document to analyze.'
      });
    }

    // Set processing state immediately before kicking off async pipeline
    tender.status = 'processing';
    tender.progress = 10;
    tender.progressStep = 'Initializing AI Analysis...';
    tender.errorMessage = '';
    await tender.save();

    // Trigger async processing
    processTenderAsync(tender._id, req.user._id).catch(err => {
      logger.error(`Error in trigger processTenderAsync for ${tender._id}:`, err.message);
    });

    res.json({
      success: true,
      message: 'Tender analysis started in background.',
      status: 'processing'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/status
 * @desc    Check processing progress
 * @access  Private
 */
const getTenderStatus = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id).select('status progress progressStep errorMessage');
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    res.json({
      success: true,
      status: tender.status,
      progress: tender.progress,
      progressStep: tender.progressStep,
      errorMessage: tender.errorMessage
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTenders,
  uploadTender,
  getTenderById,
  deleteTender,
  processTender,
  getTenderStatus,
  processTenderAsync
};
