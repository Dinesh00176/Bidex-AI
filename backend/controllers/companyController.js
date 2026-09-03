const Company = require('../models/Company');
const { extractPdfPages } = require('../services/pdfService');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * Parses structured company capability facts from document text
 */
const extractCapabilityFactsFromText = (fullText) => {
  const extracted = {};
  if (!fullText) return extracted;

  // 1. Annual Turnover
  const turnoverMatch = fullText.match(/(?:annual\s+)?turnover[\s:]*(?:inr|rs|₹)?\s*([\d.]+)\s*(crore|cr|lakh|lakhs|million)?/i);
  if (turnoverMatch) {
    let val = parseFloat(turnoverMatch[1]);
    const unit = (turnoverMatch[2] || '').toLowerCase();
    if (unit.includes('cr')) val *= 10000000;
    else if (unit.includes('lakh')) val *= 100000;
    else if (unit.includes('million')) val *= 1000000;
    else if (val < 1000) val *= 10000000; // e.g. "6.5" -> 6.5 Cr
    extracted.annualTurnover = val;
  }

  // 2. Experience
  const expMatch = fullText.match(/(?:experience|in\s+business|operational\s+history)[\s:]*(\d+)\s*(?:years|year|yrs|yr)/i);
  if (expMatch) {
    extracted.yearsExperience = parseInt(expMatch[1], 10);
  }

  // 3. Employee Count
  const empMatch = fullText.match(/(?:employees|employee\s+count|headcount|staff|team\s+size)[\s:]*(\d+)/i);
  if (empMatch) {
    extracted.employeeCount = parseInt(empMatch[1], 10);
  }

  // 4. Industry
  const indMatch = fullText.match(/industry[\s:]*([\w\s&]+?)(?:\r?\n|;|,|$)/i);
  if (indMatch && indMatch[1].trim().length > 3) {
    extracted.industry = indMatch[1].trim();
  }

  // 5. Certifications
  const certs = [];
  if (/iso\s*9001/i.test(fullText)) certs.push('ISO 9001:2015');
  if (/iso\s*27001/i.test(fullText)) certs.push('ISO 27001:2022');
  if (/iso\s*14001/i.test(fullText)) certs.push('ISO 14001:2015');
  if (/cmmi/i.test(fullText)) certs.push('CMMI Level 3');
  if (certs.length > 0) {
    extracted.certifications = certs;
  }

  // 6. Technical Skills
  const skillsMatch = fullText.match(/(?:technical\s+skills|skills|core\s+competencies|tech\s+stack)[\s:]*([^\r\n]+)/i);
  if (skillsMatch && skillsMatch[1].trim().length > 2) {
    extracted.technicalSkills = skillsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }

  // 7. Services
  const servMatch = fullText.match(/(?:services|solutions|domain\s+offerings)[\s:]*([^\r\n]+)/i);
  if (servMatch && servMatch[1].trim().length > 2) {
    extracted.services = servMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }

  return extracted;
};

/**
 * @route   GET /api/company
 * @desc    Get authenticated user's company profile
 * @access  Private
 */
const getCompanyProfile = async (req, res, next) => {
  try {
    let company = await Company.findOne({ userId: req.user._id });

    if (!company) {
      // Auto-create clean profile if none exists
      company = await Company.create({
        userId: req.user._id,
        companyName: `${req.user.name}'s Enterprise`,
        industry: '',
        yearsExperience: 0,
        annualTurnover: 0,
        currency: 'INR',
        employeeCount: 0,
        certifications: [],
        technicalSkills: [],
        services: []
      });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/company
 * @desc    Update company profile details
 * @access  Private
 */
const updateCompanyProfile = async (req, res, next) => {
  try {
    let company = await Company.findOne({ userId: req.user._id });

    if (!company) {
      company = new Company({ userId: req.user._id });
    }

    const {
      companyName,
      industry,
      yearsExperience,
      annualTurnover,
      currency,
      employeeCount,
      certifications,
      technicalSkills,
      services,
      locations,
      previousProjects
    } = req.body;

    if (companyName) company.companyName = companyName;
    if (industry !== undefined) company.industry = industry;
    if (yearsExperience !== undefined) company.yearsExperience = Number(yearsExperience);
    if (annualTurnover !== undefined) company.annualTurnover = Number(annualTurnover);
    if (currency) company.currency = currency;
    if (employeeCount !== undefined) company.employeeCount = Number(employeeCount);
    if (certifications) company.certifications = Array.isArray(certifications) ? certifications : certifications.split(',').map(s => s.trim()).filter(Boolean);
    if (technicalSkills) company.technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : technicalSkills.split(',').map(s => s.trim()).filter(Boolean);
    if (services) company.services = Array.isArray(services) ? services : services.split(',').map(s => s.trim()).filter(Boolean);
    if (locations) company.locations = Array.isArray(locations) ? locations : locations.split(',').map(s => s.trim()).filter(Boolean);
    if (previousProjects && Array.isArray(previousProjects)) company.previousProjects = previousProjects;

    await company.save();
    logger.info(`Company profile updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/company/documents
 * @desc    Upload capability document (e.g. ISO certificate, audit report)
 * @access  Private
 */
const uploadCompanyDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF document.'
      });
    }

    let company = await Company.findOne({ userId: req.user._id });
    if (!company) {
      company = await Company.create({
        userId: req.user._id,
        companyName: `${req.user.name}'s Enterprise`
      });
    }

    const { title, docType } = req.body;

    // Extract text from the uploaded company document
    let extractedSummary = '';
    let extractedKeyFacts = [];

    try {
      const { fullText } = await extractPdfPages(req.file.path);
      const cleaned = fullText.replace(/\s+/g, ' ').slice(0, 500);
      extractedSummary = cleaned ? `Extracted evidence: ${cleaned}...` : 'Document text processed.';

      // Extract capability facts from PDF
      const facts = extractCapabilityFactsFromText(fullText);

      // Auto-populate / synchronize company profile fields from uploaded capability document
      if (facts.annualTurnover !== undefined) {
        company.annualTurnover = facts.annualTurnover;
        extractedKeyFacts.push(`Turnover: ₹${(facts.annualTurnover / 10000000).toFixed(2)} Cr`);
      }
      if (facts.yearsExperience !== undefined) {
        company.yearsExperience = facts.yearsExperience;
        extractedKeyFacts.push(`Experience: ${facts.yearsExperience} Years`);
      }
      if (facts.employeeCount !== undefined) {
        company.employeeCount = facts.employeeCount;
        extractedKeyFacts.push(`Headcount: ${facts.employeeCount} Staff`);
      }
      if (facts.industry) {
        company.industry = facts.industry;
        extractedKeyFacts.push(`Industry: ${facts.industry}`);
      }
      if (facts.certifications && facts.certifications.length > 0) {
        company.certifications = Array.from(new Set([...(company.certifications || []), ...facts.certifications]));
        extractedKeyFacts.push(`Certifications: ${facts.certifications.join(', ')}`);
      }
      if (facts.technicalSkills && facts.technicalSkills.length > 0) {
        company.technicalSkills = Array.from(new Set([...(company.technicalSkills || []), ...facts.technicalSkills]));
        extractedKeyFacts.push(`Skills: ${facts.technicalSkills.slice(0, 3).join(', ')}`);
      }
      if (facts.services && facts.services.length > 0) {
        company.services = Array.from(new Set([...(company.services || []), ...facts.services]));
      }

      if (/iso\s*27001/i.test(fullText)) extractedKeyFacts.push('Valid ISO 27001 Certification Identified');
      if (/iso\s*9001/i.test(fullText)) extractedKeyFacts.push('Valid ISO 9001 Quality Management Verified');
      if (/turnover|financial/i.test(fullText)) extractedKeyFacts.push('Financial Audit Statement Verified');
    } catch (parseErr) {
      logger.warn('Failed to parse uploaded company doc text', parseErr.message);
      extractedSummary = 'Document uploaded successfully.';
    }

    const newDoc = {
      title: title || req.file.originalname,
      docType: docType || 'Company Profile',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      extractedSummary,
      extractedKeyFacts: Array.from(new Set(extractedKeyFacts)),
      uploadedAt: new Date()
    };

    company.documents.push(newDoc);
    await company.save();

    logger.info(`Company document uploaded: ${newDoc.title} for company ${company.companyName}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully',
      document: company.documents[company.documents.length - 1],
      company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/company/documents/:docId
 * @desc    Delete an uploaded company document
 * @access  Private
 */
const deleteCompanyDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const company = await Company.findOne({ userId: req.user._id });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const docIndex = company.documents.findIndex(d => d._id.toString() === docId);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = company.documents[docIndex];
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {
        logger.warn('Could not delete physical file', e.message);
      }
    }

    company.documents.splice(docIndex, 1);
    await company.save();

    res.json({
      success: true,
      message: 'Document deleted successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyDocument,
  deleteCompanyDocument,
  extractCapabilityFactsFromText
};
