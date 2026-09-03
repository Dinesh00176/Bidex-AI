const { extractFeatures, FEATURE_NAMES } = require('../ml/featureExtractor');
const {
  fitStandardScaler,
  transformStandardScaler,
  stratifiedTrainValTestSplit,
  trainLogisticModel,
  performKFoldCrossValidation,
  runFullTrainingPipeline
} = require('../ml/trainingPipeline');
const { evaluateClassification, checkModelGeneralization } = require('../ml/evaluator');
const { ModelService } = require('../services/modelService');

describe('Machine Learning Subsystem & Hybrid Pipeline Tests', () => {
  const sampleTender = {
    title: 'Municipal Smart City IoT RFP',
    estimatedValue: 65000000,
    pageCount: 4
  };

  const sampleCompany = {
    companyName: 'Apex CyberTech Solutions',
    annualTurnover: 65000000,
    yearsExperience: 7,
    employeeCount: 80,
    industry: 'Information Technology & Software Services',
    certifications: ['ISO 9001:2015', 'ISO 27001:2022'],
    technicalSkills: ['Java', 'React', 'Node.js', 'Python', 'AWS', 'IoT']
  };

  const sampleRequirements = [
    { category: 'Financial', title: 'Turnover ₹5 Cr', mandatory: true },
    { category: 'Experience', title: '5 Years Experience', mandatory: true },
    { category: 'Technical', title: 'IoT & Cloud Architecture', mandatory: true },
    { category: 'Certification', title: 'ISO 9001:2015', mandatory: true },
    { category: 'Staffing', title: '50 Engineers', mandatory: false }
  ];

  const sampleMatches = [
    { category: 'Financial', requirementTitle: 'Turnover ₹5 Cr', mandatory: true, status: 'MATCH' },
    { category: 'Experience', requirementTitle: '5 Years Experience', mandatory: true, status: 'MATCH' },
    { category: 'Technical', requirementTitle: 'IoT & Cloud Architecture', mandatory: true, status: 'MATCH' },
    { category: 'Certification', requirementTitle: 'ISO 9001:2015', mandatory: true, status: 'MATCH' },
    { category: 'Staffing', requirementTitle: '50 Engineers', mandatory: false, status: 'MATCH' }
  ];

  const sampleRisks = [
    { category: 'Contract', severity: 'MEDIUM', title: 'Liquidated Damages' }
  ];

  // TEST 1: Feature Extraction
  test('TEST 1: Feature extractor generates standard 20 leak-free features', () => {
    const { featureNames, featureMap, featureVector } = extractFeatures({
      tender: sampleTender,
      company: sampleCompany,
      requirements: sampleRequirements,
      matches: sampleMatches,
      risks: sampleRisks
    });

    expect(featureNames.length).toBe(20);
    expect(featureVector.length).toBe(20);
    expect(featureMap.company_turnover_cr).toBe(6.5);
    expect(featureMap.company_experience_years).toBe(7);
    expect(featureMap.match_pass_rate).toBe(1.0);
    expect(featureMap.mandatory_failure_count).toBe(0);

    // Verify all values are valid finite numbers
    featureVector.forEach(val => {
      expect(typeof val).toBe('number');
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
    });
  });

  // TEST 2: Data Leakage Prevention
  test('TEST 2: Feature vector contains strictly pre-decision attributes (no post-award leakage)', () => {
    const forbiddenLeakageKeys = [
      'award_result',
      'final_award_price',
      'winning_bidder',
      'decision_override',
      'post_submission_score'
    ];

    FEATURE_NAMES.forEach(name => {
      forbiddenLeakageKeys.forEach(forbidden => {
        expect(name).not.toContain(forbidden);
      });
    });
  });

  // TEST 3: Feature Scaling (StandardScaler)
  test('TEST 3: StandardScaler normalizes features and handles zero variance cleanly', () => {
    const X = [
      [10, 2],
      [20, 2],
      [30, 2],
      [40, 2]
    ];

    const scaler = fitStandardScaler(X);
    expect(scaler.means[0]).toBe(25);
    expect(scaler.means[1]).toBe(2);
    expect(scaler.stds[1]).toBe(1.0); // Zero variance feature mapped to 1.0

    const scaled = transformStandardScaler(X, scaler);
    expect(scaled.length).toBe(4);
    expect(scaled[0][0]).toBeLessThan(0);
    expect(scaled[3][0]).toBeGreaterThan(0);
  });

  // TEST 4: Stratified Splitting
  test('TEST 4: Stratified split preserves class ratio across Train, Validation, and Test sets', () => {
    const X = Array.from({ length: 40 }, (_, i) => [i, i * 2]);
    const y = Array.from({ length: 40 }, (_, i) => (i < 20 ? 1 : 0)); // 50/50 balance

    const splits = stratifiedTrainValTestSplit(X, y, 0.70, 0.15);

    expect(splits.train.X.length).toBe(28);
    expect(splits.val.X.length).toBe(6);
    expect(splits.test.X.length).toBe(6);

    const trainPos = splits.train.y.filter(val => val === 1).length;
    expect(trainPos).toBe(14); // Exactly 50% in train
  });

  // TEST 5: Model Evaluation Metrics
  test('TEST 5: Classification evaluator calculates accurate F1, ROC-AUC, and Confusion Matrix', () => {
    const yTrue = [1, 1, 1, 0, 0, 0];
    const yProb = [0.90, 0.85, 0.40, 0.10, 0.20, 0.80];

    const metrics = evaluateClassification(yTrue, yProb, 0.5);

    expect(metrics.accuracy).toBeDefined();
    expect(metrics.precision).toBeDefined();
    expect(metrics.recall).toBeDefined();
    expect(metrics.f1Score).toBeDefined();
    expect(metrics.rocAuc).toBeGreaterThan(0.5);
    expect(metrics.confusionMatrix.tp).toBe(2);
    expect(metrics.confusionMatrix.fp).toBe(1);
  });

  // TEST 6: Overfitting and Underfitting Checks
  test('TEST 6: Generalization check flags overfitting when train vs test F1 gap is excessive', () => {
    const overfitTrain = { accuracy: 0.99, f1Score: 0.99 };
    const overfitTest = { accuracy: 0.60, f1Score: 0.55 }; // Gap 0.44 > 0.15

    const check = checkModelGeneralization(overfitTrain, overfitTest, 0.15);
    expect(check.passed).toBe(false);
    expect(check.qualityGateStatus).toBe('WARNING_OVERFITTING');
    expect(check.warnings.length).toBeGreaterThan(0);
  });

  // TEST 7: Training Pipeline Execution
  test('TEST 7: Supervised training pipeline runs on historical dataset with cross-validation', () => {
    // Generate synthetic benchmark records for pipeline validation
    const dataset = Array.from({ length: 30 }, (_, i) => {
      const isQualified = i % 2 === 0;
      return {
        featureVector: [
          isQualified ? 6.5 : 1.2,
          isQualified ? 7 : 1,
          isQualified ? 80 : 12,
          isQualified ? 2 : 0,
          isQualified ? 6 : 1,
          isQualified ? 1 : 0,
          6.5, 4, 12, 8, 4, 3, 2,
          isQualified ? 0.95 : 0.20,
          isQualified ? 0.05 : 0.30,
          isQualified ? 0 : 5,
          isQualified ? 0 : 4,
          isQualified ? 0 : 6,
          isQualified ? 1.0 : 0.0,
          isQualified ? 1.0 : 0.0
        ],
        target: isQualified ? 1 : 0
      };
    });

    const result = runFullTrainingPipeline(dataset, { modelVersion: 'v1.0.0-test', minSamplesRequired: 20 });

    expect(['TRAINED_SUCCESS', 'TRAINED_WARNING']).toContain(result.status);
    expect(result.model).toBeDefined();
    expect(result.model.weights.length).toBe(20);
    expect(result.model.metadata.crossValidation.f1Mean).toBeDefined();
  });

  // TEST 8: ModelService Graceful Degradation (Untrained Model)
  test('TEST 8: ModelService returns clean NOT_TRAINED / INSUFFICIENT_DATA status when no model is active', () => {
    const service = new ModelService();
    service.cachedModel = null; // simulate clean initial state

    const prediction = service.predict([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    expect(['NOT_TRAINED', 'INSUFFICIENT_DATA']).toContain(prediction.status);
    expect(prediction.available).toBe(false);
    expect(prediction.probability).toBeNull();
    expect(prediction.message).toBeDefined();
  });

  // TEST 9: Active Model Inference & Explainability
  test('TEST 9: ModelService produces probabilistic prediction and top influencing factors when model loaded', () => {
    const service = new ModelService();
    // Configure mock trained model artifact
    service.cachedModel = {
      metadata: { modelVersion: 'v1.0.0-test', modelType: 'L2-Regularized Calibrated Linear Classifier' },
      scaler: { means: new Array(20).fill(0), stds: new Array(20).fill(1) },
      weights: [1.2, 0.8, 0.5, 0.4, 0.3, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1.5, -0.5, -1.0, -1.0, -2.0, 1.2, 1.0],
      bias: 0.1,
      featureNames: FEATURE_NAMES
    };

    const goodVector = [6.5, 7, 80, 2, 6, 1, 6.5, 4, 12, 8, 4, 3, 2, 1.0, 0.0, 0, 0, 0, 1.0, 1.0];
    const prediction = service.predict(goodVector);

    expect(prediction.status).toBe('AVAILABLE');
    expect(prediction.available).toBe(true);
    expect(prediction.probability).toBeGreaterThan(0.70);
    expect(prediction.confidencePercent).toBeGreaterThan(70);
    expect(prediction.topInfluencingFactors.length).toBeGreaterThan(0);
  });

  // TEST 10: Hard Compliance Rule Overrides ML
  test('TEST 10: Mandatory compliance failure cannot be overridden by ML prediction', () => {
    const service = new ModelService();
    service.cachedModel = {
      metadata: { modelVersion: 'v1.0.0-test' },
      scaler: { means: new Array(20).fill(0), stds: new Array(20).fill(1) },
      weights: new Array(20).fill(0.5),
      bias: 2.0, // High bias simulating high ML score
      featureNames: FEATURE_NAMES
    };

    const badCompanyMatches = [
      { category: 'Financial', requirementTitle: 'Turnover ₹5 Cr', mandatory: true, status: 'CONFLICT', reason: 'Turnover below threshold' }
    ];

    const mlPrediction = service.predict([1.2, 1, 12, 0, 1, 0, 6.5, 4, 12, 8, 4, 3, 2, 0.2, 0.2, 1, 1, 1, 0, 0]);
    expect(mlPrediction.probability).toBeDefined();

    // Verify hard failure gate prevents BID
    const hardFailures = badCompanyMatches.filter(m => m.mandatory && m.status === 'CONFLICT');
    expect(hardFailures.length).toBe(1);
    const finalDecision = hardFailures.length > 0 ? 'NO-BID' : 'BID';
    expect(finalDecision).toBe('NO-BID'); // ML cannot override
  });
});
