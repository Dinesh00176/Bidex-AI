const path = require('path');
const {
  CANONICAL_REQUIREMENT_CATEGORIES,
  CANONICAL_RISK_CATEGORIES,
  normalizeRequirementCategory,
  normalizeRiskCategory
} = require('../utils/categoryTaxonomy');
const { extractPdfPages, validatePdfMagicBytes } = require('../services/pdfService');
const { evaluateRisks } = require('../services/riskService');
const Analysis = require('../models/Analysis');
const mongoose = require('mongoose');

function createBlankPdf() {
  const catalog = '<< /Type /Catalog /Pages 2 0 R >>';
  const pages = '<< /Type /Pages /Kids [5 0 R] /Count 1 >>';
  const fontObj = '<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>';
  const streamContent = 'BT\n/F1 11 Tf\n50 740 Td\nET';
  const streamLen = Buffer.byteLength(streamContent, 'utf8');
  const contentObj = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  const pageObj = '5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n';

  const allObjs = [
    '1 0 obj\n' + catalog + '\nendobj\n',
    '2 0 obj\n' + pages + '\nendobj\n',
    '3 0 obj\n' + fontObj + '\nendobj\n',
    contentObj,
    pageObj
  ];

  let body = '%PDF-1.4\n';
  let offsets = [0];

  for (let obj of allObjs) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += obj;
  }

  const startxref = Buffer.byteLength(body, 'utf8');
  let xref = `xref\n0 ${allObjs.length + 1}\n0000000000 65535 f\r\n`;
  for (let i = 1; i <= allObjs.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    xref += `${off} 00000 n\r\n`;
  }
  const trailer = `trailer\n<< /Size ${allObjs.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\r\n`;

  return Buffer.from(body + xref + trailer, 'utf8');
}

describe('Category Taxonomy and Normalization Unit Tests', () => {
  test('should accurately preserve all canonical requirement categories', () => {
    CANONICAL_REQUIREMENT_CATEGORIES.forEach(cat => {
      expect(normalizeRequirementCategory(cat)).toBe(cat);
      expect(normalizeRequirementCategory(cat.toLowerCase())).toBe(cat);
      expect(normalizeRequirementCategory(`  ${cat}  `)).toBe(cat);
    });
  });

  test('should normalize Staffing, Manpower, Personnel synonyms to Staffing', () => {
    expect(normalizeRequirementCategory('Staffing')).toBe('Staffing');
    expect(normalizeRequirementCategory('staffing')).toBe('Staffing');
    expect(normalizeRequirementCategory('Manpower')).toBe('Staffing');
    expect(normalizeRequirementCategory('Personnel')).toBe('Staffing');
    expect(normalizeRequirementCategory('Human Resources')).toBe('Staffing');
    expect(normalizeRequirementCategory('Key Personnel Deployment')).toBe('Staffing');
  });

  test('should normalize Financial synonyms to Financial', () => {
    expect(normalizeRequirementCategory('Turnover')).toBe('Financial');
    expect(normalizeRequirementCategory('Commercial')).toBe('Financial');
    expect(normalizeRequirementCategory('Net Worth Criteria')).toBe('Financial');
  });

  test('should normalize Technical synonyms to Technical', () => {
    expect(normalizeRequirementCategory('Cloud Infrastructure')).toBe('Technical');
    expect(normalizeRequirementCategory('IoT Telemetry Protocol')).toBe('Technical');
    expect(normalizeRequirementCategory('Software Architecture')).toBe('Technical');
  });

  test('should map unknown categories safely to a valid canonical category without throwing', () => {
    const res1 = normalizeRequirementCategory('Some Completely Unknown Category XYZ');
    expect(CANONICAL_REQUIREMENT_CATEGORIES).toContain(res1);

    const res2 = normalizeRequirementCategory(null);
    expect(CANONICAL_REQUIREMENT_CATEGORIES).toContain(res2);
  });

  test('should normalize risk categories strictly to the 8 canonical risk enums', () => {
    expect(normalizeRiskCategory('Staffing')).toBe('Technical');
    expect(normalizeRiskCategory('Certification')).toBe('Compliance');
    expect(normalizeRiskCategory('Documents')).toBe('Documentation');
    expect(normalizeRiskCategory('Experience')).toBe('Eligibility');
    expect(normalizeRiskCategory('Financial')).toBe('Financial');
    expect(normalizeRiskCategory('Timeline')).toBe('Timeline');
    expect(normalizeRiskCategory('Contract')).toBe('Contract');
    expect(normalizeRiskCategory('Legal')).toBe('Legal');

    CANONICAL_REQUIREMENT_CATEGORIES.forEach(reqCat => {
      const riskCat = normalizeRiskCategory(reqCat);
      expect(CANONICAL_RISK_CATEGORIES).toContain(riskCat);
    });
  });
});

describe('Mongoose Schema Enum Validation & Staffing Risk Integration', () => {
  test('should evaluate risks from Staffing matches without producing invalid risk category enums', () => {
    const matches = [
      {
        requirementTitle: 'Lead Solution Architect & Project Director',
        category: 'Staffing',
        mandatory: true,
        status: 'MISSING',
        reason: 'No architect listed in profile',
        companyEvidence: 'None',
        sourcePage: 2
      }
    ];

    const risks = evaluateRisks({ matches, requirements: [], tender: {}, company: {} });
    expect(risks.length).toBeGreaterThan(0);
    expect(risks[0].category).toBe('Technical');
    expect(CANONICAL_RISK_CATEGORIES).toContain(risks[0].category);

    const dummyAnalysis = new Analysis({
      tenderId: new mongoose.Types.ObjectId(),
      companyId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      requirements: [
        {
          category: 'Staffing',
          title: 'Project Director',
          description: 'PMP certified',
          mandatory: true,
          sourcePage: 2,
          sourceText: 'Project Director required'
        }
      ],
      matches,
      risks,
      decision: {
        recommendation: 'REVIEW',
        overallScore: 75,
        summaryRationale: 'Test'
      }
    });

    const validationError = dummyAnalysis.validateSync();
    expect(validationError).toBeUndefined();
  });
});

describe('PDF Text Extraction & Protection Tests', () => {
  const samplePdfPath = path.resolve(__dirname, '../../sample_documents/Smart_City_IoT_Tender_RFP_2026.pdf');

  test('Test A & B: should extract all pages and preserve page order for normal multi-page PDF', async () => {
    const result = await extractPdfPages(samplePdfPath);
    expect(result.pageCount).toBe(4);
    expect(result.extractedPages.length).toBe(4);
    expect(result.extractedPages[0].pageNumber).toBe(1);
    expect(result.extractedPages[1].pageNumber).toBe(2);
    expect(result.extractedPages[2].pageNumber).toBe(3);
    expect(result.extractedPages[3].pageNumber).toBe(4);
    expect(result.fullText.length).toBeGreaterThan(500);
    expect(result.extractedPages[0].text).toContain('REQUEST FOR PROPOSAL');
  });

  test('Test C: should safely reject fake or non-PDF files', async () => {
    const fakeBuffer = Buffer.from('This is not a PDF file. Plain text only.');
    expect(validatePdfMagicBytes(fakeBuffer)).toBe(false);

    await expect(extractPdfPages(fakeBuffer)).rejects.toThrow();
  });

  test('Test D: should detect scanned or image-only PDFs with insufficient text and throw SCANNED_IMAGE_PDF', async () => {
    const blankPdfBuffer = createBlankPdf();

    let thrownError;
    try {
      await extractPdfPages(blankPdfBuffer);
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('SCANNED_IMAGE_PDF');
    expect(thrownError.message).toContain('scanned or image-only pages');
  });
});
