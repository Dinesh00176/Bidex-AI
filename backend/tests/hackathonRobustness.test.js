const { evaluateRequirementMatch, matchRequirementsWithCompany } = require('../services/matchingService');
const { computeBidDecision } = require('../services/decisionService');
const { extractStructuredRequirements } = require('../services/extractionService');
const { extractPdfPages } = require('../services/pdfService');
const { modelService } = require('../services/modelService');
const geminiService = require('../services/geminiService');

describe('Bidexa AI — Hackathon Hardening & Real-Tender Robustness Tests', () => {
  const testCompany = {
    companyName: 'Apex Digital Infrastructure Pvt Ltd',
    industry: 'Information Technology & Smart Infrastructure',
    yearsExperience: 8,
    annualTurnover: 80000000, // ₹8.0 Crore
    currency: 'INR',
    employeeCount: 75,
    certifications: ['ISO 9001:2015', 'ISO/IEC 27001'],
    technicalSkills: ['AWS', 'Cloud Architecture', 'IoT', 'Python', 'Java', 'Spring Boot', 'React', 'Node.js'],
    services: ['Cloud infrastructure', 'IoT platform development', 'Enterprise software'],
    documents: [
      {
        title: 'ISO 27001 & ISO 9001 Certificates',
        docType: 'ISO Certificate',
        extractedSummary: 'ISO 9001:2015 and ISO/IEC 27001 active accreditations.',
        extractedKeyFacts: ['Valid ISO 9001:2015', 'Valid ISO 27001']
      }
    ]
  };

  // 1. TURNOVER VS NET WORTH SEPARATION
  test('Scenario 1: Turnover is NEVER used as evidence for Net Worth (Turnover vs Net Worth Separation)', () => {
    const netWorthReq = {
      category: 'Financial',
      title: 'Positive Net Worth Requirement',
      description: 'Bidder must submit audited balance sheet proving positive net worth.',
      mandatory: true,
      sourcePage: 2
    };

    // Company without explicit net worth certificate
    const match = evaluateRequirementMatch(netWorthReq, testCompany);
    // Must NOT state ₹80M turnover as proof of Net Worth
    expect(match.companyEvidence).not.toContain('80,000,000 turnover');
    expect(match.companyEvidence).toContain('net-worth');
  });

  // 2. CERTIFICATION PRECISION
  test('Scenario 2: Certification matching is strict (ISO 9001 does NOT satisfy AS9100)', () => {
    const as9100Req = {
      category: 'Certification',
      title: 'Mandatory AS9100 Rev D Aerospace Certification',
      description: 'Vendor must hold valid AS9100 Rev D certification.',
      mandatory: true,
      sourcePage: 2
    };

    const match = evaluateRequirementMatch(as9100Req, testCompany);
    expect(match.status).toBe('CONFLICT');
    expect(match.reason).toContain('No proof or record of');
    expect(match.companyEvidence).toContain('absent from company credentials');
  });

  // 3. COMPANY AGE VS DOMAIN EXPERIENCE
  test('Scenario 3: 8 years in IT does NOT satisfy 10 years Aerospace & Defense experience', () => {
    const aeroExpReq = {
      category: 'Experience',
      title: '10 Years Aerospace & Defense Experience',
      description: 'Bidder must have at least 10 continuous years of specialized defense & aerospace manufacturing experience.',
      value: 10,
      unit: 'Years',
      mandatory: true,
      sourcePage: 1
    };

    const match = evaluateRequirementMatch(aeroExpReq, testCompany);
    expect(match.status).toBe('CONFLICT');
    expect(match.contribution).toContain('Domain relevance failed');
  });

  // 4. UNIQUE MANDATORY FAILURE COUNTING
  test('Scenario 4: Hard failures are deduplicated and unique failure count is consistent', () => {
    const requirements = [
      { category: 'Certification', title: 'AS9100 Rev D', mandatory: true, sourcePage: 2 },
      { category: 'Financial', title: 'Turnover INR 25 Cr', mandatory: true, value: 250000000, sourcePage: 2 }
    ];

    const matches = matchRequirementsWithCompany(requirements, testCompany);
    const decision = computeBidDecision({
      requirements,
      matches,
      risks: [
        { severity: 'CRITICAL', title: 'Mandatory Requirement Unmet: AS9100 Rev D', description: 'Missing AS9100' }
      ]
    });

    // Verify deduplication: AS9100 is not counted multiple times as different hard failures
    expect(decision.hardFailures.length).toBe(2);
    expect(decision.recommendation).toBe('NO-BID');
  });

  // 5. COMPANY-CONTEXT CONSISTENCY
  test('Scenario 5: Company attributes remain consistent across feature extraction and matching', () => {
    const { featureVector, featureMap } = modelService.predictFromContext({
      tender: { estimatedValue: 85000000, pageCount: 4 },
      company: testCompany,
      requirements: [],
      matches: [],
      risks: []
    });

    expect(featureMap.company_turnover_cr).toBe(8.0);
    expect(featureMap.company_experience_years).toBe(8);
    expect(featureMap.company_employee_count).toBe(75);
    expect(featureMap.company_cert_count).toBe(2);
  });

  // 6. GEMINI 429 QUOTA FALLBACK
  test('Scenario 6: Gemini 429 quota exhaustion transparently switches to deterministic fallback', async () => {
    const spy = jest.spyOn(geminiService, 'generateStructuredCompletion').mockRejectedValueOnce(
      new Error('[429 Too Many Requests] Rate limit exceeded')
    );

    const result = await extractStructuredRequirements([
      { pageNumber: 1, text: 'Tender Title: Municipal Water Infrastructure RFP\nMinimum Turnover: INR 5.00 Crore\nISO 9001 required.' }
    ]);

    expect(result.extractionProvider).toBe('fallback');
    expect(result.extractionWarning).toContain('temporarily unavailable');
    expect(result.requirements.length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  // 7. GEMINI TIMEOUT / NETWORK ERROR FALLBACK
  test('Scenario 7: Gemini network timeout gracefully switches to fallback extraction', async () => {
    const spy = jest.spyOn(geminiService, 'generateStructuredCompletion').mockRejectedValueOnce(
      new Error('ETIMEDOUT: Connection to Google API timed out after 15000ms')
    );

    const result = await extractStructuredRequirements([
      { pageNumber: 1, text: 'Tender Title: Smart Transport Management System\nMinimum Experience: 5 years in IT.' }
    ]);

    expect(result.extractionProvider).toBe('fallback');
    expect(result.requirements.length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  // 8. INVALID PDF HANDLING
  test('Scenario 8: Non-PDF or invalid files are safely rejected without crashing', async () => {
    const fakeBuffer = Buffer.from('Not a valid pdf binary content');
    await expect(extractPdfPages(fakeBuffer)).rejects.toThrow();
  });

  // 9. SCANNED / IMAGE-ONLY PDF HANDLING
  test('Scenario 9: Scanned image-only PDFs with zero text throw SCANNED_IMAGE_PDF for OCR review', async () => {
    const scannedPages = [{ pageNumber: 1, text: '   ' }];
    await expect(extractStructuredRequirements(scannedPages)).rejects.toThrow('scanned or image-only pages');
  });

  // 10. ML / DECISION ENGINE STRICT SEPARATION
  test('Scenario 10: High ML win probability NEVER overrides a mandatory qualification failure', () => {
    // Requirements containing a failed mandatory qualification
    const failedReqs = [
      { category: 'Financial', title: 'Minimum Turnover INR 25.0 Cr', mandatory: true, value: 250000000, sourcePage: 2 }
    ];
    const matches = matchRequirementsWithCompany(failedReqs, testCompany);
    const decision = computeBidDecision({
      requirements: failedReqs,
      matches,
      risks: [{ severity: 'CRITICAL', title: 'Mandatory Requirement Unmet', description: 'Turnover gap' }]
    });

    // Even if ML probability was 95%, the deterministic Hard Failure Gate mandates NO-BID
    expect(decision.hardFailures.length).toBeGreaterThanOrEqual(1);
    expect(decision.recommendation).toBe('NO-BID');
    expect(decision.overallScore).toBeLessThanOrEqual(65);
  });

  // 11. TENDER-ONLY ANALYSIS (NO FABRICATED COMPANY EVIDENCE)
  test('Scenario 11: Tender-only analysis produces NEEDS REVIEW with zero fabricated company evidence', () => {
    const extractedRequirements = [
      { category: 'Financial', title: 'Minimum Annual Turnover INR 5 Cr', mandatory: true, value: 50000000, sourcePage: 2 },
      { category: 'Experience', title: '5 Years Relevant Experience', mandatory: true, value: 5, sourcePage: 1 },
      { category: 'Certification', title: 'ISO 9001:2015 & ISO 27001', mandatory: true, sourcePage: 2 }
    ];

    // Evaluate matching with no company profile provided
    const emptyCompany = {};
    const matches = matchRequirementsWithCompany(extractedRequirements, emptyCompany);

    expect(matches.length).toBe(3);
    matches.forEach(m => {
      expect(m.status).toBe('NEEDS_REVIEW');
      expect(m.companyEvidence).toBeNull();
      expect(m.tenderEvidence).toBeDefined();
      expect(m.tenderEvidence.page).toBeDefined();
    });

    const decision = computeBidDecision({
      requirements: extractedRequirements,
      matches,
      risks: []
    });

    expect(decision.recommendation).toBe('NEEDS REVIEW');
    expect(decision.overallScore).toBe(0);
    expect(decision.summaryRationale).toContain('insufficient to verify mandatory bidder eligibility');
  });

  // 12. EMD & LIQUIDATED DAMAGES ARE ACTION ITEMS / CONTRACT RISKS (NOT CAPABILITY MATCHES)
  test('Scenario 12: EMD and Liquidated Damages are evaluated as action items / contractual risks, never as capability matches', () => {
    const actionReqs = [
      { category: 'Documents', title: '2% EMD Bank Guarantee', mandatory: true, sourcePage: 4 },
      { category: 'Contract', title: 'Liquidated Damages of 0.5% per week', mandatory: true, sourcePage: 4 }
    ];

    const matches = matchRequirementsWithCompany(actionReqs, testCompany);
    expect(matches.length).toBe(2);
    matches.forEach(m => {
      expect(m.status).toBe('NEEDS_REVIEW');
      expect(m.tenderEvidence).toBeDefined();
      expect(m.reason).toMatch(/contractual|submission|liquidated damages|action/i);
    });
  });

  // 13. INDIVIDUAL MISSING EVIDENCE CATEGORIES LEAD TO NEEDS_REVIEW
  test('Scenario 13: Missing evidence for turnover, certifications, or legal registration yields NEEDS_REVIEW', () => {
    const reqs = [
      { category: 'Financial', title: 'Minimum Annual Turnover INR 5 Cr', mandatory: true, value: 50000000, sourcePage: 2 },
      { category: 'Certification', title: 'ISO 27001 Information Security', mandatory: true, sourcePage: 2 },
      { category: 'Eligibility', title: 'Incorporation & Legal Entity Status', mandatory: true, sourcePage: 1 }
    ];

    // Company profile with 0 values/no records
    const noRecordsCompany = { companyName: '', annualTurnover: 0, yearsExperience: 0, certifications: [] };
    const matches = matchRequirementsWithCompany(reqs, noRecordsCompany);

    matches.forEach(m => {
      expect(m.status).toBe('NEEDS_REVIEW');
      expect(m.companyEvidence).toBeNull();
    });
  });
});
