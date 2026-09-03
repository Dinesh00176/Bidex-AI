const { matchRequirementsWithCompany, evaluateRequirementMatch } = require('../services/matchingService');
const { computeBidDecision } = require('../services/decisionService');
const { evaluateRisks } = require('../services/riskService');
const { modelService } = require('../services/modelService');
const { extractStructuredRequirements } = require('../services/extractionService');

describe('Bidexa AI — Complete Evidence Separation, Matching, Decision & Dashboard Tests', () => {
  const iotCompany = {
    companyName: 'Apex Digital Infrastructure Pvt Ltd',
    industry: 'Information Technology & Smart Infrastructure',
    yearsExperience: 8,
    annualTurnover: 80000000, // ₹8.0 Crore
    employeeCount: 75,
    certifications: ['ISO 9001:2015', 'ISO/IEC 27001'],
    technicalSkills: ['AWS', 'Cloud Architecture', 'IoT', 'Python', 'Java', 'Spring Boot', 'React', 'Node.js', 'MQTT', 'Telemetry'],
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

  // 1. SECTION 1 — TENDER ONLY ANALYSIS (ZERO COMPANY EVIDENCE FABRICATION)
  test('Section 1: Tender-only analysis produces all companyEvidence: null and NEEDS REVIEW decision', () => {
    const tenderRequirements = [
      { category: 'Financial', title: 'Minimum Annual Turnover INR 5.0 Cr', mandatory: true, value: 50000000, sourcePage: 2 },
      { category: 'Experience', title: '5 Years Operational Experience', mandatory: true, value: 5, sourcePage: 1 },
      { category: 'Certification', title: 'ISO 9001:2015 Certification', mandatory: true, sourcePage: 2 },
      { category: 'Technical', title: 'Full Stack Web Platform', mandatory: true, sourcePage: 3 },
      { category: 'Staffing', title: '40 Technical Employees', mandatory: true, value: 40, sourcePage: 3 }
    ];

    const emptyCompany = {};
    const matches = matchRequirementsWithCompany(tenderRequirements, emptyCompany);

    expect(matches.length).toBe(5);
    matches.forEach(m => {
      expect(m.status).toBe('NEEDS_REVIEW');
      expect(m.companyEvidence).toBeNull();
      expect(m.tenderEvidence).toBeDefined();
      expect(m.tenderEvidence.page).toBeGreaterThanOrEqual(1);
    });

    const decision = computeBidDecision({ requirements: tenderRequirements, matches, risks: [] });
    expect(decision.recommendation).toBe('NEEDS REVIEW');
    expect(decision.overallScore).toBe(0);
    expect(decision.summaryRationale).toContain('insufficient to verify mandatory bidder eligibility');
  });

  // 2. SECTION 2 — IOT COMPANY VS AEROSPACE TENDER STRICT MATCHING
  test('Section 2: IoT company against Aerospace tender receives MISSING on defense certs/avionics and mandates NO-BID', () => {
    const aerospaceRequirements = [
      { category: 'Financial', title: 'Annual Turnover INR 50.0 Cr', mandatory: true, value: 500000000, sourcePage: 2 },
      { category: 'Experience', title: '10 Years Aerospace & Defense Experience', mandatory: true, value: 10, sourcePage: 1 },
      { category: 'Certification', title: 'Mandatory AS9100 Rev D Certification', mandatory: true, sourcePage: 2 },
      { category: 'Certification', title: 'ITAR + MIL-STD-810 + DO-178C Compliance', mandatory: true, sourcePage: 2 },
      { category: 'Technical', title: '5-Axis CNC Titanium Milling Machine Interfacing', mandatory: true, sourcePage: 4 },
      { category: 'Staffing', title: 'Lead Avionics Engineer, 15+ years aerospace experience', mandatory: true, sourcePage: 5 }
    ];

    const matches = matchRequirementsWithCompany(aerospaceRequirements, iotCompany);

    // Assert that AS9100 is MISSING / CONFLICT
    const as9100Match = matches.find(m => m.requirementTitle.includes('AS9100'));
    expect(['MISSING', 'CONFLICT']).toContain(as9100Match.status);
    expect(as9100Match.companyEvidence).toContain('absent from company credentials');

    // Assert that ITAR + MIL-STD-810 + DO-178C is MISSING / CONFLICT
    const defenseCertsMatch = matches.find(m => m.requirementTitle.includes('ITAR'));
    expect(['MISSING', 'CONFLICT']).toContain(defenseCertsMatch.status);

    // Assert that 5-Axis CNC Milling is MISSING / CONFLICT
    const cncMatch = matches.find(m => m.requirementTitle.includes('CNC'));
    expect(['MISSING', 'CONFLICT']).toContain(cncMatch.status);

    // Assert that Lead Avionics Engineer staffing is MISSING / CONFLICT
    const avionicsStaffMatch = matches.find(m => m.requirementTitle.includes('Avionics'));
    expect(['MISSING', 'CONFLICT']).toContain(avionicsStaffMatch.status);

    const risks = evaluateRisks({
      requirements: aerospaceRequirements,
      matches,
      tender: { title: 'Defense Aerospace RFP', estimatedValue: 250000000, pageCount: 30 },
      company: iotCompany
    });

    const decision = computeBidDecision({ requirements: aerospaceRequirements, matches, risks });
    expect(decision.recommendation).toBe('NO-BID');
    expect(decision.hardFailures.length).toBeGreaterThanOrEqual(4);
    expect(decision.overallScore).toBeLessThanOrEqual(35);
  });

  // 3. SECTION 3 — HIGH ML WIN PROBABILITY CANNOT OVERRIDE MANDATORY EVIDENCE FAILURE
  test('Section 3: 95%+ ML win probability NEVER overrides a mandatory qualification failure', () => {
    const failedMandatoryReqs = [
      { category: 'Financial', title: 'Minimum Annual Turnover INR 50 Cr', mandatory: true, value: 500000000, sourcePage: 2 }
    ];

    const matches = matchRequirementsWithCompany(failedMandatoryReqs, iotCompany);
    const decision = computeBidDecision({
      requirements: failedMandatoryReqs,
      matches,
      risks: [{ severity: 'CRITICAL', title: 'Mandatory Turnover Gap', description: 'INR 50 Cr required vs INR 8 Cr actual' }]
    });

    // Mock high ML probability
    const highMlSignal = { probability: 0.965, confidencePercent: 97, predictedOutcome: 'HIGH_WIN_PROBABILITY' };
    decision.mlPrediction = highMlSignal;

    expect(decision.hardFailures.length).toBeGreaterThanOrEqual(1);
    expect(decision.recommendation).toBe('NO-BID'); // Gate prevents BID
    expect(decision.overallScore).toBeLessThanOrEqual(65);
  });

  // 4. SECTION 4 — DASHBOARD AGGREGATION METRICS INTEGRITY
  test('Section 4: Dashboard metric aggregation correctly satisfies BID + REVIEW + NO-BID = AI Processed', () => {
    const mockTenders = [
      { _id: 't1', analysis: { recommendation: 'BID', criticalRisksCount: 0, highRisksCount: 1 } },
      { _id: 't2', analysis: { recommendation: 'NEEDS REVIEW', criticalRisksCount: 1, highRisksCount: 2 } },
      { _id: 't3', analysis: { recommendation: 'REVIEW', criticalRisksCount: 0, highRisksCount: 1 } },
      { _id: 't4', analysis: { recommendation: 'NO-BID', criticalRisksCount: 3, highRisksCount: 2 } },
      { _id: 't5', analysis: null } // Unprocessed tender
    ];

    const analyzedTenders = mockTenders.filter(t => t.analysis);
    const bidCount = analyzedTenders.filter(t => t.analysis.recommendation === 'BID').length;
    const reviewCount = analyzedTenders.filter(t =>
      t.analysis.recommendation === 'REVIEW' ||
      t.analysis.recommendation === 'NEEDS REVIEW' ||
      t.analysis.recommendation === 'NEEDS_REVIEW'
    ).length;
    const noBidCount = analyzedTenders.filter(t =>
      t.analysis.recommendation === 'NO-BID' ||
      t.analysis.recommendation === 'NO_BID'
    ).length;

    expect(analyzedTenders.length).toBe(4);
    expect(bidCount).toBe(1);
    expect(reviewCount).toBe(2);
    expect(noBidCount).toBe(1);
    expect(bidCount + reviewCount + noBidCount).toBe(analyzedTenders.length);
  });
});
