const { matchRequirementsWithCompany, evaluateRequirementMatch, parseNumericThreshold } = require('../services/matchingService');
const { computeBidDecision } = require('../services/decisionService');
const { evaluateRisks } = require('../services/riskService');

describe('Tender to Company Capability Matching & Weighted Scoring Tests', () => {
  const goodCompany = {
    companyName: 'Apex CyberTech Solutions',
    annualTurnover: 65000000, // ₹6.50 Crore
    yearsExperience: 7,
    employeeCount: 80,
    industry: 'Information Technology & Software Services',
    certifications: ['ISO 9001:2015', 'ISO 27001:2022'],
    technicalSkills: ['Java', 'Spring Boot', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
    services: ['Software Development', 'Web Applications', 'Cloud Solutions', 'AI/ML'],
    documents: [
      {
        docType: 'ISO Certificate',
        title: 'ISO 9001:2015 and ISO 27001:2022 Certificate',
        extractedSummary: 'ISO 9001:2015 Quality Management and ISO 27001:2022 Information Security'
      }
    ]
  };

  const badCompany = {
    companyName: 'Standard Global Trading Co',
    annualTurnover: 12000000, // ₹1.20 Crore
    yearsExperience: 1,
    employeeCount: 12,
    industry: 'General Trading',
    certifications: [],
    technicalSkills: ['Basic Office Support'],
    services: ['General Supply and Trading'],
    documents: []
  };

  // TEST 1: Turnover comparison
  test('TEST 1: Tender requires ₹5 Cr turnover -> GOOD ₹6.5 Cr is PASS, BAD ₹1.2 Cr is FAIL/CONFLICT', () => {
    const turnoverReq = {
      category: 'Financial',
      title: 'Minimum Annual Turnover',
      description: 'Average annual financial turnover shall not be less than INR 5.00 Crore.',
      value: 50000000,
      unit: 'INR',
      mandatory: true,
      sourcePage: 2
    };

    const goodMatch = evaluateRequirementMatch(turnoverReq, goodCompany);
    const badMatch = evaluateRequirementMatch(turnoverReq, badCompany);

    expect(goodMatch.status).toBe('MATCH');
    expect(goodMatch.reason).toContain('6.50 Cr');

    expect(badMatch.status).toBe('CONFLICT');
    expect(badMatch.reason).toContain('1.20 Cr');
  });

  // TEST 2: Operational Experience
  test('TEST 2: Tender requires 5 years experience -> GOOD 7 yrs is PASS, BAD 1 yr is FAIL/CONFLICT', () => {
    const expReq = {
      category: 'Experience',
      title: 'Operational Track Record',
      description: 'Bidder must possess at least 5 years of operational experience in IT/software.',
      value: 5,
      unit: 'Years',
      mandatory: true,
      sourcePage: 2
    };

    const goodMatch = evaluateRequirementMatch(expReq, goodCompany);
    const badMatch = evaluateRequirementMatch(expReq, badCompany);

    expect(goodMatch.status).toBe('MATCH');
    expect(goodMatch.reason).toContain('7 years');

    expect(badMatch.status).toBe('CONFLICT');
    expect(badMatch.reason).toContain('1 year');
  });

  // TEST 3: ISO Certifications
  test('TEST 3: Tender requires ISO 9001 -> GOOD is PASS, BAD is MISSING/CONFLICT', () => {
    const isoReq = {
      category: 'Certification',
      title: 'ISO 9001 Certification',
      description: 'Valid ISO 9001 Quality Management certification required.',
      mandatory: true,
      sourcePage: 3
    };

    const goodMatch = evaluateRequirementMatch(isoReq, goodCompany);
    const badMatch = evaluateRequirementMatch(isoReq, badCompany);

    expect(goodMatch.status).toBe('MATCH');
    expect(badMatch.status).toBe('CONFLICT'); // Mandatory missing becomes CONFLICT
  });

  // TEST 4: IT / Software Experience relevance
  test('TEST 4: Tender requires IT/software experience -> GOOD is PASS, BAD General Trading is FAIL', () => {
    const itDomainReq = {
      category: 'Experience',
      title: 'IT Domain Experience',
      description: 'Proven track record of at least 3 years in Software and Cloud Architecture projects.',
      value: 3,
      unit: 'Years',
      mandatory: true,
      sourcePage: 2
    };

    const goodMatch = evaluateRequirementMatch(itDomainReq, goodCompany);
    const badMatch = evaluateRequirementMatch(itDomainReq, badCompany);

    expect(goodMatch.status).toBe('MATCH');
    expect(badMatch.status).toBe('CONFLICT');
    expect(badMatch.reason).toContain('General Trading');
  });

  // TEST 5: Technical skills matching
  test('TEST 5: Tender requires React/Node.js/AWS -> GOOD strong match, BAD Basic Office Support fails', () => {
    const techReq = {
      category: 'Technical',
      title: 'Cloud & Full Stack Architecture',
      description: 'Demonstrated experience in React, Node.js, Cloud Solutions, and AWS Infrastructure.',
      mandatory: true,
      sourcePage: 3
    };

    const goodMatch = evaluateRequirementMatch(techReq, goodCompany);
    const badMatch = evaluateRequirementMatch(techReq, badCompany);

    expect(goodMatch.status).toBe('MATCH');
    expect(badMatch.status).toBe('CONFLICT');
    expect(badMatch.reason).toContain('lacks required technical competencies');
  });

  // TEST 6: Mandatory failure prevents artificially high scores
  test('TEST 6: A company failing mandatory requirements cannot receive an artificially high score', () => {
    const tenderReqs = [
      { category: 'Financial', title: 'Turnover ₹5 Cr', value: 50000000, mandatory: true },
      { category: 'Experience', title: '5 Years Experience', value: 5, mandatory: true },
      { category: 'Certification', title: 'ISO 9001:2015', mandatory: true },
      { category: 'Technical', title: 'Cloud Infrastructure & React', mandatory: true },
      { category: 'Staffing', title: '50 Technical Staff', value: 50, mandatory: true }
    ];

    const badMatches = matchRequirementsWithCompany(tenderReqs, badCompany);
    const badRisks = evaluateRisks({ requirements: tenderReqs, matches: badMatches, tender: {}, company: badCompany });
    const badDecision = computeBidDecision({ requirements: tenderReqs, matches: badMatches, risks: badRisks });

    expect(badDecision.recommendation).toBe('NO-BID');
    expect(badDecision.overallScore).toBeLessThanOrEqual(30);
    expect(badDecision.hardFailures.length).toBeGreaterThanOrEqual(3);
  });

  // TEST 7: Generic keywords do not produce high compliance
  test('TEST 7: Generic keywords like General Supply and Trading do not match technical specifications', () => {
    const techReq = {
      category: 'Technical',
      title: 'IoT Telemetry Pipeline & Microservices Architecture',
      description: 'Platform Uptime SLA 99.9% with scalable distributed microservices.',
      mandatory: true,
      sourcePage: 3
    };

    const badMatch = evaluateRequirementMatch(techReq, badCompany);
    expect(badMatch.status).toBe('CONFLICT');
  });

  // TEST 8: Full End-to-End Comparison between GOOD and BAD Company
  test('TEST 8: GOOD Company receives BID (~90+) and BAD Company receives NO-BID (<=30) against the same tender', () => {
    const realisticTenderRequirements = [
      { category: 'Eligibility', title: 'Legal Status (5 Years Incorporated)', value: 5, mandatory: true, sourcePage: 2 },
      { category: 'Financial', title: 'Minimum Annual Turnover ₹5 Cr', value: 50000000, mandatory: true, sourcePage: 2 },
      { category: 'Certification', title: 'ISO 9001 and ISO 27001', mandatory: true, sourcePage: 3 },
      { category: 'Technical', title: 'IoT Telemetry & Cloud Architecture', mandatory: true, sourcePage: 3 },
      { category: 'Technical', title: 'Platform 99.9% Uptime SLA', mandatory: true, sourcePage: 3 },
      { category: 'Staffing', title: 'Key Personnel & Project Bench', value: 30, mandatory: true, sourcePage: 4 },
      { category: 'Timeline', title: 'Project Implementation 180 Days', mandatory: true, sourcePage: 4 }
    ];

    // Evaluate GOOD
    const goodMatches = matchRequirementsWithCompany(realisticTenderRequirements, goodCompany);
    const goodRisks = evaluateRisks({ requirements: realisticTenderRequirements, matches: goodMatches, tender: {}, company: goodCompany });
    const goodDecision = computeBidDecision({ requirements: realisticTenderRequirements, matches: goodMatches, risks: goodRisks });

    // Evaluate BAD
    const badMatches = matchRequirementsWithCompany(realisticTenderRequirements, badCompany);
    const badRisks = evaluateRisks({ requirements: realisticTenderRequirements, matches: badMatches, tender: {}, company: badCompany });
    const badDecision = computeBidDecision({ requirements: realisticTenderRequirements, matches: badMatches, risks: badRisks });

    // Assertions
    expect(goodDecision.recommendation).toBe('BID');
    expect(goodDecision.overallScore).toBeGreaterThanOrEqual(85);
    expect(goodDecision.hardFailures.length).toBe(0);

    expect(badDecision.recommendation).toBe('NO-BID');
    expect(badDecision.overallScore).toBeLessThanOrEqual(30);
    expect(badDecision.hardFailures.length).toBeGreaterThanOrEqual(4);

    // Delta between GOOD and BAD must be massive (> 55 points)
    const scoreDelta = goodDecision.overallScore - badDecision.overallScore;
    expect(scoreDelta).toBeGreaterThanOrEqual(55);
  });
});
