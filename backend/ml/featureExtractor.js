/**
 * Bidexa AI — Canonical Feature Extraction Pipeline
 * Schema Version: bidexa-features-v1
 * Extracts exactly 20 leak-free structured features from Tender, Company, Matches, and Risks.
 */

const FEATURE_SCHEMA_VERSION = 'bidexa-features-v1';

const FEATURE_NAMES = [
  'company_turnover_cr',
  'company_experience_years',
  'company_employee_count',
  'company_cert_count',
  'company_tech_skill_count',
  'company_industry_match',
  'tender_estimated_value_cr',
  'tender_page_count',
  'tender_total_req_count',
  'tender_mandatory_req_count',
  'tender_optional_req_count',
  'tender_tech_req_count',
  'tender_financial_req_count',
  'match_pass_rate',
  'match_partial_rate',
  'match_conflict_count',
  'match_missing_count',
  'mandatory_failure_count',
  'technical_match_ratio',
  'certification_match_ratio'
];

/**
 * Extracts structured numerical feature map and vector
 */
const extractFeatures = ({ tender = {}, company = {}, requirements = [], matches = [], risks = [] }) => {
  // 1. Company features
  const companyTurnoverCr = Number((Number(company.annualTurnover || 0) / 10000000).toFixed(3));
  const companyExperienceYears = Number(company.yearsExperience || 0);
  const companyEmployeeCount = Number(company.employeeCount || 0);
  const companyCertCount = Array.isArray(company.certifications) ? company.certifications.length : 0;
  const companyTechSkillCount = Array.isArray(company.technicalSkills) ? company.technicalSkills.length : 0;

  const industryStr = (company.industry || '').toLowerCase();
  const isItDomain = industryStr.includes('technology') || industryStr.includes('software') || industryStr.includes('it') || industryStr.includes('cloud') || industryStr.includes('infrastructure');
  const isGeneralTrading = industryStr.includes('trading') || industryStr.includes('general supply') || industryStr.includes('commodity');
  const companyIndustryMatch = (isItDomain && !isGeneralTrading) ? 1.0 : (isGeneralTrading ? 0.0 : 0.5);

  // 2. Tender features
  const tenderEstimatedValueCr = Number((Number(tender.estimatedValue || 0) / 10000000).toFixed(3));
  const tenderPageCount = Math.max(Number(tender.pageCount || 1), 1);
  const tenderTotalReqCount = requirements.length;
  const tenderMandatoryReqCount = requirements.filter(r => r.mandatory).length;
  const tenderOptionalReqCount = requirements.filter(r => !r.mandatory).length;
  const tenderTechReqCount = requirements.filter(r => r.category === 'Technical').length;
  const tenderFinancialReqCount = requirements.filter(r => r.category === 'Financial').length;

  // 3. Match & Compliance features
  const totalMatches = matches.length || 1;
  const passCount = matches.filter(m => m.status === 'MATCH' || m.status === 'PASS').length;
  const partialCount = matches.filter(m => m.status === 'PARTIAL').length;
  const conflictCount = matches.filter(m => m.status === 'CONFLICT').length;
  const missingCount = matches.filter(m => m.status === 'MISSING' || m.status === 'FAIL').length;
  const mandatoryFailureCount = matches.filter(m => m.mandatory && (m.status === 'CONFLICT' || m.status === 'MISSING' || m.status === 'FAIL')).length;

  const matchPassRate = Number((passCount / totalMatches).toFixed(3));
  const matchPartialRate = Number((partialCount / totalMatches).toFixed(3));

  // Technical requirement match ratio
  const techMatches = matches.filter(m => m.category === 'Technical');
  const techPassCount = techMatches.filter(m => m.status === 'MATCH' || m.status === 'PASS').length;
  const technicalMatchRatio = techMatches.length > 0 ? Number((techPassCount / techMatches.length).toFixed(3)) : 1.0;

  // Certification match ratio
  const certMatches = matches.filter(m => m.category === 'Certification');
  const certPassCount = certMatches.filter(m => m.status === 'MATCH' || m.status === 'PASS').length;
  const certificationMatchRatio = certMatches.length > 0 ? Number((certPassCount / certMatches.length).toFixed(3)) : 1.0;

  const featureMap = {
    company_turnover_cr: companyTurnoverCr,
    company_experience_years: companyExperienceYears,
    company_employee_count: companyEmployeeCount,
    company_cert_count: companyCertCount,
    company_tech_skill_count: companyTechSkillCount,
    company_industry_match: companyIndustryMatch,
    tender_estimated_value_cr: tenderEstimatedValueCr,
    tender_page_count: tenderPageCount,
    tender_total_req_count: tenderTotalReqCount,
    tender_mandatory_req_count: tenderMandatoryReqCount,
    tender_optional_req_count: tenderOptionalReqCount,
    tender_tech_req_count: tenderTechReqCount,
    tender_financial_req_count: tenderFinancialReqCount,
    match_pass_rate: matchPassRate,
    match_partial_rate: matchPartialRate,
    match_conflict_count: conflictCount,
    match_missing_count: missingCount,
    mandatory_failure_count: mandatoryFailureCount,
    technical_match_ratio: technicalMatchRatio,
    certification_match_ratio: certificationMatchRatio
  };

  const featureVector = FEATURE_NAMES.map(name => {
    const val = featureMap[name];
    return typeof val === 'number' && !isNaN(val) ? val : 0;
  });

  return {
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    featureNames: FEATURE_NAMES,
    featureMap,
    featureVector
  };
};

module.exports = {
  FEATURE_SCHEMA_VERSION,
  FEATURE_NAMES,
  extractFeatures
};
