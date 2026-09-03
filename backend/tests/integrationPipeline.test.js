const request = require('supertest');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../server');
const Tender = require('../models/Tender');
const Company = require('../models/Company');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { computeBidDecision } = require('../services/decisionService');
const { matchRequirementsWithCompany } = require('../services/matchingService');
const { evaluateRisks } = require('../services/riskService');
const { answerTenderQuestion } = require('../services/ragService');

describe('End-to-End Tender Intelligence Integration Tests', () => {
  const samplePdfPath = path.resolve(__dirname, '../../sample_documents/Smart_City_IoT_Tender_RFP_2026.pdf');
  const testUserId = new mongoose.Types.ObjectId();
  const testCompanyId = new mongoose.Types.ObjectId();
  const otherUserId = new mongoose.Types.ObjectId();

  const authToken = jwt.sign(
    { id: testUserId },
    process.env.JWT_SECRET || 'bidwise_enterprise_secure_jwt_secret_key_2026_x99!',
    { expiresIn: '1h' }
  );

  const otherAuthToken = jwt.sign(
    { id: otherUserId },
    process.env.JWT_SECRET || 'bidwise_enterprise_secure_jwt_secret_key_2026_x99!',
    { expiresIn: '1h' }
  );

  test('Ownership Security: Non-owner should be denied access (403 Forbidden)', async () => {
    // Create a mock tender in memory representation
    const mockTender = new Tender({
      _id: new mongoose.Types.ObjectId(),
      userId: testUserId,
      companyId: testCompanyId,
      title: 'Protected Confidential RFP',
      status: 'completed',
      pageCount: 4,
      extractedPages: [{ pageNumber: 1, text: 'Secret tender specs', wordCount: 3 }]
    });

    const originalTenderFindById = Tender.findById;
    const originalUserFindById = User.findById;

    Tender.findById = jest.fn().mockImplementation((id) => {
      if (id.toString() === mockTender._id.toString()) {
        return Promise.resolve(mockTender);
      }
      return Promise.resolve(null);
    });

    User.findById = jest.fn().mockImplementation((id) => {
      return {
        select: jest.fn().mockResolvedValue({
          _id: id,
          role: 'user',
          email: 'other@example.com'
        })
      };
    });

    // Access by other user
    const res = await request(app)
      .get(`/api/tenders/${mockTender._id}`)
      .set('Authorization', `Bearer ${otherAuthToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');

    // Restore
    Tender.findById = originalTenderFindById;
    User.findById = originalUserFindById;
  });

  test('Decision Engine Hard Failure Gate: Unmet mandatory requirements NEVER return BID', () => {
    const failedRequirements = [
      {
        category: 'Financial',
        title: 'Minimum Annual Turnover',
        description: 'Requires ₹10 Crore',
        value: 100000000,
        unit: 'INR',
        mandatory: true,
        sourcePage: 2,
        sourceText: 'Turnover must exceed 10 Cr'
      },
      {
        category: 'Certification',
        title: 'ISO 27001 Certification',
        description: 'Information security certificate required',
        value: 'ISO 27001',
        unit: 'Certification',
        mandatory: true,
        sourcePage: 3,
        sourceText: 'Must possess ISO 27001'
      }
    ];

    const company = {
      companyName: 'Under-qualified Tech Corp',
      annualTurnover: 20000000, // Only 2 Cr
      yearsExperience: 2,
      certifications: ['ISO 9001:2015'] // Missing ISO 27001
    };

    const matches = matchRequirementsWithCompany(failedRequirements, company);
    const risks = evaluateRisks({ requirements: failedRequirements, matches, tender: {}, company });
    const decision = computeBidDecision({ requirements: failedRequirements, matches, risks });

    expect(decision.recommendation).not.toBe('BID');
    expect(['NO-BID', 'REVIEW']).toContain(decision.recommendation);
    expect(decision.hardFailures.length).toBeGreaterThan(0);
  });

  test('RAG Chat Grounded Query Execution in Mock Mode', async () => {
    process.env.AI_MODE = 'mock';

    const mockTender = {
      title: 'Smart City IoT Command Platform',
      extractedPages: [
        { pageNumber: 1, text: 'SECTION 1: Scope of Work for Municipal Smart City IoT' },
        { pageNumber: 2, text: 'SECTION 2: Average annual financial turnover shall not be less than INR 5.00 Crore' },
        { pageNumber: 3, text: 'SECTION 3: Valid ISO 9001:2015 and ISO 27001:2013 certifications are mandatory' }
      ]
    };

    const result = await answerTenderQuestion({
      query: 'What is the minimum annual turnover?',
      tender: mockTender
    });

    expect(result.answer).toBeDefined();
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.citations).toBeDefined();
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].sourcePage).toBe(2);
  });
});
