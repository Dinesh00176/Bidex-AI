const path = require('path');
const { extractPdfPages } = require('../services/pdfService');
const { matchRequirementsWithCompany } = require('../services/matchingService');
const { evaluateRisks } = require('../services/riskService');
const { computeBidDecision } = require('../services/decisionService');
const { modelService } = require('../services/modelService');

describe('End-to-End Procurement Tender Decision Benchmark Tests', () => {
  // Demo Company: Apex Digital Infrastructure Pvt Ltd
  const demoCompany = {
    companyName: 'Apex Digital Infrastructure Pvt Ltd',
    industry: 'Information Technology & Smart Infrastructure',
    yearsExperience: 8,
    annualTurnover: 80000000, // ₹8.0 Crore
    currency: 'INR',
    employeeCount: 75,
    certifications: ['ISO 9001:2015', 'ISO/IEC 27001'],
    technicalSkills: [
      'AWS',
      'Cloud Architecture',
      'IoT',
      'Python',
      'Java',
      'Spring Boot',
      'React',
      'Node.js',
      'REST APIs',
      'Microservices',
      'Docker',
      'Kubernetes',
      'MongoDB'
    ],
    services: [
      'Cloud infrastructure',
      'IoT platform development',
      'Smart city solutions',
      'Enterprise software',
      'Cybersecurity'
    ],
    documents: [
      {
        title: 'ISO 27001 & ISO 9001 Accredited Certificates',
        docType: 'ISO Certificate',
        extractedSummary: 'ISO 9001:2015 Quality Management and ISO/IEC 27001 Information Security verified.'
      },
      {
        title: 'Audited Financial Statements FY23-FY25',
        docType: 'Audit Report',
        extractedSummary: 'Audited annual turnover of INR 8.00 Crore with positive net worth and clean compliance.'
      }
    ]
  };

  // TEST 1: Good-Fit Smart City IoT Tender
  test('TEST 1: Good-Fit Smart City IoT Tender results in BID recommendation and high ML win probability', async () => {
    const goodPdfPath = path.resolve(__dirname, '../sample_documents/Bidexa_Good_Fit_Smart_City_IoT_Tender.pdf');
    const { pageCount, fullText } = await extractPdfPages(goodPdfPath);

    expect(pageCount).toBe(4);
    expect(fullText.length).toBeGreaterThan(1000);

    const goodTender = {
      title: 'Smart City Integrated IoT Command & Cloud Infrastructure Platform',
      organization: 'Smart Urban Infrastructure Authority (SUIA)',
      referenceNumber: 'SUIA/2026/IOT-RFP-098',
      estimatedValue: 85000000,
      pageCount: 4,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const goodRequirements = [
      { category: 'Eligibility', title: '5 Years Commercial Operation', mandatory: true, value: 5, unit: 'Years', sourcePage: 1 },
      { category: 'Financial', title: 'Minimum Annual Turnover INR 5.0 Cr', mandatory: true, value: 50000000, unit: 'INR', sourcePage: 2 },
      { category: 'Financial', title: 'Positive Net Worth', mandatory: true, sourcePage: 2 },
      { category: 'Certification', title: 'ISO 9001 and ISO 27001', mandatory: true, sourcePage: 2 },
      { category: 'Technical', title: 'Java, Spring Boot, React, Node.js & AWS', mandatory: true, sourcePage: 3 },
      { category: 'Technical', title: '10,000 Edge IoT Nodes & 99.9% SLA', mandatory: true, value: 10000, sourcePage: 3 },
      { category: 'Staffing', title: 'PMP Project Manager & 40+ Staff', mandatory: true, value: 40, sourcePage: 4 },
      { category: 'Timeline', title: 'Project Commissioning within 180 Days', mandatory: true, value: 180, sourcePage: 4 },
      { category: 'Documents', title: '2% EMD Bank Guarantee', mandatory: true, sourcePage: 4 }
    ];

    const matches = matchRequirementsWithCompany(goodRequirements, demoCompany);
    const risks = evaluateRisks({ requirements: goodRequirements, matches, tender: goodTender, company: demoCompany });
    const decision = computeBidDecision({ requirements: goodRequirements, matches, risks });
    const mlResult = modelService.predictFromContext({
      tender: goodTender,
      company: demoCompany,
      requirements: goodRequirements,
      matches,
      risks
    });

    // Assertions
    expect(decision.recommendation).toBe('BID');
    expect(decision.overallScore).toBeGreaterThanOrEqual(80);
    expect(decision.hardFailures.length).toBe(0);

    expect(mlResult.available).toBe(true);
    expect(mlResult.probability).toBeGreaterThan(0.70);
    expect(mlResult.predictedOutcome).toBe('HIGH_WIN_PROBABILITY');
    expect(mlResult.positiveFactors.length).toBeGreaterThan(0);
  });

  // TEST 2: Bad-Fit Aerospace Manufacturing Tender
  test('TEST 2: Bad-Fit Aerospace Manufacturing Tender results in NO-BID recommendation due to mandatory failures', async () => {
    const badPdfPath = path.resolve(__dirname, '../sample_documents/Bidexa_Bad_Fit_Aerospace_Manufacturing_Tender.pdf');
    const { pageCount, fullText } = await extractPdfPages(badPdfPath);

    expect(pageCount).toBe(4);
    expect(fullText.length).toBeGreaterThan(1000);

    const badTender = {
      title: 'Aerospace Precision Digitalization & Advanced Manufacturing Execution System (MES)',
      organization: 'State Aerospace & Defense Corporation (HAL/SADC)',
      referenceNumber: 'HAL/2026/AERO-MES-404',
      estimatedValue: 120000000,
      pageCount: 4,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
    };

    const badRequirements = [
      { category: 'Eligibility', title: '10 Years Aerospace & Defense Experience', mandatory: true, value: 10, unit: 'Years', sourcePage: 1 },
      { category: 'Financial', title: 'Minimum Aerospace Turnover INR 25.0 Cr', mandatory: true, value: 250000000, unit: 'INR', sourcePage: 2 },
      { category: 'Certification', title: 'Mandatory AS9100 Rev D Certification', mandatory: true, sourcePage: 2 },
      { category: 'Certification', title: 'ISO 14001 Environmental Management', mandatory: true, sourcePage: 2 },
      { category: 'Technical', title: '5-Axis CNC Titanium Milling Machine Interfacing', mandatory: true, sourcePage: 3 },
      { category: 'Technical', title: 'AS9102 First Article Inspection & ITAR / DO-178C', mandatory: true, sourcePage: 3 },
      { category: 'Staffing', title: 'Lead Avionics Engineer (15+ Yrs Aerospace)', mandatory: true, value: 15, sourcePage: 4 },
      { category: 'Timeline', title: 'Rapid Prototype Delivery within 60 Days', mandatory: true, value: 60, sourcePage: 4 }
    ];

    const matches = matchRequirementsWithCompany(badRequirements, demoCompany);
    const risks = evaluateRisks({ requirements: badRequirements, matches, tender: badTender, company: demoCompany });
    const decision = computeBidDecision({ requirements: badRequirements, matches, risks });
    const mlResult = modelService.predictFromContext({
      tender: badTender,
      company: demoCompany,
      requirements: badRequirements,
      matches,
      risks
    });

    // Assertions
    expect(decision.recommendation).toBe('NO-BID');
    expect(decision.overallScore).toBeLessThanOrEqual(25);
    expect(decision.hardFailures.length).toBeGreaterThanOrEqual(3);

    // Hard compliance gate strictly prevents BID
    expect(decision.hardFailures.some(f => f.includes('Turnover') || f.includes('Turnover'))).toBe(true);

    expect(mlResult.available).toBe(true);
    expect(mlResult.probability).toBeLessThan(0.40);
    expect(mlResult.predictedOutcome).toBe('LOW_WIN_PROBABILITY');
    expect(mlResult.negativeFactors.length).toBeGreaterThan(0);
  });
});
