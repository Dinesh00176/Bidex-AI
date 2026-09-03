const { evaluateRisks } = require('../services/riskService');

describe('Risk Analysis Engine Unit Tests', () => {
  test('should classify mandatory missing requirement as CRITICAL risk', () => {
    const matches = [
      {
        category: 'Certification',
        requirementTitle: 'ISO 27001',
        status: 'MISSING',
        mandatory: true,
        reason: 'No certificate',
        companyEvidence: 'None',
        sourcePage: 3
      }
    ];

    const risks = evaluateRisks({ matches, requirements: [], tender: {}, company: {} });
    expect(risks.length).toBeGreaterThan(0);
    const criticalRisk = risks.find(r => r.severity === 'CRITICAL');
    expect(criticalRisk).toBeDefined();
    expect(criticalRisk.title).toContain('ISO 27001');
    expect(criticalRisk.sourcePage).toBe(3);
  });

  test('should flag short deadline <= 7 days as HIGH risk', () => {
    const shortDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    const tender = { deadline: shortDeadline };

    const risks = evaluateRisks({ matches: [], requirements: [], tender, company: {} });
    const timelineRisk = risks.find(r => r.category === 'Timeline');
    expect(timelineRisk).toBeDefined();
    expect(timelineRisk.severity).toBe('HIGH');
  });

  test('should flag contract liquidated damages with recommended action for legal review', () => {
    const requirements = [
      {
        category: 'Contract',
        title: 'Liquidated Damages 10% Max',
        description: '0.5% per week penalty',
        sourcePage: 4,
        sourceText: 'Penalty up to 10%'
      }
    ];

    const risks = evaluateRisks({ matches: [], requirements, tender: {}, company: {} });
    const contractRisk = risks.find(r => r.category === 'Contract');
    expect(contractRisk).toBeDefined();
    expect(contractRisk.recommendedAction).toContain('Flagged for human/legal review');
  });
});
