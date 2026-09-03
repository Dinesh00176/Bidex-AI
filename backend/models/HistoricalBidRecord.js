const mongoose = require('mongoose');

const historicalBidRecordSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    tenderTitle: {
      type: String,
      required: true,
      trim: true
    },
    industryDomain: {
      type: String,
      default: 'Information Technology'
    },
    // Structured numerical and categorical feature snapshot
    features: {
      // Company features
      companyTurnoverCr: { type: Number, required: true },
      companyExperienceYears: { type: Number, required: true },
      companyEmployeeCount: { type: Number, required: true },
      companyCertCount: { type: Number, default: 0 },
      companyTechSkillCount: { type: Number, default: 0 },
      companyIndustryMatch: { type: Number, default: 1 },

      // Tender features
      tenderEstimatedValueCr: { type: Number, default: 0 },
      tenderPageCount: { type: Number, default: 1 },
      tenderTotalReqCount: { type: Number, default: 0 },
      tenderMandatoryReqCount: { type: Number, default: 0 },
      tenderOptionalReqCount: { type: Number, default: 0 },
      tenderTechReqCount: { type: Number, default: 0 },
      tenderFinancialReqCount: { type: Number, default: 0 },

      // Match & Compliance features
      matchPassRate: { type: Number, required: true },
      matchPartialRate: { type: Number, default: 0 },
      matchConflictCount: { type: Number, default: 0 },
      matchMissingCount: { type: Number, default: 0 },
      mandatoryFailureCount: { type: Number, default: 0 },
      technicalMatchRatio: { type: Number, default: 0 },
      certificationMatchRatio: { type: Number, default: 0 },

      // Risk features
      riskCriticalCount: { type: Number, default: 0 },
      riskHighCount: { type: Number, default: 0 },
      riskTotalDeductions: { type: Number, default: 0 }
    },
    // Historical ground-truth outcome label
    outcomeLabel: {
      type: String,
      enum: ['WIN', 'LOSS', 'DISQUALIFIED', 'NO_BID'],
      required: true
    },
    // Binary target: 1 = Successful Bid (WIN), 0 = Unsuccessful / Disqualified / Loss
    binaryTarget: {
      type: Number,
      enum: [0, 1],
      required: true
    },
    awardValue: {
      type: Number,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      enum: ['HISTORICAL_AUDIT', 'PROCUREMENT_LOG', 'MANUAL_ENTRY'],
      default: 'HISTORICAL_AUDIT'
    }
  },
  {
    timestamps: true
  }
);

historicalBidRecordSchema.index({ outcomeLabel: 1 });
historicalBidRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HistoricalBidRecord', historicalBidRecordSchema);
