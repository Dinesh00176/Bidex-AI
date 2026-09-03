/**
 * Controlled Category Taxonomy and Normalization Layer
 * Maps raw AI outputs and synonyms to canonical Mongoose Schema enums.
 */

const CANONICAL_REQUIREMENT_CATEGORIES = [
  'Eligibility',
  'Experience',
  'Financial',
  'Technical',
  'Certification',
  'Staffing',
  'Legal',
  'Timeline',
  'Documents',
  'Contract'
];

const CANONICAL_RISK_CATEGORIES = [
  'Eligibility',
  'Financial',
  'Technical',
  'Compliance',
  'Legal',
  'Timeline',
  'Documentation',
  'Contract'
];

/**
 * Normalizes an AI-generated or user-provided category into a canonical requirement category
 * @param {string} rawCategory
 * @returns {string} One of the 10 canonical requirement enum values
 */
const normalizeRequirementCategory = (rawCategory) => {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return 'Eligibility';
  }

  const clean = rawCategory.trim();
  const lower = clean.toLowerCase();

  // Direct match (case-insensitive check against canonicals)
  const directMatch = CANONICAL_REQUIREMENT_CATEGORIES.find(
    c => c.toLowerCase() === lower
  );
  if (directMatch) {
    return directMatch;
  }

  // 1. Technical & Engineering (Check first so "software architecture" is Technical)
  if (/tech|infrastructure|cloud|architecture|software|hardware|iot|telemetry|system|scalab|sla|uptime|performance|deliverable|scope/i.test(lower)) {
    return 'Technical';
  }

  // 2. Staffing, Manpower & Key Personnel
  if (/staff|manpower|personnel|human\s*resource|team|key\s*personnel|project\s*manager|project\s*director|resource/i.test(lower)) {
    return 'Staffing';
  }

  // 3. Financial & Turnover
  if (/financ|turnover|net\s*worth|revenue|commercial|earnest|pricing|budget|cost|fee|ca\s*cert/i.test(lower)) {
    return 'Financial';
  }

  // 4. Certifications & Standards
  if (/certif|iso|cmmi|accredit|standard|quality|security\s*standard/i.test(lower)) {
    return 'Certification';
  }

  // 5. Experience & Track Record
  if (/experien|track\s*record|past\s*project|prior|proven|case\s*stud|client\s*reference/i.test(lower)) {
    return 'Experience';
  }

  // 6. Legal & Statutory
  if (/legal|complian|regulatory|statutory|litigat|debar|blacklisting|affidavit|court|undertaking/i.test(lower)) {
    return 'Legal';
  }

  // 7. Timeline & Schedule
  if (/time|schedul|milestone|deliver|duration|period|deadline|go-live|commissioning|phase/i.test(lower)) {
    return 'Timeline';
  }

  // 8. Documents & Submissions
  if (/doc|submission|form|annexure|emd|bank\s*guarantee|bg|attachment/i.test(lower)) {
    return 'Documents';
  }

  // 9. Contract & Penalties
  if (/contract|penalty|penalties|liquidated\s*damages|ld|warranty|liability|amc|dispute|termination|governing/i.test(lower)) {
    return 'Contract';
  }

  // 10. Eligibility & Incorporation
  if (/eligib|pre-qual|incorporat|registration|entity|years\s*in\s*business|general/i.test(lower)) {
    return 'Eligibility';
  }

  // Safe fallback to 'Technical'
  return 'Technical';
};

/**
 * Normalizes a category into a canonical Risk schema category
 * @param {string} rawCategory
 * @returns {string} One of the 8 canonical risk enum values
 */
const normalizeRiskCategory = (rawCategory) => {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return 'Technical';
  }

  const clean = rawCategory.trim();
  const lower = clean.toLowerCase();

  // Direct match in risk schema
  const directMatch = CANONICAL_RISK_CATEGORIES.find(
    c => c.toLowerCase() === lower
  );
  if (directMatch) {
    return directMatch;
  }

  // Map requirement schema terms into risk schema terms
  if (/certif|complian|iso|cmmi|standard|accredit/i.test(lower)) {
    return 'Compliance';
  }

  if (/doc|submission|form|annexure|attachment/i.test(lower)) {
    return 'Documentation';
  }

  if (/staff|manpower|personnel|resource|team|tech|infra|cloud|software|hardware|iot|sla/i.test(lower)) {
    return 'Technical';
  }

  if (/experien|eligib|incorporat|track\s*record/i.test(lower)) {
    return 'Eligibility';
  }

  if (/financ|turnover|net\s*worth|budget|revenue|emd|cost/i.test(lower)) {
    return 'Financial';
  }

  if (/legal|statutory|regulatory|litigat|debar|blacklisting/i.test(lower)) {
    return 'Legal';
  }

  if (/time|schedul|milestone|deadline|delay/i.test(lower)) {
    return 'Timeline';
  }

  if (/contract|penalty|liquidated|damages|liability|warranty/i.test(lower)) {
    return 'Contract';
  }

  return 'Technical';
};

module.exports = {
  CANONICAL_REQUIREMENT_CATEGORIES,
  CANONICAL_RISK_CATEGORIES,
  normalizeRequirementCategory,
  normalizeRiskCategory
};
