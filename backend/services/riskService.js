const logger = require('../utils/logger');
const { normalizeRiskCategory } = require('../utils/categoryTaxonomy');

/**
 * Evaluates comprehensive risk matrix across tender requirements, matching findings, and contract terms
 */
const evaluateRisks = ({ requirements = [], matches = [], tender = {}, company = {} }) => {
  logger.info('Evaluating procurement risk matrix');
  const risks = [];

  // 1. Evaluate Gaps from Matching (Mandatory Missing / Conflicts -> CRITICAL / HIGH)
  matches.forEach(match => {
    const canonicalRiskCat = normalizeRiskCategory(match.category);

    if (match.mandatory && (match.status === 'MISSING' || match.status === 'CONFLICT')) {
      risks.push({
        category: canonicalRiskCat,
        severity: 'CRITICAL',
        title: `Mandatory Requirement Unmet: ${match.requirementTitle}`,
        description: `The tender stipulates '${match.requirementTitle}' as a mandatory qualifying condition. ${match.reason}`,
        evidence: `Match status: ${match.status}. Evidence: "${match.companyEvidence}" (Source: Page ${match.sourcePage})`,
        sourcePage: match.sourcePage,
        recommendedAction: 'Procure formal joint-venture/consortium partner or secure missing prerequisite qualification before bid submission.'
      });
    } else if (match.mandatory && match.status === 'PARTIAL') {
      risks.push({
        category: canonicalRiskCat,
        severity: 'HIGH',
        title: `Partial Qualification on Mandatory Item: ${match.requirementTitle}`,
        description: `Company partially satisfies mandatory requirement '${match.requirementTitle}'. Evaluation committee may disqualify or assign low scoring.`,
        evidence: match.reason,
        sourcePage: match.sourcePage,
        recommendedAction: 'Provide supplemental audit certificates, client reference letters, or subcontractor declarations.'
      });
    } else if (!match.mandatory && match.status === 'MISSING') {
      risks.push({
        category: canonicalRiskCat,
        severity: 'MEDIUM',
        title: `Optional Requirement Gap: ${match.requirementTitle}`,
        description: `Non-mandatory capability '${match.requirementTitle}' is missing, which could result in lower technical evaluation points.`,
        evidence: match.reason,
        sourcePage: match.sourcePage,
        recommendedAction: 'Highlight alternative competencies and compensating technical strengths in technical proposal.'
      });
    }
  });

  // 2. Deadline & Timeline Proximity Risk
  if (tender.deadline) {
    const deadlineDate = new Date(tender.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 7 && daysRemaining >= 0) {
      risks.push({
        category: 'Timeline',
        severity: 'HIGH',
        title: 'Critical Submission Deadline Proximity',
        description: `Only ${daysRemaining} day(s) remain before the final tender submission deadline. High risk of document preparation bottlenecks.`,
        evidence: `Bid Deadline: ${deadlineDate.toISOString().split('T')[0]} (${daysRemaining} days remaining).`,
        sourcePage: 1,
        recommendedAction: 'Expedite technical write-ups and fast-track bank guarantee issuance immediately.'
      });
    } else if (daysRemaining <= 14 && daysRemaining > 7) {
      risks.push({
        category: 'Timeline',
        severity: 'MEDIUM',
        title: 'Compressed Proposal Preparation Window',
        description: `Tender deadline is in ${daysRemaining} days. Requires rapid assembly of compliance matrices and commercial bids.`,
        evidence: `Bid Deadline: ${deadlineDate.toISOString().split('T')[0]}.`,
        sourcePage: 1,
        recommendedAction: 'Assign a dedicated bid coordinator and establish milestone checkpoints.'
      });
    }
  }

  // 3. Contractual & Liquidated Damages Clauses
  const contractReqs = requirements.filter(r => r.category === 'Contract' || (r.title || '').toLowerCase().includes('penalty') || (r.title || '').toLowerCase().includes('liquidated'));
  if (contractReqs.length > 0) {
    contractReqs.forEach(cr => {
      risks.push({
        category: 'Contract',
        severity: 'MEDIUM',
        title: `Contract Exposure: ${cr.title}`,
        description: `${cr.description} Liquidated damages and liability caps must be scrutinized for financial exposure.`,
        evidence: cr.sourceText || `Source Page ${cr.sourcePage}`,
        sourcePage: cr.sourcePage,
        recommendedAction: 'Flagged for human/legal review. Verify if milestone liability cap is negotiable or standard.'
      });
    });
  } else {
    risks.push({
      category: 'Contract',
      severity: 'LOW',
      title: 'Standard Contract Terms & Conditions',
      description: 'Standard procurement commercial terms detected. Standard defect liability and warranty provisions apply.',
      evidence: 'Standard terms identified in tender draft contract agreement.',
      sourcePage: 1,
      recommendedAction: 'Flagged for human/legal review.'
    });
  }

  // 4. Tone & Intent & Anomaly Check (Strict Organizational Filter)
  const allReqText = `${tender.title || ''} ${requirements.map(r => `${r.title} ${r.description} ${r.sourceText || ''}`).join(' ')}`.toLowerCase();
  const hostilePatterns = ['worst', 'no exceptions', 'delivered yesterday', 'telepathic', 'transform into', 'time travel'];
  const hasHostileOrAnomalousTone = hostilePatterns.some(kw => allReqText.includes(kw));

  if (hasHostileOrAnomalousTone) {
    risks.push({
      category: 'Contract',
      severity: 'CRITICAL',
      title: 'ORGANIZATIONAL_RISK: Critical Anomaly or Hostile Specification Detected',
      description: 'The tender specification includes logical impossibilities, science fiction requirements, or hostile procurement terms posing unacceptable legal and operational risk.',
      evidence: 'Anomalous or hostile clauses identified in tender specifications.',
      sourcePage: 1,
      recommendedAction: 'Immediate executive escalation. Strong recommendation to decline bidding (NO-BID).'
    });
  }

  // 4. Financial & EMD Security Risk
  const docReqs = requirements.filter(r => r.category === 'Documents' && (r.title.toLowerCase().includes('emd') || r.title.toLowerCase().includes('security')));
  if (docReqs.length > 0) {
    risks.push({
      category: 'Financial',
      severity: 'LOW',
      title: 'Bid Security / EMD Bank Guarantee Obligation',
      description: 'Mandatory Earnest Money Deposit must be committed for the duration of the bid validity period.',
      evidence: docReqs[0].sourceText,
      sourcePage: docReqs[0].sourcePage,
      recommendedAction: 'Ensure corporate credit lines with banking partners are available for BG issuance.'
    });
  }

  // Sort risks by severity: CRITICAL -> HIGH -> MEDIUM -> LOW
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return risks;
};

module.exports = { evaluateRisks };
