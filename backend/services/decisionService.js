const logger = require('../utils/logger');

const DEFAULT_WEIGHTS = {
  eligibility: 30,
  technical: 25,
  financial: 20,
  experience: 15,
  compliance: 10
};

/**
 * Calculates category score (0 - 100) based on matches and requirements
 */
const calculateCategoryScore = (categoryName, matches, companyHasGeneralFailures = false) => {
  const catMatches = matches.filter(m => {
    if (categoryName === 'compliance') return m.category === 'Certification' || m.category === 'Compliance';
    if (categoryName === 'eligibility') return m.category === 'Eligibility' || m.category === 'Legal' || m.category === 'Documents';
    return m.category.toLowerCase() === categoryName.toLowerCase();
  });

  // If no requirements exist in this category, provide a conservative baseline
  if (catMatches.length === 0) {
    return companyHasGeneralFailures ? 30 : 80;
  }

  let totalPoints = 0;
  catMatches.forEach(m => {
    switch (m.status) {
      case 'MATCH':
      case 'PASS':
        totalPoints += 100;
        break;
      case 'PARTIAL':
        totalPoints += 35;
        break;
      case 'UNKNOWN':
        totalPoints += 20;
        break;
      case 'MISSING':
      case 'FAIL':
        totalPoints += 0;
        break;
      case 'CONFLICT':
        totalPoints += 0;
        break;
      default:
        totalPoints += 25;
    }
  });

  return Math.round(totalPoints / catMatches.length);
};

/**
 * Calculates risk sub-score (0-100) where fewer/lower risks = higher score
 */
const calculateRiskScore = (risks) => {
  let deductions = 0;
  risks.forEach(r => {
    if (r.severity === 'CRITICAL') deductions += 35;
    else if (r.severity === 'HIGH') deductions += 20;
    else if (r.severity === 'MEDIUM') deductions += 10;
    else if (r.severity === 'LOW') deductions += 4;
  });

  return Math.max(0, 100 - deductions);
};

/**
 * Computes the overall Bid Decision with strict evidence-based weighted scoring & hard-failure gating
 */
const computeBidDecision = ({ requirements = [], matches = [], risks = [], weights = DEFAULT_WEIGHTS }) => {
  logger.info('Computing explainable bid decision');

  // 1. Identify Mandatory Hard Failures
  const hardFailures = [];
  matches.forEach(m => {
    if (m.mandatory && (m.status === 'MISSING' || m.status === 'CONFLICT' || m.status === 'FAIL')) {
      hardFailures.push(`Mandatory criterion unmet: ${m.requirementTitle} (${m.reason})`);
    }
  });

  // Critical Risks
  const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');
  criticalRisks.forEach(cr => {
    if (!hardFailures.some(hf => hf.includes(cr.title))) {
      hardFailures.push(`Critical risk: ${cr.title} (${cr.description})`);
    }
  });

  const hasMajorFailures = hardFailures.length > 0;

  // 2. Calculate individual category scores (0-100)
  const scoreBreakdown = {
    eligibility: calculateCategoryScore('eligibility', matches, hasMajorFailures),
    technical: calculateCategoryScore('technical', matches, hasMajorFailures),
    financial: calculateCategoryScore('financial', matches, hasMajorFailures),
    experience: calculateCategoryScore('experience', matches, hasMajorFailures),
    compliance: calculateCategoryScore('compliance', matches, hasMajorFailures),
    risk: calculateRiskScore(risks),
    timeline: calculateCategoryScore('timeline', matches, hasMajorFailures)
  };

  // 3. Compute weighted composite score
  const activeWeights = { ...DEFAULT_WEIGHTS, ...weights };
  const totalWeight =
    activeWeights.eligibility +
    activeWeights.technical +
    activeWeights.financial +
    activeWeights.experience +
    activeWeights.compliance;

  const weightedSum =
    (scoreBreakdown.eligibility * activeWeights.eligibility) +
    (scoreBreakdown.technical * activeWeights.technical) +
    (scoreBreakdown.financial * activeWeights.financial) +
    (scoreBreakdown.experience * activeWeights.experience) +
    (scoreBreakdown.compliance * activeWeights.compliance);

  const rawOverallScore = Math.round(weightedSum / totalWeight);

  // 4. Strengths & Concerns
  const keyStrengths = [];
  const keyConcerns = [];

  matches.forEach(m => {
    if (m.status === 'MATCH' || m.status === 'PASS') {
      keyStrengths.push(`${m.category}: ${m.requirementTitle} satisfied. ${m.companyEvidence || ''}`);
    } else if (m.status === 'PARTIAL') {
      keyConcerns.push(`${m.category}: ${m.requirementTitle} only partially compliant. (${m.reason})`);
    } else if (m.status === 'MISSING' || m.status === 'CONFLICT' || m.status === 'FAIL') {
      keyConcerns.push(`${m.category}: ${m.requirementTitle} failed/missing. (${m.reason})`);
    }
  });

  risks.forEach(r => {
    if (r.severity === 'HIGH' || r.severity === 'CRITICAL') {
      if (!keyConcerns.some(c => c.includes(r.title))) {
        keyConcerns.push(`${r.title} (${r.recommendedAction})`);
      }
    }
  });

  // 5. Multi-Tier Hard Failure Gate & Recommendation
  let recommendation = 'BID';
  let overallScore = rawOverallScore;

  const hasCriticalAnomaly = matches.some(m => (m.reason || '').includes('CRITICAL_ANOMALY') || (m.requirementTitle || '').includes('CRITICAL_ANOMALY')) ||
                             risks.some(r => (r.title || '').includes('CRITICAL_ANOMALY') || (r.description || '').includes('CRITICAL_ANOMALY'));

  if (hasCriticalAnomaly) {
    recommendation = 'NO-BID';
    overallScore = 0;
    hardFailures.unshift('CRITICAL_ANOMALY: Document contains science-fiction requirements, impossible delivery timelines, or logical impossibilities. Immediate NO-BID mandated.');
  } else if (hardFailures.length >= 3 || (scoreBreakdown.financial === 0 && scoreBreakdown.technical <= 35)) {
    recommendation = 'NO-BID';
    overallScore = Math.min(rawOverallScore, 25); // Heavy cap for multiple mandatory failures
  } else if (hardFailures.length === 2 || scoreBreakdown.financial === 0 || scoreBreakdown.eligibility < 35) {
    recommendation = 'NO-BID';
    overallScore = Math.min(rawOverallScore, 40);
  } else if (hardFailures.length === 1 || criticalRisks.length > 0) {
    recommendation = 'REVIEW';
    overallScore = Math.min(rawOverallScore, 65);
  } else if (rawOverallScore >= 75) {
    recommendation = 'BID';
    overallScore = rawOverallScore;
  } else {
    recommendation = 'REVIEW';
    overallScore = rawOverallScore;
  }

  // 6. Summary Rationale
  let summaryRationale = '';
  if (recommendation === 'BID') {
    summaryRationale = `Strong commercial & technical alignment (${overallScore}/100). Company satisfies all core mandatory criteria with verified credentials and specialized domain experience. Recommend proceeding to tender bid preparation.`;
  } else if (recommendation === 'REVIEW') {
    summaryRationale = `Viable opportunity with qualification caveats (${overallScore}/100). Requires executive review to resolve ${hardFailures.length > 0 ? hardFailures[0] : 'compliance & staffing gaps'} before formal bid submission.`;
  } else {
    summaryRationale = `Non-compliant on critical mandatory qualification thresholds (${overallScore}/100). High probability of commercial/technical disqualification (${hardFailures.length} mandatory failure(s) detected). Bidding is not recommended without forming a consortium partner.`;
  }

  return {
    recommendation,
    overallScore,
    scoreBreakdown,
    weightsUsed: activeWeights,
    hardFailures,
    keyStrengths: keyStrengths.slice(0, 6),
    keyConcerns: keyConcerns.slice(0, 6),
    summaryRationale
  };
};

module.exports = { computeBidDecision, DEFAULT_WEIGHTS };
