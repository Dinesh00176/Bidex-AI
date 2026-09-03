/**
 * Bidexa AI — Model Training CLI & Production Artifact Generator
 * Usage: node scripts/trainModel.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { generateHistoricalDataset } = require('../ml/demoDataset');
const { runFullTrainingPipeline } = require('../ml/trainingPipeline');
const logger = require('../utils/logger');

const MODELS_DIR = path.resolve(__dirname, '../ml/models');
const MODEL_FILE = path.join(MODELS_DIR, 'production_model.json');
const METADATA_FILE = path.join(MODELS_DIR, 'model_metadata.json');

const trainAndSaveModel = async () => {
  console.log('\n============================================================');
  console.log('🤖 BIDEXA AI — SUPERVISED ML MODEL TRAINING PIPELINE');
  console.log('============================================================');

  // 1. Generate 500 deterministic historical procurement records
  console.log('[1/4] Generating 500 deterministic historical bid records (Source: DEMO SYNTHETIC DATA)...');
  const dataset = generateHistoricalDataset(500, 2026);
  console.log(`      Generated ${dataset.length} labeled historical records.`);

  // 2. Execute full training pipeline with quality gates
  console.log('[2/4] Executing 5-Fold Stratified Cross-Validation & L2-Regularized Training...');
  const result = runFullTrainingPipeline(dataset, {
    modelVersion: 'bidexa-v1.0.0',
    minSamplesRequired: 100
  });

  if (!result.model || (result.status !== 'TRAINED_SUCCESS' && result.status !== 'TRAINED_WARNING')) {
    console.error('❌ Model training failed quality gate:', result.message || 'Unknown error');
    process.exit(1);
  }

  // 3. Ensure models directory exists
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  // 4. Save artifacts
  console.log('[3/4] Serializing production model and metadata artifacts...');
  fs.writeFileSync(MODEL_FILE, JSON.stringify(result.model, null, 2), 'utf8');
  fs.writeFileSync(METADATA_FILE, JSON.stringify(result.model.metadata, null, 2), 'utf8');
  console.log(`      Saved model artifact -> ${MODEL_FILE}`);
  console.log(`      Saved metadata artifact -> ${METADATA_FILE}`);

  // 5. Display Evaluation Report
  const { train, validation, test } = result.model.metadata.evaluationMetrics;
  const cv = result.model.metadata.crossValidation;
  const gen = result.model.metadata.generalizationCheck;

  console.log('\n============================================================');
  console.log('📊 MODEL EVALUATION & QUALITY GATE REPORT');
  console.log('============================================================');
  console.log(`Model Version           : ${result.model.metadata.modelVersion}`);
  console.log(`Feature Schema Version  : ${result.model.metadata.featureSchemaVersion}`);
  console.log(`Model Architecture      : ${result.model.metadata.modelType}`);
  console.log(`Dataset Total Samples   : ${result.model.metadata.totalDatasetCount} (Train: ${result.model.metadata.trainingSampleCount}, Val: ${result.model.metadata.validationSampleCount}, Test: ${result.model.metadata.testSampleCount})`);
  console.log(`Class Balance           : ${result.model.metadata.classDistribution.totalPositives} Wins / ${result.model.metadata.classDistribution.totalNegatives} Losses (Win Ratio: ${(result.model.metadata.classDistribution.winRatio * 100).toFixed(1)}%)`);
  console.log('------------------------------------------------------------');
  console.log(`Cross-Validation F1 Mean: ${cv.f1Mean} (±${cv.f1Std})`);
  console.log(`Training F1 Score       : ${train.f1Score} (Accuracy: ${(train.accuracy * 100).toFixed(1)}%, ROC-AUC: ${train.rocAuc})`);
  console.log(`Validation F1 Score     : ${validation.f1Score} (Accuracy: ${(validation.accuracy * 100).toFixed(1)}%, ROC-AUC: ${validation.rocAuc})`);
  console.log(`Test F1 Score (Unseen)  : ${test.f1Score} (Accuracy: ${(test.accuracy * 100).toFixed(1)}%, ROC-AUC: ${test.rocAuc})`);
  console.log(`Brier Calibration Score : ${test.brierScore}`);
  console.log(`Generalization Status   : ${gen.qualityGateStatus} (F1 Gap: ${gen.f1Gap})`);
  console.log('------------------------------------------------------------');
  console.log('Top Influencing Feature Weights:');
  result.model.metadata.featureImportance.slice(0, 6).forEach((feat, idx) => {
    console.log(`  ${idx + 1}. ${feat.featureName.padEnd(28)} : ${feat.weight > 0 ? '+' : ''}${feat.weight} (${feat.direction})`);
  });
  console.log('============================================================\n');

  return result.model;
};

if (require.main === module) {
  trainAndSaveModel()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal Training Error:', err);
      process.exit(1);
    });
}

module.exports = { trainAndSaveModel };
