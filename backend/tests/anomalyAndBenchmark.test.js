const { matchRequirementsWithCompany, evaluateRequirementMatch } = require('../services/matchingService');
const { computeBidDecision } = require('../services/decisionService');
const { evaluateRisks } = require('../services/riskService');

describe('Enhanced AI Evaluator & Anomaly Edge-Case Benchmark Tests', () => {
  const establishedDeveloperCompany = {
    companyName: 'Apex CyberTech Solutions',
    annualTurnover: 65000000, // ₹6.50 Crore
    yearsExperience: 7,
    employeeCount: 80,
    industry: 'Information Technology & Software Services',
    certifications: ['ISO 9001:2015', 'ISO 27001:2022'],
    technicalSkills: ['Java', 'Spring Boot', 'React', 'Node.js', 'MySQL', 'Python', 'AWS', 'MongoDB'],
    services: ['Software Development', 'Web Applications', 'Cloud Solutions', 'Database Engineering'],
    documents: [
      {
        title: 'Full Stack Engineering Credentials',
        docType: 'Capability Statement',
        extractedSummary: 'Certified engineering team in Java, Spring Boot, MySQL schema architecture, React frontend CRUD workflows.'
      }
    ]
  };

  // TEST 1: The "Good" Test File (RFQ_Pet_Adoption_Platform_Backend.txt)
  test('BENCHMARK GOOD: RFQ_Pet_Adoption_Platform_Backend matches developer credentials with strong BID decision', () => {
    const goodTender = {
      title: 'RFQ_Pet_Adoption_Platform_Backend.txt',
      organization: 'City Animal Shelter & Welfare Society',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    };

    const goodRequirements = [
      {
        category: 'Technical',
        title: 'Java & Spring Boot Backend',
        description: 'Vendor must develop a full-stack web application backend utilizing Java and Spring Boot.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Technical',
        title: 'Relational Database (MySQL)',
        description: 'The application must connect to a relational database using a highly structured MySQL schema to manage user and animal data.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Technical',
        title: 'Frontend CRUD Web Interface',
        description: 'The vendor must deliver a standard web frontend interface capable of executing full CRUD operations for adoption listings.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Timeline',
        title: 'Delivery Timeline (6 Months)',
        description: 'Delivery timeline is 6 months from the date of signing.',
        value: 180,
        unit: 'Days',
        mandatory: true,
        sourcePage: 1
      }
    ];

    const matches = matchRequirementsWithCompany(goodRequirements, establishedDeveloperCompany);
    const risks = evaluateRisks({ requirements: goodRequirements, matches, tender: goodTender, company: establishedDeveloperCompany });
    const decision = computeBidDecision({ requirements: goodRequirements, matches, risks });

    // Assertions
    expect(decision.recommendation).toBe('BID');
    expect(decision.overallScore).toBeGreaterThanOrEqual(80);
    expect(decision.hardFailures.length).toBe(0);

    // Verify all technical requirements matched
    matches.forEach(m => {
      expect(['MATCH', 'PARTIAL']).toContain(m.status);
    });
  });

  // TEST 2: The "Bad" Test File (URGENT_Worst_Pet_Platform_Ever.txt - Edge-Case Benchmark)
  test('BENCHMARK BAD: URGENT_Worst_Pet_Platform_Ever is flagged as CRITICAL_ANOMALY, scores 0, and mandates NO-BID', () => {
    const badTender = {
      title: 'URGENT_Worst_Pet_Platform_Ever.txt',
      organization: 'Anonymous Irrational Entity',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000) // Delivered yesterday
    };

    const badRequirements = [
      {
        category: 'Technical',
        title: 'Binary Coding via Telepathic Neural Interface',
        description: 'Vendor must code the entire Spring Boot application using only binary via a telepathic neural interface.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Technical',
        title: 'Time-Traveling MySQL Database to 1995',
        description: 'We need a MySQL database that travels back in time to 1995 to backup our data on floppy disks.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Staffing',
        title: 'Physical Metamorphosis into Canine',
        description: 'The developer must also physically transform into a dog to understand the user experience.',
        mandatory: true,
        sourcePage: 1
      },
      {
        category: 'Timeline',
        title: 'Impossible Yesterday Delivery Schedule',
        description: 'Project must be delivered yesterday. No exceptions.',
        mandatory: true,
        sourcePage: 1
      }
    ];

    const matches = matchRequirementsWithCompany(badRequirements, establishedDeveloperCompany);
    const risks = evaluateRisks({ requirements: badRequirements, matches, tender: badTender, company: establishedDeveloperCompany });
    const decision = computeBidDecision({ requirements: badRequirements, matches, risks });

    // Strict Reality & Anomaly Assertions
    expect(decision.recommendation).toBe('NO-BID');
    expect(decision.overallScore).toBe(0);
    expect(decision.hardFailures.length).toBeGreaterThan(0);

    // Verify all 4 requirements are flagged as CRITICAL_ANOMALY / CONFLICT
    matches.forEach(m => {
      expect(m.status).toBe('CONFLICT');
      expect(m.reason).toContain('CRITICAL_ANOMALY');
    });

    // Verify Tone & Intent check flagged organizational risk
    const anomalyRisk = risks.find(r => r.title.includes('ORGANIZATIONAL_RISK') || r.title.includes('CRITICAL_ANOMALY'));
    expect(anomalyRisk).toBeDefined();
    expect(anomalyRisk.severity).toBe('CRITICAL');
  });

  // TEST 3: Strict Semantic Boundary Test
  test('Strict Semantic Boundary: Years in business does not satisfy time machine requirement', () => {
    const timeMachineReq = {
      category: 'Technical',
      title: 'Time Machine Hardware Architecture',
      description: 'Vendor must provide operational time machine capability.',
      mandatory: true,
      sourcePage: 1
    };

    const match = evaluateRequirementMatch(timeMachineReq, establishedDeveloperCompany);
    expect(match.status).toBe('CONFLICT');
    expect(match.reason).toContain('CRITICAL_ANOMALY');
  });
});
