const { evaluateRequirementMatch, matchRequirementsWithCompany } = require('../services/matchingService');

describe('Requirement Matching Engine Unit Tests', () => {
  const company = {
    companyName: 'Test Tech Corp',
    annualTurnover: 80000000, // 8 Cr
    yearsExperience: 8,
    employeeCount: 50,
    certifications: ['ISO 9001:2015', 'ISO 27001:2013'],
    technicalSkills: ['Cloud Infrastructure', 'IoT Architecture', 'Kubernetes'],
    services: ['Cloud Managed Services'],
    documents: []
  };

  test('should correctly match turnover when company exceeds requirement', () => {
    const req = {
      category: 'Financial',
      title: 'Minimum Annual Turnover',
      value: 50000000,
      mandatory: true,
      sourcePage: 2
    };

    const match = evaluateRequirementMatch(req, company);
    expect(match.status).toBe('MATCH');
    expect(match.sourcePage).toBe(2);
    expect(match.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should return CONFLICT if company turnover is strictly less than mandatory requirement', () => {
    const lowTurnoverCompany = { ...company, annualTurnover: 20000000 };
    const req = {
      category: 'Financial',
      title: 'Minimum Annual Turnover',
      value: 50000000,
      mandatory: true,
      sourcePage: 2
    };

    const match = evaluateRequirementMatch(req, lowTurnoverCompany);
    expect(match.status).toBe('CONFLICT');
  });

  test('should return MATCH for possessed ISO certifications', () => {
    const req = {
      category: 'Certification',
      title: 'ISO 27001 Certification',
      mandatory: true,
      sourcePage: 3
    };

    const match = evaluateRequirementMatch(req, company);
    expect(match.status).toBe('MATCH');
    expect(match.companyEvidence).toContain('ISO 27001');
  });

  test('should return MISSING/CONFLICT when requested certification is absent', () => {
    const req = {
      category: 'Certification',
      title: 'ISO 14001 Environmental Management',
      mandatory: true,
      sourcePage: 3
    };

    const match = evaluateRequirementMatch(req, company);
    expect(['MISSING', 'CONFLICT']).toContain(match.status);
  });
});
