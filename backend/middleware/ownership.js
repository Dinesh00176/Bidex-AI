const Tender = require('../models/Tender');
const Company = require('../models/Company');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');

/**
 * Validates that the requested tender belongs to the authenticated user
 */
const checkTenderOwnership = async (req, res, next) => {
  try {
    const tenderId = req.params.id || req.params.tenderId;
    if (!tenderId) {
      return res.status(400).json({ success: false, message: 'Tender ID is required' });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      logger.warn(`Unauthorized tender access attempt by user ${req.user._id} on tender ${tenderId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this tender document.'
      });
    }

    req.tender = tender;
    next();
  } catch (error) {
    logger.error('Error verifying tender ownership', error);
    return res.status(500).json({ success: false, message: 'Error verifying document ownership' });
  }
};

/**
 * Validates that the requested company profile belongs to the authenticated user
 */
const checkCompanyOwnership = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.user.companyId;
    if (!companyId) {
      return next(); // handled downstream if creating
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    if (company.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      logger.warn(`Unauthorized company access attempt by user ${req.user._id} on company ${companyId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this company profile.'
      });
    }

    req.company = company;
    next();
  } catch (error) {
    logger.error('Error verifying company ownership', error);
    return res.status(500).json({ success: false, message: 'Error verifying profile ownership' });
  }
};

module.exports = { checkTenderOwnership, checkCompanyOwnership };
