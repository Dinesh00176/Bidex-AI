/**
 * BidWise AI — Model Evaluation & Diagnostic Metrics Suite
 * Computes Accuracy, Precision, Recall, F1, ROC-AUC, Brier score, and Overfitting diagnostics
 */

const evaluateClassification = (yTrue, yProb, threshold = 0.5) => {
  if (!yTrue || !yProb || yTrue.length === 0 || yTrue.length !== yProb.length) {
    throw new Error('Invalid true labels or predicted probabilities for evaluation.');
  }

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let brierSum = 0;

  for (let i = 0; i < yTrue.length; i++) {
    const actual = yTrue[i];
    const prob = Math.min(Math.max(yProb[i], 0.0001), 0.9999);
    const pred = prob >= threshold ? 1 : 0;

    brierSum += Math.pow(prob - actual, 2);

    if (actual === 1 && pred === 1) tp++;
    else if (actual === 0 && pred === 1) fp++;
    else if (actual === 0 && pred === 0) tn++;
    else if (actual === 1 && pred === 0) fn++;
  }

  const total = yTrue.length;
  const accuracy = Number(((tp + tn) / total).toFixed(4));
  const precision = (tp + fp) > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const recall = (tp + fn) > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const f1Score = (precision + recall) > 0 ? Number((2 * (precision * recall) / (precision + recall)).toFixed(4)) : 0;
  const brierScore = Number((brierSum / total).toFixed(4));

  // Compute ROC-AUC via rank-order concordance
  const pairs = yTrue.map((val, idx) => ({ y: val, p: yProb[idx] }));
  pairs.sort((a, b) => b.p - a.p);

  const positives = yTrue.filter(y => y === 1).length;
  const negatives = total - positives;

  let auc = 0.5;
  if (positives > 0 && negatives > 0) {
    let sumRanks = 0;
    pairs.forEach((item, index) => {
      if (item.y === 1) {
        sumRanks += (total - index);
      }
    });
    auc = Number(((sumRanks - (positives * (positives + 1) / 2)) / (positives * negatives)).toFixed(4));
  }

  return {
    sampleCount: total,
    positives,
    negatives,
    confusionMatrix: { tp, fp, tn, fn },
    accuracy,
    precision,
    recall,
    f1Score,
    rocAuc: auc,
    brierScore
  };
};

/**
 * Checks for overfitting / generalization gap between training and validation/test folds
 */
const checkModelGeneralization = (trainMetrics, testMetrics, maxAllowedGap = 0.15) => {
  const f1Gap = Number((trainMetrics.f1Score - testMetrics.f1Score).toFixed(4));
  const accuracyGap = Number((trainMetrics.accuracy - testMetrics.accuracy).toFixed(4));

  const isOverfitting = f1Gap > maxAllowedGap;
  const isUnderfitting = testMetrics.f1Score < 0.60 && trainMetrics.f1Score < 0.65;

  let qualityGateStatus = 'PASSED';
  const warnings = [];

  if (isOverfitting) {
    qualityGateStatus = 'WARNING_OVERFITTING';
    warnings.push(`Large generalization gap detected: Train F1 (${trainMetrics.f1Score}) vs Test F1 (${testMetrics.f1Score}) exceeds ${maxAllowedGap}.`);
  }

  if (isUnderfitting) {
    qualityGateStatus = 'WARNING_UNDERFITTING';
    warnings.push(`Model shows low predictive power: Test F1 (${testMetrics.f1Score}) indicates underfitting or insufficient signal in dataset.`);
  }

  return {
    qualityGateStatus,
    f1Gap,
    accuracyGap,
    warnings,
    passed: !isOverfitting && !isUnderfitting
  };
};

module.exports = {
  evaluateClassification,
  checkModelGeneralization
};
