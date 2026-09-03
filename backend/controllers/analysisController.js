const Analysis = require('../models/Analysis');
const Tender = require('../models/Tender');
const Company = require('../models/Company');
const { generateExecutiveReport } = require('../services/reportService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/tenders/:id/analysis
 * @desc    Get complete analysis document
 * @access  Private
 */
const getFullAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found for this tender. Please click "Process Tender" to run the AI engine.'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/requirements
 * @desc    Get extracted requirements
 * @access  Private
 */
const getRequirements = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Requirements not yet extracted.' });
    }

    res.json({
      success: true,
      count: analysis.requirements.length,
      requirements: analysis.requirements
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/matching
 * @desc    Get requirement vs capability match matrix
 * @access  Private
 */
const getMatching = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Matching analysis not found.' });
    }

    res.json({
      success: true,
      count: analysis.matches.length,
      matches: analysis.matches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/risks
 * @desc    Get categorized risk findings
 * @access  Private
 */
const getRisks = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Risk analysis not found.' });
    }

    res.json({
      success: true,
      count: analysis.risks.length,
      risks: analysis.risks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/decision
 * @desc    Get bid recommendation & score breakdown
 * @access  Private
 */
const getDecision = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Decision analysis not found.' });
    }

    res.json({
      success: true,
      decision: analysis.decision
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/report
 * @desc    Get comprehensive executive dossier ready for report rendering
 * @access  Private
 */
const getReport = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    const analysis = await Analysis.findOne({ tenderId: req.params.id });
    const company = await Company.findOne({ userId: req.user._id });

    if (!tender || !analysis || !company) {
      return res.status(404).json({
        success: false,
        message: 'Incomplete data to generate executive dossier.'
      });
    }

    const report = generateExecutiveReport({ tender, company, analysis });

    res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFullAnalysis,
  getRequirements,
  getMatching,
  getRisks,
  getDecision,
  getReport
};
