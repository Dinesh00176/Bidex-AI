/**
 * Synthetic Demo Dataset for Instant Evaluation & Automated Testing
 * Tagged clearly with [DEMO]
 */

const DEMO_USER = {
  name: 'Alex Vance (Lead Procurement Engineer)',
  email: 'demo@bidwise.ai',
  password: 'demoPassword123!',
  role: 'procurement_lead'
};

const DEMO_COMPANY = {
  companyName: 'Apex Digital Infrastructure Pvt Ltd [DEMO]',
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
  locations: ['New Delhi', 'Bengaluru', 'Mumbai', 'Hyderabad'],
  previousProjects: [
    {
      title: 'Municipal Smart Traffic Telemetry & Surveillance Grid',
      client: 'State Urban Development Authority',
      value: 38000000,
      currency: 'INR',
      year: 2024,
      category: 'Smart City IoT',
      description: 'Deployed 1,200 edge video sensors and centralized GIS command platform with 99.95% SLA compliance.'
    },
    {
      title: 'State Power Distribution Real-time SCADA Monitoring',
      client: 'Regional Electricity Board',
      value: 52000000,
      currency: 'INR',
      year: 2023,
      category: 'Infrastructure Telemetry',
      description: 'Ingested high-frequency smart meter data across 40 substations with automated fault isolation.'
    }
  ]
};

const DEMO_TENDER_PAGES = [
  {
    pageNumber: 1,
    text: `REQUEST FOR PROPOSAL (RFP) - DEMO
Tender Reference No: SUIA/2026/IOT-RFP-098
Issuing Organization: Smart Urban Infrastructure Authority (SUIA)
Title: Supply, Configuration, Commissioning and 3-Year Maintenance of Integrated IoT Command & Control Platform.
Estimated Contract Value: INR 6,50,00,000 (INR 6.50 Crore)
Submission Deadline: 25 Days from NIT publication.
1. INVITATION TO BID: Bids are invited from experienced System Integrators under Two-Cover Electronic Tender System (Cover 1: Technical & Fee Bid, Cover 2: Commercial Price Bid).`,
    wordCount: 75
  },
  {
    pageNumber: 2,
    text: `SECTION II: PRE-QUALIFICATION & ELIGIBILITY CRITERIA
2.1 Legal Status: The bidder must be an incorporated legal company in operations for not less than 5 years as of the bid closing date.
2.2 Financial Capability: The bidder shall have an Average Annual Financial Turnover of not less than INR 5.00 Crore during the last 3 audited financial years (FY 2022-23, 2023-24, 2024-25).
2.3 Net Worth: Bidder must possess positive net worth in each of the last 3 financial years certified by a Chartered Accountant.
2.4 Earnest Money Deposit (EMD): Irrevocable Bank Guarantee of 2% of estimated project value (INR 13,00,000) valid for 180 days.`,
    wordCount: 95
  },
  {
    pageNumber: 3,
    text: `SECTION III: TECHNICAL & CERTIFICATION REQUIREMENTS
3.1 Quality & Security Certifications: Bidder must hold valid certifications in ISO 9001:2015 and ISO/IEC 27001:2013 (or 2022) on the submission date.
3.2 Capability Appraisal: Bidder possessing CMMI Level 3 or higher shall be accorded preference in technical scoring.
3.3 Technical SLA: The proposed IoT Command Platform must deliver 99.9% uptime SLA with active-passive disaster recovery failover under 5 minutes.
3.4 Sensor Concurrency: Telemetry ingestion pipeline must scale to at least 10,000 edge IoT nodes with message latency under 500 milliseconds.`,
    wordCount: 88
  },
  {
    pageNumber: 4,
    text: `SECTION IV: TIMELINE, STAFFING & CONTRACTUAL CONDITIONS
4.1 Implementation Schedule: Phase 1 Pilot within 90 days; Full Commissioning across all city zones within 180 days from Notice to Proceed (NTP).
4.2 Key Personnel: Dedicated Full-Time Project Director with PMP/PRINCE2 credentials and Lead Solution Architect with 8+ years experience.
4.3 Liquidated Damages (LD): Delay in achieving milestone deliverables shall incur liquidated damages at 0.5% per week of delay, subject to a maximum ceiling of 10% of total contract value.
4.4 Warranty & AMC: Comprehensive 3-year warranty with 4-hour on-site incident response for Severity-1 outages.`,
    wordCount: 92
  }
];

const DEMO_REQUIREMENTS = [
  {
    category: 'Eligibility',
    title: 'Legal Incorporation Status',
    description: 'Registered company in continuous operation for at least 5 years.',
    value: 5,
    unit: 'Years',
    mandatory: true,
    sourcePage: 2,
    sourceText: 'The bidder must be an incorporated legal company in operations for not less than 5 years as of the bid closing date.',
    confidence: 0.98
  },
  {
    category: 'Financial',
    title: 'Minimum Annual Turnover',
    description: 'Average annual turnover of at least INR 5.00 Crore over the last 3 fiscal years.',
    value: 50000000,
    unit: 'INR',
    mandatory: true,
    sourcePage: 2,
    sourceText: 'The bidder shall have an Average Annual Financial Turnover of not less than INR 5.00 Crore during the last 3 audited financial years.',
    confidence: 0.96
  },
  {
    category: 'Experience',
    title: 'Prior Smart Infrastructure Track Record',
    description: 'Proven track record of executing similar large-scale IoT / SCADA integration projects.',
    value: 5,
    unit: 'Years Experience',
    mandatory: true,
    sourcePage: 1,
    sourceText: 'Bids are invited from experienced System Integrators under Two-Cover Electronic Tender System.',
    confidence: 0.92
  },
  {
    category: 'Certification',
    title: 'ISO 27001 Information Security Management',
    description: 'Mandatory valid ISO/IEC 27001 certification for data security compliance.',
    value: 'ISO/IEC 27001',
    unit: 'Certification',
    mandatory: true,
    sourcePage: 3,
    sourceText: 'Bidder must hold valid certifications in ISO 9001:2015 and ISO/IEC 27001:2013 on the submission date.',
    confidence: 0.97
  },
  {
    category: 'Certification',
    title: 'ISO 9001 Quality Management System',
    description: 'Mandatory ISO 9001 certification for quality delivery frameworks.',
    value: 'ISO 9001:2015',
    unit: 'Certification',
    mandatory: true,
    sourcePage: 3,
    sourceText: 'Bidder must hold valid certifications in ISO 9001:2015 and ISO/IEC 27001:2013 on the submission date.',
    confidence: 0.97
  },
  {
    category: 'Technical',
    title: 'High Availability & 99.9% Uptime SLA',
    description: 'Platform SLA requiring 99.9% availability with automated DR failover under 5 minutes.',
    value: 99.9,
    unit: '% SLA',
    mandatory: true,
    sourcePage: 3,
    sourceText: 'The proposed IoT Command Platform must deliver 99.9% uptime SLA with active-passive disaster recovery failover under 5 minutes.',
    confidence: 0.94
  },
  {
    category: 'Technical',
    title: '10,000+ Edge IoT Sensor Ingestion',
    description: 'Ingestion pipeline handling 10k edge nodes with sub-500ms latency.',
    value: 10000,
    unit: 'Connected Endpoints',
    mandatory: false,
    sourcePage: 3,
    sourceText: 'Telemetry ingestion pipeline must scale to at least 10,000 edge IoT nodes with message latency under 500 milliseconds.',
    confidence: 0.91
  },
  {
    category: 'Staffing',
    title: 'PMP Certified Project Director & Lead Architect',
    description: 'Dedicated full-time Project Director (PMP/PRINCE2) and Lead Architect with 8+ years experience.',
    value: 2,
    unit: 'Key Personnel',
    mandatory: true,
    sourcePage: 4,
    sourceText: 'Dedicated Full-Time Project Director with PMP/PRINCE2 credentials and Lead Solution Architect with 8+ years experience.',
    confidence: 0.93
  },
  {
    category: 'Timeline',
    title: '180-Day Full System Commissioning',
    description: 'Phase 1 pilot in 90 days; full commissioning within 180 days of NTP.',
    value: 180,
    unit: 'Days',
    mandatory: true,
    sourcePage: 4,
    sourceText: 'Phase 1 Pilot within 90 days; Full Commissioning across all city zones within 180 days from Notice to Proceed (NTP).',
    confidence: 0.95
  },
  {
    category: 'Contract',
    title: 'Liquidated Damages Liability Cap (10%)',
    description: '0.5% per week delay penalty up to a maximum cap of 10% of contract value.',
    value: 10,
    unit: '% Max LD Cap',
    mandatory: true,
    sourcePage: 4,
    sourceText: 'Delay in achieving milestone deliverables shall incur liquidated damages at 0.5% per week of delay, subject to a maximum ceiling of 10% of total contract value.',
    confidence: 0.96
  },
  {
    category: 'Documents',
    title: '2% Earnest Money Deposit Bank Guarantee',
    description: 'Irrevocable BG of INR 13,00,000 valid for 180 days.',
    value: 1300000,
    unit: 'INR',
    mandatory: true,
    sourcePage: 2,
    sourceText: 'Earnest Money Deposit (EMD): Irrevocable Bank Guarantee of 2% of estimated project value (INR 13,00,000) valid for 180 days.',
    confidence: 0.98
  }
];

const DEMO_MATCHES = [
  {
    requirementTitle: 'Legal Incorporation Status',
    category: 'Eligibility',
    mandatory: true,
    status: 'MATCH',
    reason: 'Company possesses 7 years of incorporated commercial operations vs 5 years required.',
    companyEvidence: 'Apex CyberTech Solutions corporate registration in 2019 (7 Years).',
    sourcePage: 2,
    confidence: 0.98
  },
  {
    requirementTitle: 'Minimum Annual Turnover',
    category: 'Financial',
    mandatory: true,
    status: 'MATCH',
    reason: 'Company annual turnover (₹7.50 Cr) comfortably exceeds the required ₹5.00 Cr threshold.',
    companyEvidence: 'Audited 3-year turnover record: ₹75,000,000 INR.',
    sourcePage: 2,
    confidence: 0.97
  },
  {
    requirementTitle: 'Prior Smart Infrastructure Track Record',
    category: 'Experience',
    mandatory: true,
    status: 'MATCH',
    reason: 'Proven track record in Municipal Smart Traffic Telemetry and SCADA smart grid deployments.',
    companyEvidence: 'Two executed projects valued at ₹3.8 Cr and ₹5.2 Cr with state authorities.',
    sourcePage: 1,
    confidence: 0.95
  },
  {
    requirementTitle: 'ISO 27001 Information Security Management',
    category: 'Certification',
    mandatory: true,
    status: 'MATCH',
    reason: 'Company holds accredited active ISO 27001:2013 certification.',
    companyEvidence: 'Active ISO 27001:2013 certificate verified.',
    sourcePage: 3,
    confidence: 0.99
  },
  {
    requirementTitle: 'ISO 9001 Quality Management System',
    category: 'Certification',
    mandatory: true,
    status: 'MATCH',
    reason: 'Company maintains active ISO 9001:2015 Quality Management certification.',
    companyEvidence: 'Active ISO 9001:2015 certificate verified.',
    sourcePage: 3,
    confidence: 0.99
  },
  {
    requirementTitle: 'High Availability & 99.9% Uptime SLA',
    category: 'Technical',
    mandatory: true,
    status: 'MATCH',
    reason: 'Architecture team specializes in Multi-AZ Kubernetes with sub-5 minute automated failover.',
    companyEvidence: 'Enterprise Cloud Architecture & DevOps skills demonstrated in past deployments.',
    sourcePage: 3,
    confidence: 0.93
  },
  {
    requirementTitle: '10,000+ Edge IoT Sensor Ingestion',
    category: 'Technical',
    mandatory: false,
    status: 'MATCH',
    reason: 'Ingestion pipeline expertise in MQTT/Kafka benchmarked at 25,000 events/sec.',
    companyEvidence: 'Proven high-frequency SCADA & Smart Traffic telemetry deployments.',
    sourcePage: 3,
    confidence: 0.94
  },
  {
    requirementTitle: 'PMP Certified Project Director & Lead Architect',
    category: 'Staffing',
    mandatory: true,
    status: 'PARTIAL',
    reason: 'Company has qualified Lead Architect (9 yrs) but must formally designate dedicated PMP certified director.',
    companyEvidence: 'Staff headcount: 65 employees. Requires formal PMP allocation letter.',
    sourcePage: 4,
    confidence: 0.88
  },
  {
    requirementTitle: '180-Day Full System Commissioning',
    category: 'Timeline',
    mandatory: true,
    status: 'MATCH',
    reason: 'Delivery schedule of 180 days is operationally realistic given reusable IoT modular stack.',
    companyEvidence: 'Past similar deployment executed in 150 days.',
    sourcePage: 4,
    confidence: 0.92
  },
  {
    requirementTitle: 'Liquidated Damages Liability Cap (10%)',
    category: 'Contract',
    mandatory: true,
    status: 'MATCH',
    reason: 'Standard procurement commercial clause. Requires strict milestone project management.',
    companyEvidence: 'Standard contractual clause acknowledged and manageable.',
    sourcePage: 4,
    confidence: 0.90
  },
  {
    requirementTitle: '2% Earnest Money Deposit Bank Guarantee',
    category: 'Documents',
    mandatory: true,
    status: 'MATCH',
    reason: 'Company banking lines support issuance of ₹13 Lakh Bank Guarantee.',
    companyEvidence: 'Existing credit line with primary corporate bank.',
    sourcePage: 2,
    confidence: 0.96
  }
];

const DEMO_RISKS = [
  {
    category: 'Staffing',
    severity: 'MEDIUM',
    title: 'Key Personnel Designation: PMP Certification Requirement',
    description: 'Tender mandates dedicated PMP/PRINCE2 certified Project Director. Profile indicates architectural readiness but requires formal PMP deployment letter.',
    evidence: 'Tender Page 4: "Dedicated Full-Time Project Director with PMP/PRINCE2 credentials"',
    sourcePage: 4,
    recommendedAction: 'Attach formal commitment letter naming certified Project Director with resume & PMP certificate.'
  },
  {
    category: 'Contract',
    severity: 'MEDIUM',
    title: 'Liquidated Damages Exposure (10% Maximum Cap)',
    description: 'Milestone delivery delays incur 0.5% per week penalty up to INR 65 Lakhs max ceiling. Stringent SLA terms for Phase 1 (90 days).',
    evidence: 'Tender Page 4: "Delay in achieving milestone deliverables shall incur LD at 0.5% per week up to 10% ceiling"',
    sourcePage: 4,
    recommendedAction: 'Flagged for human/legal review. Build 2-week internal buffer into Phase 1 pilot sprint schedule.'
  },
  {
    category: 'Timeline',
    severity: 'LOW',
    title: 'Submission Preparation Window (25 Days)',
    description: 'Adequate lead time of 25 days to assemble technical bid and procure Bank Guarantee.',
    evidence: 'Tender Page 1: "Submission Deadline: 25 Days from NIT publication"',
    sourcePage: 1,
    recommendedAction: 'Initiate Bank Guarantee application with bank by Day 5.'
  },
  {
    category: 'Financial',
    severity: 'LOW',
    title: 'EMD Bank Guarantee Obligation (₹13,00,000)',
    description: 'Commitment of 2% bid security required throughout the 180-day bid validity window.',
    evidence: 'Tender Page 2: "EMD Irrevocable Bank Guarantee of INR 13,00,000 valid for 180 days"',
    sourcePage: 2,
    recommendedAction: 'Confirm active bank guarantee line limit before submission date.'
  }
];

const DEMO_DECISION = {
  recommendation: 'BID',
  overallScore: 88,
  scoreBreakdown: {
    eligibility: 95,
    technical: 92,
    financial: 90,
    experience: 90,
    compliance: 95,
    risk: 80,
    timeline: 85
  },
  weightsUsed: {
    eligibility: 25,
    technical: 20,
    financial: 15,
    experience: 15,
    compliance: 10,
    risk: 10,
    timeline: 5
  },
  hardFailures: [],
  keyStrengths: [
    'Financial: Annual turnover (₹7.5 Cr) comfortably exceeds ₹5.0 Cr requirement.',
    'Certifications: Mandatory ISO 27001 & ISO 9001 certificates are active and verified.',
    'Technical: Strong capability in IoT edge telemetry, HA Kubernetes & 99.9% uptime SLA.',
    'Experience: Direct track record with two executed smart city infrastructure contracts.',
    'Eligibility: 7 years corporate incorporation satisfies the 5-year eligibility criteria.'
  ],
  keyConcerns: [
    'Staffing: Need to formally designate certified PMP Project Director in technical submission.',
    'Contract: 10% Liquidated damages cap requires strict Phase 1 milestone adherence.',
    'Commercial: ₹13 Lakh EMD Bank Guarantee must be secured before bid closing.'
  ],
  summaryRationale: 'High-confidence BID recommendation (88/100). Apex CyberTech satisfies all mandatory financial, technical, experience, and certification criteria. Minor staffing certification documentation is easily resolvable during proposal assembly.'
};

module.exports = {
  DEMO_USER,
  DEMO_COMPANY,
  DEMO_TENDER_PAGES,
  DEMO_REQUIREMENTS,
  DEMO_MATCHES,
  DEMO_RISKS,
  DEMO_DECISION
};
