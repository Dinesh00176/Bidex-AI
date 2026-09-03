const { FEATURE_NAMES, FEATURE_SCHEMA_VERSION } = require('./featureExtractor');

/**
 * Deterministic Linear Congruential Generator (LCG) for reproducible seeding
 */
const createPrng = (seed = 42) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/**
 * Generates N realistic historical procurement records with accurate domain-fit dynamics
 */
const generateHistoricalDataset = (sampleCount = 500, randomSeed = 2026) => {
  const prng = createPrng(randomSeed);
  const dataset = [];

  const round = (val, dec = 3) => Number(val.toFixed(dec));

  for (let i = 0; i < sampleCount; i++) {
    const cohort = i % 5;
    let turnover, expYears, empCount, certCount, techSkills, industryMatch;
    let tenderVal, pageCount, reqCount, mandCount, optCount, techReqCount, finReqCount;
    let passRate, partRate, conflictCount, missingCount, mandFailures, techRatio, certRatio;
    let outcomeLabel, binaryTarget;

    // Common tender parameters
    tenderVal = round(3.0 + prng() * 15.0, 2); // 3 to 18 Cr
    pageCount = Math.floor(2 + prng() * 8); // 2 to 10 pages
    reqCount = Math.floor(8 + prng() * 10); // 8 to 18 requirements
    mandCount = Math.floor(reqCount * 0.6 + prng() * (reqCount * 0.2));
    optCount = reqCount - mandCount;
    techReqCount = Math.floor(3 + prng() * 4);
    finReqCount = Math.floor(1 + prng() * 2);

    if (cohort === 0) {
      // 1. HIGH-FIT IN-DOMAIN (Qualified, verified certifications, 0 mandatory failures -> WIN)
      turnover = round(tenderVal * (1.2 + prng() * 1.5), 2);
      expYears = Math.floor(6 + prng() * 8);
      empCount = Math.floor(50 + prng() * 120);
      certCount = Math.floor(2 + prng() * 2); // ISO 9001, 27001
      techSkills = Math.floor(6 + prng() * 6);
      industryMatch = 1.0;

      passRate = round(0.85 + prng() * 0.15, 3);
      partRate = round((1 - passRate) * 0.8, 3);
      conflictCount = 0;
      missingCount = Math.max(0, reqCount - Math.round(passRate * reqCount) - Math.round(partRate * reqCount));
      mandFailures = 0;
      techRatio = round(0.85 + prng() * 0.15, 3);
      certRatio = 1.0;

      outcomeLabel = 'WIN';
      binaryTarget = 1;
    } else if (cohort === 1) {
      // 2. MEDIUM-FIT IN-DOMAIN (Competitive, minor non-mandatory gaps -> WIN / LOSS)
      turnover = round(tenderVal * (0.9 + prng() * 0.4), 2);
      expYears = Math.floor(4 + prng() * 5);
      empCount = Math.floor(30 + prng() * 50);
      certCount = Math.floor(1 + prng() * 2);
      techSkills = Math.floor(4 + prng() * 4);
      industryMatch = 1.0;

      passRate = round(0.65 + prng() * 0.20, 3);
      partRate = round(0.15 + prng() * 0.15, 3);
      conflictCount = 0;
      missingCount = Math.floor(1 + prng() * 3);
      mandFailures = 0;
      techRatio = round(0.60 + prng() * 0.30, 3);
      certRatio = prng() > 0.4 ? 1.0 : 0.5;

      const isWinner = prng() > 0.45;
      outcomeLabel = isWinner ? 'WIN' : 'LOSS';
      binaryTarget = isWinner ? 1 : 0;
    } else if (cohort === 2) {
      // 3. OUT-OF-DOMAIN SCALE BIDDERS (Established company, but domain mismatch & mandatory failures -> DISQUALIFIED)
      turnover = round(tenderVal * (0.8 + prng() * 1.0), 2); // Decent company scale
      expYears = Math.floor(5 + prng() * 6);
      empCount = Math.floor(40 + prng() * 60);
      certCount = Math.floor(1 + prng() * 2); // Holds wrong certs
      techSkills = Math.floor(6 + prng() * 6);
      industryMatch = 0.0; // Completely mismatched sector (e.g. IT bidding on Aerospace)

      passRate = round(0.10 + prng() * 0.15, 3);
      partRate = round(0.10 + prng() * 0.10, 3);
      conflictCount = Math.floor(3 + prng() * 4);
      missingCount = Math.floor(3 + prng() * 4);
      mandFailures = Math.floor(2 + prng() * 4);
      techRatio = 0.0;
      certRatio = 0.0;

      outcomeLabel = 'DISQUALIFIED';
      binaryTarget = 0;
    } else if (cohort === 3) {
      // 4. LOW-FIT UNDER-RESOURCED (Low financial turnover, limited staff -> LOSS)
      turnover = round(tenderVal * (0.3 + prng() * 0.3), 2);
      expYears = Math.floor(1 + prng() * 3);
      empCount = Math.floor(8 + prng() * 20);
      certCount = prng() > 0.7 ? 1 : 0;
      techSkills = Math.floor(1 + prng() * 3);
      industryMatch = prng() > 0.5 ? 0.5 : 0.0;

      passRate = round(0.20 + prng() * 0.25, 3);
      partRate = round(0.20 + prng() * 0.20, 3);
      conflictCount = Math.floor(1 + prng() * 3);
      missingCount = Math.floor(3 + prng() * 4);
      mandFailures = Math.floor(1 + prng() * 2);
      techRatio = round(0.10 + prng() * 0.30, 3);
      certRatio = prng() > 0.8 ? 0.5 : 0.0;

      outcomeLabel = 'LOSS';
      binaryTarget = 0;
    } else {
      // 5. CATASTROPHIC DISQUALIFICATION (No certs, multiple mandatory conflicts -> DISQUALIFIED)
      turnover = round(tenderVal * (0.15 + prng() * 0.35), 2);
      expYears = Math.floor(1 + prng() * 2);
      empCount = Math.floor(5 + prng() * 15);
      certCount = 0;
      techSkills = Math.floor(1 + prng() * 2);
      industryMatch = 0.0;

      passRate = round(0.05 + prng() * 0.15, 3);
      partRate = round(0.10 + prng() * 0.10, 3);
      conflictCount = Math.floor(4 + prng() * 4);
      missingCount = Math.floor(4 + prng() * 5);
      mandFailures = Math.floor(3 + prng() * 4);
      techRatio = 0.0;
      certRatio = 0.0;

      outcomeLabel = 'DISQUALIFIED';
      binaryTarget = 0;
    }

    const featureMap = {
      company_turnover_cr: turnover,
      company_experience_years: expYears,
      company_employee_count: empCount,
      company_cert_count: certCount,
      company_tech_skill_count: techSkills,
      company_industry_match: industryMatch,
      tender_estimated_value_cr: tenderVal,
      tender_page_count: pageCount,
      tender_total_req_count: reqCount,
      tender_mandatory_req_count: mandCount,
      tender_optional_req_count: optCount,
      tender_tech_req_count: techReqCount,
      tender_financial_req_count: finReqCount,
      match_pass_rate: passRate,
      match_partial_rate: partRate,
      match_conflict_count: conflictCount,
      match_missing_count: missingCount,
      mandatory_failure_count: mandFailures,
      technical_match_ratio: techRatio,
      certification_match_ratio: certRatio
    };

    const featureVector = FEATURE_NAMES.map(name => featureMap[name]);

    dataset.push({
      recordId: `HIST_BID_${(i + 1).toString().padStart(4, '0')}`,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION,
      featureMap,
      featureVector,
      outcomeLabel,
      binaryTarget,
      source: 'DEMO SYNTHETIC DATA'
    });
  }

  return dataset;
};

module.exports = {
  generateHistoricalDataset
};
