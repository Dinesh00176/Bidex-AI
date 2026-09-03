const { generateChatResponse, isMockMode } = require('./geminiService');
const logger = require('../utils/logger');

/**
 * Basic keyword/term scoring to retrieve top relevant pages from tender
 */
const retrieveRelevantPages = (extractedPages, query, topK = 4) => {
  if (!extractedPages || extractedPages.length === 0) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);

  const scoredPages = extractedPages.map(page => {
    const pageText = page.text.toLowerCase();
    let score = 0;

    queryTerms.forEach(term => {
      // Frequency match
      const occurrences = (pageText.match(new RegExp(term, 'g')) || []).length;
      score += occurrences * 2;

      // Proximity boost for critical keywords
      if (['turnover', 'penalty', 'deadline', 'certification', 'iso', 'experience', 'emd', 'qualification', 'staffing', 'architect', 'damages'].includes(term) && pageText.includes(term)) {
        score += 5;
      }
    });

    return {
      pageNumber: page.pageNumber,
      text: page.text,
      score
    };
  });

  scoredPages.sort((a, b) => b.score - a.score);

  // Take top-k scored pages. If no terms matched, take the first 3 pages
  let selected = scoredPages.filter(p => p.score > 0).slice(0, topK);
  if (selected.length === 0) {
    selected = extractedPages.slice(0, Math.min(topK, extractedPages.length));
  }

  return selected;
};

/**
 * Intelligent deterministic fallback RAG responder used ONLY when AI_MODE=mock for offline tests
 */
const fallbackAnswerQuery = (query, extractedPages, analysis) => {
  const q = query.toLowerCase();

  if (q.includes('turnover') || q.includes('financial')) {
    const finReq = (analysis?.requirements || []).find(r => r.category === 'Financial') || {
      sourcePage: 2,
      sourceText: 'Average annual financial turnover requirement of INR 5.00 Crore for the preceding three financial years.',
      value: 50000000
    };
    return {
      answer: `[MOCK] The tender mandates a minimum average annual financial turnover of ₹5.00 Crore (INR 50,000,000) over the last 3 audited financial years. Bidders must provide audited balance sheets and CA certificates.`,
      citations: [
        {
          sourcePage: finReq.sourcePage || 2,
          sectionTitle: 'Financial Qualification Criteria',
          quotedSnippet: finReq.sourceText || 'Average annual turnover shall not be less than INR 5 Crore...',
          confidence: 0.95
        }
      ]
    };
  }

  if (q.includes('certification') || q.includes('iso')) {
    const certReqs = (analysis?.requirements || []).filter(r => r.category === 'Certification');
    return {
      answer: `[MOCK] Mandatory certifications specified in this tender include ISO/IEC 27001 (Information Security Management) and ISO 9001 (Quality Management System). All certificates must be active on the bid closing date.`,
      citations: certReqs.map(c => ({
        sourcePage: c.sourcePage || 3,
        sectionTitle: 'Mandatory Certifications',
        quotedSnippet: c.sourceText,
        confidence: 0.96
      }))
    };
  }

  if (q.includes('penalty') || q.includes('damages') || q.includes('liquidated')) {
    const contReq = (analysis?.requirements || []).find(r => r.category === 'Contract');
    return {
      answer: `[MOCK] The tender imposes Liquidated Damages of 0.5% of the total contract value for each week of delay in achieving designated project milestones, subject to a maximum aggregate ceiling cap of 10% of total contract value.`,
      citations: [
        {
          sourcePage: contReq?.sourcePage || 4,
          sectionTitle: 'Liquidated Damages & SLA Penalties',
          quotedSnippet: contReq?.sourceText || 'Delay in milestone delivery shall attract liquidated damages at 0.5% per week up to a ceiling of 10%.',
          confidence: 0.94
        }
      ]
    };
  }

  // If completely unrelated
  if (q.includes('weather') || q.includes('recipe') || q.includes('movie') || q.includes('joke')) {
    return {
      answer: "I couldn't find this information in the uploaded tender. Please ask questions related to tender specifications, compliance requirements, timelines, or financial qualifications.",
      citations: []
    };
  }

  return {
    answer: `[MOCK] Based on the uploaded tender document, please review the requirements section for specific technical and commercial qualification thresholds.`,
    citations: [
      {
        sourcePage: 1,
        sectionTitle: 'Tender Instructions',
        quotedSnippet: extractedPages[0]?.text?.slice(0, 150) || 'General bid criteria.',
        confidence: 0.85
      }
    ]
  };
};

/**
 * Answers a user question grounded on tender pages using RAG and Gemini
 */
const answerTenderQuestion = async ({ query, tender, analysis = null, conversationHistory = [] }) => {
  logger.info(`Processing grounded RAG question for tender '${tender.title}': "${query}"`);

  const extractedPages = tender.extractedPages || [];
  if (extractedPages.length === 0) {
    return {
      answer: "No extracted document text found for this tender. Please ensure the PDF processing has completed successfully.",
      citations: []
    };
  }

  const topPages = retrieveRelevantPages(extractedPages, query, 4);
  const isMock = isMockMode();
  const fallbackFn = isMock ? () => fallbackAnswerQuery(query, extractedPages, analysis) : null;

  try {
    const response = await generateChatResponse({
      systemInstruction: `You are the BidWise AI Tender Intelligence Assistant. You answer questions strictly from the provided tender pages with exact citations. If the requested information is absent in the document context, say "I couldn't find this information in the uploaded tender."`,
      contextChunks: topPages,
      conversationHistory,
      userQuestion: query,
      fallbackFn
    });

    if (!response || !response.answer) {
      if (isMock) {
        return fallbackAnswerQuery(query, extractedPages, analysis);
      }
      return {
        answer: "I couldn't find this information in the uploaded tender.",
        citations: []
      };
    }

    return response;
  } catch (error) {
    logger.error('RAG service error:', error.message);
    if (isMock) {
      return fallbackAnswerQuery(query, extractedPages, analysis);
    }
    throw error;
  }
};

module.exports = { answerTenderQuestion, retrieveRelevantPages, fallbackAnswerQuery };

