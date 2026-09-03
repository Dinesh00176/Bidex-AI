const { extractStructuredRequirements } = require('../services/extractionService');
const { matchRequirementsWithCompany } = require('../services/matchingService');
const { evaluateRisks } = require('../services/riskService');
const { computeBidDecision } = require('../services/decisionService');
const { modelService } = require('../services/modelService');
const geminiService = require('../services/geminiService');

describe('Gemini Quota (429) & Rate Limit Resilient Fallback Tests', () => {
  const demoCompany = {
    companyName: 'Apex Digital Infrastructure Pvt Ltd',
    industry: 'Information Technology & Smart Infrastructure',
    yearsExperience: 8,
    annualTurnover: 80000000,
    currency: 'INR',
    employeeCount: 75,
    certifications: ['ISO 9001:2015', 'ISO/IEC 27001'],
    technicalSkills: ['AWS', 'Cloud Architecture', 'IoT', 'Python', 'Java', 'Spring Boot', 'React', 'Node.js', 'REST APIs', 'Microservices', 'Docker', 'Kubernetes', 'MongoDB'],
    services: ['Cloud infrastructure', 'IoT platform development', 'Smart city solutions', 'Enterprise software', 'Cybersecurity']
  };

  const samplePages = [
    {
      pageNumber: 1,
      text: `SMART URBAN INFRASTRUCTURE AUTHORITY (SUIA)
REQUEST FOR PROPOSAL (RFP)
Tender Title: Smart City Integrated IoT Command & Cloud Infrastructure Platform
Reference Number: SUIA/2026/IOT-RFP-098
Estimated Project Value: INR 8.50 Crore (INR 85,000,000)
1.1 Statutory Eligibility: Registered entity under Companies Act in continuous operation for at least 5 years.
1.2 Non-Blacklisting: Bidder must submit affidavit confirming not blacklisted.`
    },
    {
      pageNumber: 2,
      text: `SECTION 2: FINANCIAL & CERTIFICATION REQUIREMENTS
2.1 Financial Turnover: Minimum average annual turnover of not less than INR 5.00 Crore during preceding 3 fiscal years.
2.2 Positive Net Worth certified by CA.
2.3 Certifications: Mandatory ISO 9001:2015 and ISO 27001 certifications.`
    },
    {
      pageNumber: 3,
      text: `SECTION 3: TECHNICAL ARCHITECTURE
3.1 Technology Stack: Java, Spring Boot, React, Node.js, and AWS cloud microservices.
3.2 Ingestion: Platform must scale to 10,000 edge IoT sensor devices with 99.9% uptime SLA.`
    },
    {
      pageNumber: 4,
      text: `SECTION 4: STAFFING & TIMELINE
4.1 Key Personnel: Full-time PMP certified Project Manager and 40+ engineering headcount.
4.2 Project Schedule: Commissioning within 180 Days from contract date.
4.3 EMD: 2% EMD Bank Guarantee.
4.4 Liquidated Damages: 0.5% per week delay up to 10% maximum.`
    }
  ];

  test('Gemini HTTP 429 Quota Exceeded error gracefully triggers deterministic fallback and completes pipeline', async () => {
    // Spy on generateStructuredCompletion and simulate Gemini 429 Quota Exceeded
    const spy = jest.spyOn(geminiService, 'generateStructuredCompletion').mockImplementation(async () => {
      const err = new Error('GoogleGenerativeAI Error: [429 Too Many Requests] Resource has been exhausted (e.g. check quota).');
      err.status = 429;
      err.code = 'RESOURCE_EXHAUSTED';
      throw err;
    });

    // 1. Extraction under 429 condition
    const extractionResult = await extractStructuredRequirements(samplePages, {
      title: 'Smart City Integrated IoT Command & Cloud Infrastructure Platform',
      organization: 'Smart Urban Infrastructure Authority (SUIA)',
      referenceNumber: 'SUIA/2026/IOT-RFP-098'
    });

    // Verify fallback metadata
    expect(extractionResult).toBeDefined();
    expect(extractionResult.extractionProvider).toBe('fallback');
    expect(extractionResult.extractionWarning).toContain('temporarily unavailable');
    expect(Array.isArray(extractionResult.requirements)).toBe(true);
    expect(extractionResult.requirements.length).toBeGreaterThanOrEqual(8);

    // Verify source pages are preserved
    extractionResult.requirements.forEach(req => {
      expect(req.sourcePage).toBeGreaterThanOrEqual(1);
      expect(req.sourcePage).toBeLessThanOrEqual(4);
      expect(req.category).toBeDefined();
    });

    // 2. Downstream matching and decision pipeline continues seamlessly
    const tenderMeta = extractionResult.tenderOverview;
    const matches = matchRequirementsWithCompany(extractionResult.requirements, demoCompany);
    const risks = evaluateRisks({
      requirements: extractionResult.requirements,
      matches,
      tender: tenderMeta,
      company: demoCompany
    });
    const decision = computeBidDecision({
      requirements: extractionResult.requirements,
      matches,
      risks
    });
    const mlPrediction = modelService.predictFromContext({
      tender: tenderMeta,
      company: demoCompany,
      requirements: extractionResult.requirements,
      matches,
      risks
    });

    // 3. Final verification: Full pipeline succeeds without crashing
    expect(decision.recommendation).toBe('BID');
    expect(decision.overallScore).toBeGreaterThanOrEqual(80);
    expect(mlPrediction.available).toBe(true);
    expect(mlPrediction.probability).toBeGreaterThan(0.70);

    // Restore original implementation
    spy.mockRestore();
  });
});
