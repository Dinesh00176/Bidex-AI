const Tender = require('../models/Tender');
const Company = require('../models/Company');
const Analysis = require('../models/Analysis');
const { modelService } = require('../services/modelService');
const { matchRequirementsWithCompany } = require('../services/matchingService');
const { evaluateRisks } = require('../services/riskService');
const { computeBidDecision } = require('../services/decisionService');
const { generateHistoricalDataset } = require('../ml/demoDataset');
const logger = require('../utils/logger');

/**
 * @route   GET /api/ml/status
 * @desc    Get ML model health, active version, schema version, and training metrics
 * @access  Public
 */
const getMlStatus = async (req, res, next) => {
  try {
    const status = modelService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ml/predict
 * @desc    Predict tender bid win probability & generate explainable hybrid decision
 * @access  Private
 */
const predictTenderBid = async (req, res, next) => {
  try {
    const { tenderId, companyId } = req.body;

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'tenderId is required for ML prediction.'
      });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    let company;
    if (companyId) {
      company = await Company.findById(companyId);
    } else {
      company = await Company.findOne({ userId: req.user._id });
    }

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company capability profile not found.' });
    }

    // Load existing analysis if already processed, or run matching pipeline
    let analysis = await Analysis.findOne({ tenderId: tender._id });
    let requirements = analysis?.requirements || [];
    let matches = analysis?.matches || [];
    let risks = analysis?.risks || [];
    let decision = analysis?.decision;

    if (!analysis || requirements.length === 0) {
      // Run deterministic evaluation on tender extracted pages
      const { extractStructuredRequirements } = require('../services/extractionService');
      const ext = await extractStructuredRequirements(tender.extractedPages, {
        title: tender.title,
        organization: tender.organization,
        referenceNumber: tender.referenceNumber
      });
      requirements = ext.requirements || [];
      matches = matchRequirementsWithCompany(requirements, company);
      risks = evaluateRisks({ requirements, matches, tender, company });
      decision = computeBidDecision({ requirements, matches, risks });
    }

    // 1. Generate ML Prediction
    const mlPrediction = modelService.predictFromContext({
      tender,
      company,
      requirements,
      matches,
      risks
    });

    // 2. Enforce Hard Compliance Gating: ML cannot override mandatory failures
    const mandatoryFailures = decision?.hardFailures || matches.filter(m => m.mandatory && (m.status === 'CONFLICT' || m.status === 'MISSING' || m.status === 'FAIL')).map(m => m.reason);

    let finalRecommendation = decision?.recommendation || 'BID';
    if (mandatoryFailures.length >= 3) {
      finalRecommendation = 'NO-BID';
    } else if (mandatoryFailures.length === 2) {
      finalRecommendation = 'NO-BID';
    } else if (mandatoryFailures.length === 1) {
      finalRecommendation = 'REVIEW';
    }

    // 3. Structured Prediction Output
    const responsePayload = {
      success: true,
      ml: {
        available: mlPrediction.available,
        status: mlPrediction.status,
        probability: mlPrediction.probability,
        confidence: mlPrediction.confidencePercent,
        predictedOutcome: mlPrediction.predictedOutcome,
        modelVersion: mlPrediction.modelVersion,
        featureSchemaVersion: mlPrediction.featureSchemaVersion,
        disclaimer: 'This is a model estimate of historical win probability, not a guarantee of procurement award.'
      },
      compliance: {
        score: decision?.overallScore || 0,
        scoreBreakdown: decision?.scoreBreakdown,
        mandatoryFailures: mandatoryFailures.length,
        hardFailures: mandatoryFailures
      },
      risk: {
        level: risks.some(r => r.severity === 'CRITICAL') ? 'CRITICAL' : (risks.some(r => r.severity === 'HIGH') ? 'HIGH' : 'LOW'),
        criticalCount: risks.filter(r => r.severity === 'CRITICAL').length,
        totalRiskCount: risks.length
      },
      decision: {
        recommendation: finalRecommendation,
        decisionMode: mlPrediction.available ? 'HYBRID_AI_ML' : 'RULE_BASED_DECISION',
        summaryRationale: decision?.summaryRationale || ''
      },
      explanation: {
        topFactors: mlPrediction.topInfluencingFactors,
        positiveFactors: mlPrediction.positiveFactors,
        negativeFactors: mlPrediction.negativeFactors
      },
      featureSnapshot: mlPrediction.featureMap
    };

    res.json(responsePayload);
  } catch (error) {
    logger.error('[ML] predictTenderBid error:', error.message);
    next(error);
  }
};

/**
 * @route   POST /api/ml/train
 * @desc    Trigger supervised retraining of ML model
 * @access  Private (Admin / Lead)
 */
const trainMlModel = async (req, res, next) => {
  try {
    const { sampleCount = 500, randomSeed = 2026 } = req.body;
    logger.info(`[ML] Initiating model retraining via API (${sampleCount} samples, seed: ${randomSeed})`);

    const dataset = generateHistoricalDataset(sampleCount, randomSeed);
    const result = modelService.train(dataset, {
      modelVersion: 'bidexa-v1.0.0',
      minSamplesRequired: 100
    });

    res.json({
      success: true,
      status: result.status,
      metrics: result.testMetrics,
      generalization: result.generalizationCheck,
      metadata: result.model?.metadata
    });
  } catch (error) {
    logger.error('[ML] trainMlModel error:', error.message);
    next(error);
  }
};

module.exports = {
  getMlStatus,
  predictTenderBid,
  trainMlModel
};
