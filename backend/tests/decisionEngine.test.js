const { computeBidDecision, DEFAULT_WEIGHTS } = require('../services/decisionService');

describe('Bid Decision Engine Unit Tests', () => {
  test('should return BID when all mandatory criteria and scores are strongly met', () => {
    const requirements = [
      { category: 'Financial', title: 'Min Turnover', mandatory: true, sourcePage: 1 },
      { category: 'Technical', title: 'Cloud HA', mandatory: true, sourcePage: 2 }
    ];

    const matches = [
      { category: 'Financial', requirementTitle: 'Min Turnover', status: 'MATCH', mandatory: true, reason: 'Turnover meets threshold' },
      { category: 'Technical', requirementTitle: 'Cloud HA', status: 'MATCH', mandatory: true, reason: 'Full HA stack' }
    ];

    const risks = [
      { category: 'Contract', severity: 'LOW', title: 'Standard Terms', description: 'Standard SLA' }
    ];

    const result = computeBidDecision({ requirements, matches, risks });

    expect(result.recommendation).toBe('BID');
    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.hardFailures).toHaveLength(0);
    expect(result.keyStrengths.length).toBeGreaterThan(0);
  });

  test('HARD FAILURE GATE: should NEVER return BID if a mandatory requirement is MISSING', () => {
    const requirements = [
      { category: 'Certification', title: 'ISO 27001', mandatory: true, sourcePage: 1 },
      { category: 'Financial', title: 'Min Turnover', mandatory: true, sourcePage: 2 }
    ];

    const matches = [
      { category: 'Certification', requirementTitle: 'ISO 27001', status: 'MISSING', mandatory: true, reason: 'No certificate found' },
      { category: 'Financial', requirementTitle: 'Min Turnover', status: 'MATCH', mandatory: true, reason: 'Turnover meets threshold' }
    ];

    const risks = [
      { category: 'Compliance', severity: 'CRITICAL', title: 'Missing ISO 27001', description: 'Mandatory cert absent' }
    ];

    const result = computeBidDecision({ requirements, matches, risks });

    // Must NOT be BID
    expect(result.recommendation).not.toBe('BID');
    expect(['REVIEW', 'NO-BID']).toContain(result.recommendation);
    expect(result.hardFailures.length).toBeGreaterThan(0);
    expect(result.hardFailures[0]).toContain('ISO 27001');
  });

  test('should return NO-BID when multiple mandatory requirements are failed', () => {
    const matches = [
      { category: 'Financial', requirementTitle: 'Turnover', status: 'CONFLICT', mandatory: true, reason: 'Turnover is too low' },
      { category: 'Certification', requirementTitle: 'ISO 27001', status: 'MISSING', mandatory: true, reason: 'Missing cert' }
    ];

    const risks = [
      { category: 'Eligibility', severity: 'CRITICAL', title: 'Financial Ineligibility', description: 'Turnover below threshold' }
    ];

    const result = computeBidDecision({ matches, risks });

    expect(result.recommendation).toBe('NO-BID');
    expect(result.overallScore).toBeLessThanOrEqual(50);
    expect(result.hardFailures.length).toBeGreaterThanOrEqual(2);
  });
});
