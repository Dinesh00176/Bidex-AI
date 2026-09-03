const { matchRequirementsWithCompany } = require('../services/matchingService');
const { computeBidDecision } = require('../services/decisionService');
const { evaluateRisks } = require('../services/riskService');
const { modelService } = require('../services/modelService');

describe('Bidexa AI — Cross-Tender Isolation & Contamination Verification', () => {
  const companyProfile = {
    companyName: 'Apex Digital Infrastructure Pvt Ltd',
    industry: 'Information Technology & Smart Infrastructure',
    yearsExperience: 8,
    annualTurnover: 80000000, // ₹8.0 Crore
    employeeCount: 75,
    certifications: ['ISO 9001:2015', 'ISO/IEC 27001'],
    technicalSkills: ['AWS', 'Cloud Architecture', 'IoT', 'Python', 'Java', 'Spring Boot', 'React', 'Node.js'],
    services: ['Cloud infrastructure', 'IoT platform development', 'Enterprise software']
  };

  // Tender A: Smart City IoT RFP (Good Fit)
  const tenderA = {
    _id: 'tender_A_101',
    title: 'Smart City Real-Time Traffic IoT System',
    organization: 'City Transport Authority',
    estimatedValue: 60000000,
    pageCount: 15
  };

  const requirementsA = [
    { category: 'Eligibility', title: 'Incorporated for 5+ years', mandatory: true, value: 5, sourcePage: 2 },
    { category: 'Financial', title: 'Turnover INR 5.0 Cr', mandatory: true, value: 50000000, sourcePage: 3 },
    { category: 'Certification', title: 'ISO 9001:2015 & ISO 27001', mandatory: true, sourcePage: 3 },
    { category: 'Technical', title: 'Java, React, Node.js & AWS', mandatory: true, sourcePage: 5 },
    { category: 'Staffing', title: '30+ Technical Engineers', mandatory: true, value: 30, sourcePage: 6 }
  ];

  // Tender B: Aerospace High-Precision Machining Tender (Bad Fit)
  const tenderB = {
    _id: 'tender_B_202',
    title: 'Aerospace Turbine Titanium Component Machining',
    organization: 'Defense Aerospace Ltd',
    estimatedValue: 250000000,
    pageCount: 35
  };

  const requirementsB = [
    { category: 'Eligibility', title: 'Incorporated for 10+ years in Aerospace', mandatory: true, value: 10, sourcePage: 1 },
    { category: 'Financial', title: 'Turnover INR 50.0 Cr', mandatory: true, value: 500000000, sourcePage: 4 },
    { category: 'Certification', title: 'AS9100 Rev D Aerospace Quality', mandatory: true, sourcePage: 4 },
    { category: 'Technical', title: '5-Axis CNC Titanium Milling Interfacing', mandatory: true, sourcePage: 8 },
    { category: 'Staffing', title: 'Certified Aerospace Machinists', mandatory: true, value: 50, sourcePage: 9 }
  ];

  test('Cross-Tender Verification: Tender A and Tender B analyses remain completely isolated through repeat cycles', () => {
    // 1. Analyze Tender A
    const matchesA1 = matchRequirementsWithCompany(requirementsA, companyProfile);
    const risksA1 = evaluateRisks({ requirements: requirementsA, matches: matchesA1, tender: tenderA, company: companyProfile });
    const decisionA1 = computeBidDecision({ requirements: requirementsA, matches: matchesA1, risks: risksA1 });

    expect(decisionA1.recommendation).toBe('BID');
    expect(decisionA1.overallScore).toBeGreaterThanOrEqual(80);
    expect(decisionA1.hardFailures.length).toBe(0);

    // 2. Analyze Tender B
    const matchesB1 = matchRequirementsWithCompany(requirementsB, companyProfile);
    const risksB1 = evaluateRisks({ requirements: requirementsB, matches: matchesB1, tender: tenderB, company: companyProfile });
    const decisionB1 = computeBidDecision({ requirements: requirementsB, matches: matchesB1, risks: risksB1 });

    expect(decisionB1.recommendation).toBe('NO-BID');
    expect(decisionB1.overallScore).toBeLessThanOrEqual(45);
    expect(decisionB1.hardFailures.length).toBeGreaterThanOrEqual(2);

    // 3. Re-Analyze Tender A (Check for state leakage from B)
    const matchesA2 = matchRequirementsWithCompany(requirementsA, companyProfile);
    const risksA2 = evaluateRisks({ requirements: requirementsA, matches: matchesA2, tender: tenderA, company: companyProfile });
    const decisionA2 = computeBidDecision({ requirements: requirementsA, matches: matchesA2, risks: risksA2 });

    expect(decisionA2.recommendation).toBe('BID');
    expect(decisionA2.overallScore).toBe(decisionA1.overallScore);
    expect(decisionA2.hardFailures.length).toBe(0);

    // 4. Re-Analyze Tender B (Check for state leakage from A)
    const matchesB2 = matchRequirementsWithCompany(requirementsB, companyProfile);
    const risksB2 = evaluateRisks({ requirements: requirementsB, matches: matchesB2, tender: tenderB, company: companyProfile });
    const decisionB2 = computeBidDecision({ requirements: requirementsB, matches: matchesB2, risks: risksB2 });

    expect(decisionB2.recommendation).toBe('NO-BID');
    expect(decisionB2.overallScore).toBe(decisionB1.overallScore);
    expect(decisionB2.hardFailures.length).toBe(decisionB1.hardFailures.length);
  });
});
