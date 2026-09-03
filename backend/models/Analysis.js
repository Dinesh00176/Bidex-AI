const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      'Eligibility',
      'Experience',
      'Financial',
      'Technical',
      'Certification',
      'Staffing',
      'Legal',
      'Timeline',
      'Documents',
      'Contract'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  unit: {
    type: String,
    default: ''
  },
  mandatory: {
    type: Boolean,
    default: false
  },
  sourcePage: {
    type: Number,
    required: true
  },
  sourceText: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    default: 0.9,
    min: 0,
    max: 1
  }
});

const matchSchema = new mongoose.Schema({
  requirementTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  mandatory: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['MATCH', 'PARTIAL', 'MISSING', 'UNKNOWN', 'CONFLICT'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  companyEvidence: {
    type: String,
    default: 'None detected'
  },
  sourcePage: {
    type: Number,
    default: 1
  },
  confidence: {
    type: Number,
    default: 0.85
  }
});

const riskSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      'Eligibility',
      'Financial',
      'Technical',
      'Compliance',
      'Legal',
      'Timeline',
      'Documentation',
      'Contract'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  evidence: {
    type: String,
    default: ''
  },
  sourcePage: {
    type: Number,
    default: 1
  },
  recommendedAction: {
    type: String,
    default: 'Flagged for human/legal review.'
  }
});

const decisionSchema = new mongoose.Schema({
  recommendation: {
    type: String,
    enum: ['BID', 'REVIEW', 'NO-BID'],
    required: true
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  scoreBreakdown: {
    eligibility: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    financial: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    compliance: { type: Number, default: 0 },
    risk: { type: Number, default: 0 },
    timeline: { type: Number, default: 0 }
  },
  weightsUsed: {
    eligibility: { type: Number, default: 25 },
    technical: { type: Number, default: 20 },
    financial: { type: Number, default: 15 },
    experience: { type: Number, default: 15 },
    compliance: { type: Number, default: 10 },
    risk: { type: Number, default: 10 },
    timeline: { type: Number, default: 5 }
  },
  hardFailures: {
    type: [String],
    default: []
  },
  keyStrengths: {
    type: [String],
    default: []
  },
  keyConcerns: {
    type: [String],
    default: []
  },
  mlPrediction: {
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'NOT_TRAINED'],
      default: 'NOT_TRAINED'
    },
    probability: { type: Number, default: null },
    confidencePercent: { type: Number, default: null },
    predictedOutcome: { type: String, default: null },
    topInfluencingFactors: { type: [String], default: [] },
    modelVersion: { type: String, default: null },
    modelType: { type: String, default: null },
    message: { type: String, default: 'ML model not trained — using AI + rules' }
  },
  summaryRationale: {
    type: String,
    default: ''
  }
});

const analysisSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: true,
      unique: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requirements: {
      type: [requirementSchema],
      default: []
    },
    matches: {
      type: [matchSchema],
      default: []
    },
    risks: {
      type: [riskSchema],
      default: []
    },
    decision: {
      type: decisionSchema,
      required: true
    },
    mlPrediction: {
      status: {
        type: String,
        enum: ['AVAILABLE', 'UNAVAILABLE', 'NOT_TRAINED'],
        default: 'NOT_TRAINED'
      },
      probability: { type: Number, default: null },
      confidencePercent: { type: Number, default: null },
      predictedOutcome: { type: String, default: null },
      topInfluencingFactors: { type: [String], default: [] },
      modelVersion: { type: String, default: null },
      modelType: { type: String, default: null },
      message: { type: String, default: 'ML model not trained — using AI + rules' }
    },
    metadata: {
      modelUsed: { type: String, default: 'gemini-3.5-flash' },
      tokensUsed: { type: Number, default: 0 },
      analyzedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);
